/**
 * 整合測試（真實暫存目錄 + 注入 runCommand）：
 * lock 讀取、tasklist、子進程查詢失敗 → keep，且不 taskkill、不啟動第二個 daemon。
 *
 * heartbeat stat 的非 ENOENT I/O 失敗需注入 fs 錯誤碼，見同目錄
 * `io-fail-open.test.ts`（與 lock-stat 一併以 mock 邊界完整覆蓋）。
 *
 * 基準與失敗案例共用「stale heartbeat + 無 child」布局；
 * 探測全成功時應 reap，以對照 fail-open 的 keep。
 *
 * 每測獨立 mkdtemp，避免共享工作區污染（L017）。
 */
import { mkdirSync, mkdtempSync, writeFileSync, utimesSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { superviseConfig } from '../../src/supervisor/supervise.js'

const PID = 4_201
const STALE_MS = 60_000

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

function writePid(dataDir: string, pid: number): void {
  const lockDir = join(dataDir, 'daemon.lock')
  mkdirSync(lockDir, { recursive: true })
  writeFileSync(join(lockDir, 'pid.json'), JSON.stringify({ pid }))
}

/** 寫入過期 heartbeat，探測成功時會觸發 reap 條件之一。 */
function writeStaleHeartbeat(dataDir: string, nowMs: number): void {
  const heartbeat = join(dataDir, 'heartbeat.json')
  writeFileSync(heartbeat, '{}')
  utimesSync(heartbeat, new Date(nowMs - STALE_MS * 2), new Date(nowMs - STALE_MS * 2))
}

type FailureKind = 'none' | 'lock-read' | 'tasklist' | 'child-process'

interface RunResult {
  result: ReturnType<typeof superviseConfig>
  commands: string[]
  commandLines: string[]
  launchCalls: number
}

function runIntegration(kind: FailureKind): RunResult {
  const root = mkdtempSync(join(tmpdir(), `adng-io-fail-int-${kind}-`))
  const { configPath, dataDir } = writeConfig(root)
  const nowMs = Date.now()

  if (kind === 'lock-read') {
    // 真實 FS：lock 目錄在，但 pid.json 是目錄 → readFileSync 失敗
    const lockDir = join(dataDir, 'daemon.lock')
    mkdirSync(lockDir, { recursive: true })
    mkdirSync(join(lockDir, 'pid.json'))
  } else {
    writePid(dataDir, PID)
  }
  writeStaleHeartbeat(dataDir, nowMs)

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
        if (kind === 'tasklist') {
          const err = new Error('EIO') as NodeJS.ErrnoException
          err.code = 'EIO'
          throw err
        }
        return `"node.exe","${PID}","Console","1","1,000 K"\r\n`
      }
      if (kind === 'child-process') {
        const err = new Error('EIO') as NodeJS.ErrnoException
        err.code = 'EIO'
        throw err
      }
      return '0\r\n'
    },
    launch: () => {
      launchCalls += 1
      return 8_001
    },
  })

  return { result, commands, commandLines, launchCalls }
}

test('整合基準：探測成功 + stale + 無 child → reap 並 taskkill + launch', () => {
  const { result, commands, commandLines, launchCalls } = runIntegration('none')

  expect(result.action).toBe('reap')
  expect(result.probeErrors).toEqual([])
  expect(commands).toContain('taskkill')
  expect(commandLines.some(line => line.includes(`taskkill /PID ${PID} /T /F`))).toBe(true)
  expect(launchCalls).toBe(1)
  expect(result.launchedPid).toBe(8_001)
})

const FAILURE_CASES: Array<{ name: string; kind: Exclude<FailureKind, 'none'>; errorNeedle: string }> = [
  { name: 'lock pid 讀取失敗', kind: 'lock-read', errorNeedle: 'lock:' },
  { name: 'tasklist 命令失敗', kind: 'tasklist', errorNeedle: 'tasklist:' },
  { name: '子進程查詢失敗', kind: 'child-process', errorNeedle: 'child-process:' },
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
