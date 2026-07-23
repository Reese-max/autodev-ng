import { existsSync, readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join } from 'node:path'
import type { Config } from '../types.js'
import { runDbSevenDaySummary } from '../engines/run-db-summary.js'
import { summarizeEventsTail } from '../engines/events-tail-summary.js'

export const MAX_SURVEY_LENGTH = 8000
const CONTEXT_HEADER = '# 其他勘查訊號\n'
const SEP = '\n\n'

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

/**
 * 低權重區裝配：surveyCommand base 優先於 summaries。
 * - budget > 0：base 保尾裝入後，剩餘再填 summaries 頭部
 * - budget ≤ 0：仍不得整段移除 base（保尾至總上限），只放棄 summaries
 */
function fitLowWeight(base: string, summaries: string, budget: number): string {
  if (!base && !summaries) return ''
  if (budget <= 0) {
    return base ? (base.length > MAX_SURVEY_LENGTH ? base.slice(-MAX_SURVEY_LENGTH) : base) : ''
  }
  if (!base) return summaries.slice(-budget)
  if (base.length >= budget) return base.slice(-budget)
  if (!summaries) return base
  const summaryBudget = budget - base.length - SEP.length
  return summaryBudget > 0 ? base + SEP + summaries.slice(0, summaryBudget) : base
}

/**
 * 依既定優先序套用字元總上限：
 * 1) 高權重（USER-SIGNALS → NORTHSTAR，順序不可重排）
 * 2) surveyCommand base（截斷時不得整段移除）
 * 3) 其餘低權重 summaries（最先被截斷／丟棄）
 *
 * 所有來源合併後皆不得超過 maxLen。為維持既有 surveyCommand，
 * 超額時仍保留其尾端四分之一窗口，再依優先序收納高權重與其餘摘要。
 */
export function applySurveyPriorityBudget(
  highWeight: string,
  base: string,
  summaries: string,
  maxLen = MAX_SURVEY_LENGTH,
): string {
  if (maxLen <= 0) return ''
  if (!highWeight) return fitLowWeight(base, summaries, maxLen)

  // surveyCommand 是既有相容入口；即使高權重來源過大，也要保留其尾端。
  const reservedContext = base
    ? CONTEXT_HEADER.length + Math.min(base.length, Math.floor(maxLen / 4)) + SEP.length
    : 0
  const high = highWeight.slice(0, Math.max(0, maxLen - reservedContext))
  const hasContext = Boolean(base || summaries)
  const lowBudget = maxLen - high.length - (high && hasContext ? SEP.length : 0) - (hasContext ? CONTEXT_HEADER.length : 0)
  const low = fitLowWeight(base, summaries, lowBudget)
  const contextSection = low ? CONTEXT_HEADER + low : ''
  return [high, contextSection].filter(Boolean).join(SEP)
}

/** 各來源獨立 fail-open，且只以唯讀方式取得資料。 */
export function assembleSurvey(base: string, dataDir: string, opts: SurveyOptions = {}): string {
  const nowIso = opts.nowIso ?? new Date().toISOString()
  const highWeight = [
    markdownSource(dataDir, 'USER-SIGNALS.md', '最高權重證據：USER-SIGNALS.md'),
    markdownSource(dataDir, 'NORTHSTAR.md', '北極星價值判準：NORTHSTAR.md'),
  ].filter(Boolean).join(SEP)
  const summaries = [
    runDbSummary(dataDir, nowIso),
    eventsSummary(dataDir),
  ].filter(Boolean).join(SEP)
  return applySurveyPriorityBudget(highWeight, base, summaries)
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
