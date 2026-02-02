$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$pidFile = Join-Path $repoRoot '.pids.json'

if (-not (Test-Path $pidFile)) {
  Write-Host "No PID file found at $pidFile"
  exit 0
}

$entries = Get-Content $pidFile | ConvertFrom-Json
foreach ($entry in @($entries)) {
  if (-not $entry) { continue }
  try {
    Stop-Process -Id $entry.pid -Force -ErrorAction Stop
    Write-Host "Stopped $($entry.name) ($($entry.pid))"
  } catch {
    Write-Host "Process not running: $($entry.name) ($($entry.pid))"
  }
}

Remove-Item $pidFile -ErrorAction SilentlyContinue
Write-Host 'Stopped all services.'
