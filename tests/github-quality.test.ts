import { afterEach, expect, test } from 'vitest'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { GithubConfigSchema } from '../src/github/config.js'
import { assertQuality, verifyQuality } from '../src/github/quality.js'

const dirs: string[] = []
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })

function root() {
  const dir = mkdtempSync(join(tmpdir(), 'adng-github-quality-'))
  dirs.push(dir)
  return dir
}

function contract(required: Array<'unit' | 'coverage' | 'crap' | 'mutation'> = ['unit']) {
  return GithubConfigSchema.parse({
    repo: 'owner/project', authors: ['owner'], sourceConfig: join(root(), 'source.json'), dataDir: root(), engine: 'writer',
    quality: {
      required,
      unit: { command: process.execPath, args: ['-e', 'process.stdout.write("unit-ok")'] },
      coverage: { command: process.execPath, args: ['-e', 'process.stdout.write("coverage-ok")'] },
    },
  }).quality!
}

test('quality receipt proves configured checks without storing raw output', async () => {
  const dir = root(), file = join(dir, 'quality.json'), c = contract()
  await expect(verifyQuality(c, dir, 'a'.repeat(40), file, 5_000)).resolves.toMatchObject({ status: 'passed' })
  const receipt = JSON.parse(readFileSync(file, 'utf8'))
  expect(receipt).toMatchObject({ schema: 'github-quality/v1', status: 'passed', commit: 'a'.repeat(40) })
  expect(receipt.checks).toEqual(expect.arrayContaining([
    expect.objectContaining({ name: 'unit', status: 'passed', outputHash: createHash('sha256').update('unit-ok').digest('hex') }),
  ]))
  expect(JSON.stringify(receipt)).not.toContain('unit-ok')
  expect(() => assertQuality(c, file, 'a'.repeat(40))).not.toThrow()
})

test('missing required advanced checks are unverified and block publication', async () => {
  const dir = root(), file = join(dir, 'quality.json'), c = contract(['unit', 'crap', 'mutation'])
  await expect(verifyQuality(c, dir, 'b'.repeat(40), file, 5_000)).rejects.toThrow('unverified')
  const receipt = JSON.parse(readFileSync(file, 'utf8'))
  expect(receipt.status).toBe('unverified')
  expect(receipt.checks).toEqual(expect.arrayContaining([
    expect.objectContaining({ name: 'crap', status: 'not-configured', required: true }),
    expect.objectContaining({ name: 'mutation', status: 'not-configured', required: true }),
  ]))
  expect(() => assertQuality(c, file, 'b'.repeat(40))).toThrow('unverified')
})

test('a configured failing check records only bounded evidence and blocks', async () => {
  const dir = root(), file = join(dir, 'quality.json')
  const c = GithubConfigSchema.parse({
    repo: 'owner/project', authors: ['owner'], sourceConfig: join(dir, 'source.json'), dataDir: dir, engine: 'writer',
    quality: { unit: { command: process.execPath, args: ['-e', 'process.stderr.write("secret-quality-output"); process.exit(3)'] } },
  }).quality!
  await expect(verifyQuality(c, dir, 'c'.repeat(40), file, 5_000)).rejects.toThrow('failed')
  const receipt = JSON.parse(readFileSync(file, 'utf8'))
  expect(receipt.status).toBe('failed')
  expect(receipt.checks[0]).toMatchObject({ name: 'unit', status: 'failed', exitCode: 3 })
  expect(JSON.stringify(receipt)).not.toContain('secret-quality-output')
})
