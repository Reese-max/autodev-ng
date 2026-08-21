// backup-push (2026-08-05): 把艦隊各 repo 鏡像到私人 GitHub。
// 路徑動態取自 configs/*.json 的 projectPath（中文路徑不入 .cmd——硬規則 7）。
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnPauseGated } from './pause-gated-spawn.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STOP = join(ROOT, 'configs', '.adng.stop');
const LOG = process.env.ADNG_BACKUP_PUSH_LOG || join(ROOT, 'data', 'backup-push.jsonl');
mkdirSync(dirname(LOG), { recursive: true });

let failed = false;
function record(repo, status, detail = '') {
  const event = { ts: new Date().toISOString(), repo, status, ...(detail ? { detail: detail.slice(-2000) } : {}) };
  appendFileSync(LOG, `${JSON.stringify(event)}\n`, 'utf8');
  const line = `backup-push ${status} ${repo}${detail ? `: ${detail}` : ''}`;
  (status === 'failed' ? console.error : console.log)(line);
  if (status === 'failed') failed = true;
}

function git(repo, args) {
  return spawnSync('git', ['-C', repo, ...args], {
    encoding: 'utf8', timeout: 120_000, windowsHide: true,
  });
}

function inspectRepo(repo, run) {
  const branchResult = run(repo, ['symbolic-ref', '--short', 'HEAD']);
  const branch = (branchResult.stdout ?? '').trim();
  if (branchResult.status !== 0 || !branch) {
    return { status: 'failed', detail: (branchResult.stderr ?? '').trim() || '無法取得目前分支' };
  }

  const remoteResult = run(repo, ['ls-remote', '--exit-code', '--heads', 'origin', branch]);
  if (remoteResult.status === 2) {
    return { status: 'pending-initial-push', detail: `origin/${branch} 尚不存在，等待明確授權` };
  }
  if (remoteResult.status !== 0) {
    return { status: 'failed', detail: (remoteResult.stderr ?? '').trim() || `無法讀取 origin/${branch}` };
  }

  return { status: 'ready' };
}

export function backupRepo(repo, run = git) {
  const inspected = inspectRepo(repo, run);
  if (inspected.status !== 'ready') return inspected;

  const pushResult = run(repo, ['push', '-q', 'origin', 'HEAD']);
  return pushResult.status === 0
    ? { status: 'ok' }
    : { status: 'failed', detail: (pushResult.stderr ?? '').trim() || `git push 結束碼 ${pushResult.status}` };
}

async function backupRepoGated(repo) {
  const inspected = inspectRepo(repo, git);
  if (inspected.status !== 'ready') return inspected;
  const pushed = await spawnPauseGated(STOP, 'git', ['-C', repo, 'push', '-q', 'origin', 'HEAD'], {
    timeoutMs: 120_000, stdio: 'ignore',
  });
  if (!pushed.started) return { status: 'paused' };
  return pushed.status === 0 ? { status: 'ok' } : { status: 'failed', detail: `git push 結束碼 ${pushed.status}` };
}

async function main() {
  const repos = new Set([ROOT]);
  for (const f of readdirSync(join(ROOT, 'configs'))) {
    if (!f.endsWith('.json')) continue;
    try {
      const cfg = JSON.parse(readFileSync(join(ROOT, 'configs', f), 'utf8'));
      repos.add(resolve(join(ROOT, 'configs'), cfg.projectPath));
    } catch (error) {
      record(join(ROOT, 'configs', f), 'failed', `config：${String(error)}`);
    }
  }
  for (const repo of repos) {
    if (existsSync(STOP)) break;
    const result = await backupRepoGated(repo);
    if (result.status === 'paused') break;
    record(repo, result.status, result.detail);
  }
  if (failed) process.exitCode = 1;
}

if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) await main();
