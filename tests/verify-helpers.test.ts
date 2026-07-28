import { expect, test } from 'vitest'
import { composeJudgeDiff } from '../src/engines/verify-helpers.js'

test('composeJudgeDiff：短 diff 原文保留、檔案清單前置', () => {
  const out = composeJudgeDiff('M\tsrc/a.ts', 'diff body')
  expect(out).toContain('變更檔案清單')
  expect(out).toContain('M\tsrc/a.ts')
  expect(out).toContain('diff body')
  expect(out).not.toContain('截斷')
})

test('composeJudgeDiff：超長 diff 截尾並標示，清單仍完整', () => {
  const big = 'x'.repeat(70_000)
  const out = composeJudgeDiff('M\tsrc/a.ts\nA\tsrc/b.ts', big, 60_000)
  expect(out).toContain('A\tsrc/b.ts')
  expect(out).toContain('已截斷')
  expect(out.length).toBeLessThan(62_000)
})

test('composeJudgeDiff：nameStatus 空時不加頭（fail-open 等價原始 diff）', () => {
  expect(composeJudgeDiff('', 'body')).toBe('body')
})
