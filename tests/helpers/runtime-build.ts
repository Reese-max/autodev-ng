import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// 部分驗收需要真實的跨行程證據（子行程 import 編譯產物、CLI preflight 讀 dist）。
// npm test 不保證 dist/ 已存在——profile 會先跑 test 再跑 build，乾淨簽出也沒有 dist。
// 這個 helper 缺什麼才建什麼，並且只寫 gitignored 的 dist/，不改任何受版控檔案。

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const runtimeRoot = join(repoRoot, 'dist')
const entry = join(runtimeRoot, 'autopilot', 'llm.js')

let built = false

function runtimeBuild(): void {
  const tsc = join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc')
  const result = spawnSync(process.execPath, [tsc, '-p', join(repoRoot, 'tsconfig.build.json')], {
    cwd: repoRoot, encoding: 'utf8', timeout: 180_000, windowsHide: true,
  })
  if (result.status !== 0) {
    throw new Error(`tsc -p tsconfig.build.json failed (${result.status ?? result.signal}): ${(result.stdout ?? '') + (result.stderr ?? '')}`)
  }
}

/** 保證 dist/ 編譯產物可用；回傳是否成功。 */
export function ensureRuntimeBuilt(): boolean {
  if (existsSync(entry)) return true
  if (built) return existsSync(entry)
  runtimeBuild()
  built = true
  return existsSync(entry)
}

export function runtimeModuleUrl(relative: string): string {
  return pathToFileURL(join(runtimeRoot, relative)).href
}