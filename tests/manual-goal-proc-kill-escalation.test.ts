import { EventEmitter } from 'node:events'
import { basename, dirname, join } from 'node:path'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { PassThrough } from 'node:stream'
import { afterEach, describe, expect, test, vi } from 'vitest'

const childProcessMock = vi.hoisted(() => ({ spawn: vi.fn() }))

vi.mock('node:child_process', async importOriginal => ({
  ...await importOriginal<typeof import('node:child_process')>(),
  spawn: childProcessMock.spawn,
}))

import { killTree, runProcess } from '../src/engines/proc.js'
import { HEARTBEAT_WATCHDOG_MS, superviseConfig } from '../src/supervisor/supervise.js'
import { ConfigSchema } from '../src/types.js'

const tempDirs: string[] = []
const TEMP_PREFIX = '.tmp-manual-goal-proc-'

afterEach(() => {
  vi.useRealTimers()
  childProcessMock.spawn.mockReset()
  while (tempDirs.length) {
    const dir = tempDirs.pop()!
    if (dirname(dir) !== process.cwd() || !basename(dir).startsWith(TEMP_PREFIX)) {
      throw new Error(`拒絕清理 repo 外路徑：${dir}`)
    }
    rmSync(dir, { recursive: true, force: true, maxRetries: 3 })
  }
})

function makeTempDir(): string {
  const dir = mkdtempSync(join(process.cwd(), TEMP_PREFIX))
  tempDirs.push(dir)
  return dir
}

test('idle 收割透過 spawn mock 回傳 timeoutReason=idle，不啟動真實子進程', async () => {
  vi.useFakeTimers()
  const child = Object.assign(new EventEmitter(), {
    pid: undefined,
    stdin: new PassThrough(),
    stdout: new PassThrough(),
    stderr: new PassThrough(),
  })
  childProcessMock.spawn.mockReturnValueOnce(child)

  const pending = runProcess({
    command: 'mock-engine', args: [], cwd: process.cwd(), stdinText: '',
    timeoutMs: 0, idleTimeoutMs: 250,
  })
  await vi.advanceTimersByTimeAsync(250)
  child.emit('close', null)

  await expect(pending).resolves.toMatchObject({
    exitCode: null,
    timedOut: true,
    timeoutReason: 'idle',
  })
  expect(childProcessMock.spawn).toHaveBeenCalledTimes(1)
})

describe('timeout／idle schema 組合', () => {
  const cases = [
    { name: '停用 wall 且有 idle 護欄', timeoutMs: 0, idleTimeoutMs: 300_000, valid: true },
    { name: 'wall 超過兩小時且有 idle 護欄', timeoutMs: 7_200_001, idleTimeoutMs: 300_000, valid: true },
    { name: 'wall 剛好兩小時且未設 idle', timeoutMs: 7_200_000, idleTimeoutMs: undefined, valid: true },
    { name: '停用 wall 且未設 idle', timeoutMs: 0, idleTimeoutMs: undefined, valid: false },
    { name: '停用 wall 且 idle 也停用', timeoutMs: 0, idleTimeoutMs: 0, valid: false },
    { name: 'wall 超過兩小時且未設 idle', timeoutMs: 7_200_001, idleTimeoutMs: undefined, valid: false },
    { name: 'wall 超過兩小時且 idle 停用', timeoutMs: 7_200_001, idleTimeoutMs: 0, valid: false },
  ]

  test.each(cases)('$name => valid=$valid', ({ timeoutMs, idleTimeoutMs, valid }) => {
    const result = ConfigSchema.safeParse({
      projectPath: '.', backlogFile: 'BACKLOG.fixture.md', dataDir: '.runtime', defaultEngine: 'mock',
      engines: { mock: { adapter: 'mock', timeoutMs, idleTimeoutMs } },
    })
    expect(result.success).toBe(valid)
  })
})

test('taskkill 未能終止程序時逐 PID 由葉至根補殺，仍存活者寫 zombie 事件', async () => {
  const calls: string[] = []
  const alive = new Set([40, 41, 42])
  const events: Array<{ type: string; data: { pid: number; command: string } }> = []

  await killTree(40, {
    command: 'root.exe',
    events: { append: (type, data) => events.push({ type, data }) },
    deps: {
      platform: 'win32',
      taskkill: async pid => { calls.push(`taskkill:${pid}`) },
      wait: async ms => { calls.push(`wait:${ms}`) },
      isAlive: pid => { calls.push(`alive:${pid}`); return alive.has(pid) },
      listProcesses: async () => {
        calls.push('list')
        return [
          { pid: 40, command: 'root.exe' },
          { pid: 41, parentPid: 40, command: 'child.exe' },
          { pid: 42, parentPid: 41, command: 'leaf.exe' },
        ]
      },
      kill: pid => {
        calls.push(`kill:${pid}`)
        if (pid === 42) alive.delete(pid)
      },
    },
  })

  // 收斂改版（2026-08-04）：每輪重新枚舉＋葉到根補殺，42 第 1 輪死、41/40 頑固至終輪記殭屍
  expect(calls.slice(0, 2)).toEqual(['taskkill:40', 'wait:2000'])
  expect(calls.filter(c => c === 'list').length).toBe(4) // 3 輪 + 終局驗屍
  expect(calls.filter(c => c.startsWith('kill:'))).toEqual([
    'kill:42', 'kill:41', 'kill:40', 'kill:41', 'kill:40', 'kill:41', 'kill:40',
  ])
  expect(events).toEqual([
    { type: 'proc-zombie', data: { pid: 41, command: 'child.exe' } },
    { type: 'proc-zombie', data: { pid: 40, command: 'root.exe' } },
  ])
})

