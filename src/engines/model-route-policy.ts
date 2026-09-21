import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { z } from 'zod'
import { modelIdentity } from './free-model-policy.js'

/**
 * Issue #51：非 free-only 純文字 HTTP 呼叫的有界備援＋持久熔斷器。
 * 第一版只做明示順序 fallback——不做 LLM 選路、品質評分或動態價格最佳化。
 * 候選必須事前授權；endpoint／credential 配對固定，不把原候選金鑰帶給下一個候選。
 * 熔斷狀態持久化於 dataDir，重啟不抹掉未到期冷卻；QUARANTINED 只能人工解除。
 */

export const ROUTE_MAX_ATTEMPTS = 3
export const ROUTE_MAX_CANDIDATES = 8
export const ROUTE_DEFAULT_COOLDOWN_MS = 60_000
export const ROUTE_DEFAULT_PROBE_LEASE_MS = 30_000

export const RouteCandidateSchema = z.object({
  /** 候選 reference；receipt 以此歸因，不含秘密。 */
  id: z.string().min(1),
  url: z.string().min(1),
  model: z.string().min(1),
  /** 可為真值或 {env:VAR}/{file:PATH} 引用（assemble 層展開；未解析引用在 dispatch 前阻擋）。 */
  apiKey: z.string().optional(),
  /** 非秘密 credential reference ID；breaker 鍵的一部分。未設時以金鑰指紋代替，不落金鑰值。 */
  credentialRef: z.string().optional(),
  /** 適用角色（judge/review/…）；未設＝全部角色可用。 */
  roles: z.array(z.string().min(1)).optional(),
  /** 上游為 gateway／combo 代理時設 true：其內部 attempts 不可觀測，receipt 明示 UNKNOWN；
   *  需要實際模型身分的角色（requireActualModel）不接受只回別名的 gateway 回應。 */
  gateway: z.boolean().optional(),
})
export type RouteCandidate = z.infer<typeof RouteCandidateSchema>

export const RoutePolicySchema = z.object({
  /** 預設關閉；未設定時 callAgent 維持既有單一路徑行為。 */
  enabled: z.boolean().default(false),
  routeId: z.string().min(1),
  policyVersion: z.string().min(1).default('1'),
  candidates: z.array(RouteCandidateSchema).min(1).max(ROUTE_MAX_CANDIDATES),
  /** 每次 logical call 的 HTTP 嘗試上限，含首次；同一候選最多一次。 */
  maxAttempts: z.number().int().min(1).max(ROUTE_MAX_ATTEMPTS).default(ROUTE_MAX_ATTEMPTS),
  perAttemptTimeoutMs: z.number().int().positive().optional(),
  /** 整個 logical call 的總期限；到期不再發出下一個請求。 */
  totalDeadlineMs: z.number().int().positive().optional(),
  /** 缺漏或非法 Retry-After 時的有界冷卻。 */
  cooldownMs: z.number().int().positive().default(ROUTE_DEFAULT_COOLDOWN_MS),
  /** HALF_OPEN 探測 lease 期限；同時只有一個 caller 能持有。 */
  probeLeaseMs: z.number().int().positive().default(ROUTE_DEFAULT_PROBE_LEASE_MS),
  /** 設定後每次回應必須附可信成本且 ≤ 此上限；缺漏＝UNKNOWN（阻擋），超頂＝隔離。 */
  maxCostUsd: z.number().nonnegative().optional(),
})
export type RoutePolicy = z.infer<typeof RoutePolicySchema>

