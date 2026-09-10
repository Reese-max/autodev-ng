import { expect, test } from 'vitest'
import { mkdtempSync, existsSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FreebuffEngine } from '../src/engines/freebuff.js'
import { PreflightCache } from '../src/preflight.js'
import { acquireLock, releaseLock } from '../src/lock.js'
import type { Task } from '../src/types.js'
import { ConfigSchema, EngineConfigSchema } from '../src/types.js'
import { makeEngineRegistry } from '../src/engines/registry.js'
import { createExecutionObservation } from '../src/engines/execution-observation.js'

const FAKE = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'fake-freebuff.mjs')
const T: Task = { id: 'fb12cd34', text: '修好登入頁', line: 0, status: 'open' }

function engine(mode: string, hashes: (string | undefined)[], timeoutMs = 10_000, root = mkdtempSync(join(tmpdir(), 'adng-fb-'))): { e: FreebuffEngine; lockDir: string } {
  let i = 0
  const lockDir = join(root, 'freebuff.lock')
  return { e: new FreebuffEngine({
    command: process.execPath, baseArgs: [FAKE, mode], timeoutMs, pingTimeoutMs: 10_000,
    cache: new PreflightCache(join(root, 'pf.json')), lockDir,
    getCommitHash: () => hashes[Math.min(i++, hashes.length - 1)],
  }), lockDir }
}

test('MCP preflight：唯讀 route 可派工、未消耗 session', async () => {
  const { e } = engine('ok', ['aaa'])
  const first = await e.preflight()
  expect(first).toMatchObject({ ok: true })
  expect(first.detail).toContain('limited')
  expect(await e.preflight()).toEqual(first)
})

test('MCP preflight：route 不可派工 → fail closed', async () => {
  const { e } = engine('bad-route', ['aaa'])
  expect(await e.preflight()).toMatchObject({ ok: false })
})

test('新版額度與 GLM 路由可用；缺少／錯誤額度與已退役模型不能派工', async () => {
  const { e } = engine('glm', ['aaa', 'bbb'])
  const preflight = await e.preflight()
  expect(preflight.detail).toContain('price=5 balance=25')
  expect(await e.run({ task: T, projectPath: process.cwd() })).toMatchObject({ ok: true, actualModel: 'z-ai/glm-5.3-flash' })
  for (const mode of ['quota-blocked', 'missing-quota', 'malformed-quota', 'retired-model']) {
    const blocked = engine(mode, ['aaa', 'bbb'])
    expect((await blocked.e.preflight()).ok).toBe(false)
    expect((await blocked.e.run({ task: T, projectPath: process.cwd() })).ok).toBe(false)
    expect(existsSync(blocked.lockDir)).toBe(false)
  }
})

test('明確 admission 拒絕保留診斷並釋放本輪鎖；執行狀態未知仍隔離', async () => {
  const blocked = engine('admission-denied', ['aaa', 'bbb'])
  const result = await blocked.e.run({ task: T, projectPath: process.cwd() })
  expect(result.ok).toBe(false)
  expect(result.output).toContain('"status":"spend_limited"')
  expect(result.output).toContain('"httpStatus":429')
  expect(existsSync(blocked.lockDir)).toBe(false)
  const unknown = engine('tool-error', ['aaa', 'bbb'])
  expect(await unknown.e.run({ task: T, projectPath: process.cwd() })).toMatchObject({ ok: false, recoveryRequired: true })
  expect(existsSync(unknown.lockDir)).toBe(true)
  releaseLock(unknown.lockDir)
})

test('MCP 進度進入既有監督紀錄；重複與其他 request 的事件不計入', async () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-fb-progress-'))
  const events: string[] = []
  const observation = createExecutionObservation({
    dataDir: root, adapter: 'freebuff', job: { task: T, projectPath: process.cwd(), executionId: 'freebuff-progress', control: { onEvent: event => { if (event.type === 'output') events.push(event.text) } } },
  })
  try {
    expect((await engine('progress', ['aaa', 'bbb']).e.run({ task: T, projectPath: process.cwd(), control: observation.control })).ok).toBe(true)
    expect(events.filter(text => text.startsWith('{"type":"tool_result","source":"freebuff"'))).toHaveLength(1)
    expect(observation.snapshot().lastProgressAt).toBeTypeOf('number')
    expect(observation.snapshot().phase).toBe('validating')
  } finally { observation.finish('completed') }
})

