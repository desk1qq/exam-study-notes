$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$requiredFiles = @(
  'keep.html', 'keep.css', 'keep.js', 'notes.js', 'note-tools.js', 'note-tools.css',
  'script.js', 'storage.js', 'validation.js', 'tests/index.html', 'tests/run-tests.ps1'
)

foreach ($file in $requiredFiles) {
  if (-not (Test-Path -LiteralPath (Join-Path $projectRoot $file) -PathType Leaf)) {
    throw "Отсутствует обязательный файл: $file"
  }
}
Write-Output "PASS обязательные файлы присутствуют ($($requiredFiles.Count))"

$trackedFiles = @(& git -C $projectRoot ls-files)
if ($LASTEXITCODE -ne 0) { throw 'Не удалось получить список файлов Git.' }
$markers = @()
foreach ($relativePath in $trackedFiles) {
  $path = Join-Path $projectRoot $relativePath
  if (Test-Path -LiteralPath $path -PathType Leaf) {
    $matches = @(Select-String -LiteralPath $path -Pattern '^(<<<<<<<|=======|>>>>>>>)' -Encoding UTF8)
    $markers += $matches
  }
}
if ($markers.Count) {
  $markers | ForEach-Object { Write-Output ("FAIL маркер конфликта: {0}:{1}" -f $_.Path, $_.LineNumber) }
  throw 'В проекте остались маркеры merge conflict.'
}
Write-Output 'PASS маркеры merge conflict отсутствуют'

& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $projectRoot 'tests/run-tests.ps1')
if ($LASTEXITCODE -ne 0) { throw 'Автоматические тесты завершились с ошибкой.' }
Write-Output 'PASS единая проверка проекта завершена'
