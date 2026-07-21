/**
 * pickReadyTask 候選清單單一入口。
 *
 * 管線：candidateEngines → quarantine gate → candidate-tail enhancer → daily attempt cap gate。
 * - 隔離：仍在隔離期的輪替檔位跳過派工（有健康候選時）
 * - 尾端：subscription 候補補進尾端（無顯式 engineTag 時）
 * - 日額度：今日 attempts 已達 dailyAttemptCap 的檔位視為不可用並輪替
 * 各段皆可經 hooks 替換；缺資料／讀取失敗時維持原 candidateEngines 路徑。
 */
import { candidateEngines } from './rotation.js'
import {
  defaultCandidateTailEnhancer,
  type CandidateTailEnhancer,
} from './candidate-tail.js'
import {
  defaultDailyAttemptCapGate,
  type DailyAttemptCapGate,
} from './daily-attempt-cap-gate.js'
import {
  activeIsolatedTags,
  defaultQuarantineGate,
  type QuarantineGate,
} from './quarantine-gate.js'
import {
  loadRoutingState,
  shouldApplyRoutingState,
} from './routing-state.js'

export type { QuarantineGate } from './quarantine-gate.js'
export type { CandidateTailEnhancer } from './candidate-tail.js'
export type { DailyAttemptCapGate } from './daily-attempt-cap-gate.js'
export { defaultQuarantineGate, activeIsolatedTags } from './quarantine-gate.js'
export { defaultCandidateTailEnhancer } from './candidate-tail.js'
export { defaultDailyAttemptCapGate } from './daily-attempt-cap-gate.js'

export interface PickCandidateInput {
  rotation: string[] | undefined
  defaultEngine: string
  task: { id: string; engineTag?: string }
  failCount: number
  /** 目前仍有效的隔離 tag；未設＝不隔離 */
  isolatedTags?: readonly string[]
  /** subscription 候補；未設＝不補尾 */
  subscriptionTags?: readonly string[]
  /** tag → dailyAttemptCap；未設／空＝不限 */
  dailyAttemptCaps?: ReadonlyMap<string, number>
  /** tag → 今日 attempts；未設／空＝視為 0（不觸發 cap，fail-open） */
  todayAttemptCounts?: ReadonlyMap<string, number>
}

export interface PickCandidateHooks {
  quarantineGate?: QuarantineGate
  candidateTailEnhancer?: CandidateTailEnhancer
  dailyAttemptCapGate?: DailyAttemptCapGate
}

/**
 * 從 dataDir 路由狀態解析目前有效隔離 tag。
 * 缺檔 / 損壞 / 不可用 / 任何例外 → []（fail-open，不改派工路徑）。
 */
export function loadActiveIsolatedTags(dataDir: string, nowIso?: string): string[] {
  try {
    const now = nowIso ?? new Date().toISOString()
    const loaded = loadRoutingState(dataDir, { nowIso: now })
    if (!shouldApplyRoutingState(loaded)) return []
    return activeIsolatedTags(loaded.state.isolated, now)
  } catch {
    return []
  }
}

/**
 * pickReadyTask 唯一候選入口。
 * 顯式 engineTag 仍過 quarantine 與日額度閘，但不補 subscription 尾端（尊重人工指定）。
 */
export function pickCandidateTags(
  input: PickCandidateInput,
  hooks: PickCandidateHooks = {}
): string[] {
  const base = candidateEngines(
    input.rotation,
    input.defaultEngine,
    input.task,
    input.failCount
  )
  const gate = hooks.quarantineGate ?? defaultQuarantineGate
  const enhance = hooks.candidateTailEnhancer ?? defaultCandidateTailEnhancer
  const capGate = hooks.dailyAttemptCapGate ?? defaultDailyAttemptCapGate
  const isolated = new Set(input.isolatedTags ?? [])
  const afterGate = gate(base, isolated)
  const afterTail = input.task.engineTag
    ? afterGate
    : enhance(afterGate, input.subscriptionTags ?? [])
  return capGate(
    afterTail,
    input.dailyAttemptCaps ?? new Map(),
    input.todayAttemptCounts ?? new Map(),
  )
}
