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
        // 先寫快取成功才 append event：否則快取寫不進去時 prev 永遠是舊值，每輪都判「變化」而無界刷屏（修 #7）
        let persisted = false
        try { writeFileSync(cacheFile, snapshot); persisted = true } catch { /* 寫失敗不影響派工 */ }
        if (persisted) quiet(() => events.append('rotation-weights', { counts }))
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
  /** 樣本 <minSamples 的引擎 bonus=0（維持手動基礎權重），防小樣本亂跳。預設 5。 */
  minSamples?: number
  /** 有效 rotation 列表長度上限，防爆長。預設 24（但每引擎保底 1，故實際不低於 unique 引擎數）。 */
  maxSlots?: number
  /** 成功率加成幅度：bonus = round((rate-0.5) * bonusSpan)，落在 ±bonusSpan/2。預設 4。 */
  bonusSpan?: number
}

/**
 * 依成功率把基礎 rotation 展開為有效 rotation。核心：base 的「重複次數」＝操作者手動基礎權重
 * （如 devin×6），成功率只在其上做**有界加減**，絕不抹掉手動意圖（修 #2 去重回歸）：
 * - effectiveWeight = max(1, baseCount + bonus)；bonus = round((successRate-0.5) * bonusSpan)。
 *   → 成功率 0.5＝不動、高於 0.5 加、低於 0.5 減；bonus 有界（±bonusSpan/2）故不暴衝（修 #5）。
 * - 樣本不足（n<minSamples）或無 stats：bonus=0（維持手動權重）。
 * - 每引擎保底 1 槽；base 中所有引擎必留。
 * - 總長超 maxSlots 時從高權重引擎砍到保底 1；unique 引擎數本身超上限時以 unique 數為準（修 #6）。
 */
export function weightedRotation(
  base: readonly string[],
  stats: readonly EngineStat[],
  opts: WeightedRotationOpts = {},
): string[] {
  if (base.length === 0) return []
  const minSamples = opts.minSamples ?? 5
  const bonusSpan = opts.bonusSpan ?? 4

  // 手動基礎權重＝各引擎在 base 出現次數（保留 devin×6 這類人工配重）
  const baseCount = new Map<string, number>()
  const order: string[] = []
  for (const engine of base) {
    if (!baseCount.has(engine)) order.push(engine)
    baseCount.set(engine, (baseCount.get(engine) ?? 0) + 1)
  }

  const statByEngine = new Map(stats.map(s => [s.engine, s]))
  const weight = new Map<string, number>()
  for (const engine of order) {
    const s = statByEngine.get(engine)
    let bonus = 0
    if (s && s.n >= minSamples && s.n > 0) {
      const rate = Math.max(0, Math.min(1, s.ok / s.n))
      bonus = Math.round((rate - 0.5) * bonusSpan)
    }
    weight.set(engine, Math.max(1, (baseCount.get(engine) ?? 1) + bonus)) // 保底 1
  }

  // maxSlots 為軟上限；每引擎保底 1，故不可能低於 unique 引擎數（修 #6：以較大者為準，契約誠實）
  const maxSlots = Math.max(opts.maxSlots ?? 24, order.length)
  const total = () => [...weight.values()].reduce((a, b) => a + b, 0)
  while (total() > maxSlots) {
    let target: string | undefined
    let max = 1
    for (const e of order) {
      const w = weight.get(e)!
      if (w > max) { max = w; target = e }
    }
    if (!target) break // 全為保底 1 仍超（unique>maxSlots，上面已夾住不會發生）
    weight.set(target, weight.get(target)! - 1)
  }

  // 展開：依 base 首現順序，各引擎重複其權重次數（保序、確定性）
  const out: string[] = []
  for (const engine of order) {
    const w = weight.get(engine)!
    for (let i = 0; i < w; i++) out.push(engine)
  }
  return out
}
