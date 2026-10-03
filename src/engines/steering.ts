import { createHash, randomUUID } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { writeJsonAtomic } from '../guardian/incident.js'
import { ENGINE_CAPABILITIES, type Adapter } from './capabilities.js'
import { readExecutions } from './execution-observation.js'
import type { SteerPort } from './run-control.js'

/** Issue #11：人類 follow-up 是 target-bound command envelope，不是自由漂移的聊天文字。
 *  STEER＝送到正在跑的回合（需 adapter 具備 in-flight 能力）；QUEUE＝同一 execution
 *  的下一個安全回合邊界才送達（per-execution FIFO）。絕不跨 execution/task 投遞——
 *  目標不存在、已終結、宿主死亡或逾 TTL 一律 fail closed（STALE / NOT_DELIVERED /
 *  REJECTED_STALE_TARGET），每次狀態轉移都寫 hash 收據可稽核。 */

export const CONTROL_TTL_MS = 30 * 60_000
export const MAX_CONTROL_INSTRUCTION_LEN = 500
const MAX_PENDING_PER_EXECUTION = 16
const SAFE_ID = /^[A-Za-z0-9_-]{1,100}$/

const DISPOSITIONS = [
  'PENDING', 'QUEUED', 'STEERED', 'DELIVERED', 'TOO_LATE_QUEUED',
  'REJECTED_INVALID', 'REJECTED_STALE_TARGET', 'UNSUPPORTED', 'NOT_DELIVERED', 'STALE',
] as const
export type ControlDisposition = (typeof DISPOSITIONS)[number]
export type ControlMode = 'STEER' | 'QUEUE'

const EnvelopeSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().regex(SAFE_ID),
  project: z.string().max(200),
  taskId: z.string().max(200),
  executionId: z.string().min(1).max(200),
  requestedMode: z.enum(['STEER', 'QUEUE']),
  mode: z.enum(['STEER', 'QUEUE']),
  instruction: z.string().max(1000),
  instructionHash: z.string().regex(/^[a-f0-9]{64}$/),
  issuer: z.string().max(200),
  channel: z.string().max(40),
  adapter: z.string().max(100).optional(),
  /** 提交當下目錄中既存信封數＋1：同毫秒併發提交仍保 FIFO 次序（跨 process 同刻碰撞以 id 決定論收尾）。 */
  seq: z.number().int().nonnegative(),
  createdAt: z.number().finite(),
  expiresAt: z.number().finite(),
  state: z.enum(['pending', 'resolved']),
  disposition: z.enum(DISPOSITIONS),
  resolvedAt: z.number().finite().optional(),
  detail: z.string().max(500).optional(),
})
export type ControlEnvelope = z.infer<typeof EnvelopeSchema>

export interface ControlRequest {
  project: string
  executionId: string
  mode: ControlMode
  instruction: string
  issuer: string
  channel: string
  now?: number
}

export interface ControlReply { ok: boolean; text: string; envelope: ControlEnvelope }
export interface ControlList { pending: ControlEnvelope[]; resolved: ControlEnvelope[]; errors: string[] }

type EventSink = { append(type: string, data?: Record<string, unknown>): void }

/** 託管主機存活性：EPERM＝活著但非我方可碰（仍視為活）；其餘錯誤（ESRCH/EINVAL）＝不在。 */
function pidAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false
  try { process.kill(pid, 0); return true } catch (e) { return (e as NodeJS.ErrnoException).code === 'EPERM' }
}

/** 指令注入防線（鏡像 /task 的 untrusted-input 規則）：單行、無 HTML/adng 註記、有界長度。
 *  擋下的內容不得進引擎 prompt——單行限制同時防止在 directive 內偽造多行結構。 */
function instructionViolation(text: string): string | null {
  if (!text.trim()) return '指示內容為空'
  if ([...text].length > MAX_CONTROL_INSTRUCTION_LEN) return `指示過長（上限 ${MAX_CONTROL_INSTRUCTION_LEN} 字）`
  if (/[\r\n]/.test(text)) return '指示內容不可含換行'
  if (text.includes('<!--') || text.includes('-->') || /(^|\s)adng:/i.test(text)) return '指示內容含不允許的控制註記'
  return null
}

export class ControlStore {
  constructor(private readonly dataDir: string, private readonly events?: EventSink) {}

  private controlsDir(): string { return join(this.dataDir, 'controls') }
  private receiptsDir(): string { return join(this.dataDir, 'controls', 'receipts') }
  private file(id: string): string { return join(this.controlsDir(), `${id}.json`) }

