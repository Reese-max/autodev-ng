import { expect, test } from 'vitest'
import { execFileSync, spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { TeamState } from '../src/engines/team-state.js'

const TS_HOOK = pathToFileURL(join(process.cwd(), 'tests', 'helpers', 'ts-transpile-hook.mjs')).href
const CHILD_ARGS = ['--experimental-loader', TS_HOOK, '--input-type=module']

function nextLine(child: ChildProcessWithoutNullStreams, timeoutMs = 30_000): Promise<string> {
  return new Promise((resolve, reject) => {
    let output = ''
    let stderr = ''
    const finish = (error?: Error, line?: string): void => {
      clearTimeout(timer)
      child.stdout.off('data', onStdout)
      child.stderr.off('data', onStderr)
      child.off('error', onError)
      child.off('close', onClose)
      if (error) reject(error)
      else resolve(line!)
    }
    const onStdout = (chunk: Buffer): void => {
      output += chunk.toString()
      const newline = output.indexOf('\n')
      if (newline >= 0) finish(undefined, output.slice(0, newline).trim())
    }
    const onStderr = (chunk: Buffer): void => { stderr += chunk.toString() }
    const onError = (error: Error): void => finish(error)
    const onClose = (code: number | null): void => finish(new Error(`Child ended before reporting a result (exit=${String(code)}): ${stderr.trim()}`))
    const timer = setTimeout(() => finish(new Error(`Child did not report a result within ${timeoutMs}ms: ${stderr.trim()}`)), timeoutMs)
    child.stdout.on('data', onStdout)
    child.stderr.on('data', onStderr)
    child.once('error', onError)
    child.once('close', onClose)
  })
}

function waitForClose(child: ChildProcessWithoutNullStreams, timeoutMs = 30_000): Promise<number | null> {
  if (child.exitCode !== null) return Promise.resolve(child.exitCode)
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      child.off('close', onClose)
      reject(new Error(`Child did not exit within ${timeoutMs}ms`))
    }, timeoutMs)
    const onClose = (code: number | null): void => {
      clearTimeout(timer)
      resolve(code)
    }
    child.once('close', onClose)
  })
}

async function waitForFile(path: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (!existsSync(path) && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 10))
  if (!existsSync(path)) throw new Error(`File was not created before timeout: ${path}`)
}

async function terminate(child: ChildProcessWithoutNullStreams | undefined): Promise<void> {
  if (!child || child.exitCode !== null || child.signalCode !== null) return
  child.kill('SIGKILL')
  await new Promise<void>(resolve => child.once('close', () => resolve()))
}

