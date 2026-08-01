import { mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { Client, Events, GatewayIntentBits, SlashCommandBuilder } from 'discord.js'
import { assemble } from '../cli.js'
import { acquireLock, releaseLock } from '../lock.js'
import { loadBotConfig, loadBotToken, listProjectConfigs, type BotConfig } from './config.js'
import { handleCommand, type BotDeps } from './handlers.js'
import { buildReplyPayload } from './reply.js'
import { routeInteraction, routeMultiInteraction, ACTION_COMMANDS, type InteractionLike, type ProjectRuntime } from './route.js'

// discord.js adapter 只放 index.ts / reply.ts；純路由邏輯住 route.ts（不 import discord.js），
// 讓 tests/bot-route.test.ts 零依賴測路由，不打真 Discord。

/** 無參數指令（查詢/控制）+ 有字串參數指令，各自的中文說明（slash command 註冊用）。 */
const NO_ARG_COMMANDS: Record<string, string> = {
  status: '查詢 adng 執行狀態',
  cost: '查詢今日／昨日成本',
  backlog: '查詢 backlog 概況',
  log: '查詢近期事件紀錄',
  pause: '暫停 daemon（寫入 stop 檔）',
  resume: '恢復 daemon（清除 stop 檔）',
  lessons: '查看教訓庫（專案＋全域）',
  problems: '列出自主工程師台帳待處理問題 top10（依 value 排序）'
}

const ARG_COMMANDS: Record<string, string> = {
  silence: '設定或解除靜音窗（分鐘數，0 解除）',
  task: '新增一筆任務到 backlog',
  ask: '問 LLM 一個問題',
  goal: 'GOAL autopilot：set <目標文字>／run／status／stop'
}

/** 12 個 slash command 定義（8 無參數 + 4 帶字串參數 arg）。
 * withProject=true（多專案模式）時每指令再加 string option `project`：
 * READ_COMMANDS（NO_ARG_COMMANDS 扣掉 pause/resume）optional、ACTION_COMMANDS required
 * （arg 與 project 皆 required 時 Discord 要求 arg 排前，故 project 在 arg 之後加）。
 * withProject=false（單專案 --config 模式，main() 呼叫）維持原樣，無 project 選項。 */
function buildCommandsData(withProject = false): ReturnType<SlashCommandBuilder['toJSON']>[] {
  const noArg = Object.entries(NO_ARG_COMMANDS).map(([name, desc]) => {
    const builder = new SlashCommandBuilder().setName(name).setDescription(desc)
    if (withProject) {
      const required = (ACTION_COMMANDS as readonly string[]).includes(name)
      builder.addStringOption(o => o.setName('project').setDescription('專案名（可前綴縮寫）').setRequired(required))
    }
    return builder.toJSON()
  })
  const withArg = Object.entries(ARG_COMMANDS).map(([name, desc]) => {
    const builder = new SlashCommandBuilder()
      .setName(name)
      .setDescription(desc)
      .addStringOption(o => o.setName('arg').setDescription('參數').setRequired(true))
    if (withProject) {
      builder.addStringOption(o => o.setName('project').setDescription('專案名（可前綴縮寫）').setRequired(true))
    }
    return builder.toJSON()
  })
  return [...noArg, ...withArg]
}

export async function main(cfgPath: string): Promise<void> {
  const botCfg = loadBotConfig(cfgPath)
  const token = loadBotToken(botCfg.botTokenFile)
  if (!token) {
    console.error('找不到 bot token：請設定環境變數 ADNG_BOT_TOKEN 或 config 的 botTokenFile')
    process.exit(1)
  }

  const { deps, cfg } = assemble(cfgPath)
  const llm = { url: cfg.judgeUrl, model: cfg.judgeModel, apiKey: cfg.judgeApiKey, timeoutMs: cfg.judgeTimeoutMs }
  // resolve：/goal run spawn 子進程時 cwd 不保證等於這裡，cfgPath 必須是絕對路徑才可靠。
  // M9.4 fast-follow #2：events 沿用 assemble() 組好的長壽 EventLog 實例（deps.events），
  // 不再讓 doAsk 每呼叫自建一份（O(n) 全檔讀行數）。
  const botDeps: BotDeps = { cfg, store: deps.store, db: deps.db, llm, cfgPath: resolve(cfgPath), events: deps.events }

  const lockDir = join(cfg.dataDir, 'bot.lock')
  if (!acquireLock(lockDir)) {
    console.error('bot 已在執行中（lock busy），避免雙 bot 同時上線')
    process.exit(1)
  }

  const client = new Client({ intents: [GatewayIntentBits.Guilds] })

  client.once(Events.ClientReady, async (c) => {
    try {
      const commandsData = buildCommandsData()
      if (botCfg.guildId) {
        await c.application.commands.set(commandsData, botCfg.guildId)
      } else {
        await c.application.commands.set(commandsData)
      }
      console.log(`adng bot ready：以 ${c.user.tag} 上線，指令已註冊${botCfg.guildId ? `（guild ${botCfg.guildId}）` : '（全域）'}`)
    } catch (err) {
      // 指令註冊失敗不可讓進程假死——印人話後照常繼續跑（既有連線仍可能收到舊指令互動）。
      console.error('slash command 註冊失敗：', err instanceof Error ? err.message : String(err))
    }
  })

  client.on(Events.InteractionCreate, async (interaction) => {
    // async EventEmitter listener 內未捕獲的 throw 在 Node 22 = unhandled rejection，
    // 會直接殺掉整個 bot 進程（全分支審查 follow-up）。最外層兜底，錯誤只印訊息絕不含 token。
    try {
      if (!interaction.isChatInputCommand()) return
      const arg = interaction.options.getString('arg', false) ?? ''
      const iLike: InteractionLike = {
        commandName: interaction.commandName,
        userId: interaction.user.id,
        arg,
        reply: async (text, ephemeral) => {
          try {
            const payload = buildReplyPayload(text, ephemeral)
            if (interaction.replied || interaction.deferred) {
              await interaction.followUp(payload)
            } else {
              await interaction.reply(payload)
            }
          } catch {
            // discord.js 自身重連/回覆失敗即失敗——不做 bot 端 DLQ（YAGNI，brief 明文）。
          }
        }
      }
      await routeInteraction(iLike, botCfg.allowedUserIds, botDeps, handleCommand)
    } catch (err) {
      console.error('interaction 處理失敗:', err instanceof Error ? err.message : String(err))
    }
  })

  const shutdown = (signal: string): void => {
    console.log(`收到 ${signal}，準備關閉 bot`)
    releaseLock(lockDir)
    client.destroy().finally(() => process.exit(0))
  }
  process.once('SIGINT', () => shutdown('SIGINT'))
  process.once('SIGTERM', () => shutdown('SIGTERM'))

  // login 失敗（含 token 無效）一律不印 token 內容；discord.js 錯誤訊息本身不含 token 明文。
  await client.login(token)
}

/** 多專案入口（M10.5 Task 6）：逐 config 組裝，fail-open 跳過壞掉的專案；
 * BotDeps 組法逐字鏡像 main() 上面那段（cfg/store/db/llm/cfgPath/events）。 */
export async function mainMulti(configsDir: string): Promise<void> {
  const entries = listProjectConfigs(configsDir)
  const projects = new Map<string, ProjectRuntime>()
  const loadedConfigs: { name: string; botCfg: BotConfig }[] = []

  for (const { name, cfgPath } of entries) {
    try {
      const { deps, cfg } = assemble(cfgPath)
      const botCfg = loadBotConfig(cfgPath)
      const llm = { url: cfg.judgeUrl, model: cfg.judgeModel, apiKey: cfg.judgeApiKey, timeoutMs: cfg.judgeTimeoutMs }
      const botDeps: BotDeps = { cfg, store: deps.store, db: deps.db, llm, cfgPath: resolve(cfgPath), events: deps.events }
      projects.set(name, { deps: botDeps, allowed: botCfg.allowedUserIds })
      loadedConfigs.push({ name, botCfg })
    } catch (err) {
      console.warn(`[bot] 專案 ${name} 載入失敗，已跳過：`, err instanceof Error ? err.message : String(err))
    }
  }

  if (projects.size === 0) {
    console.error('configs-dir 下沒有任何專案成功載入，無法啟動 bot')
    process.exit(1)
  }

  const tokenSource = loadedConfigs.find(p => p.botCfg.botTokenFile)?.botCfg.botTokenFile
  const token = loadBotToken(tokenSource)
  if (!token) {
    console.error('找不到 bot token：請設定環境變數 ADNG_BOT_TOKEN 或任一 config 的 botTokenFile')
    process.exit(1)
  }

  const guildId = loadedConfigs.find(p => p.botCfg.guildId)?.botCfg.guildId

  // 單一 bot.lock 放 repo 頂層 data/（非任一專案 dataDir）；單專案 --config 模式 lock 位置不變。
  const lockDir = join(dirname(resolve(configsDir)), 'data', 'bot.lock')
  mkdirSync(dirname(lockDir), { recursive: true })
  if (!acquireLock(lockDir)) {
    console.error('bot 已在執行中（lock busy），避免雙 bot 同時上線')
    process.exit(1)
  }

  const client = new Client({ intents: [GatewayIntentBits.Guilds] })

  client.once(Events.ClientReady, async (c) => {
    try {
      const commandsData = buildCommandsData(true)
      if (guildId) {
        await c.application.commands.set(commandsData, guildId)
      } else {
        await c.application.commands.set(commandsData)
      }
      console.log(`adng bot ready（多專案 ${projects.size} 個）：以 ${c.user.tag} 上線，指令已註冊${guildId ? `（guild ${guildId}）` : '（全域）'}`)
    } catch (err) {
      console.error('slash command 註冊失敗：', err instanceof Error ? err.message : String(err))
    }
  })

  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (!interaction.isChatInputCommand()) return
      const arg = interaction.options.getString('arg', false) ?? ''
      const project = interaction.options.getString('project', false) ?? ''
      const iLike: InteractionLike & { project?: string } = {
        commandName: interaction.commandName,
        userId: interaction.user.id,
        arg,
        project,
        reply: async (text, ephemeral) => {
          try {
            const payload = buildReplyPayload(text, ephemeral)
            if (interaction.replied || interaction.deferred) {
              await interaction.followUp(payload)
            } else {
              await interaction.reply(payload)
            }
          } catch {
            // discord.js 自身重連/回覆失敗即失敗——不做 bot 端 DLQ（鏡像單專案 main()）。
          }
        }
      }
      await routeMultiInteraction(iLike, projects, handleCommand)
    } catch (err) {
      console.error('interaction 處理失敗:', err instanceof Error ? err.message : String(err))
    }
  })

  const shutdown = (signal: string): void => {
    console.log(`收到 ${signal}，準備關閉 bot`)
    releaseLock(lockDir)
    client.destroy().finally(() => process.exit(0))
  }
  process.once('SIGINT', () => shutdown('SIGINT'))
  process.once('SIGTERM', () => shutdown('SIGTERM'))

  await client.login(token)
}

const configsDirArg = process.argv.indexOf('--configs-dir')
const cfgArg = process.argv.indexOf('--config')
if (configsDirArg >= 0 && configsDirArg + 1 < process.argv.length) {
  mainMulti(process.argv[configsDirArg + 1]!).catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err))
    process.exit(1)
  })
} else if (cfgArg >= 0 && cfgArg + 1 < process.argv.length) {
  main(process.argv[cfgArg + 1]!).catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err))
    process.exit(1)
  })
} else {
  console.error('用法：node dist/bot/index.js --configs-dir <dir> 或 --config <path>')
  process.exit(1)
}
