# adng patrol loop (ASCII only). Started at logon via Startup .vbs.
# Inner tick every 15 min: supervise fallback (schtasks adng-daemons intermittently exits 1
# with no log; manual runs are healthy - this is the safety net, idempotent keep/launch).
# Every 12th tick (3h): memory sweep + headless patrol.
$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$log = Join-Path $root 'data\patrol-supervise.log'
$stop = Join-Path $root 'configs\.adng.stop'
Start-Sleep -Seconds 900   # let boot storm settle
while ($true) {
  for ($i = 0; $i -lt 12; $i++) {
    if (Test-Path -LiteralPath $stop) { Start-Sleep -Seconds 900; continue }
    try {
      $out = & node (Join-Path $root 'dist\cli.js') supervise --configs-dir (Join-Path $root 'configs') --guardian off 2>&1
      $launched = ($out | Select-String 'launch ').Count
      if ($launched -gt 0) {
        "$(Get-Date -Format 'yyyy-MM-dd HH:mm') fallback supervise launched=$launched" | Out-File -Append -Encoding UTF8 $log
        ($out | Select-String 'launch ') | Out-File -Append -Encoding UTF8 $log
      }
    } catch { "$(Get-Date -Format 'yyyy-MM-dd HH:mm') supervise error: $_" | Out-File -Append -Encoding UTF8 $log }
    Start-Sleep -Seconds 900
  }
  if (Test-Path -LiteralPath $stop) { continue }
  try { & node (Join-Path $root 'scripts\pause-gated-spawn.mjs') $stop 'powershell.exe' '-NoProfile' '-NonInteractive' '-File' (Join-Path $PSScriptRoot 'memory-sweep.ps1') } catch { }
  try { & (Join-Path $PSScriptRoot 'run-patrol.ps1') } catch { }
}
