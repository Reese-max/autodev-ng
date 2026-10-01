import { afterEach, expect, test, vi } from 'vitest'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runOnce, type Deps } from '../src/scheduler.js'
import { BacklogStore } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { MockEngine } from '../src/engines/mock.js'
import { createExecutionObservation } from '../src/engines/execution-observation.js'
import { ControlStore, CONTROL_TTL_MS, type ControlEnvelope } from '../src/engines/steering.js'
import { ConfigSchema } from '../src/types.js'

const roots: string[] = []
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })

function root(): string {
  const dir = mkdtempSync(join(tmpdir(), 'adng-steer-')); roots.push(dir)
  return dir
}

/** 建立一個活著的執行快照（hostPid=本測試行程，phase running）。 */
function liveExecution(dataDir: string, executionId = 'exec-1', adapter = 'mock', taskId = 'task-1') {
  return createExecutionObservation({
    dataDir, adapter,
    job: { executionId, task: { id: taskId, text: 'fixture task', line: 0, status: 'open' }, projectPath: dataDir },
  })
}

function store(dir: string): ControlStore { return new ControlStore(dir) }

function submit(dir: string, over: Partial<Parameters<ControlStore['submit']>[0]> = {}) {
  return store(dir).submit({
    project: 'proj', executionId: 'exec-1', mode: 'QUEUE',
    instruction: '請改修 parser', issuer: 'tester', channel: 'test', ...over,
  })
}

function receiptsFor(dir: string, envelopeId: string) {
  const dirPath = join(dir, 'controls', 'receipts')
  if (!existsSync(dirPath)) return []
  return readdirSync(dirPath).filter(f => f.startsWith(`${envelopeId}-`)).sort()
    .map(f => JSON.parse(readFileSync(join(dirPath, f), 'utf8')) as Record<string, unknown>)
}

function receiptDigestOk(receipt: Record<string, unknown>): boolean {
  const { bundleHash, ...body } = receipt
  return bundleHash === createHash('sha256').update(JSON.stringify(body)).digest('hex')
}

// ── 目標綁定：偽造／不存在／已終結的 execution 一律 fail closed ──

test('QUEUE 目標執行不存在 → REJECTED_STALE_TARGET，且留下可驗證收據', () => {
  const dir = root()
  const r = submit(dir, { executionId: 'missing-exec' })
  expect(r.ok).toBe(false)
  expect(r.envelope.disposition).toBe('REJECTED_STALE_TARGET')
  const receipts = receiptsFor(dir, r.envelope.id)
  expect(receipts.length).toBe(1)
  expect(receipts[0]).toMatchObject({ requestedMode: 'QUEUE', disposition: 'REJECTED_STALE_TARGET', issuer: 'tester' })
  expect(receiptDigestOk(receipts[0]!)).toBe(true)
})

test('偽造/不合法 executionId（路徑穿越字元）→ REJECTED_INVALID，不落地為可投遞信封', () => {
  const dir = root()
  const r = submit(dir, { executionId: '../escape' })
  expect(r.ok).toBe(false)
  expect(r.envelope.disposition).toBe('REJECTED_INVALID')
  expect(store(dir).list().pending).toHaveLength(0)
})

test('目標執行已 terminal → STEER 與 QUEUE 皆 REJECTED_STALE_TARGET，絕不落下一題', () => {
  const dir = root()
  const obs = liveExecution(dir, 'exec-dead')
  obs.finish('completed')
  expect(submit(dir, { executionId: 'exec-dead', mode: 'STEER' }).envelope.disposition).toBe('REJECTED_STALE_TARGET')
  expect(submit(dir, { executionId: 'exec-dead', mode: 'QUEUE' }).envelope.disposition).toBe('REJECTED_STALE_TARGET')
})

// ── 指令注入防線：換行、HTML/adng 註記、超長文字一律拒絕 ──

