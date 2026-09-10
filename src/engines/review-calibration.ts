import { llmFromConfig } from '../autopilot/llm.js'
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ConfigSchema, type Config } from '../types.js'
import { parseReviewVerdict, reviewDiff, type ReviewOutcome } from './review-gate.js'

export type ExpectedReviewVerdict = 'pass' | 'reject'
export type ReviewCalibrationSource = 'historical-pass' | 'historical-reject' | 'boundary'

export interface ReviewCalibrationSample {
  id: string
  source: ReviewCalibrationSource
  taskText: string
  diff: string
  expected: ExpectedReviewVerdict
  rationale: string
}

export interface ReviewCalibrationCase extends ReviewCalibrationSample {
  actual: ReviewOutcome['kind']
}

export interface ReviewCalibrationResult {
  week: string
  model: string
  mode: 'live'
  cases: ReviewCalibrationCase[]
  expectedPass: number
  expectedReject: number
  falseKills: number
  falseReleases: number
  skips: number
}

export interface CalibrationReportSummary {
  week: string
  falseKillRate: number
  falseReleaseRate: number
}

const DAY_MS = 24 * 60 * 60 * 1000

export function reviewCalibrationDir(): string {
  return join(resolve(dirname(fileURLToPath(import.meta.url)), '..', '..'), 'docs', 'review-calibration')
}

export function goldSetPath(): string {
  return join(reviewCalibrationDir(), 'golden-set.json')
}

function asSample(value: unknown): ReviewCalibrationSample {
  if (typeof value !== 'object' || value === null) throw new Error('金標樣本必須是物件')
  const o = value as Record<string, unknown>
  const string = (key: string): string => {
    if (typeof o[key] !== 'string' || !o[key].trim()) throw new Error(`金標樣本缺 ${key}`)
    return o[key]
  }
  const source = string('source')
  const expected = string('expected')
  if (!['historical-pass', 'historical-reject', 'boundary'].includes(source)) throw new Error(`未知金標來源：${source}`)
  if (expected !== 'pass' && expected !== 'reject') throw new Error(`未知人工判定：${expected}`)
  return { id: string('id'), source: source as ReviewCalibrationSource, taskText: string('taskText'), diff: string('diff'), expected, rationale: string('rationale') }
}

/** 核定金標集是人工標注的唯一真值；模型輸出只拿來與它比對。 */
export function loadReviewCalibrationSamples(file = goldSetPath()): ReviewCalibrationSample[] {
  const raw: unknown = JSON.parse(readFileSync(file, 'utf8'))
  if (typeof raw !== 'object' || raw === null || !Array.isArray((raw as Record<string, unknown>).samples)) {
    throw new Error('金標集必須含 samples 陣列')
  }
  const samples = (raw as { samples: unknown[] }).samples.map(asSample)
  if (samples.length < 20 || samples.length > 30) throw new Error(`金標樣本須為 20-30 筆，實得 ${samples.length}`)
  if (new Set(samples.map(sample => sample.id)).size !== samples.length) throw new Error('金標樣本 id 不可重複')
  return samples
}