/** 失敗分類：只有前三類可備援；其餘在 dispatch 前或當下即阻擋整個 logical call。 */
export type RouteFailureClass =
  | 'transient-http'      // 408/429/500/502/503/504
  | 'transport'           // 可辨識暫時性傳輸故障（含 redirect 拒絕）
  | 'attempt-timeout'     // 單次嘗試逾時（成本未知，保留計入預算決策）
  | 'cancelled'           // caller 主動取消
  | 'deadline-exceeded'   // 總期限到期
  | 'auth'                // 401/403
  | 'invalid-request'     // 其他非暫時狀態碼（400/404/422/其他 5xx…）
  | 'invalid-response'    // 200 但 body 不符 OpenAI 相容形狀
  | 'credential-missing'  // 秘密引用不可用；dispatch 前阻擋
  | 'identity-unknown'    // 角色要求實際模型身分但上游只回別名／未回
  | 'identity-violation'  // 上游回報的實際模型屬於排除名單（如 writer）
  | 'cost-unknown'        // 設了 hard cap 但回應無成本 metadata
  | 'cost-violation'      // 上游回報成本超過 maxCostUsd

export function isFallbackAllowed(cls: RouteFailureClass): boolean {
  return cls === 'transient-http' || cls === 'transport' || cls === 'attempt-timeout'
}

export function classifyHttpStatus(status: number): RouteFailureClass {
  if (status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504) return 'transient-http'
  if (status === 401 || status === 403) return 'auth'
  return 'invalid-request'
}

/** 尊重有效 Retry-After；缺漏／非法／已過期值採有界 fallback 冷卻。 */
export function routeRetryAt(headers: { get(name: string): string | null }, now = Date.now(), fallbackMs = ROUTE_DEFAULT_COOLDOWN_MS): number {
  const raw = headers.get('retry-after')
  const time = raw === null ? NaN
    : /^\d+(\.\d+)?$/.test(raw.trim()) ? now + Number(raw.trim()) * 1000
    : Date.parse(raw)
  return Number.isFinite(time) && time > now ? time : now + fallbackMs
}

export function normalizeRouteUrl(url: string): string {
  return url.trim().toLowerCase().replace(/\/+$/, '')
}

/** normalized endpoint + 非秘密 credential reference + model；不儲存金鑰值。 */
export function breakerKey(candidate: Pick<RouteCandidate, 'url' | 'model' | 'credentialRef' | 'apiKey'>): string {
  const cred = candidate.credentialRef
    ?? (candidate.apiKey ? `key:${createHash('sha256').update(`route-cred\n${candidate.apiKey}`).digest('hex').slice(0, 16)}` : 'none')
  return createHash('sha256').update(`${normalizeRouteUrl(candidate.url)}\n${cred}\n${candidate.model}`).digest('hex').slice(0, 24)
}

export type BreakerSnapshot =
  | { kind: 'closed' }
  | { kind: 'open'; retryAt: number }
  | { kind: 'quarantined'; reason: string }
  | { kind: 'invalid' }      // 收據損壞：視為不可用，等人工檢查，不猜測狀態

function breakerDir(dataDir: string): string { return join(dataDir, 'route-breakers') }
function breakerFile(dataDir: string, key: string): string { return join(breakerDir(dataDir), `${key}.json`) }
function probeDir(dataDir: string, key: string): string { return join(breakerDir(dataDir), `${key}.probe`) }

function writeAtomic(file: string, content: string): void {
  const tmp = `${file}.${randomUUID()}.tmp`
  writeFileSync(tmp, content)
  renameSync(tmp, file)
}

export function readBreaker(dataDir: string, key: string): BreakerSnapshot {
  const file = breakerFile(dataDir, key)
  if (!existsSync(file)) return { kind: 'closed' }
  let state: { state?: unknown; retryAt?: unknown; reason?: unknown }
  try { state = JSON.parse(readFileSync(file, 'utf8')) } catch { return { kind: 'invalid' } }
  if (state.state === 'QUARANTINED') return { kind: 'quarantined', reason: typeof state.reason === 'string' ? state.reason : 'quarantined' }
  if (state.state === 'OPEN') {
    if (typeof state.retryAt !== 'number' || !Number.isFinite(state.retryAt)) return { kind: 'invalid' }
    return { kind: 'open', retryAt: state.retryAt }
  }
  return { kind: 'invalid' }
}

