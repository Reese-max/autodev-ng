import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

/**
 * kernel-slim 守門（docs/goal-queue/GOAL-kernel-slim.md）
 *
 * 外移完成後鎖定新上限，防止緩衝被慢慢吃回：
 * - src/*.ts 頂層總行數 ≤ 2450（相對工作上限 2700 騰回 ≥250）
 * - src/cli.ts 只剩薄殼（參數入口 / re-export / 委派 runCli）
 *
 * 計法對齊 tests/kernel-budget.test.ts 的 kernelLineCount：
 * 只算 src/ 頂層 .ts（不進子目錄），行數＝換行字元數（split('\n').length - 1）。
 */

/** 外移後鎖定的 kernel 頂層上限（2700 工作上限 − ≥250 緩衝）。 */
export const KERNEL_SLIM_CAP = 2450
export const KERNEL_BEFORE_RELOCATION = 2700
export const KERNEL_MIN_RECLAIMED_LINES = 250

/**
 * cli.ts 薄殼行數上限。現況 ~22；給 re-export 擴充留少量餘裕，
 * 遠低於外移前 ~406，避免業務邏輯再滲回頂層。
 */
export const CLI_SHELL_MAX_LINES = 50

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = join(ROOT, 'src')
const CLI_TS = join(SRC_DIR, 'cli.ts')
const CLI_DIR = join(SRC_DIR, 'cli')

/** 對齊 kernel-budget / spec：只算 src/ 頂層 .ts 行數（不含任何子目錄）。 */
export function kernelLineCount(): { total: number; perFile: Record<string, number> } {
  const perFile: Record<string, number> = {}
  let total = 0
  for (const name of readdirSync(SRC_DIR)) {
    if (!name.endsWith('.ts')) continue
    const full = join(SRC_DIR, name)
    if (!statSync(full).isFile()) continue
    const lines = readFileSync(full, 'utf8').split('\n').length - 1
    perFile[name] = lines
    total += lines
  }
  return { total, perFile }
}

/**
 * 僅計 src/cli/ 子目錄內 .ts（用來證明 kernel 計數未納入此目錄）。
 * 與 kernelLineCount 對稱：只算該目錄一層、不遞迴更深。
 */
export function cliSubdirLineCount(): { total: number; perFile: Record<string, number> } {
  const perFile: Record<string, number> = {}
  let total = 0
  for (const name of readdirSync(CLI_DIR)) {
    if (!name.endsWith('.ts')) continue
    const full = join(CLI_DIR, name)
    if (!statSync(full).isFile()) continue
    const lines = readFileSync(full, 'utf8').split('\n').length - 1
    perFile[name] = lines
    total += lines
  }
  return { total, perFile }
}

export function fileLineCount(absPath: string): number {
  return readFileSync(absPath, 'utf8').split('\n').length - 1
}

/** 純函式：實際值 > 上限時必須丟錯（守門不可空轉）。 */
export function assertWithinCap(actual: number, cap: number, label: string): void {
  if (actual > cap) {
    throw new Error(`${label}: ${actual} 行 > 上限 ${cap}（緩衝被吃回，請外移/精簡）`)
  }
}

