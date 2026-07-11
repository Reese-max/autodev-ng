import { describe, test, expect, vi } from 'vitest'
import { routeInteraction, type InteractionLike } from '../src/bot/route.js'
import type { BotDeps } from '../src/bot/handlers.js'

// 純路由層測試：只 import route.js，絕不 import index.ts / discord.js，不打真 Discord。

function fakeInteraction(overrides: Partial<InteractionLike> = {}): { i: InteractionLike; replies: Array<{ text: string; ephemeral?: boolean }> } {
  const replies: Array<{ text: string; ephemeral?: boolean }> = []
  const i: InteractionLike = {
    commandName: 'status',
    userId: 'u1',
    arg: '',
    reply: async (text: string, ephemeral?: boolean) => {
      replies.push({ text, ephemeral })
    },
    ...overrides
  }
  return { i, replies }
}

// 路由不碰 d 的內容（handle 已被 spy 取代），塞最小假物件即可通過型別檢查。
const fakeDeps = {} as BotDeps

describe('routeInteraction', () => {
  test('白名單外 → 回未授權(ephemeral) 且 handle 未被呼叫', async () => {
    const { i, replies } = fakeInteraction({ userId: 'stranger' })
    const handle = vi.fn(async () => ({ ok: true, text: 'should-not-be-called' }))
    await routeInteraction(i, ['u1'], fakeDeps, handle)
    expect(handle).not.toHaveBeenCalled()
    expect(replies).toEqual([{ text: '未授權', ephemeral: true }])
  })

  test('白名單內 → reply 收到 handle 回傳文字', async () => {
    const { i, replies } = fakeInteraction({ userId: 'u1', commandName: 'status', arg: '' })
    const handle = vi.fn(async () => ({ ok: true, text: '狀態:running' }))
    await routeInteraction(i, ['u1'], fakeDeps, handle)
    expect(handle).toHaveBeenCalledWith('status', '', fakeDeps)
    expect(replies).toEqual([{ text: '狀態:running', ephemeral: undefined }])
  })

  test('handle throw → reply 內部錯誤,不外拋', async () => {
    const { i, replies } = fakeInteraction({ userId: 'u1' })
    const handle = vi.fn(async () => { throw new Error('boom') })
    await expect(routeInteraction(i, ['u1'], fakeDeps, handle)).resolves.toBeUndefined()
    expect(replies).toEqual([{ text: '內部錯誤', ephemeral: undefined }])
  })

  test('allowed 空陣列 → 一律未授權(即使 userId 命中空表也不可能)', async () => {
    const { i, replies } = fakeInteraction({ userId: 'u1' })
    const handle = vi.fn(async () => ({ ok: true, text: 'x' }))
    await routeInteraction(i, [], fakeDeps, handle)
    expect(handle).not.toHaveBeenCalled()
    expect(replies).toEqual([{ text: '未授權', ephemeral: true }])
  })
})
