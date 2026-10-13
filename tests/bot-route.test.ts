import { describe, test, expect, vi } from 'vitest'
import {
  routeInteraction, resolveProject, routeMultiInteraction,
  READ_COMMANDS, ACTION_COMMANDS,
  type InteractionLike, type ProjectRuntime
} from '../src/bot/route.js'
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

describe('READ_COMMANDS/ACTION_COMMANDS', () => {
  test('讀類與動作類指令清單', () => {
    expect(READ_COMMANDS).toEqual(['status', 'cost', 'backlog', 'log', 'lessons', 'problems', 'monitor', 'github'])
    expect(ACTION_COMMANDS).toEqual(['pause', 'resume', 'silence', 'task', 'ask', 'goal'])
  })
})

describe('resolveProject', () => {
  const names = ['voice-actress', 'prompt-autoresearch']
  test('精確匹配優先', () => {
    expect(resolveProject('voice-actress', names)).toEqual({ kind: 'one', name: 'voice-actress' })
  })
  test('唯一前綴匹配', () => {
    expect(resolveProject('prompt', names)).toEqual({ kind: 'one', name: 'prompt-autoresearch' })
  })
  test('多義前綴 → ambiguous 帶候選', () => {
    const ambigNames = ['proj-a', 'proj-b']
    expect(resolveProject('proj', ambigNames)).toEqual({ kind: 'ambiguous', candidates: ['proj-a', 'proj-b'] })
  })
  test('無匹配 → unknown', () => {
    expect(resolveProject('zzz', names)).toEqual({ kind: 'unknown' })
  })
})

