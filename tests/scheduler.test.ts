import { expect, test, beforeEach } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runOnce, type Deps } from '../src/scheduler.js'
import { BacklogStore, taskId } from '../src/backlog.js'
import type { Disposition } from '../src/types.js'
import { RunDb, localDay, type AttemptRecord } from '../src/db.js'
import Database from 'better-sqlite3'
import { EventLog } from '../src/events.js'
import { MockEngine } from '../src/engines/mock.js'
import { ConfigSchema } from '../src/types.js'
import { KernelVerifier } from '../src/verifier.js'
import { acquireWindowsFileLock } from './helpers/windows-file-lock.js'

/** M4 Task 6：scheduler 現在對每個任務執行 prepareWorktree/mergeBack，需要 projectPath 是
 * 真的 git repo——所有會走到 engine.run 的測試都靠這個 helper 建臨時 git repo（mkdtemp +
 * git init -b main + 臨時 repo 內 local user.email/name，避免依賴全域 git config）。 */
function initGitRepo(dir: string): void {
  execFileSync('git', ['init', '-b', 'main'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.email', 'adng-test@example.com'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.name', 'adng-test'], { cwd: dir, stdio: 'ignore' })
  // Windows 上全域 core.autocrlf=true 會把 checkout 內容 LF→CRLF，導致 checkout 內容與已提交
  // blob 不同（git 視為 modified），讓 `git worktree remove`（非 --force）誤判「有未提交變更」
  // 而失敗；臨時 repo 內 local 覆寫避免依賴全域設定（同 user.email/name 慣例）。
  execFileSync('git', ['config', 'core.autocrlf', 'false'], { cwd: dir, stdio: 'ignore' })
  writeFileSync(join(dir, 'README.md'), '# adng test repo\n')
  execFileSync('git', ['add', '.'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', 'chore: init'], { cwd: dir, stdio: 'ignore' })
}

function commitFile(cwd: string, name: string, content: string, message: string): void {
  writeFileSync(join(cwd, name), content)
  execFileSync('git', ['add', '.'], { cwd, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', message], { cwd, stdio: 'ignore' })
}

/** db.record 呼叫的窺視殼——鏡像既有 ThrowingReportStore 手法：繼承真實 RunDb，
 * 覆寫 record 時先攔一份參數快照再照跑 super（維持真實 sqlite 落地行為不變）。 */
class RecordSpyDb extends RunDb {
  readonly records: AttemptRecord[] = []
  record(r: AttemptRecord): void {
    this.records.push(r)
    super.record(r)
  }
}

let dir: string
function deps(engine: MockEngine, backlogMd = '- [ ] 任務一\n'): Deps {
  dir = mkdtempSync(join(tmpdir(), 'adng-sch-'))
  initGitRepo(dir)
  const backlogFile = join(dir, 'BACKLOG.md')
  writeFileSync(backlogFile, backlogMd)
  const cfg = ConfigSchema.parse({
    projectPath: dir, backlogFile, dataDir: join(dir, 'data'),
    engine: 'mock', stopFile: join(dir, '.adng.stop'),
    worktreesDir: join(dir, 'worktrees') // 絕對路徑，絕不落在真專案目錄（鐵律 #6）
  })
  return { cfg, store: new BacklogStore(backlogFile), db: new RunDb(join(dir, 'run.db')), engines: { resolve: () => engine }, events: new EventLog(cfg.dataDir) }
}

test('happy path：done + backlog 打勾 + 記帳', async () => {
  const d = deps(new MockEngine([{ ok: true, costUsd: 0.3 }]))
  expect(await runOnce(d)).toBe('done')
  expect(readFileSync(d.cfg.backlogFile, 'utf8')).toContain('- [x] 任務一')
  expect(d.db.costForLocalDay(localDay(new Date().toISOString(), 0), 0)).toBeCloseTo(0.3)
})

test('敗第 1 次留 open；敗第 2 次 blocked（鐵律：不無限重試）', async () => {
  const e = new MockEngine([{ ok: false, reason: 'x' }, { ok: false, reason: 'x' }])
  const d = deps(e)
  expect(await runOnce(d)).toBe('failed')
  expect(d.store.nextTask()).not.toBeNull() // 還是 open
  expect(await runOnce(d)).toEqual({ kind: 'blocked', taskId: taskId('任務一'), taskText: '任務一', reason: 'max-attempts' })
  expect(d.store.nextTask()).toBeNull() // blocked 不再撿
})

test('backlog 空 → idle，且 idle 事件 24h 去重', async () => {
  const d = deps(new MockEngine(), '# 空\n')
  expect(await runOnce(d)).toBe('idle')
  expect(await runOnce(d)).toBe('idle')
  const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events.match(/"type":"idle"/g)).toHaveLength(1)
})

test('concurrency >1 暫按單工，且同一 scheduler lifecycle 僅記一次降級事件', async () => {
  const engine = new MockEngine([{ ok: true }, { ok: true }])
  const d = deps(engine, '- [ ] 任務甲\n- [ ] 任務乙\n')
  const lifecycle = { ...d, cfg: { ...d.cfg, concurrency: 2 } }

  expect(await runOnce(lifecycle)).toBe('done')
  expect(await runOnce(lifecycle)).toBe('done')
  expect(engine.calls).toHaveLength(2)

  const entries = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
    .trim().split(/\r?\n/).map(line => JSON.parse(line) as Record<string, unknown>)
  const notices = entries.filter(entry => entry.type === 'concurrency-serial-fallback')
  expect(notices).toEqual([expect.objectContaining({ requested: 2, mode: 'serial' })])
})

test('stop 檔優先於一切', async () => {
  const e = new MockEngine()
  const d = deps(e)
  writeFileSync(d.cfg.stopFile, '')
  expect(await runOnce(d)).toBe('stopped')
  expect(e.calls).toHaveLength(0)
})

test('成本硬停：超過 dailyHardUsd 不再派工', async () => {
  const e = new MockEngine()
  const d = deps(e)
  d.db.record({ taskId: 'z', ok: true, costUsd: 999, detail: 'burn' })
  expect(await runOnce(d)).toBe('cost-hard-stop')
  expect(e.calls).toHaveLength(0)
})

test('dailySoftUsd/dailyHardUsd=0：停用專案日成本告警與硬停', async () => {
  const e = new MockEngine()
  const d = deps(e)
  d.db.record({ taskId: 'z', ok: true, costUsd: 999, detail: 'burn' })
  const cfg = { ...d.cfg, dailySoftUsd: 0, dailyHardUsd: 0 }
  expect(await runOnce({ ...d, cfg })).toBe('done')
  expect(e.calls).toHaveLength(1)
  expect(readFileSync(join(cfg.dataDir, 'events.jsonl'), 'utf8')).not.toContain('cost-soft-warn')
})

test('M9.9：訂閱引擎花費不觸日頂，真金引擎照觸', async () => {
  const engines = {
    claude: { adapter: 'mock' as const },
    'codex-spark': { adapter: 'mock' as const, costPerRunUsd: 1, subscription: true }
  }

  // 對照：真金 claude $100（達硬頂 $100）→ 照觸日頂，訂閱設定不赦免真金引擎的花費
  {
    const d = deps(new MockEngine())
    const cfg = { ...d.cfg, engines }
    d.db.record({ taskId: 'z-real', ok: true, costUsd: 100, detail: 'real-burn', engine: 'claude' })
    expect(await runOnce({ ...d, cfg })).toBe('cost-hard-stop')
  }

  // 訂閱 codex-spark $100（超硬頂，名義帳）＋ 真金 claude $1 → 不觸日頂（billed=$1 < 硬頂 $100）
  {
    const d = deps(new MockEngine(), '# 空\n') // backlog 空，避免真的派工到 mock engine
    const cfg = { ...d.cfg, engines }
    d.db.record({ taskId: 'z-sub', ok: true, costUsd: 100, detail: 'subscription-burn', engine: 'codex-spark' })
    d.db.record({ taskId: 'z-real2', ok: true, costUsd: 1, detail: 'real-burn', engine: 'claude' })
    expect(await runOnce({ ...d, cfg })).not.toBe('cost-hard-stop')
  }
})

test('engine 丟例外：計一次失敗、不打勾、回 engine-error', async () => {
  const d = deps(new MockEngine([{ throw: 'ECONNRESET' }]))
  expect(await runOnce(d)).toBe('engine-error')
  expect(d.db.failCount(d.store.nextTask()!.id)).toBe(1)
})

test('preflight 餓死修正：首任務引擎壞 → 跳過改跑下一個可用引擎的任務，壞引擎任務保持 open', async () => {
  const bad = new MockEngine([], { ok: false, detail: '引擎掛了' })
  const good = new MockEngine([{ ok: true, costUsd: 0 }])
  const d = deps(good, '- [ ] [engine:bad] 任務甲\n- [ ] 任務乙\n')
  const cfg = { ...d.cfg, engines: { claude: { adapter: 'mock' as const }, bad: { adapter: 'mock' as const, costPerRunUsd: 0 } } }
  const engines = { resolve: (tag: string) => (tag === 'bad' ? bad : good) }
  expect(await runOnce({ ...d, cfg, engines })).toBe('done')
  const md = readFileSync(d.cfg.backlogFile, 'utf8')
  expect(md).toContain('- [x] 任務乙')                 // 後面的任務被撿起並完成
  expect(md).toContain('- [ ] [engine:bad] 任務甲')    // 壞引擎任務不動、不 blocked（引擎恢復後可跑）
  expect(bad.calls).toHaveLength(0)
  expect(good.calls).toHaveLength(1)
})

test('引擎輪替：無 tag 任務走 rotation，preflight 壞檔位自動後退到好檔位完成', async () => {
  const broken = new MockEngine([], { ok: false, detail: '檔位壞' })
  const good = new MockEngine([{ ok: true, costUsd: 0 }])
  const d = deps(good, '- [ ] 任務丙\n')
  const cfg = {
    ...d.cfg, engineRotation: ['bad', 'ok'],
    engines: { claude: { adapter: 'mock' as const }, bad: { adapter: 'mock' as const, costPerRunUsd: 0 }, ok: { adapter: 'mock' as const, costPerRunUsd: 0 } }
  }
  const engines = { resolve: (tag: string) => (tag === 'bad' ? broken : good) }
  expect(await runOnce({ ...d, cfg, engines })).toBe('done')
  expect(broken.calls).toHaveLength(0)   // preflight 擋住，run 零呼叫
  expect(good.calls).toHaveLength(1)
  expect(readFileSync(d.cfg.backlogFile, 'utf8')).toContain('- [x] 任務丙')
})

test('引擎輪替：候選 resolve 拋錯不堵任務（多候選 failover），後退下一檔完成', async () => {
  const good = new MockEngine([{ ok: true, costUsd: 0 }])
  const d = deps(good, '- [ ] 任務丁\n')
  const cfg = {
    ...d.cfg, engineRotation: ['ghost', 'ok'],
    engines: { claude: { adapter: 'mock' as const }, ghost: { adapter: 'mock' as const, costPerRunUsd: 0 }, ok: { adapter: 'mock' as const, costPerRunUsd: 0 } }
  }
  const engines = { resolve: (tag: string) => { if (tag === 'ghost') throw new Error('建不起來'); return good } }
  expect(await runOnce({ ...d, cfg, engines })).toBe('done')
  expect(readFileSync(d.cfg.backlogFile, 'utf8')).toContain('- [x] 任務丁')  // 不因 ghost 壞被 blocked
})

test('run 失敗 → engine.invalidatePreflight 被呼叫（下輪重探，07-18 codex shim 事故防）', async () => {
  class SpyEngine extends MockEngine { invalidations = 0; invalidatePreflight(): void { this.invalidations++ } }
  const e = new SpyEngine([{ ok: false, reason: 'timeout' }])
  await runOnce(deps(e))
  expect(e.invalidations).toBe(1)
})

test('max-attempts blocked 註記帶最後失敗原因（人工分流不用翻 events.jsonl）', async () => {
  const e = new MockEngine([{ ok: false, reason: 'timeout' }, { ok: false, reason: 'timeout' }])
  const d = deps(e)
  expect(await runOnce(d)).toBe('failed')
  expect(await runOnce(d)).toMatchObject({ kind: 'blocked', reason: 'max-attempts' })
  const md = readFileSync(d.cfg.backlogFile, 'utf8')
  expect(md).toContain('最後失敗：')
  expect(md).toContain('timeout')
})

test('preflight 失敗：回 preflight-failed，engine.run 零呼叫，事件 24h 去重', async () => {
  const e = new MockEngine([{ ok: true }], { ok: false, detail: 'engine 尚未就緒' })
  const d = deps(e)
  expect(await runOnce(d)).toBe('preflight-failed')
  expect(await runOnce(d)).toBe('preflight-failed')
  expect(e.calls).toHaveLength(0)
  const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events.match(/"type":"preflight-failed"/g)).toHaveLength(1)
})

test('engine 成功但 store.report 拋錯：仍回 done、db 只記一筆 ok（無假失敗）、events 含 report-failed', async () => {
  const d = deps(new MockEngine([{ ok: true, costUsd: 0.2 }]))

  class ThrowingReportStore extends BacklogStore {
    report(_id: string, _d: Disposition): void {
      throw new Error('模擬 store.report 下游 I/O 故障（如磁碟權限錯誤）')
    }
  }
  const throwingStore = new ThrowingReportStore(d.cfg.backlogFile)

  const result = await runOnce({ ...d, store: throwingStore })
  expect(result).toBe('done')

  // db 只記一筆「ok」紀錄，沒有因為下游 report 失敗而被誤記成假失敗
  const task = d.store.nextTask()
  expect(task).not.toBeNull()
  expect(d.db.failCount(task!.id)).toBe(0)
  expect(d.db.costForLocalDay(localDay(new Date().toISOString(), 0), 0)).toBeCloseTo(0.2)

  const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events).toContain('"type":"report-failed"')
  expect(events).toContain('"willRepick":true')

  // 已知殘留風險：backlog 沒打勾（下一輪會重新撿到這個「已完成」任務）
  expect(readFileSync(d.cfg.backlogFile, 'utf8')).toContain('- [ ] 任務一')
})

test('engine 連 throw 兩次 → 第二次回 blocked（補齊 engine-error → blocked 的 transition）', async () => {
  const d = deps(new MockEngine([{ throw: 'ECONNRESET' }, { throw: 'ECONNRESET' }]))
  expect(await runOnce(d)).toBe('engine-error')
  expect(d.store.nextTask()).not.toBeNull() // 還是 open
  expect(await runOnce(d)).toEqual({ kind: 'blocked', taskId: taskId('任務一'), taskText: '任務一', reason: 'max-attempts' })
  expect(d.store.nextTask()).toBeNull() // blocked 不再撿
})

test('preflight 失敗時 heartbeat 更新為 idle（不留 stale running）', async () => {
  const e = new MockEngine([], { ok: false, detail: 'auth dead' })
  const d = deps(e)
  expect(await runOnce(d)).toBe('preflight-failed')
  const hb = JSON.parse(readFileSync(join(d.cfg.dataDir, 'heartbeat.json'), 'utf8'))
  expect(hb.state).toBe('idle')
})

test('heartbeat 含 todayAttempts 摘要欄位（無 attempts 時為空物件或僅 cap 列）', async () => {
  const d = deps(new MockEngine(), '# 空 backlog\n')
  expect(await runOnce(d)).toBe('idle')
  const hb = JSON.parse(readFileSync(join(d.cfg.dataDir, 'heartbeat.json'), 'utf8')) as {
    state: string
    todayAttempts?: Record<string, { n: number; ok: number; cap?: number }>
  }
  expect(hb.state).toBe('idle')
  expect(hb.todayAttempts).toBeDefined()
  expect(typeof hb.todayAttempts).toBe('object')
})

test('backlog 有重複任務時發 duplicate-tasks 事件（24h 去重）', async () => {
  const d = deps(new MockEngine(), '- [ ] 重複的\n- [ ] 重複的\n- [ ] 正常的\n')
  await runOnce(d)
  await runOnce(d)
  const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events.match(/"type":"duplicate-tasks"/g)).toHaveLength(1)
})

