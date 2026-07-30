import { expect, test, vi } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// 鏡像 tests/daemon.test.ts：整檔 mock perpetual，隔離 idle 分支副作用。
const maybeRunPerpetualMock = vi.hoisted(() => vi.fn(async (): Promise<boolean> => false))
const perpetualDigestLineMock = vi.hoisted(() => vi.fn((): string | null => null))
vi.mock('../src/autopilot/perpetual.js', () => ({ maybeRunPerpetual: maybeRunPerpetualMock, perpetualDigestLine: perpetualDigestLineMock }))

import { runDaemon, type DaemonOpts, type Notifier } from '../src/daemon.js'
import type { Deps } from '../src/scheduler.js'
import { BacklogStore } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { MockEngine } from '../src/engines/mock.js'
import { ConfigSchema } from '../src/types.js'

function fakeSleep(calls: number[]): (ms: number) => Promise<void> {
  return async (ms: number) => { calls.push(ms) }
}

class FakeNotifier implements Notifier {
  readonly sent: string[] = []
  async send(text: string): Promise<boolean> { this.sent.push(text); return true }
}

function initGitRepo(dir: string): void {
  execFileSync('git', ['init', '-b', 'main'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.email', 'adng-test@example.com'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.name', 'adng-test'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'core.autocrlf', 'false'], { cwd: dir, stdio: 'ignore' })
  writeFileSync(join(dir, 'README.md'), '# adng test repo\n')
  execFileSync('git', ['add', '.'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', 'chore: init'], { cwd: dir, stdio: 'ignore' })
}

function deps(engine: MockEngine, backlogMd = '- [ ] 任務一\n'): Deps {
  const dir = mkdtempSync(join(tmpdir(), 'adng-restart-'))
  initGitRepo(dir)
  const backlogFile = join(dir, 'BACKLOG.md')
  writeFileSync(backlogFile, backlogMd)
  const cfg = ConfigSchema.parse({
    projectPath: dir, backlogFile, dataDir: join(dir, 'data'),
    engine: 'mock', stopFile: join(dir, '.adng.stop'),
    worktreesDir: join(dir, 'worktrees'),
    timezoneOffsetHours: 0,
  })
  return { cfg, store: new BacklogStore(backlogFile), db: new RunDb(join(dir, 'run.db')), engines: { resolve: () => engine }, events: new EventLog(cfg.dataDir) }
}

function baseOpts(d: Deps, notifier: Notifier, sleepCalls: number[], overrides: Partial<DaemonOpts> = {}): DaemonOpts {
  return {
    deps: d, notifier,
    lockDir: join(d.cfg.dataDir, '..', 'lock'),
    cooldownMs: 1000, idleSleepMs: 5000,
    sleepFn: fakeSleep(sleepCalls), maxCycles: 10,
    memFreeRatioFn: () => 1,
    ...overrides,
  }
}

const sentinelPath = (d: Deps): string => join(d.cfg.dataDir, 'restart.request')

// ---------------------------------------------------------------------------
// restart.request 哨兵：優雅重啟（與 config-gone 同位置、同語意層）
// ---------------------------------------------------------------------------

test('哨兵存在 → 刪哨兵、記 daemon-restart-requested、回 restart-requested', async () => {
  const d = deps(new MockEngine(), '# 空 backlog\n')
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []
  writeFileSync(sentinelPath(d), '')

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, { maxCycles: 5 }))

  expect(result).toBe('restart-requested')
  expect(existsSync(sentinelPath(d))).toBe(false) // 哨兵必須消費掉，否則重啟後立刻又退＝無限翻抖
  const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events).toContain('"type":"daemon-restart-requested"')
})

test('哨兵於 cycle 中途出現 → 當前 attempt 不中斷，下一輪頂端才處理', async () => {
  const engine = new MockEngine([{ ok: true }])
  const d = deps(engine) // backlog 有 1 個任務：第 1 輪會派工
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []
  let cycle = 0

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, {
    maxCycles: 5,
    // 第 1 輪結束進 sleep 時寫入哨兵——模擬 attempt 進行中收到重啟請求
    sleepFn: async () => { cycle++; if (cycle === 1) writeFileSync(sentinelPath(d), '') },
  }))

  expect(result).toBe('restart-requested')
  const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events).toContain('"type":"task-done"') // 第 1 輪任務完整做完，未被哨兵打斷
  expect(events).toContain('"type":"daemon-restart-requested"')
})

test('無哨兵 → 行為不變（回歸線）', async () => {
  const d = deps(new MockEngine(), '# 空 backlog\n')
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, { maxCycles: 3 }))

  expect(result).toBe('max-cycles')
  const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events).not.toContain('"type":"daemon-restart-requested"')
})

test('哨兵刪除失敗 → 不退出（防翻抖）、記 unlink-failed 事件、繼續跑', async () => {
  const d = deps(new MockEngine(), '# 空 backlog\n')
  const notifier = new FakeNotifier()
  const sleepCalls: number[] = []
  writeFileSync(sentinelPath(d), '')

  const result = await runDaemon(baseOpts(d, notifier, sleepCalls, {
    maxCycles: 3,
    // 注入刪除失敗：模擬權限/鎖定問題——刪不掉就不能退，否則 supervisor 重啟後
    // 又見哨兵又退，無限翻抖
    unlinkFn: () => { throw new Error('EPERM: 模擬刪除失敗') },
  }))

  expect(result).toBe('max-cycles')
  const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events).toContain('"type":"daemon-restart-unlink-failed"')
  expect(events).not.toContain('"type":"daemon-restart-requested"')
})
