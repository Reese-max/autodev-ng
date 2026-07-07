import { expect, test, vi } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runOnce, type Deps } from '../src/scheduler.js'
import { BacklogStore } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { MockEngine } from '../src/engines/mock.js'
import { ConfigSchema } from '../src/types.js'

// M5 Task 2：cleanupWorktree 拋 WorktreeCleanupPartialError（rmSync 已成功、僅 git 記錄
// prune/branch -d 清理失敗）→ scheduler 呼叫點 catch 分流，記 `worktree-cleanup-partial`
// 而非 `worktree-kept`（現場已不在，kept 是誤導人工介入的假訊息）。
// done 流程的真 git 場景無法穩定重現 prune/branch -d 失敗（ff 合回後 branch -d 必成功），
// 這裡部分 mock cleanupWorktree 專驗呼叫點的分流邏輯；錯誤型別本身的真 git 觸發
// （未合併分支 branch -d 失敗）已在 worktree.test.ts 驗過。獨立檔案：vi.mock 是
// module 級替換，不可污染 scheduler.test.ts 其餘用例的真實 cleanup 行為。
vi.mock('../src/worktree.js', async importOriginal => {
  const actual = await importOriginal<typeof import('../src/worktree.js')>()
  return {
    ...actual,
    cleanupWorktree: (): never => {
      throw new actual.WorktreeCleanupPartialError('cleanupWorktree: 目錄已刪但 git 記錄清理失敗（模擬 prune/branch -d 故障）')
    },
  }
})

function initGitRepo(dir: string): void {
  execFileSync('git', ['init', '-b', 'main'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.email', 'adng-test@example.com'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.name', 'adng-test'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'core.autocrlf', 'false'], { cwd: dir, stdio: 'ignore' })
  writeFileSync(join(dir, 'README.md'), '# adng test repo\n')
  execFileSync('git', ['add', '.'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', 'chore: init'], { cwd: dir, stdio: 'ignore' })
}

function deps(engine: MockEngine): Deps {
  const dir = mkdtempSync(join(tmpdir(), 'adng-schp-'))
  initGitRepo(dir)
  const backlogFile = join(dir, 'BACKLOG.md')
  writeFileSync(backlogFile, '- [ ] 任務一\n')
  const cfg = ConfigSchema.parse({
    projectPath: dir, backlogFile, dataDir: join(dir, 'data'),
    engine: 'mock', stopFile: join(dir, '.adng.stop'),
    worktreesDir: join(dir, 'worktrees')
  })
  return { cfg, store: new BacklogStore(backlogFile), db: new RunDb(join(dir, 'run.db')), engines: { resolve: () => engine }, events: new EventLog(cfg.dataDir) }
}

test('done 後 cleanup 拋 WorktreeCleanupPartialError → events 記 worktree-cleanup-partial（非 worktree-kept），任務仍是 done', async () => {
  const d = deps(new MockEngine([{ ok: true }]))

  expect(await runOnce(d)).toBe('done') // 清理失敗不可反殺已完成的任務（既有語意不變）
  expect(readFileSync(d.cfg.backlogFile, 'utf8')).toContain('- [x] 任務一')

  const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events).toContain('"type":"worktree-cleanup-partial"')
  expect(events).not.toContain('worktree-kept') // 現場已不在，不得誤記 kept
})
