import { existsSync, readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join } from 'node:path'
import type { Config } from '../types.js'
import { runDbSevenDaySummary } from '../engines/run-db-summary.js'
import { summarizeEventsTail } from '../engines/events-tail-summary.js'

const MAX_SURVEY_LENGTH = 8000

interface SurveyOptions { nowIso?: string }

function runDbSummary(dataDir: string, nowIso: string): string {
  const engines = runDbSevenDaySummary(join(dataDir, 'run.db'), nowIso)
  if (engines.length === 0) return ''
  return ['# run.db 近 7 日', ...engines.map(row => {
    const failure = row.topFailure
      ? `｜最常見失敗 ${row.topFailure.count} 次：${row.topFailure.detail.replace(/\s+/g, ' ').slice(0, 240)}`
      : ''
    return `- ${row.engine}: attempts ${row.attempts}｜成功率 ${Math.round(row.successRate * 100)}%${failure}`
  })].join('\n')
}

function eventsSummary(dataDir: string): string {
  const frequent = summarizeEventsTail(dataDir)
  if (frequent.length === 0) return ''
  return ['# events.jsonl 尾部高頻事件', ...frequent.map(({ type, count, latest }) =>
    `- ${type}: ${count} 次｜最近樣本 ${JSON.stringify(latest)}`
  )].join('\n')
}

function markdownSource(dataDir: string, name: string, heading = name): string {
  try {
    const content = readFileSync(join(dataDir, name), 'utf8')
    return content ? `# ${heading}\n${content}` : ''
  } catch { return '' }
}

function fitContext(base: string, summaries: string, budget: number): string {
  if (budget <= 0) return ''
  if (!base) return summaries.slice(-budget)
  if (base.length >= budget) return base.slice(-budget)
  if (!summaries) return base
  const separator = '\n\n'
  const summaryBudget = budget - base.length - separator.length
  return summaryBudget > 0 ? base + separator + summaries.slice(0, summaryBudget) : base
}

/** 各來源獨立 fail-open，且只以唯讀方式取得資料。 */
export function assembleSurvey(base: string, dataDir: string, opts: SurveyOptions = {}): string {
  const nowIso = opts.nowIso ?? new Date().toISOString()
  const highWeight = [
    markdownSource(dataDir, 'USER-SIGNALS.md', '最高權重證據：USER-SIGNALS.md'),
    markdownSource(dataDir, 'NORTHSTAR.md', '北極星價值判準：NORTHSTAR.md'),
  ].filter(Boolean).join('\n\n')
  const summaries = [
    runDbSummary(dataDir, nowIso),
    eventsSummary(dataDir),
  ].filter(Boolean).join('\n\n')
  if (!highWeight) return fitContext(base, summaries, MAX_SURVEY_LENGTH)
  const contextHeader = '# 其他勘查訊號\n'
  const contextBudget = MAX_SURVEY_LENGTH - highWeight.length - 2 - contextHeader.length
  const context = fitContext(base, summaries, contextBudget)
  const contextSection = context ? contextHeader + context : ''
  return [highWeight, contextSection].filter(Boolean).join('\n\n')
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
