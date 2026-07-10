import { describe, test, expect } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { handleCommand, type BotDeps } from '../src/bot/handlers.js'
import { appendUserTask } from '../src/bot/actions.js'
import { isSilenced } from '../src/bot/silence.js'
import { BacklogStore } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { ConfigSchema, type Config } from '../src/types.js'
import type { LlmOpts } from '../src/autopilot/llm.js'

// 沿用 tests/learn-integration.test.ts 的 ConfigSchema.parse 建 cfg 模式（先讀）。控制 handler
// 不碰 scheduler/worktree，故不需真 git repo；/task 仍走真檔 round-trip（brief 要求）。
function setup(backlogMd = '- [ ] 任務一\n'): { dir: string; cfg: Config; store: BacklogStore; db: RunDb } {
  const dir = mkdtempSync(join(tmpdir(), 'adng-bot-actions-'))
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

const noLlm: LlmOpts = { model: 'm', apiKey: 'k' }

function fakeLlm(reply: string): LlmOpts {
  const fetchFn = (async () => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content: reply } }] })
  })) as unknown as typeof fetch
  return { url: 'http://fake', model: 'm', apiKey: 'k', fetchFn }
}

function toDeps(s: { cfg: Config; store: BacklogStore; db: RunDb }, llm: LlmOpts = noLlm): BotDeps {
  return { cfg: s.cfg, store: s.store, db: s.db, llm }
}

describe('appendUserTask（純函式，直呼）', () => {
  test('缺檔視為空、確保結尾換行、append 純 `- [ ] text` 行（無 adng 註記）', () => {
    const s = setup()
    const noNewlineFile = join(s.dir, 'nolf.md')
    writeFileSync(noNewlineFile, '- [ ] 已存在（無結尾換行）')
    appendUserTask(noNewlineFile, '新任務')
    const raw = readFileSync(noNewlineFile, 'utf8')
    expect(raw).toBe('- [ ] 已存在（無結尾換行）\n- [ ] 新任務\n')
    expect(raw).not.toContain('adng:')
  })
})

describe('pause / resume', () => {
  test('pause 後 stopFile 存在，回成功文字', async () => {
    const s = setup()
    const out = await handleCommand('pause', '', toDeps(s))
    expect(out).toContain('已寫入 stop 檔')
    expect(existsSync(s.cfg.stopFile)).toBe(true)
  })

  test('resume 刪 stopFile；缺檔也回成功文字不炸', async () => {
    const s = setup()
    writeFileSync(s.cfg.stopFile, 'x')
    const out1 = await handleCommand('resume', '', toDeps(s))
    expect(out1).toContain('已恢復')
    expect(existsSync(s.cfg.stopFile)).toBe(false)

    // 再次 resume：已無 stopFile，仍不可炸
    const out2 = await handleCommand('resume', '', toDeps(s))
    expect(out2).toContain('已恢復')
  })
})

describe('silence', () => {
  test('silence 30 → isSilenced true，回至何時的文字', async () => {
    const s = setup()
    const out = await handleCommand('silence', '30', toDeps(s))
    expect(out).toContain('已靜音至')
    expect(isSilenced(s.cfg.dataDir)).toBe(true)
  })

  test('silence 0 → clearSilence，isSilenced false', async () => {
    const s = setup()
    await handleCommand('silence', '30', toDeps(s))
    expect(isSilenced(s.cfg.dataDir)).toBe(true)
    const out = await handleCommand('silence', '0', toDeps(s))
    expect(out).toContain('已解除靜音')
    expect(isSilenced(s.cfg.dataDir)).toBe(false)
  })

  test('非法分鐘數（非數字/超出範圍）→ 回用法說明，不炸', async () => {
    const s = setup()
    const out1 = await handleCommand('silence', 'abc', toDeps(s))
    expect(out1).toContain('用法')
    const out2 = await handleCommand('silence', '9999', toDeps(s))
    expect(out2).toContain('用法')
    expect(isSilenced(s.cfg.dataDir)).toBe(false)
  })
})

describe('task', () => {
  test('task <文字> → 寫入後 store.read() 回 source:user 且文字正確', async () => {
    const s = setup()
    const out = await handleCommand('task', '買晚餐', toDeps(s))
    expect(out).toBe('已加入 backlog')
    const tasks = s.store.read()
    const added = tasks.find(t => t.text === '買晚餐')
    expect(added).toBeDefined()
    expect(added?.source).toBe('user')
  })

  test('task 空字串 → 回用法說明，不寫入', async () => {
    const s = setup()
    const before = s.store.read().length
    const out = await handleCommand('task', '   ', toDeps(s))
    expect(out).toContain('用法')
    expect(s.store.read().length).toBe(before)
  })
})

describe('ask', () => {
  test('ask <問題> → fakeLlm 回固定字', async () => {
    const s = setup()
    const out = await handleCommand('ask', '今天天氣如何', toDeps(s, fakeLlm('今天晴天')))
    expect(out).toBe('今天晴天')
  })

  test('LLM fail-open（無 url）→ 回「LLM 未回應」，不炸', async () => {
    const s = setup()
    const out = await handleCommand('ask', '問題', toDeps(s, noLlm))
    expect(out).toBe('LLM 未回應')
  })

  test('ask 空字串 → 回用法說明', async () => {
    const s = setup()
    const out = await handleCommand('ask', '', toDeps(s, fakeLlm('不該被呼叫')))
    expect(out).toContain('用法')
  })
})
