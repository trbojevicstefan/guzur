$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$pidFile = Join-Path $repoRoot '.pids.json'

$processes = @()

function Start-ServiceProcess {
  param (
    [string]$Name,
    [string]$WorkDir,
    [string]$Command
  )

  $proc = Start-Process -FilePath 'powershell' `
    -WorkingDirectory $WorkDir `
    -ArgumentList @('-NoProfile', '-Command', $Command) `
    -PassThru

  $processes += [pscustomobject]@{
    name = $Name
    pid = $proc.Id
  }
}

Start-ServiceProcess -Name 'backend' -WorkDir (Join-Path $repoRoot 'backend') -Command 'npm run dev'
Start-ServiceProcess -Name 'frontend' -WorkDir (Join-Path $repoRoot 'frontend') -Command 'npm run dev'
Start-ServiceProcess -Name 'admin' -WorkDir (Join-Path $repoRoot 'admin') -Command 'npm run dev'
Start-ServiceProcess -Name 'maildev' -WorkDir $repoRoot -Command 'npx maildev -s 1025 -w 1080'

$processes | ConvertTo-Json | Set-Content $pidFile

Write-Host "Started: backend, frontend, admin, maildev"
Write-Host "PID file: $pidFile"
