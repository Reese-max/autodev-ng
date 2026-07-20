/**
 * 候選尾端 enhancer（candidate-tail）。
 *
 * 用途：把 subscription 候補 tag 補進候選清單尾端，供 preflight 後退時試到。
 * 契約：不重複、不改既有順序；空清單或全已在內 → 原樣回傳。
 * 可替換：經 pickCandidateTags hooks.candidateTailEnhancer 注入。
 */

export type CandidateTailEnhancer = (
  candidates: readonly string[],
  subscriptionTags: readonly string[]
) => string[]

/** 預設 enhancer：把未出現在 candidates 的 subscription tag 依序 append。 */
export const defaultCandidateTailEnhancer: CandidateTailEnhancer = (
  candidates,
  subscriptionTags
) => {
  if (!subscriptionTags || subscriptionTags.length === 0) return [...candidates]
  const seen = new Set(candidates)
  const tail: string[] = []
  for (const tag of subscriptionTags) {
    if (typeof tag !== 'string' || tag.length === 0 || seen.has(tag)) continue
    seen.add(tag)
    tail.push(tag)
  }
  return tail.length === 0 ? [...candidates] : [...candidates, ...tail]
}