test('非 Windows killTree 有注入 kill 時不再呼叫全域 process.kill', async () => {
  const injectedKill = vi.fn()
  const processKill = vi.spyOn(process, 'kill').mockReturnValue(true)
  try {
    await killTree(987_654, {
      command: 'mock-engine',
      deps: { platform: 'linux', kill: injectedKill },
    })
    expect(injectedKill).toHaveBeenCalledWith(987_654)
    expect(processKill).not.toHaveBeenCalled()
  } finally {
    processKill.mockRestore()
  }
})

interface DaemonScenario {
  name: string
  heartbeatAgeMs: number
  pidAlive: boolean
  childCount: number
  expectedAction: 'keep' | 'reap' | 'launch'
  expectedEffects: string[]
  wedgeEvent: boolean
}

const DAEMON_SCENARIOS: DaemonScenario[] = [
  {
    name: 'heartbeat 新鮮', heartbeatAgeMs: 5 * 60_000, pidAlive: true, childCount: 0,
    expectedAction: 'keep', expectedEffects: [], wedgeEvent: false,
  },
  {
    name: 'heartbeat 逾期', heartbeatAgeMs: HEARTBEAT_WATCHDOG_MS + 60_000, pidAlive: true, childCount: 2,
    expectedAction: 'reap', expectedEffects: ['reap:73', 'launch'], wedgeEvent: true,
  },
  {
    name: 'PID 死亡', heartbeatAgeMs: 5 * 60_000, pidAlive: false, childCount: 0,
    expectedAction: 'launch', expectedEffects: ['launch'], wedgeEvent: false,
  },
]

test.each(DAEMON_SCENARIOS)('daemon 三態：$name => $expectedAction', scenario => {
  const root = makeTempDir()
  const dataDir = join(root, 'runtime')
  const configPath = join(root, 'project.json')
  const lockDir = join(dataDir, 'daemon.lock')
  const heartbeatPath = join(dataDir, 'heartbeat.json')
  const pid = 73
  const nowMs = Date.parse('2026-07-31T00:00:00.000Z')
  mkdirSync(lockDir, { recursive: true })
  writeFileSync(join(lockDir, 'pid.json'), JSON.stringify({ pid }))
  writeFileSync(heartbeatPath, '{}')
  utimesSync(heartbeatPath, new Date(nowMs - scenario.heartbeatAgeMs), new Date(nowMs - scenario.heartbeatAgeMs))
  writeFileSync(configPath, JSON.stringify({
    projectPath: '.', backlogFile: 'BACKLOG.fixture.md', dataDir: './runtime', engine: 'mock',
  }))
  const effects: string[] = []

  const result = superviseConfig(configPath, {
    nowMs,
    runCommand: command => {
      if (command === 'tasklist') {
        return scenario.pidAlive
          ? `"node.exe","${pid}","Console","1","1,000 K"\r\n`
          : 'INFO: No tasks are running which match the specified criteria.'
      }
      if (command === 'powershell.exe') return `${scenario.childCount}\r\n`
      throw new Error(`未注入的命令：${command}`)
    },
    reap: targetPid => { effects.push(`reap:${targetPid}`) },
    launch: () => { effects.push('launch'); return 7001 },
  })

  expect(result).toMatchObject({ action: scenario.expectedAction, pidAlive: scenario.pidAlive })
  expect(effects).toEqual(scenario.expectedEffects)
  expect(existsSync(lockDir)).toBe(scenario.expectedAction === 'keep')
  const eventsPath = join(dataDir, 'events.jsonl')
  if (scenario.wedgeEvent) {
    const events = readFileSync(eventsPath, 'utf8').trim().split(/\r?\n/).map(line => JSON.parse(line))
    expect(events).toContainEqual(expect.objectContaining({
      type: 'daemon-wedge-recovered',
      frozenMinutes: Math.floor(scenario.heartbeatAgeMs / 60_000),
    }))
  } else {
    expect(existsSync(eventsPath)).toBe(false)
  }
})
