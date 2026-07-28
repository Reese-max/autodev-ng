#!/usr/bin/env node
// 輪級增量 verify（2026-07-28）：以 vitest related 只跑受本輪 diff 影響的測試。
// 鐵律：任何不確定一律退回全套（fail-open 朝全套，寧慢勿假）。
// 雙層防呆：本腳本只服務 cfg.verifyCommand（輪級快閘）；GOAL 級驗收（GOAL.md sh 圍欄）
// 與 supplement 稽核吃 goal.verifyCommand，不走此路徑，全套保險不受影響。
import { execFileSync, execSync } from 'node:child_process'

// 動態依賴測試：不 import 目標檔卻讀其內容（fs 掃描），vitest related 的 import 圖抓不到——必跑。
const ALWAYS_RUN = ['tests/kernel-relocation-report.test.ts']
// 只有 src/tests 下的 .ts 變更能走增量；其餘（configs/scripts/web/package*/tsconfig*…）一律全套。
const SAFE_RE = /^(src|tests)\/.+\.ts$/

const planOnly = process.argv.includes('--plan')

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', timeout: 30_000, windowsHide: true })
}
function runVitest(args) {
  // repo 內檔名無空格；execSync 繼承 stdio 讓測試輸出直達 verify 閘。
  execSync(`npx vitest ${args}`, { stdio: 'inherit', timeout: 1_200_000, windowsHide: true })
}
function full(reason) {
  console.log(`[verify-incremental] full: ${reason}`)
  if (planOnly) { console.log('PLAN: full'); process.exit(0) }
  runVitest('run')
  process.exit(0)
}

let changed = []
try {
  const base = git(['merge-base', 'HEAD', 'main']).trim()
  const committed = git(['diff', '--name-only', `${base}..HEAD`]).split('\n')
  const dirty = git(['status', '--porcelain']).split('\n').map(l => l.slice(3).trim())
  changed = [...new Set([...committed, ...dirty])].filter(Boolean).map(s => s.replace(/\\/g, '/'))
} catch (err) {
  full(`git 解析失敗：${String(err).slice(0, 120)}`)
}

if (changed.length === 0) full('空 diff')
const unsafe = changed.filter(f => !SAFE_RE.test(f))
if (unsafe.length > 0) full(`含 src/tests .ts 以外變更：${unsafe.slice(0, 5).join(', ')}`)

const targets = [...changed, ...ALWAYS_RUN]
console.log(`[verify-incremental] related（${changed.length} 檔變更）: ${changed.join(', ')}`)
if (planOnly) { console.log(`PLAN: related ${targets.join(' ')}`); process.exit(0) }
runVitest(`related --run ${targets.join(' ')}`)
