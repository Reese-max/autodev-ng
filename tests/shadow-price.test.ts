import { expect, test } from 'vitest'
import { shadowCostUsd, shadowTotals } from '../src/engines/shadow-price.js'

test('shadowCostUsd：free 層檔位（devin 同門超額、oc flash）', () => {
  expect(shadowCostUsd('devin', 2_000_000, 20_000)).toEqual({ usd: expect.closeTo(2 * 0.5 + 0.02 * 2), tier: 'free' })
  expect(shadowCostUsd('oc-mimo', 1_000_000, 10_000)).toEqual({ usd: expect.closeTo(0.14 + 0.0028), tier: 'free' })
})

test('shadowCostUsd：quota 層檔位（codex 三分身各價、xhigh 同 terra、grok）', () => {
  expect(shadowCostUsd('codex-sol', 1_000_000, 100_000)).toEqual({ usd: expect.closeTo(5 + 3), tier: 'quota' })
  expect(shadowCostUsd('codex-terra', 1_000_000, 100_000)).toEqual({ usd: expect.closeTo(2.5 + 1.5), tier: 'quota' })
  expect(shadowCostUsd('codex-terra-xhigh', 1_000_000, 100_000)).toEqual({ usd: expect.closeTo(2.5 + 1.5), tier: 'quota' }) // 同模型同價
  expect(shadowCostUsd('codex-luna', 1_000_000, 100_000)).toEqual({ usd: expect.closeTo(1 + 0.6), tier: 'quota' })
  expect(shadowCostUsd('grok', 1_000_000, 100_000)).toEqual({ usd: expect.closeTo(3 + 1.5), tier: 'quota' }) // composer-2.5-fast 檔
})

test('shadowCostUsd：真金層（opencode/claude）null——已在 billed 帳不重複計', () => {
  expect(shadowCostUsd('opencode', 1_000_000, 10_000)).toBeNull()
  expect(shadowCostUsd('claude', 1_000_000, 10_000)).toBeNull()
})

test('shadowTotals：分層加總，零記錄層為 0', () => {
  const t = shadowTotals([
    { engine: 'devin', tokensIn: 7_130_000, tokensOut: 37_300 },
    { engine: 'oc-mimo', tokensIn: 2_000_000, tokensOut: 15_000 },
    { engine: 'codex-sol', tokensIn: 400_000, tokensOut: 2_000 },
    { engine: 'opencode', tokensIn: 500_000, tokensOut: 5_000 }, // 真金忽略
  ])
  expect(t.free).toBeCloseTo(7.13 * 0.5 + 0.0373 * 2 + 2 * 0.14 + 0.015 * 0.28, 3)
  expect(t.quota).toBeCloseTo(0.4 * 5 + 0.002 * 30, 3)
  expect(shadowTotals([])).toEqual({ free: 0, quota: 0 })
})
