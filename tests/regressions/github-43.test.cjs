'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { mkdtempSync, writeFileSync, rmSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join } = require('node:path')
const { pathToFileURL } = require('node:url')
const childProcess = require('node:child_process')
const { syncBuiltinESMExports } = require('node:module')

test('a structured post-execution read failure preserves the candidate and resumes without another Worker', async () => {
  const root = join(__dirname, '..', '..', 'dist', 'github')
  const { GithubConfigSchema } = await import(pathToFileURL(join(root, 'config.js')).href)
  const { githubClient } = await import(pathToFileURL(join(root, 'client.js')).href)
  const { runGithub } = await import(pathToFileURL(join(root, 'runner.js')).href)
  const { readState, saveState } = await import(pathToFileURL(join(root, 'state.js')).href)
  const dir = mkdtempSync(join(tmpdir(), 'adng-43-')), originalExec = childProcess.execFileSync
  try {
    childProcess.execFileSync = (executable, ...args) => {
      if (executable === 'gh') throw Object.assign(new Error('synthetic read failure'), {
        stdout: 'HTTP/2.0 503 Service Unavailable\nretry-after: 60\n\n{"message":"synthetic read failure"}',
      })
      return originalExec(executable, ...args)
    }
    syncBuiltinESMExports()
    const cfg = GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], sourceConfig: join(dir, 'source.json'), dataDir: dir, engine: 'writer', enabled: true })
    writeFileSync(cfg.sourceConfig, '{}')
    const issue = { number: 7, title: 'Fix arithmetic', body: '2 + 3 should be 5', state: 'open', user: { login: 'owner' }, labels: [{ name: 'autodev' }] }
    let reads = 0, executions = 0
    const client = { list: async () => [issue], issue: async () => ++reads === 3 ? githubClient(cfg).issue(7) : issue, findPr: async () => undefined, findLinkedPr: async () => undefined, createPr: async () => { throw new Error('unexpected publication') } }
    const commit = 'a'.repeat(40), execute = async () => { executions++; return { done: true, detail: 'local verification complete', commit } }
    await runGithub(cfg, { client, execute })
    const state = readState(cfg, 7)
    assert.equal(state.commit, commit, 'completed exact SHA must be checkpointed before the remote read')
    assert.equal(state.status, 'queued', 'transient read must defer external verification, not lose the candidate')
    assert.equal(state.runs, 1)
    assert.equal(state.candidateCheck.attempts, 1)
    state.nextRunAt = 0; saveState(cfg, state)
    await runGithub(cfg, { client, execute })
    assert.equal(executions, 1, 'recovery must never rerun the Worker')
    assert.equal(readState(cfg, 7).status, 'ready')
    assert.equal(readState(cfg, 7).runs, 1)
  } finally {
    childProcess.execFileSync = originalExec
    syncBuiltinESMExports()
    rmSync(dir, { recursive: true, force: true })
  }
})
