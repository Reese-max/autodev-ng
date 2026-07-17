import { describe, test, expect, vi, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { stopAlertMessage, main } from '../src/autopilot/run.js'
import { sessionAlive } from '../src/autopilot/session.js'
import { acquireLock, releaseLock } from '../src/lock.js'

describe('sessionAlive（M10.5 補洞：config 移除須在任務間煞停 session）', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-alive-'))
  const goalFile = join(dir, 'GOAL.md')
  const stopFile = join(dir, '.adng.stop')
  const cfgPath = join(dir, 'config.json')
  writeFileSync(goalFile, '# GOAL')
  writeFileSync(cfgPath, '{}')

  test('goal+config 在、無 stopFile → 活', () => {
    expect(sessionAlive(goalFile, stopFile, cfgPath)).toBe(true)
  })
  test('cfgPath 未提供（手動 /goal run 情境）→ 不影響存活', () => {
    expect(sessionAlive(goalFile, stopFile, undefined)).toBe(true)
  })
  test('config 被移除（M10.5 退役/優雅重啟）→ 死', () => {
    expect(sessionAlive(goalFile, stopFile, join(dir, 'gone.json'))).toBe(false)
  })
  test('stopFile 出現 → 死', () => {
    writeFileSync(stopFile, '')
    expect(sessionAlive(goalFile, stopFile, cfgPath)).toBe(false)
  })
})

describe('stopAlertMessage', () => {
  test('achieved → null（不告警）', () => {
    expect(stopAlertMessage('a1b2', { kind: 'achieved', rounds: 3 })).toBeNull()
  })
  test('no-progress → 含 goalId/kind/rounds', () => {
    const m = stopAlertMessage('a1b2', { kind: 'no-progress', rounds: 5 })!
    expect(m).toContain('a1b2')
    expect(m).toContain('no-progress')
    expect(m).toContain('5')
  })
  test('stuck → 含 reason', () => {
    const m = stopAlertMessage('a1b2', { kind: 'stuck', rounds: 2, reason: '缺測試框架' })!
    expect(m).toContain('stuck')
    expect(m).toContain('缺測試框架')
  })
  test('killed → 含 kind', () => {
    expect(stopAlertMessage('a1b2', { kind: 'killed', rounds: 0 })!).toContain('killed')
  })
})

describe('main：single-instance lock', () => {
  let dataDir: string | undefined

  afterEach(() => {
    if (dataDir) releaseLock(join(dataDir, 'autopilot.lock'))
  })

  test('lock 被佔時提早返回，不跑 session（不產生 goal-*.jsonl audit 檔）', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'adng-autopilot-run-'))
    dataDir = join(dir, 'data')
    mkdirSync(dataDir, { recursive: true })

    const goalFile = join(dir, 'GOAL.md')
    writeFileSync(goalFile, '# GOAL\n測試目標\n\n## 邊界\n- 連續無進展上限:3\n')

    const cfgPath = join(dir, 'config.json')
    writeFileSync(cfgPath, JSON.stringify({
      projectPath: './project', backlogFile: './project/BACKLOG.md', dataDir: './data',
      engine: 'mock', goalFile: './GOAL.md',
    }))

    // 搶先持鎖，模擬另一個 autopilot session 已在跑。
    expect(acquireLock(join(dataDir, 'autopilot.lock'))).toBe(true)

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    let calls: unknown[][]
    try {
      await main(cfgPath)
    } finally {
      calls = [...logSpy.mock.calls]
      logSpy.mockRestore()
    }

    expect(calls.some(c => /已在執行|lock/i.test(String(c[0])))).toBe(true)
    const auditFiles = readdirSync(dataDir).filter(f => /^goal-.*\.jsonl$/.test(f))
    expect(auditFiles).toEqual([])
  })
})
