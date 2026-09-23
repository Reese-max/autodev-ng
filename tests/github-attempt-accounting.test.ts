import { afterEach, expect, test, vi } from 'vitest'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { assembleConfig } from '../src/cli/assemble.js'
import { MockEngine } from '../src/engines/mock.js'
import { KernelVerifier } from '../src/engines/kernel-verifier.js'
import { GithubConfigSchema, githubStopFile, type Issue } from '../src/github/config.js'
import type { GithubClient } from '../src/github/client.js'
import { executeIssue, git, issueTask } from '../src/github/job.js'
import { runGithub } from '../src/github/runner.js'
import { branchFor, fingerprint, readState, saveState } from '../src/github/state.js'

// Issue #49：前置阻擋（預算/preflight/容量等待）不該消耗 writer lifetime 額度；
// 已啟動或結果未知的輪次不退款。全部走真 executeIssue→runOnce→runGithub 組裝鏈，
// 不靠錯誤字串猜「worker 是否啟動」——由 CycleResult 的型別化 not-started 承載。

const dirs: string[] = []
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })

function fixture(opts: { maxRuns?: number } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'adng-attempts-')); dirs.push(root)
  const cfg = GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], sourceConfig: join(root, 'source.json'), dataDir: join(root, 'gh'),
    engine: 'writer', enabled: true, publish: false, label: null, retryMs: 60_000, maxRuns: opts.maxRuns ?? 3,
    verifyCommand: `"${process.execPath}" check.cjs` })
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
  saveState(cfg, { repo: cfg.repo, base: cfg.base, issue, fingerprint: fingerprint(issue), status: 'queued', runs: 0, nextRunAt: 0, baseSha })
  writeFileSync(cfg.sourceConfig, JSON.stringify({ projectPath: cwd, backlogFile: 'unused', dataDir: join(root, 'self-data'),
    engines: { writer: { adapter: 'opencode', model: 'fixture' } }, defaultEngine: 'writer', reviewEngine: 'fixture-reviewer' }))
  const client: GithubClient = { list: vi.fn(async () => [issue]), issue: vi.fn(async () => issue),
    findPr: vi.fn(async () => undefined), findLinkedPr: vi.fn(async () => undefined),
    createPr: vi.fn(async () => { throw new Error('unexpected publish') }) }
  const execute = (engine: MockEngine) => (c: typeof cfg, s: Parameters<typeof executeIssue>[1]) => executeIssue(c, s, (runtime, cfgPath) => {
    const app = assembleConfig(runtime, cfgPath)
    app.deps.engines = { resolve: () => engine }
    app.deps.verifier = new KernelVerifier({ cfg: runtime, reviewRun: async () => 'REVIEW: PASS' })
    return app
  })
  return { cfg, issue, client, execute }
}

const forceDue = (cfg: ReturnType<typeof fixture>['cfg']) => saveState(cfg, { ...readState(cfg, 7)!, nextRunAt: 0 })

test('preflight-failed：worker 從未啟動 → 不耗 writer 額度，issue 保持 queued', async () => {
  const { cfg, client, execute } = fixture()
  const engine = new MockEngine([], { ok: false, detail: 'cli not ready' })
  expect(await runGithub(cfg, { client, execute: execute(engine) })).toBe('7: queued')
  const s = readState(cfg, 7)!
  expect(s.runs).toBe(0) // 前置阻擋不得計入 lifetime writer 次數
  expect(s.status).toBe('queued')
  expect(s.detail).toBe('preflight-failed') // 可觀測原因碼
  expect(engine.calls).toHaveLength(0)
})

test('供應冷卻 deferred：重複前置等待不耗額度，退避有界遞增、原因可觀測', async () => {
  const { cfg, client, execute } = fixture()
  // 先製造一次真實 writer 嘗試（失敗計次）→ 冷卻窗內 writer tag 進入 attempted 集合
  const failing = new MockEngine([{ ok: false, reason: 'quota exhausted' }])
  expect(await runGithub(cfg, { client, execute: execute(failing) })).toBe('7: queued')
  expect(readState(cfg, 7)!.runs).toBe(1)

  const idle = new MockEngine()
  forceDue(cfg)
  expect(await runGithub(cfg, { client, execute: execute(idle) })).toBe('7: queued')
  const s2 = readState(cfg, 7)!
  expect(s2.runs).toBe(1) // 供應等待不燒 writer 額度
  expect(s2.status).toBe('queued')
  expect(s2.detail).toBe('deferred')
  expect(idle.calls).toHaveLength(0)
  const wait1 = s2.nextRunAt - Date.now()

  forceDue(cfg)
  expect(await runGithub(cfg, { client, execute: execute(idle) })).toBe('7: queued')
  const s3 = readState(cfg, 7)!
  expect(s3.runs).toBe(1)
  expect(s3.controlRuns).toBe(2) // 控制端重試計數獨立於 writer 額度
  expect(s3.nextRunAt - Date.now()).toBeGreaterThan(wait1) // 有限退避：等待區間增長
})

