import { describe, test, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ConfigSchema } from '../src/types.js'
import { runOnce, type Deps, type LessonsPort } from '../src/scheduler.js'
import { BacklogStore } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { MockEngine } from '../src/engines/mock.js'

/** 沿用 tests/scheduler.test.ts 的 initGitRepo/deps 建構模式（M4 Task 6：runOnce 對每個
 * 任務執行 prepareWorktree，需要 projectPath 是真的 git repo）。 */
function initGitRepo(dir: string): void {
  execFileSync('git', ['init', '-b', 'main'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.email', 'adng-test@example.com'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.name', 'adng-test'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'core.autocrlf', 'false'], { cwd: dir, stdio: 'ignore' })
  writeFileSync(join(dir, 'README.md'), '# adng test repo\n')
  execFileSync('git', ['add', '.'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', 'chore: init'], { cwd: dir, stdio: 'ignore' })
}

function deps(engine: MockEngine, lessons?: LessonsPort, backlogMd = '- [ ] 任務一\n'): Deps {
  const dir = mkdtempSync(join(tmpdir(), 'adng-learn-wiring-'))
  initGitRepo(dir)
  const backlogFile = join(dir, 'BACKLOG.md')
  writeFileSync(backlogFile, backlogMd)
  const cfg = ConfigSchema.parse({
    projectPath: dir, backlogFile, dataDir: join(dir, 'data'),
    engine: 'mock', stopFile: join(dir, '.adng.stop'),
    worktreesDir: join(dir, 'worktrees') // 絕對路徑，絕不落在真專案目錄（鐵律 #6）
  })
  return {
    cfg, store: new BacklogStore(backlogFile), db: new RunDb(join(dir, 'run.db')),
    engines: { resolve: () => engine }, events: new EventLog(cfg.dataDir), lessons
  }
}

describe('config learnings 欄位', () => {
  test('learningsFile/globalLearningsFile 可選、能 parse', () => {
    const cfg = ConfigSchema.parse({
      projectPath: '/p', backlogFile: '/p/B.md', dataDir: '/p/d',
      engine: 'mock', learningsFile: '/p/d/learnings.md', globalLearningsFile: '/g.md'
    })
    expect(cfg.learningsFile).toBe('/p/d/learnings.md')
    expect(cfg.globalLearningsFile).toBe('/g.md')
  })
})

describe('scheduler 教訓注入', () => {
  test('lessons.inject 有內容時附進 job.directive', async () => {
    const e = new MockEngine([{ ok: true }])
    const lessons: LessonsPort = {
      inject: () => '## 過往教訓(遵守,避免重蹈)\n- L001 [2026-07-10] 教訓甲',
      reflect: async () => {}
    }
    const d = deps(e, lessons)
    expect(await runOnce(d)).toBe('done')
    expect(e.calls).toHaveLength(1)
    expect(e.calls[0]!.directive).toContain('教訓甲')
    expect(e.calls[0]!.directive).toContain('任務一')
  })

  test('inject throw 時派工照常、directive 不含教訓(fail-open)', async () => {
    const e = new MockEngine([{ ok: true }])
    const lessons: LessonsPort = {
      inject: () => { throw new Error('boom') },
      reflect: async () => {}
    }
    const d = deps(e, lessons)
    expect(await runOnce(d)).toBe('done')
    expect(e.calls).toHaveLength(1)
    expect(e.calls[0]!.directive).toBeUndefined()
  })

  test('未接 lessons 時行為與現狀完全一致(directive 僅 extraDirective 語意)', async () => {
    const e = new MockEngine([{ ok: true }])
    const d = deps(e)
    expect(await runOnce(d)).toBe('done')
    expect(e.calls).toHaveLength(1)
    expect(e.calls[0]!.directive).toBeUndefined()
  })
})
