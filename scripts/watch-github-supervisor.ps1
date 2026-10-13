param([Parameter(Mandatory = $true)][string]$Config, [ValidateSet('issues', 'reports', 'repairs')][string]$Mode = 'issues')
$ErrorActionPreference = 'Stop'
$adngRoot = Split-Path -Parent $PSScriptRoot
$adngConfig = (Resolve-Path -LiteralPath $Config).Path
$adngSettings = Get-Content -LiteralPath $adngConfig -Encoding UTF8 -Raw | ConvertFrom-Json
if (-not $adngSettings.owner -and -not $adngSettings.repo) { throw 'Expected owner or repository configuration' }
$adngData = if ([IO.Path]::IsPathRooted($adngSettings.dataDir)) { [IO.Path]::GetFullPath($adngSettings.dataDir) } else { [IO.Path]::GetFullPath((Join-Path (Split-Path -Parent $adngConfig) $adngSettings.dataDir)) }
if ($Mode -eq 'repairs') { $adngData = Join-Path $adngData 'repairs' }
$adngIdentity = if ($adngSettings.repo) { $adngSettings.repo.Replace('/', '-') } else { $adngSettings.owner }
$adngWatcherScript = Join-Path $PSScriptRoot 'watch-github-owner.ps1'

# Bounded restart policy: at most this many recovery restarts before the supervisor stops.
$adngMaxRestarts = 3
# Bounded delay between restarts (ms): never retries faster than this.
$adngBoundedDelayMs = 5000

$adngSupervisorPid = $PID
$adngRestartCount = 0
$adngStatus = 'starting'
$adngLastExitCode = $null
$adngStateFile = Join-Path $adngData 'supervisor.json'

function Write-SupervisorState {
    param(
        [int]$childPid,
        [string]$status,
        [int]$restartCount,
        [int]$lastExitCode
    )
    # Bounded supervisor state only: no prompts, Issue bodies, provider output, or secrets.
    $state = [pscustomobject]@{
        supervisorPid = $adngSupervisorPid
        childPid = $childPid
        status = $status
        restartCount = $restartCount
        lastExitCode = $lastExitCode
        timestamp = (Get-Date).ToUniversalTime().ToString('o')
    }
    $state | ConvertTo-Json | Set-Content -LiteralPath $adngStateFile -Encoding UTF8
}

function Test-ShouldRun {
    param()
    try {
        $currentSettings = Get-Content -LiteralPath $adngConfig -Encoding UTF8 -Raw | ConvertFrom-Json
        # enabled=false disables the supervisor: do not start or restart a child.
        if ($currentSettings.enabled -ne $true) { return $false }
        # .adng.stop disables the supervisor: do not start or restart a child.
        if (Test-Path -LiteralPath (Join-Path $adngData '.adng.stop')) { return $false }
    } catch {
        return $false
    }
    return $true
}

function Test-MaxRestartsReached {
    return $adngRestartCount -ge $adngMaxRestarts
}

# Preserve the watcher's ownership/mutex contract: the child still acquires the
# Local\adng-github-<scope><identity> mutex inside watch-github-owner.ps1; the supervisor
# only wraps it, never bypasses it. All team.db, worktree, execution-receipt, PR, merge,
# and publish boundaries remain under the watcher (dist/cli.js).
$adngMutexScope = if ($Mode -eq 'reports') { 'reports-' } elseif ($Mode -eq 'repairs') { 'repairs-' } else { '' }
$adngMutex = New-Object Threading.Mutex($false, ('Local\adng-github-' + $adngMutexScope + $adngIdentity))
$adngAcquired = $false
try {
    try { $adngAcquired = $adngMutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $adngAcquired = $true }
    if (-not $adngAcquired) { exit 0 }

    New-Item -ItemType Directory -Path $adngData -Force | Out-Null
    Set-Location -LiteralPath $adngRoot

    # Use the real Windows PowerShell executable, not a PATH shim that can orphan the child.
    $adngPwsh = if ($PSVersionTable.Platform -eq 'Win32NT') {
        if ($env:PSHOME) { Join-Path $env:PSHOME 'powershell.exe' } else { 'powershell.exe' }
    } else {
        (Get-Command pwsh -ErrorAction Stop).Source
    }

    while ($true) {
        # Honor enabled=false and .adng.stop before every start/restart: zero children.
        if (-not (Test-ShouldRun)) {
            Write-SupervisorState -childPid $null -status 'paused' -restartCount $adngRestartCount -lastExitCode $adngLastExitCode
            exit 0
        }

        # Bounded restart cap: stop instead of restarting forever.
        if (Test-MaxRestartsReached) {
            Write-SupervisorState -childPid $null -status 'stopped-max-restarts' -restartCount $adngRestartCount -lastExitCode $adngLastExitCode
            exit 1
        }

        # Start at most one watcher child for the supplied config and mode; the child is not an
        # orphan: Start-Process -PassThru tracks it under this supervisor until WaitForExit.
        $adngArgs = @('-NoProfile', '-NoLogo', '-ExecutionPolicy', 'Bypass', '-File', $adngWatcherScript, '-Config', $adngConfig, '-Mode', $Mode)
        $adngProcess = Start-Process -FilePath $adngPwsh -ArgumentList $adngArgs -PassThru -WorkingDirectory $adngRoot
        Write-SupervisorState -childPid $adngProcess.Id -status 'running' -restartCount $adngRestartCount -lastExitCode $adngLastExitCode

        $adngProcess.WaitForExit()
        $adngLastExitCode = $adngProcess.ExitCode

        # Honor enabled=false and .adng.stop after recovery: no further restarts, leave no child.
        if (-not (Test-ShouldRun)) {
            Write-SupervisorState -childPid $null -status 'stopped' -restartCount $adngRestartCount -lastExitCode $adngLastExitCode
            exit 0
        }

        # Bounded restart: increment count and wait the bounded delay before restarting.
        $adngRestartCount++
        Write-SupervisorState -childPid $null -status 'restarting' -restartCount $adngRestartCount -lastExitCode $adngLastExitCode
        Start-Sleep -Milliseconds $adngBoundedDelayMs
    }
} finally {
    if ($adngAcquired) { $adngMutex.ReleaseMutex() }
    $adngMutex.Dispose()
}
