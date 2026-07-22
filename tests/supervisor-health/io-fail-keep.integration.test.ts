/**
 * 整合測試（真實暫存目錄 + 注入 runCommand / 局部 fs 失敗）：
 * lock、heartbeat、PID 身分檢查（tasklist）、子進程查詢的每個
 * 讀取／解析／命令失敗路徑 → action=keep，且絕不 taskkill、不啟動第二個 daemon。
 *
 * 基準與失敗案例共用「stale heartbeat + 無 child」布局；
 * 探測全成功時應 reap，以對照 fail-open 的 keep。
 *
 * 每測獨立 mkdtemp，避免共享工作區污染（L017）。
 * lock-stat／heartbeat-stat／heartbeat-mtime 以 importOriginal 局部 mock 注入，
 * 其餘路徑維持真實 fs（風格鏡像 lock-pidfile-cleanup / events-rotate-failure）。
 */
import { beforeEach, expect, test, vi } from 'vitest'
import { mkdirSync, mkdtempSync, writeFileSync, utimesSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const { statSyncMock } = vi.hoisted(() => ({
  statSyncMock: vi.fn(),
}))

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  statSyncMock.mockImplementation(actual.statSync)
  return {
    ...actual,
    statSync: statSyncMock,
  }
})

const { superviseConfig } = await import('../../src/supervisor/supervise.js')

const PID = 4_201
const STALE_MS = 60_000

function errorWithCode(code: string, message = code): NodeJS.ErrnoException {
  const error = new Error(message) as NodeJS.ErrnoException
  error.code = code
  return error
}

async function resetFsMocksToActual(): Promise<void> {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs')
  statSyncMock.mockReset()
  statSyncMock.mockImplementation(actual.statSync)
}

function writeConfig(root: string): { configPath: string; dataDir: string } {
  const configPath = join(root, 'project.json')
  const dataDir = join(root, 'project.data')
  writeFileSync(configPath, JSON.stringify({
    projectPath: './project',
    backlogFile: './BACKLOG.md',
    dataDir: './project.data',
    engine: 'mock',
  }))
  mkdirSync(dataDir, { recursive: true })
  return { configPath, dataDir }
}

function writePid(dataDir: string, pid: number, raw?: string): void {
  const lockDir = join(dataDir, 'daemon.lock')
  mkdirSync(lockDir, { recursive: true })
  if (raw !== undefined) {
    writeFileSync(join(lockDir, 'pid.json'), raw)
    return
  }
  writeFileSync(join(lockDir, 'pid.json'), JSON.stringify({ pid }))
}

/** 寫入過期 heartbeat，探測成功時會觸發 reap 條件之一。 */
function writeStaleHeartbeat(dataDir: string, nowMs: number): void {
  const heartbeat = join(dataDir, 'heartbeat.json')
  writeFileSync(heartbeat, '{}')
  utimesSync(heartbeat, new Date(nowMs - STALE_MS * 2), new Date(nowMs - STALE_MS * 2))
}

/**
 * 失敗路徑（對齊 supervise.ts 各 probe 出口）：
 * - lock-stat / lock-read / lock-parse / lock-invalid-pid
 * - heartbeat-stat / heartbeat-mtime
 * - tasklist（PID 身分檢查命令失敗）
 * - child-process（powershell+wmic 皆失敗）
 */
type FailureKind =
  | 'none'
  | 'lock-stat'
  | 'lock-read'
  | 'lock-parse'
  | 'lock-invalid-pid'
  | 'heartbeat-stat'
  | 'heartbeat-mtime'
  | 'tasklist'
  | 'child-process'

interface RunResult {
  result: ReturnType<typeof superviseConfig>
  commands: string[]
  commandLines: string[]
  launchCalls: number
}

function isLockDirPath(path: string): boolean {
  return /[\\/]daemon\.lock$/.test(path)
}

function isHeartbeatPath(path: string): boolean {
  return /[\\/]heartbeat\.json$/.test(path)
}

