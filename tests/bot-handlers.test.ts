import { describe, test, expect } from 'vitest'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { handleCommand, type BotDeps } from '../src/bot/handlers.js'
import { BacklogStore } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { ConfigSchema, type Config } from '../src/types.js'
import type { LlmOpts } from '../src/autopilot/llm.js'

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

function toDeps(s: { cfg: Config; store: BacklogStore; db: RunDb }): BotDeps {
  return { cfg: s.cfg, store: s.store, db: s.db, llm: noLlm, cfgPath: join(s.cfg.projectPath, 'config.json') }
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

  test('db 已關閉（模擬檔鎖故障）→ 不外拋，回人話（查詢類恆 ok:true）', async () => {
    const s = setup()
    s.db.close()
    const out = await handleCommand('cost', '', toDeps(s))
    expect(out.ok).toBe(true)
    expect(out.text).toBe('成本查詢失敗，請稍後再試')
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

  test('backlogFile 不存在 → 不外拋，回人話（查詢類恆 ok:true）', async () => {
    const s = setup()
    const badStore = new BacklogStore(join(s.dir, 'no-such-file.md'))
    const out = await handleCommand('backlog', '', toDeps({ cfg: s.cfg, store: badStore, db: s.db }))
    expect(out.ok).toBe(true)
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

describe('未知指令與 handler 內部 throw', () => {
  test('未知指令 → ok:false「未知指令」', async () => {
    const out = await handleCommand('nope', '', toDeps(setup()))
    expect(out.ok).toBe(false)
    expect(out.text).toBe('未知指令')
  })

  test('handler 內部 throw（db 已關閉）不外拋，handleCommand 仍回結構化結果（查詢類恆 ok:true）', async () => {
    const s = setup()
    s.db.close()
    const out = await handleCommand('cost', '', toDeps(s))
    expect(out.ok).toBe(true)
    expect(typeof out.text).toBe('string')
    expect(out.text.length).toBeGreaterThan(0)
  })
})