  private emit(type: string, env: ControlEnvelope): void {
    try {
      this.events?.append(type, {
        envelopeId: env.id, executionId: env.executionId, taskId: env.taskId,
        requestedMode: env.requestedMode, disposition: env.disposition,
        issuer: env.issuer, channel: env.channel,
      })
    } catch { /* 事件面故障不改變控制語意（收據仍為權威紀錄） */ }
  }

  private persist(env: ControlEnvelope): void { writeJsonAtomic(this.file(env.id), env) }

  /** 每次狀態轉移寫一份不可變收據：issuer、target、hash、requested mode、actual disposition、時間戳。 */
  private writeReceipt(env: ControlEnvelope): void {
    const body = {
      schemaVersion: 1, envelopeId: env.id, project: env.project,
      executionId: env.executionId, taskId: env.taskId,
      requestedMode: env.requestedMode, disposition: env.disposition,
      issuer: env.issuer, channel: env.channel, instructionHash: env.instructionHash,
      occurredAt: new Date().toISOString(),
      ...(env.detail ? { detail: env.detail } : {}),
    }
    const bundleHash = createHash('sha256').update(JSON.stringify(body)).digest('hex')
    // 檔名帶序號前綴讓字典序＝時間序；尾綴 uuid 保證跨 process 寫入不撞名。
    const dir = this.receiptsDir()
    const seq = existsSync(dir) ? readdirSync(dir).filter(f => f.startsWith(`${env.id}-`)).length : 0
    writeJsonAtomic(join(dir, `${env.id}-${String(seq).padStart(4, '0')}-${env.disposition.toLowerCase()}-${randomUUID().slice(0, 8)}.json`), { ...body, bundleHash })
  }

  /** pending 信封的終態轉移（STEERED/DELIVERED/STALE/NOT_DELIVERED）。 */
  private transition(env: ControlEnvelope, disposition: ControlDisposition, detail?: string): void {
    env.state = 'resolved'; env.disposition = disposition; env.resolvedAt = Date.now()
    if (detail) env.detail = detail
    this.persist(env); this.writeReceipt(env); this.emit('control-resolve', env)
  }

  /** 提交當下的結案／暫存：一律先寫 disposition 再落地＋收據＋事件（回覆以 envelope.disposition 為準）。 */
  private reply(env: ControlEnvelope, disposition: ControlDisposition, ok: boolean, text: string, detail?: string): ControlReply {
    env.disposition = disposition
    env.state = disposition === 'PENDING' || disposition === 'QUEUED' || disposition === 'TOO_LATE_QUEUED' ? 'pending' : 'resolved'
    if (env.state === 'resolved') env.resolvedAt = Date.now()
    if (detail) env.detail = detail
    this.persist(env); this.writeReceipt(env); this.emit('control-submit', env)
    return { ok, text, envelope: env }
  }

  private readAll(): { envelopes: ControlEnvelope[]; errors: string[] } {
    const envelopes: ControlEnvelope[] = [], errors: string[] = []
    const dir = this.controlsDir()
    if (!existsSync(dir)) return { envelopes, errors }
    let files: string[]
    try { files = readdirSync(dir).filter(f => f.endsWith('.json')) }
    catch { return { envelopes, errors: ['control inventory unavailable'] } }
    if (files.length > 10_000) return { envelopes, errors: ['control inventory exceeds 10000 records'] }
    for (const file of files) {
      try {
        if (statSync(join(dir, file)).size > 16_384) throw new Error('oversized record')
        const env = EnvelopeSchema.parse(JSON.parse(readFileSync(join(dir, file), 'utf8')))
        if (file !== `${env.id}.json`) throw new Error('identity mismatch')
        envelopes.push(env)
      } catch { errors.push(`invalid control record: ${file.slice(0, 110)}`) }
    }
    // FIFO 次序鍵：seq（落盤序）→ createdAt → id，三者皆決定論。
    envelopes.sort((a, b) => a.seq - b.seq || a.createdAt - b.createdAt || a.id.localeCompare(b.id))
    return { envelopes, errors }
  }

  private envelopeCount(): number {
    try { return readdirSync(this.controlsDir()).filter(f => f.endsWith('.json')).length } catch { return 0 }
  }

  /** 同一 execution 的 pending FIFO（seq, createdAt, id 排序——跨 process 寫入亦決定論）。 */
  private pendingFor(executionId: string, now: number): ControlEnvelope[] {
    return this.readAll().envelopes
      .filter(e => e.state === 'pending' && e.executionId === executionId && e.expiresAt > now)
  }

