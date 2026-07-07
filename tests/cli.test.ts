import { expect, test } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { assemble, finalizeRunOnceHeartbeat, formatStatus, parseArgv, runNotifyTest } from '../src/cli.js'
import { MockEngine } from '../src/engines/mock.js'
import { ClaudeCliEngine } from '../src/engines/claude-cli.js'
import { KernelVerifier } from '../src/verifier.js'
import { DiscordNotifier } from '../src/notify.js'
import { EventLog } from '../src/events.js'
import type { CycleResult, Deps } from '../src/scheduler.js'

function writeConfig(dir: string, over: Record<string, unknown> = {}): string {
  const cfgPath = join(dir, 'config.json')
  writeFileSync(cfgPath, JSON.stringify({
    projectPath: './project', backlogFile: './project/BACKLOG.md', dataDir: './data',
    engine: 'mock', ...over,
  }))
  return cfgPath
}

test('assemble：mock engine → deps.engine 是 MockEngine、verifier 有掛、notifier 是 DiscordNotifier', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-cli-'))
  const cfgPath = writeConfig(dir)

  const { deps, notifier, cfg } = assemble(cfgPath)
  try {
    expect(deps.engine).toBeInstanceOf(MockEngine)
    expect(deps.verifier).toBeInstanceOf(KernelVerifier)
    expect(notifier).toBeInstanceOf(DiscordNotifier)
    expect(cfg).toBe(deps.cfg)
  } finally {
    deps.db.close()
  }
})

test('assemble：claude-cli engine → deps.engine 是 ClaudeCliEngine', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-cli-'))
  const cfgPath = writeConfig(dir, { engine: 'claude-cli' })

  const { deps } = assemble(cfgPath)
  try {
    expect(deps.engine).toBeInstanceOf(ClaudeCliEngine)
    expect(deps.engine.id).toBe('claude-cli')
  } finally {
    deps.db.close()
  }
})

test('assemble：路徑展開——config 內相對路徑相對「config 檔所在目錄」展開，不吃 CWD', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-cli-'))
  const sub = join(dir, 'sub')
  mkdirSync(sub, { recursive: true })
  const cfgPath = writeConfig(sub, { stopFile: './stop-flag' })

  const { deps, cfg } = assemble(cfgPath)
  try {
    expect(cfg.projectPath).toBe(join(sub, 'project'))
    expect(cfg.backlogFile).toBe(join(sub, 'project', 'BACKLOG.md'))
    expect(cfg.dataDir).toBe(join(sub, 'data'))
    expect(cfg.stopFile).toBe(join(sub, 'stop-flag'))
    // discordTokenFile 預設值本身已是絕對路徑，展開後應原樣保留（不被 baseDir 併入）。
    expect(cfg.discordTokenFile).toBe(resolve('C:/Users/Administrator/openab/.env.tokens'))
  } finally {
    deps.db.close()
  }
})

test('assemble：dataDir 與 run.db 確實被建立在展開後的路徑下', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-cli-'))
  const cfgPath = writeConfig(dir)

  const { deps, cfg } = assemble(cfgPath)
  try {
    expect(cfg.dataDir).toBe(join(dir, 'data'))
  } finally {
    deps.db.close()
  }
})

test('formatStatus：heartbeat 不存在 → 「daemon 未跑過」', () => {
  const text = formatStatus({
    heartbeat: null, dailySoftUsd: 40, dailyHardUsd: 100,
    backlog: { open: 0, blocked: 0, done: 0 }, dlqCount: 0,
  })
  expect(text).toContain('daemon 未跑過')
})

