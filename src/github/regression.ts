import { createHash, randomUUID } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { z } from 'zod'
import { command } from './client.js'
import type { GithubConfig } from './config.js'
import { issueDir, type IssueState } from './state.js'
import { runProcess } from '../engines/proc.js'
import { runVerify } from '../verify.js'

export const regressionFile = (number: number) => `tests/regressions/github-${number}.test.cjs`
const git = (cwd: string, ...args: string[]) => command('git', ['-c', `safe.directory=${cwd.replace(/\\/g, '/')}`, ...args], cwd)
const hash = (text: string) => createHash('sha256').update(text).digest('hex')
const receiptFile = (cfg: GithubConfig, state: IssueState, commit: string) => join(issueDir(cfg, state.issue.number), `regression-${commit}.json`)
const Outcome = z.object({ exitCode: z.number().int().nullable(), timedOut: z.boolean(), stdout: z.string(), stderr: z.string() })
const Receipt = z.object({ base: z.string(), commit: z.string(), testHash: z.string(), red: Outcome, green: Outcome })
function passed(r: z.infer<typeof Outcome>) {
  return !r.timedOut && r.exitCode === 0 && /# pass [1-9]\d*/.test(r.stdout) && /# skipped 0/.test(r.stdout) && /# todo 0/.test(r.stdout)
}
function failedAssertion(r: z.infer<typeof Outcome>) {
  return !r.timedOut && r.exitCode === 1 && /ERR_ASSERTION/.test(r.stdout) && /# fail [1-9]\d*/.test(r.stdout)
}
function testSource(cwd: string, base: string, commit: string, file: string) {
  const entry = git(cwd, 'ls-tree', commit, '--', file)
  if (!/^100644 blob /.test(entry) || git(cwd, 'ls-tree', base, '--', file)) throw new Error(`Add a new regular regression test: ${file}`)
  // ponytail: additive tests only; existing test changes require human review rather than automatic publication.
  const changed = git(cwd, 'diff', '--name-only', '--diff-filter=DMRT', base, commit).split(/\r?\n/)
  if (changed.some(p => /(^|\/)(tests?|__tests__)(\/|\.)|\.(test|spec)\./i.test(p))) throw new Error('Existing tests must not be modified, removed or renamed by automatic repairs')
  return git(cwd, 'show', `${commit}:${file}`)
}

export async function verifyRegression(cfg: GithubConfig, state: IssueState, cwd: string, commit: string, timeoutMs: number): Promise<void> {
  if (!state.baseSha || git(cwd, 'rev-parse', 'HEAD') !== commit) throw new Error('Regression candidate/base missing or changed')
  const file = regressionFile(state.issue.number), source = testSource(cwd, state.baseSha, commit, file)
  const run = (root: string) => runProcess({ command: process.execPath, args: ['--test', '--test-reporter=tap', file], cwd: root, stdinText: '', timeoutMs, maxOutputChars: 30_000 })
  const green = await run(cwd)
  if (!passed(green)) throw new Error(`Regression must pass with active assertions: ${green.stdout.slice(-1500)} ${green.stderr.slice(-500)}`)
  const replay = join(issueDir(cfg, state.issue.number), `regression-base-${randomUUID()}`)
  git(cwd, 'clone', '--shared', '--no-checkout', '--', cwd, replay)
  git(replay, 'checkout', '--detach', state.baseSha)
  const prep = cfg.regressionPrepareCommand ?? cfg.repair?.prepareCommand
  if (prep) {
    const setup = await runVerify({ command: prep, cwd: replay, timeoutMs })
    if (setup.status !== 'pass') throw new Error(`Regression baseline setup failed: ${setup.detail}`)
  }
  for (const dir of ['tests', 'tests/regressions']) {
    const path = join(replay, dir)
    if (existsSync(path) && (!lstatSync(path).isDirectory() || lstatSync(path).isSymbolicLink())) throw new Error('Regression path is not a regular directory')
  }
  mkdirSync(dirname(join(replay, file)), { recursive: true }); writeFileSync(join(replay, file), source)
  const red = await run(replay)
  if (!failedAssertion(red)) throw new Error(`Regression must fail an assertion on the original code: ${red.stdout.slice(-1500)} ${red.stderr.slice(-500)}`)
  if (git(cwd, 'rev-parse', 'HEAD') !== commit || git(replay, 'rev-parse', 'HEAD') !== state.baseSha
    || git(cwd, 'status', '--porcelain', '--untracked-files=no') || git(replay, 'status', '--porcelain', '--untracked-files=no')
    || git(cwd, 'hash-object', `--path=${file}`, file) !== git(cwd, 'rev-parse', `${commit}:${file}`)
    || readFileSync(join(replay, file), 'utf8') !== source) throw new Error('Regression execution changed the tested source or commit')
  writeFileSync(receiptFile(cfg, state, commit), JSON.stringify({ base: state.baseSha, commit, testHash: hash(source), red, green }, null, 2))
}

export function assertRegression(cfg: GithubConfig, state: IssueState, cwd: string): void {
  if (!state.baseSha || !state.commit) throw new Error('Regression commit missing')
  const source = testSource(cwd, state.baseSha, state.commit, regressionFile(state.issue.number))
  const receipt = Receipt.parse(JSON.parse(readFileSync(receiptFile(cfg, state, state.commit), 'utf8')))
  if (receipt.base !== state.baseSha || receipt.commit !== state.commit || receipt.testHash !== hash(source)
    || !passed(receipt.green) || !failedAssertion(receipt.red)) throw new Error('Missing exact regression red/green evidence')
}
