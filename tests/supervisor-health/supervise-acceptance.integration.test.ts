import { expect, test } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, statSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { superviseConfig, type CommandRunner } from '../../src/supervisor/supervise.js'

type Scenario = {
  name: string
  pidAlive: boolean
  heartbeatAgeMs: number
  childCount: number
  expectedAction: 'keep' | 'launch' | 'reap'
  expectLock: boolean
  expectLaunch: boolean
  expectTaskkill: boolean
  expectWedgeEvent: boolean
}

const scenarios: Scenario[] = [
  {
    name: 'PID 活且心跳新鮮',
    pidAlive: true,
    heartbeatAgeMs: 5 * 60_000,
    childCount: 1,
    expectedAction: 'keep',
    expectLock: true,
    expectLaunch: false,
    expectTaskkill: false,
    expectWedgeEvent: false,
  },
  {
    name: 'PID 活且心跳逾 30 分鐘',
    pidAlive: true,
    heartbeatAgeMs: 36 * 60_000,
    childCount: 2,
    expectedAction: 'reap',
    expectLock: false,
    expectLaunch: true,
    expectTaskkill: true,
    expectWedgeEvent: true,
  },
  {
    name: 'PID 死',
    pidAlive: false,
    heartbeatAgeMs: 5 * 60_000,
    childCount: 0,
    expectedAction: 'launch',
    expectLock: false,
    expectLaunch: true,
    expectTaskkill: false,
    expectWedgeEvent: false,
  },
]

function writeFixture(scenario: Scenario): { configPath: string; dataDir: string; pid: number; nowMs: number } {
  const root = mkdtempSync(join(tmpdir(), 'adng-supervise-acceptance-'))
  const configPath = join(root, 'project.json')
  const dataDir = join(root, 'project.data')
  const pid = scenario.pidAlive ? 41_001 : 41_002
  const nowMs = Date.now()

  writeFileSync(configPath, JSON.stringify({
    projectPath: './project',
    backlogFile: './BACKLOG.md',
    dataDir: './project.data',
    engine: 'mock',
  }))
  mkdirSync(join(dataDir, 'daemon.lock'), { recursive: true })
  writeFileSync(join(dataDir, 'daemon.lock', 'pid.json'), JSON.stringify({ pid }))
  const heartbeat = join(dataDir, 'heartbeat.json')
  writeFileSync(heartbeat, '{}')
  const heartbeatTime = new Date(nowMs - scenario.heartbeatAgeMs)
  utimesSync(heartbeat, heartbeatTime, heartbeatTime)

  return { configPath, dataDir, pid, nowMs }
}

test.each(scenarios)('supervise 整合驗收：$name', scenario => {
  const { configPath, dataDir, pid, nowMs } = writeFixture(scenario)
  const effects: string[] = []
  const timeline: string[] = []
  const commands: string[] = []
  const runCommand: CommandRunner = (command, args) => {
    commands.push(`${command} ${args.join(' ')}`)
    if (command === 'tasklist') {
      return scenario.pidAlive
        ? `"node.exe","${pid}","Console","1","1,000 K"\r\n`
        : 'INFO: No tasks are running which match the specified criteria.'
    }
    if (command === 'powershell.exe') return `${scenario.childCount}\r\n`
    if (command === 'taskkill') {
      timeline.push('taskkill')
      return ''
    }
    throw new Error(`unexpected command: ${command}`)
  }

  const result = superviseConfig(configPath, {
    nowMs,
    runCommand,
    launch: () => {
      effects.push('launch')
      timeline.push(existsSync(join(dataDir, 'daemon.lock')) ? 'launch-lock-present' : 'launch-lock-clear')
      return 42_000
    },
  })

  expect(result.action).toBe(scenario.expectedAction)
  expect(result.launchedPid).toBe(scenario.expectLaunch ? 42_000 : undefined)
  expect(existsSync(join(dataDir, 'daemon.lock'))).toBe(scenario.expectLock)
  expect(effects).toEqual(scenario.expectLaunch ? ['launch'] : [])
  expect(timeline).toEqual(
    scenario.expectTaskkill
      ? ['taskkill', 'launch-lock-clear']
      : scenario.expectLaunch
      ? ['launch-lock-clear']
      : [],
  )
  expect(commands.some(command => command === `taskkill /PID ${pid} /T /F`)).toBe(scenario.expectTaskkill)

  const eventsPath = join(dataDir, 'events.jsonl')
  expect(existsSync(eventsPath)).toBe(scenario.expectWedgeEvent)
  if (scenario.expectWedgeEvent) {
    const event = JSON.parse(readFileSync(eventsPath, 'utf8').trim()) as Record<string, unknown>
    expect(event).toMatchObject({ type: 'daemon-wedge-recovered' })
    expect(event.frozenMinutes).toBe(Math.floor((result.heartbeatAgeMs ?? 0) / 60_000))
    expect(event.frozenMinutes).toBeGreaterThan(30)
  }

  if (scenario.pidAlive) {
    expect(result.heartbeatAgeMs).toBe(nowMs - statSync(join(dataDir, 'heartbeat.json')).mtimeMs)
  }
})