test('route → delegate 正常完成＋新 commit；安全參數固定且不指定 model', async () => {
  const { e } = engine('ok', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r).toMatchObject({ ok: true, costUsd: 0, baseCommitHash: 'aaa', commitHash: 'bbb' })
  expect(r.output).toContain('"switch_model":false')
  expect(r.output).toContain('"max_agent_steps":20')
  expect(r.output).toContain('"take_over_active_session":false')
  expect(r.output).not.toContain('"model"')
  expect(r.output).toContain('嚴禁 cd 到其他目錄')
})

test('MCP 成功文字但無新 commit → no-commit', async () => {
  const { e } = engine('ok', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('no-commit')
})

test('tool isError、空輸出、非法 NDJSON 都失敗', async () => {
  for (const mode of ['tool-error', 'empty', 'invalid-json', 'bad-delegate', 'null-json', 'bad-content', 'wrong-tier', 'bad-reasoning', 'consumed-route']) {
    const { e } = engine(mode, ['aaa', 'aaa'])
    const r = mode === 'invalid-json' ? await e.preflight() : await e.run({ task: T, projectPath: process.cwd() })
    expect(r.ok).toBe(false)
  }
})

test('Freebuff is registered lazily and unsupported overrides fail before dispatch', () => {
  const cfg = ConfigSchema.parse({ projectPath: process.cwd(), dataDir: 'unused', backlogFile: 'BACKLOG.md', defaultEngine: 'freebuff', engines: { freebuff: { adapter: 'freebuff', costPerRunUsd: 0 } } })
  expect(makeEngineRegistry(cfg).resolve('freebuff')).toBeInstanceOf(FreebuffEngine)
  for (const patch of [{ timeoutMs: 0 }, { model: 'paid-model' }, { effort: 'max' }, { env: { API_KEY: 'unused' } }, { idleTimeoutMs: 1 }])
    expect(EngineConfigSchema.safeParse({ adapter: 'freebuff', ...patch }).success).toBe(false)
})

test('long worker output retains the actual route header', async () => {
  const result = await engine('long-output', ['aaa', 'bbb']).e.run({ task: T, projectPath: process.cwd() })
  expect(result.ok).toBe(true)
  expect(result.output).toMatch(/^\[Freebuff 路由：Limited → mimo\/mimo-v2.5；推理：native\]/)
})

test('跨 chunk NDJSON 可解析；stderr 雜訊不是成功證據也不反殺', async () => {
  expect((await engine('fragmented', ['aaa']).e.preflight()).ok).toBe(true)
  expect((await engine('stderr-noise', ['aaa', 'bbb']).e.run({ task: T, projectPath: process.cwd() })).ok).toBe(true)
})

test('共用鎖 busy 時不啟動 delegate、成本仍為真 0', async () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-fb-'))
  const { e, lockDir } = engine('ok', ['aaa', 'bbb'], 10_000, root)
  expect(acquireLock(lockDir)).toBe(true)
  try {
    expect(await e.run({ task: T, projectPath: process.cwd() })).toEqual({
      ok: false, output: '', costUsd: 0, failureReason: 'freebuff-session-busy',
    })
  } finally { releaseLock(lockDir) }
})

test('timeout 後保留 backend 隔離；宿主死亡也不能搶 session', async () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-fb-'))
  const { e, lockDir } = engine('hang', ['aaa', 'aaa'], 1_000, root)
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r).toMatchObject({ ok: false, failureReason: 'timeout', costUsd: 0, costUnknown: true, recoveryRequired: true })
  expect(existsSync(join(lockDir, 'recovery-required.json'))).toBe(true)
  writeFileSync(join(lockDir, 'pid.json'), JSON.stringify({ pid: 2147483647, startedAt: '2000-01-01T00:00:00.000Z' }))
  expect(acquireLock(lockDir, 1)).toBe(false)
  expect((await e.run({ task: T, projectPath: process.cwd() })).failureReason).toBe('freebuff-session-busy')
  releaseLock(lockDir)
}, 20_000)

test('非絕對或非 Git worktree 在 MCP spawn 前拒絕', async () => {
  const { e } = engine('early-exit', [undefined])
  expect(await e.run({ task: T, projectPath: 'relative' })).toMatchObject({ ok: false, failureReason: 'freebuff-invalid-worktree' })
})

test('MCP early exit／stdin EPIPE 只回失敗，不造成未處理例外', async () => {
  const { e } = engine('early-exit', ['aaa', 'aaa'])
  await expect(e.run({ task: T, projectPath: process.cwd() })).resolves.toMatchObject({ ok: false, costUsd: 0 })
})