/** cli.ts 薄殼責任：允許的內容形狀（委派 + 相容 re-export + 進入點）。 */
export function assertCliIsThinShell(source: string): void {
  // 必須把實際分派委派給 src/cli/ 子目錄
  if (!/from\s+['"]\.\/cli\/entry\.js['"]/.test(source)) {
    throw new Error('src/cli.ts 必須自 ./cli/entry.js 匯入 runCli/parseArgv（薄殼委派）')
  }
  if (!/\brunCli\b/.test(source)) {
    throw new Error('src/cli.ts 必須委派 runCli（不得在頂層實作子指令）')
  }
  if (!/export\s*\{[^}]*\bparseArgv\b[^}]*\}\s*from\s+['"]\.\/cli\/entry\.js['"]/s.test(source)) {
    throw new Error('src/cli.ts 必須直接從 ./cli/entry.js 轉匯出 parseArgv（不得保留本機解析實作）')
  }

  // 禁止把業務/組裝邏輯寫回頂層（外移前的肥殼特徵）
  const forbidden: Array<{ name: string; re: RegExp }> = [
    { name: 'assemble 實作', re: /\b(?:export\s+)?(?:async\s+)?function\s+assemble\b/ },
    { name: 'cmd* 子指令實作', re: /\b(?:export\s+)?(?:async\s+)?function\s+cmd[A-Z]\w*\b/ },
    { name: 'formatStatus 實作', re: /\b(?:export\s+)?(?:async\s+)?function\s+formatStatus\b/ },
    { name: 'expandConfigPaths 實作', re: /\b(?:export\s+)?(?:async\s+)?function\s+expandConfigPaths\b/ },
    { name: 'makeEngineRegistry 實作', re: /\b(?:export\s+)?(?:async\s+)?function\s+makeEngineRegistry\b/ },
    { name: 'runNotifyTest 實作', re: /\b(?:export\s+)?(?:async\s+)?function\s+runNotifyTest\b/ },
    { name: '直接 import node:fs', re: /from\s+['"]node:fs['"]/ },
    { name: '直接 import ./db', re: /from\s+['"]\.\/db\.js['"]/ },
    { name: '直接 import ./daemon', re: /from\s+['"]\.\/daemon\.js['"]/ },
    { name: '直接 import ./backlog', re: /from\s+['"]\.\/backlog\.js['"]/ },
    { name: '直接 import ./notify', re: /from\s+['"]\.\/notify\.js['"]/ },
    { name: '直接 import ./worktree', re: /from\s+['"]\.\/worktree\.js['"]/ },
  ]

  for (const { name, re } of forbidden) {
    if (re.test(source)) {
      throw new Error(`src/cli.ts 不得含「${name}」——業務邏輯請放 src/cli/ 等子目錄`)
    }
  }

  // 本機函式僅允許進入點 main（其餘應 re-export 或委派）
  const localFns = [...source.matchAll(/\b(?:export\s+)?(?:async\s+)?function\s+(\w+)\b/g)].map(
    m => m[1]!,
  )
  const unexpected = localFns.filter(n => n !== 'main')
  if (unexpected.length > 0) {
    throw new Error(
      `src/cli.ts 薄殼只允許 local function main，發現：${unexpected.join(', ')}`,
    )
  }
}

function formatBreakdown(perFile: Record<string, number>): string {
  return Object.entries(perFile)
    .sort((a, b) => b[1] - a[1])
    .map(([f, n]) => `  ${String(n).padStart(4)}  ${f}`)
    .join('\n')
}

describe('kernel-slim 守門', () => {
  it('明確計算 spec 定義的 kernel 頂層行數並斷言總量 ≤ 2450', () => {
    // spec 計法（對齊 kernel-budget）：只列 src/ 頂層 .ts 一般檔，行數 = 換行字元數
    const { total, perFile } = kernelLineCount()
    const sumFromBreakdown = Object.values(perFile).reduce((a, b) => a + b, 0)

    // 計數本身必須可重現：total 與各檔加總一致
    expect(total).toBe(sumFromBreakdown)
    expect(Object.keys(perFile).length).toBeGreaterThan(0)

    // 關鍵守門：外移後鎖定上限
    try {
      assertWithinCap(total, KERNEL_SLIM_CAP, 'kernel 頂層')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(
        `${msg}\n依 GOAL-kernel-slim：先外移/精簡，不得把業務邏輯堆回 src/*.ts 頂層。\n` +
          `明確計算結果 total=${total}（上限 ${KERNEL_SLIM_CAP}）。\n各檔行數：\n${formatBreakdown(perFile)}`,
      )
    }
    expect(total).toBeLessThanOrEqual(KERNEL_SLIM_CAP)
    expect(total).toBeLessThanOrEqual(2450)
    expect(KERNEL_BEFORE_RELOCATION - total).toBeGreaterThanOrEqual(KERNEL_MIN_RECLAIMED_LINES)
    // 防守門空轉：計數壞掉回 0 時不得永遠通過
    expect(total).toBeGreaterThan(2000)
  })

  it('src/cli/ 子目錄未被計入 kernel 頂層行數', () => {
    const kernel = kernelLineCount()
    const cliSub = cliSubdirLineCount()
    const kernelKeys = Object.keys(kernel.perFile)

    // 子目錄必須存在且有實作（外移成果非空）
    expect(statSync(CLI_DIR).isDirectory()).toBe(true)
    expect(cliSub.total).toBeGreaterThan(0)
    expect(Object.keys(cliSub.perFile).length).toBeGreaterThan(0)

    // kernel 明細只含頂層 basename，不得出現路徑鍵（含 cli/…）
    expect(kernelKeys.every(k => !k.includes('/') && !k.includes('\\'))).toBe(true)
    expect(kernelKeys.some(k => k.startsWith('cli/'))).toBe(false)

    // 頂層 cli.ts 薄殼要計入；僅存在於 src/cli/ 的檔不得出現在 kernel 明細
    expect(kernel.perFile['cli.ts']).toBeDefined()
    expect(kernel.perFile['cli.ts']).toBe(fileLineCount(CLI_TS))
    expect(kernel.perFile['entry.ts']).toBeUndefined()
    expect(kernel.perFile['golden.ts']).toBeUndefined()
    expect(cliSub.perFile['entry.ts']).toBeDefined()

    // 頂層與子目錄可同名（如 daemon.ts）——kernel 必須用頂層檔行數，不是子目錄
    if (kernel.perFile['daemon.ts'] != null && cliSub.perFile['daemon.ts'] != null) {
      expect(kernel.perFile['daemon.ts']).toBe(fileLineCount(join(SRC_DIR, 'daemon.ts')))
      expect(kernel.perFile['daemon.ts']).not.toBe(cliSub.perFile['daemon.ts'])
    }

    // 若誤把 src/cli/ 加進 kernel，總量會明顯膨脹且突破 slim 上限
    const wronglyIncludingCli = kernel.total + cliSub.total
    expect(wronglyIncludingCli).toBeGreaterThan(kernel.total)
    expect(wronglyIncludingCli).toBeGreaterThan(KERNEL_SLIM_CAP)

    // 再次釘死：kernel 總量本身仍 ≤2450（未含 cli 子目錄）
    expect(kernel.total).toBeLessThanOrEqual(KERNEL_SLIM_CAP)
    expect(kernel.total).toBeLessThanOrEqual(2450)
  })

  it('src/cli.ts 行數 ≤ 薄殼上限', () => {
    const lines = fileLineCount(CLI_TS)
    try {
      assertWithinCap(lines, CLI_SHELL_MAX_LINES, 'src/cli.ts')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(
        `${msg}\ncli.ts 應只留 re-export 與 main 進入點；子指令/組裝請放 src/cli/。`,
      )
    }
    expect(lines).toBeLessThanOrEqual(CLI_SHELL_MAX_LINES)
    expect(lines).toBeGreaterThan(5)
  })

  it('src/cli.ts 只剩薄殼責任（委派 runCli + re-export，無業務實作）', () => {
    const source = readFileSync(CLI_TS, 'utf8')
    expect(() => assertCliIsThinShell(source)).not.toThrow()
  })

  it('所有子指令實作都由 src/cli/ 承接', () => {
    const modules = readdirSync(CLI_DIR)
    expect(modules).toEqual(expect.arrayContaining([
      'daemon.ts', 'notify-test.ts', 'run-once.ts', 'status.ts', 'supervise.ts',
    ]))
    const entry = readFileSync(join(CLI_DIR, 'entry.ts'), 'utf8')
    for (const command of ['cmdDaemon', 'cmdNotifyTest', 'cmdRunOnce', 'cmdStatus', 'cmdSupervise']) {
      expect(entry).toContain(command)
    }
  })

  it('超限時 assertWithinCap 必須失敗（守門不可空轉）', () => {
    expect(() => assertWithinCap(0, 10, 'ok')).not.toThrow()
    expect(() => assertWithinCap(10, 10, 'eq')).not.toThrow()
    expect(() => assertWithinCap(11, 10, 'over')).toThrow(/over: 11 行 > 上限 10/)
    expect(() => assertWithinCap(KERNEL_SLIM_CAP + 1, KERNEL_SLIM_CAP, 'kernel 頂層')).toThrow(
      /kernel 頂層/,
    )
    expect(() => assertWithinCap(CLI_SHELL_MAX_LINES + 1, CLI_SHELL_MAX_LINES, 'src/cli.ts')).toThrow(
      /src\/cli\.ts/,
    )
  })

  it('薄殼斷言對肥殼原始碼必須失敗', () => {
    const fatShell = `
import { readFileSync } from 'node:fs'
import { openDatabase } from './db.js'
export function assemble(cfgPath: string) {
  return openDatabase(cfgPath)
}
export async function cmdStatus(p: string) {
  console.log(readFileSync(p, 'utf8'))
}
async function main() {}
`
    expect(() => assertCliIsThinShell(fatShell)).toThrow()
  })
})
