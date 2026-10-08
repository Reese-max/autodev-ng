[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Config,
  [ValidateSet('issues', 'reports', 'repairs')][string]$Mode = 'issues',
  [ValidateRange(1000, 3600000)][int]$RestartDelayMs = 5000,
  [string]$WatcherPath = ''
)

$ErrorActionPreference = 'Stop'
$adngRoot = Split-Path -Parent $PSScriptRoot
$adngConfig = (Resolve-Path -LiteralPath $Config).Path
$adngWatcher = if ($WatcherPath) { (Resolve-Path -LiteralPath $WatcherPath).Path } else { Join-Path $PSScriptRoot 'watch-github-owner.ps1' }
if (-not (Test-Path -LiteralPath $adngWatcher -PathType Leaf)) { throw 'Watcher script is missing' }

# Never resolve these through PATH: a shim can exit while leaving the actual watcher behind.
$adngSystem = [Environment]::SystemDirectory
$adngShell = Join-Path $adngSystem 'WindowsPowerShell\v1.0\powershell.exe'
$adngTaskkill = Join-Path $adngSystem 'taskkill.exe'
if (-not (Test-Path -LiteralPath $adngShell -PathType Leaf) -or -not (Test-Path -LiteralPath $adngTaskkill -PathType Leaf)) {
  throw 'Windows PowerShell and taskkill are required for watcher supervision'
}

function Read-Settings {
  Get-Content -LiteralPath $adngConfig -Encoding UTF8 -Raw | ConvertFrom-Json
}
function Resolve-DataDir($Settings) {
  if (-not ($Settings.owner -or $Settings.repo) -or [string]::IsNullOrWhiteSpace($Settings.dataDir)) {
    throw 'Expected owner or repository and dataDir configuration'
  }
  $adngDir = if ([IO.Path]::IsPathRooted($Settings.dataDir)) { $Settings.dataDir } else {
    Join-Path (Split-Path -Parent $adngConfig) $Settings.dataDir
  }
  $adngDir = [IO.Path]::GetFullPath($adngDir)
  if ($Mode -eq 'repairs') { $adngDir = Join-Path $adngDir 'repairs' }
  return $adngDir
}

$adngSettings = Read-Settings
$adngData = Resolve-DataDir $adngSettings
$adngState = Join-Path $adngData 'supervisor.json'

function Test-Paused {
  $adngCurrent = Read-Settings
  if ($adngCurrent.enabled -isnot [bool] -or -not $adngCurrent.enabled) { return $true }
  # A changed data directory needs a new supervisor identity; never split ownership silently.
  if ((Resolve-DataDir $adngCurrent) -ne $adngData) { return $true }
  if (Test-Path -LiteralPath (Join-Path $adngData '.adng.stop')) { return $true }
  if ($adngCurrent.stopFile) {
    $adngConfiguredStop = if ([IO.Path]::IsPathRooted($adngCurrent.stopFile)) { $adngCurrent.stopFile } else {
      Join-Path (Split-Path -Parent $adngConfig) $adngCurrent.stopFile
    }
    if (Test-Path -LiteralPath $adngConfiguredStop) { return $true }
  }
  return $false
}

$adngHash = [Security.Cryptography.SHA256]::Create()
try {
  $adngKey = [Text.Encoding]::UTF8.GetBytes(($adngConfig.ToUpperInvariant() + '|' + $Mode.ToUpperInvariant()))
  $adngId = [BitConverter]::ToString($adngHash.ComputeHash($adngKey)).Replace('-', '')
} finally { $adngHash.Dispose() }
$adngMutex = New-Object Threading.Mutex($false, ('Local\adng-github-supervisor-' + $adngId))
$adngAcquired = $false
$script:adngChild = $null
$script:adngChildStartedAt = ''
$script:adngRestartCount = 0
$script:adngLastExit = $null