test('verifier 拒絕 → failed 計數、不打勾；達 maxAttempts 轉 blocked', async () => {
  const d = deps(new MockEngine([{ ok: true }, { ok: true }]))
  const rejecter = { check: async () => ({ pass: false, reason: 'verify-fail: 測試紅', alerts: [] }) }
  const dd = { ...d, verifier: rejecter }
  expect(await runOnce(dd)).toBe('failed')
  expect(d.store.nextTask()).not.toBeNull()
  expect(await runOnce(dd)).toEqual({ kind: 'blocked', taskId: taskId('任務一'), taskText: '任務一', reason: 'max-attempts' })
})

test('verifier throw → pass-with-alert（鐵律#4），任務照 done', async () => {
  const d = deps(new MockEngine([{ ok: true }]))
  const bomber = { check: async () => { throw new Error('verifier exploded') } }
  expect(await runOnce({ ...d, verifier: bomber })).toBe('done')
  const ev = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(ev).toContain('verify-alert')
})

test('失敗成本估計（M4 Task 3）：engine 回報 costUnknown（如 timeout）→ db 記 cfg.failureCostEstimateUsd 且 detail 帶 cost-estimated 標記', async () => {
  const e = new MockEngine([{ ok: false, reason: 'timeout', costUsd: 0, costUnknown: true }])
  const d = deps(e)
  const spyDb = new RecordSpyDb(join(dir, 'run-spy.db'))
  const result = await runOnce({ ...d, db: spyDb })
  expect(result).toBe('failed')
  expect(spyDb.records).toHaveLength(1)
  expect(spyDb.records[0]!.costUsd).toBeCloseTo(1) // ConfigSchema.failureCostEstimateUsd 預設 1
  expect(spyDb.records[0]!.detail).toContain('cost-estimated')
})