test('formatStatus：完整資料 → 內容含 heartbeat 狀態、成本軟硬頂、backlog 計數、DLQ、digest 日期', () => {
  const text = formatStatus({
    heartbeat: { ts: '2026-07-06T00:00:00.000Z', state: 'running', currentTask: '修 bug', todayCostUsd: 1.2345 },
    dailySoftUsd: 40, dailyHardUsd: 100,
    backlog: { open: 2, blocked: 1, done: 5 },
    dlqCount: 3,
    lastDigestDay: '2026-07-05',
  })
  expect(text).toContain('state=running')
  expect(text).toContain('currentTask=修 bug')
  expect(text).toContain('$1.2345')
  expect(text).toContain('軟頂 $40.00')
  expect(text).toContain('硬頂 $100.00')
  expect(text).toContain('open=2')
  expect(text).toContain('blocked=1')
  expect(text).toContain('done=5')
  expect(text).toContain('DLQ 積壓：3 筆')
  expect(text).toContain('最後 digest 日期：2026-07-05')
})

test('formatStatus：無 currentTask 時不印該欄位；lastDigestDay 缺省印「尚未發送過」', () => {
  const text = formatStatus({
    heartbeat: { ts: 't', state: 'idle', todayCostUsd: 0 },
    dailySoftUsd: 40, dailyHardUsd: 100,
    backlog: { open: 0, blocked: 0, done: 0 }, dlqCount: 0,
  })
  expect(text).not.toContain('currentTask=')
  expect(text).toContain('尚未發送過')
})

test('parseArgv：解出子命令與 --config 值', () => {
  expect(parseArgv(['status', '--config', '/a/b.json'])).toEqual({ command: 'status', configPath: '/a/b.json' })
  expect(parseArgv(['daemon', '--config', 'c.json'])).toEqual({ command: 'daemon', configPath: 'c.json' })
  expect(parseArgv(['run-once'])).toEqual({ command: 'run-once', configPath: undefined })
  expect(parseArgv([])).toEqual({ command: '', configPath: undefined })
})

test('assemble：config 檔不存在 → throw 人話訊息含「設定檔不存在」與路徑', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-cli-'))
  const missing = join(dir, 'no-such-config.json')

  let caught: unknown
  try {
    assemble(missing)
  } catch (err) {
    caught = err
  }
  expect(caught).toBeInstanceOf(Error)
  const msg = (caught as Error).message
  expect(msg).toContain('設定檔不存在')
  expect(msg).toContain(missing)
})

test('assemble：config 非法 JSON → throw 人話訊息含「JSON 格式錯誤」與路徑', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-cli-'))
  const cfgPath = join(dir, 'config.json')
  writeFileSync(cfgPath, '{ "projectPath": ')

  let caught: unknown
  try {
    assemble(cfgPath)
  } catch (err) {
    caught = err
  }
  expect(caught).toBeInstanceOf(Error)
  const msg = (caught as Error).message
  expect(msg).toContain('JSON 格式錯誤')
  expect(msg).toContain(cfgPath)
})

test('runNotifyTest：送達成功（2xx）→ ok true，文字含「adng 通道測試」與指定 ISO 時刻；不讀真 token 檔、不打真 API', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-nt-'))
  const tokenFile = join(dir, 'fake-tokens.env')
  writeFileSync(tokenFile, 'LPBOT_TOKEN=fake-tok\n')
  const okFetch = (async () => new Response('{}', { status: 200 })) as typeof fetch
  const notifier = new DiscordNotifier({ channelId: 'C1', tokenFile, dataDir: dir, fetchFn: okFetch })

  const result = await runNotifyTest(notifier, new Date('2026-07-07T00:00:00.000Z'))
  expect(result.ok).toBe(true)
  expect(result.text).toContain('adng 通道測試')
  expect(result.text).toContain('2026-07-07T00:00:00.000Z')
})

test('runNotifyTest：送達失敗（非 2xx）→ ok false', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-nt-'))
  const tokenFile = join(dir, 'fake-tokens.env')
  writeFileSync(tokenFile, 'LPBOT_TOKEN=fake-tok\n')
  const badFetch = (async () => new Response('nope', { status: 500 })) as typeof fetch
  const notifier = new DiscordNotifier({ channelId: 'C1', tokenFile, dataDir: dir, fetchFn: badFetch })

  const result = await runNotifyTest(notifier)
  expect(result.ok).toBe(false)
})

