import { expect, test } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runOnce, type CycleResult, type Deps } from '../src/scheduler.js'
import { BacklogStore, taskId } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { MockEngine } from '../src/engines/mock.js'
import { ConfigSchema } from '../src/types.js'

/** M4 Task 6：scheduler 對每個任務執行 prepareWorktree/mergeBack，projectPath 必須是真 git repo。 */
function initGitRepo(dir: string): void {
  execFileSync('git', ['init', '-b', 'main'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.email', 'adng-test@example.com'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.name', 'adng-test'], { cwd: dir, stdio: 'ignore' })
  // Windows 全域 core.autocrlf=true 會讓 checkout 內容 LF→CRLF 而被 git 視為 modified，
  // 干擾 `git worktree remove`（非 --force）；臨時 repo 內 local 覆寫避免依賴全域設定。
  execFileSync('git', ['config', 'core.autocrlf', 'false'], { cwd: dir, stdio: 'ignore' })
  writeFileSync(join(dir, 'README.md'), '# adng test repo\n')
  execFileSync('git', ['add', '.'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', 'chore: init'], { cwd: dir, stdio: 'ignore' })
}

test('M1 閉環：3 任務→2 完成 1 blocked→idle', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-e2e-'))
  initGitRepo(dir)
  const backlogFile = join(dir, 'BACKLOG.md')
  writeFileSync(backlogFile, '- [ ] 任務A\n- [ ] 任務B\n- [ ] 任務C\n')
  const cfg = ConfigSchema.parse({
    projectPath: dir, backlogFile, dataDir: join(dir, 'data'),
    engine: 'mock', stopFile: join(dir, '.adng.stop'),
    worktreesDir: join(dir, 'worktrees') // 絕對路徑，絕不落在真專案目錄（鐵律 #6）
  })
  // 劇本：A 成功；B 連敗兩次；C 成功
  const engine = new MockEngine([
    { ok: true }, { ok: false, reason: 'b1' }, { ok: false, reason: 'b2' }, { ok: true }
  ])
  const d: Deps = { cfg, store: new BacklogStore(backlogFile), db: new RunDb(join(dir, 'run.db')), engines: { resolve: () => engine }, events: new EventLog(cfg.dataDir) }

  const seq: CycleResult[] = []
  for (let i = 0; i < 6; i++) seq.push(await runOnce(d))
  expect(seq).toEqual([
    'done', 'failed',
    { kind: 'blocked', taskId: taskId('任務B'), taskText: '任務B', reason: 'max-attempts' },
    'done', 'idle', 'idle'
  ])

  const md = readFileSync(backlogFile, 'utf8')
  expect(md).toContain('- [x] 任務A')
  expect(md).toContain('adng:blocked')
  expect(md).toContain('- [x] 任務C')
  const hb = JSON.parse(readFileSync(join(cfg.dataDir, 'heartbeat.json'), 'utf8'))
  expect(hb.state).toBe('idle')
}, 30_000) // 6 輪 runOnce 各含 git worktree 進程；全套並行滿載時 wall-time 可破預設 5s（踩雷 §9，M5 Task 7 實錄 5.35s）