test('失敗成本估計：engine 回報真實 costUsd（非 costUnknown）→ 照記真值、detail 不帶 cost-estimated 標記', async () => {
  const e = new MockEngine([{ ok: false, reason: 'is_error: 真實失敗但有回報成本', costUsd: 0.42 }])
  const d = deps(e)
  const spyDb = new RecordSpyDb(join(dir, 'run-spy2.db'))
  expect(await runOnce({ ...d, db: spyDb })).toBe('failed')
  expect(spyDb.records).toHaveLength(1)
  expect(spyDb.records[0]!.costUsd).toBeCloseTo(0.42)
  expect(spyDb.records[0]!.detail).not.toContain('cost-estimated')
})

test('失敗成本估計：自訂 failureCostEstimateUsd（如 2.5）流動到 db 記帳', async () => {
  const e = new MockEngine([{ ok: false, reason: 'exit 1: boom', costUsd: 0, costUnknown: true }])
  const d = deps(e)
  const customCfg = { ...d.cfg, failureCostEstimateUsd: 2.5 }
  const spyDb = new RecordSpyDb(join(dir, 'run-spy3.db'))
  await runOnce({ ...d, cfg: customCfg, db: spyDb })
  expect(spyDb.records[0]!.costUsd).toBeCloseTo(2.5)
})

