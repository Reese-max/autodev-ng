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

export interface Job { task: Task; projectPath: string }

export interface RunResult {
  ok: boolean
  output: string
  costUsd: number
  commitHash?: string
  failureReason?: string
  baseCommitHash?: string
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
