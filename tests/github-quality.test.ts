import { afterEach, expect, test } from 'vitest'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { GithubConfigSchema } from '../src/github/config.js'
import { assertQuality, QualityConfigSchema, verifyQuality } from '../src/github/quality.js'

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

function parseQuality(quality: unknown) {
  return GithubConfigSchema.parse({
    repo: 'owner/project', authors: ['owner'], sourceConfig: join(root(), 'source.json'), dataDir: root(), engine: 'writer', quality,
  })
}

test('quality receipt proves configured checks without storing raw output', async () => {
  const dir = root(), file = join(dir, 'quality.json'), c = contract()
  await expect(verifyQuality(c, dir, 'a'.repeat(40), file, 5_000)).resolves.toMatchObject({ status: 'passed' })
  const receipt = JSON.parse(readFileSync(file, 'utf8'))
  expect(receipt).toMatchObject({ schema: 'github-quality/v1', status: 'passed', commit: 'a'.repeat(40) })
  expect(receipt.checks).toEqual(expect.arrayContaining([
    expect.objectContaining({ name: 'unit', status: 'passed', outputHash: createHash('sha256').update('unit-ok').digest('hex') }),
  ]))
  expect(readFileSync(file, 'utf8').endsWith('\n')).toBe(true)
  expect(JSON.stringify(receipt)).not.toContain('unit-ok')
  expect(() => assertQuality(c, file, 'a'.repeat(40))).not.toThrow()
})

test('quality config validates command and required bounds', () => {
  expect(() => QualityConfigSchema.parse({ unit: { command: '   ', args: [] } })).toThrow()
  expect(() => QualityConfigSchema.parse({ required: [] })).toThrow()
  expect(() => QualityConfigSchema.parse({ required: ['unit', 'unit'] })).toThrow()
  expect(QualityConfigSchema.parse({ required: ['unit', 'coverage'] }).required).toEqual(['unit', 'coverage'])
  expect(QualityConfigSchema.parse({}).required).toEqual(['unit'])
  expect(() => QualityConfigSchema.parse({ required: ['unit', 'coverage', 'crap', 'mutation', 'unit'] })).toThrow()
  let error: unknown
  try { QualityConfigSchema.parse({ required: ['unit', 'unit'] }) } catch (caught) { error = caught }
  expect((error as { issues: Array<{ path: string[]; message: string }> }).issues[0]).toMatchObject({ path: ['required'], message: 'quality.required cannot contain duplicates' })
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
  expect(receipt.checks.find((check: { name: string }) => check.name === 'crap')).toMatchObject({ timedOut: false, outputHash: createHash('sha256').update('').digest('hex') })
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

test('a failed check skips later commands with bounded skipped evidence', async () => {
  const dir = root(), file = join(dir, 'quality.json')
  const c = parseQuality({
    unit: { command: process.execPath, args: ['-e', 'process.exit(3)'] },
    coverage: { command: process.execPath, args: ['-e', 'process.exit(0)'] },
  }).quality!
  await expect(verifyQuality(c, dir, 'd'.repeat(40), file, 5_000)).rejects.toThrow('failed')
  const receipt = JSON.parse(readFileSync(file, 'utf8'))
  expect(receipt.checks[1]).toMatchObject({ name: 'coverage', status: 'skipped', exitCode: null, timedOut: false, durationMs: 0 })
  expect(receipt.checks[1].outputHash).toBe(createHash('sha256').update('').digest('hex'))
})

test('quality commands receive bounded empty stdin', async () => {
  const dir = root(), file = join(dir, 'quality.json')
  const c = parseQuality({
    unit: { command: process.execPath, args: ['-e', "process.exit(require('node:fs').readFileSync(0, 'utf8') === '' ? 0 : 3)"] },
  }).quality!
  await expect(verifyQuality(c, dir, 'e'.repeat(40), file, 5_000)).resolves.toMatchObject({ status: 'passed' })
})

test('assertQuality rejects stale, failed, and incomplete receipts', async () => {
  const dir = root(), file = join(dir, 'quality.json'), commit = 'f'.repeat(40), c = contract(['unit', 'coverage'])
  await verifyQuality(c, dir, commit, file, 5_000)
  const base = JSON.parse(readFileSync(file, 'utf8'))
  const expectMissing = (change: Record<string, unknown>, expected = 'Missing exact quality evidence') => {
    writeFileSync(file, JSON.stringify({ ...base, ...change }))
    expect(() => assertQuality(c, file, commit)).toThrow(expected)
  }
  expectMissing({ schema: 'github-quality/other' })
  writeFileSync(file, JSON.stringify(base))
  expect(() => assertQuality(c, file, '0'.repeat(40))).toThrow('Missing exact quality evidence')
  expectMissing({ contractHash: '0'.repeat(64) })
  expectMissing({ status: 'failed' }, 'Quality gate failed')
  expectMissing({ checks: base.checks.filter((check: { name: string }) => check.name !== 'coverage') }, 'coverage is unverified')
  expectMissing({ checks: base.checks.map((check: { name: string; status: string }) => check.name === 'coverage' ? { ...check, status: 'failed' } : check) }, 'coverage is unverified')
})