function openBreaker(dataDir: string, key: string, retryAt: number, reason: string): void {
  mkdirSync(breakerDir(dataDir), { recursive: true })
  writeAtomic(breakerFile(dataDir, key), JSON.stringify({ state: 'OPEN', retryAt, reason, at: new Date().toISOString() }))
}

function clearBreaker(dataDir: string, key: string): void {
  rmSync(breakerFile(dataDir, key), { force: true })
}

/** 成本／身分違規隔離：計時器與成功競態都不得自行解除，只能人工檢查收據後刪除。 */
export function quarantineRouteCandidate(dataDir: string, key: string, reason: string): void {
  mkdirSync(breakerDir(dataDir), { recursive: true })
  writeAtomic(breakerFile(dataDir, key), JSON.stringify({ state: 'QUARANTINED', reason, at: new Date().toISOString() }))
}

interface ProbeLease { release(): void }

/** mkdir 是 Windows 上唯一可靠的原子互斥（與 src/lock.ts 同一實證）。
 *  冷卻到期後同時只允許一個有期限的探測 lease；持有中或搶輸都回 undefined。 */
function acquireProbe(dataDir: string, key: string, leaseMs: number): ProbeLease | undefined {
  const dir = probeDir(dataDir, key)
  const writeLease = (): ProbeLease => {
    writeFileSync(join(dir, 'lease.json'), JSON.stringify({ owner: randomUUID(), expiresAt: Date.now() + leaseMs }))
    return { release: () => rmSync(dir, { recursive: true, force: true }) }
  }
  try { mkdirSync(dir, { recursive: false }); return writeLease() }
  catch (err) { if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err }
  let expired: boolean
  try {
    const lease = JSON.parse(readFileSync(join(dir, 'lease.json'), 'utf8')) as { expiresAt?: unknown }
    expired = typeof lease.expiresAt !== 'number' || lease.expiresAt <= Date.now()
  } catch {
    // lease.json 缺失／損壞：fallback 以目錄年齡判定，避免幽靈 lease 永久佔位。
    try { expired = Date.now() - statSync(dir).mtimeMs > leaseMs } catch { return undefined }
  }
  if (!expired) return undefined
  const stolen = `${dir}.stale-${process.pid}-${randomUUID()}`
  try { renameSync(dir, stolen) } catch { return undefined }
  rmSync(stolen, { recursive: true, force: true })
  try { mkdirSync(dir, { recursive: false }); return writeLease() }
  catch (err) { if ((err as NodeJS.ErrnoException).code === 'EEXIST') return undefined; throw err }
}

export interface RoutedCallOptions {
  route: RoutePolicy
  dataDir?: string
  /** 要求的模型或 alias（收據歸因用；實際模型只信上游回報）。 */
  model: string
  role?: string
  effort?: string
  timeoutMs?: number
  fetchFn?: typeof fetch
  callId?: string
  signal?: AbortSignal
  /** reviewer 等角色設 true：上游未回實際模型、gateway 只回 alias、或回報模型命中排除名單時 BLOCKED，不給通過 receipt。 */
  requireActualModel?: boolean
  excludedModels?: string[]
  onModel?: (model: string) => void
  taskId?: string
  executionId?: string
}

export interface RoutedCallResult { text: string; totalTokens: number; error?: string; retryAt?: number; actualModel?: string }

interface AttemptOk { ok: true; text: string; totalTokens: number; actualModel?: string; cost: number | 'unknown' }
interface AttemptFail { ok: false; cls: RouteFailureClass; error: string; httpStatus?: number; retryAt?: number }
type AttemptOutcome = AttemptOk | AttemptFail