test('指令含換行 / HTML 註解 / adng 註記 / 超長 → REJECTED_INVALID', () => {
  const dir = root()
  liveExecution(dir)
  for (const instruction of ['一行\n二行', '偽造 <!-- adng:done --> 註記', '含有 adng:blocked 註記', 'x'.repeat(501)]) {
    const r = submit(dir, { instruction })
    expect(r.ok).toBe(false)
    expect(r.envelope.disposition).toBe('REJECTED_INVALID')
  }
  expect(store(dir).list().pending).toHaveLength(0)
})

test('重放相同指示（同 execution、pending 中已有同 hash）→ 拒絕重複', () => {
  const dir = root()
  liveExecution(dir)
  const first = submit(dir, { instruction: '重複指示' })
  expect(first.envelope.disposition).toBe('QUEUED')
  const replay = submit(dir, { instruction: '重複指示' })
  expect(replay.ok).toBe(false)
  expect(replay.envelope.disposition).toBe('REJECTED_INVALID')
})

// ── 能力矩陣：不支援的 adapter 回 UNSUPPORTED，不假裝成功 ──

test('STEER 到不支援 in-flight 的 adapter（claude-cli）→ UNSUPPORTED', () => {
  const dir = root()
  liveExecution(dir, 'exec-1', 'claude-cli')
  const r = submit(dir, { mode: 'STEER' })
  expect(r.ok).toBe(false)
  expect(r.envelope.disposition).toBe('UNSUPPORTED')
})

test('QUEUE 到無 next-turn 能力的 adapter（agy）→ UNSUPPORTED', () => {
  const dir = root()
  liveExecution(dir, 'exec-1', 'agy')
  const r = submit(dir, { mode: 'QUEUE' })
  expect(r.ok).toBe(false)
  expect(r.envelope.disposition).toBe('UNSUPPORTED')
})

// ── STEER：pending → 引擎於安全點接收 → STEERED ──

test('STEER 到支援 in-flight 的執行 → 先 PENDING，adapter 取走後 STEERED + 收據', () => {
  const dir = root()
  liveExecution(dir)
  const r = submit(dir, { mode: 'STEER', instruction: '先別動 migration' })
  expect(r.ok).toBe(true)
  expect(r.envelope.disposition).toBe('PENDING')
  expect(r.envelope.state).toBe('pending')

  const s = store(dir)
  expect(s.takeInFlight('exec-1')).toBe('先別動 migration')
  const after = s.list().resolved.find(e => e.id === r.envelope.id)!
  expect(after.disposition).toBe('STEERED')
  expect(s.takeInFlight('exec-1')).toBeUndefined() // 一次性：取走不重送
  expect(receiptsFor(dir, r.envelope.id).map(x => x.disposition)).toEqual(['PENDING', 'STEERED'])
})

test('STEER 抵達時回合已結束（validating）但執行活著且支援 queue → TOO_LATE_QUEUED 進 FIFO', () => {
  const dir = root()
  const obs = liveExecution(dir)
  obs.control.onEvent!({ type: 'exit', code: 0, reason: 'exit' })
  expect(obs.snapshot().phase).toBe('validating')
  const r = submit(dir, { mode: 'STEER', instruction: '收尾時記得補測試' })
  expect(r.ok).toBe(true)
  expect(r.envelope.disposition).toBe('TOO_LATE_QUEUED')
  expect(r.envelope.requestedMode).toBe('STEER')
  expect(store(dir).takeInFlight('exec-1')).toBeUndefined() // 已轉 queue，不再走 in-flight 通道
  expect(store(dir).peekQueue('exec-1').map(e => e.instruction)).toEqual(['收尾時記得補測試'])
})

// ── QUEUE：per-execution FIFO，drain 後 DELIVERED，收據可追溯 ──