test('Fix 2：engine 失敗時 task-failed 事件帶 outputTail（截尾 600 字，$10 的診斷線索不蒸發）', async () => {
  const longOutput = 'x'.repeat(1000) + 'TAIL-MARKER 最後的診斷線索'
  const e = new MockEngine([{ ok: false, reason: 'no-commit(phantom completion?)', output: longOutput }])
  const d = deps(e)
  expect(await runOnce(d)).toBe('failed')
  const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  const line = events.split(/\r?\n/).find(l => l.includes('"type":"task-failed"'))
  expect(line).toBeDefined()
  const parsed = JSON.parse(line!) as { outputTail?: string }
  expect(parsed.outputTail).toContain('TAIL-MARKER') // 保尾不保頭：最後輸出才是死因線索
  expect(parsed.outputTail!.length).toBeLessThanOrEqual(600) // 截尾防 events.jsonl 膨脹
})

// ---------------------------------------------------------------------------
// M4 Task 6：worktree 接線（任務級隔離執行環境）
// ---------------------------------------------------------------------------

test('extraDirective 設定時附加到 job.directive 尾（供 engine 讀取專案特規指示）', async () => {
  const e = new MockEngine([{ ok: true }])
  const d = deps(e)
  const customCfg = { ...d.cfg, extraDirective: 'commit message 最後必須帶 KPI-impact 標籤' }
  await runOnce({ ...d, cfg: customCfg })
  expect(e.calls).toHaveLength(1)
  expect(e.calls[0]!.directive).toContain('任務一')
  expect(e.calls[0]!.directive).toContain('KPI-impact 標籤')
})

test('extraDirective 未設定時 job.directive 仍恆附任務文字＋commit 自證行（幻影完成對策）', async () => {
  const e = new MockEngine([{ ok: true }])
  const d = deps(e)
  await runOnce(d)
  expect(e.calls[0]!.directive).toContain('任務一')
  expect(e.calls[0]!.directive).toContain('git log -1')
})

test('上一輪失敗時 directive 注入驗收打回原因（判官回饋閉環 2026-07-28）', async () => {
  const e = new MockEngine([{ ok: true }])
  const d = deps(e)
  d.db.record({ taskId: taskId('任務一'), ok: false, costUsd: 0, detail: 'judge-mismatch: 宣稱的 export.py 不在 diff' })
  await runOnce(d)
  expect(e.calls[0]!.directive).toContain('驗收打回')
  expect(e.calls[0]!.directive).toContain('export.py')
})

test('上一輪成功時 directive 不注入舊失敗原因', async () => {
  const e = new MockEngine([{ ok: true }])
  const d = deps(e)
  d.db.record({ taskId: taskId('任務一'), ok: false, costUsd: 0, detail: 'stale-fail-marker' })
  d.db.record({ taskId: taskId('任務一'), ok: true, costUsd: 0, detail: 'ok-hash' })
  await runOnce(d)
  expect(e.calls[0]!.directive).not.toContain('stale-fail-marker')
})

test('engine.run 收到的 job.projectPath 是 worktree cwd（非主 repo 路徑），且 worktree 於 done 後被清掉', async () => {
  const e = new MockEngine([{ ok: true }])
  const d = deps(e)
  expect(await runOnce(d)).toBe('done')
  expect(e.calls).toHaveLength(1)
  const wtCwd = e.calls[0]!.projectPath
  expect(wtCwd).not.toBe(d.cfg.projectPath)
  expect(wtCwd.startsWith(d.cfg.worktreesDir)).toBe(true)
  expect(existsSync(wtCwd)).toBe(false) // done 後 cleanupWorktree 已清掉
})

