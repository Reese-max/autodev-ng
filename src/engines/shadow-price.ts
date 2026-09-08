/** Legacy alias-based estimates retained for compatibility only.
 * New accounting uses immutable attempt snapshots; these historical references are
 * neither verified current tariffs nor evidence of realized savings. */

export type ShadowTier = 'free' | 'quota'

const RATES: Array<{ re: RegExp; inPerM: number; outPerM: number; cachedPerM: number; tier: ShadowTier }> = [
  { re: /^devin/, inPerM: 0.5, outPerM: 2, cachedPerM: 0.1, tier: 'free' },
  { re: /^agy/, inPerM: 0.5, outPerM: 2, cachedPerM: 0.1, tier: 'free' },
  { re: /^oc-/, inPerM: 0.14, outPerM: 0.28, cachedPerM: 0.0028, tier: 'free' },
  // kilo-auto/free 路由到多款免費模型（nemotron/laguna/cobuddy…），逐輪不同——比照 flash 檔
  // 估代表值而非精確值；帳單真相另以 kilo stats 核對（試點驗證合約 2026-07-30）。
  { re: /^kilo/, inPerM: 0.14, outPerM: 0.28, cachedPerM: 0.0028, tier: 'free' },
  { re: /^codex-sol/, inPerM: 5, outPerM: 30, cachedPerM: 0.5, tier: 'quota' },
  { re: /^codex-terra/, inPerM: 2.5, outPerM: 15, cachedPerM: 0.25, tier: 'quota' },
  { re: /^codex-luna/, inPerM: 1, outPerM: 6, cachedPerM: 0.1, tier: 'quota' },
  { re: /^grok/, inPerM: 3, outPerM: 15, cachedPerM: 0.3, tier: 'quota' },
]

/** 派工限制沿用影子帳既有名單，避免另維護一份 free-tier 表。 */
export function isShadowFreeTierEngine(engine: string): boolean {
  // Freebuff selects models dynamically; allow free-only dispatch without inventing an API price estimate.
  return /^freebuff(?::|$)/.test(engine) || RATES.some(rate => rate.tier === 'free' && rate.re.test(engine))
}

export function shadowCostUsd(engine: string, tokensIn: number, tokensOut: number, tokensCached = 0): { usd: number; tier: ShadowTier } | null {
  if (![tokensIn, tokensOut, tokensCached].every(n => Number.isSafeInteger(n) && n >= 0)) return null
  const r = RATES.find(x => x.re.test(engine))
  if (!r) return null
  const cached = Math.min(tokensCached, tokensIn) // 防呆：cached 不得超過 in
  const uncached = tokensIn - cached
  return { usd: (uncached / 1e6) * r.inPerM + (cached / 1e6) * r.cachedPerM + (tokensOut / 1e6) * r.outPerM, tier: r.tier }
}

/** digest 用：當日影子帳分層總和；無 token 記錄的層為 0。 */
export function shadowTotals(stats: ReadonlyArray<{ engine: string; tokensIn: number; tokensOut: number; tokensCached?: number }>): { free: number; quota: number } {
  const t = { free: 0, quota: 0 }
  for (const s of stats) {
    const c = shadowCostUsd(s.engine, s.tokensIn, s.tokensOut, s.tokensCached ?? 0)
    if (c) t[c.tier] += c.usd
  }
  return t
}
