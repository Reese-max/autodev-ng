import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { afterEach, expect, test } from 'vitest'
import {
  pickReadyTaskBranchResult,
  summarizePickReadyRouting,
  type PickReadyRoutingSummary,
  type PickReadyTaskResultLike,
} from '../src/engines/pick-ready-routing-summary.js'
import {
  ROUTING_STATE_FILENAME,
  defaultRoutingState,
} from '../src/engines/routing-state.js'

const roots: string[] = []

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

/** 診斷摘要必須穩定輸出的欄位（四種結果共用契約）。 */
const STABLE_FIELDS = [
  'finalResult',
  'triggerReason',
  'candidateRotation',
  'fallbackToOriginalPath',
] as const satisfies readonly (keyof PickReadyRoutingSummary)[]

function expectStableFields(summary: PickReadyRoutingSummary): void {
  expect(Object.keys(summary).sort()).toEqual([...STABLE_FIELDS].sort())
  expect(typeof summary.finalResult).toBe('string')
  expect(summary.finalResult.length).toBeGreaterThan(0)
  expect(typeof summary.triggerReason).toBe('string')
  expect(summary.triggerReason.length).toBeGreaterThan(0)
  expect(Array.isArray(summary.candidateRotation)).toBe(true)
  expect(typeof summary.fallbackToOriginalPath).toBe('boolean')
  expect(Object.isFrozen(summary)).toBe(true)
  expect(Object.isFrozen(summary.candidateRotation)).toBe(true)
}

test('整理當次路由結果且不持有可變候選清單', () => {
  const candidateRotation = ['qwen', 'codex']
  const summary = summarizePickReadyRouting({
    result: { engineTag: 'codex', fixedCost: 0 },
    triggerReason: 'qwen-isolated',
    candidateRotation,
    fallbackToOriginalPath: false,
  })

  candidateRotation.push('spark')
  expect(summary).toEqual({
    finalResult: 'picked:codex:fixed=0',
    triggerReason: 'qwen-isolated',
    candidateRotation: ['qwen', 'codex'],
    fallbackToOriginalPath: false,
  })
  expect(Object.isFrozen(summary)).toBe(true)
  expect(Object.isFrozen(summary.candidateRotation)).toBe(true)
})

test('保留回退原路徑與非派工結果', () => {
  expect(summarizePickReadyRouting({
    result: 'preflight-failed',
    triggerReason: 'no-routing-data',
    candidateRotation: ['qwen'],
    fallbackToOriginalPath: true,
  })).toEqual({
    finalResult: 'preflight-failed',
    triggerReason: 'no-routing-data',
    candidateRotation: ['qwen'],
    fallbackToOriginalPath: true,
  })
})

/** 對應決策追蹤的四種路由結果：隔離 / 試探 / 候補 / 沿用現狀。 */
const DECISION_CASES: readonly {
  name: '隔離' | '試探' | '候補' | '沿用現狀'
  result: PickReadyTaskResultLike
  triggerReason: string
  candidateRotation: readonly string[]
  fallbackToOriginalPath: boolean
  expectedFinal: string
}[] = [
  {
    name: '隔離',
    result: { engineTag: 'codex', fixedCost: 0 },
    triggerReason: '隔離',
    candidateRotation: ['codex', 'opencode'],
    fallbackToOriginalPath: false,
    expectedFinal: 'picked:codex:fixed=0',
  },
  {
    name: '試探',
    result: { engineTag: 'qwen', fixedCost: 0 },
    triggerReason: '試探',
    candidateRotation: ['qwen', 'codex'],
    fallbackToOriginalPath: false,
    expectedFinal: 'picked:qwen:fixed=0',
  },
  {
    name: '候補',
    result: { engineTag: 'spark', fixedCost: 0 },
    triggerReason: '候補',
    candidateRotation: ['qwen', 'spark'],
    fallbackToOriginalPath: false,
    expectedFinal: 'picked:spark:fixed=0',
  },
  {
    name: '沿用現狀',
    result: { engineTag: 'qwen', fixedCost: undefined },
    triggerReason: '沿用現狀',
    candidateRotation: ['qwen'],
    fallbackToOriginalPath: true,
    expectedFinal: 'picked:qwen:metered',
  },
]

test.each(DECISION_CASES)(
  '$name：診斷摘要輸出穩定欄位',
  ({ result, triggerReason, candidateRotation, fallbackToOriginalPath, expectedFinal }) => {
    const summary = summarizePickReadyRouting({
      result,
      triggerReason,
      candidateRotation,
      fallbackToOriginalPath,
    })

    expectStableFields(summary)
    expect(summary).toEqual({
      finalResult: expectedFinal,
      triggerReason,
      candidateRotation: [...candidateRotation],
      fallbackToOriginalPath,
    })
    expect(summary.finalResult).toBe(pickReadyTaskBranchResult(result))
  },
)

test('唯讀診斷摘要不寫入 dataDir、不更新狀態時間戳', () => {
  const dataDir = mkdtempSync(join(process.cwd(), '.routing-summary-ro-'))
  roots.push(dataDir)

  const frozenAt = '2026-07-20T12:00:00.000Z'
  const probeLastTs = '2026-07-20T11:00:00.000Z'
  const untilTs = '2026-07-21T12:00:00.000Z'
  const state = {
    ...defaultRoutingState(frozenAt),
    updatedAt: frozenAt,
    isolated: { qwen: { untilTs, reason: 'fixture-isolate' } },
    probes: { qwen: { hits: 1, lastTs: probeLastTs } },
  }
  const stateFile = join(dataDir, ROUTING_STATE_FILENAME)
  writeFileSync(stateFile, JSON.stringify(state), 'utf8')

  const beforeContent = readFileSync(stateFile, 'utf8')
  const beforeMtime = statSync(stateFile).mtimeMs
  const beforeNames = readdirSync(dataDir).sort()

  // 四種結果各呼叫一次：純整理，不得碰 dataDir
  for (const c of DECISION_CASES) {
    const summary = summarizePickReadyRouting({
      result: c.result,
      triggerReason: c.triggerReason,
      candidateRotation: c.candidateRotation,
      fallbackToOriginalPath: c.fallbackToOriginalPath,
    })
    expectStableFields(summary)
    expect(summary.triggerReason).toBe(c.name)
  }

  expect(existsSync(stateFile)).toBe(true)
  expect(readFileSync(stateFile, 'utf8')).toBe(beforeContent)
  expect(statSync(stateFile).mtimeMs).toBe(beforeMtime)
  expect(readdirSync(dataDir).sort()).toEqual(beforeNames)

  const disk = JSON.parse(beforeContent) as {
    updatedAt: string
    isolated: { qwen: { untilTs: string } }
    probes: { qwen: { lastTs: string; hits: number } }
  }
  expect(disk.updatedAt).toBe(frozenAt)
  expect(disk.isolated.qwen.untilTs).toBe(untilTs)
  expect(disk.probes.qwen).toEqual({ hits: 1, lastTs: probeLastTs })
})