test('非 git 專案：prepareWorktree 上拋 → scheduler 歸 blocked+告警（fail-open，不炸 daemon），engine 完全沒被呼叫', async () => {
  const plainDir = mkdtempSync(join(tmpdir(), 'adng-nogit-'))
  const backlogFile = join(plainDir, 'BACKLOG.md')
  writeFileSync(backlogFile, '- [ ] 任務一\n')
  const cfg = ConfigSchema.parse({
    projectPath: plainDir, backlogFile, dataDir: join(plainDir, 'data'),
    engine: 'mock', stopFile: join(plainDir, '.adng.stop'),
    worktreesDir: join(plainDir, 'worktrees')
  })
  const e = new MockEngine([{ ok: true }])
  const d: Deps = {
    cfg, store: new BacklogStore(backlogFile), db: new RunDb(join(plainDir, 'run.db')),
    engines: { resolve: () => e }, events: new EventLog(cfg.dataDir)
  }

  const result = await runOnce(d)
  expect(result).toEqual({ kind: 'blocked', taskId: taskId('任務一'), taskText: '任務一', reason: 'not-a-git-repo' })
  expect(e.calls).toHaveLength(0)
  const events = readFileSync(join(cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events).toContain('worktree-prepare-failed')
  expect(readFileSync(backlogFile, 'utf8')).toContain('adng:blocked')
})

test('worktree 殘留目錄被鎖定（前次中斷進程仍佔用檔案，rmSync 清不掉）→ blocked reason 為 worktree-locked，不誤掛 not-a-git-repo', async () => {
  const e = new MockEngine([{ ok: true }])
  const d = deps(e)
  const wtId = taskId('任務一')
  const staleDir = join(d.cfg.worktreesDir, wtId)
  mkdirSync(staleDir, { recursive: true })
  const lockedFile = join(staleDir, 'locked.txt')
  writeFileSync(lockedFile, 'x')

  // 同 tests/worktree.test.ts 2a929ec9 回歸測試手法：Node fs.openSync 預設帶 FILE_SHARE_DELETE
  // 擋不住同進程 rmSync，改用獨立 PowerShell 子行程以 .NET FileStream（FileShare 不含 Delete）
  // 開檔，才是 Windows 上真會擋刪除的鎖法，貼近「前次中斷進程仍佔用」的場景。
  const locker = await acquireWindowsFileLock(lockedFile, { timeoutMs: 10_000 })
  try {
    const result = await runOnce(d)
    expect(result).toEqual({ kind: 'blocked', taskId: wtId, taskText: '任務一', reason: 'worktree-locked' })
    expect(e.calls).toHaveLength(0)
    const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
    expect(events).toContain('worktree-prepare-failed')
    expect(readFileSync(d.cfg.backlogFile, 'utf8')).toContain('adng:blocked')
  } finally {
    await locker.release()
  }
}, 40000)

test('mergeBack 真衝突（主分支與 worktree 改同一檔）→ report blocked（reason=merge-conflict）+ 告警，worktree/分支保留', async () => {
  // 第三方推進必須發生在 prepareWorktree 建出分支「之後」（若在那之前推進，worktree 分支
  // 反而包含第三方那筆、對 main 單純領先，ff 仍成功）。rebase-before-merge 上線後，
  // 不相干檔案的分岔會被 rebase 救回（見下一測試），只有「同檔真衝突」才 blocked。
  let projectPath = ''
  const e = new MockEngine([{
    ok: true,
    beforeResult: job => {
      commitFile(job.projectPath, 'same.txt', 'from engine\n', 'feat: engine 完成任務')
      commitFile(projectPath, 'same.txt', 'third party\n', 'chore: 第三方改同一檔')
    }
  }])
  const d = deps(e)
  projectPath = d.cfg.projectPath

  const result = await runOnce(d)
  expect(result).toEqual({ kind: 'blocked', taskId: taskId('任務一'), taskText: '任務一', reason: 'merge-conflict' })
  expect(readFileSync(d.cfg.backlogFile, 'utf8')).toContain('adng:blocked')
  const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events).toContain('merge-conflict')

  // worktree/分支保留給人工介入，不清理
  const worktreePath = join(d.cfg.worktreesDir, taskId('任務一'))
  expect(existsSync(worktreePath)).toBe(true)
  const branches = execFileSync('git', ['branch', '--list', `adng/${taskId('任務一')}`], { cwd: d.cfg.projectPath, encoding: 'utf8' })
  expect(branches).toContain(`adng/${taskId('任務一')}`)
})

test('engine 失敗（res.ok=false）：worktree 保留現場（不清理），events 含 worktree-kept', async () => {
  const e = new MockEngine([{ ok: false, reason: 'x' }])
  const d = deps(e)
  expect(await runOnce(d)).toBe('failed')
  const worktreePath = join(d.cfg.worktreesDir, taskId('任務一'))
  expect(existsSync(worktreePath)).toBe(true)
  const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events).toContain('worktree-kept')
})

