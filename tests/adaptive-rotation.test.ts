import { expect, test } from 'vitest'
import { weightedRotation, type EngineStat } from '../src/engines/adaptive-rotation.js'

// weightedRotation(base, stats, opts?) → 有效 rotation 列表（以複製槽位表達權重）。
// 規則：樣本 n<minSamples 用基礎權重(1)；成功率越高槽越多；每引擎保底 1 槽；
// 有效列表長度有上限；stats 缺失一律當基礎權重(fail-open)。

const S = (engine: string, n: number, ok: number): EngineStat => ({ engine, n, ok })

test('無 stats → 原樣返回基礎 rotation（fail-open，行為不變）', () => {
  const base = ['a', 'b', 'c']
  expect(weightedRotation(base, [])).toEqual(base)
})

test('高成功率引擎獲得較多槽、低成功率較少，但都 ≥1（保底）', () => {
  const base = ['hi', 'lo']
  // hi: 18/20=90%，lo: 3/20=15%（皆足樣本）
  const out = weightedRotation(base, [S('hi', 20, 18), S('lo', 20, 3)])
  const hi = out.filter(e => e === 'hi').length
  const lo = out.filter(e => e === 'lo').length
  expect(hi).toBeGreaterThan(lo)
  expect(lo).toBeGreaterThanOrEqual(1) // 保底：爛引擎仍留探索槽
  expect(hi).toBeGreaterThanOrEqual(1)
})

test('樣本不足（n<minSamples）的引擎一律基礎權重（不因小樣本暴衝或歸零）', () => {
  const base = ['new', 'old']
  // new: 2/2=100% 但樣本不足；old: 15/30=50% 足樣本
  const out = weightedRotation(base, [S('new', 2, 2), S('old', 30, 15)])
  const newCount = out.filter(e => e === 'new').length
  // 樣本不足 → 基礎權重 1，不得因 100% 就佔滿
  expect(newCount).toBe(1)
  expect(out.filter(e => e === 'old').length).toBeGreaterThanOrEqual(1)
})

test('stats 只覆蓋部分引擎 → 未覆蓋者用基礎權重', () => {
  const base = ['a', 'b', 'c']
  const out = weightedRotation(base, [S('a', 20, 18)]) // 只有 a 有 stats
  expect(out.filter(e => e === 'b').length).toBe(1)
  expect(out.filter(e => e === 'c').length).toBe(1)
  expect(out.filter(e => e === 'a').length).toBeGreaterThanOrEqual(1)
})

test('有效列表長度不超過上限（防爆長）', () => {
  const base = ['a', 'b']
  const out = weightedRotation(base, [S('a', 100, 100), S('b', 100, 1)], { maxSlots: 8 })
  expect(out.length).toBeLessThanOrEqual(8)
  expect(out).toContain('a')
  expect(out).toContain('b') // 保底仍在
})

// #2 回歸守門：base 的重複次數＝手動基礎權重，加權不得抹掉它
test('#2 手動權重（base 重複槽）被尊重，不因去重塌成 1 槽', () => {
  // devin×6 手動主力；有 stats 時仍應維持約 6 槽（±有界 bonus），絕不塌成 1
  const base = ['devin','oc','devin','x','devin','y','devin','z','devin','g','devin']
  const out = weightedRotation(base, [S('devin', 72, 46), S('oc', 15, 13)]) // devin 64%, oc 87%
  const devin = out.filter(e => e === 'devin').length
  expect(devin).toBeGreaterThanOrEqual(5) // 手動 6 槽 + 64% 微幅 → ~6-7，絕不是 1
  expect(out.filter(e => e === 'oc').length).toBeGreaterThanOrEqual(1)
})

test('#5 小樣本剛過門檻不暴衝：單槽 5/5 只小幅加成，不跳到滿權重', () => {
  const base = ['solo']
  const out = weightedRotation(base, [S('solo', 5, 5)]) // 100% 但單槽 base
  // 加法有界：baseCount(1) + bonus(≤bonusSpan/2=2) → 至多 3，不會是舊版的 6
  expect(out.filter(e => e === 'solo').length).toBeLessThanOrEqual(3)
})

test('#6 unique 引擎數超過 maxSlots：以 unique 數為準保底 1，不丟引擎', () => {
  const base = ['a','b','c','d','e']
  const out = weightedRotation(base, [], { maxSlots: 3 }) // 5 unique > maxSlots 3
  for (const e of base) expect(out).toContain(e) // 全保留（保底勝過軟上限）
  expect(out.length).toBe(5)
})

test('基礎 rotation 中不在 stats 的引擎全部保留（不遺漏任何引擎）', () => {
  const base = ['a', 'b', 'c', 'd']
  const out = weightedRotation(base, [S('a', 20, 20), S('b', 20, 0)])
  for (const e of base) expect(out).toContain(e)
})

test('全 0 成功率仍各保底 1 槽（不會產生空列表）', () => {
  const base = ['a', 'b']
  const out = weightedRotation(base, [S('a', 20, 0), S('b', 20, 0)])
  expect(out.length).toBeGreaterThanOrEqual(2)
  expect(out).toContain('a')
  expect(out).toContain('b')
})
