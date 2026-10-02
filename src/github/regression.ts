import { createHash, randomUUID } from 'node:crypto'
import { fork } from 'node:child_process'
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { command } from './client.js'
import type { GithubConfig } from './config.js'
import { runDir, type IssueState } from './state.js'
import { killTree, runProcess } from '../engines/proc.js'
import { runVerify } from '../verify.js'

export const regressionFile = (number: number, cfg?: GithubConfig, state?: IssueState) => cfg?.regression
  ? cfg.regression.file.replaceAll('{issue}', String(number)).replaceAll('{revision}', String(state?.revision?.round ?? 0))
  : `tests/regressions/github-${number}${state?.revision ? `-r${state.revision.round}` : ''}.test.cjs`
const git = (cwd: string, ...args: string[]) => command('git', ['-c', `safe.directory=${cwd.replace(/\\/g, '/')}`, ...args], cwd)
const hash = (text: string) => createHash('sha256').update(text).digest('hex')
const receiptFile = (cfg: GithubConfig, state: IssueState, commit: string) => join(runDir(cfg, state), `regression-${commit}.json`)
const FrameworkSummary = z.object({
  success: z.boolean(),
  tests: z.number().int().nonnegative(),
  passed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  cancelled: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  todo: z.number().int().nonnegative(),
  assertionFailures: z.number().int().nonnegative(),
  realTests: z.number().int().nonnegative()
})
const RUNNER_ID = 'node:test.run/process'
const RUNNER_VERSION = '1'
const RUNNER_FILE = join(dirname(fileURLToPath(import.meta.url)), 'regression-runner.cjs')
type RunnerMetadata = { identity: typeof RUNNER_ID | 'custom-unverified'; version: string; nodeVersion?: string; sourceHash?: string }
const RunnerMessage = z.object({
  protocol: z.literal('autodev.node-test-runner'),
  protocolVersion: z.literal(1),
  runId: z.string().min(1),
  nodeVersion: z.string().min(1),
  stdout: z.string(),
  stderr: z.string(),
  framework: FrameworkSummary.optional(),
  runnerError: z.string().optional()
})
const Outcome = z.object({
  exitCode: z.number().int().nullable(),
  timedOut: z.boolean(),
  stdout: z.string(),
  stderr: z.string(),
  framework: FrameworkSummary.optional(),
  runId: z.string().optional(),
  nodeVersion: z.string().optional(),
  runnerHash: z.string().optional()
})
const Receipt = z.object({
  base: z.string(),
  commit: z.string(),
  testFile: z.string(),
  testHash: z.string(),
  contract: z.string().optional(),
  runner: z.object({ identity: z.enum([RUNNER_ID, 'custom-unverified']), version: z.string(), nodeVersion: z.string().optional(), sourceHash: z.string().optional() }),
  runId: z.string(),
  issuedAt: z.string(),
  red: Outcome,
  green: Outcome,
  control: Outcome
})

type RegressionOutcome = z.infer<typeof Outcome>

function currentRunner(): RunnerMetadata {
  return { identity: RUNNER_ID, version: RUNNER_VERSION, nodeVersion: process.version, sourceHash: hash(readFileSync(RUNNER_FILE, 'utf8')) }
}

