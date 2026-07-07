import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ZodError } from 'zod'
import { BacklogStore } from './backlog.js'
import { localDay, RunDb } from './db.js'
import { EventLog } from './events.js'
import { DiscordNotifier } from './notify.js'
import { PreflightCache } from './preflight.js'
import { KernelVerifier } from './verifier.js'
import { MockEngine } from './engines/mock.js'
import { ClaudeCliEngine } from './engines/claude-cli.js'
import { CodexEngine } from './engines/codex.js'
import { CopilotEngine } from './engines/copilot.js'
import { AgyEngine } from './engines/agy.js'
import { GrokEngine } from './engines/grok.js'
import { QwenEngine } from './engines/qwen.js'
import { OpencodeEngine } from './engines/opencode.js'
import { ConfigSchema, type Config, type Engine, type EngineConfig, type EngineResolver } from './types.js'
import { runOnce, type CycleResult, type Deps } from './scheduler.js'
import { runDaemon } from './daemon.js'

function isEnoent(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as NodeJS.ErrnoException).code === 'ENOENT'
}

/**
 * config 讀取＋解析的人話化錯誤層：讀檔/JSON.parse/ConfigSchema.parse 三段各自
 * 攔截，把原生錯誤（ENOENT / SyntaxError / ZodError）轉成含「設定檔路徑」的
 * 中文一行訊息（ZodError 額外逐 issue 展開一行），丟給呼叫端（assemble）當
 * 一般 Error 往上拋——CLI 頂層 catch 只印 message、不印 stack。
 */
function loadConfig(absCfgPath: string): unknown {
  let rawText: string
  try {
    rawText = readFileSync(absCfgPath, 'utf8')
  } catch (err) {
    if (isEnoent(err)) throw new Error(`設定檔不存在: ${absCfgPath}`)
    throw err
  }

  try {
    return JSON.parse(rawText)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`設定檔 JSON 格式錯誤: ${absCfgPath}（${msg}）`)
  }
}

