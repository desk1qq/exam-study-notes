$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$outputDirectory = Join-Path $projectRoot '.test-output'
$chromeCandidates = @(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
)
$browsers = @($chromeCandidates | Where-Object { Test-Path -LiteralPath $_ })
if (-not $browsers.Count) { throw 'Для запуска тестов требуется Google Chrome или Microsoft Edge.' }

New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
$testUrl = 'file:///' + (Join-Path $PSScriptRoot 'index.html').Replace('\', '/')
$match = $null
$attemptLogs = @()
foreach ($browser in $browsers) {
  $runId = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  $resultFile = Join-Path $outputDirectory ("result-$runId.html")
  $errorFile = Join-Path $outputDirectory ("browser-$runId.log")
  $profile = Join-Path $outputDirectory ("profile-$runId")
  $attemptLogs += $errorFile
  Start-Process -FilePath $browser -ArgumentList @(
    '--headless', '--disable-gpu', '--no-first-run', '--disable-background-networking',
    '--disable-extensions', '--allow-file-access-from-files', "--user-data-dir=$profile",
    '--dump-dom', '--virtual-time-budget=3000', $testUrl
  ) -WindowStyle Hidden -Wait -RedirectStandardOutput $resultFile -RedirectStandardError $errorFile
  $html = Get-Content -LiteralPath $resultFile -Raw -Encoding UTF8
  if (-not [string]::IsNullOrWhiteSpace($html)) {
    $match = [regex]::Match($html, '<pre id="result" data-status="([^"]+)">([\s\S]*?)</pre>')
    if ($match.Success) { break }
  }
}
if (-not $match -or -not $match.Success) { throw "Браузеры не вернули результат тестов. Логи: $($attemptLogs -join ', ')" }
$text = [System.Net.WebUtility]::HtmlDecode(($match.Groups[2].Value -replace '<[^>]+>', '')).Trim()
Write-Output $text
if ($match.Groups[1].Value -ne 'passed') { exit 1 }
