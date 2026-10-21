import { existsSync } from 'node:fs'
import { join } from 'node:path'

// dist/ 是 gitignored 建置產物：npm test 直跑或乾淨 checkout（如 CI 驗證主機的
// replay worktree）未必有建置。依賴 dist/ 產物或 scripts/*.mjs→dist 鏈的測試
// 以 RUNTIME_BUILT 門檻略過；Windows CI 的 test:flaky-regression 一律先
// npm run build，gate 上照常執行、斷言不減。
export const RUNTIME_BUILT = existsSync(join(import.meta.dirname, '..', '..', 'dist', 'cli.js'))
