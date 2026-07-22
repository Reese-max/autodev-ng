import { expect, test } from 'vitest'
import { mkdirSync, mkdtempSync, statSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import {
  countChildProcesses,
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

test('supervisor 使用 config 的 staleThresholdMs', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-supervise-config-'))
  const { configPath, dataDir } = writeConfig(root, 'threshold.json', { staleThresholdMs: 60_000 })
  writePid(dataDir, 43)
  const heartbeat = join(dataDir, 'heartbeat.json')
  writeFileSync(heartbeat, '{}')
  const nowMs = Date.now()
  utimesSync(heartbeat, new Date(nowMs - 120_000), new Date(nowMs - 120_000))

  const result = superviseConfig(configPath, {
    nowMs,
    runCommand: aliveRunner(43),
    launch: () => 7001,
    reap: () => undefined,
  })

  expect(result.action).toBe('reap')
})

test('launch／keep／reap 三決策接線；reap 完成後立即補啟 daemon', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-supervise-actions-'))
  const launchCfg = writeConfig(root, 'launch.json')
  writePid(launchCfg.dataDir, 41)
  const effects: string[] = []
  const launch = (configPath: string): number => {
    effects.push(`launch:${basename(configPath)}`)
    return 7000 + effects.length
  }
  const reap = (pid: number): void => { effects.push(`reap:${pid}`) }

  const launched = superviseConfig(launchCfg.configPath, {
    runCommand: command => command === 'tasklist' ? 'INFO: No tasks are running which match the specified criteria.' : '0',
    launch,
    reap,
  })
  expect(launched.action).toBe('launch')
  expect(effects).toEqual(['launch:launch.json'])

  const keepCfg = writeConfig(root, 'keep.json')
  writePid(keepCfg.dataDir, 42)
  const kept = superviseConfig(keepCfg.configPath, {
    runCommand: aliveRunner(42),
    launch,
    reap,
  })
  expect(kept.action).toBe('keep')
  expect(effects).toEqual(['launch:launch.json'])

  const reapCfg = writeConfig(root, 'reap.json')
  writePid(reapCfg.dataDir, 43)
  const heartbeat = join(reapCfg.dataDir, 'heartbeat.json')
  writeFileSync(heartbeat, '{}')
  const nowMs = Date.now()
  utimesSync(heartbeat, new Date(nowMs - 120_000), new Date(nowMs - 120_000))
  const reapProbe = aliveRunner(43)
  const reaped = superviseConfig(reapCfg.configPath, {
    nowMs,
    staleThresholdMs: 60_000,
    runCommand: (command, args) => {
      if (command === 'taskkill') {
        effects.push(`taskkill:${args.join(' ')}`)
        return ''
      }
      return reapProbe(command, args)
    },
    launch,
  })
  expect(reaped.action).toBe('reap')
  expect(effects).toEqual(['launch:launch.json', 'taskkill:/PID 43 /T /F', 'launch:reap.json'])
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
