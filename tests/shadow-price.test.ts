import { expect, test } from 'vitest'
import { shadowCostUsd, freeTierShadowTotal } from '../src/engines/shadow-price.js'

test('shadowCostUsd：devin 同門超額檔位、oc flash 檔位、非免費層 null', () => {
  expect(shadowCostUsd('devin', 2_000_000, 20_000)).toBeCloseTo(2 * 0.5 + 0.02 * 2) // $1.04
  expect(shadowCostUsd('oc-mimo', 1_000_000, 10_000)).toBeCloseTo(0.14 + 0.0028)   // $0.1428
  expect(shadowCostUsd('codex-sol', 1_000_000, 10_000)).toBeNull()                  // 訂閱額度不算
  expect(shadowCostUsd('grok', 1_000_000, 0)).toBeNull()
})

test('freeTierShadowTotal：只加總免費層，零記錄回 0', () => {
  const total = freeTierShadowTotal([
    { engine: 'devin', tokensIn: 7_130_000, tokensOut: 37_300 },
    { engine: 'oc-mimo', tokensIn: 2_000_000, tokensOut: 15_000 },
    { engine: 'codex-sol', tokensIn: 400_000, tokensOut: 2_000 }, // 忽略
  ])
  expect(total).toBeCloseTo(7.13 * 0.5 + 0.0373 * 2 + 2 * 0.14 + 0.015 * 0.28, 2)
  expect(freeTierShadowTotal([])).toBe(0)
})
