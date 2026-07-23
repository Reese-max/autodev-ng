import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import {
  loadRoutingStatusInput,
  readRoutingStatus,
  routingStatusMain,
} from '../src/engines/routing-status.js'
import {
  ROUTING_STATE_FILENAME,
  defaultRoutingState,
} from '../src/engines/routing-state.js'
import { REUSE_CURRENT, type RunStatsResult } from '../src/engines/run-stats.js'

const NOW = '2026-07-21T12:00:00.000Z'
const roots: string[] = []

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function tempDir(): string {
  const root = mkdtempSync(join(process.cwd(), '.routing-status-'))
  roots.push(root)
  return root
}

const STATS = {
  kind: 'stats',
  days: ['2026-07-21', '2026-07-20', '2026-07-19'],
  sampleCount: 3,
  engines: [
    { engine: 'qwen', sampleCount: 2, ok: 1, fail: 1, successRate: 0.5 },
    { engine: 'codex', sampleCount: 1, ok: 1, fail: 0, successRate: 1 },
  ],
} satisfies RunStatsResult

test('集中列出有效隔離、下次試探、常駐候補與近三日樣本', () => {
  const state = {
    ...defaultRoutingState(NOW),
    isolated: {
      qwen: { untilTs: '2026-07-22T12:00:00.000Z', reason: 'bad-stats' },
      codex: { untilTs: '2026-07-21T13:00:00.000Z', reason: 'probe-fail' },
      expired: { untilTs: NOW, reason: 'done' },
    },
    promoted: {
      spark: { score: 4, promotedAt: '2026-07-20T08:00:00.000Z' },
    },
  }
  const loadState = vi.fn(() => ({ kind: 'state' as const, state, source: 'file' as const }))
  const readStats = vi.fn(() => STATS)

  expect(readRoutingStatus(
    { dataDir: 'state', nowIso: NOW, offsetHours: 8 },
    { loadRoutingState: loadState, recentRunStats: readStats },
  )).toEqual({
    observedAt: NOW,
    maintainOriginalPath: false,
    decision: 'status',
    stateLoad: { kind: 'state', source: 'file' },
    isolatedEngines: [
      { engine: 'codex', reason: 'probe-fail', nextProbeAt: '2026-07-21T13:00:00.000Z' },
      { engine: 'qwen', reason: 'bad-stats', nextProbeAt: '2026-07-22T12:00:00.000Z' },
    ],
    standbyEngines: [
      { engine: 'spark', score: 4, promotedAt: '2026-07-20T08:00:00.000Z' },
    ],
    recentStats: STATS,
  })
  expect(loadState).toHaveBeenCalledWith('state', { nowIso: NOW })
  expect(readStats).toHaveBeenCalledWith(join('state', 'run.db'), {
    nowIso: NOW,
    offsetHours: 8,
    windowDays: 3,
  })
})

test('匯總入口不改狀態檔或建立其他檔案', () => {
  const dataDir = tempDir()
  const file = join(dataDir, ROUTING_STATE_FILENAME)
  writeFileSync(file, JSON.stringify({
    ...defaultRoutingState(NOW),
    isolated: { qwen: { untilTs: '2026-07-22T12:00:00.000Z', reason: 'fixture' } },
  }))
  const before = readFileSync(file, 'utf8')
  const beforeMtime = statSync(file).mtimeMs
  const beforeNames = readdirSync(dataDir)

  expect(readRoutingStatus(
    { dataDir, nowIso: NOW },
    { recentRunStats: () => STATS },
  ).isolatedEngines).toHaveLength(1)

  expect(readFileSync(file, 'utf8')).toBe(before)
  expect(statSync(file).mtimeMs).toBe(beforeMtime)
  expect(readdirSync(dataDir)).toEqual(beforeNames)
})

test('狀態檔缺失時 maintainOriginalPath 且不拋錯', () => {
  const dataDir = join(tempDir(), 'no-state-dir')
  const report = readRoutingStatus(
    { dataDir, nowIso: NOW },
    { recentRunStats: () => STATS },
  )
  expect(report.maintainOriginalPath).toBe(true)
  expect(report.decision).toBe(REUSE_CURRENT)
  expect(report.stateLoad).toEqual({ kind: 'reuse-current', reason: 'missing' })
  expect(report.isolatedEngines).toEqual([])
  expect(report.standbyEngines).toEqual([])
  expect(report.recentStats).toEqual(STATS)
  expect(existsSync(dataDir)).toBe(false)
})

