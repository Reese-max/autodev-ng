/**
 * dataDir 引擎路由 JSON 狀態檔（engine-routing-state.json）。
 *
 * 用途：跨輪保存隔離 / 晉升 / 試探計數，供後續戰績感知路由讀寫。
 * 契約：
 * - 讀不到、內容損壞、版本不支援 → fail-open 回空預設 + kind:'reuse-current'
 *   （呼叫端必須沿用既有 candidateEngines()，不得改派工路徑）
 * - 欄位缺失 → 以預設值補齊後仍 kind:'state'（向後相容）
 * - 寫入採唯一 tmp+rename；既有檔不可用時拒絕覆寫並保留原檔
 * - 任何 I/O 失敗不拋錯（fail-open）
 */
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { REUSE_CURRENT } from './routing-decision.js'

export { REUSE_CURRENT }

/** 目前寫入版本；讀取時支援同版缺欄回填，版本不符一律 reuse-current。 */
export const ROUTING_STATE_VERSION = 1 as const

export const ROUTING_STATE_FILENAME = 'engine-routing-state.json'

export interface IsolationEntry {
  /** ISO 時刻；空字串或已過期視為未隔離 */
  untilTs: string
  reason: string
}

export interface PromotionEntry {
  score: number
  promotedAt: string
}

export interface ProbeEntry {
  hits: number
  lastTs: string
}

export interface RoutingState {
  version: typeof ROUTING_STATE_VERSION
  updatedAt: string
  isolated: Record<string, IsolationEntry>
  /** 同一引擎未成功試探前的累計隔離次數；缺項視為 0。 */
  isolationCounts: Record<string, number>
  promoted: Record<string, PromotionEntry>
  probes: Record<string, ProbeEntry>
}

export type LoadRoutingStateResult =
  | { kind: 'state'; state: RoutingState; source: 'file' }
  | {
      kind: 'reuse-current'
      decision: typeof REUSE_CURRENT
      reason: 'missing' | 'unreadable' | 'corrupt' | 'unsupported-version' | 'invalid-shape'
      state: RoutingState
    }

export function routingStatePath(dataDir: string): string {
  return join(dataDir, ROUTING_STATE_FILENAME)
}

