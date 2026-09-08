param([Parameter(Mandatory = $true)][string]$Config, [ValidateSet('issues', 'reports', 'repairs')][string]$Mode = 'issues')
$ErrorActionPreference = 'Stop'
$adngRoot = Split-Path -Parent $PSScriptRoot
$adngConfig = (Resolve-Path -LiteralPath $Config).Path
$adngSettings = Get-Content -LiteralPath $adngConfig -Encoding UTF8 -Raw | ConvertFrom-Json
if (-not $adngSettings.owner -and -not $adngSettings.repo) { throw 'Expected owner or repository configuration' }
$adngData = [IO.Path]::GetFullPath((Join-Path (Split-Path -Parent $adngConfig) $adngSettings.dataDir))
if ($Mode -eq 'repairs') { $adngData = Join-Path $adngData 'repairs' }
$adngNode = (Get-Command node.exe -ErrorAction Stop).Source
$adngCommand = if ($Mode -eq 'reports') { 'report' } elseif ($Mode -eq 'repairs') { 'repair-batch' } elseif ($adngSettings.repo) { 'run' } else { 'owner-run' }
$adngMutexScope = if ($Mode -eq 'reports') { 'reports-' } elseif ($Mode -eq 'repairs') { 'repairs-' } else { '' }
$adngIdentity = if ($adngSettings.repo) { $adngSettings.repo.Replace('/', '-') } else { $adngSettings.owner }
$adngMutex = New-Object Threading.Mutex($false, ('Local\adng-github-' + $adngMutexScope + $adngIdentity))
$adngAcquired = $false
try {
  try { $adngAcquired = $adngMutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $adngAcquired = $true }
  if (-not $adngAcquired) { exit 0 }
  New-Item -ItemType Directory -Path $adngData -Force | Out-Null
  Set-Location -LiteralPath $adngRoot
  while ($true) {
    $adngSettings = Get-Content -LiteralPath $adngConfig -Encoding UTF8 -Raw | ConvertFrom-Json
    if ($adngSettings.enabled -ne $true -or (Test-Path -LiteralPath (Join-Path $adngData '.adng.stop'))) { break }
    # Windows PowerShell turns native stderr into ErrorRecords; retain logs and retry after nonzero exits.
    $ErrorActionPreference = 'Continue'
    try {
      & $adngNode (Join-Path $adngRoot 'dist\cli.js') github $adngCommand --config $adngConfig *> (Join-Path $adngData 'last-run.log')
      $adngLastExit = $LASTEXITCODE
    } finally { $ErrorActionPreference = 'Stop' }
    [pscustomobject]@{ pid = $PID; mode = $Mode; checkedAt = (Get-Date).ToUniversalTime().ToString('o'); exitCode = $adngLastExit } |
      ConvertTo-Json | Set-Content -LiteralPath (Join-Path $adngData 'watcher.json') -Encoding UTF8
    $adngInterval = if ($Mode -ne 'issues') { $adngSettings.intervalMs } else { $adngSettings.retryMs }
    Start-Sleep -Milliseconds ([Math]::Max(60000, [int]$adngInterval))
  }
} finally {
  if ($adngAcquired) { $adngMutex.ReleaseMutex() }
  $adngMutex.Dispose()
}
