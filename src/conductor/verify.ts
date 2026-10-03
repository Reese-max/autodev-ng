import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync, type Dirent } from 'node:fs'
import { join } from 'node:path'
import { runVerify, type VerifyOutcome } from '../engines/run-verify.js'
import type { TaskEnvelope } from './envelope.js'
import type { TestResultEntry } from './ledger.js'

/** 驗證閘（Issue #52）：Conductor 不信 worker 口頭報告，只信機械檢查。
 * 檢查序：git diff/變動檔案 → scope 白名單+do_not_touch → 逐一執行 tests 指令。
 * 缺 runtime 證據（無 tests / 指令不可得）→ 'unverified'，永不放行 PASS。
 *
 * 變動判定：committed diff（baseCommit..HEAD）+ 髒檔「內容雜湊差集」。
 * baseline/after 兩份快照都必須由 caller 在派工視窗邊界抓取——
 * conductor 自身的 .autodev 寫入發生在視窗外，視窗內任何 .autodev 變動即視為 worker 竄改。 */

export type AttemptVerdict = 'pass' | 'fail' | 'unverified'

export type DirtySnapshot = Map<string, string>

export interface VerifyAttemptResult {
  verdict: AttemptVerdict
  detail: string
  /** 越界/禁觸檔案清單。 */
  violations: string[]
  /** 本次 attempt 全部變動（commit + 髒檔差集），供報告與追溯。 */
  changedFiles: string[]
  tests: TestResultEntry[]
}

export interface VerifyAttemptOpts {
  cwd: string
  /** 驗證基準：累計 diff 的起點（通常是 envelope.parent_commit）。 */
  baseCommit: string
  /** 派工視窗前緣的髒檔快照（path→sha256）。 */
  baselineDirty?: DirtySnapshot
  /** 派工視窗後緣的髒檔快照；缺省則呼叫當下即時採。 */
  afterDirty?: DirtySnapshot
  testTimeoutMs?: number
  runTest?: (command: string, cwd: string, timeoutMs: number) => Promise<VerifyOutcome>
  /** 測試注入點；預設走真 git。 */
  listCommitted?: (cwd: string, baseCommit: string) => string[]
}

export function normPath(p: string): string {
  let s = p.replace(/\\/g, '/').replace(/^\.\//, '')
  while (s.endsWith('/')) s = s.slice(0, -1)
  return s
}

/** 路徑命中：精確檔名或目錄前綴（src ≠ src2）。 */
export function pathMatches(file: string, pattern: string): boolean {
  const f = normPath(file)
  const p = normPath(pattern)
  return f === p || f.startsWith(p + '/')
}

function gitText(args: string[], cwd: string): string {
  try {
    return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  } catch {
    return ''
  }
}

export function listDirtyPaths(cwd: string): string[] {
  const out: string[] = []
  for (const line of gitText(['status', '--porcelain=v1', '-uall'], cwd).split('\n')) {
    if (!line.trim()) continue
    let p = line.slice(3)
    const arrow = p.indexOf(' -> ')
    if (arrow !== -1) p = p.slice(arrow + 4)
    if (p.startsWith('"') && p.endsWith('"')) p = p.slice(1, -1)
    if (p) out.push(normPath(p))
  }
  return out
}

function hashFile(abs: string): string {
  try {
    const st = statSync(abs)
    if (!st.isFile()) return '<nonfile>'
    return createHash('sha256').update(readFileSync(abs)).digest('hex')
  } catch {
    return '<unreadable>'
  }
}

function walkFiles(dir: string, rel: string, out: string[], cap = 5000): void {
  let entries: Dirent[]
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const e of entries) {
    if (out.length >= cap) return
    const r = rel ? `${rel}/${e.name}` : e.name
    if (e.isDirectory()) walkFiles(join(dir, e.name), r, out, cap)
    else if (e.isFile() || e.isSymbolicLink()) out.push(r)
  }
}

