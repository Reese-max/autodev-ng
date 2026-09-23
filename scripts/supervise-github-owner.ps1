[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Config,
  [ValidateSet('issues', 'reports', 'repairs')][string]$Mode = 'issues',
  [ValidateRange(1000, 3600000)][int]$RestartDelayMs = 5000,
  [string]$WatcherPath = ''
)

$ErrorActionPreference = 'Stop'
$adngRoot = Split-Path -Parent $PSScriptRoot
$adngWatcher = if ($WatcherPath) { (Resolve-Path -LiteralPath $WatcherPath).Path } else { Join-Path $PSScriptRoot 'watch-github-owner.ps1' }
$adngConfig = (Resolve-Path -LiteralPath $Config).Path
$adngSettings = Get-Content -LiteralPath $adngConfig -Encoding UTF8 -Raw | ConvertFrom-Json
if (-not $adngSettings.owner -and -not $adngSettings.repo) { throw 'Expected owner or repository configuration' }
$adngData = if ([IO.Path]::IsPathRooted($adngSettings.dataDir)) { [IO.Path]::GetFullPath($adngSettings.dataDir) } else { [IO.Path]::GetFullPath((Join-Path (Split-Path -Parent $adngConfig) $adngSettings.dataDir)) }
if ($Mode -eq 'repairs') { $adngData = Join-Path $adngData 'repairs' }
$adngState = Join-Path $adngData 'supervisor.json'
$adngStop = Join-Path $adngData '.adng.stop'
$adngShell = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
if (-not (Test-Path -LiteralPath $adngShell)) { $adngShell = (Get-Command pwsh.exe -ErrorAction Stop).Source }
$adngRestartCount = 0
$adngLastExit = $null
$adngLastError = $null
$adngPaused = $false

function Write-SupervisorState([string]$Status, [int]$ChildPid = 0, [string]$ChildStartedAt = '', [object]$ExitCode = $null) {
  $adngPayload = [pscustomobject]@{
    supervisorPid = $PID
    childPid = $ChildPid
    childStartedAt = $ChildStartedAt
    mode = $Mode
    status = $Status
    restartCount = $adngRestartCount
    lastExitCode = $ExitCode
    lastError = $adngLastError
    checkedAt = (Get-Date).ToUniversalTime().ToString('o')
  } | ConvertTo-Json
  $adngTempState = "$adngState.$PID.tmp"
  for ($adngWriteAttempt = 0; $adngWriteAttempt -lt 3; $adngWriteAttempt++) {
    try {
      [IO.File]::WriteAllText($adngTempState, $adngPayload, [Text.UTF8Encoding]::new($false))
      Move-Item -LiteralPath $adngTempState -Destination $adngState -Force -ErrorAction Stop
      return
    } catch {
      $adngLastError = $_.Exception.Message.Substring(0, [Math]::Min(500, $_.Exception.Message.Length))
      Remove-Item -LiteralPath $adngTempState -Force -ErrorAction SilentlyContinue
      Start-Sleep -Milliseconds 50
    }
  }
}

New-Item -ItemType Directory -Path $adngData -Force | Out-Null
while ($true) {
  $adngSettings = Get-Content -LiteralPath $adngConfig -Encoding UTF8 -Raw | ConvertFrom-Json
  if ($adngSettings.enabled -ne $true -or (Test-Path -LiteralPath $adngStop)) {
    Write-SupervisorState 'paused'
    break
  }

  try {
    $adngLastError = $null
    $adngChild = $null
    $adngChild = Start-Process -FilePath $adngShell -ArgumentList @(
      '-NoLogo', '-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden',
      '-ExecutionPolicy', 'Bypass', '-File', $adngWatcher,
      '-Config', $adngConfig, '-Mode', $Mode
    ) -WorkingDirectory $adngRoot -WindowStyle Hidden -PassThru
    $adngChildStartedAt = (Get-Process -Id $adngChild.Id).StartTime.ToUniversalTime().ToString('o')
    Write-SupervisorState 'running' $adngChild.Id $adngChildStartedAt $adngLastExit
    while (-not $adngChild.HasExited) {
      $adngSettings = Get-Content -LiteralPath $adngConfig -Encoding UTF8 -Raw | ConvertFrom-Json
      if ($adngSettings.enabled -ne $true -or (Test-Path -LiteralPath $adngStop)) {
        $adngPaused = $true
        Stop-Process -Id $adngChild.Id -Force -ErrorAction SilentlyContinue
        $adngChild.WaitForExit(5000)
        Write-SupervisorState 'paused'
        break
      }
      Write-SupervisorState 'running' $adngChild.Id $adngChildStartedAt $adngLastExit
      Start-Sleep -Milliseconds 500
      $adngChild.Refresh()
    }
    if ($adngPaused) { break }
    $adngLastExit = $adngChild.ExitCode
  } catch {
    if ($null -ne $adngChild) {
      try {
        $adngChild.Refresh()
        if (-not $adngChild.HasExited) { Stop-Process -Id $adngChild.Id -Force -ErrorAction SilentlyContinue }
      } catch { }
    }
    $adngLastExit = $null
    $adngLastError = $_.Exception.Message.Substring(0, [Math]::Min(500, $_.Exception.Message.Length))
  }

  $adngRestartCount++
  Write-SupervisorState 'child-exited' 0 '' $adngLastExit
  $adngSettings = Get-Content -LiteralPath $adngConfig -Encoding UTF8 -Raw | ConvertFrom-Json
  if ($adngSettings.enabled -ne $true -or (Test-Path -LiteralPath $adngStop)) {
    Write-SupervisorState 'paused'
    break
  }
  Start-Sleep -Milliseconds $RestartDelayMs
}
