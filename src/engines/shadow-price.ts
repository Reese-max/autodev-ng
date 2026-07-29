/** 免費層影子帳（真實市價 2026-07-29 查證）：免費 token 若按市價 API 計費的估值。
 * 檔位全部取自官方定價頁（查證日 2026-07-29）：
 *   devin（swe-1.6）：無公開 token 牌價；採同門 Cognition 官方超額價（Windsurf Adaptive
 *     router）in $0.50/M、out $2.00/M —— devin.ai/pricing 自助方案已改訂閱制不標 ACU 單價。
 *   oc 系 free 模型：flash 檔官方價 in $0.14/M、out $0.28/M —— deepseek-v4-flash
 *     （api-docs.deepseek.com）與小米 mimo-v2.5（mimo.mi.com）官方同價（刻意對標）；
 *     nemotron :free 端點實際 $0，保守套 flash 檔。
 *   agy：同屬 coding-agent 檔，比照 devin。
 * 注意語意：這是「同級 API 的市價」軌；若問「免費層消失後改用 codex/Claude 的替代成本」
 * （gpt-5.6-terra $2.5/$15、Claude Sonnet $3/$15）數字會高一個量級——顯示採可查證的市價軌。
 * 只算展示不入帳；非免費層回 null（訂閱額度引擎的機會成本走 costPerRunUsd 舊制）。 */

const RATES: Array<{ re: RegExp; inPerM: number; outPerM: number }> = [
  { re: /^devin/, inPerM: 0.5, outPerM: 2 },
  { re: /^agy/, inPerM: 0.5, outPerM: 2 },
  { re: /^oc-/, inPerM: 0.14, outPerM: 0.28 },
]

export function shadowCostUsd(engine: string, tokensIn: number, tokensOut: number): number | null {
  const r = RATES.find(x => x.re.test(engine))
  if (!r) return null
  return (tokensIn / 1e6) * r.inPerM + (tokensOut / 1e6) * r.outPerM
}

/** digest 用：免費層引擎的當日影子帳總和；無免費層 token 記錄回 0。 */
export function freeTierShadowTotal(stats: ReadonlyArray<{ engine: string; tokensIn: number; tokensOut: number }>): number {
  let total = 0
  for (const s of stats) {
    const c = shadowCostUsd(s.engine, s.tokensIn, s.tokensOut)
    if (c !== null) total += c
  }
  return total
}
