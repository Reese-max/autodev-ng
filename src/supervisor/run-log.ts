import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import type { SuperviseDirectoryResult } from './supervise.js'

type ProjectRun = {
  configPath: string
  decision: 'keep' | 'launch' | 'reap' | 'error'
  launchedPid: number | null
  error?: string
}

function errorDetails(error: unknown): { message: string; stack: string } {
  const message = error instanceof Error ? error.message : String(error)
  return { message, stack: error instanceof Error && error.stack ? error.stack : message }
}

function projectRuns(results: SuperviseDirectoryResult[]): ProjectRun[] {
  return results.map(result => 'error' in result
    ? { configPath: result.configPath, decision: 'error', launchedPid: null, error: result.error }
    : { configPath: result.configPath, decision: result.action, launchedPid: result.launchedPid ?? null })
}

/** `configs/` 的同層 `data/`，刻意不放入個別專案 dataDir。 */
export function superviseRunLogPath(configPath?: string, configsDir?: string): string {
  const configRoot = configsDir ?? (configPath ? dirname(configPath) : undefined)
  if (!configRoot) throw new Error('supervise 缺少設定檔路徑')
  return resolve(configRoot, '..', 'data', 'supervise-runs.log')
}

export function appendSuperviseRun(
  logPath: string, startedAtMs: number, results: SuperviseDirectoryResult[], error?: unknown,
): void {
  const record = {
    timestamp: new Date(startedAtMs).toISOString(),
    durationMs: Date.now() - startedAtMs,
    projects: projectRuns(results),
    ...(error === undefined ? {} : { error: errorDetails(error) }),
  }
  mkdirSync(dirname(logPath), { recursive: true })
  appendFileSync(logPath, `${JSON.stringify(record)}\n`)
}
