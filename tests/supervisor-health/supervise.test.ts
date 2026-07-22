import { expect, test } from 'vitest'
import { closeSync, mkdirSync, mkdtempSync, openSync, readFileSync, statSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  countChildProcesses,
  isDaemonConsoleLogBusyError,
  isNodePidAlive,
  openDaemonConsoleLog,
  superviseConfig,
  superviseDirectory,
  type CommandRunner,
} from '../../src/supervisor/supervise.js'

function writeConfig(root: string, name = 'project.json', over: Record<string, unknown> = {}): { configPath: string; dataDir: string } {
  const configPath = join(root, name)
  const dataDir = join(root, `${name}.data`)
  writeFileSync(configPath, JSON.stringify({
    projectPath: './project',
    backlogFile: './BACKLOG.md',
    dataDir: `./${name}.data`,
    engine: 'mock',
    ...over,
  }))
  mkdirSync(dataDir, { recursive: true })
  return { configPath, dataDir }
}

function writePid(dataDir: string, pid: number): void {
  const lockDir = join(dataDir, 'daemon.lock')
  mkdirSync(lockDir, { recursive: true })
  writeFileSync(join(lockDir, 'pid.json'), JSON.stringify({ pid }))
}

function aliveRunner(pid: number, childCount = 0, calls: string[] = []): CommandRunner {
  return (command, args) => {
    calls.push(`${command} ${args.join(' ')}`)
    if (command === 'tasklist') return `"node.exe","${pid}","Console","1","1,000 K"\r\n`
    if (command === 'powershell.exe') return `${childCount}\r\n`
    throw new Error(`unexpected command: ${command}`)
  }
}

test('讀 lock PID、以 tasklist 驗 node、用 heartbeat mtime 與 CIM 子進程數分類', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-supervise-'))
  const { configPath, dataDir } = writeConfig(root)
  const pid = 4321
  const nowMs = Date.now()
  writePid(dataDir, pid)
  const heartbeat = join(dataDir, 'heartbeat.json')
  writeFileSync(heartbeat, '{}')
  utimesSync(heartbeat, new Date(nowMs - 5_000), new Date(nowMs - 5_000))
  const expectedAge = nowMs - statSync(heartbeat).mtimeMs
  const calls: string[] = []

  const result = superviseConfig(configPath, {
    nowMs,
    staleThresholdMs: 60_000,
    runCommand: aliveRunner(pid, 2, calls),
    launch: () => { throw new Error('不應 launch') },
    reap: () => { throw new Error('不應 reap') },
  })

  expect(result).toMatchObject({
    dataDir,
    lockPresent: true,
    pid,
    pidAlive: true,
    heartbeatAgeMs: expectedAge,
    childCount: 2,
    action: 'keep',
  })
  expect(calls[0]).toContain('tasklist /FI PID eq 4321 /FI IMAGENAME eq node.exe')
  expect(calls[1]).toContain("Get-CimInstance Win32_Process -Filter 'ParentProcessId=4321'")
})

test('CIM 失敗時回退 wmic 並統計 ProcessId 行', () => {
  const calls: string[] = []
  const count = countChildProcesses(99, (command, args) => {
    calls.push(`${command} ${args.join(' ')}`)
    if (command === 'powershell.exe') throw new Error('CIM unavailable')
    return 'P\u0000r\u0000o\u0000c\u0000e\u0000s\u0000s\u0000I\u0000d\u0000=\u00001\u00000\u00001\u0000\r\u0000\n\u0000ProcessId=102\r\r\n'
  })

  expect(count).toBe(2)
  expect(calls).toHaveLength(2)
  expect(calls[1]).toContain('wmic process where ParentProcessId=99')
})

test('tasklist／WMIC 輸出帶 BOM 或行首空白時仍正確判活與計數', () => {
  expect(isNodePidAlive(1234, () => '\uFEFF  "node.exe","1234","Console","1","1,000 K"\r\n')).toBe(true)
  expect(isNodePidAlive(1234, () => '"not-node.exe","1234","Console","1","1,000 K"\r\n')).toBe(false)

  const count = countChildProcesses(99, command => {
    if (command === 'powershell.exe') throw new Error('CIM unavailable')
    return '\uFEFF  ProcessId=101\r\n  ProcessId=102\r\n'
  })
  expect(count).toBe(2)
})

test('WMIC ProcessId=value 輸出在等號兩側帶空白時仍正確計數', () => {
  const count = countChildProcesses(99, command => {
    if (command === 'powershell.exe') throw new Error('CIM unavailable')
    return 'ProcessId = 101\r\nProcessId= 102\r\n'
  })

  expect(count).toBe(2)
})

