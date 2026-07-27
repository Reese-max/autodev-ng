import { describe, test, expect } from 'vitest'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { handleCommand, type BotDeps } from '../src/bot/handlers.js'
import { BacklogStore } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { ConfigSchema, type Config } from '../src/types.js'
import type { LlmOpts } from '../src/autopilot/llm.js'
import { EventLog } from '../src/events.js'
import { ProblemsLedger } from '../src/autopilot/ledger.js'

// 沿用 tests/learn-integration.test.ts 的 ConfigSchema.parse 建 cfg 模式（先讀）。查詢 handler
// 不碰 scheduler/worktree，故不需真 git repo，只要 cfg 路徑存在即可（brief 允許酌情簡化）。
function setup(backlogMd = '- [ ] 任務一\n'): { dir: string; cfg: Config; store: BacklogStore; db: RunDb } {
  const dir = mkdtempSync(join(tmpdir(), 'adng-bot-handlers-'))
  const backlogFile = join(dir, 'BACKLOG.md')
  writeFileSync(backlogFile, backlogMd)
  const cfg = ConfigSchema.parse({
    projectPath: dir, backlogFile, dataDir: join(dir, 'data'),
    engine: 'mock', stopFile: join(dir, '.adng.stop'),
    worktreesDir: join(dir, 'worktrees'),
    timezoneOffsetHours: 0
  })
  return { dir, cfg, store: new BacklogStore(backlogFile), db: new RunDb(join(dir, 'run.db')) }
}

const noLlm: LlmOpts = { model: 'm', apiKey: 'k' } // url 未設 → callAgent fail-open，查詢 handler 用不到

// M9.4 fast-follow #2：BotDeps 新增 events 欄位（長壽 EventLog 實例，doAsk 用）。
function toDeps(s: { cfg: Config; store: BacklogStore; db: RunDb }): BotDeps {
  return {
    cfg: s.cfg, store: s.store, db: s.db, llm: noLlm, cfgPath: join(s.cfg.projectPath, 'config.json'),
    events: new EventLog(s.cfg.dataDir)
  }
}

describe('status', () => {
  test('有 heartbeat.json → 回含 state 的人話', async () => {
    const s = setup()
    mkdirSync(s.cfg.dataDir, { recursive: true })
    writeFileSync(join(s.cfg.dataDir, 'heartbeat.json'), JSON.stringify({
      ts: '2026-07-10T00:00:00.000Z', state: 'running', currentTask: '任務一', todayCostUsd: 1.23
    }))
    const out = await handleCommand('status', '', toDeps(s))
    expect(out.ok).toBe(true)
    expect(out.text).toContain('state=running')
    expect(out.text).toContain('任務一')
  })

  test('無 heartbeat 檔（全新 dataDir）→ 回人話不炸', async () => {
    const s = setup()
    const out = await handleCommand('status', '', toDeps(s))
    expect(out.ok).toBe(true)
    expect(out.text).toContain('尚無 heartbeat')
    expect(out.text).not.toContain('undefined')
  })

  test('cfg.stopFile 存取即 throw（模擬設定損毀）→ 不外拋，回 ok:false（M9.4 fast-follow #3：查詢類內部錯誤改回 ok:false）', async () => {
    const s = setup()
    const badCfg = { ...s.cfg } as Config
    // existsSync 對非法型別 fail-open 吞例外（不會炸），故用 getter 直接讓存取 cfg.stopFile 本身 throw，
    // 才能真的命中 cmdStatus 自己的 try/catch（其餘讀檔輔助函式 readHeartbeat/isDaemonAlive/isSilenced
    // 皆自帶 fail-open，不會把錯誤冒泡出來）。
    Object.defineProperty(badCfg, 'stopFile', { get() { throw new Error('boom：模擬設定存取故障') } })
    const out = await handleCommand('status', '', toDeps({ ...s, cfg: badCfg }))
    expect(out.ok).toBe(false)
    expect(out.text).toBe('狀態查詢失敗，請稍後再試')
  })
})