async function attemptOnce(candidate: RouteCandidate, prompt: string, o: {
  apiKey: string; effort?: string; timeoutMs: number; signal?: AbortSignal; fetchFn?: typeof fetch; cooldownMs: number
}): Promise<AttemptOutcome> {
  const timeoutSignal = AbortSignal.timeout(o.timeoutMs)
  const signal = o.signal ? AbortSignal.any([o.signal, timeoutSignal]) : timeoutSignal
  let res: Response
  try {
    res = await (o.fetchFn ?? fetch)(`${candidate.url.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      redirect: 'error', // 不經 redirect 洩漏認證
      signal,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${o.apiKey}` },
      body: JSON.stringify({
        model: candidate.model,
        reasoning_effort: o.effort ?? 'low',
        messages: [{ role: 'user', content: prompt }],
      }),
    })
  } catch (error) {
    if (o.signal?.aborted) return { ok: false, cls: 'cancelled', error: 'caller cancelled' }
    if (timeoutSignal.aborted) return { ok: false, cls: 'attempt-timeout', error: `timeout after ${o.timeoutMs}ms` }
    return { ok: false, cls: 'transport', error: `call failed: ${error instanceof Error ? error.message : String(error)}` }
  }
  if (!res.ok) {
    const cls = classifyHttpStatus(res.status)
    return {
      ok: false, cls, httpStatus: res.status, error: `HTTP ${res.status}`,
      ...(cls === 'transient-http' ? { retryAt: routeRetryAt(res.headers, Date.now(), o.cooldownMs) } : {}),
    }
  }
  let data: { model?: unknown; choices?: Array<{ message?: { content?: unknown } }>; usage?: { total_tokens?: unknown; cost?: unknown } }
  try { data = await res.json() } catch { return { ok: false, cls: 'invalid-response', error: 'unparseable response body' } }
  const text = data.choices?.[0]?.message?.content
  if (typeof text !== 'string' || !text.trim()) return { ok: false, cls: 'invalid-response', error: 'empty model response' }
  const totalTokens = Number.isSafeInteger(data.usage?.total_tokens) && (data.usage!.total_tokens as number) >= 0 ? data.usage!.total_tokens as number : 0
  const cost = typeof data.usage?.cost === 'number' && Number.isFinite(data.usage.cost) ? data.usage.cost : 'unknown'
  return {
    ok: true, text, totalTokens,
    ...(typeof data.model === 'string' && data.model ? { actualModel: data.model } : {}),
    cost,
  }
}

/** 收據：歸因到 route/policy/candidate/attempt，不落 prompt、key、Authorization 或 provider error body。 */
function routeReceipt(dataDir: string, fields: Record<string, unknown>): void {
  mkdirSync(dataDir, { recursive: true })
  appendFileSync(join(dataDir, 'route-calls.jsonl'), JSON.stringify({ at: new Date().toISOString(), ...fields }) + '\n')
}

/**
 * 有界順序備援：每個 logical call 只有這一層是 retry owner——gateway 候選內部
 * attempts 不可觀測時在 receipt 記 UNKNOWN，不宣稱全鏈路次數。
 */
