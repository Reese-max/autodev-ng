import { afterEach, expect, test, vi } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { GithubConfigSchema, type GithubConfig, type Issue } from '../src/github/config.js'
import { type GithubClient } from '../src/github/client.js'
import { fingerprint, saveState, type IssueState } from '../src/github/state.js'
import { publishIssue, runGithub } from '../src/github/runner.js'
import { OwnerConfigSchema, ownerCli, policyFileCheck, runOwner } from '../src/github/owner.js'

// Issue #41：owner 執行中撤回授權（enabled/publish 改 false、檔案被改/刪）必須在
// 子 repo 啟動、execute 前後、push→createPr 之間被重核對——不能只靠啟動時快照。

const dirs: string[] = []
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'adng-policy-')); dirs.push(dir)
  const cfg = GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], sourceConfig: join(dir, 'source.json'), dataDir: dir, engine: 'writer', enabled: true, retryMs: 60_000 })
  writeFileSync(cfg.sourceConfig, '{}')
  const issue: Issue = { number: 7, title: 'Fix addition', body: '2 + 3 should be 5', state: 'open', user: { login: 'owner' }, labels: [{ name: 'autodev' }] }
  const client: GithubClient = { list: vi.fn(async () => [issue]), issue: vi.fn(async () => issue), findPr: vi.fn(async () => undefined), findLinkedPr: vi.fn(async () => undefined), createPr: vi.fn(async () => { throw new Error('unexpected publish') }) }
  const state: IssueState = { repo: cfg.repo, base: cfg.base, issue, fingerprint: fingerprint(issue), status: 'queued', runs: 0, nextRunAt: 0 }
  return { dir, cfg, issue, client, state }
}

test('policyCheck=false 在子 repo 啟動即讓步：不 sync、不 execute', async () => {
  const { cfg, client } = fixture()
  const execute = vi.fn()
  expect(await runGithub(cfg, { client, execute, policyCheck: () => false })).toBe('paused')
  expect(execute).not.toHaveBeenCalled()
  expect(client.list).not.toHaveBeenCalled() // 啟動前就該停下
})

