import { expect, test } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { assemble, expandEnvValue, finalizeRunOnceHeartbeat, formatStatus, makeEngineRegistry, parseArgv, runNotifyTest } from '../src/cli.js'
import { ConfigSchema } from '../src/types.js'
import { MockEngine } from '../src/engines/mock.js'
import { ClaudeCliEngine } from '../src/engines/claude-cli.js'
import { CodexEngine } from '../src/engines/codex.js'
import { GrokEngine } from '../src/engines/grok.js'
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

test('assemble：mock engine → registry 以 defaultEngine 解析出 MockEngine、verifier 有掛、notifier 是 DiscordNotifier', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-cli-'))
  const cfgPath = writeConfig(dir)

  const { deps, notifier, cfg } = assemble(cfgPath)
  try {
    // 向後相容硬線：engines 未設時 legacy engine 欄位決定預設 adapter（claude → mock）
    expect(deps.engines.resolve(cfg.defaultEngine)).toBeInstanceOf(MockEngine)
    expect(deps.verifier).toBeInstanceOf(KernelVerifier)
    expect(notifier).toBeInstanceOf(DiscordNotifier)
    expect(cfg).toBe(deps.cfg)
  } finally {
    deps.db.close()
  }
})

test('assemble：claude-cli engine（engines 未設的既有 config）→ registry 解析出 ClaudeCliEngine 且可 cache（同 tag 同實例）', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-cli-'))
  const cfgPath = writeConfig(dir, { engine: 'claude-cli' })

  const { deps, cfg } = assemble(cfgPath)
  try {
    const engine = deps.engines.resolve(cfg.defaultEngine)
    expect(engine).toBeInstanceOf(ClaudeCliEngine)
    expect(engine.id).toBe('claude-cli')
    expect(deps.engines.resolve(cfg.defaultEngine)).toBe(engine) // registry cache：按需建一次
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

// ---------------------------------------------------------------------------
// M5 Task 1：m3 檔位 assemble（{env:VAR} 展開、registry lazy 建與白名單）

test('M5：m3 檔位 assemble——{env:VAR} 於 assemble 層展開成真值進 engine（值不落 config/log）、--model 旗標帶上', () => {
  process.env.ADNG_TEST_MM_KEY = 'sk-fake-m3-key-for-test'
  process.env.ADNG_TEST_MM_BASE = 'http://127.0.0.1:9999/fake'
  process.env.ADNG_TEST_MM_MODEL = 'MiniMax-M3'
  const dir = mkdtempSync(join(tmpdir(), 'adng-cli-m3-'))
  const cfgPath = writeConfig(dir, {
    engine: 'claude-cli',
    engines: {
      claude: { adapter: 'claude-cli' },
      m3: {
        adapter: 'claude-cli', costPerRunUsd: 0.5, model: '{env:ADNG_TEST_MM_MODEL}',
        env: { ANTHROPIC_BASE_URL: '{env:ADNG_TEST_MM_BASE}', ANTHROPIC_AUTH_TOKEN: '{env:ADNG_TEST_MM_KEY}' }
      }
    }
  })
  const { deps } = assemble(cfgPath)
  try {
    const m3 = deps.engines.resolve('m3')
    expect(m3).toBeInstanceOf(ClaudeCliEngine)
    expect(m3.id).toBe('claude-cli:m3') // 觀測面可分辨 m3 檔位
    const inner = m3 as unknown as { env?: Record<string, string>; baseArgs: string[] }
    expect(inner.env).toEqual({
      ANTHROPIC_BASE_URL: 'http://127.0.0.1:9999/fake',
      ANTHROPIC_AUTH_TOKEN: 'sk-fake-m3-key-for-test'
    })
    expect(inner.baseArgs).toContain('--model')
    expect(inner.baseArgs).toContain('MiniMax-M3')
  } finally {
    deps.db.close()
    delete process.env.ADNG_TEST_MM_KEY
    delete process.env.ADNG_TEST_MM_BASE
    delete process.env.ADNG_TEST_MM_MODEL
  }
})

test('M5：{env:VAR} 引用缺失 → resolve 該 tag 才拋錯（lazy：assemble 不炸、其他引擎不受影響），訊息含變數名不含值', () => {
  delete process.env.ADNG_TEST_MISSING_VAR
  const dir = mkdtempSync(join(tmpdir(), 'adng-cli-m3-'))
  const cfgPath = writeConfig(dir, {
    engine: 'claude-cli',
    engines: {
      claude: { adapter: 'claude-cli' },
      m3: { adapter: 'claude-cli', env: { ANTHROPIC_AUTH_TOKEN: '{env:ADNG_TEST_MISSING_VAR}' } }
    }
  })
  const { deps } = assemble(cfgPath) // lazy：沒 resolve 到 m3 前不炸
  try {
    expect(deps.engines.resolve('claude')).toBeInstanceOf(ClaudeCliEngine)
    expect(() => deps.engines.resolve('m3')).toThrow(/ADNG_TEST_MISSING_VAR/)
  } finally {
    deps.db.close()
  }
})

test('M5：registry——白名單外 tag 拋錯；未實作 adapter resolve 時拋「尚未實作」；codex/agy/grok 已接線（Task 3/4/7）', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-cli-m3-'))
  const cfgPath = writeConfig(dir, {
    engine: 'claude-cli',
    engines: {
      claude: { adapter: 'claude-cli' },
      codex: { adapter: 'codex', costPerRunUsd: 1 },
      agy: { adapter: 'agy' },
      grok: { adapter: 'grok', costPerRunUsd: 0.5 },
      qwen: { adapter: 'qwen', costPerRunUsd: 0.5 }
    }
  })
  const { deps } = assemble(cfgPath)
  try {
    expect(() => deps.engines.resolve('zen')).toThrow(/白名單/)
    expect(() => deps.engines.resolve('qwen')).toThrow(/尚未實作/)
    const codex = deps.engines.resolve('codex')
    expect(codex).toBeInstanceOf(CodexEngine)
    expect(codex.id).toBe('codex')
    expect(deps.engines.resolve('agy').id).toBe('agy')
    const grok = deps.engines.resolve('grok')
    expect(grok).toBeInstanceOf(GrokEngine)
    expect(grok.id).toBe('grok')
  } finally {
    deps.db.close()
  }
})

test('M5：expandEnvValue——字串內嵌展開、多引用、無引用原樣、缺失只報變數名', () => {
  process.env.ADNG_TEST_EXP = 'val-123'
  try {
    expect(expandEnvValue('{env:ADNG_TEST_EXP}')).toBe('val-123')
    expect(expandEnvValue('Bearer {env:ADNG_TEST_EXP}/{env:ADNG_TEST_EXP}')).toBe('Bearer val-123/val-123')
    expect(expandEnvValue('無引用原樣')).toBe('無引用原樣')
    delete process.env.ADNG_TEST_NOPE
    expect(() => expandEnvValue('{env:ADNG_TEST_NOPE}')).toThrow(/ADNG_TEST_NOPE/)
  } finally {
    delete process.env.ADNG_TEST_EXP
  }
})

test('M5：既有 configs/voice-actress.json（真檔）schema 全過——engines 白名單含 claude/m3、不含 zen；registry lazy 不碰 m3 就不需要 MINIMAX_*', () => {
  // 不走 assemble：避免測試打開真 dataDir 的 run.db（可能與跑中的 daemon 打架）。
  // schema 驗證＋registry（dataDir 換 temp）已覆蓋「真檔能跑」的組裝面。
  const realCfgPath = resolve(import.meta.dirname, '..', 'configs', 'voice-actress.json')
  const cfg = ConfigSchema.parse(JSON.parse(readFileSync(realCfgPath, 'utf8')))
  expect(cfg.defaultEngine).toBe('claude')
  expect(Object.keys(cfg.engines)).toEqual(['claude', 'm3'])
  expect(cfg.engines['zen']).toBeUndefined() // opencode zen 明文禁派 voice-actress
  const registry = makeEngineRegistry({ ...cfg, dataDir: mkdtempSync(join(tmpdir(), 'adng-va-')) })
  expect(registry.resolve('claude')).toBeInstanceOf(ClaudeCliEngine) // lazy：不 resolve m3 不需要 MINIMAX env
})
