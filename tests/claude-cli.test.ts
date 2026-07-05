import { expect, test } from 'vitest'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ClaudeCliEngine } from '../src/engines/claude-cli.js'
import { PreflightCache } from '../src/preflight.js'
import type { Task } from '../src/types.js'

const FAKE = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'fake-cli.mjs')
const T: Task = { id: 'ab12cd34', text: '修好登入頁', line: 0, status: 'open' }

function engine(mode: string, hashes: (string | undefined)[], timeoutMs = 10_000): ClaudeCliEngine {
  process.env.FAKE_MODE = mode
  const cache = new PreflightCache(join(mkdtempSync(join(tmpdir(), 'adng-cc-')), 'pf.json'))
  let i = 0
  return new ClaudeCliEngine({
    command: process.execPath, baseArgs: [FAKE], timeoutMs, pingTimeoutMs: 10_000,
    cache, getCommitHash: () => hashes[Math.min(i++, hashes.length - 1)]
  })
}

test('成功+有新 commit → ok、cost、commitHash', async () => {
  const e = engine('ok', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(true)
  expect(r.costUsd).toBeCloseTo(0.123)
  expect(r.commitHash).toBe('bbb')
})

test('成功但無新 commit → 降級 phantom completion', async () => {
  const e = engine('ok', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('no-commit')
})

test('exit 非零 → ok:false 且 stderr 進 failureReason', async () => {
  const e = engine('fail', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('simulated 429')
})

test('exit 0 空輸出 → ok:false（踩雷 §13）', async () => {
  const e = engine('empty', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('empty')
})

test('hang → timeout、costUsd 0', async () => {
  const e = engine('hang', ['aaa', 'aaa'], 1500)
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toBe('timeout')
}, 15_000)

test('preflight：PONG 判 ok 且第二次走 cache（fake 只被叫一次）', async () => {
  const e = engine('ok', ['a'])
  const r1 = await e.preflight()
  expect(r1.ok).toBe(true)
  process.env.FAKE_MODE = 'fail' // 若第二次真的打 CLI 會變 fail——用這招驗證 cache 命中
  const r2 = await e.preflight()
  expect(r2.ok).toBe(true)
})

test('preflight 失敗也寫 cache（不連環重打）', async () => {
  const e = engine('fail', ['a'])
  expect((await e.preflight()).ok).toBe(false)
  process.env.FAKE_MODE = 'ok'
  expect((await e.preflight()).ok).toBe(false) // 仍是 cache 的壞結果
})
