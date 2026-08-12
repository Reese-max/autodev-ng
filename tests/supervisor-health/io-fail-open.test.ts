/**
 * supervisor I/O fail-open 守門：
 * lock / heartbeat / tasklist / 子進程查詢任一讀取或命令失敗 → action=keep，
 * 且絕不執行 taskkill、不啟動第二個 daemon。
 *
 * 基準情境刻意設為「探測全成功時會 reap」（stale heartbeat + 無 child），
 * 以證明 keep 來自 fail-open，而非 classify 的自然 keep。
 */
import { beforeEach, expect, test, vi } from 'vitest'

const { readFileSync, statSync } = vi.hoisted(() => ({
  readFileSync: vi.fn(),
  statSync: vi.fn(),
}))

vi.mock('node:fs', () => ({
  closeSync: vi.fn(),
  existsSync: vi.fn(() => false),
  mkdirSync: vi.fn(),
  rmSync: vi.fn(),
  openSync: vi.fn(),
  readFileSync,
  readdirSync: vi.fn(),
  statSync,
}))

const { superviseConfig } = await import('../../src/supervisor/supervise.js')

function errorWithCode(code: string): NodeJS.ErrnoException {
  const error = new Error(code) as NodeJS.ErrnoException
  error.code = code
  return error
}

type IoFailure = 'lock-stat' | 'lock-read' | 'heartbeat-stat' | 'tasklist' | 'child-process'

const IO_FAILURES: Array<{ name: string; failure: IoFailure; errorNeedle: string }> = [
  { name: 'lock stat', failure: 'lock-stat', errorNeedle: 'lock:' },
  { name: 'lock pid read', failure: 'lock-read', errorNeedle: 'lock:' },
  { name: 'heartbeat stat', failure: 'heartbeat-stat', errorNeedle: 'heartbeat:' },
  { name: 'tasklist', failure: 'tasklist', errorNeedle: 'tasklist:' },
  { name: 'child process query', failure: 'child-process', errorNeedle: 'child-process:' },
]

const PID = 42
const NOW_MS = 120_000
const STALE_MS = 60_000

beforeEach(() => {
  readFileSync.mockReset()
  statSync.mockReset()
})

function installHealthyFsMocks(options: { lockReadFail?: boolean; lockStatFail?: boolean; heartbeatFail?: boolean } = {}): void {
  readFileSync.mockImplementation((path: string) => {
    if (path.endsWith('config.json')) {
      return JSON.stringify({
        projectPath: './project',
        backlogFile: './BACKLOG.md',
        dataDir: './data',
        engine: 'mock',
      })
    }
    if (options.lockReadFail) throw errorWithCode('EIO')
    return JSON.stringify({ pid: PID })
  })
  statSync.mockImplementation((path: string) => {
    const p = String(path)
    if (p.endsWith('daemon.lock') || p.includes('daemon.lock')) {
      if (options.lockStatFail) throw errorWithCode('EIO')
      return {}
    }
    if (options.heartbeatFail) throw errorWithCode('EIO')
    // mtime 0 → age = NOW_MS > STALE_MS，探測成功時會走 reap
    return { mtimeMs: 0 }
  })
}

interface ProbeFixture {
  result: ReturnType<typeof superviseConfig>
  commands: string[]
  commandLines: string[]
  launchCalls: number
}

function runProbe(failure: IoFailure | 'none'): ProbeFixture {
  installHealthyFsMocks({
    lockStatFail: failure === 'lock-stat',
    lockReadFail: failure === 'lock-read',
    heartbeatFail: failure === 'heartbeat-stat',
  })

  const commands: string[] = []
  const commandLines: string[] = []
  let launchCalls = 0

  const result = superviseConfig('config.json', {
    nowMs: NOW_MS,
    staleThresholdMs: STALE_MS,
    // 不覆寫 reap：若誤判為 reap，預設會走 taskkill → 會寫入 commands
    runCommand: (command, args) => {
      commands.push(command)
      commandLines.push(`${command} ${args.join(' ')}`)
      if (command === 'taskkill') return ''
      if (command === 'tasklist') {
        if (failure === 'tasklist') throw errorWithCode('EIO')
        return `"node.exe","${PID}","Console","1","1,000 K"\r\n`
      }
      // powershell / wmic 子進程查詢
      if (failure === 'child-process') throw errorWithCode('EIO')
      return '0\r\n'
    },
    launch: () => {
      launchCalls += 1
      return 9_001
    },
  })

  return { result, commands, commandLines, launchCalls }
}

test('基準：探測全成功且 heartbeat 過期無 child → reap + taskkill + launch', () => {
  const { result, commands, commandLines, launchCalls } = runProbe('none')

  expect(result.action).toBe('reap')
  expect(result.probeErrors).toEqual([])
  expect(commands).toContain('taskkill')
  expect(commandLines.some(line => line.includes(`taskkill /PID ${PID} /T /F`))).toBe(true)
  expect(launchCalls).toBe(1)
  expect(result.launchedPid).toBe(9_001)
})

test.each(IO_FAILURES)(
  '$name I/O 失敗時 fail-open keep，不 taskkill、不啟動第二個 daemon',
  ({ failure, errorNeedle }) => {
    const { result, commands, commandLines, launchCalls } = runProbe(failure)

    expect(result.action).toBe('keep')
    expect(result.probeErrors.length).toBeGreaterThanOrEqual(1)
    expect(result.probeErrors.some(e => e.includes(errorNeedle) && e.includes('EIO'))).toBe(true)
    expect(commands).not.toContain('taskkill')
    expect(commandLines.some(line => line.startsWith('taskkill'))).toBe(false)
    expect(launchCalls).toBe(0)
    expect(result.launchedPid).toBeUndefined()
  },
)

test('heartbeat mtime 非有限值時 fail-open keep，不誤啟動 daemon', () => {
  readFileSync.mockReturnValue(JSON.stringify({
    projectPath: './project',
    backlogFile: './BACKLOG.md',
    dataDir: './data',
    engine: 'mock',
  }))
  statSync.mockImplementation((path: string) => {
    if (String(path).endsWith('daemon.lock')) throw errorWithCode('ENOENT')
    return { mtimeMs: Number.POSITIVE_INFINITY }
  })

  const launch = vi.fn(() => 9_001)
  const result = superviseConfig('config.json', { nowMs: NOW_MS, launch })

  expect(result.action).toBe('keep')
  expect(result.probeErrors).toEqual(['heartbeat: mtime 無效'])
  expect(launch).not.toHaveBeenCalled()
})