test('run.db 缺失時 maintainOriginalPath 且不拋錯', () => {
  const dataDir = tempDir()
  const file = join(dataDir, ROUTING_STATE_FILENAME)
  writeFileSync(file, JSON.stringify({
    ...defaultRoutingState(NOW),
    isolated: { qwen: { untilTs: '2026-07-22T12:00:00.000Z', reason: 'fixture' } },
    promoted: { spark: { score: 2, promotedAt: '2026-07-20T00:00:00.000Z' } },
  }))
  const before = readFileSync(file, 'utf8')
  const namesBefore = readdirSync(dataDir).sort()

  const report = readRoutingStatus({ dataDir, nowIso: NOW })
  expect(report.maintainOriginalPath).toBe(true)
  expect(report.decision).toBe(REUSE_CURRENT)
  expect(report.stateLoad).toEqual({ kind: 'state', source: 'file' })
  expect(report.isolatedEngines).toEqual([
    { engine: 'qwen', reason: 'fixture', nextProbeAt: '2026-07-22T12:00:00.000Z' },
  ])
  expect(report.standbyEngines).toEqual([
    { engine: 'spark', score: 2, promotedAt: '2026-07-20T00:00:00.000Z' },
  ])
  expect(report.recentStats).toEqual({
    kind: 'reuse-current',
    decision: REUSE_CURRENT,
    reason: 'missing-run-db',
  })
  expect(readFileSync(file, 'utf8')).toBe(before)
  expect(readdirSync(dataDir).sort()).toEqual(namesBefore)
})

const VALID_STATE = JSON.stringify({
  ...defaultRoutingState(NOW),
  isolated: { qwen: { untilTs: '2026-07-22T12:00:00.000Z', reason: 'fixture' } },
})

/** 匯總報告必須穩定輸出的欄位（四種 smoke 情境共用契約）。 */
const STABLE_REPORT_KEYS = [
  'observedAt',
  'maintainOriginalPath',
  'decision',
  'stateLoad',
  'isolatedEngines',
  'standbyEngines',
  'recentStats',
] as const

type SmokeScenario = {
  name: '有狀態檔' | '無狀態檔' | 'JSON 損毀' | '空 engineRotation'
  stateText: string | undefined
  engineRotation: readonly string[] | undefined
  expectedIsolated: number
  expectedStateLoad:
    | { kind: 'state'; source: 'file' }
    | { kind: 'reuse-current'; reason: 'missing' | 'corrupt' }
}

const SMOKE_SCENARIOS: readonly SmokeScenario[] = [
  {
    name: '有狀態檔',
    stateText: VALID_STATE,
    engineRotation: ['qwen', 'codex'],
    expectedIsolated: 1,
    expectedStateLoad: { kind: 'state', source: 'file' },
  },
  {
    name: '無狀態檔',
    stateText: undefined,
    engineRotation: ['qwen'],
    expectedIsolated: 0,
    expectedStateLoad: { kind: 'reuse-current', reason: 'missing' },
  },
  {
    name: 'JSON 損毀',
    stateText: '{broken',
    engineRotation: ['qwen'],
    expectedIsolated: 0,
    expectedStateLoad: { kind: 'reuse-current', reason: 'corrupt' },
  },
  {
    name: '空 engineRotation',
    stateText: VALID_STATE,
    engineRotation: [],
    expectedIsolated: 1,
    expectedStateLoad: { kind: 'state', source: 'file' },
  },
]

function snapshotDataDir(dataDir: string, stateFile: string): {
  existed: boolean
  names: string[]
  content: string | undefined
  mtime: number | undefined
} {
  const existed = existsSync(dataDir)
  return {
    existed,
    names: existed ? readdirSync(dataDir).sort() : [],
    content: existsSync(stateFile) ? readFileSync(stateFile, 'utf8') : undefined,
    mtime: existsSync(stateFile) ? statSync(stateFile).mtimeMs : undefined,
  }
}

function expectDataDirUnchanged(
  dataDir: string,
  stateFile: string,
  before: ReturnType<typeof snapshotDataDir>,
): void {
  expect(existsSync(dataDir)).toBe(before.existed)
  if (before.existed) expect(readdirSync(dataDir).sort()).toEqual(before.names)
  if (before.content !== undefined) {
    expect(readFileSync(stateFile, 'utf8')).toBe(before.content)
    expect(statSync(stateFile).mtimeMs).toBe(before.mtime)
  }
}

