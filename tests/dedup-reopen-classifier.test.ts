import { describe, expect, test } from 'vitest'
import {
  BLOCKED_REOPEN_EXHAUSTED_EVENT,
  classifyDedupReopen,
} from '../src/autopilot/dedup-reopen-classifier.js'

describe('classifyDedupReopen', () => {
  test.each(['never-reopened', 'reopened', undefined] as const)(
    'done 固定拒絕，不受重開歷史 %s 影響',
    reopenHistory => {
      expect(classifyDedupReopen({ existingStatus: 'done', reopenHistory })).toEqual({
        kind: 'reject',
        reason: 'done',
      })
    },
  )

  test('首次 blocked 允許重開', () => {
    expect(classifyDedupReopen({
      existingStatus: 'blocked',
      reopenHistory: 'never-reopened',
    })).toEqual({ kind: 'reopen', reason: 'first-blocked' })
  })

  test('已重開的 blocked 拒絕並產生 exhausted 事件資料', () => {
    expect(classifyDedupReopen({
      existingStatus: 'blocked',
      reopenHistory: 'reopened',
    })).toEqual({
      kind: 'reject',
      reason: BLOCKED_REOPEN_EXHAUSTED_EVENT,
      event: {
        type: 'blocked-reopen-exhausted',
        data: { existingStatus: 'blocked', reopenHistory: 'reopened' },
      },
    })
  })

  test.each([undefined, null] as const)('blocked 缺少重開標記 %s 時保守拒絕', reopenHistory => {
    expect(classifyDedupReopen({ existingStatus: 'blocked', reopenHistory })).toEqual({
      kind: 'reject',
      reason: 'reopen-history-missing',
    })
  })

  test('仍 open 的 dedup 命中拒絕，不建立重複任務', () => {
    expect(classifyDedupReopen({
      existingStatus: 'open',
      reopenHistory: 'never-reopened',
    })).toEqual({ kind: 'reject', reason: 'already-open' })
  })
})
