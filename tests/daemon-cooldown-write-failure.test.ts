import { expect, test, vi } from 'vitest'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// 只局部 mock writeFileSync（可控制在特定路徑拋錯），其餘 fs 函式維持真實行為（操作真實
// 暫存目錄）。獨立成檔案而非塞進 tests/daemon.test.ts：讓 vi.mock('node:fs') 的作用域只
// 限本檔，不波及 daemon.test.ts 既有測試（風格鏡像 tests/lock-pidfile-cleanup.test.ts）。
const writeFileSync = vi.hoisted(() => vi.fn())

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  // 只對 alert-cooldown.json 的 tmp+rename 原子寫中的 write 那一步注入故障；
  // 其餘路徑（backlog、db、events、heartbeat、lock pidfile……）一律走真實 writeFileSync。
  writeFileSync.mockImplementation((...args: Parameters<typeof actual.writeFileSync>) => {
    if (String(args[0]).endsWith('alert-cooldown.json.tmp')) {
      throw new Error('ENOSPC（模擬冷卻表落地寫入失敗）')
    }
    return actual.writeFileSync(...args)
  })
  return {
    ...actual,
    writeFileSync,
  }
})

const { runDaemon } = await import('../src/daemon.js')
const { BacklogStore } = await import('../src/backlog.js')
const { RunDb } = await import('../src/db.js')
const { EventLog } = await import('../src/events.js')
const { MockEngine } = await import('../src/engines/mock.js')
const { ConfigSchema } = await import('../src/types.js')

test('saveCooldownTable 寫入失敗（模擬磁碟故障）→ 告警照發、daemon 不炸（fail-open，鐵律 #4）', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-cooldown-write-fail-'))
  const backlogFile = join(dir, 'BACKLOG.md')
  // 用 mock 過的 writeFileSync 寫 setup 檔（此路徑不觸發注入的故障，正常落地到真實 fs）。
  writeFileSync(backlogFile, '- [ ] 任務一\n')
  const cfg = ConfigSchema.parse({
    projectPath: dir, backlogFile, dataDir: join(dir, 'data'),
    engine: 'mock', stopFile: join(dir, '.adng.stop')
  })
  const deps = {
    cfg,
    store: new BacklogStore(backlogFile),
    db: new RunDb(join(dir, 'run.db')),
    engines: { resolve: () => new MockEngine() },
    events: new EventLog(cfg.dataDir),
  }
  deps.db.record({ taskId: 'z', ok: true, costUsd: 999, detail: 'burn' }) // 觸發 cost-hard-stop（可告警結果）

  const sent: string[] = []
  const notifier = { send: async (text: string) => { sent.push(text); return true } }

  const result = await runDaemon({
    deps,
    notifier,
    lockDir: join(dir, 'lock'),
    cooldownMs: 1000,
    idleSleepMs: 5000,
    maxCycles: 1,
    sleepFn: async () => {}, // 測試不用真的等 idleSleepMs（避免撞 vitest 預設 test timeout）
  })

  expect(result).toBe('max-cycles') // daemon 沒有因為冷卻表寫入失敗而崩潰/反殺主迴圈
  expect(sent.filter(t => t.includes('cost-hard-stop'))).toHaveLength(1) // 告警照樣送達，不因落地失敗被擋下
})