test('兩筆 QUEUE → FIFO 順序 drain，皆 DELIVERED 且各有不可變收據', () => {
  const dir = root()
  liveExecution(dir)
  const a = submit(dir, { instruction: '第一件事' })
  const b = submit(dir, { instruction: '第二件事' })
  expect(a.envelope.disposition).toBe('QUEUED')
  expect(b.envelope.disposition).toBe('QUEUED')

  const batch = store(dir).peekQueue('exec-1')
  expect(batch.map(e => e.instruction)).toEqual(['第一件事', '第二件事'])
  store(dir).markDelivered(batch)
  const resolved = store(dir).list().resolved
  expect(resolved.find(e => e.id === a.envelope.id)?.disposition).toBe('DELIVERED')
  expect(resolved.find(e => e.id === b.envelope.id)?.disposition).toBe('DELIVERED')
  for (const env of [a.envelope, b.envelope]) {
    const receipts = receiptsFor(dir, env.id)
    expect(receipts.map(r => r.disposition)).toEqual(['QUEUED', 'DELIVERED'])
    for (const r of receipts) expect(receiptDigestOk(r)).toBe(true)
  }
})

test('QUEUE 綁定 exact execution：drain 別的 execution 拿不到，restart 後不誤投', () => {
  const dir = root()
  liveExecution(dir, 'exec-old')
  submit(dir, { executionId: 'exec-old', instruction: '舊執行的指示' })
  // daemon「重啟後的新 execution」：另一個 executionId → peek 不得取得舊信封
  expect(store(dir).peekQueue('exec-new')).toEqual([])
  expect(store(dir).list().pending).toHaveLength(1) // 舊信封仍 pending，未被誤投
})

// ── STALE / NOT_DELIVERED：過期、目標終結、host 消失皆 fail closed ──

test('pending 信封逾 TTL → sweep 後 STALE', () => {
  const dir = root()
  liveExecution(dir)
  const r = submit(dir, { instruction: '會過期的指示' })
  const now = Date.now() + CONTROL_TTL_MS + 1
  expect(store(dir).sweep(now)).toBe(1)
  const after = store(dir).list().resolved.find(e => e.id === r.envelope.id)!
  expect(after.disposition).toBe('STALE')
})

test('目標執行 terminal 後 pending queue → sweep STALE；pending steer → NOT_DELIVERED', () => {
  const dir = root()
  const obs = liveExecution(dir)
  const q = submit(dir, { mode: 'QUEUE', instruction: '排隊中' })
  const st = submit(dir, { mode: 'STEER', instruction: 'in-flight 中' })
  expect(st.envelope.disposition).toBe('PENDING')
  obs.finish('completed')
  store(dir).sweep()
  const resolved = store(dir).list().resolved
  expect(resolved.find(e => e.id === q.envelope.id)?.disposition).toBe('STALE')
  expect(resolved.find(e => e.id === st.envelope.id)?.disposition).toBe('NOT_DELIVERED')
})

test('host 進程消失（daemon 重啟舊執行未確認）→ pending 信封 sweep 為 STALE，不等待不誤投', () => {
  const dir = root()
  liveExecution(dir, 'exec-orphan')
  const r = submit(dir, { executionId: 'exec-orphan', mode: 'QUEUE', instruction: '給孤兒執行' })
  expect(r.envelope.disposition).toBe('QUEUED') // 提交時宿主仍活著 → 受理
  // 模擬 daemon 重啟前的宿主死亡：快照仍在但 hostPid 已不存在（非終端、未確認）
  const file = join(dir, 'executions', 'exec-orphan.json')
  const snap = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>
  writeFileSync(file, JSON.stringify({ ...snap, hostPid: 4_000_000 }))
  expect(store(dir).sweep()).toBe(1)
  expect(store(dir).list().resolved.find(e => e.id === r.envelope.id)?.disposition).toBe('STALE')
})

test('endExecution 收尾：未取走的 steer → NOT_DELIVERED、未送達的 queue → STALE', () => {
  const dir = root()
  liveExecution(dir)
  const st = submit(dir, { mode: 'STEER' })
  const q = submit(dir, { mode: 'QUEUE', instruction: '另一則' })
  store(dir).endExecution('exec-1')
  const resolved = store(dir).list().resolved
  expect(resolved.find(e => e.id === st.envelope.id)?.disposition).toBe('NOT_DELIVERED')
  expect(resolved.find(e => e.id === q.envelope.id)?.disposition).toBe('STALE')
})

