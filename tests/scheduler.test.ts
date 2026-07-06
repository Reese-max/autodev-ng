import { expect, test, beforeEach } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runOnce, type Deps } from '../src/scheduler.js'
import { BacklogStore, taskId } from '../src/backlog.js'
import type { Disposition } from '../src/types.js'
import { RunDb, localDay, type AttemptRecord } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { MockEngine } from '../src/engines/mock.js'
import { ConfigSchema } from '../src/types.js'
import { KernelVerifier } from '../src/verifier.js'

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
  return { cfg, store: new BacklogStore(backlogFile), db: new RunDb(join(dir, 'run.db')), engine, events: new EventLog(cfg.dataDir) }
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
  expect(await runOnce(d)).toEqual({ kind: 'blocked', taskId: taskId('任務一'), taskText: '任務一' })
  expect(d.store.nextTask()).toBeNull() // blocked 不再撿
})

test('backlog 空 → idle，且 idle 事件 24h 去重', async () => {
  const d = deps(new MockEngine(), '# 空\n')
  expect(await runOnce(d)).toBe('idle')
  expect(await runOnce(d)).toBe('idle')
  const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events.match(/"type":"idle"/g)).toHaveLength(1)
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

test('engine 丟例外：計一次失敗、不打勾、回 engine-error', async () => {
  const d = deps(new MockEngine([{ throw: 'ECONNRESET' }]))
  expect(await runOnce(d)).toBe('engine-error')
  expect(d.db.failCount(d.store.nextTask()!.id)).toBe(1)
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
  expect(await runOnce(d)).toEqual({ kind: 'blocked', taskId: taskId('任務一'), taskText: '任務一' })
  expect(d.store.nextTask()).toBeNull() // blocked 不再撿
})

test('preflight 失敗時 heartbeat 更新為 idle（不留 stale running）', async () => {
  const e = new MockEngine([], { ok: false, detail: 'auth dead' })
  const d = deps(e)
  expect(await runOnce(d)).toBe('preflight-failed')
  const hb = JSON.parse(readFileSync(join(d.cfg.dataDir, 'heartbeat.json'), 'utf8'))
  expect(hb.state).toBe('idle')
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
  expect(await runOnce(dd)).toEqual({ kind: 'blocked', taskId: taskId('任務一'), taskText: '任務一' })
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

test('extraDirective 未設定時 job.directive 為 undefined', async () => {
  const e = new MockEngine([{ ok: true }])
  const d = deps(e)
  await runOnce(d)
  expect(e.calls[0]!.directive).toBeUndefined()
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
    engine: e, events: new EventLog(cfg.dataDir)
  }

  const result = await runOnce(d)
  expect(result).toEqual({ kind: 'blocked', taskId: taskId('任務一'), taskText: '任務一' })
  expect(e.calls).toHaveLength(0)
  const events = readFileSync(join(cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events).toContain('worktree-prepare-failed')
  expect(readFileSync(backlogFile, 'utf8')).toContain('adng:blocked')
})

test('mergeBack ff 失敗（主分支同時被第三方推進且與 worktree 分支分岔）→ report blocked（reason=merge-conflict）+ 告警，worktree/分支保留', async () => {
  // 第三方推進必須發生在 prepareWorktree 建出分支「之後」才會造成真分岔（若在那之前推進，
  // worktree 分支反而會包含第三方那筆、對 main 是單純領先，ff 仍會成功）——用 beforeResult
  // 鉤子（engine.run 內、prepareWorktree 之後才觸發）在提交 engine 自己的 feature.txt 後，
  // 緊接著在主 repo（非 worktree）直接 commit，模擬使用者/第三方同時動了主分支。
  let projectPath = ''
  const e = new MockEngine([{
    ok: true,
    beforeResult: job => {
      commitFile(job.projectPath, 'feature.txt', 'from engine\n', 'feat: engine 完成任務')
      commitFile(projectPath, 'thirdparty.txt', 'third party\n', 'chore: 第三方推進')
    }
  }])
  const d = deps(e)
  projectPath = d.cfg.projectPath

  const result = await runOnce(d)
  expect(result).toEqual({ kind: 'blocked', taskId: taskId('任務一'), taskText: '任務一' })
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
    engine, events: new EventLog(cfg.dataDir), verifier
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
