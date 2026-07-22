import { mkdirSync, mkdtempSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { superviseConfig, type CommandRunner } from '../../src/supervisor/supervise.js'
import { ConfigSchema } from '../../src/types.js'

const PID = 9660
const STALE_MS = 60_000
const HARD_CAP_MS = 120_000
const CONFIG_HARD_CAP_MS = 2_000_000

function superviseWedge({
  heartbeatAgeMs,
  childCount,
  treeOutput = '[]',
  treeError,
  useConfigHardCap = false,
}: {
  heartbeatAgeMs: number
  childCount: number
  treeOutput?: string
  treeError?: Error
  useConfigHardCap?: boolean
}) {
  const root = mkdtempSync(join(tmpdir(), 'adng-supervisor-wedge-'))
  const dataDir = join(root, 'data')
  const configPath = join(root, 'config.json')
  const heartbeat = join(dataDir, 'heartbeat.json')
  const nowMs = Date.now()
  mkdirSync(join(dataDir, 'daemon.lock'), { recursive: true })
  writeFileSync(configPath, JSON.stringify({
    projectPath: './project', backlogFile: './BACKLOG.md', dataDir: './data', engine: 'mock',
    ...(useConfigHardCap ? { wedgeHardCapMs: CONFIG_HARD_CAP_MS } : {}),
  }))
  writeFileSync(join(dataDir, 'daemon.lock', 'pid.json'), JSON.stringify({ pid: PID }))
  writeFileSync(heartbeat, '{}')
  utimesSync(heartbeat, new Date(nowMs - heartbeatAgeMs), new Date(nowMs - heartbeatAgeMs))

  const effects: string[] = []
  const runCommand: CommandRunner = (command, args) => {
    if (command === 'tasklist') return `"node.exe","${PID}","Console","1","1,000 K"\r\n`
    if (command === 'powershell.exe' && args.at(-1)?.includes('Measure-Object')) return `${childCount}\r\n`
    if (command === 'powershell.exe' && args.at(-1)?.includes('ConvertTo-Json')) {
      if (treeError) throw treeError
      return treeOutput
    }
    throw new Error(`unexpected command: ${command}`)
  }

  const result = superviseConfig(configPath, {
    nowMs,
    staleThresholdMs: STALE_MS,
    ...(useConfigHardCap ? {} : { wedgeHardCapMs: HARD_CAP_MS }),
    runCommand,
    reap: () => { effects.push('reap') },
    launch: () => { effects.push('launch'); return 9001 },
  })
  return { result, effects }
}

test.each(['wsl.exe', 'cmd.exe', 'conhost.exe'])(
  'hardCap 已過、childCount=1 且只剩 %s 殼進程 → reap',
  shell => {
    const { result, effects } = superviseWedge({
      heartbeatAgeMs: shell === 'wsl.exe' ? CONFIG_HARD_CAP_MS + 1 : HARD_CAP_MS + 1,
      childCount: 1,
      treeOutput: JSON.stringify([shell]),
      useConfigHardCap: shell === 'wsl.exe',
    })

    expect(result.action).toBe('reap')
    expect(effects).toEqual(['reap', 'launch'])
  },
)

test.each(['node.exe', 'codex.exe', 'opencode.exe'])(
  'hardCap 已過但樹中有 %s engine → keep',
  engine => {
    const { result, effects } = superviseWedge({
      heartbeatAgeMs: HARD_CAP_MS + 1,
      childCount: 1,
      treeOutput: JSON.stringify([engine]),
    })

    expect(result.action).toBe('keep')
    expect(effects).toEqual([])
  },
)

test('仍在 staleThreshold 內且 childCount>0 → keep', () => {
  const { result, effects } = superviseWedge({
    heartbeatAgeMs: STALE_MS - 1,
    childCount: 1,
  })

  expect(result.action).toBe('keep')
  expect(effects).toEqual([])
})

test.each([
  { name: '子進程樹 I/O 失敗', treeError: new Error('CIM unavailable') },
  { name: '子進程樹資訊無效', treeOutput: '{ not json' },
])('hardCap 已過但$name → fail-open keep', ({ treeOutput, treeError }) => {
  const { result, effects } = superviseWedge({
    heartbeatAgeMs: HARD_CAP_MS + 1,
    childCount: 1,
    treeOutput,
    treeError,
  })

  expect(result.action).toBe('keep')
  expect(effects).toEqual([])
  expect(result.probeErrors).toContainEqual(expect.stringMatching(/^child-process-tree:/))
})

test('wedgeHardCapMs 必須大於 staleThresholdMs', () => {
  expect(ConfigSchema.safeParse({
    projectPath: './project', backlogFile: './BACKLOG.md', dataDir: './data', engine: 'mock',
    staleThresholdMs: 1_800_000,
    wedgeHardCapMs: 1_800_000,
  }).success).toBe(false)
})
