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

/** 目前寫入版本；讀取時支援同主版本缺欄回填，高於本版且無法辨識則 reuse-current。 */
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

function normalizeIsolated(raw: unknown): Record<string, IsolationEntry> {
  if (!isPlainObject(raw)) return {}
  const out: Record<string, IsolationEntry> = {}
  for (const [tag, entry] of Object.entries(raw)) {
    if (!tag || !isPlainObject(entry)) continue
    out[tag] = {
      untilTs: asString(entry.untilTs),
      reason: asString(entry.reason),
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
      score: asNonNegInt(entry.score, 0),
      promotedAt: asString(entry.promotedAt),
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
      hits: asNonNegInt(entry.hits, 0),
      lastTs: asString(entry.lastTs),
    }
  }
  return out
}

/**
 * 將任意 JSON 正規化為 v1 狀態。
 * - 可辨識的物件（含缺 version / 缺欄）→ 回填預設
 * - 未來主版本若仍帶 v1 可讀欄位 → 降級讀取（向前相容讀）
 * - 完全無法辨識 → null（呼叫端 reuse-current）
 */
export function normalizeRoutingState(raw: unknown, nowIso = new Date().toISOString()): RoutingState | null {
  if (!isPlainObject(raw)) return null

  const versionRaw = raw.version
  if (versionRaw !== undefined && versionRaw !== null) {
    if (typeof versionRaw !== 'number' || !Number.isFinite(versionRaw) || versionRaw < 1) {
      // 非法 version 但仍嘗試讀已知欄位；若連 map 都沒有則判廢
      const hasMaps =
        isPlainObject(raw.isolated) || isPlainObject(raw.promoted) || isPlainObject(raw.probes)
      if (!hasMaps) return null
    } else if (versionRaw > ROUTING_STATE_VERSION) {
      // 未來版本：僅在仍暴露 v1 欄位時降級讀取，否則 unsupported
      const hasMaps =
        isPlainObject(raw.isolated) || isPlainObject(raw.promoted) || isPlainObject(raw.probes)
      if (!hasMaps) return null
    }
  }

  return {
    version: ROUTING_STATE_VERSION,
    updatedAt: asString(raw.updatedAt, nowIso),
    isolated: normalizeIsolated(raw.isolated),
    promoted: normalizePromoted(raw.promoted),
    probes: normalizeProbes(raw.probes),
  }
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
    typeof versionRaw === 'number' &&
    Number.isFinite(versionRaw) &&
    versionRaw > ROUTING_STATE_VERSION
  ) {
    const hasMaps =
      isPlainObject(raw.isolated) || isPlainObject(raw.promoted) || isPlainObject(raw.probes)
    if (!hasMaps) {
      return {
        kind: 'reuse-current',
        decision: REUSE_CURRENT,
        reason: 'unsupported-version',
        state: empty,
      }
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