export function isoWeek(date = new Date()): string {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = utc.getUTCDay() || 7
  utc.setUTCDate(utc.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7)
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export async function runReviewCalibration(
  samples: readonly ReviewCalibrationSample[],
  review: (sample: ReviewCalibrationSample) => Promise<ReviewOutcome>,
  opts: { week?: string; model: string; mode?: 'live' } = { model: 'unknown' },
): Promise<ReviewCalibrationResult> {
  const cases: ReviewCalibrationCase[] = []
  for (const sample of samples) {
    let outcome: ReviewOutcome
    try {
      outcome = await review(sample)
    } catch (err) {
      outcome = { kind: 'skip', alert: `review-calibration-skip: ${String(err).slice(0, 160)}` }
    }
    cases.push({ ...sample, actual: outcome.kind })
  }
  const expectedPass = cases.filter(item => item.expected === 'pass').length
  const expectedReject = cases.length - expectedPass
  const falseKills = cases.filter(item => item.expected === 'pass' && item.actual === 'reject').length
  // review gate 的 skip 是 fail-open；對應應拒收樣本時等同漏放，不能從分母移除。
  const falseReleases = cases.filter(item => item.expected === 'reject' && item.actual !== 'reject').length
  return { week: opts.week ?? isoWeek(), model: opts.model, mode: opts.mode ?? 'live', cases, expectedPass, expectedReject, falseKills, falseReleases, skips: cases.filter(item => item.actual === 'skip').length }
}

function rate(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator
}

function percent(numerator: number, denominator: number): string {
  return `${(rate(numerator, denominator) * 100).toFixed(1)}%`
}

/** 固定的 ini 摘要讓 digest 可安全讀取已落盤的週報，不依賴自由文字。 */
export function renderReviewCalibrationReport(result: ReviewCalibrationResult): string {
  const lines = [
    '# 審查者金標校準報告',
    '',
    `- 週次：${result.week}`,
    `- 審查模型：${result.model}`,
    `- 執行模式：${result.mode}`,
    `- 金標來源：2026-08-04 使用者核定 #3（人工標注為真值）`,
    '',
    '## 機器可讀摘要',
    '',
    '```ini',
    'review_calibration=v1',
    `mode=${result.mode}`,
    `week=${result.week}`,
    `model=${result.model}`,
    `samples=${result.cases.length}`,
    `expected_pass=${result.expectedPass}`,
    `expected_reject=${result.expectedReject}`,
    `false_kills=${result.falseKills}`,
    `false_releases=${result.falseReleases}`,
    `false_kill_rate=${rate(result.falseKills, result.expectedPass).toFixed(6)}`,
    `false_release_rate=${rate(result.falseReleases, result.expectedReject).toFixed(6)}`,
    `skips=${result.skips}`,
    '```',
    '',
    '## 指標',
    '',
    '| 指標 | 結果 |',
    '| --- | ---: |',
    `| 金標樣本 | ${result.cases.length} |`,
    `| 誤殺率（預期通過卻拒收） | ${result.falseKills}/${result.expectedPass}（${percent(result.falseKills, result.expectedPass)}） |`,
    `| 漏放率（預期拒收卻放行／skip） | ${result.falseReleases}/${result.expectedReject}（${percent(result.falseReleases, result.expectedReject)}） |`,
    `| 無法判定（skip） | ${result.skips} |`,
    '',
    '## 樣本結果',
    '',
    '| ID | 來源 | 人工標注 | 審查結果 |',
    '| --- | --- | --- | --- |',
    ...result.cases.map(item => `| ${item.id} | ${item.source} | ${item.expected} | ${item.actual} |`),
    '',
  ]
  return lines.join('\n')
}

export function writeReviewCalibrationReport(result: ReviewCalibrationResult, outputDir = reviewCalibrationDir()): string {
  mkdirSync(outputDir, { recursive: true })
  const file = join(outputDir, `${result.week}.md`)
  const tmp = `${file}.tmp`
  writeFileSync(tmp, renderReviewCalibrationReport(result))
  renameSync(tmp, file)
  return file
}

function weekStart(week: string): number | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(week)
  if (!match) return null
  const jan4 = new Date(Date.UTC(Number(match[1]), 0, 4))
  const monday = new Date(jan4)
  monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (Number(match[2]) - 1) * 7)
  return monday.getTime()
}