test('HIGH 修復：engine 執行期間主 repo 被切到新分支 → blocked(reason=branch-switched)，成果不落到使用者當下分支，adng 分支保留', async () => {
  let projectPath = ''
  const e = new MockEngine([{
    ok: true,
    beforeResult: job => {
      commitFile(job.projectPath, 'feature.txt', 'from engine\n', 'feat: engine 完成任務')
      // 使用者在任務執行期間切到自己的新分支（模擬 25 分鐘 engine+verify 執行期間的操作）
      execFileSync('git', ['checkout', '-b', 'user-side-branch'], { cwd: projectPath, stdio: 'ignore' })
    }
  }])
  const d = deps(e)
  projectPath = d.cfg.projectPath

  const result = await runOnce(d)
  expect(result).toEqual({ kind: 'blocked', taskId: taskId('任務一'), taskText: '任務一', reason: 'branch-switched' })
  const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events).toContain('branch-switched')

  // 使用者當下所在分支與原分支（main）都沒收到成果——沒有悄悄合到「使用者當下所在的分支」
  expect(existsSync(join(d.cfg.projectPath, 'feature.txt'))).toBe(false)
  execFileSync('git', ['checkout', 'main'], { cwd: d.cfg.projectPath, stdio: 'ignore' })
  expect(existsSync(join(d.cfg.projectPath, 'feature.txt'))).toBe(false)

  // adng 任務分支保留給人工介入（不硬 merge、不清理）
  const worktreePath = join(d.cfg.worktreesDir, taskId('任務一'))
  expect(existsSync(worktreePath)).toBe(true)
  const branches = execFileSync('git', ['branch', '--list', `adng/${taskId('任務一')}`], { cwd: d.cfg.projectPath, encoding: 'utf8' })
  expect(branches).toContain(`adng/${taskId('任務一')}`)
})

test('M4 Task 6 e2e：全鏈路——backlog 撿起→worktree→engine commit→verify(省 verifyCommand)→mergeBack→主 repo HEAD 前進→worktree 清掉→backlog 標 done', async () => {
  const repo = mkdtempSync(join(tmpdir(), 'adng-wt-e2e-'))
  initGitRepo(repo)
  const backlogFile = join(repo, 'BACKLOG.md')
  writeFileSync(backlogFile, '- [ ] 真任務\n')
  const worktreesDir = join(repo, 'worktrees')
  const cfg = ConfigSchema.parse({
    projectPath: repo, backlogFile, dataDir: join(repo, 'data'),
    engine: 'mock', stopFile: join(repo, '.adng.stop'), worktreesDir
  })
  const beforeHash = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim()

  const engine = new MockEngine([{
    ok: true,
    beforeResult: job => commitFile(job.projectPath, 'feature.txt', 'hello from mock engine\n', 'feat: mock 完成任務')
  }])
  const verifier = new KernelVerifier({ cfg }) // 真實 KernelVerifier，verifyCommand 未設 → verify-skip alert，不影響 pass
  const d: Deps = {
    cfg, store: new BacklogStore(backlogFile), db: new RunDb(join(repo, 'run.db')),
    engines: { resolve: () => engine }, events: new EventLog(cfg.dataDir), verifier
  }

  expect(await runOnce(d)).toBe('done')

  const afterHash = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim()
  expect(afterHash).not.toBe(beforeHash)
  expect(readFileSync(join(repo, 'feature.txt'), 'utf8')).toBe('hello from mock engine\n')
  expect(readFileSync(backlogFile, 'utf8')).toContain('- [x] 真任務')

  expect(existsSync(join(worktreesDir, taskId('真任務')))).toBe(false) // worktree 已清掉
  const branches = execFileSync('git', ['branch', '--list', `adng/${taskId('真任務')}`], { cwd: repo, encoding: 'utf8' })
  expect(branches.trim()).toBe('') // 分支已清掉

  const events = readFileSync(join(cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events).toContain('verify-alert') // verify-skip alert 仍留痕
  expect(events).toContain('task-done')
})

test('MEDIUM 2 回歸：worktree 內壞 commit + verifyCommand 失敗 → 真 rollback 跑過，worktree HEAD 回 base、marker 存活、主 repo 全程不動、任務不標 done', async () => {
  const NODE = process.execPath
  // beforeResult 鉤子模擬「MockEngine 從不設 baseCommitHash」的既有缺口：先在 worktree 內
  // rev-parse HEAD 拿到 base（engine 弄髒 worktree 之前），回傳字串讓 mock.ts 塞進
  // RunResult.baseCommitHash——這是 verifier 的 tryRollback 依賴的真值，全套測試過去沒有
  // 一條走過 runOnce→verifier→真 git reset --hard 的完整鏈。
  const e = new MockEngine([{
    ok: true,
    beforeResult: job => {
      const baseHash = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: job.projectPath, encoding: 'utf8' }).trim()
      commitFile(job.projectPath, 'bad.txt', 'oops\n', 'feat: 壞掉的內容')
      return baseHash
    }
  }])
  const d = deps(e)
  const cfgWithVerify = { ...d.cfg, verifyCommand: `"${NODE}" -e "process.exit(1)"` }
  const verifier = new KernelVerifier({ cfg: cfgWithVerify })
  const beforeMainHash = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: d.cfg.projectPath, encoding: 'utf8' }).trim()

  const result = await runOnce({ ...d, cfg: cfgWithVerify, verifier })

  expect(result).toBe('failed')
  expect(readFileSync(d.cfg.backlogFile, 'utf8')).toContain('- [ ] 任務一') // 任務不標 done

  const worktreePath = join(d.cfg.worktreesDir, taskId('任務一'))
  expect(existsSync(join(worktreePath, '.adng-worktree'))).toBe(true) // marker 存活
  expect(existsSync(join(worktreePath, 'bad.txt'))).toBe(false) // 壞 commit 被 rollback 清掉，worktree HEAD 已回 base

  const mainHashAfter = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: d.cfg.projectPath, encoding: 'utf8' }).trim()
  expect(mainHashAfter).toBe(beforeMainHash) // 主 repo HEAD 全程不動

  const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events).toContain('task-verify-failed')
})

// ---------------------------------------------------------------------------
// M5 Task 1：引擎路由（per-task tag 解析、engine-not-allowed、固定成本記帳）

