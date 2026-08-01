import { existsSync, readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join } from 'node:path'
import type { Config } from '../types.js'
import { runDbSevenDaySummary } from '../engines/run-db-summary.js'
import { summarizeEventsTail } from '../engines/events-tail-summary.js'

export const MAX_SURVEY_LENGTH = 8000
export const SURVEY_OUTPUT_TRUNCATED_EVENT = 'survey-output-truncated'
const SURVEY_TRUNCATION_MARKER_PREFIX = '…（survey stdout 已截斷'
/** 組合訊號最高權重標頭（USER-SIGNALS 置頂標記）。 */
export const USER_SIGNALS_HEADING = '最高權重證據：USER-SIGNALS.md'
/** 組合訊號次高權重標頭（NORTHSTAR 緊接 USER-SIGNALS）。 */
export const NORTHSTAR_HEADING = '北極星價值判準：NORTHSTAR.md'
const CONTEXT_HEADER = '# 其他勘查訊號\n'
const SEP = '\n\n'

interface SurveyOptions { nowIso?: string }

export type SurveyEventSink = (type: string, data: Record<string, unknown>) => void

export interface SurveyOutput {
  text: string
  truncated: boolean
  originalLength: number
  omittedLines: number
}

/** Prompt 邊界的 survey 防線：超長時只保留尾端，並把截斷原因留在輸出開頭。 */
export function truncateSurveyOutput(output: string, maxLen = MAX_SURVEY_LENGTH): SurveyOutput {
  const limit = Math.max(0, Math.floor(maxLen))
  if (output.length <= limit) return { text: output, truncated: false, originalLength: output.length, omittedLines: 0 }
  if (limit === 0) return { text: '', truncated: true, originalLength: output.length, omittedLines: 1 }

  const fallbackMarker = '…（截斷）\n'
  let tailLength = Math.max(0, limit - fallbackMarker.length)
  let omittedLines = countOmittedLines(output, tailLength)
  let marker = `…（survey stdout 已截斷，前段省略 ${omittedLines} 行）\n`
  if (marker.length > limit) marker = fallbackMarker.slice(0, limit)
  tailLength = Math.max(0, limit - marker.length)
  omittedLines = countOmittedLines(output, tailLength)
  marker = `…（survey stdout 已截斷，前段省略 ${omittedLines} 行）\n`
  if (marker.length > limit) marker = fallbackMarker.slice(0, limit)
  const text = marker + output.slice(-Math.max(0, limit - marker.length))
  return { text, truncated: true, originalLength: output.length, omittedLines }
}

function countOmittedLines(output: string, tailLength: number): number {
  const prefix = output.slice(0, Math.max(0, output.length - tailLength))
  if (!prefix) return 0
  return prefix.split(/\r?\n/).length - (prefix.endsWith('\n') ? 1 : 0)
}

export function emitSurveyTruncation(result: SurveyOutput, onEvent?: SurveyEventSink): void {
  if (!result.truncated || !onEvent) return
  try {
    onEvent(SURVEY_OUTPUT_TRUNCATED_EVENT, {
      originalLength: result.originalLength,
      retainedLength: result.text.length,
      omittedLines: result.omittedLines,
      maxLength: MAX_SURVEY_LENGTH,
    })
  } catch {
    // 觀測面故障不可反殺 discovery。
  }
}

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

/** 讀取 dataDir 下 markdown 全文；缺檔/讀失敗 → 空字串（fail-open）。 */
function readMarkdownBody(dataDir: string, name: string): string {
  try {
    return readFileSync(join(dataDir, name), 'utf8')
  } catch { return '' }
}

/**
 * 低權重區裝配：surveyCommand base 優先於 summaries。
 * - budget > 0：base 保尾裝入後，剩餘再填 summaries 頭部
 * - budget ≤ 0：低權重整段放棄（高權重已佔滿；不得因此溢出身分上限）
 */
function fitLowWeight(base: string, summaries: string, budget: number): string {
  if (!base && !summaries) return ''
  if (budget <= 0) return ''
  if (!base) return summaries.slice(-budget)
  if (base.length >= budget) return tailPreservingSurveyMarker(base, budget)
  if (!summaries) return base
  const summaryBudget = budget - base.length - SEP.length
  return summaryBudget > 0 ? base + SEP + summaries.slice(0, summaryBudget) : base
}

