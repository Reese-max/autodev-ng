import { handleCommand, type BotDeps } from './handlers.js'
import { formatMonitor, githubMonitor, readMonitor } from './monitor.js'
import { doPause, doResume } from './actions.js'
import type { BotConfig } from './config.js'

/** discord.js Interaction 的最小投影——index.ts 把真 discord.js Interaction 轉成此形狀，
 * 本檔（純路由層）完全不 import discord.js，讓 tests/bot-route.test.ts 可以零依賴測路由邏輯。 */
export interface InteractionLike {
  commandName: string
  userId: string
  arg: string
  defer?(): Promise<void>
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
    await i.defer?.()
    const r = await handle(i.commandName, i.arg, d)
    await i.reply(r.text)
  } catch {
    await i.reply('內部錯誤')
  }
}

/** 讀類指令：無 project 參數時對使用者有權限的每個專案各摘要一段。
 * 動作類指令：project 必填（改狀態動作不可對「全部專案」批次做）。 */
export const READ_COMMANDS = ['status', 'cost', 'backlog', 'log', 'lessons', 'problems', 'monitor', 'github'] as const
export const ACTION_COMMANDS = ['pause', 'resume', 'silence', 'task', 'ask', 'goal'] as const

/** 專案名解析：精確匹配優先（即使該名同時是另一專案的前綴）；否則在 names 裡找唯一前綴匹配；
 * 前綴命中 ≥2 個回 ambiguous 帶候選（依 names 原順序）；一個都沒命中回 unknown。
 * 注意：空字串輸入時 startsWith('') 恆真，若 names>1 會回 ambiguous 全候選——呼叫端須自行做 truthy 前置檢查（routeMultiInteraction 已做）。 */
export function resolveProject(input: string, names: string[]):
  { kind: 'one'; name: string } | { kind: 'ambiguous'; candidates: string[] } | { kind: 'unknown' } {
  if (names.includes(input)) return { kind: 'one', name: input }
  const matches = names.filter(n => n.startsWith(input))
  if (matches.length === 1) return { kind: 'one', name: matches[0]! }
  if (matches.length > 1) return { kind: 'ambiguous', candidates: matches }
  return { kind: 'unknown' }
}

/** 多專案執行環境：每專案自己的 BotDeps＋allowlist（鏡像單專案 routeInteraction 的 allowed 參數）。 */
export type ProjectRuntime = { allowed: string[]; testPeer?: BotConfig['testPeer'] } & (
  { deps: BotDeps; monitorOnly?: never } | { deps?: never; monitorOnly: Pick<BotDeps, 'cfg' | 'cfgPath'> }
)

export async function handleProject(name: string, arg: string, rt: ProjectRuntime, handle: typeof handleCommand = handleCommand) {
  if (rt.deps) return handle(name, arg, rt.deps)
  const d = rt.monitorOnly
  if (name === 'pause') return doPause(d)
  if (name === 'resume') return doResume(d)
  if (name === 'status' || name === 'monitor') return { ok: true, text: formatMonitor(readMonitor(d.cfg, d.cfgPath)) + '\n僅供監控／暫停控制：完整執行環境未就緒，請檢查設定與憑證' }
  if (name === 'github') return { ok: true, text: await githubMonitor(d.cfgPath) }
  return { ok: false, text: '此專案完整執行環境未就緒；可用 monitor/status/github/pause/resume，其餘操作需先修正設定與憑證' }
}

/** 多專案路由（M10.5 Task 5）：
 * - i.project 有值：resolveProject → unknown/ambiguous 回人話（不呼叫 handle）；命中 → 該專案
 *   allowlist 擋人（鏡像 routeInteraction）→ handle。
 * - i.project 空：ACTION_COMMANDS → 回「動作指令必須指定 project」；否則（READ_COMMANDS）→ 對
 *   使用者在其 allowlist 的每個專案各呼叫一次 handle，回覆以 `【<name>】\n<text>` 段落、專案間空行串接；
 *   一個專案都沒權限 → 未授權。
 * - 任何 handle throw 在本層吞掉（鏡像 routeInteraction 鐵律：路由層永不外拋）。
 * - 聚合層不再另截斷——handlers.ts 既有 truncate 對每段各自負責。 */
export async function routeMultiInteraction(
  i: InteractionLike & { project?: string },
  projects: Map<string, ProjectRuntime>,
  handle: typeof handleCommand = handleCommand
): Promise<void> {
  const project = i.project
  if (project) {
    const r = resolveProject(project, [...projects.keys()])
    if (r.kind === 'unknown') {
      await i.reply(`找不到專案：${project}`)
      return
    }
    if (r.kind === 'ambiguous') {
      await i.reply(`專案名稱有歧義，候選：${r.candidates.join(', ')}`)
      return
    }
    const rt = projects.get(r.name)!
    if (rt.allowed.length === 0 || !rt.allowed.includes(i.userId)) {
      await i.reply('未授權', true)
      return
    }
    try {
      await i.defer?.()
      const result = await handleProject(i.commandName, i.arg, rt, handle)
      await i.reply(result.text)
    } catch {
      await i.reply('內部錯誤')
    }
    return
  }

  if ((ACTION_COMMANDS as readonly string[]).includes(i.commandName)) {
    await i.reply('動作指令必須指定 project')
    return
  }

  if (!(READ_COMMANDS as readonly string[]).includes(i.commandName)) {
    await i.reply('未知指令')
    return
  }

  const allowedEntries = [...projects.entries()].filter(([, rt]) => rt.allowed.includes(i.userId))
  if (allowedEntries.length === 0) {
    await i.reply('未授權', true)
    return
  }
  try {
    await i.defer?.()
    const sections: string[] = []
    for (const [name, rt] of allowedEntries) {
      try {
        const result = await handleProject(i.commandName, i.arg, rt, handle)
        sections.push(`【${name}】\n${result.text}`)
      } catch { sections.push(`【${name}】\n查詢失敗，其他專案仍可查看`) }
    }
    await i.reply(sections.join('\n\n'))
  } catch {
    await i.reply('內部錯誤')
  }
}
