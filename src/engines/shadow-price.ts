/** 影子帳（真實市價 2026-07-29 查證）：token 若按市價 API 計費的估值，分兩層：
 *   free  ＝零成本層（devin/oc 系/agy）——實付 $0，影子帳＝艦隊幫你省的錢
 *   quota ＝訂閱額度層（codex 系/grok）——額度內不另付費，影子帳＝額度的市價值
 * cache 命中另計（2026-07-29 修）：cached input 按官方 cached 價（OpenAI＝input 的 10%、
 * DeepSeek/MiMo cache-hit $0.0028、Windsurf cache-read $0.10）——實測 codex 單輪 95% 命中，
 * 全價計會灌水近一個量級。
 * 檔位來源（官方定價頁）：
 *   devin（swe-1.6）：Cognition 官方超額價 $0.50/$2.00，cache-read $0.10。agy 比照。
 *   oc 系 free：flash 檔 $0.14/$0.28，cache-hit $0.0028（deepseek 與 mimo 官方同價）。
 *   codex：gpt-5.6-sol $5/$30（cached $0.50）、terra $2.50/$15（cached $0.25，xhigh 同）、
 *     luna $1/$6（cached $0.10）。
 *   grok：實跑 composer-2.5-fast $3/$15（CLI 無 usage，恆 0；cached 假設比照 10%）。
 * 長前綴檔位排前。真金層（opencode/claude）回 null——已在 billed 帳。 */

export type ShadowTier = 'free' | 'quota'

const RATES: Array<{ re: RegExp; inPerM: number; outPerM: number; cachedPerM: number; tier: ShadowTier }> = [
  { re: /^devin/, inPerM: 0.5, outPerM: 2, cachedPerM: 0.1, tier: 'free' },
  { re: /^agy/, inPerM: 0.5, outPerM: 2, cachedPerM: 0.1, tier: 'free' },
  { re: /^oc-/, inPerM: 0.14, outPerM: 0.28, cachedPerM: 0.0028, tier: 'free' },
  { re: /^codex-sol/, inPerM: 5, outPerM: 30, cachedPerM: 0.5, tier: 'quota' },
  { re: /^codex-terra/, inPerM: 2.5, outPerM: 15, cachedPerM: 0.25, tier: 'quota' },
  { re: /^codex-luna/, inPerM: 1, outPerM: 6, cachedPerM: 0.1, tier: 'quota' },
  { re: /^grok/, inPerM: 3, outPerM: 15, cachedPerM: 0.3, tier: 'quota' },
]

export function shadowCostUsd(engine: string, tokensIn: number, tokensOut: number, tokensCached = 0): { usd: number; tier: ShadowTier } | null {
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
