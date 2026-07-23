import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { quiet, type EventLog } from '../events.js'
import type { RunDb } from '../db.js'

const WEIGHT_WINDOW_DAYS = 7

/** 近 WEIGHT_WINDOW_DAYS 天各引擎成功率（供 weightedRotation）；並在有效權重變化時 append
 * rotation-weights 事件（比對 dataDir 快取，僅變化時記，不刷屏）。任何 I/O 例外 → 回 []
 * （不加權，派工行為完全不變，fail-open）。放子目錄不計 kernel 行數帳。 */
export function loadEngineStatsForWeighting(
  db: RunDb, events: EventLog, dataDir: string, rotation: string[] | undefined,
): EngineStat[] {
  try {
    const since = new Date(Date.now() - WEIGHT_WINDOW_DAYS * 86400000).toISOString()
    const stats = db.engineStatsSince(since)
    if (rotation && rotation.length > 0 && stats.length > 0) {
      const eff = weightedRotation(rotation, stats)
      const counts: Record<string, number> = {}
      for (const e of eff) counts[e] = (counts[e] ?? 0) + 1
      const snapshot = JSON.stringify(counts)
      const cacheFile = join(dataDir, 'rotation-weights.json')
      let prev = ''
      try { prev = readFileSync(cacheFile, 'utf8') } catch { /* 無快取＝首次 */ }
      if (prev !== snapshot) {
        quiet(() => events.append('rotation-weights', { counts }))
        try { writeFileSync(cacheFile, snapshot) } catch { /* 寫快取失敗不影響派工 */ }
      }
    }
    return stats
  } catch {
    return [] // fail-open：不加權
  }
}

/** 成功率加權輪替（2026-07-23）：靜態 engineRotation 槽位無法反映引擎實測差異
 * （run.db 顯示 oc-deepseek 87% vs oc-nemotron 17%，且有專案親和性）。weightedRotation
 * 依近期成功率把基礎 rotation 重排為「有效 rotation」——高成功率引擎複製較多槽、
 * 低成功率較少但保底 1 槽（探索 vs 利用），再交給既有 candidateEngines 走 hash 起點。
 * 純函式、無副作用；stats 缺失／樣本不足一律退回基礎權重（fail-open）。 */

export interface EngineStat {
  engine: string
  n: number // 樣本數（attempts）
  ok: number // 成功數
}

export interface WeightedRotationOpts {
  /** 樣本 <minSamples 的引擎用基礎權重（不升不降），防小樣本亂跳。預設 5。 */
  minSamples?: number
  /** 有效 rotation 列表長度上限，防爆長。預設 24。 */
  maxSlots?: number
  /** 每引擎最大槽數，防單一引擎壟斷。預設 6。 */
  maxPerEngine?: number
}

/**
 * 依成功率把基礎 rotation 展開為有效 rotation（複製槽位表達權重）。
 * - 樣本足（n>=minSamples）：權重 = 1 + round(successRate * (maxPerEngine-1))，落在 [1, maxPerEngine]。
 * - 樣本不足或無 stats：權重 = 1（基礎）。
 * - 每引擎保底 1 槽；base 中所有引擎必留。
 * - 總長超過 maxSlots 時，等比縮回但保底 1（先砍高權重引擎的多餘槽）。
 */
export function weightedRotation(
  base: readonly string[],
  stats: readonly EngineStat[],
  opts: WeightedRotationOpts = {},
): string[] {
  if (base.length === 0) return []
  const minSamples = opts.minSamples ?? 5
  const maxPerEngine = opts.maxPerEngine ?? 6
  const maxSlots = opts.maxSlots ?? 24

  const statByEngine = new Map(stats.map(s => [s.engine, s]))
  // 每引擎權重（槽數）
  const weight = new Map<string, number>()
  for (const engine of base) {
    if (weight.has(engine)) continue // base 若有重複，只算一次基礎
    const s = statByEngine.get(engine)
    if (!s || s.n < minSamples || s.n <= 0) {
      weight.set(engine, 1) // 樣本不足／無 stats → 基礎權重
      continue
    }
    const rate = Math.max(0, Math.min(1, s.ok / s.n))
    weight.set(engine, 1 + Math.round(rate * (maxPerEngine - 1))) // [1, maxPerEngine]
  }

  const uniqueEngines = [...weight.keys()]
  // 總長超上限 → 逐步從當前最高權重引擎砍 1（保底 1）直到符合
  let total = () => [...weight.values()].reduce((a, b) => a + b, 0)
  while (total() > maxSlots) {
    // 找權重 >1 的最大者砍 1；全為 1 仍超則無法再縮（引擎數本身就超上限），跳出
    let target: string | undefined
    let max = 1
    for (const e of uniqueEngines) {
      const w = weight.get(e)!
      if (w > max) { max = w; target = e }
    }
    if (!target) break
    weight.set(target, weight.get(target)! - 1)
  }

  // 展開為列表：依 base 順序，各引擎重複其權重次數（保序、確定性）
  const out: string[] = []
  for (const engine of uniqueEngines) {
    const w = weight.get(engine)!
    for (let i = 0; i < w; i++) out.push(engine)
  }
  return out
}
