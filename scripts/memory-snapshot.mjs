// memory-snapshot (2026-08-05): 艦隊「記憶」每日鏡像——run.db／BACKLOG／方向盤／制度日誌
// 全都不在 git 追蹤圈（data/ ignored），磁碟死＝艦隊失憶。本腳本每日一次把關鍵狀態
// 快照進相鄰的 adng-memory repo（ADNG_MEMORY_DIR 可覆寫）並推雲。由 adng-daemons.cmd 順跑（15 分一觸、
// 日戳只在遠端推送成功後寫入；失敗回非零，保留下一輪重試機會。
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

export async function publishSnapshot(mem, stop, execute, today) {
  const checked = async (command, args, timeoutMs) => {
    const r = await execute(command, args, timeoutMs)
    if (!r.started || r.status !== 0) throw new Error('Snapshot command failed or paused')
    return r
  }
  // Existing origin is an explicit deployment prerequisite; never create a repository implicitly.
  await checked('git', ['-C', mem, 'remote', 'get-url', 'origin'])
  await checked('git', ['-C', mem, 'add', '-A'])
  const diff = await execute('git', ['-C', mem, 'diff', '--cached', '--quiet'])
  if (!diff.started || ![0, 1].includes(diff.status)) throw new Error('Snapshot diff failed')
  if (diff.status === 1) await checked('git', ['-C', mem, 'commit', '-q', '-m', `snapshot ${today}`])
  await checked('git', ['-C', mem, 'push', '-q', '-u', 'origin', 'main'], 180_000)
  if (!withPauseGate(stop, () => fs.writeFileSync(path.join(mem, '.last-snapshot'), today)).started) throw new Error('Paused before snapshot receipt')
}

async function snapshot() {
  try {
    const today = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10); // 本地日
    if (fs.existsSync(STAMP) && fs.readFileSync(STAMP, 'utf8').trim() === today) return;

    if (!mutate(() => fs.mkdirSync(MEM, { recursive: true }))) return;
    if (!fs.existsSync(path.join(MEM, '.git'))) {
      const init = await run('git', ['-C', MEM, 'init', '-b', 'main']);
      if (!init.started || init.status !== 0) throw new Error('Snapshot init failed');
    }

    const put = (src, rel) => {
      try {
        if (!fs.existsSync(src)) return true;
        return mutate(() => {
          const dst = path.join(MEM, rel);
          fs.mkdirSync(path.dirname(dst), { recursive: true });
          fs.copyFileSync(src, dst);
        });
      } catch { throw new Error('Snapshot file copy failed'); }
    };

    // 制度層
    if (!put(path.join(ROOT, 'data/patrol-log.md'), 'patrol-log.md')) return;
    if (!put(path.join(ROOT, 'data/PATROL-ALERTS.md'), 'PATROL-ALERTS.md')) return;
    if (!put(path.join(ROOT, 'data/patrol-heartbeat.json'), 'patrol-heartbeat.json')) return;

    // 各船：run.db（.backup 一致性快照）＋ BACKLOG ＋方向盤 ＋ GOAL
    for (const f of fs.readdirSync(path.join(ROOT, 'configs')).filter(x => x.endsWith('.json'))) {
      const ship = f.replace(/\.json$/, '');
      let cfg;
      cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'configs', f), 'utf8'));
      const dataDir = path.resolve(path.join(ROOT, 'configs'), cfg.dataDir);
      const db = path.join(dataDir, 'run.db');
      if (fs.existsSync(db)) {
        const backup = await backupSqlite(db, path.join(MEM, ship, 'run.db'));
        if (backup !== 'ok') throw new Error('SQLite snapshot failed or paused');
      }
      if (!put(path.resolve(path.join(ROOT, 'configs'), cfg.backlogFile), `${ship}/BACKLOG.md`)) return;
      for (const extra of ['USER-SIGNALS.md', 'NORTHSTAR.md', 'GOAL.md', 'learnings.md']) {
        if (!put(path.join(dataDir, extra), `${ship}/${extra}`)) return;
      }
    }

    await publishSnapshot(MEM, STOP, run, today);
  } catch { console.error('MEMORY_SNAPSHOT_FAIL: verify source files, sqlite3 and existing backup remote'); process.exitCode = 1; }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) await snapshot();
