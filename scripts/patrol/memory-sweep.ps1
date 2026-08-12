# adng memory sweep (ASCII only). Kills ORPHANS only (parent dead + cmdline whitelist).
# Never touches: chrome, claude sessions, wsl, hidden-cmdline processes (no double-key = no kill).
$ErrorActionPreference = 'Continue'
$root = 'D:\Users\Administrator\Desktop\autodev-ng'
$stop = Join-Path $root 'configs\.adng.stop'

function Invoke-PauseGated {
  param([scriptblock]$Action)
  $gate = "${stop}.lockdir"
  $held = $false
  try {
    try {
      New-Item -ItemType Directory -Path $gate -ErrorAction Stop | Out-Null
      $held = $true
    } catch {
      try {
        if (((Get-Date).ToUniversalTime() - (Get-Item -LiteralPath $gate -ErrorAction Stop).LastWriteTimeUtc).TotalSeconds -le 60) { return $false }
        $reap = "$gate.reap-$PID-$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
        Move-Item -LiteralPath $gate -Destination $reap -ErrorAction Stop
        Remove-Item -LiteralPath $reap -Force -ErrorAction Stop
        New-Item -ItemType Directory -Path $gate -ErrorAction Stop | Out-Null
        $held = $true
      } catch { return $false }
    }
    if (Test-Path -LiteralPath $stop) { return $false }
    & $Action
    return $true
  } finally {
    # ponytail: 只包毫秒級 kill/log；若加入長工作，改由 pause-gated-spawn 啟動。
    if ($held) { Remove-Item -LiteralPath $gate -Force -ErrorAction SilentlyContinue }
  }
}

$log = Join-Path $root 'data\memory-sweep.log'
$now = Get-Date -Format 'yyyy-MM-dd HH:mm'
$all = Get-CimInstance Win32_Process
$alivePids = @{}
foreach ($p in $all) { $alivePids[$p.ProcessId] = $true }
$killed = 0
foreach ($p in $all) {
  if (-not $p.CommandLine) { continue }                     # no cmdline = no double-key = skip
  if ($alivePids.ContainsKey($p.ParentProcessId)) { continue }  # parent alive = not orphan
  $isTarget = ($p.Name -eq 'python.exe' -and $p.CommandLine -match 'serena|uv\cache') -or
              ($p.Name -eq 'node.exe' -and $p.CommandLine -match 'mcp|claude-mem|playwright') -or
              ($p.Name -eq 'conhost.exe')
  if (-not $isTarget) { continue }
  $ageMin = ((Get-Date) - $p.CreationDate).TotalMinutes
  if ($ageMin -lt 10) { continue }                          # grace: recent spawns may reparent
  try {
    $didKill = Invoke-PauseGated {
      Stop-Process -Id $p.ProcessId -Force -ErrorAction Stop
      "$now KILLED orphan $($p.Name) pid=$($p.ProcessId) age=$([int]$ageMin)m cmd=$($p.CommandLine.Substring(0,[Math]::Min(70,$p.CommandLine.Length)))" | Out-File -Append -Encoding UTF8 $log
    }
    if ($didKill) { $killed++ }
  } catch { }
}
$os = Get-CimInstance Win32_OperatingSystem
$freePct = [int]($os.FreePhysicalMemory / $os.TotalVisibleMemorySize * 100)
Invoke-PauseGated {
  "$now sweep done: killed=$killed freeRAM=$freePct%" | Out-File -Append -Encoding UTF8 $log
} | Out-Null
if ($freePct -lt 25) {
  $top = ($all | Sort-Object WorkingSetSize -Descending | Select-Object -First 8 | ForEach-Object { "$($_.Name):$([int]($_.WorkingSetSize/1MB))MB" }) -join ', '
  Invoke-PauseGated {
    "## $now MEMORY ALERT" | Out-File -Append -Encoding UTF8 (Join-Path $root 'data\PATROL-ALERTS.md')
    "free=$freePct% top: $top" | Out-File -Append -Encoding UTF8 (Join-Path $root 'data\PATROL-ALERTS.md')
  } | Out-Null
}
