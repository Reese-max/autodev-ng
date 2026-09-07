[CmdletBinding(SupportsShouldProcess = $true)]
param([Parameter(Mandatory = $true)][string]$Config, [ValidateSet('issues', 'reports')][string]$Mode = 'issues')
$ErrorActionPreference = 'Stop'
$adngRoot = Split-Path -Parent $PSScriptRoot
$adngConfig = (Resolve-Path -LiteralPath $Config).Path
$adngSettings = Get-Content -LiteralPath $adngConfig -Encoding UTF8 -Raw | ConvertFrom-Json
if ($adngSettings.enabled -ne $true) { throw 'Set enabled=true after approving the repository and execution scope.' }
$adngCli = Join-Path $adngRoot 'dist\cli.js'
if (-not (Test-Path -LiteralPath $adngCli)) { throw 'Run npm run build first.' }
$adngNode = (Get-Command node.exe -ErrorAction Stop).Source
$adngScope = if ($adngSettings.owner) { $adngSettings.owner } else { $adngSettings.repo }
$adngMode = if ($adngSettings.owner) { 'owner-run' } else { 'run' }
$adngTaskName = 'adng-github-' + ($adngScope -replace '[^A-Za-z0-9_-]', '-')
if ($Mode -eq 'reports') { $adngMode = 'report'; $adngTaskName = 'adng-github-reports-' + ($adngScope -replace '[^A-Za-z0-9_-]', '-') }
if (Get-ScheduledTask -TaskName $adngTaskName -ErrorAction SilentlyContinue) { throw "Task already exists: $adngTaskName. Inspect it before replacing." }
# Encode only local trusted paths; no shell interpolation of Issue content.
$adngScript = '& ' + "'" + $adngNode.Replace("'", "''") + "' '" + $adngCli.Replace("'", "''") + "' github " + $adngMode + " --config '" + $adngConfig.Replace("'", "''") + "'; exit `$LASTEXITCODE"
$adngEncoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($adngScript))
$adngAction = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -EncodedCommand $adngEncoded" -WorkingDirectory $adngRoot
$adngMinutes = if ($Mode -eq 'reports') { 15 } else { 5 }
$adngTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes $adngMinutes)
$adngTaskSettings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 4) -StartWhenAvailable
$adngTaskSettings.Priority = 5
$adngPrincipal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive
if ($PSCmdlet.ShouldProcess($adngTaskName, "Register $adngMinutes-minute GitHub $Mode runner")) {
  Register-ScheduledTask -TaskName $adngTaskName -Action $adngAction -Trigger $adngTrigger -Settings $adngTaskSettings -Principal $adngPrincipal | Out-Null
  Write-Output "Registered $adngTaskName. Verify the real GitHub flow and runner status; registration alone is not acceptance."
}
