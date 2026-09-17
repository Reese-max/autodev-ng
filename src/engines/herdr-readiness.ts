import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import type { CliAdmission } from './cli-admission.js'

/** 可靠 reset 資訊的持有上限：再遠也只持有 24h，到點重探（有界）。 */
export const HERDR_QUOTA_HOLD_CAP_MS = 24 * 60 * 60_000

const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {}
const str = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() ? v.trim() : undefined
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** `status server --json` 的容忍式解析：非物件 JSON 視為無狀態回答（transient）。 */
export function parseHerdrStatus(stdout: string): Record<string, unknown> | undefined {
  try {
    const v = JSON.parse(stdout) as unknown
    return v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : undefined
  } catch { return undefined }
}

/** launcher 檔內容雜湊；唯讀、只供觀測綁定（檔案不可讀→unreadable，不沿用舊證據）。 */
export function launcherDigest(file: string): string {
  try { return 'sha256:' + createHash('sha256').update(readFileSync(file)).digest('hex') }
  catch { return 'unreadable' }
}

export interface BackendSpec {
  provider: string
  model?: string
  /** 觀測來源（唯讀指令描述）。 */
  source: string
  launcherSha256?: string
}

/** 只接受明確形狀的登入訊號；其餘一律 unknown——unknown 不視為可用也不視為故障。 */
function authState(raw: unknown): 'available' | 'missing' | 'unknown' {
  if (typeof raw === 'boolean') return raw ? 'available' : 'missing'
  const o = obj(raw)
  for (const key of ['loggedIn', 'authenticated', 'ok'] as const)
    if (typeof o[key] === 'boolean') return o[key] ? 'available' : 'missing'
  const s = (str(raw) ?? str(o.state) ?? str(o.status) ?? '').toLowerCase().replace(/[\s_]+/g, '-')
  if (/^(ok|authenticated|logged-in|available|valid|active)$/.test(s)) return 'available'
  if (/^(missing|expired|required|unauthenticated|logged-out|invalid|none|anonymous)$/.test(s)) return 'missing'
  return 'unknown'
}

function parseReset(v: unknown): string | undefined {
  if (finite(v) && v > 0) return new Date(v < 8.64e12 ? v * 1000 : v).toISOString()
  const s = str(v)
  if (!s) return undefined
  const t = Date.parse(s)
  return Number.isFinite(t) ? new Date(t).toISOString() : undefined
}

/** 額度：明確 exhausted／remaining=0 才算耗盡；有窗口或明確可用才 available；其他 unknown（不猜剩餘與重設）。 */
function quotaState(raw: unknown): CliAdmission['quota'] {
  const q = obj(raw)
  const s = (str(raw) ?? str(q.state) ?? str(q.status) ?? '').toLowerCase()
  const remaining = finite(q.remainingPercent) ? q.remainingPercent
    : finite(q.remaining_percentage) ? q.remaining_percentage
    : finite(q.percentRemaining) ? q.percentRemaining : undefined
  const resetsAt = parseReset(q.resetsAt ?? q.resetAt ?? q.reset_at ?? q.reset)
  const extras = `${remaining !== undefined ? ` remaining=${remaining}%` : ''}${resetsAt ? ` resetsAt=${resetsAt}` : ''}`
  if (q.exhausted === true || ['exhausted', 'depleted', 'rejected'].includes(s) || remaining === 0)
    return { state: 'exhausted', detail: 'backend quota exhausted' + extras, ...(resetsAt ? { resetsAt } : {}) }
  if (['available', 'ok', 'active'].includes(s) || q.unlimited === true || (remaining !== undefined && remaining > 0))
    return { state: 'available', detail: 'backend quota available' + extras, ...(resetsAt ? { resetsAt } : {}) }
  return { state: 'unknown', detail: 'status payload 無可靠 quota 欄位；unknown 不猜剩餘或重設時間' }
}

/** 模型：reported 與 requested 相符＝listed；有清單就查清單；皆無→unknown。'verified' 只留給真實執行收據。 */
function modelState(status: Record<string, unknown>, backend: Record<string, unknown>, requested: string | undefined): CliAdmission['model'] {
  const rawList = status.models ?? backend.models
  const list = Array.isArray(rawList)
    ? rawList.map(m => str(m) ?? str(obj(m).id) ?? str(obj(m).model)).filter((s): s is string => !!s)
    : undefined
  const reported = str(status.model) ?? str(backend.model) ?? str(status.reportedModel) ?? str(backend.reportedModel)
  const base = { ...(requested ? { requested } : {}), ...(reported ? { reported } : {}) }
  if (requested && reported === requested)
    return { ...base, state: 'listed', detail: 'backend reported active model matches requested' }
  if (list && list.length > 0)
    return { ...base, state: requested ? (list.includes(requested) ? 'listed' : 'unavailable') : 'unknown',
      detail: `backend models list: ${list.length} models${requested && !list.includes(requested) ? '；requested 不在清單（設定問題）' : ''}` }
  if (reported)
    return { ...base, state: requested ? 'unavailable' : 'listed',
      detail: `backend reported model ${reported}${requested ? '；與 requested 不符（設定問題）' : ''}` }
  return { ...base, state: 'unknown', detail: 'status payload 無可靠模型欄位；catalog 不在不代表不可用，只記 unknown' }
}

/**
 * 從 `status server --json` 的 payload 分別填充 auth／quota／model 與後端身分。
 * 欄位缺或形狀不認識→unknown；同一 payload 是唯讀觀測，不送模型探針、不動登入與憑證。
 */
export function applyBackendStatus(admission: CliAdmission, status: Record<string, unknown>, spec: BackendSpec): void {
  const backend = obj(status.backend)
  const herdrVersion = str(status.version) ?? str(status.serverVersion) ?? str(status.herdrVersion) ?? str(obj(status.server).version)
  const cliVersion = str(status.cliVersion) ?? str(backend.cliVersion) ?? str(backend.version)
  admission.backend = {
    source: spec.source, provider: str(backend.provider) ?? spec.provider,
    ...(spec.launcherSha256 ? { launcherSha256: spec.launcherSha256 } : {}),
    ...(herdrVersion ? { herdrVersion } : {}), ...(cliVersion ? { cliVersion } : {}),
  }
  const authRaw = [status.auth, status.authenticated, status.loggedIn, backend.auth, backend.authenticated, backend.loggedIn]
    .find(v => v !== undefined)
  const auth = authState(authRaw)
  admission.auth = { state: auth, detail: auth === 'unknown' ? 'status payload 無可靠登入欄位；unknown 不視為可用' : `status payload auth=${auth}` }
  admission.quota = quotaState(status.quota ?? backend.quota ?? status.quotaStatus ?? backend.quotaStatus)
  admission.model = modelState(status, backend, spec.model)
}

/** 額度耗盡的持有時間：有可靠未來 reset→持到 reset（封頂 24h）；否則 undefined＝走一般有界冷卻。 */
export function quotaHoldUntil(admission: CliAdmission, now = Date.now(), capMs = HERDR_QUOTA_HOLD_CAP_MS): number | undefined {
  if (admission.quota.state !== 'exhausted' || !admission.quota.resetsAt) return undefined
  const t = Date.parse(admission.quota.resetsAt)
  return Number.isFinite(t) && t > now ? Math.min(t, now + capMs) : undefined
}
