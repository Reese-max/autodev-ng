import { z } from 'zod'

export interface Task {
  id: string
  text: string
  line: number
  status: 'open' | 'done' | 'blocked'
  /** M5 Task 1：行內 `[engine:xxx]` tag（行首或行尾）。解析時從 text 剝離、不入 taskId 雜湊
   * ——無 tag 任務的雜湊因此完全不變（硬回歸線：既有 done 行 id 不得漂移）。 */
  engineTag?: string
  /** 寫回檔案用的任務原文（含 engine tag、不含 adng 註記）。鐵律 #1：系統只改勾選狀態與
   * 行尾註記，絕不改寫使用者的任務文字——tag 剝離只發生在解讀層，寫回時必須原樣保留。 */
  rawText?: string
  /** M6 GOAL autopilot Task 2：行來源。'autopilot' = 經 BacklogStore.append() 受控寫入
   * （鐵律 #1 修訂版唯一破口，行帶 adng:autopilot 註記）；'user' = 其餘所有行（含無註記的
   * 手排任務）。純解讀層標記，不影響既有 taskId/report 行為。 */
  source?: 'user' | 'autopilot'
}

export type Disposition =
  | { kind: 'done'; commitHash: string }
  | { kind: 'blocked'; reason: string }

export interface Job {
  task: Task
  projectPath: string
  /** M4 Task 6（worktree 接線）：cfg.extraDirective 附加在任務文字尾的專案特規指示
   * （如 voice-actress 的 port 3210 警告）。未設定 extraDirective 時維持 undefined；
   * claude-cli engine 的 prompt 任務行以 directive ?? task.text 消費（Fix 1 已接線）。 */
  directive?: string
}

export interface RunResult {
  ok: boolean
  output: string
  costUsd: number
  commitHash?: string
  failureReason?: string
  baseCommitHash?: string
  /** M4 Task 3（真花錢前必修）：true 表示 costUsd 是「引擎沒能力回報真值」時的佔位 0
   * （timeout / exit≠0 / 輸出不可解析——CLI 進程極可能已實際呼叫並燒錢，只是沒能力回報
   * 真實金額），與「引擎成功解析出 JSON、真實回報值恰好是 0」不同語意。scheduler 記帳層
   * 據此決定是否改記 cfg.failureCostEstimateUsd；未設（undefined/false）＝costUsd 是可信真值。 */
  costUnknown?: boolean
}

export interface PreflightResult { ok: boolean; detail: string }

export interface Engine {
  id: string
  preflight(): Promise<PreflightResult>
  run(job: Job): Promise<RunResult>
}

/** M5 Task 1：per-task 引擎解析。scheduler 依任務 tag（或 cfg.defaultEngine）按需取引擎
 * （registry 按需建、可 cache——實作在 assemble 層 cli.ts）。resolve 拋錯＝引擎無法建立
 * （adapter 未實作／env 引用缺失），scheduler 歸 blocked(engine-not-allowed)。 */
export interface EngineResolver {
  resolve(tag: string): Engine
}

/** 引擎矩陣單格設定。adapter 列全矩陣（M5 Task 3-8 逐一落地；未實作的 adapter 在
 * resolve 時報錯而非 schema 擋掉——config 可以先寫好等 adapter 上線）。
 * costPerRunUsd：非真值引擎的固定成本估計，成功失敗一律入帳此值；未設＝真值引擎。僅 claude-cli/mock/opencode
 * 可不設（opencode 的 zen NDJSON cost 為可信真值，設 0 會令 scheduler 的 fixedCost ?? 真值恆取 0 變死碼——
 * spec 矩陣定為不設），其餘 adapter 由 ConfigSchema 的 superRefine 強制必設（免費引擎明確寫 0）。 */
export const EngineConfigSchema = z.object({
  adapter: z.enum(['mock', 'claude-cli', 'codex', 'agy', 'copilot', 'qwen', 'grok', 'opencode', 'devin']),
  command: z.string().optional(), // CLI 執行檔覆寫（如 opencode.exe 不在 PATH 時指完整路徑）；Task 8 起 opencode 接線，其餘 adapter 按需跟進
  costPerRunUsd: z.number().nonnegative().optional(),
  env: z.record(z.string(), z.string()).optional(),
  model: z.string().optional(),
  timeoutMs: z.number().int().positive().optional()
})
export type EngineConfig = z.infer<typeof EngineConfigSchema>

