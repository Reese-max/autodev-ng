#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ConfigSchema } from '../types.js'
import {
  summarizePickReadyRouting,
  type PickReadyRoutingSummary,
} from './pick-ready-routing-summary.js'
import {
  checkRoutingStateConsistency,
  type RoutingConsistencyInput,
  type RoutingConsistencyResult,
} from './routing-state-consistency.js'

export interface RoutingCheckInput extends RoutingConsistencyInput {
  defaultEngine: string
}

export interface RoutingCheckReport {
  ok: boolean
  summary: PickReadyRoutingSummary
  consistency: RoutingConsistencyResult
}

type ConsistencyCheck = (input: RoutingConsistencyInput) => RoutingConsistencyResult

const NORMAL_SKIPS = new Set(['no-rotation', 'no-state-file'])

function triggerReason(result: RoutingConsistencyResult): string {
  if (result.kind === 'ok') return 'consistent'
  if (result.kind === 'skipped') return result.reason
  return result.warnings.map(warning => warning.code).join(',')
}

/** 唯讀快速檢查：串起既有診斷摘要與一致性檢查，不派工、不寫狀態。 */
export function checkRouting(
  input: RoutingCheckInput,
  check: ConsistencyCheck = checkRoutingStateConsistency,
): RoutingCheckReport {
  const consistency = check(input)
  const ok = consistency.kind === 'ok'
    || (consistency.kind === 'skipped' && NORMAL_SKIPS.has(consistency.reason))
  return {
    ok,
    summary: summarizePickReadyRouting({
      result: consistency.decision,
      triggerReason: triggerReason(consistency),
      candidateRotation: input.engineRotation?.length
        ? input.engineRotation
        : [input.defaultEngine],
      fallbackToOriginalPath: consistency.maintainOriginalPath,
    }),
    consistency,
  }
}

export function loadRoutingCheckInput(configPath: string): RoutingCheckInput {
  const absolutePath = resolve(configPath)
  const cfg = ConfigSchema.parse(JSON.parse(readFileSync(absolutePath, 'utf8')) as unknown)
  return {
    dataDir: resolve(dirname(absolutePath), cfg.dataDir),
    defaultEngine: cfg.defaultEngine,
    engineRotation: cfg.engineRotation,
    offsetHours: cfg.timezoneOffsetHours,
  }
}

export function routingCheckMain(argv: readonly string[]): number {
  const configIndex = argv.indexOf('--config')
  const configPath = configIndex >= 0 ? argv[configIndex + 1] : undefined
  if (!configPath) throw new Error('用法：npm run routing-check -- --config <path>')
  const report = checkRouting(loadRoutingCheckInput(configPath))
  console.log(JSON.stringify(report, null, 2))
  return report.ok ? 0 : 1
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    process.exitCode = routingCheckMain(process.argv.slice(2))
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