function tailPreservingSurveyMarker(text: string, budget: number): string {
  const markerEnd = text.startsWith(SURVEY_TRUNCATION_MARKER_PREFIX) ? text.indexOf('\n') : -1
  if (markerEnd >= 0 && markerEnd + 1 <= budget) {
    const tailBudget = budget - markerEnd - 1
    return text.slice(0, markerEnd + 1) + (tailBudget > 0 ? text.slice(-tailBudget) : '')
  }
  return text.slice(-budget)
}

/**
 * 組裝高權重區：USER-SIGNALS 全文置頂並標最高權重，NORTHSTAR 全文緊接其後。
 * 順序為硬約束，呼叫端不得重排。
 */
export function packHighWeightSources(userSignals: string, northstar: string): string {
  return [
    userSignals ? `# ${USER_SIGNALS_HEADING}\n${userSignals}` : '',
    northstar ? `# ${NORTHSTAR_HEADING}\n${northstar}` : '',
  ].filter(Boolean).join(SEP)
}

/**
 * 依既定優先序套用字元總上限：
 * 1) 高權重全文（USER-SIGNALS → NORTHSTAR，順序不可重排；可塞入時絕不為低權重截斷）
 * 2) surveyCommand base（截斷時不得整段移除；僅在高權重已超上限時才預留尾端窗口）
 * 3) 其餘低權重 summaries（最先被截斷／丟棄）
 *
 * 所有來源合併後皆不得超過 maxLen。
 */
export function applySurveyPriorityBudget(
  highWeight: string,
  base: string,
  summaries: string,
  maxLen = MAX_SURVEY_LENGTH,
): string {
  if (maxLen <= 0) return ''
  if (!highWeight) return fitLowWeight(base, summaries, maxLen)

  // 高權重可完整塞入 maxLen → 全文保留；僅在高權重本身已超上限時，
  // 才為 surveyCommand 預留尾端窗口（向後相容，避免整段移除 base）。
  let high: string
  if (highWeight.length <= maxLen) {
    high = highWeight
  } else if (base) {
    const reservedContext = CONTEXT_HEADER.length + Math.min(base.length, Math.floor(maxLen / 4)) + SEP.length
    high = highWeight.slice(0, Math.max(0, maxLen - reservedContext))
  } else {
    high = highWeight.slice(0, maxLen)
  }

  const hasContext = Boolean(base || summaries)
  if (!hasContext) return high.slice(0, maxLen)

  const framing = (high ? SEP.length : 0) + CONTEXT_HEADER.length
  const lowBudget = maxLen - high.length - framing
  if (lowBudget <= 0) return high.slice(0, maxLen)

  const low = fitLowWeight(base, summaries, lowBudget)
  if (!low) return high
  const out = high + SEP + CONTEXT_HEADER + low
  return out.length > maxLen ? out.slice(0, maxLen) : out
}

/** 各來源獨立 fail-open，且只以唯讀方式取得資料。 */
export function assembleSurvey(base: string, dataDir: string, opts: SurveyOptions = {}): string {
  const nowIso = opts.nowIso ?? new Date().toISOString()
  const highWeight = packHighWeightSources(
    readMarkdownBody(dataDir, 'USER-SIGNALS.md'),
    readMarkdownBody(dataDir, 'NORTHSTAR.md'),
  )
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
export function collectSurvey(
  cfg: Pick<Config, 'surveyCommand' | 'surveyTimeoutMs' | 'dataDir'>,
  cwd: string,
  onEvent?: SurveyEventSink,
): string {
  let base = ''
  if (cfg.surveyCommand) {
    try {
      base = execSync(cfg.surveyCommand, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: cfg.surveyTimeoutMs, windowsHide: true })
    } catch (error) {
      base = (error as { stdout?: string }).stdout ?? ''
    }
  }
  const bounded = truncateSurveyOutput(base)
  emitSurveyTruncation(bounded, onEvent)
  return assembleSurvey(bounded.text, cfg.dataDir)
}