test('supervisor 使用 config 的 staleThresholdMs', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-supervise-config-'))
  const { configPath, dataDir } = writeConfig(root, 'threshold.json', { staleThresholdMs: 900_000 })
  writePid(dataDir, 43)
  const heartbeat = join(dataDir, 'heartbeat.json')
  writeFileSync(heartbeat, '{}')
  const nowMs = Date.now()
  utimesSync(heartbeat, new Date(nowMs - 1_200_000), new Date(nowMs - 1_200_000))

  const result = superviseConfig(configPath, {
    nowMs,
    runCommand: aliveRunner(43),
    launch: () => 7001,
    reap: () => undefined,
  })

  expect(result.action).toBe('reap')
})

interface SupervisorScenario {
  name: string
  pidAlive: boolean
  childCount: number
  expectedAction: 'launch' | 'reap' | 'keep'
  expectedEffects: string[]
}

const SUPERVISOR_SCENARIOS: SupervisorScenario[] = [
  {
    name: 'pid 不活時 launch',
    pidAlive: false,
    childCount: 0,
    expectedAction: 'launch',
    expectedEffects: ['launch'],
  },
  {
    name: 'pid 活著、heartbeat 過期且無子進程時 reap 後 launch',
    pidAlive: true,
    childCount: 0,
    expectedAction: 'reap',
    expectedEffects: ['taskkill:/PID 41 /T /F', 'launch'],
  },
  {
    name: 'pid 活著且有子進程時，即使 heartbeat 過期仍 keep 合法長任務',
    pidAlive: true,
    childCount: 1,
    expectedAction: 'keep',
    expectedEffects: [],
  },
]

function supervisorFixture(scenario: SupervisorScenario) {
  const root = mkdtempSync(join(tmpdir(), 'adng-supervise-actions-'))
  const { configPath, dataDir } = writeConfig(root)
  const pid = 41
  const nowMs = Date.now()
  const heartbeat = join(dataDir, 'heartbeat.json')
  writePid(dataDir, pid)
  writeFileSync(heartbeat, '{}')
  utimesSync(heartbeat, new Date(nowMs - 120_000), new Date(nowMs - 120_000))
  const effects: string[] = []

  const result = superviseConfig(configPath, {
    nowMs,
    staleThresholdMs: 60_000,
    runCommand: (command, args) => {
      if (command === 'tasklist') {
        return scenario.pidAlive
          ? `"node.exe","${pid}","Console","1","1,000 K"\r\n`
          : 'INFO: No tasks are running which match the specified criteria.'
      }
      if (command === 'powershell.exe') return `${scenario.childCount}\r\n`
      if (command === 'taskkill') {
        effects.push(`taskkill:${args.join(' ')}`)
        return ''
      }
      throw new Error(`unexpected command: ${command}`)
    },
    launch: () => {
      effects.push('launch')
      return 7001
    },
  })

  return { result, effects }
}

test.each(SUPERVISOR_SCENARIOS)('$name', scenario => {
  const { result, effects } = supervisorFixture(scenario)

  expect(result).toMatchObject({
    pidAlive: scenario.pidAlive,
    childCount: scenario.childCount,
    action: scenario.expectedAction,
  })
  expect(result.heartbeatAgeMs).toBeGreaterThan(60_000)
  expect(effects).toEqual(scenario.expectedEffects)
})

test('探測命令失敗時保守 keep，不誤殺存活 PID', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-supervise-probe-'))
  const { configPath, dataDir } = writeConfig(root)
  writePid(dataDir, 55)
  const heartbeat = join(dataDir, 'heartbeat.json')
  writeFileSync(heartbeat, '{}')
  const nowMs = Date.now()
  utimesSync(heartbeat, new Date(nowMs - 120_000), new Date(nowMs - 120_000))

  const result = superviseConfig(configPath, {
    nowMs,
    staleThresholdMs: 60_000,
    runCommand: () => { throw new Error('tasklist timeout') },
    launch: () => { throw new Error('不應 launch') },
    reap: () => { throw new Error('不應 reap') },
  })

  expect(result).toMatchObject({ pidAlive: true, childCount: 1, action: 'keep' })
  expect(result.probeErrors[0]).toContain('tasklist timeout')
})

test('lock pid 讀取失敗時 fail-open keep，不啟動或回收 daemon', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-supervise-lock-'))
  const { configPath, dataDir } = writeConfig(root)
  const lockDir = join(dataDir, 'daemon.lock')
  mkdirSync(lockDir)
  mkdirSync(join(lockDir, 'pid.json'))
  const effects: string[] = []

  const result = superviseConfig(configPath, {
    launch: () => { effects.push('launch'); return 1 },
    reap: () => { effects.push('reap') },
  })

  expect(result).toMatchObject({ lockPresent: true, pid: null, action: 'keep' })
  expect(result.probeErrors[0]).toContain('lock:')
  expect(effects).toEqual([])
})

