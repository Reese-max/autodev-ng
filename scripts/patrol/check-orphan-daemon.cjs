// 巡檢合約 daemon-lock-valid：各艦 daemon.lock/pid.json 的 PID 存活、身分為 node、
// 起始時間與 startedAt 吻合（±120s，防 PID 重用偽陽性）。
// 原「孤兒偵測」語義已放棄：daemon 進程屬另一權限 session，Win32_Process.CommandLine
// 跨界不可讀（2026-08-05 實測全空白），外部匹配永遠 0 命中＝空洞綠。
// 孤兒真正防線在 daemon 端 src/engines/daemon-fence.ts（每輪所有權自檢，被取代即自殺）。
const fs = require('fs');
const { execFileSync } = require('child_process');

const ROOT = 'D:/Users/Administrator/Desktop/autodev-ng';
const ships = fs.readdirSync(`${ROOT}/configs`).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));

const bad = [];
for (const s of ships) {
  let lock;
  try {
    lock = JSON.parse(fs.readFileSync(`${ROOT}/data/${s}/daemon.lock/pid.json`, 'utf8'));
  } catch {
    bad.push(`${s}:no-lock`);
    continue;
  }
  let out;
  try {
    out = execFileSync('powershell', ['-NoProfile', '-Command',
      `(Get-Process -Id ${lock.pid} -ErrorAction Stop | Select-Object ProcessName,@{n='T';e={$_.StartTime.ToUniversalTime().ToString('o')}} | ConvertTo-Json)`,
    ], { encoding: 'utf8' });
  } catch {
    bad.push(`${s}:pid-${lock.pid}-dead`);
    continue;
  }
  const p = JSON.parse(out);
  if (p.ProcessName !== 'node') {
    bad.push(`${s}:pid-${lock.pid}-not-node(${p.ProcessName})`);
    continue;
  }
  const drift = Math.abs(new Date(p.T) - new Date(lock.startedAt)) / 1000;
  if (drift > 120) bad.push(`${s}:pid-${lock.pid}-starttime-drift-${Math.round(drift)}s`);
}

if (bad.length) {
  console.log('FAIL ' + bad.join(' '));
  process.exit(1);
}
console.log(`OK (${ships.length} ships lock-valid)`);