export async function callRoutedAgent(opts: RoutedCallOptions, prompt: string): Promise<RoutedCallResult> {
  const policy = RoutePolicySchema.parse(opts.route)
  if (!opts.dataDir) return { text: '', totalTokens: 0, error: 'route policy requires dataDir for breaker state and receipts' }
  if (opts.signal?.aborted) return { text: '', totalTokens: 0, error: 'caller cancelled' }
  const callId = opts.callId ?? randomUUID()
  const role = opts.role ?? 'judge'
  const startedAt = Date.now()
  const deadlineAt = policy.totalDeadlineMs === undefined ? Infinity : startedAt + policy.totalDeadlineMs
  const maxAttempts = Math.min(policy.maxAttempts, ROUTE_MAX_ATTEMPTS)
  const candidates = policy.candidates.filter(c => c.roles === undefined || c.roles.includes(role))
  const base = { callId, routeId: policy.routeId, policyVersion: policy.policyVersion, role, requestedModel: opts.model, taskId: opts.taskId, executionId: opts.executionId }
  if (!candidates.length) {
    routeReceipt(opts.dataDir, { ...base, phase: 'blocked', failureClass: 'invalid-request', detail: `no candidates for role ${role}` })
    return { text: '', totalTokens: 0, error: `route policy has no candidates for role ${role}` }
  }
  let attempts = 0
  let earliestRetry = Infinity
  const reasons: string[] = []
  for (const candidate of candidates) {
    if (attempts >= maxAttempts) break
    if (opts.signal?.aborted) {
      routeReceipt(opts.dataDir, { ...base, phase: 'blocked', failureClass: 'cancelled', attempts })
      return { text: '', totalTokens: 0, error: 'caller cancelled' }
    }
    const remaining = deadlineAt - Date.now()
    if (remaining <= 0) {
      routeReceipt(opts.dataDir, { ...base, phase: 'blocked', failureClass: 'deadline-exceeded', attempts })
      return { text: '', totalTokens: 0, error: 'total deadline exceeded', ...(Number.isFinite(earliestRetry) ? { retryAt: earliestRetry } : {}) }
    }
    const apiKey = candidate.apiKey
    if (!apiKey || /^\{(?:env|file):/.test(apiKey) || apiKey !== apiKey.trim()) {
      // 秘密引用不可用／形狀異常：dispatch 前阻擋整個 logical call，不繞到下一個 provider。
      routeReceipt(opts.dataDir, { ...base, phase: 'blocked', candidateId: candidate.id, failureClass: 'credential-missing', attempts })
      return { text: '', totalTokens: 0, error: `route candidate ${candidate.id}: credential reference unavailable` }
    }
    const key = breakerKey(candidate)
    const breaker = readBreaker(opts.dataDir, key)
    if (breaker.kind === 'quarantined') { reasons.push(`${candidate.id}=quarantined(${breaker.reason})`); continue }
    if (breaker.kind === 'invalid') { reasons.push(`${candidate.id}=invalid-breaker-receipt`); continue }
    let probe: ProbeLease | undefined
    let breakerState = 'CLOSED'
    if (breaker.kind === 'open') {
      if (breaker.retryAt > Date.now()) {
        earliestRetry = Math.min(earliestRetry, breaker.retryAt)
        reasons.push(`${candidate.id}=cooling`)
        routeReceipt(opts.dataDir, { ...base, phase: 'skipped', candidateId: candidate.id, breakerState: 'OPEN', retryAt: breaker.retryAt, detail: 'cooldown active' })
        continue
      }
      probe = acquireProbe(opts.dataDir, key, policy.probeLeaseMs)
      if (!probe) {
        reasons.push(`${candidate.id}=probe-lease-held`)
        routeReceipt(opts.dataDir, { ...base, phase: 'skipped', candidateId: candidate.id, breakerState: 'HALF_OPEN', detail: 'probe lease held by another caller' })
        continue
      }
      breakerState = 'HALF_OPEN'
    }
    attempts++
    const started = Date.now()
    const outcome = await attemptOnce(candidate, prompt, {
      apiKey, effort: opts.effort, timeoutMs: Math.min(policy.perAttemptTimeoutMs ?? opts.timeoutMs ?? 60_000, remaining),
      signal: opts.signal, fetchFn: opts.fetchFn, cooldownMs: policy.cooldownMs,
    })
    const durationMs = Date.now() - started
    const receiptExtra = { candidateId: candidate.id, attempt: attempts, breakerState, durationMs, upstreamAttempts: candidate.gateway === true ? 'unknown' : 1 }
    if (outcome.ok) {
      const reported = outcome.actualModel
      const actualModelSource = reported === undefined ? 'unknown' : 'upstream-reported'
      const identityUnknown = opts.requireActualModel === true
        && (reported === undefined || (candidate.gateway === true && modelIdentity(reported) === modelIdentity(candidate.model)))
      if (identityUnknown) {
        probe?.release()
        routeReceipt(opts.dataDir, { ...base, ...receiptExtra, phase: 'blocked', failureClass: 'identity-unknown', actualModelSource, cost: outcome.cost })
        return { text: '', totalTokens: outcome.totalTokens, error: `route candidate ${candidate.id}: actual model unknown; no pass receipt for this role` }
      }
      if (reported !== undefined && opts.excludedModels?.some(excluded => modelIdentity(excluded) === modelIdentity(reported))) {
        quarantineRouteCandidate(opts.dataDir, key, `identity-violation:${reported}`)
        probe?.release()
        routeReceipt(opts.dataDir, { ...base, ...receiptExtra, phase: 'quarantined', failureClass: 'identity-violation', actualModel: reported, actualModelSource, cost: outcome.cost })
        return { text: '', totalTokens: outcome.totalTokens, error: `route candidate ${candidate.id}: actual model ${reported} is excluded for this role` }
      }
      if (policy.maxCostUsd !== undefined && outcome.cost === 'unknown') {
        probe?.release()
        routeReceipt(opts.dataDir, { ...base, ...receiptExtra, phase: 'blocked', failureClass: 'cost-unknown', actualModel: reported, actualModelSource, cost: 'unknown' })
        return { text: '', totalTokens: outcome.totalTokens, error: `route candidate ${candidate.id}: cost unknown under hard cap`, actualModel: reported }
      }
      if (policy.maxCostUsd !== undefined && typeof outcome.cost === 'number' && outcome.cost > policy.maxCostUsd) {
        quarantineRouteCandidate(opts.dataDir, key, `cost-violation:${outcome.cost}`)
        probe?.release()
        routeReceipt(opts.dataDir, { ...base, ...receiptExtra, phase: 'quarantined', failureClass: 'cost-violation', actualModel: reported, actualModelSource, cost: outcome.cost })
        return { text: '', totalTokens: outcome.totalTokens, error: `route candidate ${candidate.id}: reported cost exceeds policy cap`, actualModel: reported }
      }
      clearBreaker(opts.dataDir, key)
      probe?.release()
      opts.onModel?.(reported ?? candidate.model)
      routeReceipt(opts.dataDir, { ...base, ...receiptExtra, phase: 'completed', actualModel: reported, actualModelSource, totalTokens: outcome.totalTokens, cost: outcome.cost, attempts })
      return { text: outcome.text, totalTokens: outcome.totalTokens, ...(reported !== undefined ? { actualModel: reported } : {}) }
    }
    if (isFallbackAllowed(outcome.cls)) {
      const retryAt = outcome.retryAt ?? Date.now() + policy.cooldownMs
      openBreaker(opts.dataDir, key, retryAt, outcome.error)
      probe?.release()
      earliestRetry = Math.min(earliestRetry, retryAt)
      reasons.push(`${candidate.id}=${outcome.error}`)
      routeReceipt(opts.dataDir, { ...base, ...receiptExtra, phase: 'attempt-failed', failureClass: outcome.cls, httpStatus: outcome.httpStatus, retryAt, cost: 'unknown' })
      continue
    }
    probe?.release()
    routeReceipt(opts.dataDir, { ...base, ...receiptExtra, phase: 'blocked', failureClass: outcome.cls, httpStatus: outcome.httpStatus })
    return { text: '', totalTokens: 0, error: `route candidate ${candidate.id}: ${outcome.error}` }
  }
  const detail = reasons.length ? `: ${reasons.join('; ')}` : ''
  routeReceipt(opts.dataDir, { ...base, phase: 'blocked', failureClass: 'unavailable', attempts, detail: `all candidates unavailable${detail}`, ...(Number.isFinite(earliestRetry) ? { retryAt: earliestRetry } : {}) })
  return {
    text: '', totalTokens: 0,
    error: `all route candidates unavailable${detail}`,
    ...(Number.isFinite(earliestRetry) ? { retryAt: earliestRetry } : {}),
  }
}
