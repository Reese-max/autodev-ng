/** 免費層影子帳（假價錢 2026-07-29）：免費 token 若按市價 API 計費的估值——「艦隊幫你省了多少」。
 * 單價是可調假設（2026-07 檔位，量級對即可，非精確報價）：
 *   devin（swe-1.6）／agy：類比 frontier 級 API $3/M in、$15/M out
 *   oc-*（opencode free 模型）：類比開源模型 API $0.5/M in、$2/M out
 * 只算展示不入帳；非免費層回 null（訂閱額度引擎的機會成本走 costPerRunUsd 舊制）。 */

const RATES: Array<{ re: RegExp; inPerM: number; outPerM: number }> = [
  { re: /^devin/, inPerM: 3, outPerM: 15 },
  { re: /^agy/, inPerM: 3, outPerM: 15 },
  { re: /^oc-/, inPerM: 0.5, outPerM: 2 },
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
