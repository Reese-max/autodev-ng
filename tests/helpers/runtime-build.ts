import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync, type Dirent } from 'node:fs'
import { randomUUID } from 'node:crypto'
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
const ownerFile = join(lockDir, 'owner.json')

const POLL_MS = 50
const HEARTBEAT_MS = 2_000
// 持有者每 HEARTBEAT_MS 更新一次 owner.json；超過 STALE_MS 沒更新就當它被強殺了，後來者接手。
// 用「持有者自己續命」判斷存活，而不是 pid 存活：pid 會被回收重用，Windows 上跨行程
// process.kill(pid, 0) 還可能回 EPERM，兩者都會把死掉的持有者看成活著，卡滿等待上限。
const STALE_MS = 15_000
const WAIT_CEILING_MS = 300_000

/** 給呼叫端（beforeAll / 單條規格）用的逾時：涵蓋等待他人建置 + 自己跑一次完整 tsc。 */
export const BUILD_HOOK_TIMEOUT_MS = 420_000

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

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

interface LockOwner { token: string; pid: number }

function readOwner(): LockOwner | undefined {
  try {
    const parsed = JSON.parse(readFileSync(ownerFile, 'utf8')) as Partial<LockOwner>
    if (typeof parsed.token === 'string' && typeof parsed.pid === 'number') return { token: parsed.token, pid: parsed.pid }
    return undefined
  } catch { return undefined }
}

/** owner.json 原子寫入：先寫同目錄暫存檔再 rename，讀者不會看到寫到一半的內容。 */
function writeOwner(token: string): void {
  const staging = `${ownerFile}.${randomUUID().slice(0, 8)}.tmp`
  writeFileSync(staging, JSON.stringify({ token, pid: process.pid, at: Date.now() }))
  renameSync(staging, ownerFile)
}

/** 鎖的持有者是否還在續命。讀不到 owner.json 以鎖目錄的 mtime 當心跳，讓「剛 mkdir 還沒寫完」
 *  與「被殺在 mkdir 與寫之間」兩種情況都判得對。 */
function lockIsLive(): boolean {
  const owner = readOwner()
  try {
    const mtime = owner ? statSync(ownerFile).mtimeMs : statSync(lockDir).mtimeMs
    return Date.now() - mtime < STALE_MS
  } catch { return false }
}

/** 持有者的行程已經不存在（ESRCH）——被強殺的典型情形，立刻接手不必等心跳過期。
 *  刻意只認 ESRCH：EPERM 代表行程存在只是沒權限探詢，pid 也可能被回收重用，那兩種交給心跳判定。 */
function ownerProcessGone(owner: LockOwner): boolean {
  if (owner.pid === process.pid) return false
  try { process.kill(owner.pid, 0); return false }
  catch (err) { return (err as NodeJS.ErrnoException).code === 'ESRCH' }
}

/** mkdir 原子互斥（同 repo 其他狀態檔的作法）：避免多個 spec 同時啟動 tsc 互相覆寫 dist/。
 *  回傳自己的 token；取得失敗代表別人正在建置且產物可用，直接回 undefined 即可。 */
async function acquireLock(): Promise<string | undefined> {
  mkdirSync(dirname(lockDir), { recursive: true })
  const token = randomUUID()
  const deadline = Date.now() + WAIT_CEILING_MS
  for (;;) {
    try {
      mkdirSync(lockDir)
      writeOwner(token)
      // 確認這把鎖真的還在我手上：若在我 mkdir 與寫入之間有別人搶先搶走並重建，這裡就會
      // 讀到別人的 token，放棄重建並交回迴圈，避免兩個 tsc 同時寫同一個 dist/。
      if (readOwner()?.token !== token) continue
      return token
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err
      if (existsSync(entry) && !isStale()) return undefined
      const owner = readOwner()
      if ((owner !== undefined && ownerProcessGone(owner)) || !lockIsLive() || Date.now() > deadline) {
        // 持有者行程已消失、心跳不再更新、或已逾等待上限：清掉它的鎖再試一次。
        // 重取後仍會驗證 token，所以多個後來者同時搶也只會有一個真的動手建置。
        rmSync(lockDir, { recursive: true, force: true })
        continue
      }
      await sleep(POLL_MS)
    }
  }
}

function releaseLock(token: string): void {
  // 只在鎖仍屬於自己時才清：否則會把接手者的鎖刪掉，讓後續等待者誤以為沒人在建置。
  if (readOwner()?.token !== token) return
  rmSync(lockDir, { recursive: true, force: true })
}

function runTsc(onHeartbeat: () => void): Promise<{ code: number | null; signal: NodeJS.Signals | null; stdout: string; stderr: string }> {
  const tsc = join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc')
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(process.execPath, [tsc, '-p', join(repoRoot, 'tsconfig.build.json')], { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8'); child.stdout.on('data', chunk => { stdout += chunk })
    child.stderr.setEncoding('utf8'); child.stderr.on('data', chunk => { stderr += chunk })
    const heartbeat = setInterval(onHeartbeat, HEARTBEAT_MS)
    const expiry = setTimeout(() => child.kill('SIGKILL'), WAIT_CEILING_MS)
    child.on('error', error => { clearInterval(heartbeat); clearTimeout(expiry); rejectPromise(error) })
    child.on('close', (code, signal) => { clearInterval(heartbeat); clearTimeout(expiry); resolvePromise({ code, signal, stdout, stderr }) })
  })
}

async function buildExclusive(): Promise<void> {
  const token = await acquireLock()
  if (!token) return
  try {
    if (existsSync(entry) && !isStale()) return
    const result = await runTsc(() => { try { writeOwner(token) } catch { /* 心跳失敗不影響建置 */ } })
    if (result.code !== 0) {
      throw new Error(`tsc -p tsconfig.build.json failed (${result.code ?? result.signal}): ${result.stdout + result.stderr}`)
    }
  } finally {
    releaseLock(token)
  }
}

/** 保證 dist/ 編譯產物存在且不比 src/ 舊；回傳是否可用。 */
export async function ensureRuntimeBuilt(): Promise<boolean> {
  if (existsSync(entry) && !isStale()) return true
  await buildExclusive()
  return existsSync(entry)
}

export function runtimeModuleUrl(relative: string): string {
  return pathToFileURL(join(runtimeRoot, relative)).href
}