import { expect, test } from 'vitest'
import { enqueueMerge } from '../src/engines/merge-queue.js'

test('同一主 repo 嚴格 FIFO，前者完成前不啟動後者', async () => {
  const order: string[] = []
  let release = () => {}
  const gate = new Promise<void>(resolve => { release = resolve })
  const first = enqueueMerge('repo-fifo', async () => {
    order.push('first:start')
    await gate
    order.push('first:end')
  })
  const second = enqueueMerge('repo-fifo', () => { order.push('second') })

  await Promise.resolve()
  expect(order).toEqual(['first:start'])
  release()
  await Promise.all([first, second])
  expect(order).toEqual(['first:start', 'first:end', 'second'])
})

test('不同主 repo 不共用 queue', async () => {
  const order: string[] = []
  let release = () => {}
  const gate = new Promise<void>(resolve => { release = resolve })
  const blocked = enqueueMerge('repo-a', async () => {
    order.push('a:start')
    await gate
    order.push('a:end')
  })

  await enqueueMerge('repo-b', () => { order.push('b') })
  expect(order).toEqual(['a:start', 'b'])
  release()
  await blocked
})
