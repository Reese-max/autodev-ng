import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { ConfigSchema, type Config } from '../src/types.js'
import { EventLog } from '../src/events.js'
import { ProblemsLedger, problemFingerprint } from '../src/autopilot/ledger.js'
import { AUTO_GOAL_MARKER, savePerpetualState } from '../src/autopilot/author.js'
import type { SessionResult } from '../src/autopilot/session.js'
import { runPerpetualCycle, perpetualDigestLine, type PerpetualHooks } from '../src/autopilot/perpetual.js'

const NOW = new Date('2026-07-14T00:00:00Z')
const goalIdOf = (obj: string) => createHash('sha1').update(obj).digest('hex').slice(0, 4)
// better-sqlite3 WAL 在 Windows 上關閉後 sidecar 檔案 handle 偶有滯後，temp 目錄清理容忍 EPERM。
function safeRm(dir: string): void { try { rmSync(dir, { recursive: true, force: true }) } catch { /* windows handle lag */ } }

type PCfg = Config & { perpetual?: boolean; perpetualCooldownMs?: number; perpetualValueThreshold?: number }

function makeCfg(dir: string, over: Partial<PCfg> = {}): PCfg {
  const base = ConfigSchema.parse({
    projectPath: dir,
    backlogFile: join(dir, 'BACKLOG.md'),
    dataDir: dir,
    goalFile: join(dir, 'GOAL.md'),
    stopFile: join(dir, '.adng.stop'),
    engine: 'mock',
    verifyCommand: 'npm test',
    dailyHardUsd: 100
  })
  return { ...base, perpetual: true, perpetualCooldownMs: 6000, perpetualValueThreshold: 6, ...over }
}

const achieved: SessionResult = { goalId: 'abcd', outcome: { kind: 'achieved', rounds: 3 } }

function makeHooks(over: Partial<PerpetualHooks> = {}): PerpetualHooks {
  return {
    now: () => NOW,
    discover: vi.fn(async () => ({ survey: '', ranked: [] })),
    author: vi.fn(async () => null),
    runSession: vi.fn(async (): Promise<SessionResult> => achieved),
    billedToday: () => 0,
    ...over
  }
}

function eventTypes(dir: string): string[] {
  const f = join(dir, 'events.jsonl')
  if (!existsSync(f)) return []
  return readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l).type as string)
}
function readEvents(dir: string): Record<string, unknown>[] {
  const f = join(dir, 'events.jsonl')
  if (!existsSync(f)) return []
  return readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l))
}
function readState(dir: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(dir, 'perpetual-state.json'), 'utf8'))
}
function autoGoalMd(fp: string, objective: string): string {
  return `${AUTO_GOAL_MARKER} problem:${fp} -->\n# GOAL\n\n${objective}\n\n## 驗收\n\n\`\`\`sh\nnpm test\n\`\`\`\n\n連續無進展上限：2\n`
}

describe('runPerpetualCycle 前置閘（安靜讓路）', () => {
  let dir: string; let events: EventLog
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'adng-perp-')); events = new EventLog(dir) })
  afterEach(() => safeRm(dir))

  test('perpetual!==true → false，discover 未呼叫、無狀態/事件', async () => {
    const hooks = makeHooks()
    const r = await runPerpetualCycle(makeCfg(dir, { perpetual: false }), dir, events, async () => true, hooks)
    expect(r).toBe(false)
    expect(hooks.discover).not.toHaveBeenCalled()
    expect(eventTypes(dir)).toEqual([])
    expect(existsSync(join(dir, 'perpetual-state.json'))).toBe(false)
  })

  test('stopFile 存在 → false，discover 未呼叫', async () => {
    const cfg = makeCfg(dir)
    writeFileSync(cfg.stopFile, '')
    const hooks = makeHooks()
    const r = await runPerpetualCycle(cfg, dir, events, async () => true, hooks)
    expect(r).toBe(false)
    expect(hooks.discover).not.toHaveBeenCalled()
    expect(eventTypes(dir)).toEqual([])
  })

  test('billedToday >= dailyHardUsd → false，discover 未呼叫', async () => {
    const hooks = makeHooks({ billedToday: () => 100 })
    const r = await runPerpetualCycle(makeCfg(dir), dir, events, async () => true, hooks)
    expect(r).toBe(false)
    expect(hooks.discover).not.toHaveBeenCalled()
    expect(eventTypes(dir)).toEqual([])
  })

  test('冷卻窗內 → false，狀態不變、discover 未呼叫', async () => {
    savePerpetualState(dir, { lastSessionTs: '2026-07-13T23:59:59Z', consecutiveEmpty: 0, currentCooldownMs: 6000, manualGoalDone: '' })
    const hooks = makeHooks()
    const r = await runPerpetualCycle(makeCfg(dir), dir, events, async () => true, hooks)
    expect(r).toBe(false)
    expect(hooks.discover).not.toHaveBeenCalled()
    expect(readState(dir).consecutiveEmpty).toBe(0)
    expect(readState(dir).lastSessionTs).toBe('2026-07-13T23:59:59Z')
  })
})

