import { expect, test } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'verify-incremental.mjs')

function initRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'adng-vinc-'))
  const g = (args: string[]) => execFileSync('git', args, { cwd: dir, stdio: 'ignore' })
  g(['init', '-b', 'main'])
  g(['config', 'user.email', 'adng-test@example.com'])
  g(['config', 'user.name', 'adng-test'])
  mkdirSync(join(dir, 'src'), { recursive: true })
  mkdirSync(join(dir, 'tests'), { recursive: true })
  writeFileSync(join(dir, 'src', 'a.ts'), 'export const a = 1\n')
  g(['add', '.'])
  g(['commit', '-m', 'init'])
  return dir
}

function plan(cwd: string): string {
  return execFileSync('node', [SCRIPT, '--plan'], { cwd, encoding: 'utf8', timeout: 30_000 })
}

test('空 diff → 全套', () => {
  expect(plan(initRepo())).toContain('PLAN: full')
})

test('src/tests 以外變更（config 類）→ 全套', () => {
  const dir = initRepo()
  writeFileSync(join(dir, 'package.json'), '{}\n')
  expect(plan(dir)).toContain('PLAN: full')
})

test('純 src 變更 → related，且動態依賴測試恆在清單', () => {
  const dir = initRepo()
  writeFileSync(join(dir, 'src', 'a.ts'), 'export const a = 2\n')
  const out = plan(dir)
  expect(out).toContain('PLAN: related')
  expect(out).toContain('src/a.ts')
  expect(out).toContain('tests/kernel-relocation-report.test.ts') // ALWAYS_RUN：import 圖抓不到的讀檔型測試
})

test('分支上有 commit（worktree 情境）→ 以 merge-base 取差集走 related', () => {
  const dir = initRepo()
  const g = (args: string[]) => execFileSync('git', args, { cwd: dir, stdio: 'ignore' })
  g(['checkout', '-b', 'adng/test'])
  writeFileSync(join(dir, 'tests', 'b.test.ts'), 'export {}\n')
  g(['add', '.'])
  g(['commit', '-m', 'feat: b'])
  const out = plan(dir)
  expect(out).toContain('PLAN: related')
  expect(out).toContain('tests/b.test.ts')
})