test('concurrent owner and runner processes yield at most one active team claim', async () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-owner-lock-team-'))
  const dataDir = join(root, 'owner-data')
  const projectPath = join(root, 'project')
  const sourceConfig = join(root, 'source.json')
  const claimLog = join(root, 'team-claims.jsonl')
  const firstEntered = join(root, 'first-claim-held')
  const releaseFirst = join(root, 'release-first-claim')
  const ownerUrl = pathToFileURL(join(process.cwd(), 'src', 'github', 'owner.ts')).href
  const runnerUrl = pathToFileURL(join(process.cwd(), 'src', 'github', 'runner.ts')).href
  const teamUrl = pathToFileURL(join(process.cwd(), 'src', 'engines', 'team-state.ts')).href
  const script = `
    import { existsSync, appendFileSync, writeFileSync } from 'node:fs';
    import { OwnerConfigSchema, repoConfig, runOwner } from ${JSON.stringify(ownerUrl)};
    import { runGithub } from ${JSON.stringify(runnerUrl)};
    import { TeamState } from ${JSON.stringify(teamUrl)};
    const [dataDir, sourceConfig, projectPath, claimLog, firstEntered, releaseFirst, holdFirst] = process.argv.slice(1);
    const ownerCfg = OwnerConfigSchema.parse({ owner: 'owner', authors: ['owner'], sourceConfig, dataDir,
      engine: 'fixture', enabled: true, publish: false, label: null });
    const repo = { full_name: 'owner/project', owner: { login: 'owner' }, default_branch: 'main',
      archived: false, disabled: false, has_issues: true, permissions: { push: true } };
    const issue = { number: 1, title: 'Shared task', body: 'run exactly one owner claim', state: 'open',
      user: { login: 'owner' }, labels: [] };
    const client = { list: async () => [issue], issue: async () => issue, findPr: async () => undefined,
      findLinkedPr: async () => undefined, createPr: async () => { throw new Error('publication is disabled'); } };
    const execute = async (_cfg, state) => {
      const team = new TeamState(projectPath);
      try {
        const claim = team.claim({ executionId: 'owner-run-' + process.pid,
          task: { id: 'github-shared-task', text: 'same task', line: 1, status: 'open', ownership: { write: ['src/shared.ts'], resources: [] } },
          workerId: 'github-fixture', reservedCostUsd: 0, spentUsd: 0, dailyHardUsd: 0, leaseMs: 30_000 });
        appendFileSync(claimLog, JSON.stringify({ pid: process.pid, ok: claim.ok, reason: claim.ok ? undefined : claim.reason }) + '\\n');
        if (claim.ok && holdFirst === 'true') {
          writeFileSync(firstEntered, 'held');
          const cell = new Int32Array(new SharedArrayBuffer(4));
          const deadline = Date.now() + 30_000;
          while (!existsSync(releaseFirst) && Date.now() < deadline) Atomics.wait(cell, 0, 0, 10);
          if (!existsSync(releaseFirst)) throw new Error('parent did not release first team claim');
          team.release('owner-run-' + process.pid, claim.token);
        }
        return { done: false, attempted: true, detail: claim.ok ? 'team claim acquired' : 'team claim rejected' };
      } finally { team.close(); }
    };
    const run = (child, options) => runGithub(child, { client, execute, policyCheck: options.policyCheck });
    const ownerResult = await runOwner(ownerCfg, false, () => [repo], run);
    const runnerResult = await runGithub(repoConfig(ownerCfg, repo), { client, execute });
    console.log(JSON.stringify({ ownerStatus: ownerResult.status, runnerResult }));
  `

  let first: ChildProcessWithoutNullStreams | undefined
  let second: ChildProcessWithoutNullStreams | undefined
  try {
    execFileSync('git', ['init', '-b', 'main', projectPath], { encoding: 'utf8', windowsHide: true })
    writeFileSync(sourceConfig, '{}')

    first = spawn(process.execPath, [...CHILD_ARGS, '-e', script, dataDir, sourceConfig, projectPath, claimLog, firstEntered, releaseFirst, 'true'], { stdio: ['pipe', 'pipe', 'pipe'] })
    const firstResult = nextLine(first)
    void firstResult.catch(() => {}) // Keep cleanup failures from becoming unhandled if an earlier assertion fails.
    await waitForFile(firstEntered)

    second = spawn(process.execPath, [...CHILD_ARGS, '-e', script, dataDir, sourceConfig, projectPath, claimLog, firstEntered, releaseFirst, 'false'], { stdio: ['pipe', 'pipe', 'pipe'] })
    const secondResult = JSON.parse(await nextLine(second)) as { ownerStatus: string; runnerResult: string }
    expect(await waitForClose(second)).toBe(0)
    expect(secondResult).toEqual({ ownerStatus: 'locked', runnerResult: 'locked' })

    const team = new TeamState(projectPath)
    try {
      expect(team.snapshot().claims.filter(claim => claim.active === 1)).toHaveLength(1)
    } finally { team.close() }
    const claimsWhileHeld = readFileSync(claimLog, 'utf8').trim().split(/\r?\n/).map(line => JSON.parse(line) as { ok: boolean })
    expect(claimsWhileHeld.map(claim => claim.ok)).toEqual([true])

    writeFileSync(releaseFirst, 'continue')
    const firstOutput = JSON.parse(await firstResult) as { ownerStatus: string; runnerResult: string }
    expect(await waitForClose(first)).toBe(0)
    expect(firstOutput.ownerStatus).toBe('ok')
    expect(firstOutput.runnerResult).toBe('idle')
    const finalClaims = readFileSync(claimLog, 'utf8').trim().split(/\r?\n/).map(line => JSON.parse(line) as { ok: boolean })
    expect(finalClaims.filter(claim => claim.ok)).toHaveLength(1)
  } finally {
    if (existsSync(releaseFirst)) writeFileSync(releaseFirst, 'cleanup')
    await terminate(second)
    await terminate(first)
    rmSync(root, { recursive: true, force: true })
  }
}, 120_000)
