import { llmFromConfig, reviewLlmFromConfig } from '../autopilot/llm.js'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { ZodError } from 'zod'
import { BacklogStore } from '../backlog.js'
import { RunDb } from '../db.js'
import { EventLog } from '../events.js'
import { DiscordNotifier, formatTelegramTaskMessage, TelegramNotifier } from '../engines/notify.js'
import { KernelVerifier } from '../verifier.js'
import { reviewDiff, type ReviewRunArgs } from '../engines/review-gate.js'
import { makeEngineRegistry } from '../engines/registry.js'
import { ConfigSchema, type Config } from '../types.js'
import type { Deps } from '../scheduler.js'
import { LessonStore } from '../learn/store.js'
import { makeLessonsPort } from '../learn/reflect.js'
import { EvidenceStore } from '../engines/evidence-chain.js'
import { TeamState } from '../engines/team-state.js'

export function isEnoent(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as NodeJS.ErrnoException).code === 'ENOENT'
}

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

export function resolveSecretString(val: string | undefined, baseDir?: string): string | undefined {
  if (!val) return val
  const envMatch = val.match(/^\{env:([A-Za-z0-9_]+)\}$/) || val.match(/^\$\{env:([A-Za-z0-9_]+)\}$/) || val.match(/^\$\{([A-Za-z0-9_]+)\}$/)
  if (envMatch && envMatch[1]) {
    const secret = process.env[envMatch[1]]
    if (!secret?.trim()) throw new Error(`Configured secret environment variable is missing or empty: ${envMatch[1]}`)
    return secret
  }
  const fileMatch = val.match(/^\{file:(.+)\}$/)
  if (fileMatch && fileMatch[1]) {
    const filePath = baseDir ? resolve(baseDir, fileMatch[1]) : resolve(fileMatch[1])
    let secret: string
    try { secret = readFileSync(filePath, 'utf8').trim() }
    catch { throw new Error('Configured secret file is missing or unreadable') }
    if (!secret) throw new Error('Configured secret file is empty')
    return secret
  }
  return val
}

export function expandConfigPaths(baseDir: string, cfg: Config): Config {
  return {
    ...cfg,
    projectPath: resolve(baseDir, cfg.projectPath),
    backlogFile: resolve(baseDir, cfg.backlogFile),
    goalFile: cfg.goalFile ? resolve(baseDir, cfg.goalFile) : undefined,
    dataDir: resolve(baseDir, cfg.dataDir),
    stopFile: resolve(baseDir, cfg.stopFile),
    discordTokenFile: resolve(baseDir, cfg.discordTokenFile),
    worktreesDir: resolve(baseDir, cfg.worktreesDir),
    learningsFile: cfg.learningsFile ? resolve(baseDir, cfg.learningsFile) : undefined,
    globalLearningsFile: cfg.globalLearningsFile ? resolve(baseDir, cfg.globalLearningsFile) : undefined,
    releaseApprovalFile: cfg.releaseApprovalFile ? resolve(baseDir, cfg.releaseApprovalFile) : undefined,
    judgeApiKey: cfg.llmTransport === 'devin-cli' || cfg.llmTransport === 'cli' && cfg.tierMode !== 'free-only' ? '' : resolveSecretString(cfg.judgeApiKey, baseDir) ?? 'sk-any',
    telegramBotToken: resolveSecretString(cfg.telegramBotToken, baseDir),
  }
}

export function assemble(cfgPath: string): { deps: Deps; notifier: DiscordNotifier; cfg: Config } {
  const absCfgPath = resolve(cfgPath)
  const cfg = expandConfigPaths(dirname(absCfgPath), parseConfig(absCfgPath, loadConfig(absCfgPath)))
  return assembleConfig(cfg, absCfgPath)
}

export function assembleConfig(cfg: Config, absCfgPath?: string): { deps: Deps; notifier: DiscordNotifier; cfg: Config } {
  const events = new EventLog(cfg.dataDir)
  const store = new BacklogStore(cfg.backlogFile)
  const db = new RunDb(join(cfg.dataDir, 'run.db'))
  const engines = makeEngineRegistry(cfg)
  // review 的 effort/timeout 沿用 judge 檔次（驗收鏈同升降；要分開時再開獨立欄位）
  const reviewerModel = cfg.reviewEngine ?? cfg.auditModel
  const reviewRun = reviewerModel ? (a: ReviewRunArgs) => reviewDiff({ ...reviewLlmFromConfig(cfg), onModel: a.onModel }, a.diff, a.taskText) : undefined
  const verifier = new KernelVerifier({ cfg, reviewRun })
  const notifier = new DiscordNotifier({
    channelId: cfg.discordChannelId,
    tokenFile: cfg.discordTokenFile,
    dataDir: cfg.dataDir,
  })
  const telegramNotifier = new TelegramNotifier({ botToken: cfg.telegramBotToken, chatId: cfg.telegramChatId })
  const telegramConfigured = cfg.telegramBotToken?.trim() && String(cfg.telegramChatId ?? '').trim()
  const lessonStore = new LessonStore(cfg.learningsFile ?? join(cfg.dataDir, 'learnings.md'), cfg.globalLearningsFile)
  const lessons = makeLessonsPort({
    lessons: lessonStore, db, backlog: store,
    llm: llmFromConfig(cfg, cfg.judgeModel, cfg.judgeUrl), reviewLlm: cfg.auditModel ? reviewLlmFromConfig(cfg, cfg.auditModel, cfg.judgeUrl) : undefined, events
  })
  let team: TeamState | undefined
  try { team = new TeamState(cfg.projectPath) } catch { /* 非 Git fixture；真正派工仍由 worktree gate 阻擋 */ }

  const deps: Deps = {
    cfg, store, db, engines, events, verifier, evidence: new EvidenceStore(cfg.dataDir), team, lessons, cfgPath: absCfgPath,
    notify: text => notifier.send(text),
    ...(telegramConfigured ? { taskTerminalNotify: notice => telegramNotifier.send(formatTelegramTaskMessage(notice)) } : {}),
  }
  return { deps, notifier, cfg }
}

export async function withAssembled<T>(cfgPath: string, fn: (a: ReturnType<typeof assemble>) => Promise<T>): Promise<T> {
  const a = assemble(cfgPath)
  try { return await fn(a) } finally { a.deps.db.close(); a.deps.team?.close() }
}
