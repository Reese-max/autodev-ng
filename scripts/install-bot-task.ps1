<#
.SYNOPSIS
    Install (or uninstall) the \adng-bot scheduled task for the
    autodev-ng Discord bot.

.DESCRIPTION
    Mirrors install-scheduled-task.ps1 (adng-daemon) decisions:
      - Trigger: at startup, repeating every 15 minutes. The bot
        holds bot.lock (single-instance), so repeats are harmless
        and double as auto-respawn.
      - Priority forced to 5 = Normal (pitfall 9).
      - No hidden vbs launcher chain (pitfall 20).
      - ExecutionTimeLimit disabled (PT0S), bot runs 24/7.
      - Default principal: current user, Interactive logon.
        Depends on AutoAdminLogon=1 (same caveat as daemon task).

    READINESS VERIFICATION (pitfall 18): do NOT trust Task
    Scheduler state or a live PID. Verify by checking that
    data\voice-actress\bot-console.log gains an "adng bot ready"
    line after the task fires, and that /status answers in Discord.

    PowerShell 5.1 compatible. Pure ASCII. Supports -WhatIf.

.PARAMETER Uninstall
    Remove the adng-bot scheduled task instead of installing it.
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [switch]$Uninstall
)

$ErrorActionPreference = 'Stop'

$TaskName = 'adng-bot'
$RepoRoot = 'D:\Users\Administrator\Desktop\autodev-ng'
$CmdPath  = Join-Path $RepoRoot 'scripts\adng-bot.cmd'

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
    Write-Host 'NEXT - readiness check (pitfall 18): after the task fires, confirm'
    Write-Host ('  ' + (Join-Path $RepoRoot 'data\voice-actress\bot-console.log'))
    Write-Host 'gains an "adng bot ready" line, then run /status in Discord.'
}
