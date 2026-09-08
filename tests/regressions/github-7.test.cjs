'use strict'
// Regression for Reese-max/autodev-ng#7:
// codexJson() previously derived the run directory with a relative dataDir, passed that same
// relative directory as the child process cwd, and handed codex exec relative --output-schema /
// --output-last-message paths. Codex then re-resolved those paths beneath the child directory
// and failed with "Failed to read output schema file" before model execution.
//
// This test exercises the real compiled helper (dist/engines/cli-json.js, build first) and uses
// a fake `codex` executable on PATH as the process boundary: no model, login or network is used.
// It must pass on the fixed implementation and fail an assertion on the original implementation
// with a relative data directory. The absolute data directory contract must keep passing.
const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs')
const { tmpdir } = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const ROOT = path.join(__dirname, '..', '..')
const CLI_JSON = path.join(ROOT, 'dist', 'engines', 'cli-json.js')
// Deliberately relative to the repository root cwd to reproduce the reported failure mode.
const REL_DATA_DIR = 'github7-relative-data'

let fakeDir
let journalPath
let codexJson
let originalPath
let schema

function fakeCodexSource(journal) {
  return `'use strict'
const fs = require('node:fs')
const path = require('node:path')
const argv = process.argv.slice(2)
const value = (flag) => { const i = argv.indexOf(flag); return i === -1 ? undefined : argv[i + 1] }
const schema = value('--output-schema')
const answer = value('--output-last-message')
let schemaReadable = false
try { schemaReadable = schema !== undefined && fs.existsSync(schema) } catch { schemaReadable = false }
fs.writeFileSync(${JSON.stringify(journal)}, JSON.stringify({ cwd: process.cwd(), schema, answer, schemaReadable, argv }))
if (!schemaReadable) {
  process.stderr.write('Failed to read output schema file ' + schema + ': No such file or directory (os error 2)\\n')
  process.exit(1)
}
fs.mkdirSync(path.dirname(answer), { recursive: true })
fs.writeFileSync(answer, JSON.stringify({ text: 'MATCH' }))
process.stdout.write(JSON.stringify({ type: 'turn.completed' }) + '\\n')
process.exit(0)
`
}

before(async () => {
  if (!existsSync(CLI_JSON)) {
    throw new Error(`Build the project first (npm run build): missing ${CLI_JSON}`)
  }
  // Real zod schema: the helper serializes it with z.toJSONSchema() and validates the answer with parse().
  const [helper, zod] = await Promise.all([import(pathToFileURL(CLI_JSON).href), import('zod')])
  codexJson = helper.codexJson
  schema = zod.z.object({ text: zod.z.string() })
  fakeDir = mkdtempSync(path.join(tmpdir(), 'adng-github7-fake-'))
  journalPath = path.join(fakeDir, 'codex-journal.json')
  writeFileSync(path.join(fakeDir, 'fake-codex.cjs'), fakeCodexSource(journalPath))
  writeFileSync(path.join(fakeDir, 'codex.cmd'), `@echo off\r\nnode "${path.join(fakeDir, 'fake-codex.cjs')}" %*\r\n`)
  const sh = path.join(fakeDir, 'codex')
  writeFileSync(sh, `#!/bin/sh\nexec node "${path.join(fakeDir, 'fake-codex.cjs')}" "$@"\n`)
  chmodSync(sh, 0o755)
  originalPath = process.env.PATH
  process.env.PATH = fakeDir + path.delimiter + (originalPath ?? '')
})

after(() => {
  if (originalPath === undefined) delete process.env.PATH
  else process.env.PATH = originalPath
  if (fakeDir) rmSync(fakeDir, { recursive: true, force: true, maxRetries: 5 })
})

test('relative dataDir: child cwd and schema/output paths handed to codex exec are absolute', async () => {
  rmSync(path.join(ROOT, REL_DATA_DIR), { recursive: true, force: true, maxRetries: 5 })
  let journal
  try {
    await codexJson({ dataDir: REL_DATA_DIR, model: 'unused', effort: 'low', timeoutMs: 30_000 }, schema, 'prompt').then(
      result => assert.deepEqual(result, { text: 'MATCH' }),
      () => { /* the original implementation rejects before model output; the journal assertions expose the contract break */ },
    )
    journal = JSON.parse(readFileSync(journalPath, 'utf8'))
    assert.ok(path.isAbsolute(journal.cwd), `child cwd must be absolute, got: ${journal.cwd}`)
    assert.ok(path.isAbsolute(journal.schema), `--output-schema must be absolute, got: ${journal.schema}`)
    assert.ok(path.isAbsolute(journal.answer), `--output-last-message must be absolute, got: ${journal.answer}`)
    assert.equal(journal.schemaReadable, true, `schema must be readable from the child cwd (${journal.cwd})`)
  } finally {
    rmSync(path.join(ROOT, REL_DATA_DIR), { recursive: true, force: true, maxRetries: 5 })
  }
})

test('absolute dataDir keeps the absolute child cwd and schema/output contract', async () => {
  const dataDir = mkdtempSync(path.join(tmpdir(), 'adng-github7-abs-'))
  try {
    const result = await codexJson({ dataDir, model: 'unused', effort: 'low', timeoutMs: 30_000 }, schema, 'prompt')
    assert.deepEqual(result, { text: 'MATCH' })
    const journal = JSON.parse(readFileSync(journalPath, 'utf8'))
    assert.ok(path.isAbsolute(journal.cwd), `child cwd must be absolute, got: ${journal.cwd}`)
    assert.ok(path.isAbsolute(journal.schema), `--output-schema must be absolute, got: ${journal.schema}`)
    assert.ok(path.isAbsolute(journal.answer), `--output-last-message must be absolute, got: ${journal.answer}`)
    assert.equal(journal.schemaReadable, true, `schema must be readable from the child cwd (${journal.cwd})`)
  } finally {
    rmSync(dataDir, { recursive: true, force: true, maxRetries: 5 })
  }
})