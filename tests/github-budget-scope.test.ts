import { afterEach, expect, test, vi } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import Database from 'better-sqlite3'
import { assembleConfig } from '../src/cli/assemble.js'
import { MockEngine } from '../src/engines/mock.js'
import { KernelVerifier } from '../src/engines/kernel-verifier.js'
import { GithubConfigSchema, type Issue } from '../src/github/config.js'
import type { GithubClient } from '../src/github/client.js'
import { executeIssue, git } from '../src/github/job.js'
import { runGithub } from '../src/github/runner.js'
import { branchFor, fingerprint, readState, saveState } from '../src/github/state.js'

// Issue #40：GitHub Issue 入口 executeIssue→assemble 未傳 cfgPath，scheduler 的
// globalDailyHardUsd 全域查帳被靜默略過。且 Issue/revision 的 run.db 落在
// cfg.dataDir 的 issue-* 樹下，不在任何被掃描的專案 dataDir——必須顯式納入 scope。

const dirs: string[] = []
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })

// 逐字鏡像 tests/scheduler.test.ts 的 seedSiblingDb：最小 attempts 表 + 真 run.db。
function seedDb(dataDir: string, rows: { ts: string; cost: number; engine: string; accounting?: string | null }[]): void {
  mkdirSync(dataDir, { recursive: true })
  const db = new Database(join(dataDir, 'run.db'))
  db.exec(`CREATE TABLE attempts(
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    ts TEXT NOT NULL,
    ok INTEGER NOT NULL,
    cost_usd REAL NOT NULL,
    detail TEXT NOT NULL,
    engine TEXT NOT NULL DEFAULT '', accounting_json TEXT
  )`)
  for (const r of rows) {
    db.prepare('INSERT INTO attempts (task_id, ts, ok, cost_usd, detail, engine, accounting_json) VALUES (?,?,?,?,?,?,?)')
      .run('t', r.ts, 1, r.cost, '', r.engine, r.accounting === undefined ? JSON.stringify({ version: 1, costSource: 'provider-reported' }) : r.accounting)
  }
  db.close()
}

// 真實組裝鏈 fixture：root/configs/source.json（sourceConfig＋globalDailyHardUsd）、
// 同層 sibling.json（兄弟專案已花費）、issue-N/repo 真 git checkout。
function fixture(opts: { globalLimit?: number; siblingSpent?: number; billingScope?: string } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'adng-budget-')); dirs.push(root)
  const configsDir = join(root, 'configs'); mkdirSync(configsDir, { recursive: true })
  const sourceConfig = join(configsDir, 'source.json')
  // source 自己也要有 run.db（掃描範圍內任何設定檔缺 db 都會讓查帳 incomplete）
  seedDb(join(root, 'data-self'), [])
  seedDb(join(root, 'data-sibling'), opts.siblingSpent ? [{ ts: new Date().toISOString(), cost: opts.siblingSpent, engine: 'claude' }] : [])
  writeFileSync(join(configsDir, 'sibling.json'), JSON.stringify({ dataDir: '../data-sibling', timezoneOffsetHours: 8 }))

  const cfg = GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], sourceConfig, dataDir: join(root, 'gh'),
    engine: 'writer', enabled: true, publish: false, label: null, verifyCommand: `"${process.execPath}" check.cjs`,
    ...(opts.billingScope ? { billingScope: opts.billingScope } : {}) })
  const issue: Issue = { number: 7, title: 'Fix addition', body: 'add(2, 3) must return 5', state: 'open', user: { login: 'owner' }, labels: [] }
  const cwd = join(cfg.dataDir, 'issue-7', 'repo'); mkdirSync(cwd, { recursive: true })
  git(cwd, ['init', '-b', branchFor(7)])
  git(cwd, ['config', 'user.name', 'Test']); git(cwd, ['config', 'user.email', 'test@example.invalid'])
  git(cwd, ['config', 'core.autocrlf', 'false'])
  git(cwd, ['remote', 'add', 'origin', 'https://github.com/owner/project.git'])
  writeFileSync(join(cwd, 'add.cjs'), 'module.exports = (a, b) => a - b\n')
  writeFileSync(join(cwd, 'check.cjs'), "require('node:assert/strict').equal(require('./add.cjs')(2, 3), 5)\n")
  git(cwd, ['add', '.']); git(cwd, ['commit', '-m', 'initial'])
  const baseSha = git(cwd, ['rev-parse', 'HEAD'])
  const state = { repo: cfg.repo, base: cfg.base, issue, fingerprint: fingerprint(issue), status: 'queued' as const, runs: 0, nextRunAt: 0, baseSha }
  saveState(cfg, state)
  writeFileSync(sourceConfig, JSON.stringify({ projectPath: cwd, backlogFile: 'unused', dataDir: '../data-self', timezoneOffsetHours: 8,
    ...(opts.globalLimit !== undefined ? { globalDailyHardUsd: opts.globalLimit } : {}),
    engines: { writer: { adapter: 'opencode', model: 'fixture' } }, defaultEngine: 'writer', reviewEngine: 'fixture-reviewer' }))
  return { root, cfg, issue, state, sourceConfig }
}

