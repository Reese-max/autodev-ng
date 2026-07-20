/**
 * 輪替檔位隔離閘（quarantine gate）。
 *
 * 用途：從候選清單移除仍在隔離期的 tag，讓 pickReadyTask 跳過派工。
 * 契約：有健康候選時過濾隔離檔；全部被隔離 → fail-open 回原清單（不把派工堵死）。
 * 可替換：經 pickCandidateTags hooks.quarantineGate 注入。
 */

export type QuarantineGate = (
  candidates: readonly string[],
  isolated: ReadonlySet<string>
) => string[]

/** 預設閘：過濾 isolated；若濾光則 fail-open 保留原清單。 */
export const defaultQuarantineGate: QuarantineGate = (candidates, isolated) => {
  if (isolated.size === 0) return [...candidates]
  const kept = candidates.filter(tag => !isolated.has(tag))
  return kept.length > 0 ? kept : [...candidates]
}

/** 從 routing-state.isolated map 取出 now 仍有效的 tag（untilTs > now）。 */
export function activeIsolatedTags(
  isolated: Record<string, { untilTs: string }>,
  nowIso: string
): string[] {
  const now = Date.parse(nowIso)
  if (!Number.isFinite(now)) return []
  const out: string[] = []
  for (const [tag, entry] of Object.entries(isolated)) {
    if (!tag || typeof entry?.untilTs !== 'string' || entry.untilTs.length === 0) continue
    const until = Date.parse(entry.untilTs)
    if (Number.isFinite(until) && until > now) out.push(tag)
  }
  return out
}