describe('runPerpetualCycle 手動 GOAL', () => {
  let dir: string; let events: EventLog
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'adng-perp-')); events = new EventLog(dir) })
  afterEach(() => safeRm(dir))

  const manualMd = '# GOAL\n\n手動目標甲\n\n## 驗收\n\n```sh\nnpm test\n```\n'

  test('無標記手動 GOAL → runSession({}) 被呼叫、manualGoalDone 記錄、GOAL 不刪、回 true', async () => {
    const cfg = makeCfg(dir)
    writeFileSync(cfg.goalFile!, manualMd)
    const notify = vi.fn(async () => true)
    const hooks = makeHooks()
    const r = await runPerpetualCycle(cfg, dir, events, notify, hooks)
    expect(r).toBe(true)
    expect(hooks.runSession).toHaveBeenCalledWith({})
    expect(readState(dir).manualGoalDone).toBe(goalIdOf('手動目標甲'))
    expect(existsSync(cfg.goalFile!)).toBe(true) // 手動 GOAL 絕不代刪
    expect(notify).toHaveBeenCalledTimes(1)
  })

  test('同 goalId 第二次 → false 不重跑', async () => {
    const cfg = makeCfg(dir)
    writeFileSync(cfg.goalFile!, manualMd)
    savePerpetualState(dir, { lastSessionTs: '', consecutiveEmpty: 0, currentCooldownMs: 6000, manualGoalDone: goalIdOf('手動目標甲') })
    const hooks = makeHooks()
    const r = await runPerpetualCycle(cfg, dir, events, async () => true, hooks)
    expect(r).toBe(false)
    expect(hooks.runSession).not.toHaveBeenCalled()
  })
})

describe('runPerpetualCycle auto-goal 殘留', () => {
  let dir: string; let events: EventLog
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'adng-perp-')); events = new EventLog(dir) })
  afterEach(() => safeRm(dir))

  test('標記檔在 → 直接 runSession({}) 續跑、收案回寫 fixed、GOAL 刪除', async () => {
    const cfg = makeCfg(dir)
    const fp = problemFingerprint('殘留問題')
    const ledger = new ProblemsLedger(join(dir, 'run.db'))
    ledger.upsertSeen({ title: '殘留問題', lens: 'tests', value: 7 }, NOW.toISOString())
    ledger.setStatus(fp, 'in-progress', '', 'ldid')
    ledger.close()
    writeFileSync(cfg.goalFile!, autoGoalMd(fp, '殘留目標'))
    const hooks = makeHooks()
    const r = await runPerpetualCycle(cfg, dir, events, async () => true, hooks)
    expect(r).toBe(true)
    expect(hooks.runSession).toHaveBeenCalledWith({})
    const l2 = new ProblemsLedger(join(dir, 'run.db'))
    expect(l2.listByStatus('fixed').map(x => x.fingerprint)).toContain(fp)
    l2.close()
    expect(existsSync(cfg.goalFile!)).toBe(false) // isAutoGoal → 刪
    expect(eventTypes(dir)).toContain('perpetual-session-done')
  })
})

