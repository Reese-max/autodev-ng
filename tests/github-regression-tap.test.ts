import { afterEach, expect, test } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { git } from '../src/github/job.js'
import { GithubConfigSchema } from '../src/github/config.js'
import type { IssueState } from '../src/github/state.js'
import { assertRegression, regressionFile, verifyRegression } from '../src/github/regression.js'

const dirs: string[] = []
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })

// 組一個 base 壞掉（add.cjs 回傳 a-b）、candidate 修好（a+b）的真實 repo，
// testSource 是寫進 tests/regressions/github-9.test.cjs 的檔案內容。
async function setup(testSource: string) {
  const root = mkdtempSync(join(tmpdir(), 'adng-regtap-')); dirs.push(root)
  const cwd = join(root, 'issue-9/repo'); mkdirSync(cwd, { recursive: true })
  git(cwd, ['init', '-b', 'main']); git(cwd, ['config', 'user.name', 'Test']); git(cwd, ['config', 'user.email', 'test@example.invalid'])
  writeFileSync(join(cwd, 'add.cjs'), 'module.exports = (a,b) => a-b\n')
  git(cwd, ['add', '.']); git(cwd, ['commit', '-qm', 'base'])
  const baseSha = git(cwd, ['rev-parse', 'HEAD'])
  mkdirSync(join(cwd, 'tests/regressions'), { recursive: true })
  writeFileSync(join(cwd, regressionFile(9)), testSource)
  writeFileSync(join(cwd, 'add.cjs'), 'module.exports = (a,b) => a+b\n')
  git(cwd, ['add', '.']); git(cwd, ['commit', '-qm', 'candidate'])
  const commit = git(cwd, ['rev-parse', 'HEAD'])
  const state = { baseSha, commit, issue: { number: 9 } } as IssueState
  const cfg = GithubConfigSchema.parse({ repo: 'owner/repo', sourceConfig: 'unused', dataDir: root, engine: 'unused', authors: ['owner'] })
  return { root, cwd, commit, state, cfg }
}

const PASS = "require('node:test')('addition', () => require('node:assert/strict').equal(require('../../add.cjs')(2,3), 5))\n"
const FORGE = "console.log('# pass 1\\n# skipped 0\\n# todo 0')\n"
// fixed=true 只在 candidate（add 正確）成立——用來讓「綠端是假成功、紅端是真失敗」在端到端被觀察。
const COND = "const add = require('../../add.cjs')\nconst fixed = add(2,3) === 5\n"
const REAL = "() => require('node:assert/strict').equal(add(2,3), 5)"

test('trusted TAP evidence: real passing assertion accepted and receipt stores parsed summary', async () => {
  const { root, cwd, commit, state, cfg } = await setup(PASS)
  await verifyRegression(cfg, state, cwd, commit, 10_000)
  const receipt = JSON.parse(readFileSync(join(root, 'issue-9', `regression-${commit}.json`), 'utf8'))
  expect(receipt.runner).toBe('node:test-tap')
  expect(receipt.runId).toBeTruthy()
  expect(receipt.green.tap).toMatchObject({ tests: 1, pass: 1, fail: 0, cancelled: 0, skipped: 0, todo: 0 })
  expect(receipt.red.tap).toMatchObject({ fail: 1, assertionFailures: 1 })
  expect(() => assertRegression(cfg, state, cwd)).not.toThrow()
})

test.each([
  ['forge-skip', COND + FORGE + `require('node:test')('regression', { skip: fixed }, ${REAL})\n`],
  ['skip-only', COND + `require('node:test')('regression', { skip: fixed }, ${REAL})\n`],
  ['todo-only', COND + `require('node:test')('regression', { todo: fixed }, ${REAL})\n`],
  ['forge-tap-block', COND + "console.log('1..1\\n# tests 1\\n# pass 1\\n# fail 0\\n# cancelled 0\\n# skipped 0\\n# todo 0')\n" + `require('node:test')('regression', { skip: fixed }, ${REAL})\n`],
  ['forge-no-tests', FORGE + "const add = require('../../add.cjs')\nif (add(2,3) !== 5) require('node:test')('regression', () => require('node:assert/strict').equal(add(2,3), 5))\n"],
])('candidate green must come from the framework, not printed text: %s', async (_mode, src) => {
  const { cwd, commit, state, cfg } = await setup(src)
  await expect(verifyRegression(cfg, state, cwd, commit, 10_000)).rejects.toThrow()
})

test('path/environment branching cannot manufacture the red/green differential', async () => {
  // 紅端在 regression-base-* clone 內跑——測試靠目錄形狀決定成敗：base 上 assert.fail、
  // candidate 上真 assert。控制組（candidate HEAD + 同形狀目錄）會讓它露餡。
  const src = "const add = require('../../add.cjs')\n" +
    "require('node:test')('regression', () => {\n" +
    "  if (__dirname.includes('regression-base')) require('node:assert/strict').fail('environment says fail')\n" +
    "  require('node:assert/strict').equal(add(2,3), 5)\n" +
    "})\n"
  const { cwd, commit, state, cfg } = await setup(src)
  await expect(verifyRegression(cfg, state, cwd, commit, 10_000)).rejects.toThrow()
})