test('engine-not-allowed：tag 不在 engines 白名單 → 直接 blocked、engine 零呼叫、backlog 註記且 tag 原文保留', async () => {
  const e = new MockEngine([{ ok: true }])
  const d = deps(e, '- [ ] [engine:zen] 跑雜務\n')
  const result = await runOnce(d)
  expect(result).toEqual({ kind: 'blocked', taskId: taskId('跑雜務'), taskText: '跑雜務', reason: 'engine-not-allowed' })
  expect(e.calls).toHaveLength(0) // 違規 tag 絕不派工（zen 不派 voice-actress 靠這條落地）
  const backlog = readFileSync(d.cfg.backlogFile, 'utf8')
  expect(backlog).toContain('adng:blocked')
  expect(backlog).toContain('[engine:zen]') // 鐵律 #1：任務原文（含 tag）不被改寫
  const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events).toContain('task-blocked')
})

test('per-task 路由：tag 在白名單 → resolver 以該 tag 解析；無 tag 用 cfg.defaultEngine', async () => {
  const repo = mkdtempSync(join(tmpdir(), 'adng-route-'))
  initGitRepo(repo)
  const backlogFile = join(repo, 'BACKLOG.md')
  writeFileSync(backlogFile, '- [ ] [engine:agy] 任務甲\n- [ ] 任務乙\n')
  const cfg = ConfigSchema.parse({
    projectPath: repo, backlogFile, dataDir: join(repo, 'data'),
    engine: 'mock', stopFile: join(repo, '.adng.stop'), worktreesDir: join(repo, 'worktrees'),
    engines: { claude: { adapter: 'mock' }, agy: { adapter: 'mock' } }
  })
  const engine = new MockEngine([{ ok: true }, { ok: true }])
  const resolved: string[] = []
  const d: Deps = {
    cfg, store: new BacklogStore(backlogFile), db: new RunDb(join(repo, 'run.db')),
    engines: { resolve: tag => { resolved.push(tag); return engine } },
    events: new EventLog(cfg.dataDir)
  }
  expect(await runOnce(d)).toBe('done')
  expect(await runOnce(d)).toBe('done')
  expect(resolved).toEqual(['agy', 'claude']) // 甲走 tag、乙走 defaultEngine 預設 claude
})

test('resolver 拋錯（adapter 未實作／env 引用缺失）→ blocked(engine-not-allowed)，錯誤訊息進 backlog 註記', async () => {
  const e = new MockEngine([{ ok: true }])
  const d = deps(e)
  d.engines = { resolve: () => { throw new Error('adapter codex 尚未實作') } }
  const result = await runOnce(d)
  expect(result).toMatchObject({ kind: 'blocked', reason: 'engine-not-allowed' })
  expect(e.calls).toHaveLength(0)
  expect(readFileSync(d.cfg.backlogFile, 'utf8')).toContain('尚未實作')
})

test('M5 記帳：固定成本引擎（costPerRunUsd 有設）成功 → db 記固定值而非引擎回報值', async () => {
  const e = new MockEngine([{ ok: true, costUsd: 0.01 }])
  const d = deps(e)
  const cfg = { ...d.cfg, engines: { claude: { adapter: 'mock' as const, costPerRunUsd: 0.7 } } }
  const spyDb = new RecordSpyDb(join(dir, 'run-m5a.db'))
  expect(await runOnce({ ...d, cfg, db: spyDb })).toBe('done')
  expect(spyDb.records).toHaveLength(1)
  expect(spyDb.records[0]!.costUsd).toBeCloseTo(0.7)
})

test('M5 記帳：固定成本引擎失敗（即使 costUnknown）→ 照記 costPerRunUsd，不套 failureCostEstimateUsd、不帶 cost-estimated 標記', async () => {
  const e = new MockEngine([{ ok: false, reason: 'timeout', costUsd: 0, costUnknown: true }])
  const d = deps(e)
  const cfg = { ...d.cfg, engines: { claude: { adapter: 'mock' as const, costPerRunUsd: 0.5 } }, failureCostEstimateUsd: 3 }
  const spyDb = new RecordSpyDb(join(dir, 'run-m5b.db'))
  expect(await runOnce({ ...d, cfg, db: spyDb })).toBe('failed')
  expect(spyDb.records).toHaveLength(1)
  expect(spyDb.records[0]!.costUsd).toBeCloseTo(0.5)
  expect(spyDb.records[0]!.detail).not.toContain('cost-estimated') // 估計語意只留給真值引擎
})

test('M5 記帳：固定成本引擎 costPerRunUsd=0（如 agy 免費）→ 成功失敗都入帳 0，語意保留（非 costUnknown 佔位）', async () => {
  const e = new MockEngine([{ ok: false, reason: 'x', costUsd: 0.01, costUnknown: true }])
  const d = deps(e)
  const cfg = { ...d.cfg, engines: { claude: { adapter: 'mock' as const, costPerRunUsd: 0 } }, failureCostEstimateUsd: 3 }
  const spyDb = new RecordSpyDb(join(dir, 'run-m5c.db'))
  expect(await runOnce({ ...d, cfg, db: spyDb })).toBe('failed')
  expect(spyDb.records[0]!.costUsd).toBe(0)
  expect(spyDb.records[0]!.detail).not.toContain('cost-estimated')
})

test('M5 記帳：固定成本引擎連 engine.run 拋例外都入帳 costPerRunUsd（進程可能已實際起跑燒錢）', async () => {
  const e = new MockEngine([{ throw: 'ECONNRESET' }])
  const d = deps(e)
  const cfg = { ...d.cfg, engines: { claude: { adapter: 'mock' as const, costPerRunUsd: 0.5 } } }
  const spyDb = new RecordSpyDb(join(dir, 'run-m5d.db'))
  expect(await runOnce({ ...d, cfg, db: spyDb })).toBe('engine-error')
  expect(spyDb.records[0]!.costUsd).toBeCloseTo(0.5)
})

