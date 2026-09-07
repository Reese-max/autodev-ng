// memory-snapshot (2026-08-05): 艦隊「記憶」每日鏡像——run.db／BACKLOG／方向盤／制度日誌
// 全都不在 git 追蹤圈（data/ ignored），磁碟死＝艦隊失憶。本腳本每日一次把關鍵狀態
// 快照進相鄰的 adng-memory repo（ADNG_MEMORY_DIR 可覆寫）並推雲。由 adng-daemons.cmd 順跑（15 分一觸、
// 日戳自守衛）。sqlite 用 .backup 確保一致性快照；一切失敗寬容（絕不阻塞 supervise）。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { spawnPauseGated, withPauseGate } from './pause-gated-spawn.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STOP = path.join(ROOT, 'configs', '.adng.stop');
const MEM = path.resolve(process.env.ADNG_MEMORY_DIR ?? path.join(ROOT, '..', 'adng-memory'));
const STAMP = path.join(MEM, '.last-snapshot');

const mutate = action => withPauseGate(STOP, action).started;
const run = (command, args, timeoutMs) => spawnPauseGated(STOP, command, args, {
  timeoutMs, stdio: 'ignore',
});

export function installSqliteBackup(temp, dst, stopFile = STOP) {
  if (!fs.existsSync(temp) || fs.statSync(temp).size === 0) return false;
  let db;
  try {
    db = new Database(temp, { readonly: true, fileMustExist: true });
    if (db.pragma('quick_check', { simple: true }) !== 'ok') return false;
  } catch { return false; }
  finally { try { db?.close(); } catch { /* 唯讀驗證關閉失敗不覆蓋正式快照。 */ } }
  return withPauseGate(stopFile, () => fs.renameSync(temp, dst)).started;
}

async function backupSqlite(src, dst) {
  const temp = `${dst}.tmp-${process.pid}-${Date.now()}`;
  try {
    if (!mutate(() => fs.mkdirSync(path.dirname(dst), { recursive: true }))) return 'paused';
    const sqliteTemp = temp.replace(/\\/g, '/').replace(/'/g, "''");
    const result = await run('sqlite3', [src, `.backup '${sqliteTemp}'`], 60_000);
    if (!result.started) return 'paused';
    if (result.status !== 0 || !installSqliteBackup(temp, dst)) return 'failed';
    return 'ok';
  } catch { return 'failed'; }
  finally {
    if (fs.existsSync(temp)) mutate(() => fs.rmSync(temp, { force: true }));
  }
}

async function snapshot() {
  try {
    const today = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10); // 本地日
    if (fs.existsSync(STAMP) && fs.readFileSync(STAMP, 'utf8').trim() === today) return;

    if (!mutate(() => fs.mkdirSync(MEM, { recursive: true }))) return;
    if (!fs.existsSync(path.join(MEM, '.git'))) {
      const init = await run('git', ['-C', MEM, 'init', '-b', 'main']);
      if (!init.started || init.status !== 0) return;
    }

    const put = (src, rel) => {
      try {
        if (!fs.existsSync(src)) return true;
        return mutate(() => {
          const dst = path.join(MEM, rel);
          fs.mkdirSync(path.dirname(dst), { recursive: true });
          fs.copyFileSync(src, dst);
        });
      } catch { return true; /* 寬容 */ }
    };

    // 制度層
    if (!put(path.join(ROOT, 'data/patrol-log.md'), 'patrol-log.md')) return;
    if (!put(path.join(ROOT, 'data/PATROL-ALERTS.md'), 'PATROL-ALERTS.md')) return;
    if (!put(path.join(ROOT, 'data/patrol-heartbeat.json'), 'patrol-heartbeat.json')) return;

    // 各船：run.db（.backup 一致性快照）＋ BACKLOG ＋方向盤 ＋ GOAL
    for (const f of fs.readdirSync(path.join(ROOT, 'configs')).filter(x => x.endsWith('.json'))) {
      const ship = f.replace(/\.json$/, '');
      let cfg;
      try { cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'configs', f), 'utf8')); } catch { continue; }
      const dataDir = path.resolve(path.join(ROOT, 'configs'), cfg.dataDir);
      const db = path.join(dataDir, 'run.db');
      if (fs.existsSync(db)) {
        const backup = await backupSqlite(db, path.join(MEM, ship, 'run.db'));
        if (backup !== 'ok') return; // 失敗不得寫當日日戳；下一輪重試。
      }
      if (!put(path.resolve(path.join(ROOT, 'configs'), cfg.backlogFile), `${ship}/BACKLOG.md`)) return;
      for (const extra of ['USER-SIGNALS.md', 'NORTHSTAR.md', 'GOAL.md', 'learnings.md']) {
        if (!put(path.join(dataDir, extra), `${ship}/${extra}`)) return;
      }
    }

    if (!mutate(() => fs.writeFileSync(STAMP, today))) return;
    const add = await run('git', ['-C', MEM, 'add', '-A']);
    if (!add.started || add.status !== 0) return;
    try {
      const commit = await run('git', ['-C', MEM, 'commit', '-q', '-m', `snapshot ${today}`]);
      if (!commit.started) return;
    } catch { /* 無變更 */ }

    let hasRemote = false;
    try {
      const remote = await run('git', ['-C', MEM, 'remote', 'get-url', 'origin']);
      if (!remote.started) return;
      hasRemote = remote.status === 0;
    } catch { /* 無 remote */ }
    if (!hasRemote) {
      try {
        const create = await run('gh', ['repo', 'create', 'Reese-max/adng-memory', '--private', '--source', MEM, '--remote', 'origin'], 60_000);
        if (!create.started) return;
      } catch { /* 離線寬容 */ }
    }
    try {
      const push = await run('git', ['-C', MEM, 'push', '-q', '-u', 'origin', 'main'], 180_000);
      if (!push.started) return;
    } catch { /* 離線寬容 */ }
  } catch { /* 任何故障不阻塞呼叫端 */ }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) await snapshot();
