/** review gate（第三層驗證）：對 diff 做對抗式審查。純解析＋fail-open 判定，放子目錄不計 kernel 帳。
 * 契約：review 引擎回覆首行 `REVIEW: PASS` 或 `REVIEW: REJECT <理由>`。
 * 只有明確 REJECT 才拒收；未接／逾時／崩潰／無法解析一律 skip（pass-with-alert，鐵律 #4）。 */
export type ReviewOutcome =
  | { kind: 'pass' }
  | { kind: 'reject'; reason: string }
  | { kind: 'skip'; alert: string }

export async function runReviewGate(
  reviewRun: ((a: { diff: string; taskText: string }) => Promise<string>) | undefined,
  args: { diff: string; taskText: string },
): Promise<ReviewOutcome> {
  if (!reviewRun) return { kind: 'skip', alert: 'review-gate-skipped: reviewEngine 已設但未接 reviewRun' }
  try {
    const out = await reviewRun(args)
    const m = /^\s*REVIEW:\s*(PASS|REJECT)\b(.*)/im.exec(out)
    if (!m) return { kind: 'skip', alert: 'review-gate-skipped: 無法解析 REVIEW 契約' }
    if ((m[1] ?? '').toUpperCase() === 'REJECT') return { kind: 'reject', reason: (m[2] ?? '').trim().slice(0, 200) }
    return { kind: 'pass' }
  } catch (err) {
    return { kind: 'skip', alert: `review-gate-skipped: ${String(err).slice(0, 200)}` }
  }
}
