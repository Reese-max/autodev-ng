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
const AFTER_LINES = 2187
const RECLAIMED_LINES = BEFORE_LINES - AFTER_LINES
const TARGET_CAP = 2250
const REQUIRED_RECLAIMED_LINES = 250

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

function currentKernelLines(): number {
  return readdirSync(SRC_DIR)
    .filter(name => name.endsWith('.ts') && statSync(join(SRC_DIR, name)).isFile())
    .reduce((total, name) => total + lineCount(readFileSync(join(SRC_DIR, name), 'utf8')), 0)
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

  it('目前 kernel 頂層為 2187 行，低於 2250 行且實際騰回 513 行', () => {
    const current = currentKernelLines()
    expect(current).toBe(AFTER_LINES)
    expect(current).toBeLessThanOrEqual(TARGET_CAP)
    expect(BEFORE_LINES - current).toBe(RECLAIMED_LINES)
    expect(BEFORE_LINES - current).toBeGreaterThanOrEqual(REQUIRED_RECLAIMED_LINES)
  })

  it('報告記錄相同的可重現基準、結果與驗證指令', () => {
    const report = readFileSync(REPORT, 'utf8')
    for (const fact of [BEFORE_RELOCATION, '2700', '2187', '513', '2250', '250']) {
      expect(report).toContain(fact)
    }
    expect(report).toContain('npx vitest run tests/kernel-relocation-report.test.ts')
  })
})