describe('cost', () => {
  test('有紀錄 → 回今日/昨日成本摘要', async () => {
    const s = setup()
    s.db.record({ taskId: 't1', ok: true, costUsd: 2.5, detail: 'ok' })
    const out = await handleCommand('cost', '', toDeps(s))
    expect(out.ok).toBe(true)
    expect(out.text).toContain('今日')
    expect(out.text).toContain('2.5000')
  })

  test('db 已關閉（模擬檔鎖故障）→ 不外拋，回 ok:false（M9.4 fast-follow #3：查詢類內部錯誤改回 ok:false，讓 web 面板可紅顯）', async () => {
    const s = setup()
    s.db.close()
    const out = await handleCommand('cost', '', toDeps(s))
    expect(out.ok).toBe(false)
    expect(out.text).toBe('成本查詢失敗，請稍後再試')
  })

  test('M9.9：今日/昨日行都是雙數字，昨日的訂閱名義帳被排除出真金', async () => {
    const s = setup()
    const cfg = {
      ...s.cfg,
      engines: { claude: { adapter: 'mock' as const }, 'codex-spark': { adapter: 'mock' as const, costPerRunUsd: 1, subscription: true } }
    }
    // 昨日（setup 的 offset=0，24h 前必落昨日 UTC 日）：真金 claude $2 + 訂閱 codex-spark $100
    const yesterdayTs = new Date(Date.now() - 24 * 3600_000).toISOString()
    s.db.record({ taskId: 'y-real', ok: true, costUsd: 2, detail: '', engine: 'claude', ts: yesterdayTs })
    s.db.record({ taskId: 'y-sub', ok: true, costUsd: 100, detail: '', engine: 'codex-spark', ts: yesterdayTs })
    const out = await handleCommand('cost', '', toDeps({ ...s, cfg }))
    expect(out.ok).toBe(true)
    expect(out.text).toContain('今日成本：真金 $0.0000｜訂閱名義 $0.0000')
    expect(out.text).toContain('昨日：真金 $2.0000｜訂閱名義 $100.0000')
  })
})

describe('backlog', () => {
  test('open/done/blocked 統計 + 前 5 條 open', async () => {
    const s = setup('- [ ] 開放一\n- [x] 完成一 <!-- adng:done abc -->\n- [ ] 開放二 <!-- adng:blocked reason="x" -->\n')
    const out = await handleCommand('backlog', '', toDeps(s))
    expect(out.ok).toBe(true)
    expect(out.text).toContain('open 1')
    expect(out.text).toContain('done 1')
    expect(out.text).toContain('blocked 1')
    expect(out.text).toContain('開放一')
  })

  test('backlogFile 不存在 → 不外拋，回 ok:false（M9.4 fast-follow #3：查詢類內部錯誤改回 ok:false）', async () => {
    const s = setup()
    const badStore = new BacklogStore(join(s.dir, 'no-such-file.md'))
    const out = await handleCommand('backlog', '', toDeps({ cfg: s.cfg, store: badStore, db: s.db }))
    expect(out.ok).toBe(false)
    expect(out.text).toBe('backlog 讀取失敗，請稍後再試')
  })
})

describe('log', () => {
  test('events.jsonl 尾 10 行摘要', async () => {
    const s = setup()
    mkdirSync(s.cfg.dataDir, { recursive: true })
    const lines = Array.from({ length: 12 }, (_, i) =>
      JSON.stringify({ type: `evt-${i}`, ts: `2026-07-10T00:00:0${i % 10}.000Z` }))
    writeFileSync(join(s.cfg.dataDir, 'events.jsonl'), lines.join('\n') + '\n')
    const out = await handleCommand('log', '', toDeps(s))
    expect(out.ok).toBe(true)
    expect(out.text).toContain('evt-11')
    expect(out.text).toContain('evt-2')
    expect(out.text).not.toContain('evt-0')
    expect(out.text).not.toContain('evt-1\n')
  })

  test('events.jsonl 不存在 → 回人話不炸', async () => {
    const s = setup()
    const out = await handleCommand('log', '', toDeps(s))
    expect(out.ok).toBe(true)
    expect(out.text).toBe('尚無事件紀錄')
  })
})

describe('lessons', () => {
  test('learningsFile 存在 → 回覆含教訓文字', async () => {
    const s = setup()
    mkdirSync(s.cfg.dataDir, { recursive: true })
    writeFileSync(join(s.cfg.dataDir, 'learnings.md'), '## 教訓一\n別再犯這個錯\n')
    const out = await handleCommand('lessons', '', toDeps(s))
    expect(out.ok).toBe(true)
    expect(out.text).toContain('別再犯這個錯')
  })

  test('learningsFile 與 globalLearningsFile 皆存在 → 兩層都輸出', async () => {
    const s = setup()
    mkdirSync(s.cfg.dataDir, { recursive: true })
    writeFileSync(join(s.cfg.dataDir, 'learnings.md'), '## 專案教訓\nA\n')
    const globalFile = join(s.dir, 'global-learnings.md')
    writeFileSync(globalFile, '## 全域教訓\nB\n')
    const cfgWithGlobal: Config = { ...s.cfg, globalLearningsFile: globalFile }
    const out = await handleCommand('lessons', '', toDeps({ ...s, cfg: cfgWithGlobal }))
    expect(out.ok).toBe(true)
    expect(out.text).toContain('A')
    expect(out.text).toContain('B')
  })

  test('教訓檔都不存在 → 人話「教訓庫尚空」', async () => {
    const s = setup()
    const out = await handleCommand('lessons', '', toDeps(s))
    expect(out.ok).toBe(true)
    expect(out.text).toContain('教訓庫尚空')
  })

  test('內容超長 → 截斷至 1900 字', async () => {
    const s = setup()
    mkdirSync(s.cfg.dataDir, { recursive: true })
    writeFileSync(join(s.cfg.dataDir, 'learnings.md'), 'x'.repeat(3000))
    const out = await handleCommand('lessons', '', toDeps(s))
    expect(out.ok).toBe(true)
    expect(out.text.length).toBeLessThanOrEqual(1900 + '…[truncated]'.length)
    expect(out.text).toContain('[truncated]')
  })
})