describe('runPerpetualCycle 無 GOAL：discover→立案→收案', () => {
  let dir: string; let events: EventLog
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'adng-perp-')); events = new EventLog(dir) })
  afterEach(() => safeRm(dir))

  test('no-case：discover 回 ranked:[] → consecutiveEmpty+1、event、false', async () => {
    const hooks = makeHooks({ discover: vi.fn(async () => ({ survey: '', ranked: [] })) })
    const r = await runPerpetualCycle(makeCfg(dir), dir, events, async () => true, hooks)
    expect(r).toBe(false)
    expect(readState(dir).consecutiveEmpty).toBe(1)
    expect(readState(dir).lastSessionTs).toBe(NOW.toISOString())
    expect(eventTypes(dir)).toContain('perpetual-no-case')
    expect(hooks.runSession).not.toHaveBeenCalled()
  })

  test('value 閘：全部 value<門檻 → 不 author、不 runSession，open 列仍在；lastSessionTs 更新武裝冷卻、no-case(below-threshold)', async () => {
    const hooks = makeHooks({
      discover: vi.fn(async () => ({ survey: '', ranked: [{ title: '低價問題', lens: 'perf', value: 3, rationale: 'r' }] }))
    })
    const r = await runPerpetualCycle(makeCfg(dir), dir, events, async () => true, hooks)
    expect(r).toBe(false)
    expect(hooks.author).not.toHaveBeenCalled()
    expect(hooks.runSession).not.toHaveBeenCalled()
    const l = new ProblemsLedger(join(dir, 'run.db'))
    expect(l.listByStatus('open').map(x => x.title)).toEqual(['低價問題'])
    l.close()
    // finding 1：value-gate-miss 也真的呼叫了 discover，須武裝冷卻，否則下一 tick 立刻重跑 discover。
    expect(readState(dir).lastSessionTs).toBe(NOW.toISOString())
    expect(readState(dir).consecutiveEmpty).toBe(1)
    // finding 2：candidates 為空（value 全部低於門檻，author 從未被呼叫）→ reason 是 below-threshold，
    // 不是 goal-authoring-failed。
    const noCase = readEvents(dir).find(e => e.type === 'perpetual-no-case')
    expect(noCase?.reason).toBe('below-threshold')
  })

  test('成案全流程：value 8 → author 合法 GOAL → 寫檔 → runSession(achieved) → fixed → GOAL 刪 → true', async () => {
    const cfg = makeCfg(dir)
    const fp = problemFingerprint('高價問題')
    const author = vi.fn(async () => autoGoalMd(fp, '修高價問題'))
    const notify = vi.fn(async () => true)
    const discover = vi.fn(async () => ({ survey: 's', ranked: [{ title: '高價問題', lens: 'tests', value: 8, rationale: 'r' }] }))
    const hooks = makeHooks({ discover, author, runSession: vi.fn(async (): Promise<SessionResult> => achieved) })
    const r = await runPerpetualCycle(cfg, dir, events, notify, hooks)
    expect(r).toBe(true)
    expect(author).toHaveBeenCalledTimes(1)
    expect(hooks.runSession).toHaveBeenCalledWith({ discovered: { survey: 's', ranked: [{ title: '高價問題', lens: 'tests', value: 8, rationale: 'r' }] } })
    const l = new ProblemsLedger(join(dir, 'run.db'))
    const fixed = l.listByStatus('fixed')
    expect(fixed.map(x => x.fingerprint)).toContain(fp)
    expect(fixed[0]!.goalId).toBe(goalIdOf('修高價問題'))
    l.close()
    expect(existsSync(cfg.goalFile!)).toBe(false)
    const evs = eventTypes(dir)
    expect(evs).toContain('perpetual-goal-authored')
    expect(evs).toContain('perpetual-session-done')
    expect(notify).toHaveBeenCalledTimes(1)
  })

  test('deferred 映射：runSession 回 no-progress → 台帳 deferred', async () => {
    const cfg = makeCfg(dir)
    const fp = problemFingerprint('高價問題乙')
    const noProgress: SessionResult = { goalId: 'wxyz', outcome: { kind: 'no-progress', rounds: 2 } }
    const hooks = makeHooks({
      discover: vi.fn(async () => ({ survey: '', ranked: [{ title: '高價問題乙', lens: 'tests', value: 9, rationale: 'r' }] })),
      author: vi.fn(async () => autoGoalMd(fp, '修高價乙')),
      runSession: vi.fn(async (): Promise<SessionResult> => noProgress)
    })
    const r = await runPerpetualCycle(cfg, dir, events, async () => true, hooks)
    expect(r).toBe(true)
    const l = new ProblemsLedger(join(dir, 'run.db'))
    const def = l.listByStatus('deferred')
    expect(def.map(x => x.fingerprint)).toContain(fp)
    expect(def[0]!.note).toContain('no-progress')
    l.close()
    expect(existsSync(cfg.goalFile!)).toBe(false)
  })

  test('author 全敗：3 候選全 null → 各記 deferred(goal-authoring-failed)、event、false；lastSessionTs 更新武裝冷卻', async () => {
    const ranked = [
      { title: 'A 問題', lens: 'tests', value: 9, rationale: 'r' },
      { title: 'B 問題', lens: 'perf', value: 8, rationale: 'r' },
      { title: 'C 問題', lens: 'design', value: 7, rationale: 'r' }
    ]
    const author = vi.fn(async () => null)
    const hooks = makeHooks({ discover: vi.fn(async () => ({ survey: '', ranked })), author })
    const r = await runPerpetualCycle(makeCfg(dir), dir, events, async () => true, hooks)
    expect(r).toBe(false)
    expect(author).toHaveBeenCalledTimes(3)
    expect(hooks.runSession).not.toHaveBeenCalled()
    const l = new ProblemsLedger(join(dir, 'run.db'))
    const def = l.listByStatus('deferred')
    expect(def).toHaveLength(3)
    expect(def.every(x => x.note === 'goal-authoring-failed')).toBe(true)
    l.close()
    expect(eventTypes(dir)).toContain('perpetual-no-case')
    // finding 1：authoring-all-failed 也真的呼叫了 discover+author，須武裝冷卻。
    expect(readState(dir).lastSessionTs).toBe(NOW.toISOString())
    expect(readState(dir).consecutiveEmpty).toBe(1)
    // finding 2：candidates 非空（3 個候選都嘗試過 author）→ reason 是 goal-authoring-failed。
    const noCase = readEvents(dir).find(e => e.type === 'perpetual-no-case')
    expect(noCase?.reason).toBe('goal-authoring-failed')
  })
})

