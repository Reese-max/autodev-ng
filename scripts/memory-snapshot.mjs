// memory-snapshot (2026-08-05): 艦隊「記憶」每日鏡像——run.db／BACKLOG／方向盤／制度日誌
// 全都不在 git 追蹤圈（data/ ignored），磁碟死＝艦隊失憶。本腳本每日一次把關鍵狀態
// 快照進獨立私有 repo D:/adng-memory 並推雲。由 adng-daemons.cmd 順跑（15 分一觸、
// 日戳自守衛）。sqlite 用 .backup 確保一致性快照；一切失敗寬容（絕不阻塞 supervise）。
import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MEM = 'D:/adng-memory';
const STAMP = path.join(MEM, '.last-snapshot');

try {
  const today = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10); // 本地日
  if (fs.existsSync(STAMP) && fs.readFileSync(STAMP, 'utf8').trim() === today) process.exit(0);

  fs.mkdirSync(MEM, { recursive: true });
  if (!fs.existsSync(path.join(MEM, '.git'))) {
    execSync(`git -C "${MEM}" init -b main`, { stdio: 'ignore' });
  }

  const put = (src, rel) => {
    try {
      if (!fs.existsSync(src)) return;
      const dst = path.join(MEM, rel);
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);
    } catch { /* 寬容 */ }
  };

  // 制度層
  put(path.join(ROOT, 'data/patrol-log.md'), 'patrol-log.md');
  put(path.join(ROOT, 'data/PATROL-ALERTS.md'), 'PATROL-ALERTS.md');
  put(path.join(ROOT, 'data/patrol-heartbeat.json'), 'patrol-heartbeat.json');

  // 各船：run.db（.backup 一致性快照）＋ BACKLOG ＋ 方向盤 ＋ GOAL
  for (const f of fs.readdirSync(path.join(ROOT, 'configs')).filter(x => x.endsWith('.json'))) {
    const ship = f.replace(/\.json$/, '');
    let cfg;
    try { cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'configs', f), 'utf8')); } catch { continue; }
    const dataDir = path.resolve(path.join(ROOT, 'configs'), cfg.dataDir);
    const db = path.join(dataDir, 'run.db');
    if (fs.existsSync(db)) {
      try {
        const dst = path.join(MEM, ship, 'run.db');
        fs.mkdirSync(path.dirname(dst), { recursive: true });
        execFileSync('sqlite3', [db, `.backup '${dst.replace(/\\/g, '/')}'`], { timeout: 60_000, stdio: 'ignore' });
      } catch { /* 寬容 */ }
    }
    put(path.resolve(path.join(ROOT, 'configs'), cfg.backlogFile), `${ship}/BACKLOG.md`);
    for (const extra of ['USER-SIGNALS.md', 'NORTHSTAR.md', 'GOAL.md', 'learnings.md']) {
      put(path.join(dataDir, extra), `${ship}/${extra}`);
    }
  }

  fs.writeFileSync(STAMP, today);
  execSync(`git -C "${MEM}" add -A`, { stdio: 'ignore' });
  try { execSync(`git -C "${MEM}" commit -q -m "snapshot ${today}"`, { stdio: 'ignore' }); } catch { /* 無變更 */ }
  try {
    execSync(`git -C "${MEM}" remote get-url origin`, { stdio: 'ignore' });
  } catch {
    try { execSync(`gh repo create Reese-max/adng-memory --private --source "${MEM}" --remote origin`, { stdio: 'ignore', timeout: 60_000 }); } catch { /* 離線寬容 */ }
  }
  try { execSync(`git -C "${MEM}" push -q -u origin main`, { stdio: 'ignore', timeout: 180_000 }); } catch { /* 離線寬容 */ }
} catch { /* 任何故障不阻塞呼叫端 */ }
