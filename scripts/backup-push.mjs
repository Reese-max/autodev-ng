// backup-push (2026-08-05): 把艦隊各 repo 鏡像到私人 GitHub。
// 路徑動態取自 configs/*.json 的 projectPath（中文路徑不入 .cmd——硬規則 7）。
// 寬容語義：離線、無新 commit、無 remote 一律靜默跳過，絕不阻塞 supervise。
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnPauseGated } from './pause-gated-spawn.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STOP = join(ROOT, 'configs', '.adng.stop');
const repos = new Set([ROOT]);
for (const f of readdirSync(join(ROOT, 'configs'))) {
  if (!f.endsWith('.json')) continue;
  try {
    const cfg = JSON.parse(readFileSync(join(ROOT, 'configs', f), 'utf8'));
    repos.add(resolve(join(ROOT, 'configs'), cfg.projectPath));
  } catch { /* 壞 config 跳過 */ }
}
for (const r of repos) {
  try {
    const result = await spawnPauseGated(STOP, 'git', ['-C', r, 'push', '-q', 'origin', 'HEAD'], {
      timeoutMs: 120_000, stdio: 'ignore',
    });
    if (!result.started) break;
  } catch { /* 寬容 */ }
}
