import { createHash } from 'node:crypto'
import { readFileSync, statSync } from 'node:fs'

/**
 * Issue #34：Herdr backend readiness observation。
 *
 * server（launcher／Herdr server 健康）與 backend（底層 CLI 登入／模型／額度）
 * 分開驗證：server ok 絕不冒充整條執行路徑已驗證。無可靠原生唯讀接口的項目
 * 保留 unknown，不猜剩餘次數或重設時間；需花費的 canary 另行授權。
 *
 * 不變量：
 * - 不自動提交登入同意、不登出、不重寫真實憑證（本模組只做唯讀觀測與分類）。
 * - unknown 費用永不計成 confirmed-zero；備援只走事前白名單，不切新付費模型。
 * - 憑證值、cookie、完整環境變數不得進入觀測／日誌（只記指紋與枚舉狀態）。
 */

export type HerdrProvider = 'Codex' | 'Pi'
export type HerdrServerState = 'ok' | 'unavailable'
export type HerdrLoginState = 'available' | 'missing' | 'unknown'
export type HerdrModelState = 'listed' | 'verified' | 'unavailable' | 'unknown'
export type HerdrQuotaState = 'available' | 'exhausted' | 'unknown'
export type HerdrReadinessSource = 'server-status' | 'launcher-health-only' | 'run-observation'

/** 登入、額度、網路、模型錯誤各有不同處置；只有暫時網路故障可有限重試。 */
export type HerdrFailureClass =
  | 'auth-missing'
  | 'model-unavailable'
  | 'quota-exhausted'
  | 'transient-network'
  | 'server-unavailable'
  | 'config'
  | 'unknown'

export interface HerdrRetryAdvice {
  retryable: boolean
  /** 含首次在內的可重試上限；暫時網路故障以外一律 0。 */
  maxRetries: number
  /** 額度耗盡等有界冷卻（ms）；不可重試類為 0。 */
  cooldownMs: number
  /** 登入失效等待人工介入；本模組不自動提交同意、不登出、不重寫憑證。 */
  waitForHuman: boolean
  /** 付費切換預設關閉；只在備援白名單命中時才允許。 */
  fallbackAllowed: boolean
  reason: string
}

/** 暫時網路故障才有限次退避重試：上限 2 次（含首次即最多 1 次重試後再觀察）。 */
export const HERDR_TRANSIENT_MAX_RETRIES = 2
/** 額度耗盡無可靠 reset 資訊時的有界冷卻；有可靠 reset 資訊以該資訊為準。 */
export const HERDR_QUOTA_COOLDOWN_MS = 30 * 60_000
/** 觀測有效期由注入的 PreflightCache TTL 治理（好結果長、壞結果短）；版本／設定／
 * 授權模式改變經 herdrReadinessKey 換鍵失效，相關執行失敗由引擎顯式 invalidate。 */

export interface HerdrReadinessObservation {
  version: 1
  provider: HerdrProvider
  requestedModel?: string
  reportedModel?: string
  launcherHash: string
  server: HerdrServerState
  login: HerdrLoginState
  model: HerdrModelState
  quota: HerdrQuotaState
  observedAt: string
  source: HerdrReadinessSource
  detail: string
  failureClass?: HerdrFailureClass
  /** 只有呼叫方另行提供可靠 reset 資訊時才填；絕不猜測。 */
  resetAt?: string
}

/** launcher 指紋：檔案位元組雜湊；讀不到時退回 mtime＋size；只記身分不記內容。 */
export function launcherFingerprint(command: string): string {
  try {
    return 'sha256:' + createHash('sha256').update(readFileSync(command)).digest('hex').slice(0, 32)
  } catch {
    try {
      const s = statSync(command, { throwIfNoEntry: false })
      return s ? `stat:${s.mtimeMs}:${s.size}` : 'missing'
    } catch {
      return 'unreadable'
    }
  }
}

/**
 * 快取鍵綁定精確 runtime／launcher／設定：command 指紋、provider、
 * requested model、session、auth 模式。任一改變即換鍵＝舊觀測自動失效。
 */
export function herdrReadinessKey(input: {
  command: string; launcherHash: string; provider: HerdrProvider; requestedModel?: string; sessionName: string
}): string {
  return 'herdr-readiness-v1:' + createHash('sha256').update(JSON.stringify([
    input.command, input.launcherHash, input.provider, input.requestedModel ?? '', input.sessionName,
  ])).digest('hex')
}