function parseReport(raw: string): CalibrationReportSummary | null {
  const block = /```ini\r?\n([\s\S]*?)\r?\n```/.exec(raw)?.[1]
  if (!block) return null
  const fields = new Map(block.split(/\r?\n/).map(line => {
    const [key, ...rest] = line.split('=')
    return [key, rest.join('=')]
  }))
  if (fields.get('review_calibration') !== 'v1' || fields.get('mode') !== 'live') return null
  const week = fields.get('week') ?? ''
  const falseKills = Number(fields.get('false_kills'))
  const expectedPass = Number(fields.get('expected_pass'))
  const falseReleases = Number(fields.get('false_releases'))
  const expectedReject = Number(fields.get('expected_reject'))
  if (weekStart(week) === null || ![falseKills, expectedPass, falseReleases, expectedReject].every(Number.isInteger) || falseKills < 0 || falseReleases < 0 || expectedPass <= 0 || expectedReject <= 0) return null
  return { week, falseKillRate: rate(falseKills, expectedPass), falseReleaseRate: rate(falseReleases, expectedReject) }
}

/** 最近兩份必須是相鄰 ISO 週，才可用於「連兩週」告警。 */
export function reviewCalibrationDigestLines(outputDir = reviewCalibrationDir()): string[] {
  try {
    if (!existsSync(outputDir)) return []
    const reports = readdirSync(outputDir)
      .filter(name => /^\d{4}-W\d{2}\.md$/.test(name))
      .map(name => parseReport(readFileSync(join(outputDir, name), 'utf8')))
      .filter((summary): summary is CalibrationReportSummary => summary !== null)
      .sort((a, b) => (weekStart(b.week) ?? 0) - (weekStart(a.week) ?? 0))
    const [current, previous] = reports
    if (!current || !previous || (weekStart(current.week)! - weekStart(previous.week)!) !== 7 * DAY_MS) return []
    const warnings: string[] = []
    if (current.falseKillRate > 0.2 && previous.falseKillRate > 0.2) warnings.push('誤殺率 >20%')
    if (current.falseReleaseRate > 0.3 && previous.falseReleaseRate > 0.3) warnings.push('漏放率 >30%')
    return warnings.length ? [`⚠ 審查校準告警：${previous.week}、${current.week} 連兩週${warnings.join('、')}；建議更換 reviewEngine／審查模型後重跑金標集。`] : []
  } catch {
    return []
  }
}

/** 每週只在該週報不存在時重放一次；無 judge URL 時安全略過，不建立假報告。 */
export async function maybeRunWeeklyReviewCalibration(opts: { cfg: Config; now?: Date; outputDir?: string }): Promise<'already-run' | 'not-configured' | 'written'> {
  const week = isoWeek(opts.now)
  const outputDir = opts.outputDir ?? reviewCalibrationDir()
  if (existsSync(join(outputDir, `${week}.md`))) return 'already-run'
  const url = opts.cfg.reviewUrl ?? opts.cfg.judgeUrl
  if (!url && !['cli', 'devin-cli'].includes(opts.cfg.llmTransport)) return 'not-configured'
  const model = opts.cfg.reviewEngine ?? opts.cfg.judgeModel
  const result = await runReviewCalibration(loadReviewCalibrationSamples(), async sample =>
    parseReviewVerdict(await reviewDiff(llmFromConfig(opts.cfg, model, url), sample.diff, sample.taskText)),
  { week, model })
  writeReviewCalibrationReport(result, outputDir)
  return 'written'
}

async function main(): Promise<void> {
  const configIndex = process.argv.indexOf('--config')
  const configPath = configIndex >= 0 ? process.argv[configIndex + 1] : undefined
  if (!configPath) throw new Error('用法：node dist/engines/review-calibration.js --config <repo 內設定檔>')
  const cfg = ConfigSchema.parse(JSON.parse(readFileSync(resolve(configPath), 'utf8')))
  const status = await maybeRunWeeklyReviewCalibration({ cfg })
  console.log(`review calibration：${status}${status === 'written' ? `（${join(reviewCalibrationDir(), `${isoWeek()}.md`)}）` : ''}`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void main().catch(err => { console.error(err instanceof Error ? err.message : String(err)); process.exitCode = 1 })
}
