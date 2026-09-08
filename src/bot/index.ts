import { llmFromConfig } from '../autopilot/llm.js'
import { mkdirSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { Client, Events, GatewayIntentBits, MessageFlags, SlashCommandBuilder } from 'discord.js'
import { assemble } from '../cli.js'
import { acquireLock, releaseLock } from '../lock.js'
import { loadBotConfig, loadBotToken, listProjectConfigs, type BotConfig } from './config.js'
import { handleCommand, type BotDeps } from './handlers.js'
import { buildReplyPayload } from './reply.js'
import { loadMonitorConfig } from './monitor.js'
import { attachTestPeer } from './cctest.js'
import { routeInteraction, routeMultiInteraction, ACTION_COMMANDS, type InteractionLike, type ProjectRuntime } from './route.js'

// discord.js adapter 只放 index.ts / reply.ts；純路由邏輯住 route.ts（不 import discord.js），
// 讓 tests/bot-route.test.ts 零依賴測路由，不打真 Discord。

/** 無參數指令（查詢/控制）+ 有字串參數指令，各自的中文說明（slash command 註冊用）。 */
const NO_ARG_COMMANDS: Record<string, string> = {
  status: '查詢 adng 執行狀態',
  monitor: '查看心跳時效、派工暫停、PID 與任務及通知積壓',
  github: '查看 GitHub Issue、PR、執行次數與交付驗收收據',
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

/** Slash command 定義。
 * withProject=true（多專案模式）時每指令再加 string option `project`：
 * READ_COMMANDS（NO_ARG_COMMANDS 扣掉 pause/resume）optional、ACTION_COMMANDS required
 * （arg 與 project 皆 required 時 Discord 要求 arg 排前，故 project 在 arg 之後加）。
 * withProject=false（單專案 --config 模式，main() 呼叫）維持原樣，無 project 選項。 */
export function buildCommandsData(withProject = false): ReturnType<SlashCommandBuilder['toJSON']>[] {
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
  const llm = llmFromConfig(cfg, cfg.judgeModel, cfg.judgeUrl)
  // resolve：/goal run spawn 子進程時 cwd 不保證等於這裡，cfgPath 必須是絕對路徑才可靠。
  // M9.4 fast-follow #2：events 沿用 assemble() 組好的長壽 EventLog 實例（deps.events），
  // 不再讓 doAsk 每呼叫自建一份（O(n) 全檔讀行數）。
  const botDeps: BotDeps = { cfg, store: deps.store, db: deps.db, llm, cfgPath: resolve(cfgPath), events: deps.events }

  const lockDir = join(cfg.dataDir, 'bot.lock')
  if (!acquireLock(lockDir)) {
    console.error('bot 已在執行中（lock busy），避免雙 bot 同時上線')
    process.exit(1)
  }

  const client = new Client({ intents: [GatewayIntentBits.Guilds, ...(botCfg.testPeer ? [GatewayIntentBits.GuildMessages] : [])] })
  attachTestPeer(client, new Map([[basename(cfgPath, '.json'), { deps: botDeps, allowed: botCfg.allowedUserIds, testPeer: botCfg.testPeer }]]))
  client.on(Events.ShardError, (error, shardId) => console.error(`Discord shard ${shardId} 連線錯誤：`, error.message))
  process.once('uncaughtExceptionMonitor', () => releaseLock(lockDir)) // 不吞例外；只讓 guardian 能立即接手

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
        defer: async () => { await interaction.deferReply({ flags: MessageFlags.Ephemeral }) },
        reply: async (text, ephemeral) => {
          try {
            const payload = buildReplyPayload(text, ephemeral)
            if (interaction.deferred && !interaction.replied) {
              await interaction.editReply({ content: payload.content, files: payload.files, allowedMentions: payload.allowedMentions })
            } else if (interaction.replied) {
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
      const llm = llmFromConfig(cfg, cfg.judgeModel, cfg.judgeUrl)
      const botDeps: BotDeps = { cfg, store: deps.store, db: deps.db, llm, cfgPath: resolve(cfgPath), events: deps.events }
      projects.set(name, { deps: botDeps, allowed: botCfg.allowedUserIds, testPeer: botCfg.testPeer })
      loadedConfigs.push({ name, botCfg })
    } catch (err) {
      try {
        const cfg = loadMonitorConfig(cfgPath), botCfg = loadBotConfig(cfgPath)
        projects.set(name, { monitorOnly: { cfg, cfgPath: resolve(cfgPath) }, allowed: botCfg.allowedUserIds, testPeer: botCfg.testPeer })
        loadedConfigs.push({ name, botCfg })
        console.warn(`[bot] 專案 ${name} 完整環境未就緒，保留監控與暫停控制`)
      } catch { console.warn(`[bot] 專案 ${name} 設定無法解析，已跳過`) }
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

  const client = new Client({ intents: [GatewayIntentBits.Guilds, ...([...projects.values()].some(p => p.testPeer) ? [GatewayIntentBits.GuildMessages] : [])] })
  attachTestPeer(client, projects)
  client.on(Events.ShardError, (error, shardId) => console.error(`Discord shard ${shardId} 連線錯誤：`, error.message))
  process.once('uncaughtExceptionMonitor', () => releaseLock(lockDir)) // 不吞例外；只讓 guardian 能立即接手

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
        defer: async () => { await interaction.deferReply({ flags: MessageFlags.Ephemeral }) },
        reply: async (text, ephemeral) => {
          try {
            const payload = buildReplyPayload(text, ephemeral)
            if (interaction.deferred && !interaction.replied) {
              await interaction.editReply({ content: payload.content, files: payload.files, allowedMentions: payload.allowedMentions })
            } else if (interaction.replied) {
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

export async function runBotCli(args: string[]): Promise<void> {
  const { values } = parseArgs({ args, options: { config: { type: 'string' }, 'configs-dir': { type: 'string' }, help: { type: 'boolean' } } })
  const usage = '用法：adng bot --configs-dir <dir> 或 --config <path>'
  if (values.help) { console.log(usage); return }
  if (!!values.config === !!values['configs-dir']) throw new Error(usage)
  if (values.config) await main(values.config)
  else await mainMulti(values['configs-dir']!)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  runBotCli(process.argv.slice(2)).catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err))
    process.exitCode = 1
  })
}
