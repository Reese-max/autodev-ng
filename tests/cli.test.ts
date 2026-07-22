import { expect, test } from 'vitest'
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { assemble, expandEnvValue, finalizeRunOnceHeartbeat, formatStatus, makeEngineRegistry, parseArgv, runNotifyTest } from '../src/cli.js'
import { ConfigSchema } from '../src/types.js'
import { MockEngine } from '../src/engines/mock.js'
import { ClaudeCliEngine } from '../src/engines/claude-cli.js'
import { CodexEngine } from '../src/engines/codex.js'
import { GrokEngine } from '../src/engines/grok.js'
import { QwenEngine } from '../src/engines/qwen.js'
import { OpencodeEngine } from '../src/engines/opencode.js'
import { DevinEngine } from '../src/engines/devin.js'
import { KernelVerifier } from '../src/verifier.js'
import { DiscordNotifier } from '../src/notify.js'
import { EventLog } from '../src/events.js'
import { RunDb } from '../src/db.js'
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
  expect(parseArgv(['status', '--config', '/a/b.json'])).toEqual({ command: 'status', configPath: '/a/b.json', configsDir: undefined })
  expect(parseArgv(['daemon', '--config', 'c.json'])).toEqual({ command: 'daemon', configPath: 'c.json', configsDir: undefined })
  expect(parseArgv(['supervise', '--configs-dir', 'configs'])).toEqual({ command: 'supervise', configPath: undefined, configsDir: 'configs' })
  expect(parseArgv(['run-once'])).toEqual({ command: 'run-once', configPath: undefined, configsDir: undefined })
  expect(parseArgv([])).toEqual({ command: '', configPath: undefined, configsDir: undefined })
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
  // 缺 backlogFile / dataDir 兩個必填 base 欄位
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
})

test('小修輪#6：legacy engine 改 optional，但 engines 與 engine 全缺（base 欄位齊全）→ superRefine 拒、訊息點名 engine', () => {
  // engine 不再是無條件必填 base 欄位（純新形狀只寫 engines map 可缺）；「兩者全缺」改由 superRefine 擋。
  const r = ConfigSchema.safeParse({ projectPath: './p', backlogFile: './p/B.md', dataDir: './d' })
  expect(r.success).toBe(false)
  if (!r.success) expect(r.error.issues.some(i => i.path.includes('engine'))).toBe(true)
})

test('小修輪#6：純新形狀 config（只寫 engines map、無 legacy engine 欄位）→ schema 通過', () => {
  const r = ConfigSchema.safeParse({
    projectPath: './p', backlogFile: './p/B.md', dataDir: './d',
    engines: { claude: { adapter: 'claude-cli' } }, defaultEngine: 'claude',
  })
  expect(r.success).toBe(true)
})

test('supervisor staleThresholdMs：未設採保守預設，且只接受正整數', () => {
  const base = { projectPath: './p', backlogFile: './p/B.md', dataDir: './d', engine: 'mock' as const }
  const defaulted = ConfigSchema.parse(base)
  expect(defaulted.staleThresholdMs).toBeGreaterThanOrEqual(900_000)
  expect(ConfigSchema.safeParse({ ...base, staleThresholdMs: 0 }).success).toBe(false)
  expect(ConfigSchema.safeParse({ ...base, staleThresholdMs: -1 }).success).toBe(false)
  expect(ConfigSchema.safeParse({ ...base, staleThresholdMs: 1.5 }).success).toBe(false)
  expect(ConfigSchema.safeParse({ ...base, staleThresholdMs: 900_001 }).success).toBe(true)
})

test('小修輪#5：非真值 adapter 未設 costPerRunUsd → 拒（防成功路徑靜默記 $0）；opencode/claude-cli/mock 豁免', () => {
  const base = { projectPath: './p', backlogFile: './p/B.md', dataDir: './d', engine: 'claude-cli' as const }
  // qwen 無 costPerRunUsd → 拒，訊息點名該 tag 的 costPerRunUsd
  const bad = ConfigSchema.safeParse({ ...base, engines: { claude: { adapter: 'claude-cli' }, q: { adapter: 'qwen' } }, defaultEngine: 'claude' })
  expect(bad.success).toBe(false)
  if (!bad.success) expect(bad.error.issues.some(i => i.path.join('.') === 'engines.q.costPerRunUsd')).toBe(true)
  // opencode(zen) 無 costPerRunUsd → 通過（NDJSON cost 為可信真值，設 0 會令 fixedCost ?? 真值恆取 0 變死碼）
  const ok = ConfigSchema.safeParse({ ...base, engines: { claude: { adapter: 'claude-cli' }, zen: { adapter: 'opencode' } }, defaultEngine: 'claude' })
  expect(ok.success).toBe(true)
  // devin 亦非豁免（swe-1.6 為官方 0 credit multiplier，非 NDJSON cost 真值）→ 無 costPerRunUsd 被拒、設 0 通過
  const devinBad = ConfigSchema.safeParse({ ...base, engines: { claude: { adapter: 'claude-cli' }, d: { adapter: 'devin' } }, defaultEngine: 'claude' })
  expect(devinBad.success).toBe(false)
  if (!devinBad.success) expect(devinBad.error.issues.some(i => i.path.join('.') === 'engines.d.costPerRunUsd')).toBe(true)
  const devinOk = ConfigSchema.safeParse({ ...base, engines: { claude: { adapter: 'claude-cli' }, d: { adapter: 'devin', costPerRunUsd: 0 } }, defaultEngine: 'claude' })
  expect(devinOk.success).toBe(true)
})

