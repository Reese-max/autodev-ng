import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// 部分驗收需要真實的跨行程證據（子行程 import 編譯產物、scripts/*.mjs 走 dist 鏈）。
// npm test 不保證 dist/ 已存在——profile 會先跑 test 再跑 build，乾淨簽出也沒有 dist。
// 這個 helper 缺什麼才建什麼，並且只寫 gitignored 的 dist/，不改任何受版控檔案。

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const runtimeRoot = join(repoRoot, 'dist')
const entry = join(runtimeRoot, 'autopilot', 'llm.js')
const lockDir = join(repoRoot, 'node_modules', '.cache', 'adng-runtime-build')

const POLL_MS = 200
const LOCK_TIMEOUT_MS = 180_000
const STALE_LOCK_MS = 300_000

function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function staleLock(deadline: number): boolean {
  try { return Date.now() - statSync(lockDir).mtimeMs > STALE_LOCK_MS && Date.now() > deadline }
  catch { return false }
}

/** mkdir 原子互斥（同 repo 其他狀態檔的作法）：避免多個 spec 同時啟動 tsc 互相覆寫 dist/。
 * 取得鎖者建置，其餘等待產物出現；建置者被強殺留下的鎖逾時後由後來者接手。 */
function buildExclusive(): void {
  const deadline = Date.now() + LOCK_TIMEOUT_MS
  for (;;) {
    try { mkdirSync(lockDir); break }
    catch {
      if (existsSync(entry)) return
      if (Date.now() > deadline) {
        if (!staleLock(deadline)) throw new Error(`runtime build lock stuck at ${lockDir}`)
        rmSync(lockDir, { recursive: true, force: true })
        continue
      }
      sleepSync(POLL_MS)
    }
  }
  try {
    if (existsSync(entry)) return
    const tsc = join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc')
    const result = spawnSync(process.execPath, [tsc, '-p', join(repoRoot, 'tsconfig.build.json')], {
      cwd: repoRoot, encoding: 'utf8', timeout: LOCK_TIMEOUT_MS, windowsHide: true,
    })
    if (result.status !== 0) {
      throw new Error(`tsc -p tsconfig.build.json failed (${result.status ?? result.signal}): ${(result.stdout ?? '') + (result.stderr ?? '')}`)
    }
  } finally {
    rmSync(lockDir, { recursive: true, force: true })
  }
}

/** 保證 dist/ 編譯產物可用；回傳是否成功。 */
export function ensureRuntimeBuilt(): boolean {
  if (existsSync(entry)) return true
  buildExclusive()
  return existsSync(entry)
}

export function runtimeModuleUrl(relative: string): string {
  return pathToFileURL(join(runtimeRoot, relative)).href
}