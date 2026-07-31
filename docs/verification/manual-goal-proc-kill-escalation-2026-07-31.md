# manual-goal-proc-kill-escalation 驗證原始紀錄（2026-07-31）

## 範圍與可重放命令

本紀錄保存 `tests/manual-goal-proc-kill-escalation.test.ts` 在本次驗證時的完整原始碼快照，以及逐案例的 Vitest 原始輸出。執行時沒有啟動 daemon 或常駐 Node 程序，亦未讀寫 `configs/`、`scripts/`、`data/`。

原始碼 SHA-256：`FA2364050EAEA46745E37EB2F334B5DF11DEC7BFC75D7CC13F95AB3EB244F7E2`（下方快照已逐字比對目標測試檔）。

```text
npx vitest run tests/manual-goal-proc-kill-escalation.test.ts --reporter=verbose --no-color
```

## 覆蓋確認

共 13 個案例，且不是空斷言或只斷言 mock 回傳值：

| 範圍 | 案例數 | 實際被測行為 |
| --- | ---: | --- |
| idle 端到端收割 | 1 | 真實執行 `runProcess` 的 idle timer、`killTree` 呼叫路徑與 `ProcResult.timeoutReason` 組裝；只在 `spawn` 這個 OS 邊界替換 child，以避免建立真實子程序。 |
| `timeoutReason=idle` | 1 | 上述案例斷言 `timedOut: true`、`timeoutReason: 'idle'` 與 timeout 後 close 的完成路徑。 |
| timeout／idle schema 合法與非法組合 | 7 | 真實呼叫 `ConfigSchema.safeParse`，驗證 Zod refine 的 3 個合法與 4 個非法組合。 |
| Windows kill escalation／zombie 事件 | 1 | 真實執行 `killTree` 的 taskkill 後驗活、葉到根 fallback 與 `proc-zombie` 寫入；OS kill、等待與存活探測以注入依賴隔離。 |
| 非 Windows kill 路徑 | 1 | 真實執行 `killTree` 的非 Windows 分支，確認注入 kill 優先於全域 `process.kill`。 |
| 看門狗三態 | 3 | 真實執行 `superviseConfig`、鎖檔／heartbeat／events.jsonl 的 repo 內暫存檔 I/O 與狀態決策；只有 `tasklist`／PowerShell 探測及 reap／launch 外部副作用以注入函式隔離。 |

## 完整測試原始碼快照

```ts
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
    processTree: [
      { pid: 40, command: 'root.exe' },
      { pid: 41, parentPid: 40, command: 'child.exe' },
      { pid: 42, parentPid: 41, command: 'leaf.exe' },
    ],
    events: { append: (type, data) => events.push({ type, data }) },
    deps: {
      platform: 'win32',
      taskkill: async pid => { calls.push(`taskkill:${pid}`) },
      wait: async ms => { calls.push(`wait:${ms}`) },
      isAlive: pid => { calls.push(`alive:${pid}`); return alive.has(pid) },
      kill: pid => {
        calls.push(`kill:${pid}`)
        if (pid === 42) alive.delete(pid)
      },
    },
  })

  expect(calls).toEqual([
    'taskkill:40', 'wait:2000', 'alive:40',
    'kill:42', 'alive:42', 'kill:41', 'alive:41', 'kill:40', 'alive:40',
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

```

## 逐案例原始輸出

```text

 RUN  v4.1.9 D:/Users/Administrator/Desktop/autodev-ng/data/autodev-self/worktrees/180c76fc

 ✓ tests/manual-goal-proc-kill-escalation.test.ts > idle 收割透過 spawn mock 回傳 timeoutReason=idle，不啟動真實子進程 7ms
 ✓ tests/manual-goal-proc-kill-escalation.test.ts > timeout／idle schema 組合 > '停用 wall 且有 idle 護欄' => valid=true 4ms
 ✓ tests/manual-goal-proc-kill-escalation.test.ts > timeout／idle schema 組合 > 'wall 超過兩小時且有 idle 護欄' => valid=true 0ms
 ✓ tests/manual-goal-proc-kill-escalation.test.ts > timeout／idle schema 組合 > 'wall 剛好兩小時且未設 idle' => valid=true 0ms
 ✓ tests/manual-goal-proc-kill-escalation.test.ts > timeout／idle schema 組合 > '停用 wall 且未設 idle' => valid=false 1ms
 ✓ tests/manual-goal-proc-kill-escalation.test.ts > timeout／idle schema 組合 > '停用 wall 且 idle 也停用' => valid=false 0ms
 ✓ tests/manual-goal-proc-kill-escalation.test.ts > timeout／idle schema 組合 > 'wall 超過兩小時且未設 idle' => valid=false 0ms
 ✓ tests/manual-goal-proc-kill-escalation.test.ts > timeout／idle schema 組合 > 'wall 超過兩小時且 idle 停用' => valid=false 0ms
 ✓ tests/manual-goal-proc-kill-escalation.test.ts > taskkill 未能終止程序時逐 PID 由葉至根補殺，仍存活者寫 zombie 事件 1ms
 ✓ tests/manual-goal-proc-kill-escalation.test.ts > 非 Windows killTree 有注入 kill 時不再呼叫全域 process.kill 1ms
 ✓ tests/manual-goal-proc-kill-escalation.test.ts > daemon 三態：'heartbeat 新鮮' => 'keep' 12ms
 ✓ tests/manual-goal-proc-kill-escalation.test.ts > daemon 三態：'heartbeat 逾期' => 'reap' 34ms
 ✓ tests/manual-goal-proc-kill-escalation.test.ts > daemon 三態：'PID 死亡' => 'launch' 11ms

 Test Files  1 passed (1)
      Tests  13 passed (13)
   Start at  14:10:29
   Duration  510ms (transform 101ms, setup 30ms, import 199ms, tests 75ms, environment 0ms)
```