test('引擎啟動後才 stopped（post-run 停檔）：已啟動照計次，不退款', async () => {
  const { cfg, client, execute } = fixture()
  const engine = new MockEngine([{ ok: true, beforeResult: () => { writeFileSync(githubStopFile(cfg), '') } }])
  await runGithub(cfg, { client, execute: execute(engine) })
  const s = readState(cfg, 7)!
  expect(s.runs).toBe(1) // worker 已跑——停檔落在執行後，額度照計
  expect(s.status).toBe('cancelled') // 執行中撤回 → 候選保留、不再發布
  expect(engine.calls).toHaveLength(1)
})

test('engine 拋錯（已啟動/未知消耗）：計次不當 pre-dispatch 退款', async () => {
  const { cfg, client, execute } = fixture()
  const engine = new MockEngine([{ throw: 'adapter exploded' }])
  expect(await runGithub(cfg, { client, execute: execute(engine) })).toBe('7: queued')
  const s = readState(cfg, 7)!
  expect(s.runs).toBe(1) // 引擎已送件——失敗照計
  expect(s.detail).not.toBe('deferred')
})

test('真實失敗達 maxRuns 仍 blocked——退款管道不能變無限修復', async () => {
  const { cfg, client, execute } = fixture({ maxRuns: 1 })
  const engine = new MockEngine([{ ok: false, reason: 'still broken' }])
  expect(await runGithub(cfg, { client, execute: execute(engine) })).toBe('7: blocked')
  const s = readState(cfg, 7)!
  expect(s.runs).toBe(1)
  expect(s.status).toBe('blocked')
})

test('環境恢復後在剩餘額度內接續同一 Issue', async () => {
  const { cfg, client, execute } = fixture({ maxRuns: 2 })
  // 輪 1：真失敗（runs=1）；輪 2-3：供應冷卻 deferred（不耗）；輪 4：恢復 → 成功計次
  const seq = new MockEngine([{ ok: false, reason: 'boom' }])
  await runGithub(cfg, { client, execute: execute(seq) })
  const idle = new MockEngine()
  forceDue(cfg); await runGithub(cfg, { client, execute: execute(idle) })
  forceDue(cfg); await runGithub(cfg, { client, execute: execute(idle) })
  expect(readState(cfg, 7)!.runs).toBe(1)
  // 冷卻過後（清掉嘗試紀錄窗）→ 下一次真的派工
  const recovered = new MockEngine([{ ok: true }])
  forceDue(cfg)
  const before = Date.now() - 40 * 60_000 // 推出 supplyRetryCooldownMs（預設 30min）窗外
  // 把 run1 的嘗試紀錄時間戳推回冷卻窗外，模擬環境已恢復
  const Database = (await import('better-sqlite3')).default
  const db = new Database(join(cfg.dataDir, 'issue-7', 'run.db'))
  db.prepare('UPDATE attempts SET ts = ?').run(new Date(before).toISOString())
  db.close()
  await runGithub(cfg, { client, execute: execute(recovered) })
  expect(recovered.calls.length).toBeGreaterThan(0) // 真的派工了
  expect(readState(cfg, 7)!.runs).toBe(2) // 剩餘額度內接續計次
})

test('backlog 任務已終態 blocked：issue 直達 blocked，不留在 queued 無限輪詢', async () => {
  const { cfg, client, execute } = fixture()
  // 前一輪把任務打進終態 blocked（admission/merge 類）——backlog 不重寫、open 清單為空；
  // 若當 idle 處理會每次退款無限輪詢（F1 回歸），必須直達 issue 終態。
  const st = readState(cfg, 7)!
  writeFileSync(join(cfg.dataDir, 'issue-7', 'BACKLOG.md'),
    `- [ ] ${issueTask(st)} <!-- adng:blocked reason=${JSON.stringify('dirty-worktree')} -->\n`)
  const engine = new MockEngine()
  expect(await runGithub(cfg, { client, execute: execute(engine) })).toBe('7: blocked')
  const s = readState(cfg, 7)!
  expect(s.status).toBe('blocked')
  expect(engine.calls).toHaveLength(0)
})