  /**
   * 提交控制信封。回覆 ok=true 僅代表「受理進入投遞管線」（PENDING/QUEUED/TOO_LATE_QUEUED）；
   * 最終送達與否以 /controls 查詢或收據為準。任何拒絕（REJECTED_*／UNSUPPORTED）同樣落收據。
   */
  submit(args: ControlRequest): ControlReply {
    const now = args.now ?? Date.now()
    const env: ControlEnvelope = {
      schemaVersion: 1, id: randomUUID(),
      project: args.project.slice(0, 200), taskId: '', executionId: args.executionId.slice(0, 200),
      requestedMode: args.mode, mode: args.mode,
      instruction: args.instruction.slice(0, 1000),
      instructionHash: createHash('sha256').update(args.instruction).digest('hex'),
      issuer: args.issuer.slice(0, 200), channel: args.channel.slice(0, 40),
      seq: this.envelopeCount() + 1,
      createdAt: now, expiresAt: now + CONTROL_TTL_MS,
      state: 'resolved', disposition: 'REJECTED_INVALID',
    }
    if (!SAFE_ID.test(args.executionId))
      return this.reply(env, 'REJECTED_INVALID', false, `控制指令被拒：executionId 格式不合法`)
    const violation = instructionViolation(args.instruction)
    if (violation) return this.reply(env, 'REJECTED_INVALID', false, `控制指令被拒：${violation}`)
    try { this.sweep(now) } catch { /* 治理故障不擋新請求的 fail-closed 判定 */ }

    const record = readExecutions(this.dataDir, now).records.find(r => r.executionId === args.executionId)
    if (!record || record.phase === 'terminal' || !pidAlive(record.hostPid)) {
      env.taskId = record?.taskId ?? ''
      if (record) env.adapter = record.adapter
      return this.reply(env, 'REJECTED_STALE_TARGET', false, '目標執行不存在、已終結或宿主已不在；已拒絕（fail closed，不投遞至其他執行）')
    }
    env.taskId = record.taskId
    env.adapter = record.adapter
    const cap = ENGINE_CAPABILITIES[record.adapter as Adapter]?.control
    const inFlight = cap?.inFlightSteer === true, nextTurn = cap?.nextTurnQueue === true

    const pending = this.pendingFor(record.executionId, now)
    if (pending.some(e => e.instructionHash === env.instructionHash))
      return this.reply(env, 'REJECTED_INVALID', false, '控制指令被拒：相同指示已在 pending 佇列中（拒絕重放）')
    if (pending.length >= MAX_PENDING_PER_EXECUTION)
      return this.reply(env, 'REJECTED_INVALID', false, `控制指令被拒：此執行的待處理信封已達上限 ${MAX_PENDING_PER_EXECUTION}`)

    if (args.mode === 'STEER') {
      if (record.phase === 'running') {
        if (!inFlight)
          return this.reply(env, 'UNSUPPORTED', false, `引擎 ${record.adapter} 不支援 in-flight steer；請改用 /enqueue 排入下一回合`)
        return this.reply(env, 'PENDING', true,
          `已受理 STEER：待引擎於安全點接收（信封 ${env.id.slice(0, 8)} → 執行 ${env.executionId.slice(0, 8)}）；以 /controls 追蹤最終狀態`)
      }
      // 回合已結束但執行仍活著：明確轉為 next-turn queue（receipt 記錄，非 silent fallback）。
      if (!nextTurn)
        return this.reply(env, 'UNSUPPORTED', false, `回合已結束且引擎 ${record.adapter} 不支援 next-turn queue（UNSUPPORTED）`)
      env.mode = 'QUEUE'
      return this.reply(env, 'TOO_LATE_QUEUED', true,
        `目標回合已結束：已改排入執行 ${env.executionId.slice(0, 8)} 的下一安全回合（TOO_LATE_QUEUED，信封 ${env.id.slice(0, 8)}）`,
        'STEER 抵達時回合已結束，轉入同一 execution 的 FIFO')
    }

    if (!nextTurn)
      return this.reply(env, 'UNSUPPORTED', false, `引擎 ${record.adapter} 不支援 next-turn queue（UNSUPPORTED）`)
    // 誠實標註：回合邊界已過（validating 等）時送達窗口可能已不存在——信封照收，結案以收據為準。
    const pastBoundary = record.phase !== 'running'
    return this.reply(env, 'QUEUED', true,
      `已排隊：將於執行 ${env.executionId.slice(0, 8)} 的下一安全回合送出（信封 ${env.id.slice(0, 8)}）`,
      pastBoundary ? '目標回合邊界已過；若無後續回合，信封將結案為 STALE' : undefined)
  }

