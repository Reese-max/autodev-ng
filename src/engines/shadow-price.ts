/** 影子帳（真實市價 2026-07-29 查證）：token 若按市價 API 計費的估值，分兩層：
 *   free  ＝零成本層（devin/oc 系/agy）——實付 $0，影子帳＝艦隊幫你省的錢
 *   quota ＝訂閱額度層（codex 系/grok）——額度內不另付費，影子帳＝額度的市價值
 * 檔位來源（官方定價頁，查證日 2026-07-29）：
 *   devin（swe-1.6）：無公開 token 牌價；採同門 Cognition 官方超額價（Windsurf Adaptive
 *     router）in $0.50/M、out $2.00/M。agy 同屬 coding-agent 檔比照。
 *   oc 系 free 模型：flash 檔官方價 $0.14/$0.28 —— deepseek-v4-flash（api-docs.deepseek.com）
 *     與小米 mimo-v2.5（mimo.mi.com）官方同價；nemotron :free 實際 $0，保守套 flash 檔。
 *   codex 三分身（developers.openai.com/api/docs/pricing）：gpt-5.6-sol $5/$30、
 *     gpt-5.6-terra $2.50/$15（xhigh 同模型同價）、gpt-5.6-luna $1/$6。
 *   grok（x.ai，grok-4.3 現價）：$1.25/$2.50。
 * 長前綴檔位排前（codex-terra 先於任何通配）。只算展示不入帳；opencode/claude 真金層
 * 回 null（已在 billed 帳，不重複計）。 */

export type ShadowTier = 'free' | 'quota'

const RATES: Array<{ re: RegExp; inPerM: number; outPerM: number; tier: ShadowTier }> = [
  { re: /^devin/, inPerM: 0.5, outPerM: 2, tier: 'free' },
  { re: /^agy/, inPerM: 0.5, outPerM: 2, tier: 'free' },
  { re: /^oc-/, inPerM: 0.14, outPerM: 0.28, tier: 'free' },
  { re: /^codex-sol/, inPerM: 5, outPerM: 30, tier: 'quota' },
  { re: /^codex-terra/, inPerM: 2.5, outPerM: 15, tier: 'quota' },
  { re: /^codex-luna/, inPerM: 1, outPerM: 6, tier: 'quota' },
  { re: /^grok/, inPerM: 1.25, outPerM: 2.5, tier: 'quota' },
]

export function shadowCostUsd(engine: string, tokensIn: number, tokensOut: number): { usd: number; tier: ShadowTier } | null {
  const r = RATES.find(x => x.re.test(engine))
  if (!r) return null
  return { usd: (tokensIn / 1e6) * r.inPerM + (tokensOut / 1e6) * r.outPerM, tier: r.tier }
}

/** digest 用：當日影子帳分層總和；無 token 記錄的層為 0。 */
export function shadowTotals(stats: ReadonlyArray<{ engine: string; tokensIn: number; tokensOut: number }>): { free: number; quota: number } {
  const t = { free: 0, quota: 0 }
  for (const s of stats) {
    const c = shadowCostUsd(s.engine, s.tokensIn, s.tokensOut)
    if (c) t[c.tier] += c.usd
  }
  return t
}