function prepareSmokeRoot(scenario: SmokeScenario): {
  root: string
  dataDir: string
  stateFile: string
  configPath: string
} {
  const root = tempDir()
  const dataDir = join(root, 'state')
  const stateFile = join(dataDir, ROUTING_STATE_FILENAME)
  const configPath = join(root, 'config.json')
  if (scenario.stateText !== undefined) {
    mkdirSync(dataDir)
    writeFileSync(stateFile, scenario.stateText)
  }
  const rotation = scenario.engineRotation ?? []
  // defaultEngine 預設 claude；rotation tags 也必須在 engines 白名單
  const engines = Object.fromEntries(
    ['claude', ...rotation].map(tag => [tag, { adapter: 'mock' as const, costPerRunUsd: 0 }]),
  )
  writeFileSync(configPath, JSON.stringify({
    projectPath: './project',
    backlogFile: './BACKLOG.md',
    dataDir: './state',
    engine: 'mock',
    engines,
    // 空陣列仍寫入，驗證 config 路徑接受空 engineRotation
    engineRotation: scenario.engineRotation,
  }))
  return { root, dataDir, stateFile, configPath }
}

function expectStableReportShape(report: Record<string, unknown>): void {
  expect(Object.keys(report).sort()).toEqual([...STABLE_REPORT_KEYS].sort())
  expect(typeof report.observedAt).toBe('string')
  expect(typeof report.maintainOriginalPath).toBe('boolean')
  expect(typeof report.decision).toBe('string')
  expect(report.stateLoad).toEqual(expect.any(Object))
  expect(Array.isArray(report.isolatedEngines)).toBe(true)
  expect(Array.isArray(report.standbyEngines)).toBe(true)
  expect(report.recentStats).toEqual(expect.any(Object))
}

/**
 * 最小 smoke：API 入口 readRoutingStatus
 * 覆蓋有狀態檔 / 無狀態檔 / JSON 損毀 / 空 engineRotation；
 * 驗證輸出欄位穩定、雙次讀取等價、dataDir 零寫入。
 */
test.each(SMOKE_SCENARIOS)(
  'API smoke：$name → 輸出穩定且不產生狀態變更',
  scenario => {
    const { dataDir, stateFile, configPath } = prepareSmokeRoot(scenario)
    // 空 engineRotation 也必須能從 config 解析（匯總入口不消費 rotation，但 config 路徑須穩定）
    expect(loadRoutingStatusInput(configPath)).toEqual({ dataDir, offsetHours: 8 })

    const before = snapshotDataDir(dataDir, stateFile)
    const first = readRoutingStatus({ dataDir, nowIso: NOW })
    const second = readRoutingStatus({ dataDir, nowIso: NOW })

    expectStableReportShape(first as unknown as Record<string, unknown>)
    expect(first).toEqual(second)
    expect(first).toMatchObject({
      observedAt: NOW,
      maintainOriginalPath: true,
      decision: REUSE_CURRENT,
      stateLoad: scenario.expectedStateLoad,
      standbyEngines: [],
      recentStats: { kind: 'reuse-current', reason: 'missing-run-db' },
    })
    expect(first.isolatedEngines).toHaveLength(scenario.expectedIsolated)
    if (scenario.expectedIsolated === 1) {
      expect(first.isolatedEngines[0]).toEqual({
        engine: 'qwen',
        reason: 'fixture',
        nextProbeAt: '2026-07-22T12:00:00.000Z',
      })
    }

    expectDataDirUnchanged(dataDir, stateFile, before)
  },
)

/**
 * CLI 入口 smoke：routingStatusMain 同樣覆蓋四情境，
 * 確認 JSON 輸出契約與 dataDir 完全唯讀。
 */
test.each(SMOKE_SCENARIOS)(
  'CLI smoke：$name → 輸出穩定且 dataDir 完全唯讀',
  scenario => {
    // routingStatusMain 內部用真實時鐘（不吃 nowIso）；釘在 NOW 使隔離窗判定確定性，
    // 否則 fixture 的 untilTs 過期後此測試會隨真實日期崩掉（時間炸彈）。
    vi.useFakeTimers()
    vi.setSystemTime(new Date(NOW))
    const { dataDir, stateFile, configPath } = prepareSmokeRoot(scenario)
    expect(loadRoutingStatusInput(configPath)).toEqual({ dataDir, offsetHours: 8 })

    const before = snapshotDataDir(dataDir, stateFile)
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    expect(routingStatusMain(['--config', configPath])).toBe(0)
    const report = JSON.parse(String(log.mock.calls[0]?.[0])) as Record<string, unknown>

    expectStableReportShape(report)
    expect(report).toMatchObject({
      observedAt: expect.any(String),
      maintainOriginalPath: true,
      decision: REUSE_CURRENT,
      stateLoad: scenario.expectedStateLoad,
      recentStats: { kind: 'reuse-current', reason: 'missing-run-db' },
    })
    expect(report.isolatedEngines).toHaveLength(scenario.expectedIsolated)

    expectDataDirUnchanged(dataDir, stateFile, before)
  },
)

test('CLI 缺 --config 時回報用法', () => {
  expect(() => routingStatusMain([])).toThrow('用法：npm run routing-status -- --config <path>')
})
