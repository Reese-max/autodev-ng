/** Bounded Windows CI only. Local unfiltered flaky-regression remains unchanged. */
import { createHash, randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'
import { parseArgs, stripVTControlCharacters } from 'node:util'
import { z } from 'zod'
import { runProcess, type ProcResult } from './proc.js'

export const CI_SHARDS = 3
export const CI_ROUND_TIMEOUT_MS = 20 * 60_000
type Runner = typeof runProcess
const gitSha = z.string().regex(/^[a-f0-9]{40,64}$/), sha = z.string().regex(/^[a-f0-9]{64}$/)
const specPath = z.string().regex(/^tests\/(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.test\.ts$/)
const Spec = z.object({ path: specPath, blob: gitSha }).strict()
const Manifest = z.object({ head: gitSha, tree: gitSha, files: z.array(Spec).min(CI_SHARDS) }).strict()
export type RegressionManifest = z.infer<typeof Manifest>
const FileResult = z.object({ path: specPath, status: z.enum(['passed', 'pending']), tests: z.number().int().nonnegative(), skipped: z.number().int().nonnegative() }).strict()
  .refine(file => file.skipped <= file.tests && (file.status === 'pending' || file.tests > 0), 'Invalid per-file test evidence')
const Round = z.object({ round: z.number().int().min(1).max(2), files: z.array(FileResult).min(1), durationMs: z.number().finite().nonnegative() }).strict()
const Receipt = z.object({ schema: z.literal('adng.windows-regression-shard/v1'), platform: z.string().min(1), runId: z.string().min(1), attempt: z.number().int().positive(),
  shard: z.number().int().min(1).max(CI_SHARDS), total: z.literal(CI_SHARDS), manifest: Manifest, manifestHash: sha,
  selected: z.array(specPath).min(1), rounds: z.array(Round).max(2), complete: z.boolean(), failures: z.array(z.string().max(200)) }).strict()
export type RegressionShardReceipt = z.infer<typeof Receipt>
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const git = (cwd: string, ...args: string[]) => execFileSync('git', ['-c', `safe.directory=${resolve(cwd).replace(/\\/g, '/')}`, ...args], { cwd, encoding: 'utf8', windowsHide: true, timeout: 30_000, maxBuffer: 4 * 1024 * 1024 }).trim()
function assertCheckout(cwd: string, head: string): void {
  if (git(cwd, 'rev-parse', 'HEAD') !== head) throw new Error('Reviewed checkout head changed')
  git(cwd, 'diff', '--no-ext-diff', '--no-textconv', '--quiet', 'HEAD', '--')
  if (git(cwd, 'ls-files', '--others', '--exclude-standard', '--', 'tests').split(/\r?\n/).some(p => p.endsWith('.test.ts')))
    throw new Error('Unreviewed spec file in CI checkout')
}
function relativeSpec(cwd: string, file: unknown): string {
  if (typeof file !== 'string') throw new Error('Invalid test file identity')
  const path = relative(resolve(cwd), resolve(cwd, file)).replace(/\\/g, '/')
  if (isAbsolute(path)) throw new Error('Test file outside checkout')
  return specPath.parse(path)
}
export function partitionSpecs(manifest: RegressionManifest, shard: number): string[] {
  Manifest.parse(manifest)
  if (!Number.isInteger(shard) || shard < 1 || shard > CI_SHARDS) throw new Error('Invalid CI shard')
  const paths = manifest.files.map(f => f.path)
  if (new Set(paths).size !== paths.length || JSON.stringify(paths) !== JSON.stringify([...paths].sort())) throw new Error('Manifest must be unique and sorted')
  return paths.filter((_, index) => index % CI_SHARDS === shard - 1)
}
function cleanupConfirmed(result: ProcResult): boolean {
  const c = result.cleanup
  return c === undefined || (c.status === 'confirmed' && c.rootClosed && c.remainingPids.length === 0 && c.reasonCodes.length === 0 && (c.unconfirmedControlPids?.length ?? 0) === 0)
}
function healthy(result: ProcResult): boolean { return result.exitCode === 0 && !result.timedOut && !result.aborted && cleanupConfirmed(result) }

/** Full filesOnly discovery deliberately has NO --shard flag: Vitest list ignores it. */
export async function discoverRegressionManifest(cwd: string, expectedHead: string, run: Runner = runProcess): Promise<RegressionManifest> {
  gitSha.parse(expectedHead); assertCheckout(cwd, expectedHead)
  const listed = await run({ command: 'npx', args: ['vitest', 'list', '--filesOnly', '--json'], cwd, stdinText: '', timeoutMs: 120_000 })
  if (!healthy(listed)) throw new Error('Complete spec discovery failed or cleanup unconfirmed')
  const rows = z.array(z.object({ file: z.string() })).parse(JSON.parse(listed.stdout))
  const paths = rows.map(row => relativeSpec(cwd, row.file)).sort()
  if (new Set(paths).size !== paths.length) throw new Error('Duplicate discovered spec')
  const blobs = new Map<string, string>()
  for (const entry of git(cwd, 'ls-tree', '-rz', '--full-tree', 'HEAD', '--', 'tests').split('\0')) {
    const match = /^(100644|100755) blob ([a-f0-9]{40,64})\t(.+)$/.exec(entry)
    if (match) blobs.set(match[3]!, match[2]!)
  }
  const reviewedPaths = [...blobs.keys()].filter(path => path.endsWith('.test.ts')).sort()
  if (JSON.stringify(paths) !== JSON.stringify(reviewedPaths)) throw new Error('Full discovery omits or adds reviewed test specs')
  const files = paths.map(path => { const blob = blobs.get(path); if (!blob) throw new Error('Discovered spec is not a reviewed regular Git blob'); return { path, blob } })
  const manifest = Manifest.parse({ head: expectedHead, tree: git(cwd, 'rev-parse', 'HEAD^{tree}'), files })
  partitionSpecs(manifest, 1); assertCheckout(cwd, expectedHead)
  return manifest
}

/** Accept actual structured framework results; console PASS text is never evidence. */
export function validateRegressionRound(cwd: string, value: unknown, selected: string[], round: number, durationMs: number) {
  const report = z.object({ success: z.literal(true), numFailedTests: z.literal(0), numFailedTestSuites: z.literal(0), numTotalTests: z.number().int().positive(),
    testResults: z.array(z.object({ name: z.string(), status: z.enum(['passed', 'pending']),
      assertionResults: z.array(z.object({ status: z.enum(['passed', 'skipped', 'pending', 'todo']) })) })) }).parse(value)
  const files = report.testResults.map(file => ({ path: relativeSpec(cwd, file.name), status: file.status,
    tests: file.assertionResults.length, skipped: file.assertionResults.filter(a => a.status !== 'passed').length })).sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)
  if (new Set(files.map(f => f.path)).size !== files.length || JSON.stringify(files.map(f => f.path)) !== JSON.stringify([...selected].sort())
    || files.reduce((n, f) => n + f.tests, 0) !== report.numTotalTests) throw new Error('Structured report omits, duplicates or adds selected specs/tests')
  return Round.parse({ round, files, durationMs })
}
function writeReceipt(file: string, receipt: RegressionShardReceipt): void {
  const temporary = `${file}.${randomUUID()}.tmp`
  writeFileSync(temporary, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' }); renameSync(temporary, file)
}
export async function runRegressionShard(cwd: string, options: { shard: number; expectedHead: string; reportDir: string; runId: string; attempt: number }, run: Runner = runProcess): Promise<number> {
  const manifest = await discoverRegressionManifest(cwd, options.expectedHead, run), selected = partitionSpecs(manifest, options.shard)
  mkdirSync(options.reportDir, { recursive: true })
  const file = join(options.reportDir, `shard-${options.shard}.receipt.json`)
  if (existsSync(file)) throw new Error('Stale shard receipt; use a fresh owned report directory')
  const receipt: RegressionShardReceipt = { schema: 'adng.windows-regression-shard/v1', platform: process.platform, runId: options.runId, attempt: options.attempt,
    shard: options.shard, total: CI_SHARDS, manifest, manifestHash: digest(manifest), selected, rounds: [], complete: false, failures: [] }
  Receipt.parse(receipt); writeReceipt(file, receipt)
  for (let round = 1; round <= 2; round++) {
    assertCheckout(cwd, options.expectedHead)
    const raw = join(options.reportDir, `shard-${options.shard}.round-${round}.json`)
    if (existsSync(raw)) throw new Error('Stale framework report; refusing reuse')
    let pending = '', seen = new Set<string>()
    const result = await run({ command: 'npx', args: ['vitest', 'run', ...selected.map(p => resolve(cwd, p)), '--maxWorkers=1',
      '--reporter=dot', '--reporter=default', '--reporter=json', `--outputFile.json=${raw}`], cwd, stdinText: '', timeoutMs: CI_ROUND_TIMEOUT_MS,
      control: { onEvent(event) {
        if (event.type !== 'output') return
        pending = (pending + stripVTControlCharacters(event.text).replace(/\\/g, '/')).slice(-32_768)
        const lines = pending.split(/\r?\n/); pending = lines.pop() ?? ''
        for (const line of lines) {
          const match = /(tests\/[A-Za-z0-9_./-]+\.test\.ts)\s+\(/.exec(line)
          if (match && selected.includes(match[1]!) && !seen.has(match[1]!)) { seen.add(match[1]!); console.log(`[ci-shard] shard=${options.shard}/${CI_SHARDS} round=${round}/2 completed=${match[1]}`) }
        }
      } } })
    try {
      if (!healthy(result)) throw new Error('child-status-or-cleanup-unconfirmed')
      const stat = lstatSync(raw)
      if (!stat.isFile() || stat.size > 32 * 1024 * 1024) throw new Error('framework-report-not-bounded-regular-file')
      const bytes = readFileSync(raw)
      receipt.rounds.push(validateRegressionRound(cwd, JSON.parse(bytes.toString('utf8')), selected, round, result.durationMs))
      assertCheckout(cwd, options.expectedHead)
    } catch {
      receipt.failures.push(`round-${round}:child-or-structured-evidence-failed`)
      console.error(`[ci-shard] shard=${options.shard} round=${round} failed ${JSON.stringify({ exitCode: result.exitCode, timedOut: result.timedOut, aborted: result.aborted ?? false, durationMs: result.durationMs, cleanup: result.cleanup ?? null })}`)
    }
    writeReceipt(file, receipt)
    if (result.exitCode === null || result.timedOut || result.aborted || !cleanupConfirmed(result)) break
  }
  receipt.complete = receipt.failures.length === 0 && receipt.rounds.length === 2
  writeReceipt(file, receipt)
  return receipt.complete ? 0 : 1
}
export function aggregateRegressionShards(expected: RegressionManifest, inputs: unknown[], runId: string, attempt: number, expectedPlatform = 'win32') {
  Manifest.parse(expected); partitionSpecs(expected, 1)
  if (inputs.length !== CI_SHARDS) throw new Error('Missing or extra shard report')
  const receipts = inputs.map(value => Receipt.parse(value)), used = new Set<number>()
  for (const receipt of receipts) {
    if (used.has(receipt.shard) || receipt.platform !== expectedPlatform || receipt.runId !== runId || receipt.attempt !== attempt || !receipt.complete || receipt.failures.length
      || receipt.manifestHash !== digest(expected) || JSON.stringify(receipt.manifest) !== JSON.stringify(expected)
      || JSON.stringify(receipt.selected) !== JSON.stringify(partitionSpecs(expected, receipt.shard))
      || receipt.rounds.length !== 2 || receipt.rounds[0]?.round !== 1 || receipt.rounds[1]?.round !== 2) throw new Error('Mixed, failed, duplicate or incomplete shard evidence')
    used.add(receipt.shard)
    for (const round of receipt.rounds) {
      if (JSON.stringify(round.files.map(f => f.path)) !== JSON.stringify(receipt.selected)
        || round.files.some(f => f.skipped > f.tests)) throw new Error('Round coverage mismatch')
    }
    if (JSON.stringify(receipt.rounds[0]!.files) !== JSON.stringify(receipt.rounds[1]!.files)) throw new Error('Tests or skip status changed between rounds')
  }
  for (const round of [1, 2]) {
    const paths = receipts.flatMap(r => r.rounds[round - 1]!.files.map(f => f.path)).sort()
    if (JSON.stringify(paths) !== JSON.stringify(expected.files.map(f => f.path))) throw new Error('Full suite coverage missing, duplicated or outside manifest')
    if (receipts.reduce((n, r) => n + r.rounds[round - 1]!.files.reduce((sum, f) => sum + f.tests - f.skipped, 0), 0) === 0) throw new Error('No executed framework test evidence')
  }
  return { success: true, platform: expectedPlatform, head: expected.head, tree: expected.tree, manifestHash: digest(expected), specs: expected.files.length, rounds: 2, shards: CI_SHARDS }
}
function readReceipts(dir: string): unknown[] {
  const files: string[] = []
  const visit = (path: string) => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const file = join(path, entry.name)
      if (entry.isSymbolicLink()) throw new Error('Linked shard evidence')
      if (entry.isDirectory()) visit(file)
      else if (entry.isFile()) { if (!/^shard-[1-3]\.receipt\.json$/.test(entry.name) || lstatSync(file).size > 1024 * 1024) throw new Error('Unexpected shard artifact'); files.push(file) }
    }
  }
  visit(dir); return files.map(file => JSON.parse(readFileSync(file, 'utf8')))
}
export async function regressionShardCli(argv: string[]): Promise<number> {
  const { values } = parseArgs({ args: argv, options: { 'ci-shard': { type: 'string' }, aggregate: { type: 'string' }, 'report-dir': { type: 'string' }, 'expected-sha': { type: 'string' } } })
  const expectedHead = values['expected-sha'] ?? process.env.GITHUB_SHA ?? '', runId = process.env.GITHUB_RUN_ID ?? 'local', attempt = Number(process.env.GITHUB_RUN_ATTEMPT ?? '1')
  gitSha.parse(expectedHead); z.number().int().positive().parse(attempt)
  if (values.aggregate && !values['ci-shard'] && !values['report-dir']) {
    const manifest = await discoverRegressionManifest(process.cwd(), expectedHead)
    console.log(JSON.stringify(aggregateRegressionShards(manifest, readReceipts(resolve(values.aggregate)), runId, attempt))); return 0
  }
  if (!values['ci-shard'] || values.aggregate || !values['report-dir']) throw new Error('Use --ci-shard 1|2|3 --report-dir DIR, or --aggregate DIR; exact --expected-sha required outside GitHub')
  return runRegressionShard(process.cwd(), { shard: Number(values['ci-shard']), expectedHead, reportDir: resolve(values['report-dir']), runId, attempt })
}