test('全域已達上限、局部有空間：executeIssue 在 worker 啟動前拒絕（cfgPath 接線）', async () => {
  const { cfg, state } = fixture({ globalLimit: 10, siblingSpent: 50 })
  const engine = new MockEngine([{ ok: true }])
  let capturedCfgPath: string | undefined
  const result = await executeIssue(cfg, state, (runtime, cfgPath) => {
    capturedCfgPath = cfgPath
    const app = assembleConfig(runtime, cfgPath)
    app.deps.engines = { resolve: () => engine }
    app.deps.verifier = new KernelVerifier({ cfg: runtime, reviewRun: async () => 'REVIEW: PASS' })
    return app
  })
  expect(result.done).toBe(false)
  expect(result.detail).toBe('cost-hard-stop')
  expect(result.attempted).toBe(false) // pre-worker 拒絕不得消耗嘗試額度
  expect(capturedCfgPath).toBe(resolve(cfg.sourceConfig)) // 可信 scope：sourceConfig 所在目錄＝艦隊 configs
  expect(engine.calls).toHaveLength(0) // worker 沒啟動
  const events = readFileSync(join(cfg.dataDir, 'issue-7', 'events.jsonl'), 'utf8')
  expect(events).toContain('"type":"cost-hard-stop-global"')
})

test('全域拒絕走 runGithub 全鏈路：runs 不被消耗、issue 保持 queued 可重試', async () => {
  const { cfg, issue } = fixture({ globalLimit: 10, siblingSpent: 50 })
  const engine = new MockEngine([{ ok: true }])
  const client: GithubClient = { list: vi.fn(async () => [issue]), issue: vi.fn(async () => issue),
    findPr: vi.fn(async () => undefined), findLinkedPr: vi.fn(async () => undefined),
    createPr: vi.fn(async () => { throw new Error('unexpected publish') }) }
  const execute = (c: typeof cfg, s: Parameters<typeof executeIssue>[1]) => executeIssue(c, s, (runtime, cfgPath) => {
    const app = assembleConfig(runtime, cfgPath)
    app.deps.engines = { resolve: () => engine }
    app.deps.verifier = new KernelVerifier({ cfg: runtime, reviewRun: async () => 'REVIEW: PASS' })
    return app
  })
  expect(await runGithub(cfg, { client, execute })).toBe('7: queued')
  expect(readState(cfg, 7)!.runs).toBe(0) // 全域 budget 拒絕不燒 maxRuns，恢復後可繼續
  expect(readState(cfg, 7)!.status).toBe('queued')
  expect(engine.calls).toHaveLength(0)
})

test('Issue 動態帳務納入 scope：另一個 issue 的 run.db 花費把全域推過上限', async () => {
  const { cfg, state } = fixture({ globalLimit: 60, siblingSpent: 50 })
  // 同 repo 另一個 issue 已燒 $20——不納入 scope 時只有 50<60 會放行
  seedDb(join(cfg.dataDir, 'issue-9'), [{ ts: new Date().toISOString(), cost: 20, engine: 'writer' }])
  const engine = new MockEngine([{ ok: true }])
  const result = await executeIssue(cfg, state, (runtime, cfgPath) => {
    const app = assembleConfig(runtime, cfgPath)
    app.deps.engines = { resolve: () => engine }
    app.deps.verifier = new KernelVerifier({ cfg: runtime, reviewRun: async () => 'REVIEW: PASS' })
    return app
  })
  expect(result.detail).toBe('cost-hard-stop')
  expect(engine.calls).toHaveLength(0)
})

