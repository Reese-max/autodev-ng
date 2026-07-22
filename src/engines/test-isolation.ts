/**
 * 測試隔離：每測獨立 workspace、run-stats 快取、環境變數與 fixture 用 stats 讀取器。
 *
 * 背景：restart-routing-consistency 等 spec 在全套高負載下會因共用模組快取、
 * OS 暫存競爭、recentRunStats 預設 50ms fail-open 而出現 intermittent `reuse-current`。
 * 生產預設逾時不變；測試透過本模組顯式注入固定時鐘與較寬的 fixture I/O 逾時。
 */
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  clearRunStatsCache,
  recentRunStats,
  type RunStatsOptions,
  type RunStatsResult,
} from './run-stats.js'

/** fixture 讀 run.db 用，遠高於生產 50ms，避免全套負載誤判 timeout。 */
export const FIXTURE_IO_TIMEOUT_MS = 5_000

export const DEFAULT_FIXED_CLOCK_ISO = '2026-07-20T12:00:00.000Z'

const NESTED_TMP_ENV_KEYS = ['TMPDIR', 'TEMP', 'TMP'] as const
const CLOCK_ENV_KEY = 'ADNG_FIXED_CLOCK_ISO'

export type EnvMap = Record<string, string | undefined>

export interface EnvSnapshot {
  restore(): void
}

/** 擷取指定 env 現值，供 dispose 時完整還原（含原本不存在的鍵）。 */
export function snapshotEnv(keys: readonly string[]): EnvSnapshot {
  const saved = new Map<string, string | undefined>()
  for (const key of keys) {
    saved.set(key, process.env[key])
  }
  return {
    restore(): void {
      for (const [key, value] of saved) {
        if (value === undefined) delete process.env[key]
        else process.env[key] = value
      }
    },
  }
}

export function applyEnv(vars: EnvMap): void {
  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
}

export interface IsolatedWorkspace {
  root: string
  /** 巢狀暫存目錄（子行程 TMPDIR 指向此處，避免共用 OS temp 競爭）。 */
  tmp: string
  dispose(): void
}

/**
 * 每測獨立工作區：root 放 dataDir／fixture；tmp 供巢狀 TMPDIR。
 * dispose 為 best-effort 遞迴刪除，不因殘檔拋錯污染測試結果。
 */
export function createIsolatedWorkspace(prefix = 'adng-iso-'): IsolatedWorkspace {
  const root = mkdtempSync(join(tmpdir(), prefix))
  const tmp = join(root, '.tmp')
  mkdirSync(tmp, { recursive: true })
  return {
    root,
    tmp,
    dispose(): void {
      try {
        rmSync(root, { recursive: true, force: true, maxRetries: 3 })
      } catch {
        /* best-effort */
      }
    },
  }
}

export type IsolatedRecentRunStats = (dbFile: string, opts?: RunStatsOptions) => RunStatsResult

/**
 * 綁定固定時鐘與 fixture 逾時的 recentRunStats，不依賴全域 wall-clock 是否被 fake。
 * 仍走模組快取；呼叫端須在 before/after 以 clearRunStatsCache 切斷跨測污染。
 */
export function createIsolatedRecentRunStats(opts: {
  nowIso: string
  nowMs: number
  timeoutMs?: number
}): IsolatedRecentRunStats {
  const timeoutMs = opts.timeoutMs ?? FIXTURE_IO_TIMEOUT_MS
  return (dbFile: string, callOpts: RunStatsOptions = {}): RunStatsResult =>
    recentRunStats(dbFile, {
      ...callOpts,
      nowIso: callOpts.nowIso ?? opts.nowIso,
      nowMs: callOpts.nowMs ?? (() => opts.nowMs),
      timeoutMs: callOpts.timeoutMs ?? timeoutMs,
    })
}

export interface RoutingFixtureIsolation {
  /** dataDir / fixture 根目錄（唯一、本測專用）。 */
  root: string
  /** 巢狀暫存（TMPDIR/TEMP/TMP 指向此處）。 */
  tmp: string
  nowIso: string
  nowMs: number
  timeoutMs: number
  /** 注入 buildRoutingContext / applyStatsIsolation 用。 */
  recentRunStats: IsolatedRecentRunStats
  /** 還原 env、清空快取、刪工作區。可安全重複呼叫。 */
  dispose(): void
}
export interface BeginRoutingFixtureIsolationOptions {
  prefix?: string
  nowIso?: string
  timeoutMs?: number
  /** 額外 env；undefined 值表示刪除該鍵。 */
  env?: EnvMap
  /** 是否把 TMPDIR/TEMP/TMP 指到工作區內 .tmp（預設 true）。 */
  nestTmpEnv?: boolean
}

/**
 * 開啟一輪路由 fixture 隔離：獨立目錄 + 清空 run-stats 快取 + 固定時鐘 env + 巢狀 TMP。
 * 測試 afterEach 必須呼叫 dispose()。
 */
export function beginRoutingFixtureIsolation(
  options: BeginRoutingFixtureIsolationOptions = {}
): RoutingFixtureIsolation {
  const nowIso = options.nowIso ?? DEFAULT_FIXED_CLOCK_ISO
  const nowMs = Date.parse(nowIso)
  if (!Number.isFinite(nowMs)) {
    throw new Error(`beginRoutingFixtureIsolation: invalid nowIso ${nowIso}`)
  }
  const timeoutMs = options.timeoutMs ?? FIXTURE_IO_TIMEOUT_MS
  const nestTmpEnv = options.nestTmpEnv !== false
  const workspace = createIsolatedWorkspace(options.prefix ?? 'adng-routing-fx-')

  const envKeys = new Set<string>([CLOCK_ENV_KEY, ...(options.env ? Object.keys(options.env) : [])])
  if (nestTmpEnv) {
    for (const k of NESTED_TMP_ENV_KEYS) envKeys.add(k)
  }
  const envSnap = snapshotEnv([...envKeys])

  const nextEnv: EnvMap = {
    [CLOCK_ENV_KEY]: nowIso,
    ...(options.env ?? {}),
  }
  if (nestTmpEnv) {
    nextEnv.TMPDIR = workspace.tmp
    nextEnv.TEMP = workspace.tmp
    nextEnv.TMP = workspace.tmp
  }
  applyEnv(nextEnv)

  clearRunStatsCache()

  const boundStats = createIsolatedRecentRunStats({ nowIso, nowMs, timeoutMs })
  let disposed = false

  return {
    root: workspace.root,
    tmp: workspace.tmp,
    nowIso,
    nowMs,
    timeoutMs,
    recentRunStats: boundStats,
    dispose(): void {
      if (disposed) return
      disposed = true
      clearRunStatsCache()
      envSnap.restore()
      workspace.dispose()
    },
  }
}
