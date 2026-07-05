import { expect, test } from 'vitest'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { runProcess } from '../src/proc.js'

const FAKE = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'fake-cli.mjs')
const base = { command: process.execPath, args: [FAKE], cwd: process.cwd(), timeoutMs: 10_000 }

test('ok：stdin 進、stdout 出、exit 0', async () => {
  process.env.FAKE_MODE = 'ok'
  const r = await runProcess({ ...base, stdinText: 'hello' })
  expect(r.exitCode).toBe(0)
  expect(r.timedOut).toBe(false)
  expect(r.stdout).toContain('done: hello')
})

test('fail：非零 exit、stderr 不被吞', async () => {
  process.env.FAKE_MODE = 'fail'
  const r = await runProcess({ ...base, stdinText: 'x' })
  expect(r.exitCode).toBe(3)
  expect(r.stderr).toContain('simulated 429')
})

test('empty：exit 0 但零輸出要能被呼叫端看穿', async () => {
  process.env.FAKE_MODE = 'empty'
  const r = await runProcess({ ...base, stdinText: 'x' })
  expect(r.exitCode).toBe(0)
  expect(r.stdout.trim()).toBe('')
})

test('hang：逾時樹斬、timedOut=true、不留殭屍', async () => {
  process.env.FAKE_MODE = 'hang'
  const t0 = Date.now()
  const r = await runProcess({ ...base, stdinText: 'x', timeoutMs: 1500 })
  expect(r.timedOut).toBe(true)
  expect(Date.now() - t0).toBeLessThan(8000) // 樹斬要快，不能拖
}, 15_000)

test('slow：慢但在時限內 → 正常完成', async () => {
  process.env.FAKE_MODE = 'slow'
  const r = await runProcess({ ...base, stdinText: 'x', timeoutMs: 5000 })
  expect(r.timedOut).toBe(false)
  expect(r.exitCode).toBe(0)
})