function Write-SupervisorState([string]$Status, [int]$ChildPid = 0) {
  $adngPayload = [ordered]@{
    supervisorPid = $PID
    childPid = $ChildPid
    status = $Status
    restartCount = $script:adngRestartCount
    lastExitCode = $script:adngLastExit
    timestamp = (Get-Date).ToUniversalTime().ToString('o')
  } | ConvertTo-Json -Compress
  $adngTemp = "$adngState.$PID.tmp"
  for ($adngAttempt = 0; $adngAttempt -lt 3; $adngAttempt++) {
    try {
      [IO.File]::WriteAllText($adngTemp, $adngPayload, [Text.UTF8Encoding]::new($false))
      Move-Item -LiteralPath $adngTemp -Destination $adngState -Force -ErrorAction Stop
      return
    } catch {
      Remove-Item -LiteralPath $adngTemp -Force -ErrorAction SilentlyContinue
      if ($adngAttempt -eq 2) { throw 'Unable to persist supervisor state' }
      Start-Sleep -Milliseconds 50
    }
  }
}

function Stop-OwnedChild {
  if ($null -eq $script:adngChild) { return }
  $script:adngChild.Refresh()
  if ($script:adngChild.HasExited) { return }
  $adngObserved = Get-Process -Id $script:adngChild.Id -ErrorAction SilentlyContinue
  if ($null -eq $adngObserved) { return }
  if ($adngObserved.StartTime.ToUniversalTime().ToString('o') -ne $script:adngChildStartedAt) {
    throw 'Watcher PID no longer belongs to this supervisor'
  }
  $adngKill = New-Object Diagnostics.ProcessStartInfo
  $adngKill.FileName = $adngTaskkill
  $adngKill.Arguments = "/PID $($script:adngChild.Id) /T /F"
  $adngKill.UseShellExecute = $false
  $adngKill.CreateNoWindow = $true
  $adngKiller = [Diagnostics.Process]::Start($adngKill)
  try { $adngKiller.WaitForExit(5000) | Out-Null } finally { $adngKiller.Dispose() }
  $script:adngChild.Refresh()
  if (-not $script:adngChild.HasExited) { throw 'Owned watcher did not stop' }
}

try {
  try { $adngAcquired = $adngMutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $adngAcquired = $true }
  if (-not $adngAcquired) { return }
  New-Item -ItemType Directory -Path $adngData -Force | Out-Null
  $adngFirst = $true
  while ($true) {
    if (Test-Paused) { Write-SupervisorState 'paused'; break }
    if (-not $adngFirst) {
      Start-Sleep -Milliseconds $RestartDelayMs
      if (Test-Paused) { Write-SupervisorState 'paused'; break }
      $script:adngRestartCount++
    }
    $adngFirst = $false
    Write-SupervisorState 'starting'
    # EncodedCommand keeps paths with spaces/quotes as one argument without a shell shim.
    $adngLaunch = "& '$($adngWatcher.Replace("'", "''"))' -Config '$($adngConfig.Replace("'", "''"))' -Mode '$Mode'"
    $adngEncoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($adngLaunch))
    $script:adngChild = Start-Process -FilePath $adngShell -ArgumentList @(
      '-NoLogo', '-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden',
      '-ExecutionPolicy', 'Bypass', '-EncodedCommand', $adngEncoded
    ) -WorkingDirectory $adngRoot -WindowStyle Hidden -PassThru
    $script:adngChildStartedAt = $script:adngChild.StartTime.ToUniversalTime().ToString('o')
    Write-SupervisorState 'running' $script:adngChild.Id
    $adngPaused = $false
    while ($true) {
      if (Test-Paused) { $adngPaused = $true; Stop-OwnedChild; break }
      $script:adngChild.Refresh()
      if ($script:adngChild.HasExited) { break }
      Start-Sleep -Milliseconds 500
    }
    if ($adngPaused) { Write-SupervisorState 'paused'; break }
    $script:adngLastExit = $script:adngChild.ExitCode
    Write-SupervisorState 'child-exited'
    $script:adngChild.Dispose()
    $script:adngChild = $null
  }
} finally {
  try {
    if ($adngAcquired) { Stop-OwnedChild }
  } finally {
    if ($null -ne $script:adngChild) { $script:adngChild.Dispose() }
    if ($adngAcquired) { $adngMutex.ReleaseMutex() }
    $adngMutex.Dispose()
  }
}
