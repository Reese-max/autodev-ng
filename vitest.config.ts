import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // Windows 上多個測試會建立暫存 Git repo／worktree；防毒與磁碟競爭
    // 可能讓單次 Git 操作超過 Vitest 預設的 5 秒。
    testTimeout: 20_000,
    // 整合測試大量啟動 Git 子行程；平行執行會互相搶磁碟並造成假逾時。
    maxWorkers: 1,
  },
})
