<#
.SYNOPSIS
    Install (or uninstall) the \adng-daemon scheduled task for autodev-ng.

.DESCRIPTION
    Registers a scheduled task named "adng-daemon" that runs
    scripts\adng-daemons.cmd via cmd /c.

    Design decisions:
      - Trigger: at system startup, repeating every 15 minutes.
        The daemon holds a lock file (single-instance guard), so
        repeated triggers are harmless and double as auto-respawn.
      - Priority is forced to 5 (Normal). Register-ScheduledTask
        defaults to 7 (BelowNormal), which causes intermittent
        timeouts under CPU load (pitfall 9). A verification section
        prints the effective Priority after registration.
      - No hidden vbs launcher chain (pitfall 20).
      - ExecutionTimeLimit is disabled (PT0S) because the daemon
        runs 24/7.
      - Default principal: current user, Interactive logon (no
        password prompt). Pass -AsSystem to run as SYSTEM instead.
      - DEPENDENCY: Interactive logon means the AtStartup trigger
        only fires once the user session exists. This machine has
        AutoAdminLogon=1 (verified 2026-07-07), so boot implies
        logon. If auto-logon is ever disabled, the task will
        silently wait for a manual logon after reboot -- either
        keep auto-logon on or reinstall with -AsSystem.

    READINESS VERIFICATION (pitfall 18):
      Do NOT trust the Task Scheduler state, exit codes, or a live
      PID. After the task has fired, verify readiness by polling:
          node dist\cli.js status --config configs\autodev-self.json
      and confirming the daemon heartbeat keeps increasing over time.

    PowerShell 5.1 compatible. Pure ASCII (no encoding pitfalls).
    Supports -WhatIf (dry run: nothing is registered/unregistered).

.PARAMETER Uninstall
    Remove the adng-daemon scheduled task instead of installing it.

.PARAMETER AsSystem
    Register the task to run as SYSTEM (ServiceAccount logon).
    Default is the current user with Interactive logon.

.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-scheduled-task.ps1

.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-scheduled-task.ps1 -Uninstall
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [switch]$Uninstall,
    [switch]$AsSystem
)

$ErrorActionPreference = 'Stop'

$TaskName = 'adng-daemon'
$RepoRoot = Split-Path -Parent $PSScriptRoot
$CmdPath  = Join-Path $RepoRoot 'scripts\adng-daemons.cmd'

if ($Uninstall) {
    $existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($null -eq $existing) {
        Write-Host "Task '$TaskName' is not registered. Nothing to do."
        return
    }
    if ($PSCmdlet.ShouldProcess($TaskName, 'Unregister scheduled task')) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Host "Task '$TaskName' unregistered."
    }
    return
}

if (-not (Test-Path $CmdPath)) {
    throw "Launcher script not found: $CmdPath"
}

# Action: run the cmd launcher via cmd /c, working directory = repo root.
$action = New-ScheduledTaskAction -Execute 'cmd.exe' `
    -Argument ('/c "' + $CmdPath + '"') `
    -WorkingDirectory $RepoRoot

# Trigger: at system startup, then repeat every 15 minutes.
# PS 5.1 cannot attach repetition to an AtStartup trigger directly,
# so borrow the Repetition block from a throwaway -Once trigger.
# (3650 days instead of [TimeSpan]::MaxValue: MaxValue serializes to
# an XML duration that some Task Scheduler builds reject.)
$trigger = New-ScheduledTaskTrigger -AtStartup
$repSource = New-ScheduledTaskTrigger -Once -At (Get-Date) `
    -RepetitionInterval (New-TimeSpan -Minutes 15) `
    -RepetitionDuration (New-TimeSpan -Days 3650)
$trigger.Repetition = $repSource.Repetition

# Settings. ExecutionTimeLimit of 0 seconds = PT0S = unlimited.
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew `
    -ExecutionTimeLimit (New-TimeSpan -Seconds 0)

# Force Normal priority (5). The module default is 7 = BelowNormal
# and causes intermittent timeouts under load (pitfall 9).
$settings.Priority = 5

if ($AsSystem) {
    $principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount
} else {
    $principal = New-ScheduledTaskPrincipal `
        -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive
}

if ($PSCmdlet.ShouldProcess($TaskName, 'Register scheduled task')) {
    Register-ScheduledTask -TaskName $TaskName `
        -Action $action -Trigger $trigger -Settings $settings -Principal $principal `
        | Out-Null

    # --- Verification section (operator must confirm Priority = 5) ----
    $task = Get-ScheduledTask -TaskName $TaskName
    $prio = $task.Settings.Priority
    Write-Host ('Registered task : \' + $TaskName)
    Write-Host ('Priority        : ' + $prio + '  (expected: 5 = Normal)')
    if ($prio -ne 5) {
        Write-Warning 'Priority is NOT 5. Do not rely on this task until fixed (pitfall 9).'
    }
    Write-Host ''
    Write-Host 'NEXT - readiness check (pitfall 18): after the task fires, poll'
    Write-Host ('  node "' + (Join-Path $RepoRoot 'dist\cli.js') + '" status --config "' + (Join-Path $RepoRoot 'configs\autodev-self.json') + '"')
    Write-Host 'and confirm the daemon heartbeat keeps increasing. Do not trust'
    Write-Host 'the Task Scheduler state or a live PID as proof of readiness.'
}