test('worker 完成後撤回：execute 有跑但 publish 不被呼叫，候選保留', async () => {
  const { cfg, client } = fixture()
  let ok = true
  const execute = vi.fn(async () => { ok = false; return { attempted: true, commit: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', done: true, detail: 'done' } })
  const publish = vi.fn()
  expect(await runGithub(cfg, { client, execute, publish, policyCheck: () => ok })).toBe('cancelled')
  expect(execute).toHaveBeenCalledTimes(1)
  expect(publish).not.toHaveBeenCalled()
})

test('push 後、createPr 前撤回：不再產生新的外部副作用', async () => {
  const { cfg, client, state } = fixture()
  cfg.publish = true
  state.status = 'ready'; state.commit = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'
  saveState(cfg, state) // runGithub 從磁碟讀 state，不落盤會被 syncIssues 另建 queued
  let ok = true
  const push = vi.fn(() => { ok = false; return 'pushed' }) // 撤回發生在 push 完成的瞬間
  const publish = (c: typeof cfg, s: typeof state, cl: GithubClient, _c: unknown, _p: unknown, active?: () => boolean) =>
    publishIssue(c, s, cl, vi.fn(), push, active)
  const result = await runGithub(cfg, { client, publish, policyCheck: () => ok })
  expect(push).toHaveBeenCalledTimes(1)
  expect(client.createPr).not.toHaveBeenCalled() // 撤回後不得再建 PR
  expect(result).toBe('7: ready') // 狀態留在 ready，不標 published、不算錯
})

test('policyCheck 拋錯 fail-closed：視同撤回', async () => {
  const { cfg, client } = fixture()
  const execute = vi.fn()
  expect(await runGithub(cfg, { client, execute, policyCheck: () => { throw new Error('config unreadable') } })).toBe('paused')
  expect(execute).not.toHaveBeenCalled()
})

test('授權未變的對照組：正常執行到 ready', async () => {
  const { cfg, client } = fixture()
  const execute = vi.fn(async () => ({ attempted: true, commit: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', done: true, detail: 'done' }))
  expect(await runGithub(cfg, { client, execute, policyCheck: () => true })).toBe('7: ready')
})

test('runOwner 把 policyCheck 傳給每個子 repo 的 run', async () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-owner-policy-')); dirs.push(root)
  const cfg = OwnerConfigSchema.parse({ owner: 'owner', authors: ['owner'], sourceConfig: 'source.json', dataDir: root, engine: 'writer', enabled: true, publish: true })
  const row = { full_name: 'owner/one', owner: { login: 'owner' }, default_branch: 'main', archived: false, disabled: false, has_issues: true, permissions: { push: true } }
  const policyCheck = vi.fn(() => true)
  const run = vi.fn(async (_child: GithubConfig, _opts: { syncOnly?: boolean; policyCheck?: () => boolean }) => '1: published')
  await runOwner(cfg, false, () => [row], run, { policyCheck })
  expect(run).toHaveBeenCalledTimes(1)
  expect(run.mock.calls[0]![1]?.policyCheck).toBe(policyCheck)
})

test('ownerCli 與 runOwner 真實接線：撤回後停止派送下一個 repo', async () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-owner-cli-')); dirs.push(root)
  const file = join(root, 'owner.json')
  const raw = { owner: 'owner', authors: ['owner'], sourceConfig: 'source.json', dataDir: root,
    engine: 'writer', enabled: true, publish: true }
  writeFileSync(file, JSON.stringify(raw))
  const row = (name: string) => ({ full_name: name, owner: { login: 'owner' }, default_branch: 'main',
    archived: false, disabled: false, has_issues: true, permissions: { push: true } })
  const discover = vi.fn(() => [row('owner/one'), row('owner/two')])
  const run = vi.fn(async (_child: GithubConfig, options: { syncOnly?: boolean; policyCheck?: () => boolean }) => {
    expect(options.policyCheck?.()).toBe(true)
    writeFileSync(file, JSON.stringify({ ...raw, publish: false }))
    expect(options.policyCheck?.()).toBe(false)
    return 'paused'
  })
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  try {
    await ownerCli('owner-run', file, { discover, run })
  } finally {
    log.mockRestore()
  }
  expect(discover).toHaveBeenCalledTimes(1)
  expect(run).toHaveBeenCalledTimes(1)
})

test('policyFileCheck：檔案未變→true；內容變更/刪除/毀損→false（fail-closed）', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-policy-file-')); dirs.push(dir)
  const file = join(dir, 'owner.json')
  const content = JSON.stringify({ owner: 'owner', enabled: true })
  writeFileSync(file, content)
  const check = policyFileCheck(file, Buffer.from(content))
  expect(check()).toBe(true)
  writeFileSync(file, JSON.stringify({ owner: 'owner', enabled: false }))
  expect(check()).toBe(false)
  writeFileSync(file, content) // 改回原內容＝重新授權（檔案內容即政策真相）
  expect(check()).toBe(true)
  rmSync(file)
  expect(check()).toBe(false)
})

test('policyFileCheck 比較原始位元組：無效 UTF-8 不得冒充 U+FFFD', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-policy-bytes-')); dirs.push(dir)
  const file = join(dir, 'owner.json')
  const content = Buffer.from(JSON.stringify({ owner: 'owner', sourceConfig: '\uFFFD', enabled: true }))
  writeFileSync(file, content)
  const check = policyFileCheck(file, content)
  expect(check()).toBe(true)
  const replacement = Buffer.from('\uFFFD')
  const at = content.indexOf(replacement)
  expect(at).toBeGreaterThanOrEqual(0)
  const invalid = Buffer.concat([content.subarray(0, at), Buffer.from([0xff]), content.subarray(at + replacement.length)])
  expect(invalid.toString('utf8')).toBe(content.toString('utf8'))
  writeFileSync(file, invalid)
  expect(check()).toBe(false)
})

test('ownerCli 啟動時拒絕無效 UTF-8 的政策檔', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-policy-invalid-')); dirs.push(dir)
  const file = join(dir, 'owner.json')
  const valid = Buffer.from(JSON.stringify({ owner: 'owner', sourceConfig: '\uFFFD', enabled: true }))
  const replacement = Buffer.from('\uFFFD')
  const at = valid.indexOf(replacement)
  const invalid = Buffer.concat([valid.subarray(0, at), Buffer.from([0xff]), valid.subarray(at + replacement.length)])
  writeFileSync(file, invalid)
  await expect(ownerCli('owner-run', file)).rejects.toThrow()
})

test('policyFileCheck 不吞快照期差異：ownerCli 必須傳入「當初解析的那份內容」', () => {
  // 防回歸：快照若改成 runOwner 入口重讀，load→run 之間的撤回會被漏掉。
  // 此處語意：check 是「與當初給定位元組相等」，不是「當下可解析」。
  const dir = mkdtempSync(join(tmpdir(), 'adng-policy-snap-')); dirs.push(dir)
  const file = join(dir, 'owner.json')
  writeFileSync(file, 'A')
  const check = policyFileCheck(file, Buffer.from('A'))
  writeFileSync(file, 'not json at all')
  expect(check()).toBe(false) // 毀損＝位元組不同＝撤回
})