export function defaultRoutingState(nowIso = new Date().toISOString()): RoutingState {
  return {
    version: ROUTING_STATE_VERSION,
    updatedAt: nowIso,
    isolated: {},
    isolationCounts: {},
    promoted: {},
    probes: {},
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function asNonNegInt(v: unknown, fallback: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return fallback
  return Math.floor(v)
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

/**
 * 新版 camelCase 優先；舊版別名（snake_case / 近義複數）僅在主鍵缺席時採用。
 * 升級相容：舊檔可讀、寫回永遠是目前 schema。
 */
function pickField(obj: Record<string, unknown>, primary: string, ...aliases: string[]): unknown {
  if (Object.prototype.hasOwnProperty.call(obj, primary)) return obj[primary]
  for (const a of aliases) {
    if (Object.prototype.hasOwnProperty.call(obj, a)) return obj[a]
  }
  return undefined
}

/** 是否帶有可識別的路由 map（含舊版頂層別名；供診斷與相容檢查）。 */
export function hasReadableRoutingMaps(raw: Record<string, unknown>): boolean {
  return (
    isPlainObject(pickField(raw, 'isolated', 'isolation'))
    || isPlainObject(pickField(raw, 'isolationCounts'))
    || isPlainObject(pickField(raw, 'promoted', 'promotions'))
    || isPlainObject(pickField(raw, 'probes', 'probe'))
  )
}

function normalizeIsolated(raw: unknown): Record<string, IsolationEntry> {
  if (!isPlainObject(raw)) return {}
  const out: Record<string, IsolationEntry> = {}
  for (const [tag, entry] of Object.entries(raw)) {
    if (!tag || !isPlainObject(entry)) continue
    out[tag] = {
      untilTs: asString(pickField(entry, 'untilTs', 'until_ts')),
      reason: asString(pickField(entry, 'reason')),
    }
  }
  return out
}

function normalizePromoted(raw: unknown): Record<string, PromotionEntry> {
  if (!isPlainObject(raw)) return {}
  const out: Record<string, PromotionEntry> = {}
  for (const [tag, entry] of Object.entries(raw)) {
    if (!tag || !isPlainObject(entry)) continue
    out[tag] = {
      score: asNonNegInt(pickField(entry, 'score'), 0),
      promotedAt: asString(pickField(entry, 'promotedAt', 'promoted_at')),
    }
  }
  return out
}

function normalizeProbes(raw: unknown): Record<string, ProbeEntry> {
  if (!isPlainObject(raw)) return {}
  const out: Record<string, ProbeEntry> = {}
  for (const [tag, entry] of Object.entries(raw)) {
    if (!tag || !isPlainObject(entry)) continue
    out[tag] = {
      hits: asNonNegInt(pickField(entry, 'hits'), 0),
      lastTs: asString(pickField(entry, 'lastTs', 'last_ts')),
    }
  }
  return out
}

function normalizeIsolationCounts(raw: unknown): Record<string, number> {
  if (!isPlainObject(raw)) return {}
  const out: Record<string, number> = {}
  for (const [tag, count] of Object.entries(raw)) {
    if (!tag) continue
    out[tag] = asNonNegInt(count, 0)
  }
  return out
}

/**
 * 將任意 JSON 正規化為 v1 狀態。
 * - 可辨識的物件（含缺 version / 缺欄）→ 回填預設
 * - 舊版欄位名稱（snake_case / isolation|promotions|probe）→ 對應到新版
 * - 版本不符 → null（避免未知語意的狀態影響既有派工）
 * - 完全無法辨識 → null（呼叫端 reuse-current）
 */
export function normalizeRoutingState(raw: unknown, nowIso = new Date().toISOString()): RoutingState | null {
  if (!isPlainObject(raw)) return null

  const versionRaw = raw.version
  if (versionRaw !== undefined && versionRaw !== null) {
    if (typeof versionRaw !== 'number' || !Number.isFinite(versionRaw) || versionRaw !== ROUTING_STATE_VERSION) return null
  }

  const updatedRaw = pickField(raw, 'updatedAt', 'updated_at')
  return {
    version: ROUTING_STATE_VERSION,
    updatedAt: asString(updatedRaw, nowIso),
    isolated: normalizeIsolated(pickField(raw, 'isolated', 'isolation')),
    isolationCounts: normalizeIsolationCounts(pickField(raw, 'isolationCounts')),
    promoted: normalizePromoted(pickField(raw, 'promoted', 'promotions')),
    probes: normalizeProbes(pickField(raw, 'probes', 'probe')),
  }
}

/** 已出現的路由 map 必須是物件；半毀 JSON 不可被正規化成可套用狀態。 */
function hasMalformedRoutingMaps(raw: Record<string, unknown>): boolean {
  const maps: readonly { primary: string; aliases: readonly string[] }[] = [
    { primary: 'isolated', aliases: ['isolation'] },
    { primary: 'isolationCounts', aliases: [] },
    { primary: 'promoted', aliases: ['promotions'] },
    { primary: 'probes', aliases: ['probe'] },
  ]
  return maps.some(({ primary, aliases }) => {
    const value = pickField(raw, primary, ...aliases)
    return value !== undefined && !isPlainObject(value)
  })
}

/** 是否應覆蓋既有 candidateEngines 結果。缺檔/損壞/不可用一律 false。 */
export function shouldApplyRoutingState(result: LoadRoutingStateResult): boolean {
  return result.kind === 'state'
}

/** 缺檔可初始化；既有檔讀取失敗時不可更新，避免用空預設覆蓋損毀原檔。 */
export function routingStateForUpdate(result: LoadRoutingStateResult): RoutingState | null {
  if (result.kind === 'state') return result.state
  return result.reason === 'missing' ? result.state : null
}

/**
 * 讀取 dataDir 下路由狀態。
 * 缺檔 / 讀不到 / JSON 壞 / 形狀非法 / 不支援版本 → reuse-current + 空預設。
 * 缺欄位則回填後仍回 kind:'state'。
 */
export function loadRoutingState(
  dataDir: string,
  opts: { nowIso?: string } = {}
): LoadRoutingStateResult {
  const nowIso = opts.nowIso ?? new Date().toISOString()
  const empty = defaultRoutingState(nowIso)
  const file = routingStatePath(dataDir)

  if (!existsSync(file)) {
    return { kind: 'reuse-current', decision: REUSE_CURRENT, reason: 'missing', state: empty }
  }

  let text: string
  try {
    text = readFileSync(file, 'utf8')
  } catch {
    return { kind: 'reuse-current', decision: REUSE_CURRENT, reason: 'unreadable', state: empty }
  }

  let raw: unknown
  try {
    raw = JSON.parse(text) as unknown
  } catch {
    return { kind: 'reuse-current', decision: REUSE_CURRENT, reason: 'corrupt', state: empty }
  }

  if (!isPlainObject(raw)) {
    return { kind: 'reuse-current', decision: REUSE_CURRENT, reason: 'invalid-shape', state: empty }
  }

  const versionRaw = raw.version
  if (
    versionRaw !== undefined
    && versionRaw !== null
    && (typeof versionRaw !== 'number' || !Number.isFinite(versionRaw) || versionRaw !== ROUTING_STATE_VERSION)
  ) {
    return {
      kind: 'reuse-current',
      decision: REUSE_CURRENT,
      reason: 'unsupported-version',
      state: empty,
    }
  }

  if (hasMalformedRoutingMaps(raw)) {
    return {
      kind: 'reuse-current',
      decision: REUSE_CURRENT,
      reason: 'invalid-shape',
      state: empty,
    }
  }

  const state = normalizeRoutingState(raw, nowIso)
  if (!state) {
    return { kind: 'reuse-current', decision: REUSE_CURRENT, reason: 'invalid-shape', state: empty }
  }

  return { kind: 'state', state, source: 'file' }
}

/**
 * 原子寫入路由狀態（永遠寫成目前 ROUTING_STATE_VERSION）。
 * 既有檔讀取失敗時拒絕更新，保留現場供後續修復。
 * @returns true 成功；false 失敗（fail-open，不拋）
 */
export function saveRoutingState(
  dataDir: string,
  state: RoutingState,
  opts: { nowIso?: string } = {}
): boolean {
  const nowIso = opts.nowIso ?? new Date().toISOString()
  const file = routingStatePath(dataDir)
  const payload: RoutingState = {
    version: ROUTING_STATE_VERSION,
    updatedAt: opts.nowIso ?? state.updatedAt ?? nowIso,
    isolated: state.isolated ?? {},
    isolationCounts: state.isolationCounts ?? {},
    promoted: state.promoted ?? {},
    probes: state.probes ?? {},
  }
  let tmp = ''
  try {
    mkdirSync(dirname(file), { recursive: true })
    if (existsSync(file) && routingStateForUpdate(loadRoutingState(dataDir, { nowIso })) === null) {
      return false
    }
    tmp = `${file}.${randomUUID()}.tmp`
    writeFileSync(tmp, JSON.stringify(payload))
    renameSync(tmp, file)
    return true
  } catch {
    return false
  } finally {
    if (tmp) {
      try { rmSync(tmp, { force: true }) } catch { /* 保留主錯誤的 fail-open 契約 */ }
    }
  }
}