/** 髒檔快照：repo-relative path → sha256（內容，非 mtime——防 touch 偽裝）。
 * extraDirs 遞補走目錄列舉：.autodev 被 git/info/exclude 排除後 porcelain 看不到，
 * 但視窗內竄改仍須可偵測。 */
export function snapshotDirty(cwd: string, extraDirs: string[] = []): DirtySnapshot {
  const map: DirtySnapshot = new Map()
  for (const p of listDirtyPaths(cwd)) map.set(p, hashFile(join(cwd, p)))
  for (const d of extraDirs) {
    const files: string[] = []
    walkFiles(join(cwd, d), d, files)
    for (const p of files) map.set(normPath(p), hashFile(join(cwd, p)))
  }
  return map
}

/** baseline → after 的髒檔差集：新增、內容改變、被刪除皆計。 */
export function dirtyDeltaPaths(baseline: DirtySnapshot, after: DirtySnapshot): string[] {
  const out: string[] = []
  for (const [p, h] of after) if (baseline.get(p) !== h) out.push(p)
  for (const p of baseline.keys()) if (!after.has(p)) out.push(p)
  return out.sort()
}

export function gitCommittedPaths(cwd: string, baseCommit: string): string[] {
  return gitText(['diff', '--name-only', `${baseCommit}..HEAD`], cwd).split('\n').map(s => normPath(s.trim())).filter(Boolean)
}

/** 單次 attempt 的機械驗證。verdict 語意：
 *  - pass：無 scope 違規 且 tests 全部綠。
 *  - fail：scope 違規或 tests 任一失敗——回饋給下一輪 worker。
 *  - unverified：無 tests 或環境缺指令（blocked/skip）——契約/環境問題，重試無用。 */
export async function verifyAttempt(envelope: TaskEnvelope, opts: VerifyAttemptOpts): Promise<VerifyAttemptResult> {
  const listCommitted = opts.listCommitted ?? gitCommittedPaths
  const runTest = opts.runTest ?? ((cmd, cwd, ms) => runVerify({ command: cmd, cwd, timeoutMs: ms }))
  const baseline: DirtySnapshot = opts.baselineDirty ?? new Map()
  const after: DirtySnapshot = opts.afterDirty ?? snapshotDirty(opts.cwd)

  const committed = listCommitted(opts.cwd, opts.baseCommit)
  const delta = dirtyDeltaPaths(baseline, after)
  const changed = [...new Set([...committed, ...delta])]

  const violations = changed.filter(f =>
    envelope.do_not_touch.some(p => pathMatches(f, p)) ||
    !envelope.files_allowed_to_change.some(p => pathMatches(f, p)),
  )

  const tests: TestResultEntry[] = []
  if (violations.length > 0) {
    return {
      verdict: 'fail',
      detail: `越界檔案（不在 files_allowed_to_change 或命中 do_not_touch）：${violations.join(', ')}`,
      violations, changedFiles: changed, tests,
    }
  }
  if (envelope.tests.length === 0) {
    return {
      verdict: 'unverified',
      detail: '缺少機械驗收指令（tests 為空）——無 runtime 證據不得標 PASS',
      violations, changedFiles: changed, tests,
    }
  }
  let sawNoEvidence = false
  for (const command of envelope.tests) {
    const r = await runTest(command, opts.cwd, opts.testTimeoutMs ?? 600_000)
    tests.push({ command, status: r.status, exitCode: r.exitCode ?? null, detail: r.detail })
    if (r.status === 'fail') {
      return { verdict: 'fail', detail: `驗證指令失敗：${command}（${r.detail}）`, violations, changedFiles: changed, tests }
    }
    // blocked＝環境缺指令；skip＝沒有可執行的檢查——兩者都不產生證據
    if (r.status === 'blocked' || r.status === 'skip') sawNoEvidence = true
  }
  if (sawNoEvidence) {
    return { verdict: 'unverified', detail: '驗證環境缺指令/條件（blocked/skip）——無 runtime 證據不得標 PASS', violations, changedFiles: changed, tests }
  }
  return { verdict: 'pass', detail: `驗證通過：${tests.length} 項指令全綠`, violations, changedFiles: changed, tests }
}