test('子進程查詢失敗時 fail-open keep，不回收 daemon', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-supervise-child-'))
  const { configPath, dataDir } = writeConfig(root)
  writePid(dataDir, 56)
  const heartbeat = join(dataDir, 'heartbeat.json')
  writeFileSync(heartbeat, '{}')
  const nowMs = Date.now()
  utimesSync(heartbeat, new Date(nowMs - 120_000), new Date(nowMs - 120_000))

  const result = superviseConfig(configPath, {
    nowMs,
    staleThresholdMs: 60_000,
    runCommand: (command) => {
      if (command === 'tasklist') return '"node.exe","56","Console","1","1,000 K"\r\n'
      throw new Error('child query unavailable')
    },
    reap: () => { throw new Error('不應 reap') },
  })

  expect(result).toMatchObject({ pidAlive: true, childCount: 1, action: 'keep' })
  expect(result.probeErrors[0]).toContain('child query unavailable')
})

test('目錄模式逐一處理排序後的 JSON；壞 config 不拖垮其他專案', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-supervise-dir-'))
  writeConfig(root, 'b.json')
  writeFileSync(join(root, 'a.json'), '{ broken')
  writeFileSync(join(root, 'ignored.txt'), '{}')
  const launched: string[] = []

  const results = superviseDirectory(root, {
    runCommand: () => { throw new Error('無 PID 時不應探測') },
    launch: configPath => { launched.push(basename(configPath)); return 9 },
  })

  expect(results).toHaveLength(2)
  expect(results[0]).toMatchObject({ configPath: join(root, 'a.json') })
  expect(results[0]).toHaveProperty('error')
  expect(results[1]).toMatchObject({ configPath: join(root, 'b.json'), action: 'launch', launchedPid: 9 })
  expect(launched).toEqual(['b.json'])
})

test('isDaemonConsoleLogBusyError：辨識 Windows 檔案共享鎖錯誤碼', () => {
  for (const code of ['EBUSY', 'EPERM', 'EACCES', 'EEXIST'] as const) {
    const err = Object.assign(new Error(code), { code })
    expect(isDaemonConsoleLogBusyError(err)).toBe(true)
  }
  expect(isDaemonConsoleLogBusyError(Object.assign(new Error('nope'), { code: 'ENOENT' }))).toBe(false)
  expect(isDaemonConsoleLogBusyError(new Error('plain'))).toBe(false)
  expect(isDaemonConsoleLogBusyError('string')).toBe(false)
})

test('openDaemonConsoleLog：建立 dataDir 並以 append 開啟 daemon-console.log', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-supervise-log-'))
  const dataDir = join(root, 'nested', 'data')
  const fd = openDaemonConsoleLog(dataDir)
  try {
    expect(statSync(join(dataDir, 'daemon-console.log')).isFile()).toBe(true)
  } finally {
    closeSync(fd)
  }
})

test('launch 回傳 undefined（共享鎖占用）時記錄 probeError、不帶 launchedPid', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-supervise-share-'))
  const { configPath } = writeConfig(root)

  const result = superviseConfig(configPath, {
    runCommand: () => { throw new Error('無 PID 時不應探測') },
    launch: () => undefined,
  })

  expect(result.action).toBe('launch')
  expect(result.launchedPid).toBeUndefined()
  expect(result.probeErrors.some(e => e.includes('daemon-console.log') && e.includes('共享鎖'))).toBe(true)
})

test('adng-daemons.cmd：純 ASCII 薄殼，委派 supervise，無 inline 判活', () => {
  const cmdPath = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'scripts', 'adng-daemons.cmd')
  const content = readFileSync(cmdPath, 'utf8')
  // hard rule 7: pure ASCII
  expect(content).not.toMatch(/[^\x00-\x7F]/)
  // executable lines only (strip REM comments)
  const code = content
    .split(/\r?\n/)
    .filter(line => {
      const t = line.trim()
      return t.length > 0 && !t.startsWith('REM')
    })
    .join('\n')
  // delegates to TS supervise entry
  expect(code).toMatch(/supervise\s+--configs-dir/)
  expect(code).toMatch(/dist\\cli\.js/)
  // no legacy inline liveness batch logic in executable body
  expect(code).not.toMatch(/tasklist/i)
  expect(code).not.toMatch(/pid\.json/i)
  expect(code).not.toMatch(/ALIVE/i)
  expect(code).not.toMatch(/start "" \/b/i)
  expect(code).not.toMatch(/for %%F/i)
})