describe('problems', () => {
  test('/problems 列 open top10，value DESC，排除 fixed（M10.0 Task 6）', async () => {
    const s = setup()
    mkdirSync(s.cfg.dataDir, { recursive: true })
    const ledger = new ProblemsLedger(join(s.cfg.dataDir, 'run.db'))
    ledger.upsertSeen({ title: '低值問題', lens: 'perf', value: 3 }, '2026-07-01T00:00:00Z')
    ledger.upsertSeen({ title: '高值問題', lens: 'security', value: 9 }, '2026-07-01T00:00:00Z')
    const fixed = ledger.upsertSeen({ title: '已修問題', lens: 'bug', value: 8 }, '2026-07-01T00:00:00Z')
    ledger.setStatus(fixed.row.fingerprint, 'fixed', 'done')
    ledger.close()

    const out = await handleCommand('problems', '', toDeps(s))
    expect(out.ok).toBe(true)
    const lines = out.text.split('\n')
    expect(lines).toEqual(['v9 [security] 高值問題', 'v3 [perf] 低值問題'])
    expect(out.text).not.toContain('已修問題')
  })

  test('/problems 無 open 案 → 友善空訊息，不炸', async () => {
    const s = setup()
    const out = await handleCommand('problems', '', toDeps(s))
    expect(out.ok).toBe(true)
    expect(out.text.length).toBeGreaterThan(0)
    expect(out.text).not.toContain('undefined')
  })
})

describe('未知指令與 handler 內部 throw', () => {
  test('未知指令 → ok:false「未知指令」', async () => {
    const out = await handleCommand('nope', '', toDeps(setup()))
    expect(out.ok).toBe(false)
    expect(out.text).toBe('未知指令')
  })

  test('handler 內部 throw（db 已關閉）不外拋，handleCommand 仍回結構化結果 ok:false（M9.4 fast-follow #3）', async () => {
    const s = setup()
    s.db.close()
    const out = await handleCommand('cost', '', toDeps(s))
    expect(out.ok).toBe(false)
    expect(typeof out.text).toBe('string')
    expect(out.text.length).toBeGreaterThan(0)
  })
})

describe('status 進度段（2026-07-27）', () => {
  test('今日戰績＋最近完成任務＋blocked 積壓全部浮出', async () => {
    const s = setup('- [ ] 任務一\n- [ ] 卡住的任務 <!-- adng:blocked reason="merge-conflict" -->\n')
    mkdirSync(s.cfg.dataDir, { recursive: true })
    writeFileSync(join(s.cfg.dataDir, 'heartbeat.json'), JSON.stringify({
      ts: new Date().toISOString(), state: 'running', todayCostUsd: 0
    }))
    s.db.record({ taskId: 'a', ok: true, costUsd: 0, detail: '' })
    s.db.record({ taskId: 'b', ok: false, costUsd: 0, detail: 'x' })
    const ev = new EventLog(s.cfg.dataDir)
    ev.append('task-done', { task: '把延伸閱讀掛上論點' })
    ev.append('rotation-weights', { counts: {} })
    ev.append('task-done', { task: '第二個完成的任務' })
    const out = await handleCommand('status', '', toDeps(s))
    expect(out.ok).toBe(true)
    expect(out.text).toContain('今日戰績：完成 1／失敗 1')
    expect(out.text).toContain('最近完成')
    expect(out.text).toContain('把延伸閱讀掛上論點')
    expect(out.text).toContain('第二個完成的任務')
    expect(out.text).toContain('blocked 積壓 1 筆')
  })

  test('零完成零積壓 → 進度段安靜省略，不炸', async () => {
    const s = setup()
    const out = await handleCommand('status', '', toDeps(s))
    expect(out.ok).toBe(true)
    expect(out.text).not.toContain('最近完成')
    expect(out.text).not.toContain('blocked 積壓')
  })
})
