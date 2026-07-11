import { handleCommand, type BotDeps } from './handlers.js'

/** discord.js Interaction 的最小投影——index.ts 把真 discord.js Interaction 轉成此形狀，
 * 本檔（純路由層）完全不 import discord.js，讓 tests/bot-route.test.ts 可以零依賴測路由邏輯。 */
export interface InteractionLike {
  commandName: string
  userId: string
  arg: string
  reply(text: string, ephemeral?: boolean): Promise<void>
}

/** 路由核心：白名單先擋（空名單=拒絕所有人，鏡像 loadBotConfig fail-closed），
 * 通過才呼叫 handle（預設 handleCommand，測試可注入 spy）。handleCommand 契約上已不 throw，
 * 這裡仍包一層 try/catch（鐵律：路由層也永不外拋、永不讓例外撞上 discord.js gateway）。 */
export async function routeInteraction(
  i: InteractionLike,
  allowed: string[],
  d: BotDeps,
  handle: typeof handleCommand = handleCommand
): Promise<void> {
  if (allowed.length === 0 || !allowed.includes(i.userId)) {
    await i.reply('未授權', true)
    return
  }
  try {
    const r = await handle(i.commandName, i.arg, d)
    await i.reply(r.text)
  } catch {
    await i.reply('內部錯誤')
  }
}
