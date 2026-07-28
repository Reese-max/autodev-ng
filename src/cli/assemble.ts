import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { ZodError } from 'zod'
import { BacklogStore } from '../backlog.js'
import { RunDb } from '../db.js'
import { EventLog } from '../events.js'
import { DiscordNotifier } from '../engines/notify.js'
import { KernelVerifier } from '../verifier.js'
import { reviewDiff } from '../engines/review-gate.js'
import { makeEngineRegistry } from '../engines/registry.js'
import { ConfigSchema, type Config } from '../types.js'
import type { Deps } from '../scheduler.js'
import { LessonStore } from '../learn/store.js'
import { makeLessonsPort } from '../learn/reflect.js'

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

function expandConfigPaths(baseDir: string, cfg: Config): Config {
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
  }
}

export function assemble(cfgPath: string): { deps: Deps; notifier: DiscordNotifier; cfg: Config } {
  const absCfgPath = resolve(cfgPath)
  const cfg = expandConfigPaths(dirname(absCfgPath), parseConfig(absCfgPath, loadConfig(absCfgPath)))

  const events = new EventLog(cfg.dataDir)
  const store = new BacklogStore(cfg.backlogFile)
  const db = new RunDb(join(cfg.dataDir, 'run.db'))
  const engines = makeEngineRegistry(cfg)
  // review 的 effort/timeout 沿用 judge 檔次（驗收鏈同升降；要分開時再開獨立欄位）
  const reviewRun = cfg.reviewEngine ? (a: { diff: string; taskText: string }) => reviewDiff({ url: cfg.reviewUrl ?? cfg.judgeUrl, model: cfg.reviewEngine!, apiKey: cfg.judgeApiKey, effort: cfg.judgeEffort, timeoutMs: cfg.judgeTimeoutMs }, a.diff, a.taskText) : undefined
  const verifier = new KernelVerifier({ cfg, reviewRun })
  const notifier = new DiscordNotifier({
    channelId: cfg.discordChannelId,
    tokenFile: cfg.discordTokenFile,
    dataDir: cfg.dataDir,
  })
  const lessonStore = new LessonStore(cfg.learningsFile ?? join(cfg.dataDir, 'learnings.md'), cfg.globalLearningsFile)
  const lessons = makeLessonsPort({
    lessons: lessonStore, db, backlog: store,
    llm: { url: cfg.judgeUrl, model: cfg.judgeModel, apiKey: cfg.judgeApiKey }, events
  })

  const deps: Deps = { cfg, store, db, engines, events, verifier, lessons, cfgPath: absCfgPath, notify: text => notifier.send(text) }
  return { deps, notifier, cfg }
}

export async function withAssembled(cfgPath: string, fn: (a: ReturnType<typeof assemble>) => Promise<void>): Promise<void> {
  const a = assemble(cfgPath)
  try { await fn(a) } finally { a.deps.db.close() }
}
