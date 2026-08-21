[CmdletBinding()]
param(
    [ValidatePattern('^[A-Za-z0-9._-]+$')]
    [string]$SessionName = 'herdr-autopilot',
    [ValidateRange(2, 3600)]
    [int]$RefreshSeconds = 15,
    [switch]$Run,
    [switch]$Once
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$statusScript = Join-Path $root 'scripts\fleet-status.mjs'
$pauseFile = Join-Path $root 'configs\.adng.stop'

function Show-FleetStatus {
    if (-not $Once) { Clear-Host }
    $pause = if (Test-Path -LiteralPath $pauseFile) { 'PAUSED' } else { 'RUNNING' }
    Write-Host "AUTODEV FLEET READ-ONLY  |  $pause  |  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host '此 pane 沒有啟動、停止、恢復或派工能力。'
    & node.exe $statusScript
    if ($LASTEXITCODE -ne 0) { throw "fleet-status.mjs 失敗：exit $LASTEXITCODE" }
}

if ($Run) {
    do {
        Show-FleetStatus
        if ($Once) { return }
        Start-Sleep -Seconds $RefreshSeconds
    } while ($true)
}

function Invoke-HerdrJson {
    param([string]$Executable, [string[]]$Arguments)
    $raw = (& $Executable --session $SessionName @Arguments 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -ne 0) { throw "Herdr 指令失敗：$raw" }
    return $raw | ConvertFrom-Json
}

$herdr = Get-Command herdr.exe -ErrorAction Stop
$server = Invoke-HerdrJson -Executable $herdr.Source -Arguments @('status', 'server', '--json')
if (-not $server.running -or $server.compatible -ne $true) {
    throw "Herdr session 未執行或 protocol 不相容：$SessionName"
}
$created = Invoke-HerdrJson -Executable $herdr.Source -Arguments @(
    'workspace', 'create', '--cwd', $root, '--label', 'autodev-fleet-readonly', '--no-focus'
)
$workspaceId = [string]$created.result.workspace.workspace_id
$paneId = [string]$created.result.root_pane.pane_id
if (-not $workspaceId -or -not $paneId) { throw 'Herdr 未回傳 workspace／pane ID' }
$pwsh = (Get-Command pwsh.exe -ErrorAction Stop).Source
$command = "& `"$pwsh`" -NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Run -RefreshSeconds $RefreshSeconds"
Invoke-HerdrJson -Executable $herdr.Source -Arguments @('pane', 'run', $paneId, $command) | Out-Null
Write-Host "HERDR_FLEET_CONSOLE_OK session=$SessionName workspace=$workspaceId pane=$paneId"
