import { expect, test } from 'vitest'
import { runVerify } from '../src/verify.js'

const NODE = process.execPath

test('無 command → skip', async () => {
  const r = await runVerify({ command: undefined, cwd: process.cwd(), timeoutMs: 5000 })
  expect(r.status).toBe('skip')
})

test('exit 0 → pass', async () => {
  const r = await runVerify({ command: `"${NODE}" -e "process.exit(0)"`, cwd: process.cwd(), timeoutMs: 10_000 })
  expect(r.status).toBe('pass')
})

test('exit 1 → fail 且 detail 含輸出', async () => {
  const r = await runVerify({ command: `"${NODE}" -e "console.error('3 tests failed');process.exit(1)"`, cwd: process.cwd(), timeoutMs: 10_000 })
  expect(r.status).toBe('fail')
  expect(r.detail).toContain('3 tests failed')
})

test('timeout → skip 不算 fail（附 detail）', async () => {
  const r = await runVerify({ command: `"${NODE}" -e "setInterval(()=>{},1e3)"`, cwd: process.cwd(), timeoutMs: 1200 })
  expect(r.status).toBe('skip')
  expect(r.detail).toContain('timeout')
}, 15_000)