test('修訂輪次帳務不能逃離：issue-*/revisions/*/run.db 也計入', async () => {
  const { cfg, state } = fixture({ globalLimit: 60, siblingSpent: 50 })
  seedDb(join(cfg.dataDir, 'issue-9', 'revisions', '2'), [{ ts: new Date().toISOString(), cost: 20, engine: 'writer' }])
  const engine = new MockEngine([{ ok: true }])
  const result = await executeIssue(cfg, state, (runtime, cfgPath) => {
    const app = assembleConfig(runtime, cfgPath)
    app.deps.engines = { resolve: () => engine }
    app.deps.verifier = new KernelVerifier({ cfg: runtime, reviewRun: async () => 'REVIEW: PASS' })
    return app
  })
  expect(result.detail).toBe('cost-hard-stop')
  expect(engine.calls).toHaveLength(0)
})

test('owner 佈局：billingScope 指向 owner dataDir，repo-*/issue-*/run.db 涵蓋跨 repo 帳務', async () => {
  const ownerDataDir = mkdtempSync(join(tmpdir(), 'adng-owner-scope-')); dirs.push(ownerDataDir)
  const { cfg, state } = fixture({ globalLimit: 60, siblingSpent: 50, billingScope: ownerDataDir })
  seedDb(join(ownerDataDir, 'repo-deadbeef', 'issue-3'), [{ ts: new Date().toISOString(), cost: 5, engine: 'writer' }])
  seedDb(join(ownerDataDir, 'repo-deadbeef', 'issue-3', 'revisions', '1'), [{ ts: new Date().toISOString(), cost: 15, engine: 'writer' }]) // 修訂輪帳務也計入
  const engine = new MockEngine([{ ok: true }])
  const result = await executeIssue(cfg, state, (runtime, cfgPath) => {
    const app = assembleConfig(runtime, cfgPath)
    app.deps.engines = { resolve: () => engine }
    app.deps.verifier = new KernelVerifier({ cfg: runtime, reviewRun: async () => 'REVIEW: PASS' })
    return app
  })
  expect(result.detail).toBe('cost-hard-stop')
  expect(engine.calls).toHaveLength(0)
})

test('scope 不完整（兄弟專案 db 消失）→ 明確拒絕，不把未知當零', async () => {
  const { cfg, state, root } = fixture({ globalLimit: 10, siblingSpent: 50 })
  rmSync(join(root, 'data-sibling'), { recursive: true, force: true }) // 證據消失
  const engine = new MockEngine([{ ok: true }])
  const result = await executeIssue(cfg, state, (runtime, cfgPath) => {
    const app = assembleConfig(runtime, cfgPath)
    app.deps.engines = { resolve: () => engine }
    app.deps.verifier = new KernelVerifier({ cfg: runtime, reviewRun: async () => 'REVIEW: PASS' })
    return app
  })
  expect(result.detail).toBe('cost-hard-stop')
  expect(engine.calls).toHaveLength(0)
  const events = readFileSync(join(cfg.dataDir, 'issue-7', 'events.jsonl'), 'utf8')
  expect(events).toContain('"type":"cost-accounting-incomplete"')
})

test('Issue scope 內的未知費用來源 → 拒絕（不當零）', async () => {
  const { cfg, state } = fixture({ globalLimit: 10, siblingSpent: 0 })
  seedDb(join(cfg.dataDir, 'issue-9'), [{ ts: new Date().toISOString(), cost: 1, engine: 'writer', accounting: null }]) // 無 provenance
  const engine = new MockEngine([{ ok: true }])
  const result = await executeIssue(cfg, state, (runtime, cfgPath) => {
    const app = assembleConfig(runtime, cfgPath)
    app.deps.engines = { resolve: () => engine }
    app.deps.verifier = new KernelVerifier({ cfg: runtime, reviewRun: async () => 'REVIEW: PASS' })
    return app
  })
  expect(result.detail).toBe('cost-hard-stop')
  expect(engine.calls).toHaveLength(0)
})

test('未設全域上限 → 相容行為不變（可派工，不因 cfgPath 接線誤觸）', async () => {
  const { cfg, state } = fixture({ siblingSpent: 9999 }) // 兄弟花再多也不查
  const engine = new MockEngine([{ ok: true }])
  await executeIssue(cfg, state, (runtime, cfgPath) => {
    const app = assembleConfig(runtime, cfgPath)
    app.deps.engines = { resolve: () => engine }
    app.deps.verifier = new KernelVerifier({ cfg: runtime, reviewRun: async () => 'REVIEW: PASS' })
    return app
  })
  expect(engine.calls.length).toBeGreaterThan(0) // 真的派工了（後續驗證閘怎麼判不重要）
})
