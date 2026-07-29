import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = join(ROOT, 'src')
const REPORT = join(ROOT, 'docs', 'kernel-line-relocation-report.md')
const BEFORE_RELOCATION = '942554a00fdbed0b6666ff6f4a9bac140809fdce'
const FIRST_RELOCATION = '80825e50fa264a8aa5d35cfe8c2ca1f0b8781adb'
const BEFORE_LINES = 2700
const CURRENT_KERNEL_BY_FILE: Readonly<Record<string, number>> = {
  'backlog.ts': 188,
  'cli.ts': 21,
  'daemon.ts': 218,
  'db.ts': 172,
  'digest.ts': 107,
  'events.ts': 126,
  'globalcost.ts': 40,
  'judge.ts': 41,
  'lock.ts': 134,
  'preflight.ts': 37,
  'scheduler.ts': 342,
  'types.ts': 168,
  'verifier.ts': 99,
  'verify.ts': 93,
  'worktree.ts': 271,
}
const AFTER_LINES = Object.values(CURRENT_KERNEL_BY_FILE).reduce((total, lines) => total + lines, 0)
const RECLAIMED_LINES = BEFORE_LINES - AFTER_LINES
const TARGET_CAP = 2250
const REQUIRED_RECLAIMED_LINES = 250
const RELOCATED_LOGIC = [
  ['engines/daemon-alerts.ts', 'daemon.ts', './engines/daemon-alerts.js'],
  ['engines/notify.ts', 'cli/assemble.ts', '../engines/notify.js'],
  ['engines/proc.ts', 'verify.ts', './engines/proc.js'],
] as const

function lineCount(source: string): number {
  return source.split('\n').length - 1
}

function topLevelFilesAt(revision: string): string[] {
  return execFileSync('git', ['ls-tree', '-r', '--name-only', revision, '--', 'src'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
    .split('\n')
    .filter(name => /^src\/[^/]+\.ts$/.test(name))
}

function historicalKernelLines(revision: string): number {
  return topLevelFilesAt(revision).reduce(
    (total, file) => total + lineCount(execFileSync('git', ['show', `${revision}:${file}`], {
      cwd: ROOT,
      encoding: 'utf8',
    })),
    0,
  )
}

function currentKernelBreakdown(): Record<string, number> {
  return readdirSync(SRC_DIR)
    .filter(name => name.endsWith('.ts') && statSync(join(SRC_DIR, name)).isFile())
    .reduce<Record<string, number>>((files, name) => {
      files[name] = lineCount(readFileSync(join(SRC_DIR, name), 'utf8'))
      return files
    }, {})
}

function currentKernelLines(): number {
  return Object.values(currentKernelBreakdown()).reduce((total, lines) => total + lines, 0)
}

describe('kernel 搬移前後行數報告', () => {
  it('搬移前基準提交的 kernel 頂層為 2700 行', () => {
    const parent = execFileSync('git', ['rev-parse', `${FIRST_RELOCATION}^`], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim()
    expect(parent).toBe(BEFORE_RELOCATION)
    expect(historicalKernelLines(BEFORE_RELOCATION)).toBe(BEFORE_LINES)
  })

  it('目前 kernel 頂層為 2057 行，低於 2250 行且實際騰回 643 行', () => {
    const current = currentKernelLines()
    expect(current).toBe(AFTER_LINES)
    expect(current).toBeLessThan(TARGET_CAP)
    expect(BEFORE_LINES - current).toBe(RECLAIMED_LINES)
    expect(BEFORE_LINES - current).toBeGreaterThanOrEqual(REQUIRED_RECLAIMED_LINES)
  })

  it('目前逐檔帳目與報告固定值一致，且未漏計或多計頂層檔案', () => {
    const current = currentKernelBreakdown()
    expect(current).toEqual(CURRENT_KERNEL_BY_FILE)
    expect(Object.keys(current).sort()).toEqual(Object.keys(CURRENT_KERNEL_BY_FILE).sort())
  })

  it('搬移邏輯只落在 engines 或 autopilot，且未在 kernel 頂層留下同名檔', () => {
    const topLevel = Object.keys(currentKernelBreakdown())
    for (const [destination, caller, importPath] of RELOCATED_LOGIC) {
      expect(destination).toMatch(/^(engines|autopilot)\/[^/]+\.ts$/)
      expect(statSync(join(SRC_DIR, destination)).isFile()).toBe(true)
      expect(topLevel).not.toContain(destination.split('/').at(-1))
      expect(readFileSync(join(SRC_DIR, caller), 'utf8')).toContain(importPath)
    }
  })

  it('報告記錄相同的可重現基準、結果與驗證指令', () => {
    const report = readFileSync(REPORT, 'utf8')
    for (const fact of [BEFORE_RELOCATION, '2700', '2057', '643', '2250', '250']) {
      expect(report).toContain(fact)
    }
    for (const [file, lines] of Object.entries(CURRENT_KERNEL_BY_FILE)) {
      expect(report).toContain(`| \`src/${file}\` | ${lines} |`)
    }
    for (const [destination] of RELOCATED_LOGIC) {
      expect(report).toContain(`\`src/${destination}\``)
    }
    expect(report).toContain('npx vitest run tests/kernel-relocation-report.test.ts')
  })
})
