import { expect, test } from 'vitest'
import { MockEngine } from '../src/engines/mock.js'
import type { Task } from '../src/types.js'

const T: Task = { id: 'ab12cd34', text: 'x', line: 0, status: 'open' }

test('依劇本輪流回應，耗盡後預設成功', async () => {
  const e = new MockEngine([
    { ok: false, reason: 'tests fail', costUsd: 0.5 },
    { throw: 'ECONNRESET' }
  ])
  const r1 = await e.run({ task: T, projectPath: 'p' })
  expect(r1.ok).toBe(false)
  expect(r1.failureReason).toBe('tests fail')
  await expect(e.run({ task: T, projectPath: 'p' })).rejects.toThrow('ECONNRESET')
  const r3 = await e.run({ task: T, projectPath: 'p' })
  expect(r3.ok).toBe(true)
  expect(e.calls).toHaveLength(3)
})

test('preflight 恆 ok', async () => {
  expect((await new MockEngine().preflight()).ok).toBe(true)
})
