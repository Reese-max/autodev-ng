import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, type Dirent } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// 部分驗收需要真實的跨行程證據（子行程 import 編譯產物、scripts/*.mjs 走 dist 鏈）。
// `npm test` 是裸 `vitest run`（package.json），不建置也不宣稱 dist/ 新鮮；乾淨簽出更是沒有
// dist/。這個 helper 只在缺產物或 src/ 比產物新時就地建置，並且只寫 gitignored 的 dist/，
// 不改任何受版控檔案。

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

/** src/ 下最新的原始檔修改時間；沒有 src/ 時回 0。 */
function newestSourceMtime(dir: string): number {
  let newest = 0
  for (const file of sourceFiles(dir)) {
    try { newest = Math.max(newest, statSync(file).mtimeMs) } catch { /* 已消失 */ }
  }
  return newest
}

function sourceFiles(dir: string): string[] {
  const found: string[] = []
  const walk = (current: string): void => {
    let entries: Dirent[]
    try { entries = readdirSync(current, { withFileTypes: true }) } catch { return }
    for (const entry of entries) {
      const full = join(current, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.isFile()) found.push(full)
    }
  }
  walk(dir)
  return found
}

/** 產物存在但落後於任一 src/ 檔＝過期；跨行程重啟測試會讀到舊程式碼。 */
function isStale(): boolean {
  try { return newestSourceMtime(join(repoRoot, 'src')) > statSync(entry).mtimeMs } catch { return true }
}

/** mkdir 原子互斥（同 repo 其他狀態檔的作法）：避免多個 spec 同時啟動 tsc 互相覆寫 dist/。
 * 取得鎖者建置，其餘等待產物出現；建置者被強殺留下的鎖逾時後由後來者接手。 */
function buildExclusive(): void {
  mkdirSync(dirname(lockDir), { recursive: true })
  const deadline = Date.now() + LOCK_TIMEOUT_MS
  for (;;) {
    try { mkdirSync(lockDir); break }
    catch {
      if (existsSync(entry) && !isStale()) return
      if (Date.now() > deadline) {
        let stale = false
        try { stale = Date.now() - statSync(lockDir).mtimeMs > STALE_LOCK_MS } catch { /* 已被清掉 */ }
        if (!stale) throw new Error(`runtime build lock stuck at ${lockDir}`)
        rmSync(lockDir, { recursive: true, force: true })
        continue
      }
      sleepSync(POLL_MS)
    }
  }
  try {
    if (existsSync(entry) && !isStale()) return
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

/** 保證 dist/ 編譯產物存在且不比 src/ 舊；回傳是否可用。 */
export function ensureRuntimeBuilt(): boolean {
  if (existsSync(entry) && !isStale()) return true
  buildExclusive()
  return existsSync(entry)
}

export function runtimeModuleUrl(relative: string): string {
  return pathToFileURL(join(runtimeRoot, relative)).href
}
