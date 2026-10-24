$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$outputDirectory = Join-Path $projectRoot '.test-output'
$chromeCandidates = @(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
)
$browser = $chromeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $browser) { throw 'Для запуска тестов требуется Google Chrome или Microsoft Edge.' }

New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
$runId = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$resultFile = Join-Path $outputDirectory ("result-$runId.html")
$errorFile = Join-Path $outputDirectory ("browser-$runId.log")
$profile = Join-Path $outputDirectory ("profile-$runId")
$testUrl = 'file:///' + (Join-Path $PSScriptRoot 'index.html').Replace('\', '/')

Start-Process -FilePath $browser -ArgumentList @(
  '--headless', '--disable-gpu', '--no-first-run', '--disable-background-networking',
  '--disable-extensions', '--allow-file-access-from-files', "--user-data-dir=$profile",
  '--dump-dom', '--virtual-time-budget=3000', $testUrl
) -WindowStyle Hidden -Wait -RedirectStandardOutput $resultFile -RedirectStandardError $errorFile

$html = Get-Content -LiteralPath $resultFile -Raw -Encoding UTF8
$match = [regex]::Match($html, '<pre id="result" data-status="([^"]+)">([\s\S]*?)</pre>')
if (-not $match.Success) { throw "Браузер не вернул результат тестов. Лог: $errorFile" }
$text = [System.Net.WebUtility]::HtmlDecode(($match.Groups[2].Value -replace '<[^>]+>', '')).Trim()
Write-Output $text
if ($match.Groups[1].Value -ne 'passed') { exit 1 }
