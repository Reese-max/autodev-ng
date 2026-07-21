#!/usr/bin/env node
import { writeFileSync } from 'node:fs'
import { isAbsolute, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { stripVTControlCharacters } from 'node:util'
import { runProcess } from '../proc.js'

const COMMAND = 'npx vitest run --reporter=dot'

export interface SpecFailure {
  order: number
  spec: string
  message: string
}

export interface FlakyRun {
  round: number
  startedAt: string
  durationMs: number
  exitCode: number | null
  timedOut: boolean
  failures: SpecFailure[]
  processMessage?: string
}

export interface FailureFrequency {
  spec: string
  failedRounds: number[]
  failureRate: number
  classification: 'intermittent' | 'consistent'
}

export interface FlakyReport {
  command: typeof COMMAND
  startedAt: string
  finishedAt: string
  roundsRequested: number
  roundsCompleted: number
  runs: FlakyRun[]
  frequencies: FailureFrequency[]
  conclusion: string
}

function cleanLines(output: string): string[] {
  return stripVTControlCharacters(output).replaceAll('\r', '').split('\n')
}

export function parseVitestFailures(output: string): SpecFailure[] {
  const lines = cleanLines(output)
  const headers = lines.flatMap((line, index) => /^\s*FAIL\s+(.+?)\s*$/.exec(line)?.[1]
    ? [{ index, spec: /^\s*FAIL\s+(.+?)\s*$/.exec(line)![1]!.trim() }]
    : [])

  return headers.map((header, index) => {
    const end = headers[index + 1]?.index ?? lines.length
    const body = lines.slice(header.index + 1, end)
    const message = body
      .map(line => line.trim())
      .find(line => line && !/^[─⎯-]+$/.test(line) && !line.startsWith('❯'))
      ?? '(無失敗訊息)'
    return { order: index + 1, spec: header.spec, message }
  })
}

export function summarizeFailures(runs: readonly FlakyRun[]): FailureFrequency[] {
  const roundsBySpec = new Map<string, Set<number>>()
  for (const run of runs) {
    for (const failure of run.failures) {
      const rounds = roundsBySpec.get(failure.spec) ?? new Set<number>()
      rounds.add(run.round)
      roundsBySpec.set(failure.spec, rounds)
    }
  }

  return [...roundsBySpec].map(([spec, rounds]) => ({
    spec,
    failedRounds: [...rounds].sort((a, b) => a - b),
    failureRate: rounds.size / runs.length,
    classification: rounds.size < runs.length ? 'intermittent' as const : 'consistent' as const,
  })).sort((a, b) => b.failureRate - a.failureRate || a.spec.localeCompare(b.spec))
}

export function flakyConclusion(frequencies: readonly FailureFrequency[]): string {
  const intermittent = frequencies.filter(item => item.classification === 'intermittent')
  if (intermittent.length === 0) {
    return frequencies.length === 0
      ? '未觀察到失敗或不穩定測試。'
      : `未觀察到間歇失敗；${frequencies.length} 個測試為每輪固定失敗。`
  }
  const lead = intermittent[0]!
  const label = intermittent.length === 1 ? '唯一不穩定測試' : '最高頻不穩定測試'
  return `${label}：${lead.spec}（${lead.failedRounds.length} 輪，失敗率 ${(lead.failureRate * 100).toFixed(1)}%）。`
}

function positiveInteger(argv: readonly string[], flag: string, fallback: number): number {
  const index = argv.indexOf(flag)
  const value = index < 0 ? fallback : Number(argv[index + 1])
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${flag} 必須是正整數`)
  return value
}

function repoOutputPath(cwd: string, argv: readonly string[]): string {
  const index = argv.indexOf('--output')
  const target = resolve(cwd, index < 0 ? 'docs/flaky-runs.json' : argv[index + 1] ?? '')
  const rel = relative(cwd, target)
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) throw new Error('--output 必須是 repo 內的檔案路徑')
  return target
}

function processMessage(output: string): string {
  return cleanLines(output).map(line => line.trim()).filter(Boolean).at(-1) ?? '(無行程錯誤訊息)'
}

export async function flakyTrackerMain(argv: readonly string[], cwd = process.cwd()): Promise<number> {
  const rounds = positiveInteger(argv, '--rounds', 20)
  if (rounds < 20) throw new Error('--rounds 不得少於 20')
  const timeoutMs = positiveInteger(argv, '--timeout-ms', 15 * 60_000)
  const outputPath = repoOutputPath(cwd, argv)
  const startedAt = new Date().toISOString()
  const runs: FlakyRun[] = []

  for (let round = 1; round <= rounds; round++) {
    const roundStartedAt = new Date().toISOString()
    const result = await runProcess({
      command: 'npx',
      args: ['vitest', 'run', '--reporter=dot'],
      cwd,
      stdinText: '',
      timeoutMs,
    })
    const output = `${result.stdout}\n${result.stderr}`
    const failures = parseVitestFailures(output)
    runs.push({
      round,
      startedAt: roundStartedAt,
      durationMs: result.durationMs,
      exitCode: result.exitCode,
      timedOut: result.timedOut,
      failures,
      ...(result.exitCode === 0 || failures.length > 0 ? {} : { processMessage: processMessage(output) }),
    })
    const frequencies = summarizeFailures(runs)
    const report: FlakyReport = {
      command: COMMAND,
      startedAt,
      finishedAt: new Date().toISOString(),
      roundsRequested: rounds,
      roundsCompleted: runs.length,
      runs,
      frequencies,
      conclusion: flakyConclusion(frequencies),
    }
    writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`)
    console.log(`[${round}/${rounds}] exit=${String(result.exitCode)} failures=${failures.length} durationMs=${result.durationMs}`)
  }
  return 0
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  flakyTrackerMain(process.argv.slice(2)).then(
    code => { process.exitCode = code },
    error => {
      console.error(error instanceof Error ? error.message : String(error))
      process.exitCode = 1
    },
  )
}
