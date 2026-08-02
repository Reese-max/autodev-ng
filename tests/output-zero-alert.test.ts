import { describe, expect, test } from 'vitest'
import { outputZeroAlert, outputZeroAlertDays } from '../src/engines/output-zero-alert.js'

describe('艦隊產出歸零告警', () => {
  test('連續 N 日零 commit 且有 attempts → 觸發，並列出未合併 adng 分支數', () => {
    const alert = outputZeroAlert({
      fleet: 'neciken', mainRef: 'main', unmergedAdngBranches: 4,
      days: [
        { day: '2026-07-30', commits: 0, attempts: 3 },
        { day: '2026-07-31', commits: 0, attempts: 2 },
      ],
    })
    expect(alert?.attempts).toBe(5)
    expect(alert?.message).toContain('未合併 adng/* 分支=4')
  })

  test('零 commit 但同期也零 attempts（艦停用）→ 不觸發', () => {
    expect(outputZeroAlert({
      fleet: 'idle', mainRef: 'main', unmergedAdngBranches: 0,
      days: [{ day: '2026-07-30', commits: 0, attempts: 0 }, { day: '2026-07-31', commits: 0, attempts: 0 }],
    })).toBeNull()
  })

  test('同期有主分支 commit → 不觸發', () => {
    expect(outputZeroAlert({
      fleet: 'productive', mainRef: 'main', unmergedAdngBranches: 2,
      days: [{ day: '2026-07-30', commits: 0, attempts: 4 }, { day: '2026-07-31', commits: 1, attempts: 1 }],
    })).toBeNull()
  })

  test('預設連續 2 日，可由 config 覆寫', () => {
    expect(outputZeroAlertDays({})).toBe(2)
    expect(outputZeroAlertDays({ outputZeroAlertDays: 3 })).toBe(3)
    expect(outputZeroAlertDays({ outputZeroAlertDays: 0 })).toBeNull()
  })
})
