import { execFileSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import Database from 'better-sqlite3'
import { localDay, localDayUtcRange } from '../db.js'
import { ConfigSchema } from '../types.js'
import { migrateLegacyPatrolAlerts } from './patrol-alerts.js'

type GitRunner = (cwd: string, args: string[]) => string
const DEFAULT_OUTPUT_ZERO_ALERT_DAYS = 2

export interface OutputDay {
  day: string
  commits: number
  attempts: number
}

export interface OutputZeroAlert {
  fleet: string
  mainRef: string
  days: OutputDay[]
  attempts: number
  unmergedAdngBranches: number
  message: string
}

export interface OutputZeroPatrolOptions {
  alertFile: string
  nowIso?: string
  git?: GitRunner
  notify?: (configPath: string, text: string) => Promise<boolean>
}

function runGit(cwd: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd, encoding: 'utf8', timeout: 10_000, windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function dayBefore(day: string, count: number): string {
  return new Date(Date.parse(`${day}T00:00:00.000Z`) - count * 86_400_000).toISOString().slice(0, 10)
}

/** 前 N 個完整本地日；今日尚未結束，不納入歸零判定。 */
export function completedLocalDays(nowIso: string, timezoneOffsetHours: number, count: number): string[] {
  const today = localDay(nowIso, timezoneOffsetHours)
  return Array.from({ length: count }, (_unused, index) => dayBefore(today, count - index))
}

/** 巡檢專用覆寫，不擴張 scheduler 的設定契約；非法值跳過該艦避免誤報。 */
export function outputZeroAlertDays(rawConfig: unknown): number | null {
  if (typeof rawConfig !== 'object' || rawConfig === null) return null
  const value = (rawConfig as Record<string, unknown>).outputZeroAlertDays
  if (value === undefined) return DEFAULT_OUTPUT_ZERO_ALERT_DAYS
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null
}

/** 純判定：只有整段 zero commit 且同期真的有派工，才是產出歸零。 */
export function outputZeroAlert(input: {
  fleet: string
  mainRef: string
  days: OutputDay[]
  unmergedAdngBranches: number
}): OutputZeroAlert | null {
  const attempts = input.days.reduce((sum, day) => sum + day.attempts, 0)
  if (attempts === 0 || input.days.some(day => day.commits !== 0)) return null
  const range = input.days.length === 1 ? input.days[0]!.day : `${input.days[0]!.day}～${input.days.at(-1)!.day}`
  const message = `⚠ 艦隊產出歸零：${input.fleet} 主分支 ${input.mainRef} 已連續 ${input.days.length} 日新增 commit=0（${range}；同期 attempts=${attempts}）；未合併 adng/* 分支=${input.unmergedAdngBranches}。`
  return { ...input, attempts, message }
}

function tryGit(git: GitRunner, cwd: string, args: string[]): string | null {
  try { return git(cwd, args).trim() } catch { return null }
}

function mainRef(git: GitRunner, projectPath: string): string | null {
  for (const ref of ['main', 'master']) {
    if (tryGit(git, projectPath, ['rev-parse', '--verify', '--quiet', ref]) !== null) return ref
  }
  const remoteHead = tryGit(git, projectPath, ['symbolic-ref', '--quiet', 'refs/remotes/origin/HEAD'])
  if (remoteHead?.startsWith('refs/remotes/')) return remoteHead.slice('refs/remotes/'.length)
  for (const ref of ['origin/main', 'origin/master']) {
    if (tryGit(git, projectPath, ['rev-parse', '--verify', '--quiet', ref]) !== null) return ref
  }
  return null
}

function attemptCounts(dbFile: string, days: string[], timezoneOffsetHours: number): number[] | null {
  if (!existsSync(dbFile)) return null
  let db: Database.Database | undefined
  try {
    db = new Database(dbFile, { readonly: true, fileMustExist: true, timeout: 100 })
    return days.map(day => {
      const { startIso, endIso } = localDayUtcRange(day, timezoneOffsetHours)
      const row = db!.prepare('SELECT COUNT(*) AS n FROM attempts WHERE ts >= ? AND ts < ?').get(startIso, endIso) as { n: number }
      return row.n
    })
  } catch {
    return null
  } finally {
    try { db?.close() } catch { /* 唯讀資料庫關閉失敗不影響巡檢。 */ }
  }
}

function commitCounts(git: GitRunner, projectPath: string, ref: string, days: string[], timezoneOffsetHours: number): number[] | null {
  try {
    const first = localDayUtcRange(days[0]!, timezoneOffsetHours).startIso
    const last = localDayUtcRange(days.at(-1)!, timezoneOffsetHours).endIso
    const timestamps = git(projectPath, ['log', '--first-parent', '--format=%cI', ref, `--since=${first}`, `--before=${last}`])
      .split(/\r?\n/).filter(Boolean)
    const counts = new Map(days.map(day => [day, 0]))
    for (const timestamp of timestamps) {
      const day = localDay(timestamp, timezoneOffsetHours)
      if (counts.has(day)) counts.set(day, counts.get(day)! + 1)
    }
    return days.map(day => counts.get(day)!)
  } catch {
    return null
  }
}

function unmergedAdngBranches(git: GitRunner, projectPath: string, ref: string): number | null {
  const branches = tryGit(git, projectPath, ['branch', '--no-merged', ref, '--format=%(refname:short)', '--list', 'adng/*'])
  return branches === null ? null : branches.split(/\r?\n/).filter(Boolean).length
}

export function appendPatrolAlert(file: string, configPath: string, alert: OutputZeroAlert): boolean {
  const marker = `<!-- adng-output-zero:${encodeURIComponent(configPath)}:${alert.days.at(-1)!.day} -->`
  try {
    migrateLegacyPatrolAlerts(file)
    const existing = existsSync(file) ? readFileSync(file, 'utf8') : ''
    if (existing.includes(marker)) return false
    const header = existing === '' ? '# PATROL-ALERTS\n\n' : ''
    const daily = alert.days.map(day => `${day.day} commit=${day.commits}, attempts=${day.attempts}`).join('；')
    mkdirSync(dirname(file), { recursive: true })
    appendFileSync(file, `${header}${marker}\n- ${alert.message}\n  - 每日統計：${daily}\n`, 'utf8')
    return true
  } catch {
    return false
  }
}

/** 逐艦 fail-open 巡檢；任何壞 config／Git／資料庫都只略過該艦。 */
export async function runOutputZeroPatrol(
  configPaths: readonly string[], options: OutputZeroPatrolOptions,
): Promise<OutputZeroAlert[]> {
  const alerts: OutputZeroAlert[] = []
  const git = options.git ?? runGit
  const nowIso = options.nowIso ?? new Date().toISOString()
  migrateLegacyPatrolAlerts(options.alertFile)
  for (const configPath of configPaths) {
    try {
      const absoluteConfigPath = resolve(configPath)
      const rawConfig: unknown = JSON.parse(readFileSync(absoluteConfigPath, 'utf8'))
      const config = ConfigSchema.parse(rawConfig)
      const streakDays = outputZeroAlertDays(rawConfig)
      if (!streakDays) continue
      const baseDir = dirname(absoluteConfigPath)
      const projectPath = resolve(baseDir, config.projectPath)
      const days = completedLocalDays(nowIso, config.timezoneOffsetHours, streakDays)
      const ref = mainRef(git, projectPath)
      if (!ref) continue
      const attempts = attemptCounts(join(resolve(baseDir, config.dataDir), 'run.db'), days, config.timezoneOffsetHours)
      const commits = commitCounts(git, projectPath, ref, days, config.timezoneOffsetHours)
      const unmerged = unmergedAdngBranches(git, projectPath, ref)
      if (!attempts || !commits || unmerged === null) continue
      const alert = outputZeroAlert({
        fleet: configPath.split(/[\\/]/).at(-1)!.replace(/\.json$/, ''), mainRef: ref,
        days: days.map((day, index) => ({ day, attempts: attempts[index]!, commits: commits[index]! })),
        unmergedAdngBranches: unmerged,
      })
      if (!alert || !appendPatrolAlert(options.alertFile, absoluteConfigPath, alert)) continue
      alerts.push(alert)
      try { await options.notify?.(absoluteConfigPath, alert.message) } catch { /* notifier/DLQ 自行處理。 */ }
    } catch {
      // 單艦輸入異常不可讓 fleet patrol 中斷。
    }
  }
  return alerts
}
