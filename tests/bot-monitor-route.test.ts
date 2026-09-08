import { expect, test, vi } from 'vitest'
import { routeInteraction, routeMultiInteraction, type ProjectRuntime } from '../src/bot/route.js'
import type { BotDeps } from '../src/bot/handlers.js'
import { buildCommandsData } from '../src/bot/index.js'

test('實際 Discord SDK 指令結構提供 monitor/github，讀取 project 可省略而控制必填', () => {
  const commands = buildCommandsData(true)
  for (const name of ['monitor', 'github']) {
    const command = commands.find(c => c.name === name)!
    expect(command).toBeDefined()
    expect(command.options!.find(o => o.name === 'project')!.required).toBe(false)
  }
  expect(commands.find(c => c.name === 'pause')!.options!.find(o => o.name === 'project')!.required).toBe(true)
})

test('先授權，再 defer，最後執行慢查詢；拒絕者不 defer 或執行', async () => {
  const order: string[] = []
  const i = { commandName: 'monitor', userId: 'u', arg: '', defer: async () => { order.push('defer') }, reply: async () => { order.push('reply') } }
  const handle = vi.fn(async () => { order.push('handle'); return { ok: true, text: 'done' } })
  await routeInteraction(i, ['u'], {} as BotDeps, handle)
  expect(order).toEqual(['defer', 'handle', 'reply'])
  order.length = 0; handle.mockClear()
  await routeInteraction(i, [], {} as BotDeps, handle)
  expect(order).toEqual(['reply']); expect(handle).not.toHaveBeenCalled()
})

test('多專案 monitor 過濾權限、只 defer 一次，故障專案不遮蔽其他結果', async () => {
  const broken = {} as BotDeps, healthy = {} as BotDeps, secret = {} as BotDeps
  const projects = new Map<string, ProjectRuntime>([
    ['broken', { deps: broken, allowed: ['u'] }], ['healthy', { deps: healthy, allowed: ['u'] }], ['private', { deps: secret, allowed: ['other'] }],
  ])
  const reply = vi.fn(async (_text: string) => {}), defer = vi.fn(async () => {})
  const handle = vi.fn(async (_name: string, _arg: string, d: BotDeps) => {
    if (d === broken) throw new Error('private provider secret')
    return { ok: true, text: 'healthy observation' }
  })
  await routeMultiInteraction({ commandName: 'monitor', userId: 'u', arg: '', defer, reply }, projects, handle)
  expect(defer).toHaveBeenCalledTimes(1); expect(handle).toHaveBeenCalledTimes(2)
  const text = reply.mock.calls[0]![0]
  expect(text).toContain('healthy observation'); expect(text).toContain('查詢失敗'); expect(text).not.toContain('private')
})