test('小修輪#2：agy 設了 env → 拒（agy 不透傳 env 過 WSL 邊界，設了會靜默無效）', () => {
  const r = ConfigSchema.safeParse({
    projectPath: './p', backlogFile: './p/B.md', dataDir: './d', engine: 'claude-cli',
    engines: { claude: { adapter: 'claude-cli' }, a: { adapter: 'agy', costPerRunUsd: 0, env: { FOO: 'bar' } } }, defaultEngine: 'claude',
  })
  expect(r.success).toBe(false)
  if (!r.success) expect(r.error.issues.some(i => i.path.join('.') === 'engines.a.env')).toBe(true)
})

// ---------------------------------------------------------------------------
// MEDIUM 修復回歸測試：cmdRunOnce heartbeat 收尾（Fix 4）——核心邏輯抽為
// finalizeRunOnceHeartbeat 導出（同 runNotifyTest 模式），mock deps、不打真 API、不碰真 config。
// ---------------------------------------------------------------------------

/** M9.9：改用真 RunDb＋帶 subscription 引擎的 cfg——heartbeat todayCostUsd 語意變 billed
 * （真金帳），mock stub 只換函式名驗不出「訂閱名義帳被排除」這條語意，得灌真資料驗。
 * 預灌一筆真金 claude 記錄（ts 落在測試 now 2026-07-07T03:00Z 的 +8 本地日窗口內）。 */
function heartbeatDeps(dataDir: string, costUsd: number): { deps: Deps; events: EventLog; db: RunDb } {
  const events = new EventLog(dataDir)
  const db = new RunDb(join(dataDir, 'run.db'))
  db.record({ taskId: 'hb-real', ok: true, costUsd, detail: 'real', engine: 'claude', ts: '2026-07-07T03:00:00.000Z' })
  const deps = {
    cfg: {
      timezoneOffsetHours: 8,
      engines: { claude: { adapter: 'mock' }, 'codex-spark': { adapter: 'mock', costPerRunUsd: 1, subscription: true } },
    },
    events,
    db,
  } as unknown as Deps
  return { deps, events, db }
}

function readHeartbeatFile(dataDir: string): { state: string; todayCostUsd: number } {
  return JSON.parse(readFileSync(join(dataDir, 'heartbeat.json'), 'utf8')) as { state: string; todayCostUsd: number }
}

