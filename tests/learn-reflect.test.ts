import { describe, test, expect } from 'vitest'
import { mkdtempSync, readFileSync, existsSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { LessonStore } from '../src/learn/store.js'
import { reflectOnFailure, makeLessonsPort, type LessonsDeps } from '../src/learn/reflect.js'
import { RunDb } from '../src/db.js'
import { BacklogStore, taskId } from '../src/backlog.js'
import type { LlmOpts } from '../src/autopilot/llm.js'

function fakeLlm(reply: string): LlmOpts {
  const fetchFn = (async () => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content: reply } }] })
  })) as unknown as typeof fetch
  return { url: 'http://fake', model: 'm', apiKey: 'k', fetchFn }
}

function setup(reply: string) {
  const d = mkdtempSync(join(tmpdir(), 'adng-reflect-'))
  const backlogFile = join(d, 'BACKLOG.md')
  writeFileSync(backlogFile, '- [ ] 修 smoke 失敗\n')
  const db = new RunDb(join(d, 'run.db'))
  const deps: LessonsDeps = {
    lessons: new LessonStore(join(d, 'learnings.md')),
    db, backlog: new BacklogStore(backlogFile), llm: fakeLlm(reply)
  }
  return { d, db, deps, tid: taskId('修 smoke 失敗') }
}

describe('reflectOnFailure', () => {
  test('blocked 只使用相符任務的失敗證據，不混入較新的其他任務', async () => {
    const { deps, db, tid } = setup('NONE')
    db.record({ taskId: tid, ok: false, costUsd: 0, detail: 'MATCHING_FAILURE' })
    db.record({ taskId: 'another', ok: false, costUsd: 0, detail: 'UNRELATED_FAILURE' })
    let prompt = ''
    deps.llm.fetchFn = (async (_url, init) => {
      prompt = String(init?.body)
      return new Response(JSON.stringify({ choices: [{ message: { content: 'NONE' } }] }))
    }) as typeof fetch
    await reflectOnFailure(deps, { kind: 'blocked', taskId: tid, taskText: '修 smoke 失敗', reason: 'max-attempts' })
    expect(prompt).toContain('MATCHING_FAILURE'); expect(prompt).not.toContain('UNRELATED_FAILURE')
  })
  test("failed:從 lastAttempt 取證據,寫入一條教訓", async () => {
    const { d, db, deps, tid } = setup('smoke 要用 port 3210,3000 被佔用')
    db.record({ taskId: tid, ok: false, costUsd: 0, detail: 'verify 輸出:EADDRINUSE 3000' })
    await reflectOnFailure(deps, 'failed')
    const raw = readFileSync(join(d, 'learnings.md'), 'utf8')
    expect(raw).toContain('port 3210')
  })
  test('LLM 回 NONE 不寫檔', async () => {
    const { d, db, deps, tid } = setup('NONE')
    db.record({ taskId: tid, ok: false, costUsd: 0, detail: 'x' })
    await reflectOnFailure(deps, 'failed')
    expect(existsSync(join(d, 'learnings.md'))).toBe(false)
  })
  test('blocked:直接用 result 內的 taskText', async () => {
    const { d, deps } = setup('連敗任務先縮小重現範圍')
    await reflectOnFailure(deps, { kind: 'blocked', taskId: 'x1', taskText: '大任務', reason: 'max-attempts' })
    expect(readFileSync(join(d, 'learnings.md'), 'utf8')).toContain('縮小重現範圍')
  })
  test("idle/done 不觸發;LLM throw 不炸(fail-open)", async () => {
    const { d, db, deps, tid } = setup('無所謂')
    await reflectOnFailure(deps, 'idle')
    await reflectOnFailure(deps, 'done')
    expect(existsSync(join(d, 'learnings.md'))).toBe(false)
    db.record({ taskId: tid, ok: false, costUsd: 0, detail: 'x' })
    const boom: LlmOpts = { url: 'http://fake', model: 'm', apiKey: 'k',
      fetchFn: (async () => { throw new Error('net down') }) as unknown as typeof fetch }
    await expect(reflectOnFailure({ ...deps, llm: boom }, 'failed')).resolves.toBeUndefined()
  })
})

describe('RunDb.lastAttempt', () => {
  test('回最後一筆;空庫回 null', () => {
    const d = mkdtempSync(join(tmpdir(), 'adng-db-'))
    const db = new RunDb(join(d, 'run.db'))
    expect(db.lastAttempt()).toBeNull()
    db.record({ taskId: 'a', ok: true, costUsd: 1, detail: '第一' })
    db.record({ taskId: 'b', ok: false, costUsd: 2, detail: '第二' })
    expect(db.lastAttempt()).toMatchObject({ taskId: 'b', ok: false, detail: '第二' })
  })
})

describe('makeLessonsPort', () => {
  test('inject 轉呼 store;reflect 轉呼 reflectOnFailure', async () => {
    const { deps, db, tid } = setup('教訓文字')
    const port = makeLessonsPort(deps)
    expect(port.inject()).toBe('')
    db.record({ taskId: tid, ok: false, costUsd: 0, detail: 'x' })
    await port.reflect('failed')
    expect(port.inject()).toContain('教訓文字')
  })
})
