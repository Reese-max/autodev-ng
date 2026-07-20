/**
 * pickReadyTask 候選清單單一入口。
 *
 * 管線：candidateEngines → quarantine gate → candidate-tail enhancer。
 * - 隔離：仍在隔離期的輪替檔位跳過派工（有健康候選時）
 * - 尾端：subscription 候補補進尾端（無顯式 engineTag 時）
 * 兩段皆可經 hooks 替換；缺資料時維持原 candidateEngines 路徑。
 */
import { candidateEngines } from './rotation.js'
import {
  defaultCandidateTailEnhancer,
  type CandidateTailEnhancer,
} from './candidate-tail.js'
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
export { defaultQuarantineGate, activeIsolatedTags } from './quarantine-gate.js'
export { defaultCandidateTailEnhancer } from './candidate-tail.js'

export interface PickCandidateInput {
  rotation: string[] | undefined
  defaultEngine: string
  task: { id: string; engineTag?: string }
  failCount: number
  /** 目前仍有效的隔離 tag；未設＝不隔離 */
  isolatedTags?: readonly string[]
  /** subscription 候補；未設＝不補尾 */
  subscriptionTags?: readonly string[]
}

export interface PickCandidateHooks {
  quarantineGate?: QuarantineGate
  candidateTailEnhancer?: CandidateTailEnhancer
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
 * 顯式 engineTag 仍過 quarantine（隔離可擋），但不補 subscription 尾端（尊重人工指定）。
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
  const isolated = new Set(input.isolatedTags ?? [])
  const afterGate = gate(base, isolated)
  if (input.task.engineTag) return afterGate
  return enhance(afterGate, input.subscriptionTags ?? [])
}