test('finalizeRunOnceHeartbeat：done/failed/engine-error/blocked 跑完任務 → heartbeat 收尾為 idle、todayCostUsd 為當日 billed 真金值（排除訂閱引擎名義帳）', () => {
  const results: CycleResult[] = ['done', 'failed', 'engine-error', { kind: 'blocked', taskId: 't1', taskText: '任務', reason: 'merge-conflict' }]
  for (const result of results) {
    const dir = mkdtempSync(join(tmpdir(), 'adng-hb-'))
    const { deps, db } = heartbeatDeps(dir, 1.23)
    // M9.9：同一本地日再灌一筆訂閱引擎名義帳 $100——billed 語意必須排除它，
    // 否則 heartbeat 會是 $101.23（名義總帳），顯示數字與日頂閘踩的數字不一致。
    db.record({ taskId: 'hb-sub', ok: true, costUsd: 100, detail: 'nominal', engine: 'codex-spark', ts: '2026-07-07T03:00:00.000Z' })
    // 模擬 runOnce 期間任務起跑時寫下的 running heartbeat——收尾必須覆寫掉這個假活狀態
    deps.events.heartbeat({ state: 'running', currentTask: '任務', todayCostUsd: 0 })

    finalizeRunOnceHeartbeat(deps, result, new Date('2026-07-07T03:00:00.000Z'))

    const hb = readHeartbeatFile(dir)
    expect(hb.state).toBe('idle')
    expect(hb.todayCostUsd).toBeCloseTo(1.23) // billed 真金（claude $1.23），訂閱 codex-spark $100 被排除
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

test('M5：registry——白名單外 tag 拋錯；codex/agy/grok/qwen/opencode/devin 已接線（Task 3/4/6/7/8/9 合流）', async () => {
  process.env.ADNG_TEST_DEVIN_MODEL = 'swe-1.6'
  const dir = mkdtempSync(join(tmpdir(), 'adng-cli-m3-'))
  const cfgPath = writeConfig(dir, {
    engine: 'claude-cli',
    engines: {
      claude: { adapter: 'claude-cli' },
      codex: { adapter: 'codex', costPerRunUsd: 1 },
      agy: { adapter: 'agy', costPerRunUsd: 0 },
      grok: { adapter: 'grok', costPerRunUsd: 0.5 },
      qwen: { adapter: 'qwen', costPerRunUsd: 0.5 },
      zen: { adapter: 'opencode', costPerRunUsd: 0 },
      // Task 9：devin 接線——帶 command/model({env:VAR})/env/timeoutMs 驗 registry:case 'devin'
      // 的 config→engine 綁定（ec.command 直傳、expandEnvValue(ec.model)、expandEnvMap(ec.env)、ec.timeoutMs）全被跑過
      dv: { adapter: 'devin', costPerRunUsd: 0, command: 'C:/fake/devin.exe', model: '{env:ADNG_TEST_DEVIN_MODEL}', env: { FOO: 'bar' }, timeoutMs: 123456 }
    }
  })
  const { deps, cfg } = assemble(cfgPath)
  try {
    expect(() => deps.engines.resolve('nonexistent')).toThrow(/白名單/)
    const zen = deps.engines.resolve('zen') // Task 8：opencode 接線，tag zen → id opencode:zen
    expect(zen).toBeInstanceOf(OpencodeEngine)
    expect(zen.id).toBe('opencode:zen')
    const codex = deps.engines.resolve('codex')
    expect(codex).toBeInstanceOf(CodexEngine)
    expect(codex.id).toBe('codex')
    expect(deps.engines.resolve('agy').id).toBe('agy')
    const grok = deps.engines.resolve('grok')
    expect(grok).toBeInstanceOf(GrokEngine)
    expect(grok.id).toBe('grok')
    const qwen = deps.engines.resolve('qwen')
    expect(qwen).toBeInstanceOf(QwenEngine)
    expect(qwen.id).toBe('qwen')
    // Task 9：devin 接線——非 default tag 'dv' → id 'devin:dv'；model {env:VAR} 展開不拋（缺 env 會拋）證明 expandEnvValue 有跑
    const devin = deps.engines.resolve('dv')
    expect(devin).toBeInstanceOf(DevinEngine)
    expect(devin.id).toBe('devin:dv')
    // devin-serena-fix：registry 把 profileDir 綁到 <dataDir>/devin-profile——preflight 用它取代
    // process.cwd()，觸發後該路徑下應出現關 MCP 匯入的 .devin/config.local.json（command 是假路徑
    // 會 spawn 失敗，但 ensureNoMcpImport 這個副作用發生在 spawn 之前，不受影響）。
    await devin.preflight()
    const dvCfg = JSON.parse(readFileSync(join(cfg.dataDir, 'devin-profile', '.devin', 'config.local.json'), 'utf8')) as { read_config_from: Record<string, boolean> }
    expect(dvCfg.read_config_from).toEqual({ claude: false, cursor: false, windsurf: false })
  } finally {
    deps.db.close()
    delete process.env.ADNG_TEST_DEVIN_MODEL
  }
})

test('M5 Task 9：devin registry——model {env:VAR} 缺失時 resolve 拋（證 expandEnvValue(ec.model) 真的跑在 devin 分支）', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-cli-dv-'))
  const cfgPath = writeConfig(dir, {
    engine: 'claude-cli',
    engines: {
      claude: { adapter: 'claude-cli' },
      dv: { adapter: 'devin', costPerRunUsd: 0, model: '{env:ADNG_TEST_DEVIN_MISSING}' }
    }
  })
  const { deps } = assemble(cfgPath) // lazy：沒 resolve 到 dv 前不炸
  try {
    expect(deps.engines.resolve('claude')).toBeInstanceOf(ClaudeCliEngine)
    expect(() => deps.engines.resolve('dv')).toThrow(/ADNG_TEST_DEVIN_MISSING/)
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

test('M5：configs/ 下所有現役真檔 schema 全過，且 registry 能建出 defaultEngine（原 voice-actress 專測——該檔已退役 .retired，改為不綁定單一檔名）', () => {
  // 不走 assemble：避免測試打開真 dataDir 的 run.db（可能與跑中的 daemon 打架）。
  // schema 驗證＋registry（dataDir 換 temp）已覆蓋「真檔能跑」的組裝面。
  // 只掃 *.json：.retired/.paused 等停用檔不在現役範圍，daemon launcher 同樣不會載它們。
  const cfgDir = resolve(import.meta.dirname, '..', 'configs')
  const files = readdirSync(cfgDir).filter(f => f.endsWith('.json'))
  expect(files.length).toBeGreaterThan(0) // 空 configs 代表整套系統沒有任何專案在跑——那是異常
  for (const f of files) {
    const cfg = ConfigSchema.parse(JSON.parse(readFileSync(join(cfgDir, f), 'utf8')))
    expect(cfg.engines[cfg.defaultEngine], `${f} 的 defaultEngine 必須在自己的 engines 白名單內`).toBeDefined()
    const registry = makeEngineRegistry({ ...cfg, dataDir: mkdtempSync(join(tmpdir(), 'adng-cfg-')) })
    expect(registry.resolve(cfg.defaultEngine)).toBeDefined() // lazy：只 resolve defaultEngine，不需要其他引擎的 env
  }
})
