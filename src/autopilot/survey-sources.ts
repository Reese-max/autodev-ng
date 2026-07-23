import { existsSync, readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import type { Config } from '../types.js'

const MAX_SURVEY_LENGTH = 8000
const EVENT_TAIL_LINES = 200

interface SurveyOptions { nowIso?: string }

function runDbSummary(dataDir: string, nowIso: string): string {
  let db: Database.Database | undefined
  try {
    db = new Database(join(dataDir, 'run.db'), { readonly: true, fileMustExist: true, timeout: 50 })
    const sinceIso = new Date(Date.parse(nowIso) - 7 * 24 * 3600_000).toISOString()
    const engines = db.prepare(
      "SELECT COALESCE(NULLIF(engine,''),'(未標)') engine, COUNT(*) n, COALESCE(SUM(ok),0) ok FROM attempts WHERE ts >= ? AND ts <= ? GROUP BY 1 ORDER BY n DESC, engine ASC"
    ).all(sinceIso, nowIso) as { engine: string; n: number; ok: number }[]
    const failures = db.prepare(
      "SELECT detail, COUNT(*) n FROM attempts WHERE ts >= ? AND ts <= ? AND ok=0 AND trim(detail) != '' GROUP BY detail ORDER BY n DESC, detail ASC LIMIT 5"
    ).all(sinceIso, nowIso) as { detail: string; n: number }[]
    if (engines.length === 0 && failures.length === 0) return ''
    const lines = ['# run.db 近 7 日']
    for (const row of engines) lines.push(`- ${row.engine}: attempts ${row.n}｜成功率 ${Math.round(row.ok / row.n * 100)}%`)
    if (failures.length) {
      lines.push('常見失敗 detail 模式：')
      for (const row of failures) lines.push(`- ${row.n} 次｜${row.detail.replace(/\s+/g, ' ').slice(0, 240)}`)
    }
    return lines.join('\n')
  } catch {
    return ''
  } finally {
    try { db?.close() } catch { /* fail-open */ }
  }
}

function eventsSummary(dataDir: string): string {
  try {
    const events = readFileSync(join(dataDir, 'events.jsonl'), 'utf8').split(/\r?\n/).filter(Boolean).slice(-EVENT_TAIL_LINES)
      .flatMap(line => {
        try {
          const event = JSON.parse(line) as Record<string, unknown>
          return typeof event.type === 'string' ? [event] : []
        } catch { return [] }
      })
    if (events.length === 0) return ''
    const counts = new Map<string, number>(), latest = new Map<string, Record<string, unknown>>()
    for (const event of events) {
      const type = event.type as string
      counts.set(type, (counts.get(type) ?? 0) + 1)
      latest.set(type, event)
    }
    const frequent = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8)
    return ['# events.jsonl 尾部高頻事件', ...frequent.map(([type, n]) =>
      `- ${type}: ${n} 次｜最近樣本 ${JSON.stringify(latest.get(type))}`
    )].join('\n')
  } catch {
    return ''
  }
}

function markdownSource(dataDir: string, name: string, heading = name): string {
  try {
    const content = readFileSync(join(dataDir, name), 'utf8')
    return content ? `# ${heading}\n${content}` : ''
  } catch { return '' }
}

/** 各來源獨立 fail-open，且只以唯讀方式取得資料。 */
export function assembleSurvey(base: string, dataDir: string, opts: SurveyOptions = {}): string {
  const nowIso = opts.nowIso ?? new Date().toISOString()
  const highWeight = [
    markdownSource(dataDir, 'USER-SIGNALS.md', '最高權重證據：USER-SIGNALS.md'),
    markdownSource(dataDir, 'NORTHSTAR.md', '北極星價值判準：NORTHSTAR.md'),
  ].filter(Boolean).join('\n\n')
  const context = [
    base,
    runDbSummary(dataDir, nowIso),
    eventsSummary(dataDir),
  ].filter(Boolean).join('\n\n')
  if (!highWeight) return context.slice(-MAX_SURVEY_LENGTH)
  const contextHeader = '# 其他勘查訊號\n'
  const contextBudget = MAX_SURVEY_LENGTH - highWeight.length - 2 - contextHeader.length
  const contextSection = contextBudget > 0 && context ? contextHeader + context.slice(-contextBudget) : ''
  return [highWeight, contextSection].filter(Boolean).join('\n\n').slice(0, MAX_SURVEY_LENGTH)
}

export function hasSurveySources(dataDir: string): boolean {
  return ['run.db', 'events.jsonl', 'USER-SIGNALS.md', 'NORTHSTAR.md'].some(name => existsSync(join(dataDir, name)))
}

/** 保留既有 surveyCommand 的 stdout/失敗 stdout，再附加多源摘要。 */
export function collectSurvey(cfg: Pick<Config, 'surveyCommand' | 'surveyTimeoutMs' | 'dataDir'>, cwd: string): string {
  let base = ''
  if (cfg.surveyCommand) {
    try {
      base = execSync(cfg.surveyCommand, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: cfg.surveyTimeoutMs, windowsHide: true })
    } catch (error) {
      base = (error as { stdout?: string }).stdout ?? ''
    }
  }
  return assembleSurvey(base, cfg.dataDir)
}
