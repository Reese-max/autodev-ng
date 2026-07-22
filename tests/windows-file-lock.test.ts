import { EventEmitter } from 'node:events'
import type { ChildProcessWithoutNullStreams } from 'node:child_process'
import { PassThrough } from 'node:stream'
import { afterEach, expect, test, vi } from 'vitest'
import { waitForChildLine } from './helpers/windows-file-lock.js'

function fakeChild(): { child: ChildProcessWithoutNullStreams; stdout: PassThrough } {
  const child = new EventEmitter() as ChildProcessWithoutNullStreams
  const stdout = new PassThrough()
  Object.assign(child, { stdout, stderr: new PassThrough() })
  return { child, stdout }
}

const fakeTimerOptions = {
  timeoutMs: 100,
  setTimer: (callback: () => void, delayMs: number) => setTimeout(callback, delayMs),
  clearTimer: (handle: ReturnType<typeof setTimeout>) => clearTimeout(handle),
}

afterEach(() => vi.useRealTimers())

test('waitForChildLine：只以完整訊號行判定完成，不賭輪詢間隔', async () => {
  vi.useFakeTimers()
  const { child, stdout } = fakeChild()
  let completed = false
  const waiting = waitForChildLine(child, 'READY', fakeTimerOptions).then(() => { completed = true })

  stdout.write('NOT_READY\n')
  await vi.advanceTimersByTimeAsync(99)
  expect(completed).toBe(false)

  stdout.write('READY\r\n')
  await waiting
  expect(completed).toBe(true)
})

test('waitForChildLine：可注入 fake timer 精確驗證 timeout 邊界', async () => {
  vi.useFakeTimers()
  const { child } = fakeChild()
  const waiting = expect(waitForChildLine(child, 'READY', fakeTimerOptions))
    .rejects.toThrow('100ms 內未回報 READY')

  await vi.advanceTimersByTimeAsync(99)
  await vi.advanceTimersByTimeAsync(1)
  await waiting
})