function dispositionOf(failureClass: HerdrFailureClass | undefined, ready: boolean): string {
  if (ready) return 'ready: backend verified for this runtime/launcher/config'
  switch (failureClass) {
    case 'auth-missing': return 'auth-missing: wait-human; no auto consent/logout/credential rewrite'
    case 'model-unavailable': return 'model-unavailable: config-problem; fix requested model, no retry'
    case 'quota-exhausted': return 'quota-exhausted: bounded-cooldown; reliable reset info or bounded cooldown, no paid fallback'
    case 'transient-network': return 'transient-network: bounded-retry≤2 with backoff; no paid fallback'
    case 'server-unavailable': return 'server-unavailable: launcher/server health only; re-probe'
    case 'config': return 'config: fix launcher/provider/auth-mode configuration, no retry'
    default: return 'unknown: keep unknown; do not infer availability or cost'
  }
}

export function observeHerdrBackend(input: {
  server: HerdrServerState; login: HerdrLoginState; model: HerdrModelState; quota: HerdrQuotaState
  provider: HerdrProvider; requestedModel?: string; reportedModel?: string
  launcherHash?: string; source: HerdrReadinessSource; resetAt?: string; now?: () => string
}): HerdrReadinessObservation {
  let failureClass: HerdrFailureClass | undefined
  if (input.launcherHash === 'missing' || input.launcherHash === 'unreadable') failureClass = 'config'
  else if (input.server !== 'ok') failureClass = 'server-unavailable'
  else if (input.login === 'missing') failureClass = 'auth-missing'
  else if (input.model === 'unavailable') failureClass = 'model-unavailable'
  else if (input.quota === 'exhausted') failureClass = 'quota-exhausted'
  else if (input.login === 'unknown' || input.model === 'unknown' || input.quota === 'unknown') failureClass = 'unknown'
  const ready = failureClass === undefined
  const backend = ready ? 'backend=ready' : 'backend=unverified'
  const detail = [
    `server=${input.server} login=${input.login} model=${input.model} quota=${input.quota} ${backend}`,
    ready ? '(full backend verified for this observation)' : '(server ok only; auth/model/quota unproven)',
    `disposition=${dispositionOf(failureClass, ready)}`,
  ].join('; ')
  return {
    version: 1, provider: input.provider,
    ...(input.requestedModel ? { requestedModel: input.requestedModel } : {}),
    ...(input.reportedModel ? { reportedModel: input.reportedModel } : {}),
    launcherHash: input.launcherHash ?? 'unknown',
    server: input.server, login: input.login, model: input.model, quota: input.quota,
    observedAt: input.now?.() ?? new Date().toISOString(),
    source: input.source, detail,
    ...(failureClass ? { failureClass } : {}),
    // resetAt 只有呼叫方提供可靠資訊才保留；unknown 額度絕不猜測。
    ...(input.resetAt ? { resetAt: input.resetAt } : {}),
  }
}

/** 單列摘要：server ok 的未驗證列只報 backend=unverified，絕不寫全路徑已驗證。 */
export function summarizeHerdrReadiness(obs: HerdrReadinessObservation): string {
  return `${obs.detail}; provider=${obs.provider}`
    + `${obs.requestedModel ? ` requested=${obs.requestedModel}` : ''}`
    + `${obs.reportedModel ? ` reported=${obs.reportedModel}` : ''}`
    + ` observedAt=${obs.observedAt} source=${obs.source}`
}

/** 表格化 fixture：server、登入、模型、額度分欄呈現，不再以 server ok 冒充全路徑。 */
export function herdrReadinessTable(rows: HerdrReadinessObservation[]): string {
  const lines = ['| server | login | model | quota | backend | disposition |', '| --- | --- | --- | --- | --- | --- |']
  for (const row of rows) {
    const backend = row.failureClass === undefined ? 'ready' : 'unverified'
    lines.push(`| ${row.server} | ${row.login} | ${row.model} | ${row.quota} | ${backend} | ${row.failureClass ?? 'ready'} |`)
  }
  return lines.join('\n')
}

const QUOTA_RE = /quota\s*exhausted|out\s*of\s*quota|insufficient[\s\S]{0,20}quota|spend[\s\S]{0,20}control[\s\S]{0,20}reached|credits?_required|billing[\s\S]{0,20}exhausted|quota[\s\S]{0,20}exceeded/i
const AUTH_RE = /log[\s-]?in\s*(required|needed|expired|failed)|not\s+(logged|authenticated)|unauthorized|\b401\b|auth(?:entication|orization)?\s*(required|failed|expired|missing|invalid)/i
const MODEL_RE = /model[\s\S]{0,40}(not\s+supported|unsupported|unavailable|not\s+found)|unknown\s+model|unsupported\s+model|model\s+is\s+not\s+available/i
const TRANSIENT_RE = /timed?\s?out|ETIMEDOUT|ECONNRESET|ENOTFOUND|EAI_AGAIN|socket\s+hang\s+up|network\s+(unreachable|error|failure)|temporarily\s+unavailable|transient/i
const CONFIG_RE = /unknown\s+provider|invalid\s+provider|launcher[\s\S]{0,20}(missing|not\s+found|invalid|unreadable)/i
const SERVER_RE = /未就緒|not\s+running|connection\s+refused|herdr[\s\S]{0,20}not\s+(ready|running|compatible)/i

