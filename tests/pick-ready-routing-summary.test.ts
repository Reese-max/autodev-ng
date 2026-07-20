import { expect, test } from 'vitest'
import { summarizePickReadyRouting } from '../src/engines/pick-ready-routing-summary.js'

test('整理當次路由結果且不持有可變候選清單', () => {
  const candidateRotation = ['qwen', 'codex']
  const summary = summarizePickReadyRouting({
    result: { engineTag: 'codex', fixedCost: 0 },
    triggerReason: 'qwen-isolated',
    candidateRotation,
    fallbackToOriginalPath: false,
  })

  candidateRotation.push('spark')
  expect(summary).toEqual({
    finalResult: 'picked:codex:fixed=0',
    triggerReason: 'qwen-isolated',
    candidateRotation: ['qwen', 'codex'],
    fallbackToOriginalPath: false,
  })
  expect(Object.isFrozen(summary)).toBe(true)
  expect(Object.isFrozen(summary.candidateRotation)).toBe(true)
})

test('保留回退原路徑與非派工結果', () => {
  expect(summarizePickReadyRouting({
    result: 'preflight-failed',
    triggerReason: 'no-routing-data',
    candidateRotation: ['qwen'],
    fallbackToOriginalPath: true,
  })).toEqual({
    finalResult: 'preflight-failed',
    triggerReason: 'no-routing-data',
    candidateRotation: ['qwen'],
    fallbackToOriginalPath: true,
  })
})
