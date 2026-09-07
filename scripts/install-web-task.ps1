<#
.SYNOPSIS
    Install (or uninstall) the \adng-web scheduled task for the
    autodev-ng web console.

.DESCRIPTION
    Mirrors install-bot-task.ps1 decisions:
      - Trigger: at startup, repeating every 15 minutes.
      - Priority forced to 5 = Normal (pitfall 9).
      - No hidden vbs launcher chain (pitfall 20).
      - ExecutionTimeLimit disabled (PT0S), web console runs 24/7.
      - Default principal: current user, Interactive logon.
        Depends on AutoAdminLogon=1 (same caveat as bot/daemon task).

    NO OWN LOCK (differs from bot/daemon): the web server does not
    hold a lock file. Under the 15-minute Repetition trigger, if an
    instance from a previous fire is still alive, the new instance
    fails to bind port 3900 (EADDRINUSE) and exits immediately. This
    is effectively single-instance in practice -- same net effect as
    bot.lock, just enforced by the OS socket instead of a lock file.

    READINESS VERIFICATION (pitfall 18): do NOT trust Task
    Scheduler state or a live PID. Verify by checking that
    data\web-console.log gains a line containing
    "autodev-ng" (control panel started) after the task fires, and
    that GET http://127.0.0.1:3900/api/status answers.

    PowerShell 5.1 compatible. Pure ASCII. Supports -WhatIf.

.PARAMETER Uninstall
    Remove the adng-web scheduled task instead of installing it.
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [switch]$Uninstall
)

$ErrorActionPreference = 'Stop'

$TaskName = 'adng-web'
$RepoRoot = Split-Path -Parent $PSScriptRoot
$CmdPath  = Join-Path $RepoRoot 'scripts\adng-web.cmd'

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

$action = New-ScheduledTaskAction -Execute 'cmd.exe' `
    -Argument ('/c "' + $CmdPath + '"') `
    -WorkingDirectory $RepoRoot

$trigger = New-ScheduledTaskTrigger -AtStartup
$repSource = New-ScheduledTaskTrigger -Once -At (Get-Date) `
    -RepetitionInterval (New-TimeSpan -Minutes 15) `
    -RepetitionDuration (New-TimeSpan -Days 3650)
$trigger.Repetition = $repSource.Repetition

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew `
    -ExecutionTimeLimit (New-TimeSpan -Seconds 0)
$settings.Priority = 5

$principal = New-ScheduledTaskPrincipal `
    -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive

if ($PSCmdlet.ShouldProcess($TaskName, 'Register scheduled task')) {
    Register-ScheduledTask -TaskName $TaskName `
        -Action $action -Trigger $trigger -Settings $settings -Principal $principal `
        | Out-Null

    $task = Get-ScheduledTask -TaskName $TaskName
    $prio = $task.Settings.Priority
    Write-Host ('Registered task : \' + $TaskName)
    Write-Host ('Priority        : ' + $prio + '  (expected: 5 = Normal)')
    if ($prio -ne 5) {
        Write-Warning 'Priority is NOT 5. Do not rely on this task until fixed (pitfall 9).'
    }
    Write-Host ''
    Write-Host 'NOTE: web console has no own lock file. Under the 15-minute'
    Write-Host 'Repetition trigger, a second instance while the first is still'
    Write-Host 'alive fails to bind port 3900 (EADDRINUSE) and exits -- this is'
    Write-Host 'the de-facto single-instance guard for this task.'
    Write-Host ''
    Write-Host 'NEXT - readiness check (pitfall 18): after the task fires, confirm'
    Write-Host ('  ' + (Join-Path $RepoRoot 'data\web-console.log'))
    Write-Host 'gains an "autodev-ng" control-panel-started line, then confirm'
    Write-Host 'GET http://127.0.0.1:3900/api/status answers.'
}
