import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import {
  checkRouting,
  loadRoutingCheckInput,
  routingCheckMain,
} from '../src/engines/routing-check.js'
import { REUSE_CURRENT } from '../src/engines/routing-decision.js'
import type { RoutingConsistencyResult } from '../src/engines/routing-state-consistency.js'

const roots: string[] = []

afterEach(() => {
  vi.restoreAllMocks()
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

const input = {
  dataDir: 'unused',
  defaultEngine: 'claude',
  engineRotation: ['qwen', 'codex'],
  offsetHours: 8,
}

function withResult(result: RoutingConsistencyResult) {
  return checkRouting(input, () => result)
}

test('一致時串起穩定診斷摘要與一致性結果', () => {
  const consistency: RoutingConsistencyResult = {
    kind: 'ok',
    maintainOriginalPath: true,
    decision: REUSE_CURRENT,
    warnings: [],
  }

  expect(withResult(consistency)).toEqual({
    ok: true,
    summary: {
      finalResult: REUSE_CURRENT,
      triggerReason: 'consistent',
      candidateRotation: ['qwen', 'codex'],
      fallbackToOriginalPath: true,
    },
    consistency,
  })
})

test('一致性警告使快速檢查失敗並列出警告代碼', () => {
  const report = withResult({
    kind: 'warnings',
    maintainOriginalPath: true,
    decision: REUSE_CURRENT,
    warnings: [{
      code: 'healthy-but-isolated',
      engine: 'qwen',
      detail: 'fixture',
    }],
  })

  expect(report.ok).toBe(false)
  expect(report.summary.triggerReason).toBe('healthy-but-isolated')
})

test.each([
  ['no-rotation', true],
  ['no-state-file', true],
  ['state-corrupt', false],
  ['unexpected-error', false],
] as const)('skipped %s 的健康判定為 %s', (reason, ok) => {
  const report = checkRouting(
    { ...input, engineRotation: undefined },
    () => ({
      kind: 'skipped',
      maintainOriginalPath: true,
      decision: REUSE_CURRENT,
      warnings: [],
      reason,
    }),
  )

  expect(report.ok).toBe(ok)
  expect(report.summary).toMatchObject({
    finalResult: REUSE_CURRENT,
    triggerReason: reason,
    candidateRotation: ['claude'],
    fallbackToOriginalPath: true,
  })
})

test('手動入口解析相對 dataDir，無狀態檔時輸出 JSON 並成功', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-routing-check-'))
  roots.push(root)
  const configPath = join(root, 'config.json')
  writeFileSync(configPath, JSON.stringify({
    projectPath: './project',
    backlogFile: './BACKLOG.md',
    dataDir: './state',
    engine: 'mock',
  }))

  expect(loadRoutingCheckInput(configPath)).toMatchObject({
    dataDir: join(root, 'state'),
    defaultEngine: 'claude',
    engineRotation: undefined,
    offsetHours: 8,
  })

  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
  expect(routingCheckMain(['--config', configPath])).toBe(0)
  expect(JSON.parse(String(log.mock.calls[0]?.[0]))).toMatchObject({
    ok: true,
    summary: { triggerReason: 'no-rotation', candidateRotation: ['claude'] },
    consistency: { kind: 'skipped', reason: 'no-rotation' },
  })
})

test('手動入口缺 --config 時回報用法', () => {
  expect(() => routingCheckMain([])).toThrow('用法：npm run routing-check -- --config <path>')
})