function runIntegration(kind: FailureKind): RunResult {
  const root = mkdtempSync(join(tmpdir(), `adng-io-fail-int-${kind}-`))
  const { configPath, dataDir } = writeConfig(root)
  const nowMs = Date.now()
  const lockDir = join(dataDir, 'daemon.lock')

  // --- 佈局：依失敗類型準備真實檔案（能放真實失敗的就不用 mock）---
  if (kind === 'lock-read') {
    // 真實 FS：lock 目錄在，但 pid.json 是目錄 → readFileSync 失敗
    mkdirSync(lockDir, { recursive: true })
    mkdirSync(join(lockDir, 'pid.json'))
  } else if (kind === 'lock-parse') {
    writePid(dataDir, PID, '{not-valid-json')
  } else if (kind === 'lock-invalid-pid') {
    writePid(dataDir, 0) // pid <= 0 → 內容無效
  } else {
    writePid(dataDir, PID)
  }

  writeStaleHeartbeat(dataDir, nowMs)

  // --- 局部 fs 注入（僅無法以真實 FS 穩定重現的非 ENOENT / 非有限 mtime）---
  if (kind === 'lock-stat') {
    const actualStat = statSyncMock.getMockImplementation()!
    statSyncMock.mockImplementation((path, opts) => {
      if (isLockDirPath(String(path))) throw errorWithCode('EIO', 'EIO')
      return actualStat(path as never, opts as never)
    })
  }

  if (kind === 'heartbeat-stat') {
    const actualStat = statSyncMock.getMockImplementation()!
    statSyncMock.mockImplementation((path, opts) => {
      if (isHeartbeatPath(String(path))) throw errorWithCode('EIO', 'EIO')
      return actualStat(path as never, opts as never)
    })
  }

  if (kind === 'heartbeat-mtime') {
    const actualStat = statSyncMock.getMockImplementation()!
    statSyncMock.mockImplementation((path, opts) => {
      if (isHeartbeatPath(String(path))) {
        return { mtimeMs: Number.POSITIVE_INFINITY } as ReturnType<typeof actualStat>
      }
      return actualStat(path as never, opts as never)
    })
  }

  const commands: string[] = []
  const commandLines: string[] = []
  let launchCalls = 0

  const result = superviseConfig(configPath, {
    nowMs,
    staleThresholdMs: STALE_MS,
    // 不覆寫 reap：誤判 reap 時預設會呼叫 taskkill
    runCommand: (command, args) => {
      commands.push(command)
      commandLines.push(`${command} ${args.join(' ')}`)
      if (command === 'taskkill') return ''
      if (command === 'tasklist') {
        if (kind === 'tasklist') throw errorWithCode('EIO', 'EIO')
        return `"node.exe","${PID}","Console","1","1,000 K"\r\n`
      }
      // powershell / wmic 子進程查詢
      if (kind === 'child-process') throw errorWithCode('EIO', 'EIO')
      return '0\r\n'
    },
    launch: () => {
      launchCalls += 1
      return 8_001
    },
  })

  return { result, commands, commandLines, launchCalls }
}

beforeEach(async () => {
  await resetFsMocksToActual()
})

test('整合基準：探測成功 + stale + 無 child → reap 並 taskkill + launch', () => {
  const { result, commands, commandLines, launchCalls } = runIntegration('none')

  expect(result.action).toBe('reap')
  expect(result.probeErrors).toEqual([])
  expect(commands).toContain('taskkill')
  expect(commandLines.some(line => line.includes(`taskkill /PID ${PID} /T /F`))).toBe(true)
  expect(launchCalls).toBe(1)
  expect(result.launchedPid).toBe(8_001)
})

const FAILURE_CASES: Array<{
  name: string
  kind: Exclude<FailureKind, 'none'>
  errorNeedle: string
}> = [
  // lock：stat / 讀取 / JSON 解析 / 內容校驗
  { name: 'lock stat 非 ENOENT I/O 失敗', kind: 'lock-stat', errorNeedle: 'lock:' },
  { name: 'lock pid 讀取失敗', kind: 'lock-read', errorNeedle: 'lock:' },
  { name: 'lock pid JSON 解析失敗', kind: 'lock-parse', errorNeedle: 'lock:' },
  { name: 'lock pid 內容無效', kind: 'lock-invalid-pid', errorNeedle: 'lock: pid.json 內容無效' },
  // heartbeat：stat / mtime 解析
  { name: 'heartbeat stat 非 ENOENT I/O 失敗', kind: 'heartbeat-stat', errorNeedle: 'heartbeat:' },
  { name: 'heartbeat mtime 無效', kind: 'heartbeat-mtime', errorNeedle: 'heartbeat: mtime 無效' },
  // PID 身分檢查（tasklist 命令）
  { name: 'tasklist PID 身分檢查命令失敗', kind: 'tasklist', errorNeedle: 'tasklist:' },
  // 子進程查詢（powershell + wmic）
  { name: '子進程查詢命令失敗', kind: 'child-process', errorNeedle: 'child-process:' },
]

test.each(FAILURE_CASES)(
  '整合：$name → keep，不 taskkill、不啟動第二個 daemon',
  ({ kind, errorNeedle }) => {
    const { result, commands, commandLines, launchCalls } = runIntegration(kind)

    expect(result.action).toBe('keep')
    expect(result.probeErrors.length).toBeGreaterThanOrEqual(1)
    expect(result.probeErrors.some(e => e.includes(errorNeedle))).toBe(true)
    expect(commands).not.toContain('taskkill')
    expect(commandLines.some(line => line.startsWith('taskkill'))).toBe(false)
    expect(launchCalls).toBe(0)
    expect(result.launchedPid).toBeUndefined()
  },
)