const noFallback = (reason: string): HerdrRetryAdvice =>
  ({ retryable: false, maxRetries: 0, cooldownMs: 0, waitForHuman: false, fallbackAllowed: false, reason })

/**
 * 失敗分類與處置：登入／額度／網路／模型各走各的路。
 * 暫時網路故障才有限重試；登入失效等人工；額度耗盡走有界冷卻；模型不支援是設定問題。
 * 任何分支都不自動切付費（fallbackAllowed 恆 false；白名單切換由 isHerdrFallbackAllowed 另行判定）。
 */
export function classifyHerdrFailure(input: {
  exitCode?: number | null; timedOut?: boolean; aborted?: boolean; stdout?: string; stderr?: string; detail?: string
}): { failureClass: HerdrFailureClass; advice: HerdrRetryAdvice } {
  if (input.aborted) return { failureClass: 'unknown', advice: { ...noFallback('cancelled: no retry, no fallback'), } }
  if (input.timedOut || TRANSIENT_RE.test(`${input.stdout ?? ''}\n${input.stderr ?? ''}\n${input.detail ?? ''}`)) {
    return {
      failureClass: 'transient-network',
      advice: { retryable: true, maxRetries: HERDR_TRANSIENT_MAX_RETRIES, cooldownMs: 0, waitForHuman: false, fallbackAllowed: false, reason: 'transient network: bounded retry only' },
    }
  }
  const text = `${input.stdout ?? ''}\n${input.stderr ?? ''}\n${input.detail ?? ''}`
  if (QUOTA_RE.test(text)) {
    return {
      failureClass: 'quota-exhausted',
      advice: { retryable: false, maxRetries: 0, cooldownMs: HERDR_QUOTA_COOLDOWN_MS, waitForHuman: false, fallbackAllowed: false, reason: 'quota exhausted: bounded cooldown or reliable reset info; no paid fallback' },
    }
  }
  if (AUTH_RE.test(text)) {
    return {
      failureClass: 'auth-missing',
      advice: { retryable: false, maxRetries: 0, cooldownMs: 0, waitForHuman: true, fallbackAllowed: false, reason: 'login unavailable: wait for human; no auto consent/logout/credential rewrite' },
    }
  }
  if (MODEL_RE.test(text)) {
    return {
      failureClass: 'model-unavailable',
      advice: { retryable: false, maxRetries: 0, cooldownMs: 0, waitForHuman: false, fallbackAllowed: false, reason: 'model unsupported: config problem; fix requested model' },
    }
  }
  if (SERVER_RE.test(text)) {
    return { failureClass: 'server-unavailable', advice: { ...noFallback('server unavailable: re-probe launcher/server health'), } }
  }
  if (CONFIG_RE.test(text)) {
    return { failureClass: 'config', advice: { ...noFallback('launcher/provider misconfigured: fix configuration, no retry'), } }
  }
  return { failureClass: 'unknown', advice: { ...noFallback('unclassified: keep unknown; do not infer availability or cost'), } }
}

/** 備援必須事先列入允許清單；空清單＝不備援；新付費模型不在清單即擋。 */
export function isHerdrFallbackAllowed(candidate: string, allowlist: readonly string[]): boolean {
  return allowlist.includes(candidate)
}

/**
 * 費用政策守衛：費用未知時依既有明確政策與保守保留額處理；
 * 要求 verified-free 的設定不得放行 unknown 路徑（unknown ≠ confirmed-zero）。
 */
export function assertHerdrCostPolicy(input: {
  costUnknown: boolean; requireVerifiedFree: boolean; fallback?: string; allowlist?: readonly string[]
}): void {
  if (input.costUnknown && input.requireVerifiedFree) {
    throw new Error('herdr cost-unknown: verified-free required; unknown cost path blocked (unknown ≠ confirmed-zero)')
  }
  if (input.fallback !== undefined && !isHerdrFallbackAllowed(input.fallback, input.allowlist ?? [])) {
    throw new Error(`herdr fallback not allowlisted: ${input.fallback}`)
  }
}
