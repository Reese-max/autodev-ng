import Database from 'better-sqlite3'
import { createHash, randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import type { Engine, Job, RunResult } from '../types.js'
import type { EventLog } from '../events.js'
import type { SteerMailbox } from './run-control.js'
import { ENGINE_CAPABILITIES } from './capabilities.js'
import { defaultCommitHash } from './commit-hash.js'
import { activeExecutionFile, isExecutionLive, readActiveExecution } from './active-execution.js'
import { writeJsonAtomic } from '../guardian/incident.js'

/** Issue #11：human follow-up 是 target-bound command envelope，不是自由漂移的聊天文字。
 * 契約：project + taskId + executionId + mode(STEER|QUEUE) + instruction + issuer +
 * createdAt/expiresAt + content hash → delivery → disposition → receipt（本表＋events）。 */

export const CONTROL_INSTRUCTION_MAX = 400
export const CONTROL_TTL_MS = 30 * 60_000
export const FOLLOW_UP_TURN_CAP = 3
export const FOLLOW_UP_BATCH_CAP = 8
const SAFE_ID = /^[A-Za-z0-9_-]{1,100}$/

export type ControlMode = 'steer' | 'queue'
export type ControlState = 'pending' | 'delivered' | 'closed'
export type ControlDisposition =
  | 'QUEUED' | 'STEER_REQUESTED' | 'STEERED' | 'TOO_LATE_QUEUED'
  | 'UNSUPPORTED' | 'REJECTED_STALE_TARGET' | 'REJECTED_REPLAY' | 'REJECTED_INVALID'
  | 'STALE' | 'NOT_DELIVERED'

export interface ControlEnvelope {
  id: string
  project: string
  taskId: string
  executionId: string
  mode: ControlMode
  instruction: string
  issuer: string
  channel: string
  expectedEngineTag?: string
  createdAt: number
  expiresAt: number
  contentHash: string
  state: ControlState
  disposition: ControlDisposition
  phaseBefore?: string
  deliveredAt?: number
  resolvedAt?: number
  detail: string
}

export interface ControlRequest {
  dataDir: string
  project: string
  executionId: string
  taskId?: string
  expectedEngineTag?: string
  mode: ControlMode
  text: string
  issuer: string
  channel: string
  now?: number
}

/** 沿用 /task 的 untrusted-input 邏輯並加嚴：單行、禁 HTML 註解、禁偽造 adng: 系統註記
 * （control 文字會進 worker prompt，絕不能讓 operator 訊息冒充系統 receipt/marker）。 */
export function validateControlText(text: string): string | null {
  if (!text.trim()) return '指示內容不可為空'
  if (/[\r\n]/.test(text)) return '指示內容不可含換行'
  if (text.includes('<!--') || text.includes('-->')) return '指示內容含不允許字元(<!-- -->)'
  if (/adng\s*:/i.test(text)) return '指示內容不可含 adng: 系統註記'
  if ([...text].length > CONTROL_INSTRUCTION_MAX) return `指示內容過長（上限 ${CONTROL_INSTRUCTION_MAX} 字元）`
  return null
}

/** 解析 `execution:<id> [task:<id>] [engine:<tag>] text:<instruction>`；
 * text: 之後全部視為指示本文（可含空格）。無任何 token 時整段視為 text。 */
export function parseControlArg(arg: string): { executionId?: string; taskId?: string; engineTag?: string; text?: string } {
  const m = /(?:^|\s)text:\s*/.exec(arg)
  const head = m ? arg.slice(0, m.index) : arg
  const out: { executionId?: string; taskId?: string; engineTag?: string; text?: string } = {}
  for (const token of head.trim().split(/\s+/)) {
    const kv = /^(\w+):(\S+)$/.exec(token)
    if (!kv) continue
    if (kv[1] === 'execution') out.executionId = kv[2]
    if (kv[1] === 'task') out.taskId = kv[2]
    if (kv[1] === 'engine') out.engineTag = kv[2]
  }
  const text = m ? arg.slice(m.index + m[0].length).trim() : (Object.keys(out).length === 0 ? arg.trim() : '')
  if (text) out.text = text
  return out
}

const norm = (s: string): string => s.replace(/\s+/g, ' ').trim()

interface Row {
  id: string; project: string; task_id: string; execution_id: string; mode: string
  instruction: string; issuer: string; channel: string; expected_engine_tag: string | null
  created_at: number; expires_at: number; content_hash: string; state: string
  disposition: string; phase_before: string | null; delivered_at: number | null
  resolved_at: number | null; detail: string
}

function toEnvelope(r: Row): ControlEnvelope {
  return {
    id: r.id, project: r.project, taskId: r.task_id, executionId: r.execution_id,
    mode: r.mode as ControlMode, instruction: r.instruction, issuer: r.issuer, channel: r.channel,
    ...(r.expected_engine_tag ? { expectedEngineTag: r.expected_engine_tag } : {}),
    createdAt: r.created_at, expiresAt: r.expires_at, contentHash: r.content_hash,
    state: r.state as ControlState, disposition: r.disposition as ControlDisposition,
    ...(r.phase_before ? { phaseBefore: r.phase_before } : {}),
    ...(r.delivered_at !== null ? { deliveredAt: r.delivered_at } : {}),
    ...(r.resolved_at !== null ? { resolvedAt: r.resolved_at } : {}),
    detail: r.detail,
  }
}

/** 控制面持久層：與 attempts 共用 run.db（WAL，bot/CLI/daemon 各自開連線皆安全，
 * 鏡像 ProblemsLedger 慣例）。daemon restart 後 envelope 仍在，但只認 executionId——
 * 舊 execution 死了就 STALE，絕不重綁到新 execution。 */
export class ControlStore {
  private readonly db: Database.Database
  private readonly events?: EventLog

  constructor(file: string, opts: { events?: EventLog; readonly?: boolean } = {}) {
    if (!opts.readonly) mkdirSync(dirname(file), { recursive: true })
    this.db = new Database(file, opts.readonly ? { readonly: true, fileMustExist: true } : {})
    this.events = opts.events
    if (!opts.readonly) {
      this.db.pragma('journal_mode = WAL')
      this.db.pragma('busy_timeout = 3000')
      this.db.exec(`CREATE TABLE IF NOT EXISTS control_envelopes(
        id TEXT PRIMARY KEY,
        dedupe_hash TEXT NOT NULL UNIQUE,
        project TEXT NOT NULL,
        task_id TEXT NOT NULL DEFAULT '',
        execution_id TEXT NOT NULL,
        mode TEXT NOT NULL,
        instruction TEXT NOT NULL,
        issuer TEXT NOT NULL DEFAULT '',
        channel TEXT NOT NULL DEFAULT '',
        expected_engine_tag TEXT,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        content_hash TEXT NOT NULL,
        state TEXT NOT NULL,
        disposition TEXT NOT NULL,
        phase_before TEXT,
        delivered_at INTEGER,
        resolved_at INTEGER,
        detail TEXT NOT NULL DEFAULT ''
      )`)
      this.db.exec('CREATE INDEX IF NOT EXISTS idx_control_envelopes_exec ON control_envelopes(execution_id, state)')
      this.db.exec('CREATE INDEX IF NOT EXISTS idx_control_envelopes_project ON control_envelopes(project, created_at)')
    }
  }

  private emit(type: string, data: Record<string, unknown>): void {
    try { this.events?.append(type, data) } catch { /* 觀測面故障不反殺 */ }
  }

  private insert(e: ControlEnvelope, dedupeHash: string): void {
    this.db.prepare(`INSERT INTO control_envelopes(
      id, dedupe_hash, project, task_id, execution_id, mode, instruction, issuer, channel,
      expected_engine_tag, created_at, expires_at, content_hash, state, disposition,
      phase_before, delivered_at, resolved_at, detail
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      e.id, dedupeHash, e.project, e.taskId, e.executionId, e.mode, e.instruction, e.issuer, e.channel,
      e.expectedEngineTag ?? null, e.createdAt, e.expiresAt, e.contentHash, e.state, e.disposition,
      e.phaseBefore ?? null, e.deliveredAt ?? null, e.resolvedAt ?? null, e.detail)
    this.emit('control-request', { envelopeId: e.id, mode: e.mode, disposition: e.disposition, taskId: e.taskId, executionId: e.executionId, issuer: e.issuer })
  }

  private rejected(args: ControlRequest, disposition: ControlDisposition, detail: string, taskId = ''): { ok: boolean; envelope: ControlEnvelope; reply: string } {
    const now = args.now ?? Date.now()
    const e: ControlEnvelope = {
      id: randomUUID(), project: args.project, taskId, executionId: args.executionId, mode: args.mode,
      instruction: norm(args.text).slice(0, CONTROL_INSTRUCTION_MAX + 100), issuer: args.issuer, channel: args.channel,
      ...(args.expectedEngineTag ? { expectedEngineTag: args.expectedEngineTag } : {}),
      createdAt: now, expiresAt: now + CONTROL_TTL_MS,
      contentHash: '', state: 'closed', disposition, resolvedAt: now, detail,
    }
    e.contentHash = contentHash(e)
    const dedupeHash = dedupe(e)
    try { this.insert(e, dedupeHash) } catch (err) {
      if (String(err).includes('UNIQUE')) return this.replayResult(args, taskId)
      throw err
    }
    return { ok: false, envelope: e, reply: replyFor(e) }
  }

  private replayResult(args: ControlRequest, taskId: string): { ok: boolean; envelope: ControlEnvelope; reply: string } {
    const now = args.now ?? Date.now()
    const e: ControlEnvelope = {
      id: randomUUID(), project: args.project, taskId, executionId: args.executionId, mode: args.mode,
      instruction: norm(args.text).slice(0, CONTROL_INSTRUCTION_MAX), issuer: args.issuer, channel: args.channel,
      createdAt: now, expiresAt: now + CONTROL_TTL_MS, contentHash: '', state: 'closed',
      disposition: 'REJECTED_REPLAY', resolvedAt: now, detail: '相同指示對同一 execution 已存在（dedupe）',
    }
    e.contentHash = contentHash(e)
    this.emit('control-request', { envelopeId: e.id, mode: e.mode, disposition: e.disposition, taskId: e.taskId, executionId: e.executionId, issuer: e.issuer })
    return { ok: false, envelope: e, reply: replyFor(e) }
  }

  /** 控制請求入口：全部決策在此（fail-closed）。回覆文字給 operator；envelope 是收據。 */
  request(args: ControlRequest): { ok: boolean; envelope: ControlEnvelope; reply: string } {
    const now = args.now ?? Date.now()
    const violation = validateControlText(args.text)
    if (violation) return this.rejected(args, 'REJECTED_INVALID', violation)
    if (!SAFE_ID.test(args.executionId)) return this.rejected(args, 'REJECTED_STALE_TARGET', 'execution id 格式無效')

    // 目標必須是「此刻活著的 exact execution」——模糊匹配一律拒絕，絕不落到別的 task。
    const rec = readActiveExecution(args.dataDir, args.executionId)
    if (!rec || !isExecutionLive(rec)) {
      if (rec && rec.phase !== 'terminal') {
        try { this.markRecordTerminal(args.dataDir, rec.executionId) } catch { /* fail-open */ }
      }
      return this.rejected(args, 'REJECTED_STALE_TARGET', 'target execution 不存在、已結束或宿主已停止')
    }
    if (args.taskId && args.taskId !== rec.taskId)
      return this.rejected(args, 'REJECTED_STALE_TARGET', `taskId 不符：execution 屬於 ${rec.taskId}`, rec.taskId)
    if (args.expectedEngineTag && args.expectedEngineTag !== rec.engineTag)
      return this.rejected(args, 'REJECTED_STALE_TARGET', `engineTag 不符：execution 使用 ${rec.engineTag}`, rec.taskId)

    const base: Omit<ControlEnvelope, 'contentHash'> = {
      id: randomUUID(), project: args.project, taskId: rec.taskId, executionId: args.executionId,
      mode: args.mode, instruction: norm(args.text).slice(0, CONTROL_INSTRUCTION_MAX), issuer: args.issuer, channel: args.channel,
      ...(args.expectedEngineTag ? { expectedEngineTag: args.expectedEngineTag } : {}),
      createdAt: now, expiresAt: now + CONTROL_TTL_MS,
      state: 'pending', disposition: 'QUEUED', phaseBefore: rec.phase, detail: '',
    }

    if (args.mode === 'steer') {
      const caps = (ENGINE_CAPABILITIES as Record<string, { controls?: { inFlightSteer: boolean } }>)[rec.adapter]
      if (!caps?.controls?.inFlightSteer)
        return this.rejected({ ...args, text: base.instruction }, 'UNSUPPORTED', `引擎 ${rec.adapter} 不支援 in-flight steer，未注入`, rec.taskId)
      base.disposition = rec.phase === 'engine-run' ? 'STEER_REQUESTED' : 'TOO_LATE_QUEUED'
      base.detail = rec.phase === 'engine-run' ? '等待引擎在 safe boundary 接收' : 'turn 已結束，轉排同一 execution 下個 safe boundary'
    }

    const envelope: ControlEnvelope = { ...base, contentHash: '' }
    envelope.contentHash = contentHash(envelope)
    try { this.insert(envelope, dedupe(envelope)) } catch (err) {
      if (String(err).includes('UNIQUE')) return this.replayResult(args, rec.taskId)
      throw err
    }
    return { ok: true, envelope, reply: replyFor(envelope) }
  }

  /** 測試/內部用：直接落一筆 pending（模擬 restart 前已存在的 queued envelope）。 */
  insertForTest(args: { project: string; executionId: string; taskId?: string; mode?: ControlMode; text: string; issuer?: string; channel?: string; now?: number }): ControlEnvelope {
    const now = args.now ?? Date.now()
    const e: ControlEnvelope = {
      id: randomUUID(), project: args.project, taskId: args.taskId ?? 'task-1', executionId: args.executionId,
      mode: args.mode ?? 'queue', instruction: norm(args.text), issuer: args.issuer ?? 'test', channel: args.channel ?? 'test',
      createdAt: now, expiresAt: now + CONTROL_TTL_MS, contentHash: '', state: 'pending', disposition: 'QUEUED', detail: '',
    }
    e.contentHash = contentHash(e)
    this.insert(e, dedupe(e))
    return e
  }

  pendingFor(executionId: string): ControlEnvelope[] {
    const rows = this.db.prepare("SELECT * FROM control_envelopes WHERE execution_id=? AND state='pending' ORDER BY created_at, rowid").all(executionId) as Row[]
    return rows.map(toEnvelope)
  }

  /** in-flight steer 取件點：adapter 在自己 turn 的 safe boundary 呼叫（engine 端 ack＝take）。
   * 過期的 pending steer 不取件——由 sweep 轉 STALE，不讓引擎吞過期指令。 */
  takeSteer(executionId: string, now = Date.now()): ControlEnvelope | undefined {
    const row = this.db.prepare("SELECT * FROM control_envelopes WHERE execution_id=? AND state='pending' AND disposition='STEER_REQUESTED' AND expires_at>? ORDER BY created_at, rowid LIMIT 1").get(executionId, now) as Row | undefined
    if (!row) return undefined
    this.db.prepare("UPDATE control_envelopes SET state='delivered', disposition='STEERED', delivered_at=?, resolved_at=?, detail=? WHERE id=? AND state='pending'")
      .run(now, now, 'in-flight steer 於引擎 safe boundary 接收', row.id)
    const e = { ...toEnvelope(row), state: 'delivered' as const, disposition: 'STEERED' as const, deliveredAt: now }
    this.emit('control-delivered', { envelopeId: e.id, executionId, disposition: 'STEERED', via: 'in-flight' })
    return e
  }

  markDelivered(ids: string[], detail: string, now = Date.now()): void {
    const stmt = this.db.prepare("UPDATE control_envelopes SET state='delivered', delivered_at=?, resolved_at=?, detail=? WHERE id=? AND state='pending'")
    const tx = this.db.transaction((list: string[]) => { for (const id of list) stmt.run(now, now, detail, id) })
    tx(ids)
    for (const id of ids) this.emit('control-delivered', { envelopeId: id, disposition: 'delivered', via: 'follow-up-turn' })
  }

  markClosed(id: string, disposition: ControlDisposition, detail: string, now = Date.now()): void {
    this.db.prepare("UPDATE control_envelopes SET state='closed', disposition=?, resolved_at=?, detail=? WHERE id=? AND state='pending'")
      .run(disposition, now, detail, id)
    this.emit('control-closed', { envelopeId: id, disposition, detail })
  }

  convertToTooLateQueued(id: string): void {
    this.db.prepare("UPDATE control_envelopes SET disposition='TOO_LATE_QUEUED', detail='turn 在注入前結束，改排下個 safe boundary' WHERE id=? AND state='pending' AND disposition='STEER_REQUESTED'").run(id)
  }

  /** 指定 execution 的 pending 全數 STALE（execution 終結時呼叫）。 */
  sweepExecution(executionId: string, reason: string, now = Date.now()): string[] {
    const pending = this.pendingFor(executionId)
    for (const e of pending) this.markClosed(e.id, 'STALE', reason, now)
    return pending.map(e => e.id)
  }

  sweepExpired(now = Date.now()): string[] {
    const rows = this.db.prepare("SELECT id FROM control_envelopes WHERE state='pending' AND expires_at<=?").all(now) as { id: string }[]
    for (const r of rows) this.markClosed(r.id, 'STALE', 'envelope 已過期')
    return rows.map(r => r.id)
  }

  /** pending 但 target execution 已無 live 紀錄 → STALE（永不改投別的 execution）。
   * 孤兒紀錄（宿主 pid 已死）順便標 terminal，不讓殘影誤導下一次 target 檢查。 */
  sweepDeadTargets(dataDir: string, now = Date.now()): string[] {
    const rows = this.db.prepare("SELECT DISTINCT execution_id FROM control_envelopes WHERE state='pending'").all() as { execution_id: string }[]
    const swept: string[] = []
    for (const { execution_id } of rows) {
      const rec = readActiveExecution(dataDir, execution_id)
      if (isExecutionLive(rec)) continue
      if (rec && rec.phase !== 'terminal') this.markRecordTerminal(dataDir, execution_id)
      swept.push(...this.sweepExecution(execution_id, 'target execution 已結束或 daemon 已重啟', now))
    }
    return swept
  }

  /** daemon/cycle 起點：同 sweepDeadTargets——此頂點本進程無 live execution，
   * 殘留的非 terminal 紀錄（含本 pid 前輪殘留）全數視為孤兒。 */
  sweepOrphans(dataDir: string, now = Date.now()): string[] {
    return this.sweepDeadTargets(dataDir, now)
  }

  private markRecordTerminal(dataDir: string, executionId: string): void {
    const rec = readActiveExecution(dataDir, executionId)
    if (!rec || rec.phase === 'terminal') return
    writeJsonAtomic(activeExecutionFile(dataDir, executionId), { ...rec, phase: 'terminal', orphaned: true, updatedAt: Date.now() })
  }

  list(project: string, limit = 20): ControlEnvelope[] {
    const rows = this.db.prepare('SELECT * FROM control_envelopes WHERE project=? ORDER BY created_at DESC, rowid DESC LIMIT ?').all(project, limit) as Row[]
    return rows.map(toEnvelope)
  }

  /** monitor/status 用：本專案 pending 數；表不存在等故障回 null（fail-open）。 */
  pendingCount(project: string): number | null {
    try {
      const row = this.db.prepare("SELECT COUNT(*) AS n FROM control_envelopes WHERE project=? AND state='pending'").get(project) as { n: number }
      return row.n
    } catch { return null }
  }

  close(): void { try { this.db.close() } catch { /* already closed */ } }
}

function contentHash(e: Omit<ControlEnvelope, 'contentHash'>): string {
  return createHash('sha256').update(JSON.stringify({
    project: e.project, taskId: e.taskId, executionId: e.executionId, mode: e.mode,
    instruction: e.instruction, issuer: e.issuer, channel: e.channel,
    expectedEngineTag: e.expectedEngineTag ?? null, createdAt: e.createdAt, expiresAt: e.expiresAt,
  })).digest('hex')
}

/** dedupe：同 project+taskId+executionId+mode+instruction+issuer 視為同一 envelope，
 * 重放一律 REJECTED_REPLAY（fail closed）。不含時間戳——重放的語意就是內容相同。 */
function dedupe(e: { project: string; taskId: string; executionId: string; mode: string; instruction: string; issuer: string }): string {
  return createHash('sha256').update([e.project, e.taskId, e.executionId, e.mode, e.instruction, e.issuer].join('')).digest('hex')
}

function replyFor(e: ControlEnvelope): string {
  const env = `envelope ${e.id.slice(0, 8)}`
  switch (e.disposition) {
    case 'QUEUED': return `已排隊（QUEUED）→ execution ${e.executionId.slice(0, 8)} 的下一個 safe turn｜${env}`
    case 'STEER_REQUESTED': return `STEER 已送出，等待引擎在 safe boundary 接收｜${env}`
    case 'TOO_LATE_QUEUED': return `此 turn 已結束，改排同一 execution 的下個 safe turn（TOO_LATE_QUEUED）｜${env}`
    case 'UNSUPPORTED': return `UNSUPPORTED：${e.detail}｜${env}`
    case 'REJECTED_STALE_TARGET': return `REJECTED_STALE_TARGET：${e.detail}｜${env}`
    case 'REJECTED_REPLAY': return `REJECTED_REPLAY：${e.detail}`
    case 'REJECTED_INVALID': return `REJECTED_INVALID：${e.detail}`
    default: return `${e.disposition}｜${env}`
  }
}

export function makeSteerMailbox(store: ControlStore, executionId: string): SteerMailbox {
  return { take: () => { const e = store.takeSteer(executionId); return e ? { envelopeId: e.id, instruction: e.instruction } : undefined } }
}

/** /controls 行格式：state 對應「待注入/已排隊/已送達/已結束」，disposition 對應機讀結果。 */
export function formatControlLine(e: ControlEnvelope): string {
  const stateLabel = e.state === 'delivered' ? '已送達'
    : e.state === 'closed' ? '已結束'
    : e.disposition === 'STEER_REQUESTED' ? '待注入' : '已排隊'
  return `${e.id.slice(0, 8)}｜${e.mode}｜${stateLabel}｜${e.disposition}｜exec ${e.executionId.slice(0, 8)}｜task ${e.taskId || '-'}｜${e.instruction.slice(0, 40)}｜${e.issuer}`
}

const FOLLOW_UP_HEADER = '[operator follow-up — 本 execution 的已授權操作者指示；仍受原驗收條件約束]'

/** QUEUE 語意：當前 turn 完成後第一個 safe boundary，以同一 executionId+worktree 續跑
 * 有界 continuation turn 送達。永不進 verify/merge/ownership critical section；
 * stopFile/abort 出現即停，剩餘 pending 由終結 sweep → STALE。 */
export async function deliverControlQueue(
  engine: Engine,
  job: Job,
  initial: RunResult,
  opts: { store: ControlStore; events?: EventLog; paused?: () => boolean; getCommitHash?: (cwd: string) => string | undefined },
): Promise<RunResult> {
  const { store } = opts
  const getCommitHash = opts.getCommitHash ?? defaultCommitHash
  const executionId = job.executionId ?? ''
  let res = initial
  const baseCommitHash = initial.baseCommitHash
  let turns = 0
  while (turns < FOLLOW_UP_TURN_CAP) {
    if (opts.paused?.() || job.control?.signal?.aborted) break
    const pendings = store.pendingFor(executionId)
    const now = Date.now()
    for (const e of pendings.filter(e => e.expiresAt <= now)) store.markClosed(e.id, 'STALE', 'envelope 在送達前過期', now)
    const deliverable = pendings.filter(e => e.expiresAt > now).slice(0, FOLLOW_UP_BATCH_CAP)
    if (!deliverable.length) break
    turns++
    for (const e of deliverable) if (e.disposition === 'STEER_REQUESTED') store.convertToTooLateQueued(e.id)
    const directive = `${job.directive ?? job.task.text}\n\n${FOLLOW_UP_HEADER}\n${deliverable.map(e => `- ${e.instruction}`).join('\n')}`
    let follow: RunResult
    try {
      follow = await engine.run({ ...job, directive })
    } catch (err) {
      for (const e of deliverable) store.markClosed(e.id, 'NOT_DELIVERED', `follow-up turn 引擎故障：${String(err).slice(0, 200)}`)
      try { opts.events?.append('control-delivery-error', { executionId, error: String(err) }) } catch { /* fail-open */ }
      break
    }
    store.markDelivered(deliverable.map(e => e.id), `follow-up turn ${turns} 送達`)
    try { opts.events?.append('control-followup-turn', { executionId, taskId: job.task.id, turn: turns, delivered: deliverable.length }) } catch { /* fail-open */ }
    res = combineRuns(res, follow)
    const commitHash = getCommitHash(job.projectPath)
    if (follow.ok && commitHash && commitHash !== baseCommitHash) {
      res = { ...res, ok: true, commitHash, failureReason: undefined }
    } else if (!follow.ok) {
      res = { ...res, output: joinOutput(res.output, `[operator follow-up turn ${turns} 失敗] ${follow.failureReason ?? '未知'}`) }
    }
    if (follow.recoveryRequired || follow.cancelled) {
      res = { ...res, recoveryRequired: follow.recoveryRequired || undefined, cancelled: follow.cancelled || undefined }
      break
    }
  }
  return res
}

function combineRuns(first: RunResult, second: RunResult): RunResult {
  const steers = [...(first.appliedSteers ?? []), ...(second.appliedSteers ?? [])]
  return {
    ...second,
    commitHash: second.commitHash ?? first.commitHash,
    baseCommitHash: second.baseCommitHash ?? first.baseCommitHash,
    actualModel: first.actualModel === second.actualModel ? first.actualModel : 'multiple/unknown',
    output: joinOutput(first.output, second.output),
    costUsd: first.costUsd + second.costUsd,
    costUnknown: first.costUnknown || second.costUnknown || undefined,
    tokensIn: add(first.tokensIn, second.tokensIn),
    tokensOut: add(first.tokensOut, second.tokensOut),
    tokensCached: add(first.tokensCached, second.tokensCached),
    ...(steers.length ? { appliedSteers: steers } : {}),
  }
}

function joinOutput(first: string, second: string): string { return [first, second].filter(Boolean).join('\n') }
function add(a?: number, b?: number): number | undefined { return a === undefined && b === undefined ? undefined : (a ?? 0) + (b ?? 0) }
