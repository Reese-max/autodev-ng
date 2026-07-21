#!/usr/bin/env node
import { pathToFileURL } from 'node:url'
import { stripVTControlCharacters } from 'node:util'
import { runProcess, type ProcResult } from '../proc.js'
import { parseVitestFailures } from './flaky-tracker.js'

const ROUNDS = 2
const TIMEOUT_MS = 15 * 60_000

export const LOCKED_FLAKY_SPEC = 'tests/restart-routing-consistency.test.ts > 狀態重建入口守門 > 只讀檢查：第二次重建不重初始化快取與事件計數，試探/常駐候選不重置'

type ProcessRunner = (opts: Parameters<typeof runProcess>[0]) => Promise<ProcResult>

function lastLine(output: string): string {
  return stripVTControlCharacters(output)
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .at(-1) ?? '(無輸出)'
}

export function regressionDiagnostic(round: number, result: ProcResult): string {
  const output = `${result.stdout}\n${result.stderr}`
  const failures = parseVitestFailures(output)
  const locked = failures.find(failure => failure.spec === LOCKED_FLAKY_SPEC)
  const failure = locked ?? failures[0]
  const target = locked ? 'locked' : failure ? 'other' : 'process'
  const detail = failure ? `${failure.spec}: ${failure.message}` : lastLine(output)
  return `[flaky-regression] round=${round}/${ROUNDS} exit=${String(result.exitCode)} timedOut=${result.timedOut} target=${target} detail=${JSON.stringify(detail)}`
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
      console.error(regressionDiagnostic(round, result))
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