function parseConfig(absCfgPath: string, raw: unknown): Config {
  try {
    return ConfigSchema.parse(raw)
  } catch (err) {
    if (err instanceof ZodError) {
      const lines = err.issues.map(issue => `- ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      throw new Error([`設定檔欄位錯誤: ${absCfgPath}`, ...lines].join('\n'))
    }
    throw err
  }
}

const IDLE_SLEEP_MS = 5 * 60 * 1000

/** config JSON 內的相對路徑一律相對「config 檔所在目錄」展開（不吃 CWD），
 * 讓 `adng <cmd> --config <path>` 從任何工作目錄呼叫都行為一致。
 * path.resolve 遇到已是絕對路徑的欄位（如 discordTokenFile 預設值）會直接忽略 baseDir，原樣正規化。 */
function expandPath(baseDir: string, p: string): string {
  return resolve(baseDir, p)
}

function expandConfigPaths(baseDir: string, cfg: Config): Config {
  return {
    ...cfg,
    projectPath: expandPath(baseDir, cfg.projectPath),
    backlogFile: expandPath(baseDir, cfg.backlogFile),
    dataDir: expandPath(baseDir, cfg.dataDir),
    stopFile: expandPath(baseDir, cfg.stopFile),
    discordTokenFile: expandPath(baseDir, cfg.discordTokenFile),
    worktreesDir: expandPath(baseDir, cfg.worktreesDir),
  }
}

/** M5 Task 1：`{env:VAR}` 展開（assemble 層）——config 只寫變數引用，真值從進程環境取，
 * 不落 config/log/backlog 明文。變數缺失時只報「變數名」，絕不外洩值。導出供測試。 */
export function expandEnvValue(value: string): string {
  return value.replace(/\{env:([A-Za-z_][A-Za-z0-9_]*)\}/g, (_, name: string) => {
    const v = process.env[name]
    if (v === undefined) throw new Error(`環境變數未設定: ${name}（config engines 引用 {env:${name}}）`)
    return v
  })
}

function expandEnvMap(env: Record<string, string> | undefined): Record<string, string> | undefined {
  if (!env) return undefined
  return Object.fromEntries(Object.entries(env).map(([k, v]) => [k, expandEnvValue(v)]))
}

/** M5 Task 1：引擎 registry——per-task 按需建（lazy：沒被任務 tag 到的引擎不建、
 * 其 {env:VAR} 缺失也不影響其他引擎）、建後 cache。未實作的 adapter resolve 時拋錯，
 * scheduler 歸 blocked(engine-not-allowed)。導出供測試。 */
export function makeEngineRegistry(cfg: Config): EngineResolver {
  const cache = new Map<string, Engine>()
  const build = (tag: string, ec: EngineConfig): Engine => {
    switch (ec.adapter) {
      case 'mock':
        return new MockEngine()
      case 'claude-cli':
        return new ClaudeCliEngine({
          id: tag === 'claude' ? 'claude-cli' : `claude-cli:${tag}`,
          cache: new PreflightCache(join(cfg.dataDir, tag === 'claude' ? 'preflight-cache.json' : `preflight-cache-${tag}.json`)),
          env: expandEnvMap(ec.env),
          model: ec.model === undefined ? undefined : expandEnvValue(ec.model),
          timeoutMs: ec.timeoutMs
        })
      case 'codex':
        return new CodexEngine({
          id: tag === 'codex' ? 'codex' : `codex:${tag}`,
          cache: new PreflightCache(join(cfg.dataDir, `preflight-cache-${tag}.json`)),
          env: expandEnvMap(ec.env),
          model: ec.model === undefined ? undefined : expandEnvValue(ec.model),
          timeoutMs: ec.timeoutMs
        })
      case 'copilot':
        return new CopilotEngine({
          id: tag === 'copilot' ? 'copilot' : `copilot:${tag}`,
          cache: new PreflightCache(join(cfg.dataDir, `preflight-cache-${tag}.json`)),
          env: expandEnvMap(ec.env),
          model: ec.model === undefined ? undefined : expandEnvValue(ec.model), // 未設鎖 gpt-5-mini（adapter 預設）
          timeoutMs: ec.timeoutMs
        })
      case 'agy':
        // M5 Task 4：WSL 內 Antigravity CLI。ec.env 不透傳（WSL 邊界，Windows env 不會自動
        // 進 Linux 側；真有需要屬 WSLENV 工程，另議）；model 同 claude-cli 支援 {env:VAR} 展開。
        return new AgyEngine({
          id: tag === 'agy' ? 'agy' : `agy:${tag}`,
          cache: new PreflightCache(join(cfg.dataDir, `preflight-cache-${tag}.json`)),
          model: ec.model === undefined ? undefined : expandEnvValue(ec.model),
          timeoutMs: ec.timeoutMs
        })
      case 'grok':
        // M5 Task 7：xAI grok CLI（原生 .exe 直呼；prompt 走 --prompt-file tmp 檔；無 usage 欄位）。
        return new GrokEngine({
          id: tag === 'grok' ? 'grok' : `grok:${tag}`,
          cache: new PreflightCache(join(cfg.dataDir, `preflight-cache-${tag}.json`)),
          env: expandEnvMap(ec.env),
          model: ec.model === undefined ? undefined : expandEnvValue(ec.model),
          timeoutMs: ec.timeoutMs
        })
      case 'qwen': {
        // M5 Task 6：qwen 殼接本機 OpenAI 相容 proxy（規格卡卡 3）。base URL／API key 沿 Task 1
        // env 機制從 ec.env 取（OPENAI_BASE_URL／OPENAI_API_KEY，值可 {env:VAR}），adapter 以
        // 規格卡實測旗標顯式帶入；env 同時透傳 runProcess（旗標與 env 同值，行為一致）。
        const qenv = expandEnvMap(ec.env)
        return new QwenEngine({
          id: tag === 'qwen' ? 'qwen' : `qwen:${tag}`,
          cache: new PreflightCache(join(cfg.dataDir, `preflight-cache-${tag}.json`)),
          env: qenv,
          baseUrl: qenv?.OPENAI_BASE_URL,
          apiKey: qenv?.OPENAI_API_KEY,
          model: ec.model === undefined ? undefined : expandEnvValue(ec.model),
          timeoutMs: ec.timeoutMs
        })
      }
      case 'opencode':
        // M5 Task 8：opencode zen（規格卡 m5-opencode-research.md）。XDG 隔離 profile 落 dataDir；
        // zen apiKey 由 ec.env 的 OPENCODE_ZEN_KEY 供給（profile 內寫 {env:...} 引用，不落明文）。
        return new OpencodeEngine({
          id: tag === 'opencode' ? 'opencode' : `opencode:${tag}`,
          cache: new PreflightCache(join(cfg.dataDir, `preflight-cache-${tag}.json`)),
          env: expandEnvMap(ec.env), profileDir: join(cfg.dataDir, 'opencode-profile'),
          model: ec.model === undefined ? undefined : expandEnvValue(ec.model), timeoutMs: ec.timeoutMs
        })
      default:
        throw new Error(`adapter ${ec.adapter} 尚未實作（M5 Task 3-8 逐一落地）`)
    }
  }
  return {
    resolve(tag: string): Engine {
      const hit = cache.get(tag)
      if (hit) return hit
      const ec = cfg.engines[tag]
      if (!ec) throw new Error(`engine tag 不在 engines 白名單: ${tag}`)
      const engine = build(tag, ec)
      cache.set(tag, engine)
      return engine
    }
  }
}

/**
 * 組裝層（cli 進入點薄殼共用）：讀 config JSON → ConfigSchema.parse → 展開路徑 →
 * 組 BacklogStore/RunDb/EventLog/engine registry（cfg.engines 白名單，per-task lazy 建）/
 * KernelVerifier → Deps；另組 DiscordNotifier 供 daemon 子命令使用。
 * 導出供測試：驗證組裝正確性（engine 型別、verifier 有掛、路徑展開）不必真的跑 CLI 進程。
 */
export function assemble(cfgPath: string): { deps: Deps; notifier: DiscordNotifier; cfg: Config } {
  const absCfgPath = resolve(cfgPath)
  const raw = loadConfig(absCfgPath)
  const parsed = parseConfig(absCfgPath, raw)
  const cfg = expandConfigPaths(dirname(absCfgPath), parsed)

  // EventLog 建構子會 mkdirSync(dataDir)，必須先跑，RunDb 才能在同一個目錄下建 sqlite 檔。
  const events = new EventLog(cfg.dataDir)
  const store = new BacklogStore(cfg.backlogFile)
  const db = new RunDb(join(cfg.dataDir, 'run.db'))

  const engines = makeEngineRegistry(cfg)

  const verifier = new KernelVerifier({ cfg })

  const notifier = new DiscordNotifier({
    channelId: cfg.discordChannelId,
    tokenFile: cfg.discordTokenFile,
    dataDir: cfg.dataDir,
  })

  const deps: Deps = { cfg, store, db, engines, events, verifier }
  return { deps, notifier, cfg }
}

export interface HeartbeatSnapshot {
  ts: string
  state: string
  currentTask?: string
  todayCostUsd: number
}

export interface BacklogCounts { open: number; blocked: number; done: number }

export interface StatusInput {
  heartbeat: HeartbeatSnapshot | null
  dailySoftUsd: number
  dailyHardUsd: number
  backlog: BacklogCounts
  /** backlogFile 讀取時 ENOENT（檔案消失）的人話訊息；有值時取代 backlog 計數那一行，其餘欄位照常印。 */
  backlogError?: string
  dlqCount: number
  lastDigestDay?: string
}

/** status 輸出組字串——純函數，方便測字串內容不必真跑 daemon/檔案 I/O。 */
export function formatStatus(input: StatusInput): string {
  if (!input.heartbeat) return 'daemon 未跑過（heartbeat.json 不存在）'

  const hb = input.heartbeat
  const taskLine = hb.currentTask ? `｜currentTask=${hb.currentTask}` : ''
  const backlogLine = input.backlogError
    ? `backlog：${input.backlogError}`
    : `backlog：open=${input.backlog.open}｜blocked=${input.backlog.blocked}｜done=${input.backlog.done}`
  return [
    'adng status',
    `heartbeat：${hb.ts}｜state=${hb.state}${taskLine}`,
    `今日成本：$${hb.todayCostUsd.toFixed(4)}（軟頂 $${input.dailySoftUsd.toFixed(2)} / 硬頂 $${input.dailyHardUsd.toFixed(2)}）`,
    backlogLine,
    `DLQ 積壓：${input.dlqCount} 筆`,
    `最後 digest 日期：${input.lastDigestDay ?? '尚未發送過'}`,
  ].join('\n')
}

function readHeartbeat(dataDir: string): HeartbeatSnapshot | null {
  const file = join(dataDir, 'heartbeat.json')
  if (!existsSync(file)) return null
  try {
    const raw: unknown = JSON.parse(readFileSync(file, 'utf8'))
    if (typeof raw !== 'object' || raw === null) return null
    const r = raw as Record<string, unknown>
    if (typeof r.ts !== 'string' || typeof r.state !== 'string' || typeof r.todayCostUsd !== 'number') return null
    return {
      ts: r.ts,
      state: r.state,
      currentTask: typeof r.currentTask === 'string' ? r.currentTask : undefined,
      todayCostUsd: r.todayCostUsd,
    }
  } catch {
    return null
  }
}

/** 同 digest.ts 內部邏輯（未導出，這裡是 CLI 面自己的一份最小重讀）：缺檔/壞檔一律回 0，status 面不可因觀測資料損毀而炸掉。 */
function countDlqLines(dataDir: string): number {
  const file = join(dataDir, 'notify-dlq.jsonl')
  if (!existsSync(file)) return 0
  try {
    const content = readFileSync(file, 'utf8')
    if (content.trim() === '') return 0
    return content.split(/\r?\n/).filter(line => line.length > 0).length
  } catch {
    return 0
  }
}

function readLastDigestDay(dataDir: string): string | undefined {
  const file = join(dataDir, 'digest-stamp.json')
  if (!existsSync(file)) return undefined
  try {
    const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'))
    if (typeof parsed !== 'object' || parsed === null) return undefined
    const v = (parsed as Record<string, unknown>).lastSentDay
    return typeof v === 'string' ? v : undefined
  } catch {
    return undefined
  }
}

function backlogCounts(store: BacklogStore): BacklogCounts {
  const tasks = store.read()
  return {
    open: tasks.filter(t => t.status === 'open').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    done: tasks.filter(t => t.status === 'done').length,
  }
}

const EMPTY_BACKLOG_COUNTS: BacklogCounts = { open: 0, blocked: 0, done: 0 }

/** backlogFile 在 status 讀取當下消失（被刪、被移走）不該讓整個 status 指令炸掉——
 * 其他觀測資料（heartbeat/成本/DLQ/digest）依然有價值，只把 backlog 那段換成人話提示。
 * 只吞 ENOENT，其餘錯誤（權限、壞檔內容以外的例外）原樣往上拋。 */
function safeBacklogCounts(store: BacklogStore, backlogFile: string): { counts: BacklogCounts; error?: string } {
  try {
    return { counts: backlogCounts(store) }
  } catch (err) {
    if (isEnoent(err)) return { counts: EMPTY_BACKLOG_COUNTS, error: `backlog 檔不存在: ${backlogFile}` }
    throw err
  }
}

async function cmdStatus(cfgPath: string): Promise<void> {
  const { deps } = assemble(cfgPath)
  try {
    const heartbeat = readHeartbeat(deps.cfg.dataDir)
    if (!heartbeat) {
      console.log('daemon 未跑過')
      return
    }
    const { counts, error: backlogError } = safeBacklogCounts(deps.store, deps.cfg.backlogFile)
    console.log(formatStatus({
      heartbeat,
      dailySoftUsd: deps.cfg.dailySoftUsd,
      dailyHardUsd: deps.cfg.dailyHardUsd,
      backlog: counts,
      backlogError,
      dlqCount: countDlqLines(deps.cfg.dataDir),
      lastDigestDay: readLastDigestDay(deps.cfg.dataDir),
    }))
  } finally {
    deps.db.close()
  }
}

function formatCycleResult(result: CycleResult): string {
  return typeof result === 'string' ? result : `blocked（任務：${result.taskText}）`
}

/**
 * Fix 4（首跑實證）：runOnce 對 stopped/cost-stop/idle/preflight-failed 自帶 heartbeat 收尾，
 * 但任務真的跑起來（running）之後的 done/failed/engine-error/blocked 都不再寫——daemon 靠
 * 下一輪覆寫無礙；run-once 是單輪進程，不收尾 heartbeat 會永遠停在 running 假活。這裡只對
 * 「跑過任務」的結果補寫 idle（觀測面故障吞錯，不反殺 CLI）。從 cmdRunOnce 抽出導出
 * （同 runNotifyTest 模式）：mock deps 即可回歸測試，不必真跑 CLI 進程。
 */
export function finalizeRunOnceHeartbeat(deps: Deps, result: CycleResult, now: Date = new Date()): void {
  if (!(typeof result === 'object' || result === 'done' || result === 'failed' || result === 'engine-error')) return
  try {
    const day = localDay(now.toISOString(), deps.cfg.timezoneOffsetHours)
    deps.events.heartbeat({ state: 'idle', todayCostUsd: deps.db.costForLocalDay(day, deps.cfg.timezoneOffsetHours) })
  } catch { /* 觀測面故障不可反殺 CLI（鐵律 #4） */ }
}

async function cmdRunOnce(cfgPath: string): Promise<void> {
  const { deps } = assemble(cfgPath)
  try {
    const result = await runOnce(deps)
    finalizeRunOnceHeartbeat(deps, result)
    console.log(`CycleResult: ${formatCycleResult(result)}`)
  } finally {
    deps.db.close()
  }
}

async function cmdDaemon(cfgPath: string): Promise<void> {
  const { deps, notifier } = assemble(cfgPath)
  try {
    const lockDir = join(deps.cfg.dataDir, 'daemon.lock')
    const result = await runDaemon({
      deps,
      notifier,
      lockDir,
      cooldownMs: deps.cfg.cooldownMs,
      idleSleepMs: IDLE_SLEEP_MS,
    })
    console.log(`daemon result: ${result}`)
  } finally {
    deps.db.close()
  }
}

/**
 * M4 Task 7：notify-test 子命令核心——組一則「adng 通道測試 <ISO 時刻>」送出去，回報
 * 送達與否。notifier 由呼叫端注入（cmdNotifyTest 用 assemble 組出的真 notifier；測試用
 * mock fetch 建的 notifier），本函數本身不碰檔案/網路，方便單元測試不觸真 API/真 token 檔。
 */
export async function runNotifyTest(notifier: DiscordNotifier, now: Date = new Date()): Promise<{ ok: boolean; text: string }> {
  const text = `adng 通道測試 ${now.toISOString()}`
  const ok = await notifier.send(text)
  return { ok, text }
}

async function cmdNotifyTest(cfgPath: string): Promise<void> {
  const { deps, notifier } = assemble(cfgPath)
  try {
    const { ok, text } = await runNotifyTest(notifier)
    if (ok) {
      console.log(`送達成功：${text}`)
    } else {
      console.log(`送達失敗（已寫入 DLQ，detail 見 dataDir/notify-dlq.jsonl）：${text}`)
      process.exitCode = 1
    }
  } finally {
    deps.db.close()
  }
}

export interface ParsedArgv { command: string; configPath?: string }

/** argv 手解，不加依賴：`adng <command> --config <path>`。 */
export function parseArgv(argv: string[]): ParsedArgv {
  const command = argv[0] ?? ''
  let configPath: string | undefined
  for (let i = 1; i < argv.length; i++) {
    if (argv[i] === '--config') {
      configPath = argv[i + 1]
      i++
    }
  }
  return { command, configPath }
}

async function main(): Promise<void> {
  const { command, configPath } = parseArgv(process.argv.slice(2))

  if (!configPath) {
    console.error('用法：adng <status|run-once|daemon|notify-test> --config <path>')
    process.exitCode = 1
    return
  }

  switch (command) {
    case 'status':
      await cmdStatus(configPath)
      break
    case 'run-once':
      await cmdRunOnce(configPath)
      break
    case 'daemon':
      await cmdDaemon(configPath)
      break
    case 'notify-test':
      await cmdNotifyTest(configPath)
      break
    default:
      console.error(`未知子命令：${command}（可用：status | run-once | daemon | notify-test）`)
      process.exitCode = 1
  }
}

// cli 進入點薄殼：只有直接執行本檔（`node dist/cli.js` / `adng`）才跑 main()，
// 被其他模組 import（例如 tests/cli.test.ts import assemble/formatStatus）不會觸發。
// 頂層 catch 只印 message（config 三類錯誤已在 loadConfig/parseConfig 轉成人話），不印 stack。
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err))
    process.exitCode = 1
  })
}