export const ConfigSchema = z.object({
  projectPath: z.string().min(1),
  backlogFile: z.string().min(1),
  goalFile: z.string().optional(),
  dataDir: z.string().min(1),
  engine: z.enum(['mock', 'claude-cli']).optional(), // legacy 欄位：純新形狀（只寫 engines map）可缺；與 engines 全缺由 superRefine 拒
  maxAttempts: z.number().int().positive().default(2),
  dailySoftUsd: z.number().positive().default(40),
  dailyHardUsd: z.number().positive().default(100),
  cooldownMs: z.number().int().nonnegative().default(60_000),
  // M4 Task 3（成本記帳）：本地日界線與失敗成本估計。台灣預設 +8；成本日界線與 digest 報日共用同一個 offset。
  timezoneOffsetHours: z.number().int().min(-12).max(14).default(8),
  failureCostEstimateUsd: z.number().nonnegative().default(1),
  // M4 Task 6（worktree 接線）：worktreesDir 相對 config 檔目錄展開（cli.ts expandConfigPaths
  // 慣例，同 stopFile）；worktree.ts 本身收絕對路徑，展開留在 assemble 層。extraDirective 為
  // 每輪注入 engine prompt 尾端的專案特規文字（可選，未設時 job.directive 為 undefined）。
  worktreesDir: z.string().default('worktrees'),
  extraDirective: z.string().optional(),
  stopFile: z.string().default('.adng.stop'),
  verifyCommand: z.string().optional(),
  verifyTimeoutMs: z.number().int().positive().default(600_000),
  judgeUrl: z.string().optional(),
  judgeModel: z.string().default('gpt-5.4-mini'),
  judgeApiKey: z.string().default('sk-any'),
  // M9.6 verify-and-supplement：對抗式稽核用模型（異於 judgeModel 以獲獨立性），未設＝不啟動此階段。
  auditModel: z.string().optional(),
  supplementLimit: z.number().int().positive().default(2),
  // M9.7 informed problem-finding：surveyCommand 未設＝discovery 不啟動（planner 維持 "round N"）。
  surveyCommand: z.string().optional(),
  surveyTimeoutMs: z.number().int().positive().default(120000),
  discoverLenses: z.array(z.string()).default(['correctness', 'tests', 'perf', 'design', 'security']),
  discordChannelId: z.string().optional(),
  discordTokenFile: z.string().default('C:/Users/Administrator/openab/.env.tokens'),
  // M5 Task 1（引擎矩陣）：engines＝本專案引擎白名單（tag → 引擎設定），defaultEngine＝
  // 無 tag 任務的預設 tag。engines 未設時於下方 transform 依 legacy engine 欄位補
  // { claude: { adapter: <engine> } }——既有 config（如 voice-actress.json 不加 engines 段）
  // 行為完全不變（向後相容硬線）。
  engines: z.record(z.string(), EngineConfigSchema).optional(),
  defaultEngine: z.string().default('claude'),
  // M7：教訓庫檔路徑。learningsFile 未設時 cli.ts assemble 預設 join(dataDir,'learnings.md')
  // （功能零設定開啟）；globalLearningsFile 為跨專案共用教訓檔，未設即不注入全局段。
  learningsFile: z.string().optional(),
  globalLearningsFile: z.string().optional()
})
  .superRefine((c, ctx) => {
    if (!c.engines && !c.engine) ctx.addIssue({ code: 'custom', path: ['engine'], message: 'engines map 與 legacy engine 欄位至少須設一個' })
    for (const [tag, ec] of Object.entries(c.engines ?? {})) {
      if (ec.adapter === 'agy' && ec.env) ctx.addIssue({ code: 'custom', path: ['engines', tag, 'env'], message: `engines.${tag}：agy 不消費 env（WSL 邊界不透傳），設了會靜默無效` })
      if (!['claude-cli', 'mock', 'opencode'].includes(ec.adapter) && ec.costPerRunUsd === undefined)
        ctx.addIssue({ code: 'custom', path: ['engines', tag, 'costPerRunUsd'], message: `engines.${tag}：adapter ${ec.adapter} 無成本真值，必須設 costPerRunUsd（免費引擎明確寫 0）` })
    }
  })
  .transform(c => ({ ...c, engines: c.engines ?? { claude: { adapter: c.engine ?? 'claude-cli' } } }))
  .refine(c => c.defaultEngine in c.engines, { message: 'defaultEngine 必須存在於 engines 白名單內', path: ['defaultEngine'] })
export type Config = z.infer<typeof ConfigSchema>
