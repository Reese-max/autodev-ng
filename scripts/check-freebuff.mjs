import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { ConfigSchema } from '../dist/types.js'
import { makeEngineRegistry } from '../dist/engines/registry.js'

const { values } = parseArgs({ options: { live: { type: 'boolean', default: false } } })
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'data/maintenance/freebuff')
mkdirSync(root, { recursive: true })
const dir = mkdtempSync(join(root, 'check-'))
const cfg = ConfigSchema.parse({ projectPath: dir, dataDir: dir, backlogFile: join(dir, 'BACKLOG.md'),
  engines: { freebuff: { adapter: 'freebuff', timeoutMs: 180_000, costPerRunUsd: 0 } }, defaultEngine: 'freebuff' })
const engine = makeEngineRegistry(cfg).resolve('freebuff')
const preflight = await engine.preflight()
const receipt = { at: new Date().toISOString(), dir, live: values.live, preflight }
try {
  assert.ok(preflight.ok, preflight.detail)
  if (values.live) {
    const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8', windowsHide: true }).trim()
    git('init', '-b', 'canary'); git('config', 'user.name', 'AutoDev Freebuff Canary'); git('config', 'user.email', 'canary@example.invalid')
    git('config', 'core.autocrlf', 'false')
    writeFileSync(join(dir, 'sum.cjs'), 'module.exports = (a, b) => a - b\n')
    writeFileSync(join(dir, 'check.cjs'), "const assert = require('node:assert/strict'); const sum = require('./sum.cjs'); assert.equal(sum(2,3),5); assert.equal(sum(-2,3),1); assert.equal(sum(0,0),0);\n")
    git('add', 'sum.cjs', 'check.cjs'); git('commit', '-qm', 'test: failing Freebuff canary')
    const check = () => spawnSync(process.execPath, ['check.cjs'], { cwd: dir, encoding: 'utf8', windowsHide: true })
    receipt.beforeExit = check().status; assert.equal(receipt.beforeExit, 1)
    receipt.result = await engine.run({ projectPath: dir, task: { id: 'freebuff-canary', line: 0, status: 'open',
      text: '只修改 sum.cjs，使它正確相加 a 與 b。不要修改 check.cjs 或其他檔案。執行 node check.cjs，通過後只提交 sum.cjs；不可連網、安裝套件、推送或操作其他目錄。' } })
    assert.ok(receipt.result.ok, receipt.result.failureReason)
    receipt.afterExit = check().status; assert.equal(receipt.afterExit, 0)
    assert.equal(git('diff', '--name-only', receipt.result.baseCommitHash, receipt.result.commitHash), 'sum.cjs')
    assert.equal(git('status', '--porcelain', '--untracked-files=no'), '')
    assert.equal(git('ls-files', '--others', '--exclude-standard'), 'preflight-cache-freebuff.json')
    receipt.gate = 'LIVE_ADAPTER_PASS'
  } else receipt.gate = 'PREFLIGHT_PASS_ONLY'
} catch (error) {
  receipt.gate = 'FAIL'; receipt.error = error.message; process.exitCode = 1
} finally {
  writeFileSync(join(dir, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n')
  console.log(JSON.stringify(receipt, null, 2))
}
