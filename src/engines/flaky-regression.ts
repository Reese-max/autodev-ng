#!/usr/bin/env node
/**
 * 修復後候選 flaky spec 的雙輪回歸守門。
 *
 * 連續執行兩輪 `npx vitest run --reporter=dot`，任一轮失敗即非 0；
 * 失敗時輸出最小診斷：spec 名稱、輪次、關鍵 fixture 狀態（隔離契約＋失敗訊號）。
 */
import { pathToFileURL } from 'node:url'
import { stripVTControlCharacters } from 'node:util'
import { runProcess, type ProcResult } from './proc.js'
import { parseVitestFailures } from './flaky-tracker.js'
import {
  DEFAULT_FIXED_CLOCK_ISO,
  FIXTURE_IO_TIMEOUT_MS,
} from './test-isolation.js'

const ROUNDS = 2
const TIMEOUT_MS = 15 * 60_000

/**
 * 已修復、需雙輪回歸鎖住的候選 specs（來源：flaky-analysis / flaky-bisection）。
 * 任一轮失敗時優先報告這些名稱。
 */
export const FIXED_CANDIDATE_SPECS = [
  'tests/restart-routing-consistency.test.ts > 狀態重建入口守門 > 只讀檢查：第二次重建不重初始化快取與事件計數，試探/常駐候選不重置',
  'tests/restart-routing-consistency.test.ts > 重啟後一致性：隔離 / 候補晉升 / 試探時點 / 事件 > 重啟前首次隔離有事件；重啟後同條件只延續、untilTs 不變、事件不重複',
  'tests/restart-routing-consistency.test.ts > 重啟後一致性：隔離 / 候補晉升 / 試探時點 / 事件 > 寫入隔離+晉升 → 重建上下文 → pick 延續原狀且不重設試探、不重派事件',
] as const

/** 二分鎖定的最小曾重現 it（FIXED_CANDIDATE_SPECS[0] 別名，保留舊匯出）。 */
export const LOCKED_FLAKY_SPEC = FIXED_CANDIDATE_SPECS[0]

export type FixtureFailureSignal =
  | 'reuse-current'
  | 'isolation-miss'
  | 'timeout'
  | 'other'
  | 'none'

/** 候選 routing fixture 的關鍵狀態契約（修復後應維持）。 */
export interface KeyFixtureStatus {
  isolatedWorkspace: 'required'
  fixedClockIso: string
  fixtureIoTimeoutMs: number
  cacheClearedBetweenTests: true
  failureSignal: FixtureFailureSignal
}

type ProcessRunner = (opts: Parameters<typeof runProcess>[0]) => Promise<ProcResult>

function lastLine(output: string): string {
  return stripVTControlCharacters(output)
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .at(-1) ?? '(無輸出)'
}

function isFixedCandidateSpec(spec: string): boolean {
  return (FIXED_CANDIDATE_SPECS as readonly string[]).includes(spec)
}

/** 由失敗訊息推斷 fixture 相關訊號，並附上修復契約期望值。 */
export function keyFixtureStatus(message: string): KeyFixtureStatus {
  let failureSignal: FixtureFailureSignal = 'none'
  if (/reuse-current/.test(message)) failureSignal = 'reuse-current'
  else if (/ETIMEDOUT|timed?\s*out|timeout/i.test(message)) failureSignal = 'timeout'
  else if (/to include ['"]qwen['"]|isolated|untilTs/i.test(message)) failureSignal = 'isolation-miss'
  else if (message && message !== '(無失敗訊息)' && message !== '(無輸出)') failureSignal = 'other'

  return {
    isolatedWorkspace: 'required',
    fixedClockIso: DEFAULT_FIXED_CLOCK_ISO,
    fixtureIoTimeoutMs: FIXTURE_IO_TIMEOUT_MS,
    cacheClearedBetweenTests: true,
    failureSignal,
  }
}

/**
 * 最小診斷單行：round + spec + fixture 狀態 + exit。
 * 候選失敗優先於其他 FAIL 標題。
 */
export function regressionDiagnostic(round: number, result: ProcResult): string {
  const output = `${result.stdout}\n${result.stderr}`
  const failures = parseVitestFailures(output)
  const candidate = failures.find(failure => isFixedCandidateSpec(failure.spec))
  const failure = candidate ?? failures[0]
  const target = candidate ? 'candidate' : failure ? 'other' : 'process'
  const spec = failure?.spec ?? '(process)'
  const detail = failure?.message ?? lastLine(output)
  const fixture = keyFixtureStatus(detail)
  return [
    `[flaky-regression]`,
    `round=${round}/${ROUNDS}`,
    `spec=${JSON.stringify(spec)}`,
    `target=${target}`,
    `exit=${String(result.exitCode)}`,
    `timedOut=${result.timedOut}`,
    `fixture=${JSON.stringify(fixture)}`,
    `detail=${JSON.stringify(detail)}`,
  ].join(' ')
}

export async function flakyRegressionMain(
  cwd = process.cwd(),
  run: ProcessRunner = runProcess,
): Promise<number> {
  let failed = false
  for (let round = 1; round <= ROUNDS; round++) {
    const result = await run({
      command: 'npx',
      args: ['vitest', 'run', '--reporter=dot'],
      cwd,
      stdinText: '',
      timeoutMs: TIMEOUT_MS,
    })
    if (result.exitCode === 0 && !result.timedOut) {
      console.log(`[flaky-regression] round=${round}/${ROUNDS} ok durationMs=${result.durationMs}`)
    } else {
      failed = true
      console.error(regressionDiagnostic(round, result), result.stdout, result.stderr)
    }
  }
  return failed ? 1 : 0
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  flakyRegressionMain().then(
    code => { process.exitCode = code },
    error => {
      console.error(error instanceof Error ? error.message : String(error))
      process.exitCode = 1
    },
  )
}
