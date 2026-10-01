import { expect, test } from 'vitest'
import {
  isExternalEngineTermination,
  isInfrastructureRetryReason,
  retriedBlockedReason,
  worktreeFailureReason,
} from '../src/engines/infra-retry.js'

// 純分類單元測試：Windows 專屬的鎖定情境只能靠 powershell 造出（tests/worktree.test.ts、
// tests/scheduler.test.ts 略過於非 win32），但「鎖住 → 分流成基建失敗、而不是能力失敗」
// 這條判準本身是跨平台的，不該只在 Windows 上被驗到。

test('殘留 worktree 被鎖 → worktree-locked，且算基建失敗（不消耗 maxAttempts）', () => {
  const locked = Object.assign(new Error('殘留 worktree 目錄無法移除'), { code: 'worktree-locked' })
  expect(worktreeFailureReason(locked)).toBe('worktree-locked')
  expect(isInfrastructureRetryReason('worktree-locked')).toBe(true)
  expect(isInfrastructureRetryReason(worktreeFailureReason(locked))).toBe(true)
})

test('worktree-invalid 不算基建失敗：不是可重試的基建問題', () => {
  const invalid = Object.assign(new Error('殘留 worktree 不可用'), { code: 'worktree-invalid' })
  expect(worktreeFailureReason(invalid)).toBe('worktree-invalid')
  expect(isInfrastructureRetryReason('worktree-invalid')).toBe(false)
})

test('逾時碼與非 worktree 失敗分流：逾時→基建重試，其餘→能力失敗 not-a-git-repo', () => {
  for (const code of ['worktree-timeout', 'ETIMEDOUT', 'ETIME']) {
    const timedOut = Object.assign(new Error('worktree 逾時'), { code })
    expect(worktreeFailureReason(timedOut)).toBe('infra:worktree-timeout')
    expect(isInfrastructureRetryReason('infra:worktree-timeout')).toBe(true)
  }
  expect(worktreeFailureReason(Object.assign(new Error('bad'), { code: 'ENOENT' }))).toBe('not-a-git-repo')
  expect(worktreeFailureReason(new Error('無 code 的普通錯誤'))).toBe('not-a-git-repo')
  expect(isInfrastructureRetryReason('not-a-git-repo')).toBe(false)
})

test('Windows 外部終止碼：unsigned／hex／具名皆視為基建失敗', () => {
  // 註：src/engines/infra-retry.ts 的 regex 寫成 \b-1073741510\b，而「-」非單詞字元，
  // 這一項前面的 \b 只有在「7」前緊接著一個單詞字元時才成立（例如把數字接在 x 後面），
  // 終止碼不會以那種形式出現，所以註解宣稱支援的 signed 形式實際上比不中。
  // 那是產品缺陷，修它要動 src/，不夾帶在本次測試／文件變更裡；見 docs/off-windows-verification.md。
  // 這裡刻意不把 signed 形式寫成期望值，免得把缺陷固化成「應該這樣」。
  for (const code of ['1073807364', '3221225786', '0x40010004', '0xc000013a', 'STATUS_CONTROL_C_EXIT']) {
    expect(isExternalEngineTermination({ code }), code).toBe(true)
  }
  expect(isExternalEngineTermination({ code: 'ENOENT' })).toBe(false)
  expect(isExternalEngineTermination(undefined)).toBe(false)
})

test('已重試的 blocked detail 保留原始原因並標記 retried=1', () => {
  expect(retriedBlockedReason('worktree-locked')).toBe('worktree-locked；retried=1')
})
