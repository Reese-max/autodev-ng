'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { mkdtempSync, writeFileSync, rmSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join } = require('node:path')
const { pathToFileURL } = require('node:url')

test('Issue Quality denial prevents actual runner dispatch in label-free and opt-in modes', async () => {
  const root = join(__dirname, '..', '..', 'dist', 'github')
  const { GithubConfigSchema, eligible } = await import(pathToFileURL(join(root, 'config.js')).href)
  const { runGithub } = await import(pathToFileURL(join(root, 'runner.js')).href)
  const { readState } = await import(pathToFileURL(join(root, 'state.js')).href)
  for (const label of [null, 'autodev']) {
    const dir = mkdtempSync(join(tmpdir(), 'adng-42-'))
    try {
      const cfg = GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], label, sourceConfig: join(dir, 'source.json'), dataDir: dir, engine: 'writer', enabled: true })
      writeFileSync(cfg.sourceConfig, '{}')
      const issue = { number: 7, title: 'Research only', body: '```yaml\nissue_quality_version: 2\nkind: RESEARCH\ntriage: NEEDS_EVIDENCE\nauto_implementation: false\n```', state: 'open', user: { login: 'owner' }, labels: [{ name: 'autodev' }] }
      assert.equal(eligible(issue, cfg), false, 'research metadata must veto existing label/author eligibility')
      let executions = 0
      const client = { list: async () => [issue], issue: async () => issue, findPr: async () => undefined, findLinkedPr: async () => undefined, createPr: async () => { throw new Error('unexpected publication') } }
      await runGithub(cfg, { client, execute: async () => { executions++; return { done: false, detail: 'unexpected writer' } } })
      assert.equal(executions, 0)
      assert.equal(readState(cfg, 7), undefined)
    } finally { rmSync(dir, { recursive: true, force: true }) }
  }
})
