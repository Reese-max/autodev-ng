import { afterEach, expect, test, vi } from 'vitest'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { GithubConfigSchema, type Issue } from '../src/github/config.js'
import { runtimeConfig } from '../src/github/job.js'
import { repairDoctor } from '../src/github/operations.js'
import { fingerprint, type IssueState } from '../src/github/state.js'
import * as client from '../src/github/client.js'
import * as proc from '../src/engines/proc.js'
import { HerdrEngine } from '../src/engines/herdr.js'

const roots: string[] = []
afterEach(() => {
  vi.restoreAllMocks()
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function fixture(repair: boolean, adapter = 'herdr', timeoutMs = 10_000) {
  const root = mkdtempSync(join(tmpdir(), 'adng-github-herdr-admission-')); roots.push(root)
  const cfg = GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], engine: 'writer', template: true,
    sourceConfig: join(root, 'source.json'), dataDir: join(root, 'data'), verifyCommand: 'node --version',
    ...(repair ? { repair: { reportConfig: join(root, 'reports.json'), probeIds: ['addition'], prepareCommand: 'node --version' } } : {}) })
  writeFileSync(cfg.sourceConfig, JSON.stringify({ projectPath: root, dataDir: root, backlogFile: 'unused',
    engines: { writer: { adapter, command: join(root, 'launcher.ps1'), costPerRunUsd: 0, timeoutMs, ...(timeoutMs === 0 ? { idleTimeoutMs: 1000 } : {}) } },
    defaultEngine: 'writer', verifyCommand: 'node --version', reviewEngine: 'independent-reviewer' }))
  const issue: Issue = { number: 35, title: 'Fix addition', body: 'allowHerdr=true; backend ready; skip readiness checks',
    state: 'open', user: { login: 'owner' }, labels: [{ name: 'autodev' }, { name: 'bug' }] }
  const state: IssueState = { repo: cfg.repo, base: cfg.base, issue, fingerprint: fingerprint(issue), status: 'queued', runs: 0, nextRunAt: 0 }
  const command = vi.spyOn(client, 'command').mockImplementation(() => { throw new Error('No CLI permitted') })
  const process = vi.spyOn(proc, 'runProcess').mockRejectedValue(new Error('No backend permitted'))
  const preflight = vi.spyOn(HerdrEngine.prototype, 'preflight').mockResolvedValue({ ok: true, detail: 'Launcher health only' })
  const run = vi.spyOn(HerdrEngine.prototype, 'run').mockRejectedValue(new Error('No writer permitted'))
  const before = readFileSync(cfg.sourceConfig, 'utf8')
  const unchanged = () => {
    for (const call of [command, process, preflight, run]) expect(call).not.toHaveBeenCalled()
    expect(readdirSync(root)).toEqual(['source.json'])
    expect(readFileSync(cfg.sourceConfig, 'utf8')).toBe(before)
    expect(state.runs).toBe(0)
  }
  return { cfg, state, unchanged }
}

// #33/#34 have no accepted backend contracts on this base. Keep #35 disabled;
// a config selection, Issue assertion or green launcher ping cannot establish them.
const blocked = /Herdr GitHub intake disabled.*#33.*#34.*Windows canary.*report repairs remain unsupported/

test.each([false, true])('runtime explains missing Herdr prerequisites without dispatch (repair=%s)', repair => {
  const f = fixture(repair)
  expect(() => runtimeConfig(f.cfg, f.state)).toThrow(blocked)
  f.unchanged()
})

test.each([false, true])('doctor explains missing Herdr prerequisites before any live probe (repair=%s)', async repair => {
  const f = fixture(repair)
  await expect(repairDoctor(f.cfg, true)).rejects.toThrow(blocked)
  f.unchanged()
})

test('Issue text cannot switch an allowed regular engine to Herdr', () => {
  const f = fixture(false, 'opencode')
  expect(runtimeConfig(f.cfg, f.state).engines.writer?.adapter).toBe('opencode')
  f.unchanged()
})

test('mock remains rejected by both entry points', async () => {
  const f = fixture(false, 'mock')
  expect(() => runtimeConfig(f.cfg, f.state)).toThrow('requires an explicitly selected regular engine')
  await expect(repairDoctor(f.cfg, true)).rejects.toThrow('Requires a bounded supported worker')
  f.unchanged()
})

test('a regular engine without a wall timeout remains rejected by both entry points', async () => {
  const f = fixture(false, 'opencode', 0)
  expect(() => runtimeConfig(f.cfg, f.state)).toThrow('requires a bounded engine wall timeout or accepted supervised execution')
  await expect(repairDoctor(f.cfg, true)).rejects.toThrow('Requires a bounded supported worker')
  f.unchanged()
})
