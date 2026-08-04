import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { RunDb } from '../src/db.js'
import { buildDigest } from '../src/digest.js'
import {
  goldSetPath,
  loadReviewCalibrationSamples,
  renderReviewCalibrationReport,
  reviewCalibrationDigestLines,
  runReviewCalibration,
  writeReviewCalibrationReport,
} from '../src/engines/review-calibration.js'

function freshDir(): string {
  return mkdtempSync(join(process.cwd(), '.tmp-adng-review-calibration-'))
}

test('核定金標集有 24 筆，且含歷史通過、歷史拒收與邊界人工標注', () => {
  const samples = loadReviewCalibrationSamples(goldSetPath())
  expect(samples).toHaveLength(24)
  expect(samples.filter(sample => sample.source === 'historical-pass')).toHaveLength(8)
  expect(samples.filter(sample => sample.source === 'historical-reject')).toHaveLength(8)
  expect(samples.filter(sample => sample.source === 'boundary')).toHaveLength(8)
  expect(samples.filter(sample => sample.expected === 'pass')).toHaveLength(12)
  expect(samples.filter(sample => sample.expected === 'reject')).toHaveLength(12)
})

test('校準報告固定輸出機器可讀摘要與誤殺／漏放格式', async () => {
  const samples = loadReviewCalibrationSamples()
  const result = await runReviewCalibration(samples, async sample => {
    if (sample.id === 'HP-01') return { kind: 'reject', reason: '誤殺 fixture' }
    if (sample.id === 'HR-01') return { kind: 'skip', alert: '漏放 fixture' }
    return sample.expected === 'pass' ? { kind: 'pass' } : { kind: 'reject', reason: 'fixture' }
  }, { week: '2026-W32', model: 'fixture-review' })
  const report = renderReviewCalibrationReport(result)
  expect(report).toContain('review_calibration=v1')
  expect(report).toContain('week=2026-W32')
  expect(report).toContain('false_kills=1')
  expect(report).toContain('false_releases=1')
  expect(report).toContain('false_kill_rate=0.083333')
  expect(report).toContain('false_release_rate=0.083333')
  expect(report).toContain('| 誤殺率（預期通過卻拒收） | 1/12（8.3%） |')
  expect(report).toContain('| 漏放率（預期拒收卻放行／skip） | 1/12（8.3%） |')

  const outputDir = freshDir()
  try {
    const file = writeReviewCalibrationReport(result, outputDir)
    expect(readFileSync(file, 'utf8')).toBe(report)
  } finally {
    rmSync(outputDir, { recursive: true, force: true })
  }
})

test('連兩個相鄰週次越過門檻才產生 digest 換模型告警', async () => {
  const samples = loadReviewCalibrationSamples()
  const allWrong = async (sample: (typeof samples)[number]) =>
    sample.expected === 'pass' ? { kind: 'reject' as const, reason: 'fixture' } : { kind: 'skip' as const, alert: 'fixture' }
  const outputDir = freshDir()
  try {
    for (const week of ['2026-W31', '2026-W32']) {
      writeReviewCalibrationReport(await runReviewCalibration(samples, allWrong, { week, model: 'fixture-review' }), outputDir)
    }
    expect(reviewCalibrationDigestLines(outputDir)).toEqual([
      '⚠ 審查校準告警：2026-W31、2026-W32 連兩週誤殺率 >20%、漏放率 >30%；建議更換 reviewEngine／審查模型後重跑金標集。',
    ])
  } finally {
    rmSync(outputDir, { recursive: true, force: true })
  }
})

test('每日 digest 併入連兩週校準告警', async () => {
  const samples = loadReviewCalibrationSamples()
  const allWrong = async (sample: (typeof samples)[number]) =>
    sample.expected === 'pass' ? { kind: 'reject' as const, reason: 'fixture' } : { kind: 'skip' as const, alert: 'fixture' }
  const root = freshDir()
  const reports = join(root, 'reports')
  const db = new RunDb(join(root, 'run.db'))
  try {
    for (const week of ['2026-W31', '2026-W32']) {
      writeReviewCalibrationReport(await runReviewCalibration(samples, allWrong, { week, model: 'fixture-review' }), reports)
    }
    expect(buildDigest({ db, dataDir: root, isoDayUtc: '2026-08-04', reviewCalibrationDir: reports })).toContain('建議更換 reviewEngine／審查模型')
  } finally {
    db.close()
    rmSync(root, { recursive: true, force: true })
  }
})