describe('routeMultiInteraction', () => {
  function fakeMultiInteraction(overrides: Partial<InteractionLike & { project?: string }> = {}) {
    const replies: Array<{ text: string; ephemeral?: boolean }> = []
    const i: InteractionLike & { project?: string } = {
      commandName: 'status',
      userId: 'u1',
      arg: '',
      reply: async (text: string, ephemeral?: boolean) => { replies.push({ text, ephemeral }) },
      ...overrides
    }
    return { i, replies }
  }

  function runtime(allowed: string[]): ProjectRuntime {
    return { deps: {} as BotDeps, allowed }
  }

  test('帶 project 精確命中 → 該專案 allowlist 通過 → handle 收到該專案 deps', async () => {
    const parDeps = runtime(['u1'])
    const projects = new Map<string, ProjectRuntime>([
      ['voice-actress', runtime(['other'])],
      ['prompt-autoresearch', parDeps]
    ])
    const { i, replies } = fakeMultiInteraction({ commandName: 'pause', project: 'prompt' })
    const handle = vi.fn(async () => ({ ok: true, text: 'paused' }))
    await routeMultiInteraction(i, projects, handle)
    expect(handle).toHaveBeenCalledWith('pause', '', parDeps.deps)
    expect(replies).toEqual([{ text: 'paused', ephemeral: undefined }])
  })

  test('帶 project 命中但 user 不在該專案 allowlist → 未授權', async () => {
    const projects = new Map<string, ProjectRuntime>([
      ['prompt-autoresearch', runtime(['other'])]
    ])
    const { i, replies } = fakeMultiInteraction({ commandName: 'pause', project: 'prompt', userId: 'u1' })
    const handle = vi.fn(async () => ({ ok: true, text: 'paused' }))
    await routeMultiInteraction(i, projects, handle)
    expect(handle).not.toHaveBeenCalled()
    expect(replies).toEqual([{ text: '未授權', ephemeral: true }])
  })

  test('unknown project → reply 含「找不到專案」,handle 未呼叫', async () => {
    const projects = new Map<string, ProjectRuntime>([['voice-actress', runtime(['u1'])]])
    const { i, replies } = fakeMultiInteraction({ project: 'zzz' })
    const handle = vi.fn(async () => ({ ok: true, text: 'x' }))
    await routeMultiInteraction(i, projects, handle)
    expect(handle).not.toHaveBeenCalled()
    expect(replies[0]?.text).toContain('找不到專案')
  })

  test('ambiguous project → reply 列出候選,handle 未呼叫', async () => {
    const projects = new Map<string, ProjectRuntime>([
      ['proj-a', runtime(['u1'])],
      ['proj-b', runtime(['u1'])]
    ])
    const { i, replies } = fakeMultiInteraction({ project: 'proj' })
    const handle = vi.fn(async () => ({ ok: true, text: 'x' }))
    await routeMultiInteraction(i, projects, handle)
    expect(handle).not.toHaveBeenCalled()
    expect(replies[0]?.text).toContain('proj-a')
    expect(replies[0]?.text).toContain('proj-b')
  })

  test('動作類指令無 project → reply 提示必須指定,handle 未呼叫', async () => {
    const projects = new Map<string, ProjectRuntime>([['voice-actress', runtime(['u1'])]])
    const { i, replies } = fakeMultiInteraction({ commandName: 'pause', project: undefined })
    const handle = vi.fn(async () => ({ ok: true, text: 'x' }))
    await routeMultiInteraction(i, projects, handle)
    expect(handle).not.toHaveBeenCalled()
    expect(replies[0]?.text).toContain('必須指定')
  })

  test('動作類指令 project 空字串 → 同無 project 拒絕', async () => {
    const projects = new Map<string, ProjectRuntime>([['voice-actress', runtime(['u1'])]])
    const { i, replies } = fakeMultiInteraction({ commandName: 'goal', project: '' })
    const handle = vi.fn(async () => ({ ok: true, text: 'x' }))
    await routeMultiInteraction(i, projects, handle)
    expect(handle).not.toHaveBeenCalled()
    expect(replies[0]?.text).toContain('必須指定')
  })

  test('讀類無 project → 對使用者有權限的每個專案各呼叫一次,回覆以【專案名】段落串接', async () => {
    const aDeps = runtime(['u1'])
    const bDeps = runtime(['u1'])
    const projects = new Map<string, ProjectRuntime>([
      ['a', aDeps],
      ['b', bDeps],
      ['c', runtime(['other'])]
    ])
    const { i, replies } = fakeMultiInteraction({ commandName: 'status', project: undefined })
    const handle = vi.fn(async (name: string, _arg: string, d: BotDeps) => ({
      ok: true,
      text: d === aDeps.deps ? 'A狀態' : d === bDeps.deps ? 'B狀態' : 'C狀態'
    }))
    await routeMultiInteraction(i, projects, handle)
    expect(handle).toHaveBeenCalledTimes(2)
    expect(replies[0]?.text).toBe('【a】\nA狀態\n\n【b】\nB狀態')
  })

  test('讀類無 project 且 user 只在一個專案有權限 → 只呼叫該專案', async () => {
    const aDeps = runtime(['u1'])
    const projects = new Map<string, ProjectRuntime>([
      ['a', aDeps],
      ['b', runtime(['other'])]
    ])
    const { i, replies } = fakeMultiInteraction({ commandName: 'status', project: undefined })
    const handle = vi.fn(async () => ({ ok: true, text: 'A狀態' }))
    await routeMultiInteraction(i, projects, handle)
    expect(handle).toHaveBeenCalledTimes(1)
    expect(replies[0]?.text).toBe('【a】\nA狀態')
  })

  test('讀類無 project 且全無權限 → 未授權,handle 零呼叫', async () => {
    const projects = new Map<string, ProjectRuntime>([['a', runtime(['other'])]])
    const { i, replies } = fakeMultiInteraction({ commandName: 'status', project: undefined })
    const handle = vi.fn(async () => ({ ok: true, text: 'x' }))
    await routeMultiInteraction(i, projects, handle)
    expect(handle).not.toHaveBeenCalled()
    expect(replies).toEqual([{ text: '未授權', ephemeral: true }])
  })

  test('handle throw(帶 project) → reply 內部錯誤,不外拋', async () => {
    const projects = new Map<string, ProjectRuntime>([['a', runtime(['u1'])]])
    const { i, replies } = fakeMultiInteraction({ commandName: 'status', project: 'a' })
    const handle = vi.fn(async () => { throw new Error('boom') })
    await expect(routeMultiInteraction(i, projects, handle)).resolves.toBeUndefined()
    expect(replies).toEqual([{ text: '內部錯誤', ephemeral: undefined }])
  })

  test('handle throw(讀類聚合) → 不外拋,標示該專案查詢失敗', async () => {
    const projects = new Map<string, ProjectRuntime>([['a', runtime(['u1'])]])
    const { i, replies } = fakeMultiInteraction({ commandName: 'status', project: undefined })
    const handle = vi.fn(async () => { throw new Error('boom') })
    await expect(routeMultiInteraction(i, projects, handle)).resolves.toBeUndefined()
    expect(replies).toEqual([{ text: '【a】\n查詢失敗，其他專案仍可查看', ephemeral: undefined }])
  })

  test('未分類指令(無 project) → reply 未知指令,handle 零呼叫', async () => {
    const projects = new Map<string, ProjectRuntime>([['a', runtime(['u1'])]])
    const { i, replies } = fakeMultiInteraction({ commandName: 'notacmd', project: undefined })
    const handle = vi.fn(async () => ({ ok: true, text: 'x' }))
    await routeMultiInteraction(i, projects, handle)
    expect(handle).not.toHaveBeenCalled()
    expect(replies[0]?.text).toContain('未知指令')
  })
})