function runTrustedNodeTests(cwd: string, file: string, timeoutMs: number): Promise<RegressionOutcome> {
  const runId = randomUUID()
  const runnerHash = hash(readFileSync(RUNNER_FILE, 'utf8'))
  const child = fork(RUNNER_FILE, [file, runId], {
    cwd,
    execPath: process.execPath,
    execArgv: [],
    env: { ...process.env, NODE_OPTIONS: '' },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc']
  })
  return new Promise(resolve => {
    let messageCount = 0
    let message: z.infer<typeof RunnerMessage> | undefined
    let stdout = ''
    let stderr = ''
    let stdoutTruncated = false
    let stderrTruncated = false
    let timedOut = false
    let settled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const finish = (outcome: RegressionOutcome) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      resolve(outcome)
    }
    const appendOutput = (current: string, value: string, truncated: boolean) => {
      const marker = '\n[adng: output truncated]'
      if (truncated) return { output: current, truncated }
      const available = Math.max(0, 30_000 - marker.length - current.length)
      if (value.length <= available) return { output: current + value, truncated: false }
      return { output: current + value.slice(0, available) + marker, truncated: true }
    }
    child.stdout?.setEncoding('utf8')
    child.stdout?.on('data', chunk => {
      const capture = appendOutput(stdout, String(chunk), stdoutTruncated)
      stdout = capture.output
      stdoutTruncated = capture.truncated
    })
    child.stderr?.setEncoding('utf8')
    child.stderr?.on('data', chunk => {
      const capture = appendOutput(stderr, String(chunk), stderrTruncated)
      stderr = capture.output
      stderrTruncated = capture.truncated
    })
    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        timedOut = true
        void killTree(child.pid, { command: process.execPath }).catch(() => undefined).finally(() => {
          finish({ exitCode: null, timedOut: true, stdout, stderr: stderr || 'Trusted regression runner timed out' })
        })
      }, timeoutMs)
    }
    child.on('message', raw => {
      messageCount++
      const parsed = RunnerMessage.safeParse(raw)
      if (!parsed.success || parsed.data.runId !== runId || parsed.data.nodeVersion !== process.version) return
      message = parsed.data
    })
    child.on('error', error => {
      if (!timedOut) finish({ exitCode: null, timedOut: false, stdout: '', stderr: `Trusted regression runner failed to start: ${String(error)}` })
    })
    child.on('close', code => {
      if (timedOut || settled) return
      if (messageCount !== 1 || !message || !message.framework
        || code !== (message.framework.success ? 0 : 1)) {
        finish({ exitCode: null, timedOut: false, stdout, stderr: [stderr, message?.runnerError, `Trusted runner summary missing or invalid (exit ${code})`].filter(Boolean).join('\n') })
        return
      }
      finish({ exitCode: message.framework.success ? 0 : 1, timedOut: false, stdout, stderr,
        framework: message.framework, runId: message.runId, nodeVersion: message.nodeVersion, runnerHash })
    })
  })
}

