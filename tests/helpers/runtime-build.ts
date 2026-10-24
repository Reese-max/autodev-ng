import { existsSync } from 'node:fs'
import { join } from 'node:path'

// Vitest globalSetup 會在 worker 啟動前建置目前 checkout。
// 其他 runner 仍可能沒有 dist/；保留直接載入測試時的建置門檻。
export const RUNTIME_BUILT = existsSync(join(import.meta.dirname, '..', '..', 'dist', 'cli.js'))
