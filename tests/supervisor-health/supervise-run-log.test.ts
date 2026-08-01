import { afterEach, expect, test, vi } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { cmdSupervise } from '../../src/cli/supervise.js'
import { appendSuperviseRun, superviseRunLogPath } from '../../src/supervisor/run-log.js'

afterEach(() => {
  vi.restoreAllMocks()
  process.exitCode = undefined
})

function readOnlyRecord(logPath: string): Record<string, unknown> {
  const lines = readFileSync(logPath, 'utf8').trim().split('\n')
  expect(lines).toHaveLength(1)
  return JSON.parse(lines[0]!) as Record<string, unknown>
}

test('supervise 正常結束時追加可解析的共用執行紀錄', async () => {
  const root = mkdtempSync(join(process.cwd(), '.tmp-adng-supervise-run-log-'))
  const configsDir = join(root, 'configs')
  mkdirSync(configsDir)
  try {
    await cmdSupervise('cli.js', undefined, configsDir, 'off')

    const record = readOnlyRecord(superviseRunLogPath(undefined, configsDir))
    expect(Date.parse(record.timestamp as string)).toBeGreaterThan(0)
    expect(record.durationMs).toEqual(expect.any(Number))
    expect(record.projects).toEqual([])
    expect(record).not.toHaveProperty('error')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('正常專案決策會記下 decision 與 launchedPid', () => {
  const root = mkdtempSync(join(process.cwd(), '.tmp-adng-supervise-run-log-'))
  const logPath = join(root, 'data', 'supervise-runs.log')
  try {
    appendSuperviseRun(logPath, Date.now(), [{
      configPath: join(root, 'configs', 'demo.json'),
      dataDir: join(root, 'project.data'),
      lockPresent: false,
      pid: null,
      pidAlive: false,
      heartbeatAgeMs: null,
      childCount: 0,
      staleThresholdMs: 60_000,
      wedgeHardCapMs: 600_000,
      action: 'launch',
      launchedPid: 42_001,
      probeErrors: [],
    }])

    expect(readOnlyRecord(logPath).projects).toEqual([{
      configPath: join(root, 'configs', 'demo.json'), decision: 'launch', launchedPid: 42_001,
    }])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('supervise 拋錯時先追加含 stack 的可解析紀錄再以非零碼結束', async () => {
  const root = mkdtempSync(join(process.cwd(), '.tmp-adng-supervise-run-log-'))
  const missingConfigsDir = join(root, 'missing-configs')
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  try {
    await cmdSupervise('cli.js', undefined, missingConfigsDir, 'off')

    const record = readOnlyRecord(superviseRunLogPath(undefined, missingConfigsDir))
    expect(record.projects).toEqual([])
    expect(record.error).toMatchObject({ message: expect.stringContaining('ENOENT'), stack: expect.stringContaining('ENOENT') })
    expect(process.exitCode).toBe(1)
    expect(error).toHaveBeenCalledOnce()
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
