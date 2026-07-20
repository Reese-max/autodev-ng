/** pickReadyTask 的唯讀診斷摘要；只整理資料，不參與派工或寫入狀態。 */
export type PickReadyTaskResultLike =
  | string
  | { engineTag: string; fixedCost: number | undefined }
  | { kind: string; reason?: string }

export interface PickReadyRoutingSummaryInput {
  readonly result: PickReadyTaskResultLike
  readonly triggerReason: string
  readonly candidateRotation: readonly string[]
  readonly fallbackToOriginalPath: boolean
}

export interface PickReadyRoutingSummary {
  readonly finalResult: string
  readonly triggerReason: string
  readonly candidateRotation: readonly string[]
  readonly fallbackToOriginalPath: boolean
}

export function pickReadyTaskBranchResult(result: PickReadyTaskResultLike): string {
  if (typeof result === 'string') return result
  if ('engineTag' in result) {
    const cost = result.fixedCost === undefined ? 'metered' : `fixed=${result.fixedCost}`
    return `picked:${result.engineTag}:${cost}`
  }
  return result.reason ? `${result.kind}:${result.reason}` : result.kind
}

export function summarizePickReadyRouting(
  input: PickReadyRoutingSummaryInput
): PickReadyRoutingSummary {
  return Object.freeze({
    finalResult: pickReadyTaskBranchResult(input.result),
    triggerReason: input.triggerReason,
    candidateRotation: Object.freeze([...input.candidateRotation]),
    fallbackToOriginalPath: input.fallbackToOriginalPath,
  })
}