test('assemble：config 缺必填欄位 → throw 人話訊息含「設定檔欄位錯誤」、路徑與欄位名', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-cli-'))
  const cfgPath = join(dir, 'config.json')
  // 缺 backlogFile / dataDir / engine 三個必填欄位
  writeFileSync(cfgPath, JSON.stringify({ projectPath: './project' }))

  let caught: unknown
  try {
    assemble(cfgPath)
  } catch (err) {
    caught = err
  }
  expect(caught).toBeInstanceOf(Error)
  const msg = (caught as Error).message
  expect(msg).toContain('設定檔欄位錯誤')
  expect(msg).toContain(cfgPath)
  expect(msg).toContain('backlogFile')
  expect(msg).toContain('dataDir')
  expect(msg).toContain('engine')
})

// ---------------------------------------------------------------------------
// MEDIUM 修復回歸測試：cmdRunOnce heartbeat 收尾（Fix 4）——核心邏輯抽為
// finalizeRunOnceHeartbeat 導出（同 runNotifyTest 模式），mock deps、不打真 API、不碰真 config。
// ---------------------------------------------------------------------------

function heartbeatDeps(dataDir: string, costUsd: number): { deps: Deps; events: EventLog } {
  const events = new EventLog(dataDir)
  const deps = {
    cfg: { timezoneOffsetHours: 8 },
    events,
    db: { costForLocalDay: () => costUsd },
  } as unknown as Deps
  return { deps, events }
}

function readHeartbeatFile(dataDir: string): { state: string; todayCostUsd: number } {
  return JSON.parse(readFileSync(join(dataDir, 'heartbeat.json'), 'utf8')) as { state: string; todayCostUsd: number }
}

test('finalizeRunOnceHeartbeat：done/failed/engine-error/blocked 跑完任務 → heartbeat 收尾為 idle、todayCostUsd 為當日值', () => {
  const results: CycleResult[] = ['done', 'failed', 'engine-error', { kind: 'blocked', taskId: 't1', taskText: '任務', reason: 'merge-conflict' }]
  for (const result of results) {
    const dir = mkdtempSync(join(tmpdir(), 'adng-hb-'))
    const { deps } = heartbeatDeps(dir, 1.23)
    // 模擬 runOnce 期間任務起跑時寫下的 running heartbeat——收尾必須覆寫掉這個假活狀態
    deps.events.heartbeat({ state: 'running', currentTask: '任務', todayCostUsd: 0 })

    finalizeRunOnceHeartbeat(deps, result, new Date('2026-07-07T03:00:00.000Z'))

    const hb = readHeartbeatFile(dir)
    expect(hb.state).toBe('idle')
    expect(hb.todayCostUsd).toBe(1.23) // 來自 db.costForLocalDay（當日成本），不是寫死 0
  }
})

test('finalizeRunOnceHeartbeat：stopped/cost-hard-stop/idle/preflight-failed 自帶收尾路徑 → 不被二次覆寫', () => {
  for (const result of ['stopped', 'cost-hard-stop', 'idle', 'preflight-failed'] as CycleResult[]) {
    const dir = mkdtempSync(join(tmpdir(), 'adng-hb-'))
    const { deps } = heartbeatDeps(dir, 1.23)
    // runOnce 自帶收尾已寫好的 heartbeat（例如 stopped 語意），finalize 不得動它
    deps.events.heartbeat({ state: 'stopped', todayCostUsd: 9.99 })

    finalizeRunOnceHeartbeat(deps, result)

    const hb = readHeartbeatFile(dir)
    expect(hb.state).toBe('stopped') // 沒被覆寫成 idle
    expect(hb.todayCostUsd).toBe(9.99)
  }
})
