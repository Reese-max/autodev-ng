import { expect, test } from 'vitest'
import { lessonFingerprints, observeLearning, summarizeLearning } from '../src/learn/outcomes.js'
import type { EventLog } from '../src/events.js'

test('同任務/模型/版本才能比較；中斷、未驗收與少量樣本不得宣稱改善', () => {
  const events: object[] = [], log: Pick<EventLog, 'append'> = { append: (type, data) => { events.push({ type, ...data }) } }
  const baseCommit = 'a'.repeat(40), commit = 'b'.repeat(40), lessonsText = '- L001 [2026-09-08] Handle empty input'
  for (let i = 0; i < 3; i++) {
    observeLearning(log, { executionId: `before-${i}`, taskId: 'same', model: 'astra', baseCommit, lessonsText: '' })({ accepted: false, failure: 'empty input' })
    observeLearning(log, { executionId: `after-${i}`, taskId: 'same', model: 'astra', baseCommit, lessonsText })({ accepted: true, commit })
  }
  observeLearning(log, { executionId: 'interrupted', taskId: 'same', model: 'astra', baseCommit, lessonsText })
  observeLearning(log, { executionId: 'other-source', taskId: 'same', model: 'astra', baseCommit: 'c'.repeat(40), lessonsText })({ accepted: true, commit })
  observeLearning(log, { executionId: 'missing-commit', taskId: 'different', model: 'astra', baseCommit, lessonsText })({ accepted: true })
  const result = summarizeLearning(events.map(e => JSON.stringify(e)).join('\n'))
  expect(result).toMatchObject({ observed: 8, pendingOrInterrupted: 1, malformed: 0, conflicts: 0, causalImprovement: null })
  expect(result.comparisons.find(r => r.baseCommit === baseCommit && r.taskId === 'same')).toMatchObject({ status: 'observed-comparison', acceptanceRateDelta: 1 })
  expect(result.comparisons.find(r => r.baseCommit !== baseCommit)).toMatchObject({ status: 'insufficient-matched-observations', acceptanceRateDelta: null })
  expect(result.rows.find(r => r.taskId === 'different')?.accepted).toBe(0)
  expect(result.rows.find(r => !r.lessons.length)?.repeatedFailures).toBe(2)
})

test('教訓內容指紋不依賴編號/日期；損壞紀錄明確呈現', () => {
  expect(lessonFingerprints('- L001 [2026-01-01] same lesson')).toEqual(lessonFingerprints('- L008 [2026-09-08] same   lesson'))
  expect(summarizeLearning('{broken').malformed).toBe(1)
  expect(summarizeLearning('').comparisons).toEqual([])
})
