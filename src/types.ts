import { z } from 'zod'

export interface Task {
  id: string
  text: string
  line: number
  status: 'open' | 'done' | 'blocked'
}

export type Disposition =
  | { kind: 'done'; commitHash: string }
  | { kind: 'blocked'; reason: string }

export interface Job {
  task: Task
  projectPath: string
  /** M4 Task 6（worktree 接線）：cfg.extraDirective 附加在任務文字尾的專案特規指示
   * （如 voice-actress 的 KPI-impact 標籤要求）。未設定 extraDirective 時維持 undefined，
   * engine 端沒有義務讀它——現階段僅 scheduler 組裝並傳遞，供未來引擎接線消費。 */
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

export const ConfigSchema = z.object({
  projectPath: z.string().min(1),
  backlogFile: z.string().min(1),
  dataDir: z.string().min(1),
  engine: z.enum(['mock', 'claude-cli']),
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
  discordChannelId: z.string().optional(),
  discordTokenFile: z.string().default('C:/Users/Administrator/openab/.env.tokens')
})
export type Config = z.infer<typeof ConfigSchema>