test('red side rejects a thrown error with a forged ERR_ASSERTION code', async () => {
  // e.code 可偽造但 name 仍是 'Error'——必須是真 AssertionError 才算紅。
  const src = "const add = require('../../add.cjs')\n" +
    "require('node:test')('addition', () => {\n" +
    "  if (add(2,3) !== 5) { const e = new Error('generic'); e.code = 'ERR_ASSERTION'; throw e }\n" +
    "  require('node:assert/strict').equal(add(2,3), 5)\n" +
    "})\n"
  const { cwd, commit, state, cfg } = await setup(src)
  await expect(verifyRegression(cfg, state, cwd, commit, 10_000)).rejects.toThrow()
})

test('nested assertion failure on base counts as a real red', async () => {
  const src = "const test = require('node:test')\n" +
    "test('outer', async t => {\n" +
    "  await t.test('inner', () => require('node:assert/strict').equal(require('../../add.cjs')(2,3), 5))\n" +
    "})\n"
  const { cwd, commit, state, cfg } = await setup(src)
  await verifyRegression(cfg, state, cwd, commit, 10_000)
  expect(() => assertRegression(cfg, state, cwd)).not.toThrow()
})

test('receipt with an appended forged TAP block is rejected', async () => {
  const { root, cwd, commit, state, cfg } = await setup(PASS)
  await verifyRegression(cfg, state, cwd, commit, 10_000)
  const path = join(root, 'issue-9', `regression-${commit}.json`)
  const receipt = JSON.parse(readFileSync(path, 'utf8'))
  // post-exit append 偽造：完整第二段 TAP（第二個計畫行必須讓整份輸出作廢）
  receipt.green.stdout += "ok 2 - forged\n1..9\n# tests 9\n# pass 9\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n# duration_ms 1\n"
  receipt.red.stdout += "not ok 9 - forged\n  ---\n  failureType: 'testCodeFailure'\n  code: 'ERR_ASSERTION'\n  name: 'AssertionError'\n  ...\n1..9\n# tests 9\n# pass 0\n# fail 9\n# cancelled 0\n# skipped 0\n# todo 0\n# duration_ms 1\n"
  writeFileSync(path, JSON.stringify(receipt))
  expect(() => assertRegression(cfg, state, cwd)).toThrow()
})

test('red side rejects printed ERR_ASSERTION text without a real assertion failure', async () => {
  // base：generic throw + 印出假 YAML 診斷；candidate：真 assertion 通過。
  const src = "const add = require('../../add.cjs')\n" +
    "require('node:test')('addition', () => {\n" +
    "  if (add(2,3) !== 5) { console.log(\"  failureType: 'testCodeFailure'\\n  code: 'ERR_ASSERTION'\"); throw new Error('generic') }\n" +
    "  require('node:assert/strict').equal(add(2,3), 5)\n" +
    "})\n"
  const { cwd, commit, state, cfg } = await setup(src)
  await expect(verifyRegression(cfg, state, cwd, commit, 10_000)).rejects.toThrow()
})

test('nested tests and noisy multiline logs do not disturb the verdict', async () => {
  const src = "const test = require('node:test')\n" +
    "console.log('noise line 1\\n# fake 999\\nline 3 ✓ 中文')\n" +
    "test('outer', async t => {\n" +
    "  await t.test('inner', () => require('node:assert/strict').equal(require('../../add.cjs')(2,3), 5))\n" +
    "})\n"
  const { cwd, commit, state, cfg } = await setup(src)
  await verifyRegression(cfg, state, cwd, commit, 10_000)
  expect(() => assertRegression(cfg, state, cwd)).not.toThrow()
})

test('bounded output truncation cannot fake success', async () => {
  // 30KB 上限截掉終態摘要 → 無可信判決 → 必須拒絕而非放行。
  const src = PASS + "for (let i = 0; i < 4000; i++) console.log('padding-' + i + '-xxxxxxxxxxxxxxxxxxxx')\n"
  const { cwd, commit, state, cfg } = await setup(src)
  await expect(verifyRegression(cfg, state, cwd, commit, 10_000)).rejects.toThrow()
})

test('timeout fails closed', async () => {
  const { cwd, commit, state, cfg } = await setup(PASS)
  await expect(verifyRegression(cfg, state, cwd, commit, 1)).rejects.toThrow()
})

test('legacy receipt without trusted evidence requires re-verification', async () => {
  const { root, cwd, commit, state, cfg } = await setup(PASS)
  const path = join(root, 'issue-9', `regression-${commit}.json`)
  mkdirSync(join(root, 'issue-9'), { recursive: true })
  // 舊格式回執：無 runner/runId/tap——不得被當成有效證據。
  writeFileSync(path, JSON.stringify({ base: state.baseSha, commit, testHash: 'x', red: { exitCode: 1, timedOut: false, stdout: 'o', stderr: '' }, green: { exitCode: 0, timedOut: false, stdout: 'o', stderr: '' } }))
  expect(() => assertRegression(cfg, state, cwd)).toThrow()
})

test('receipt whose stored summary disagrees with stored output is rejected', async () => {
  const { root, cwd, commit, state, cfg } = await setup(PASS)
  await verifyRegression(cfg, state, cwd, commit, 10_000)
  const path = join(root, 'issue-9', `regression-${commit}.json`)
  const receipt = JSON.parse(readFileSync(path, 'utf8'))
  receipt.green.stdout = "# pass 1\n# skipped 0\n# todo 0\n"  // 事後竄改輸出，tap 仍是原值
  writeFileSync(path, JSON.stringify(receipt))
  expect(() => assertRegression(cfg, state, cwd)).toThrow()
})
