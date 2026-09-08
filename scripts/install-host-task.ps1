# Single-host worker/bot/health tasks; no dependency on OpenAB or automatic desktop logon.
[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [Parameter(Mandatory = $true)][string]$HostHome,
  [ValidateSet('worker','bot','health')][string]$Role = 'worker',
  [PSCredential]$Credential
)
$ErrorActionPreference = 'Stop'
$hostDir = (Resolve-Path -LiteralPath $HostHome).Path
$profile = Get-Content -LiteralPath (Join-Path $hostDir 'host.json') -Raw | ConvertFrom-Json
if ($profile.version -ne 1 -or $profile.hostId -notmatch '^[A-Za-z0-9_-]{1,80}$') { throw 'Invalid host profile' }
$node = (Get-Command node.exe -ErrorAction Stop).Source
$runner = Join-Path $PSScriptRoot 'host.mjs'
$taskName = 'adng-host-' + $profile.hostId + '-' + $Role
if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) { throw 'Task already exists; inspect and export it before replacing' }
# Encode trusted path arguments; never interpolate them into cmd.exe or expose a password in process args.
$quote = { param($s) "'" + $s.Replace("'", "''") + "'" }
$invoke = '& ' + (& $quote $node) + ' ' + (& $quote $runner)
if ($Role -eq 'health') { $invoke += ' health --home ' + (& $quote $hostDir) + ' --out ' + (& $quote (Join-Path $hostDir 'data\host-health.json')) }
else { $invoke += ' run --home ' + (& $quote $hostDir) + ' --role ' + $Role }
$invoke += '; exit $LASTEXITCODE'
$encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($invoke))
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -EncodedCommand $encoded" -WorkingDirectory $hostDir
$startup = New-ScheduledTaskTrigger -AtStartup
$repeat = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 1)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Seconds 0) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$settings.Priority = 5
if ($PSCmdlet.ShouldProcess($taskName, 'Register startup/repeating task using a dedicated account with password logon')) {
  if (-not $Credential) { $Credential = Get-Credential -Message 'Account already provisioned with GitHub and worker CLI credentials' }
  if (-not $Credential) { throw 'Credential required for unattended startup' }
  $plain = $Credential.GetNetworkCredential().Password
  try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger @($startup,$repeat) -Settings $settings -User $Credential.UserName -Password $plain | Out-Null
  } finally { $plain = $null }
  $task = Get-ScheduledTask -TaskName $taskName
  if ($task.Principal.LogonType.ToString() -ne 'Password') { throw 'Unexpected task logon type; unattended startup not verified' }
  [pscustomobject]@{task=$taskName;logonType=$task.Principal.LogonType.ToString();rebootVerified=$false;workerVerified=$false} | ConvertTo-Json
}
