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
import type { RunStatsResult } from '../src/engines/run-stats.js'

const NOW = '2026-07-21T12:00:00.000Z'
const roots: string[] = []

afterEach(() => {
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

const VALID_STATE = JSON.stringify({
  ...defaultRoutingState(NOW),
  isolated: { qwen: { untilTs: '2026-07-22T12:00:00.000Z', reason: 'fixture' } },
})

test.each([
  { name: '有狀態檔', stateText: VALID_STATE, engineRotation: undefined, expectedIsolated: 1 },
  { name: '無狀態檔', stateText: undefined, engineRotation: undefined, expectedIsolated: 0 },
  { name: '狀態 JSON 損毀', stateText: '{broken', engineRotation: undefined, expectedIsolated: 0 },
  { name: '空輪替名單', stateText: VALID_STATE, engineRotation: [], expectedIsolated: 1 },
] as const)('CLI smoke：$name 時輸出可用且 dataDir 完全唯讀', ({ stateText, engineRotation, expectedIsolated }) => {
  const root = tempDir()
  const dataDir = join(root, 'state')
  const stateFile = join(dataDir, ROUTING_STATE_FILENAME)
  const configPath = join(root, 'config.json')
  if (stateText !== undefined) {
    mkdirSync(dataDir)
    writeFileSync(stateFile, stateText)
  }
  writeFileSync(configPath, JSON.stringify({
    projectPath: './project',
    backlogFile: './BACKLOG.md',
    dataDir: './state',
    engine: 'mock',
    engineRotation,
  }))

  expect(loadRoutingStatusInput(configPath)).toEqual({
    dataDir,
    offsetHours: 8,
  })

  const existedBefore = existsSync(dataDir)
  const namesBefore = existedBefore ? readdirSync(dataDir).sort() : []
  const contentBefore = existsSync(stateFile) ? readFileSync(stateFile, 'utf8') : undefined
  const mtimeBefore = existsSync(stateFile) ? statSync(stateFile).mtimeMs : undefined
  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
  expect(routingStatusMain(['--config', configPath])).toBe(0)
  const report = JSON.parse(String(log.mock.calls[0]?.[0])) as Record<string, unknown>
  expect(report).toMatchObject({
    observedAt: expect.any(String),
    isolatedEngines: expect.any(Array),
    standbyEngines: expect.any(Array),
    recentStats: { kind: 'reuse-current', reason: 'missing-run-db' },
  })
  expect(report.isolatedEngines).toHaveLength(expectedIsolated)

  expect(existsSync(dataDir)).toBe(existedBefore)
  if (existedBefore) expect(readdirSync(dataDir).sort()).toEqual(namesBefore)
  if (contentBefore !== undefined) {
    expect(readFileSync(stateFile, 'utf8')).toBe(contentBefore)
    expect(statSync(stateFile).mtimeMs).toBe(mtimeBefore)
  }
})

test('CLI 缺 --config 時回報用法', () => {
  expect(() => routingStatusMain([])).toThrow('用法：npm run routing-status -- --config <path>')
})