describe('runPerpetualCycle fail-open', () => {
  let dir: string; let events: EventLog
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'adng-perp-')); events = new EventLog(dir) })
  afterEach(() => safeRm(dir))

  test('discover throw → perpetual-error 事件、回 false、不 throw', async () => {
    const hooks = makeHooks({ discover: vi.fn(async () => { throw new Error('boom') }) })
    const r = await runPerpetualCycle(makeCfg(dir), dir, events, async () => true, hooks)
    expect(r).toBe(false)
    expect(eventTypes(dir)).toContain('perpetual-error')
  })

  // finding 3：前置閘（含 billedToday()）現在跑在 try 內——真的 throw 時必須落進外層
  // catch → perpetual-error，不得逸出 runPerpetualCycle（鐵律 #4：整體 try/catch 不得外傳）。
  test('billedToday() throw → perpetual-error 事件、回 false、不 throw', async () => {
    const hooks = makeHooks({ billedToday: () => { throw new Error('billing boom') } })
    const r = await runPerpetualCycle(makeCfg(dir), dir, events, async () => true, hooks)
    expect(r).toBe(false)
    expect(eventTypes(dir)).toContain('perpetual-error')
  })
})

describe('perpetualDigestLine', () => {
  test('組 counts 摘要字串', () => {
    const dir = mkdtempSync(join(tmpdir(), 'adng-perp-'))
    const l = new ProblemsLedger(join(dir, 'run.db'))
    l.upsertSeen({ title: 'p1', lens: 'tests', value: 5 }, NOW.toISOString())
    l.upsertSeen({ title: 'p2', lens: 'perf', value: 8 }, NOW.toISOString())
    l.setStatus(problemFingerprint('p2'), 'fixed', 'done')
    l.close()
    expect(perpetualDigestLine(dir)).toBe('自主工程師台帳：open 1｜fixed 1｜deferred 0')
    safeRm(dir)
  })

  test('故障回 null（不存在的 dataDir 仍安全）', () => {
    // 開一個目錄但塞入損壞 run.db → 建構或查詢丟錯 → null
    const dir = mkdtempSync(join(tmpdir(), 'adng-perp-'))
    writeFileSync(join(dir, 'run.db'), 'not a sqlite file at all')
    expect(perpetualDigestLine(dir)).toBeNull()
    safeRm(dir)
  })
})
