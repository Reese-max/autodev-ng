import { expect, test } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Dependency-upgrade 測試工作：
 * 1. 安裝最新相容版本的 fastapi / starlette / httpx 到專案 venv
 * 2. 執行完整測試（跳過 integration 標記）
 * 3. 保存通過輸出作為佐證
 */

const PYTHON = 'D:/Users/Administrator/Desktop/筆記補齊/.venv/Scripts/python.exe'
const PROJECT_DIR = 'D:/Users/Administrator/Desktop/筆記補齊'
const EVIDENCE_DIR = join(process.cwd(), 'data')
const EVIDENCE_FILE = join(EVIDENCE_DIR, 'dependency-upgrade-evidence.json')
const DEPS = ['fastapi', 'starlette', 'httpx']

function pipJson(...args: string[]): string {
  return execFileSync(PYTHON, ['-X', 'utf8', '-m', 'pip', ...args, '--format=json'], {
    cwd: PROJECT_DIR,
    timeout: 120_000,
    encoding: 'utf-8',
  }).trim()
}

function pipFreeze(): string {
  return execFileSync(PYTHON, ['-X', 'utf8', '-m', 'pip', 'freeze'], {
    cwd: PROJECT_DIR,
    timeout: 30_000,
    encoding: 'utf-8',
  }).trim()
}

test('dependency-upgrade：安裝最新相容版 + 完整測試通過 + 佐證', async () => {
  mkdirSync(EVIDENCE_DIR, { recursive: true })

  // ── 1. 安裝前版本快照 ──
  const beforeRaw = pipJson('list')
  const beforePkgs: Record<string, string> = {}
  for (const pkg of JSON.parse(beforeRaw) as Array<{ name: string; version: string }>) {
    if (DEPS.includes(pkg.name)) beforePkgs[pkg.name] = pkg.version
  }

  // ── 2. 安裝最新相容版本 ──
  const installResult = execFileSync(
    PYTHON,
    ['-X', 'utf8', '-m', 'pip', 'install', '--upgrade', ...DEPS],
    { cwd: PROJECT_DIR, timeout: 180_000, encoding: 'utf-8', stdio: 'pipe' },
  )

  // ── 3. 安裝後版本快照 ──
  const afterRaw = pipJson('list')
  const afterPkgs: Record<string, string> = {}
  for (const pkg of JSON.parse(afterRaw) as Array<{ name: string; version: string }>) {
    if (DEPS.includes(pkg.name)) afterPkgs[pkg.name] = pkg.version
  }

  // ── 4. 完整測試（跳過 integration 標記） ──
  let testOutput = ''
  let testExitCode = 0
  try {
    testOutput = execFileSync(
      PYTHON,
      ['-X', 'utf8', '-m', 'pytest', '-m', 'not integration', '-q'],
      { cwd: PROJECT_DIR, timeout: 300_000, encoding: 'utf-8', stdio: 'pipe' },
    )
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; status?: number }
    testOutput = (e.stdout ?? '') + '\n' + (e.stderr ?? '')
    testExitCode = e.status ?? 1
  }

  // ── 5. 保存佐證 ──
  const evidence = {
    timestamp: new Date().toISOString(),
    packages: DEPS,
    before: beforePkgs,
    after: afterPkgs,
    installOutput: installResult,
    testExitCode,
    testOutput,
  }
  writeFileSync(EVIDENCE_FILE, JSON.stringify(evidence, null, 2), 'utf-8')

  // ── 6. 驗證 ──
  expect(testExitCode, `pytest 失敗 (exit=${testExitCode})\n${testOutput}`).toBe(0)
})