function greenOk(r: RegressionOutcome, cfg: GithubConfig) {
  if (cfg.regression) return !r.timedOut && r.exitCode === 0 && new RegExp(cfg.regression.passPattern).test(r.stdout + r.stderr)
  const summary = r.framework
  return !r.timedOut && r.exitCode === 0 && !!summary && summary.success && summary.tests >= 1 && summary.passed >= 1
    && summary.realTests >= 1 && summary.failed === 0 && summary.cancelled === 0 && summary.skipped === 0 && summary.todo === 0
}
function redOk(r: RegressionOutcome, cfg: GithubConfig) {
  if (cfg.regression) return !r.timedOut && r.exitCode === 1 && new RegExp(cfg.regression.failPattern).test(r.stdout + r.stderr)
  const summary = r.framework
  return !r.timedOut && r.exitCode === 1 && !!summary && !summary.success && summary.realTests >= 1 && summary.failed >= 1 && summary.assertionFailures >= 1
}
function consistent(r: RegressionOutcome, runner: RunnerMetadata) {
  return runner.identity === RUNNER_ID && !!runner.nodeVersion && !!runner.sourceHash
    && !!r.framework && !!r.runId && r.nodeVersion === runner.nodeVersion && r.runnerHash === runner.sourceHash
    && r.framework.success === (r.exitCode === 0)
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
  const file = regressionFile(state.issue.number, cfg, state), source = testSource(cwd, state.baseSha, commit, file)
  const run = async (root: string) => {
    if (cfg.regression) {
      // Compatibility mode remains pattern-based and unverified; #47's trusted framework contract applies to node:test only.
      const r = await runProcess({ command: cfg.regression.command,
        args: cfg.regression.args.map(arg => arg.replaceAll('{file}', file)), cwd: root, stdinText: '', timeoutMs, maxOutputChars: 30_000 })
      return { exitCode: r.exitCode, timedOut: r.timedOut, stdout: r.stdout, stderr: r.stderr }
    }
    return runTrustedNodeTests(root, join(root, file), timeoutMs)
  }
  const green = await run(cwd)
  if (!greenOk(green, cfg)) {
    const stderr = green.stderr.length > 2_000
      ? `${green.stderr.slice(0, 1_000)}\n[adng: runner diagnostics truncated]\n${green.stderr.slice(-1_000)}`
      : green.stderr
    throw new Error(`Regression must pass with a trusted active test summary: ${green.stdout.slice(-1_000)} ${stderr}`)
  }
  const replay = join(runDir(cfg, state), `regression-base-${randomUUID()}`)
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
  if (!redOk(red, cfg)) throw new Error(`Regression must fail an assertion on the original code: ${red.stdout.slice(-1500)} ${red.stderr.slice(-500)}`)
  // 控制組：candidate commit 放進同形狀的 `regression-base-*` clone 再跑一次。
  // 紅與控制組的可觀測差異只剩 git HEAD——測試若靠目錄形狀或環境分流（例如
  // `__dirname.includes('regression-base')` 就硬 fail），控制組會露餡 → 拒絕。
  const control = join(runDir(cfg, state), `regression-base-${randomUUID()}`)
  git(cwd, 'clone', '--shared', '--no-checkout', '--', cwd, control)
  git(control, 'checkout', '--detach', commit)
  if (prep) {
    const setup = await runVerify({ command: prep, cwd: control, timeoutMs })
    if (setup.status !== 'pass') throw new Error(`Regression control setup failed: ${setup.detail}`)
  }
  for (const dir of ['tests', 'tests/regressions']) {
    const path = join(control, dir)
    if (existsSync(path) && (!lstatSync(path).isDirectory() || lstatSync(path).isSymbolicLink())) throw new Error('Regression path is not a regular directory')
  }
  mkdirSync(dirname(join(control, file)), { recursive: true }); writeFileSync(join(control, file), source)
  const ctrl = await run(control)
  if (!greenOk(ctrl, cfg)) throw new Error(`Regression control run must pass on the candidate: ${ctrl.stdout.slice(-1500)}`)
  // 測試檔本身在控制組是被覆寫成 source 的已知差異（command() 會 trim 掉 blob 尾端），
  // 其完整性由 control-source 單獨核對；status 檢查其餘檔案即可。
  const dirty = (dir: string, exclude?: string) =>
    // command() 會 trim 整段輸出，單行 ` M <path>` 的前導空格會被吃掉——用結尾比對檔名。
    git(dir, 'status', '--porcelain', '--untracked-files=no').split(/\r?\n/)
      .some(l => l.trim() !== '' && !(exclude && l.endsWith(` ${exclude}`)))
  const integrity: [string, boolean][] = [
    ['cwd-head', git(cwd, 'rev-parse', 'HEAD') !== commit],
    ['replay-head', git(replay, 'rev-parse', 'HEAD') !== state.baseSha],
    ['control-head', git(control, 'rev-parse', 'HEAD') !== commit],
    ['cwd-dirty', dirty(cwd)],
    ['replay-dirty', dirty(replay)],
    ['control-dirty', dirty(control, file)],
    ['source-hash', git(cwd, 'hash-object', `--path=${file}`, file) !== git(cwd, 'rev-parse', `${commit}:${file}`)],
    ['replay-source', readFileSync(join(replay, file), 'utf8') !== source],
    ['control-source', readFileSync(join(control, file), 'utf8') !== source],
  ]
  const bad = integrity.filter(([, failed]) => failed).map(([name]) => name)
  if (bad.length) throw new Error(`Regression execution changed the tested source or commit (${bad.join(',')})`)
  const runner: RunnerMetadata = cfg.regression
    ? { identity: 'custom-unverified' as const, version: 'config-regex' }
    : currentRunner()
  if (!cfg.regression && (!consistent(green, runner) || !consistent(red, runner) || !consistent(ctrl, runner))) {
    throw new Error('Trusted regression evidence does not match the current runner identity/version')
  }
  writeFileSync(receiptFile(cfg, state, commit), JSON.stringify({ base: state.baseSha, commit, testFile: file, testHash: hash(source),
    runner, runId: randomUUID(), issuedAt: new Date().toISOString(),
    ...(cfg.regression ? { contract: JSON.stringify(cfg.regression) } : {}), red, green, control: ctrl }, null, 2))
}

export function assertRegression(cfg: GithubConfig, state: IssueState, cwd: string): void {
  if (!state.baseSha || !state.commit) throw new Error('Regression commit missing')
  const file = regressionFile(state.issue.number, cfg, state)
  const source = testSource(cwd, state.baseSha, state.commit, file)
  const receipt = Receipt.parse(JSON.parse(readFileSync(receiptFile(cfg, state, state.commit), 'utf8')))
  const expectedRunner: RunnerMetadata = cfg.regression
    ? { identity: 'custom-unverified', version: 'config-regex' }
    : currentRunner()
  if (receipt.base !== state.baseSha || receipt.commit !== state.commit || receipt.testHash !== hash(source)
    || receipt.testFile !== file
    || receipt.runner.identity !== expectedRunner.identity || receipt.runner.version !== expectedRunner.version
    || receipt.runner.nodeVersion !== expectedRunner.nodeVersion || receipt.runner.sourceHash !== expectedRunner.sourceHash
    || receipt.contract !== (cfg.regression ? JSON.stringify(cfg.regression) : undefined)
    || (!cfg.regression && (!consistent(receipt.green, expectedRunner) || !consistent(receipt.red, expectedRunner) || !consistent(receipt.control, expectedRunner)))
    || !greenOk(receipt.green, cfg) || !redOk(receipt.red, cfg) || !greenOk(receipt.control, cfg)) throw new Error('Missing exact regression red/green evidence')
}