  /** adapter 的 in-flight 通道：於其安全點輪詢；取到即轉 STEERED（一次性，不重送）。 */
  takeInFlight(executionId: string, now = Date.now()): string | undefined {
    const next = this.pendingFor(executionId, now).find(e => e.mode === 'STEER')
    if (!next) return undefined
    this.transition(next, 'STEERED')
    return next.instruction
  }

  /** 供 scheduler 接進 job.control.steer；adapter 於自家安全邊界呼叫 poll()。 */
  steerPort(executionId: string): SteerPort {
    return { poll: () => { try { return this.takeInFlight(executionId) } catch { return undefined } } }
  }

  /** 回合邊界（scheduler follow-up turn 前）讀出全部 pending QUEUE（不轉態）；
   *  配對 markDelivered——只有引擎真的跑完該回合才把信封記 DELIVERED，避免「收據說已送達但其實沒送出」。 */
  peekQueue(executionId: string, now = Date.now()): ControlEnvelope[] {
    return this.pendingFor(executionId, now).filter(e => e.mode === 'QUEUE')
  }

  markDelivered(batch: ControlEnvelope[]): void {
    for (const env of batch) {
      try { this.transition(env, 'DELIVERED', '於同一 execution 的 follow-up 回合送出') } catch { /* 單筆收據失敗不擋其餘 */ }
    }
  }

  /** execution 收尾（scheduler finally）：未取走的 pending 一律 fail closed 結案。 */
  endExecution(executionId: string, now = Date.now()): void {
    for (const env of this.readAll().envelopes.filter(e => e.state === 'pending' && e.executionId === executionId)) {
      try {
        this.transition(env, env.mode === 'STEER' ? 'NOT_DELIVERED' : 'STALE', 'execution 已結束，信封不再可安全送達')
      } catch { /* 單筆收尾失敗不影響其餘 */ }
    }
  }

  /** 惰性治理：逾 TTL、目標紀錄消失/終結、宿主進程死亡 → fail closed 結案。回傳結案數。 */
  sweep(now = Date.now()): number {
    const pending = this.readAll().envelopes.filter(e => e.state === 'pending')
    if (!pending.length) return 0
    const inventory = readExecutions(this.dataDir, now)
    // 快照清單讀取有誤時不做 dead-target 判定（暫時性 IO 故障不該殺掉有效信封；TTL 仍兜底）。
    const targetCheck = inventory.errors.length === 0
    let changed = 0
    for (const env of pending) {
      const record = inventory.records.find(r => r.executionId === env.executionId)
      const dead = targetCheck && (!record || record.phase === 'terminal' || !pidAlive(record.hostPid))
      const disposition: ControlDisposition | null = env.expiresAt <= now ? 'STALE'
        : dead ? (env.mode === 'STEER' ? 'NOT_DELIVERED' : 'STALE')
        : null
      if (!disposition) continue
      try { this.transition(env, disposition, env.expiresAt <= now ? '控制信封逾 TTL 未送達' : '目標執行已不在可投遞狀態'); changed++ }
      catch { /* 治理面故障留待下輪 */ }
    }
    return changed
  }

  /** 查詢面：先做惰性 sweep 再回目前狀態（pending 與 delivered/stale 狀態必須可區分）。 */
  list(now = Date.now()): ControlList {
    try { this.sweep(now) } catch { /* sweep 故障時仍回原始狀態 */ }
    const { envelopes, errors } = this.readAll()
    return {
      pending: envelopes.filter(e => e.state === 'pending'),
      resolved: envelopes.filter(e => e.state === 'resolved'),
      errors,
    }
  }
}

/** /controls 與 `adng execution controls` 共用人話格式：pending 與已結案件分列。 */
export function formatControls(list: ControlList): string {
  const lines = ['adng 控制信封']
  if (!list.pending.length && !list.resolved.length && !list.errors.length) lines.push('尚無控制信封紀錄')
  if (list.pending.length) {
    lines.push(`待處理 ${list.pending.length} 筆：`)
    for (const e of list.pending.slice(0, 20))
      lines.push(`  ${e.id.slice(0, 8)} → ${e.executionId.slice(0, 8)} [${e.disposition}] ${e.instruction.slice(0, 60)}`)
    if (list.pending.length > 20) lines.push(`  …其餘 ${list.pending.length - 20} 筆略`)
  }
  if (list.resolved.length) {
    const recent = list.resolved.slice(-10)
    lines.push(`近期已結 ${recent.length} 筆：`)
    for (const e of recent) lines.push(`  ${e.id.slice(0, 8)} → ${e.executionId.slice(0, 8)} [${e.disposition}]`)
  }
  for (const err of list.errors) lines.push(`⚠ ${err}`)
  return lines.join('\n')
}