// ── scheduler 端到端：QUEUE 在回合邊界由同一 execution 的後續回合送達 ──

function initGitRepo(dir: string): void {
  execFileSync('git', ['init', '-b', 'main'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.email', 'adng-test@example.com'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.name', 'adng-test'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'core.autocrlf', 'false'], { cwd: dir, stdio: 'ignore' })
  writeFileSync(join(dir, 'README.md'), '# adng test repo\n')
  execFileSync('git', ['add', '.'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', 'chore: init'], { cwd: dir, stdio: 'ignore' })
}

function e2eDeps(dir: string, engine: MockEngine): Deps {
  const backlogFile = join(dir, 'BACKLOG.md')
  writeFileSync(backlogFile, '- [ ] 任務一\n')
  const cfg = ConfigSchema.parse({
    projectPath: dir, backlogFile, dataDir: join(dir, 'data'),
    engines: { mock: { adapter: 'mock', executionMode: 'observed' } }, defaultEngine: 'mock',
    stopFile: join(dir, '.adng.stop'), worktreesDir: join(dir, 'worktrees'), timezoneOffsetHours: 0,
  })
  return { cfg, store: new BacklogStore(backlogFile), db: new RunDb(join(dir, 'run.db')), engines: { resolve: () => engine }, events: new EventLog(cfg.dataDir) }
}

test('e2e：執行中收到 QUEUE → 同 execution 的下一回合帶入指示，信封 DELIVERED、receipt 可追溯', async () => {
  const dir = root()
  initGitRepo(dir)
  const dataDir = join(dir, 'data')
  // 首個 mock 回合進行中（beforeResult 同步鉤子）由操作員對同一 executionId 排入一則 QUEUE
  const engine = new MockEngine([{
    ok: true,
    beforeResult: job => {
      const r = new ControlStore(dataDir).submit({
        project: 'proj', executionId: job.executionId!, mode: 'QUEUE',
        instruction: '只修 parser，別碰 migration', issuer: 'op', channel: 'cli',
      })
      expect(r.envelope.disposition).toBe('QUEUED')
    },
  }])
  const d = e2eDeps(dir, engine)

  const result = await runOnce(d)

  expect(result).toBe('done')
  expect(engine.calls.length).toBe(2) // 首回合 + queue follow-up 回合
  expect(engine.calls[1]!.directive).toContain('只修 parser，別碰 migration')
  const resolved = new ControlStore(dataDir).list().resolved
  expect(resolved).toHaveLength(1)
  expect(resolved[0]).toMatchObject({ mode: 'QUEUE', disposition: 'DELIVERED', taskId: engine.calls[0]!.task.id })
  const events = readFileSync(join(dataDir, 'events.jsonl'), 'utf8')
  expect(events).toContain('"type":"control-delivered"')
}, 30_000)

// ── 操作面：handleCommand（Discord）與 executionCli（CLI）──

test('bot 面：steer/enqueue 經 handleCommand 受理、issuer 落收據、controls 可分辨 pending/delivered', async () => {
  const dir = root()
  initGitRepo(dir)
  const d = e2eDeps(dir, new MockEngine())
  const cfgPath = join(dir, 'proj.json')
  writeFileSync(cfgPath, '{}')
  liveExecution(d.cfg.dataDir, 'exec-op')
  const deps = { cfg: d.cfg, store: d.store, db: d.db, llm: { model: 'm', apiKey: 'k' }, cfgPath, events: d.events }
  const { handleCommand } = await import('../src/bot/handlers.js')

  const steer = await handleCommand('steer', 'exec-op 先別動 migration', deps, { issuer: 'u9' })
  expect(steer.ok).toBe(true)
  expect(steer.text).toContain('已受理')
  const enq = await handleCommand('enqueue', 'exec-op 記得補測試', deps, { issuer: 'u9' })
  expect(enq.ok).toBe(true)
  expect(enq.text).toContain('已排隊')

  const list = new ControlStore(d.cfg.dataDir).list()
  expect(list.pending).toHaveLength(2)
  const out = await handleCommand('controls', '', deps)
  expect(out.ok).toBe(true)
  expect(out.text).toContain('PENDING')
  expect(out.text).toContain('QUEUED')
  // issuer 落進收據：discord:u9
  const receipt = receiptsFor(d.cfg.dataDir, list.pending[0]!.id)[0]!
  expect(receipt.issuer).toBe('discord:u9')
  // 指令參數格式錯誤 → 人話用法
  const bad = await handleCommand('steer', '只有id沒有指示', deps, { issuer: 'u9' })
  expect(bad.ok).toBe(false)
  expect(bad.text).toContain('用法')
})

test('CLI 面：executionCli enqueue/controls/steer 對真實執行快照運作，拒絕時 exitCode=1', async () => {
  const dir = root()
  const dataDir = join(dir, 'data')
  liveExecution(dataDir, 'exec-cli')
  const cfgFile = join(dir, 'proj.json')
  writeFileSync(cfgFile, JSON.stringify({
    projectPath: dir, backlogFile: join(dir, 'BACKLOG.md'), dataDir,
    engine: 'mock', stopFile: join(dir, '.adng.stop'), worktreesDir: join(dir, 'worktrees'),
  }))
  const { executionCli } = await import('../src/cli/executions.js')
  const logs: string[] = []
  const spy = vi.spyOn(console, 'log').mockImplementation((m?: unknown) => { logs.push(String(m)) })
  try {
    executionCli(['enqueue', '--config', cfgFile, '--id', 'exec-cli', '--text', 'CLI 排的指示'])
    expect(JSON.parse(logs.at(-1)!)).toMatchObject({ ok: true, disposition: 'QUEUED' })
    logs.length = 0
    executionCli(['controls', '--config', cfgFile])
    expect(logs.join('\n')).toContain('QUEUED')
    executionCli(['steer', '--config', cfgFile, '--id', 'ghost-exec', '--text', '不存在的目標'])
    expect(JSON.parse(logs.at(-1)!)).toMatchObject({ ok: false, disposition: 'REJECTED_STALE_TARGET' })
    expect(process.exitCode).toBe(1)
  } finally { spy.mockRestore(); process.exitCode = undefined }
})

test('e2e：STEER 於引擎運行中送達 → MockEngine 透過 steer port 取得指示，信封 STEERED', async () => {
  const dir = root()
  initGitRepo(dir)
  const dataDir = join(dir, 'data')
  const engine = new MockEngine([{ ok: true, steerWaitMs: 3000 }])
  const d = e2eDeps(dir, engine)

  const run = runOnce(d)
  // 等 execution 快照落地（observed 模式於 engine.run 前建立）
  let executionId = ''
  await vi.waitFor(() => {
    const folder = join(dataDir, 'executions')
    const file = existsSync(folder) ? readdirSync(folder).find(f => f.endsWith('.json') && !f.endsWith('.cancel.json')) : undefined
    expect(file).toBeTruthy()
    executionId = file!.replace(/\.json$/, '')
  }, { timeout: 10_000, interval: 10 })
  const r = new ControlStore(dataDir).submit({
    project: 'proj', executionId, mode: 'STEER', instruction: '改方向：只補測試', issuer: 'op', channel: 'cli',
  })
  expect(r.envelope.disposition).toBe('PENDING')

  await run
  expect(engine.steeredInstructions).toEqual(['改方向：只補測試'])
  expect(new ControlStore(dataDir).list().resolved.find(e => e.id === r.envelope.id)?.disposition).toBe('STEERED')
}, 30_000)
