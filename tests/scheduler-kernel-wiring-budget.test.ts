import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = join(ROOT, 'src')
const WIRING_COMMIT = 'a680932'
const SCHEDULER = 'src/scheduler.ts'
const NEW_MODULE = 'src/engines/concurrency-notice.ts'
const KERNEL_CAP = 2700
const WIRING_CAP = 15
const REPORT = join(ROOT, 'docs', 'kernel-scheduler-wiring-budget-2026-07-30.md')

function schedulerDiff(): { added: number; deleted: number } {
  const parts = execFileSync('git', [
    'diff', '--numstat', `${WIRING_COMMIT}^`, WIRING_COMMIT, '--', SCHEDULER,
  ], { cwd: ROOT, encoding: 'utf8' }).trim().split('\t')
  if (parts.length !== 3 || parts[2] !== SCHEDULER) {
    throw new Error(`找不到 ${WIRING_COMMIT} 的 ${SCHEDULER} numstat`)
  }
  return { added: Number(parts[0]), deleted: Number(parts[1]) }
}

function kernelLineCount(): { total: number; perFile: Record<string, number> } {
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

describe('scheduler kernel 接線行數預算', () => {
  it('a680932 的 scheduler 接線總變更不超過 15 行', () => {
    const { added, deleted } = schedulerDiff()
    expect(added).toBe(2)
    expect(deleted).toBe(2)
    expect(added + deleted).toBeLessThanOrEqual(WIRING_CAP)
  })

  it('新增的 concurrency notice 模組不列入頂層 kernel 預算', () => {
    const added = execFileSync('git', [
      'diff', '--name-status', `${WIRING_COMMIT}^`, WIRING_COMMIT, '--', NEW_MODULE,
    ], { cwd: ROOT, encoding: 'utf8' }).trim()
    const { total, perFile } = kernelLineCount()
    const moduleLines = readFileSync(join(SRC_DIR, 'engines', 'concurrency-notice.ts'), 'utf8').split('\n').length - 1

    expect(added).toBe(`A\t${NEW_MODULE}`)
    expect(moduleLines).toBe(22)
    expect(perFile['concurrency-notice.ts']).toBeUndefined()
    expect(Object.keys(perFile).every(name => !name.includes('/') && !name.includes('\\'))).toBe(true)
    expect(total).toBeLessThanOrEqual(KERNEL_CAP)
  })

  it('結果報告保留可重跑的 diff、行數與指定測試', () => {
    const report = readFileSync(REPORT, 'utf8')
    for (const fact of [WIRING_COMMIT, SCHEDULER, NEW_MODULE, '2 + / 2 -', '4', '15', '2070', '2700']) {
      expect(report).toContain(fact)
    }
    expect(report).toContain('npx vitest run tests/kernel-budget.test.ts tests/scheduler-kernel-wiring-budget.test.ts')
  })
})