test('M5 記帳回歸：真值引擎（costPerRunUsd 未設）語意完全不變——costUnknown 失敗仍套 failureCostEstimateUsd', async () => {
  const e = new MockEngine([{ ok: false, reason: 'timeout', costUsd: 0, costUnknown: true }])
  const d = deps(e)
  const spyDb = new RecordSpyDb(join(dir, 'run-m5e.db'))
  expect(await runOnce({ ...d, db: spyDb })).toBe('failed')
  expect(spyDb.records[0]!.costUsd).toBeCloseTo(1) // ConfigSchema.failureCostEstimateUsd 預設 1
  expect(spyDb.records[0]!.detail).toContain('cost-estimated')
})

// ---------------------------------------------------------------------------
// M10.5 Task 4：全域日頂接線（runOnce 第二道防線）

// 逐字鏡像 tests/globalcost.test.ts 的 seedDb 手法：最小 attempts 表 + 直接寫真 run.db。
function seedSiblingDb(dataDir: string, rows: { ts: string; cost: number; engine: string }[]): void {
  mkdirSync(dataDir, { recursive: true })
  const db = new Database(join(dataDir, 'run.db'))
  db.exec(`CREATE TABLE attempts(
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    ts TEXT NOT NULL,
    ok INTEGER NOT NULL,
    cost_usd REAL NOT NULL,
    detail TEXT NOT NULL,
    engine TEXT NOT NULL DEFAULT ''
  )`)
  for (const r of rows) {
    db.prepare('INSERT INTO attempts (task_id, ts, ok, cost_usd, detail, engine) VALUES (?,?,?,?,?,?)')
      .run('t', r.ts, 1, r.cost, '', r.engine)
  }
  db.close()
}

// 建一個 configs/ 目錄裝兩個「兄弟專案」config：sibling 真花 $50，deps.cfgPath 指向
// 同目錄下的 self.json（自己不記帳，避免與 d.db 的本地日頂邏輯疊加混淆）。
function seedTwoProjectConfigs(): string {
  const configsDir = mkdtempSync(join(tmpdir(), 'adng-sch-global-'))
  writeFileSync(join(configsDir, 'self.json'), JSON.stringify({ dataDir: './data-self', timezoneOffsetHours: 8 }))
  writeFileSync(join(configsDir, 'sibling.json'), JSON.stringify({ dataDir: './data-sibling', timezoneOffsetHours: 8 }))
  seedSiblingDb(join(configsDir, 'data-sibling'), [{ ts: new Date().toISOString(), cost: 50, engine: 'claude' }])
  return join(configsDir, 'self.json')
}

test('M10.5：全域日頂超標 → cost-hard-stop-global', async () => {
  const cfgPath = seedTwoProjectConfigs()
  const d = deps(new MockEngine())
  const cfg = { ...d.cfg, globalDailyHardUsd: 10 } // 兄弟專案已花 $50，遠超此頂
  expect(await runOnce({ ...d, cfg, cfgPath })).toBe('cost-hard-stop')
  const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events).toContain('"type":"cost-hard-stop-global"')
})

test('M10.5 回歸：未設 globalDailyHardUsd → 不受兄弟專案超標影響（現狀不變）', async () => {
  const cfgPath = seedTwoProjectConfigs()
  const d = deps(new MockEngine([{ ok: true, costUsd: 0.1 }]))
  // globalDailyHardUsd 未設；cfgPath 有給——若閘門誤判「有 cfgPath 就查帳」會誤觸 cost-hard-stop。
  expect(await runOnce({ ...d, cfgPath })).toBe('done')
})

// ---------------------------------------------------------------------------
// 簽名熔斷告警接線（2026-07-27）：隔離事件 → deps.notify（fail-open）
// ---------------------------------------------------------------------------

test('簽名熔斷觸發時 deps.notify 收到告警（含引擎名與簽名熔斷事由）', async () => {
  const e = new MockEngine([{ ok: true }])
  const d = deps(e)
  mkdirSync(d.cfg.dataDir, { recursive: true })
  const pickDb = new RunDb(join(d.cfg.dataDir, 'run.db'))
  for (let i = 0; i < 5; i++) {
    pickDb.record({ taskId: `t${i}`, ok: false, costUsd: 0, detail: "exit 1: 'codex' 不是內部或外部命令", engine: 'codex' })
  }
  pickDb.close()
  const sent: string[] = []
  const customCfg = {
    ...d.cfg,
    engineRotation: ['codex', 'fallback'],
    engines: { codex: { adapter: 'codex' }, fallback: { adapter: 'mock' } },
  } as Deps['cfg']
  const r = await runOnce({ ...d, cfg: customCfg, notify: async t => { sent.push(t); return true } })
  expect(r).toBe('done') // codex 熔斷後輪替到 fallback 照常派工
  expect(sent).toHaveLength(1)
  expect(sent[0]).toContain('codex')
  expect(sent[0]).toContain('簽名熔斷')
})

test('mergeBack 假衝突（主分支前進但檔案不相干）→ rebase 救回、done、記 merge-rebased 事件', async () => {
  let projectPath = ''
  const e = new MockEngine([{
    ok: true,
    beforeResult: job => {
      commitFile(job.projectPath, 'feature.txt', 'from engine\n', 'feat: engine 完成任務')
      commitFile(projectPath, 'thirdparty.txt', 'third party\n', 'chore: 第三方推進不相干檔')
    }
  }])
  const d = deps(e)
  projectPath = d.cfg.projectPath

  expect(await runOnce(d)).toBe('done')
  const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events).toContain('"type":"merge-rebased"')
  const log = execFileSync('git', ['log', '--oneline', '-3'], { cwd: projectPath, encoding: 'utf8' })
  expect(log).toContain('engine 完成任務')
  expect(log).toContain('第三方推進不相干檔')
})
