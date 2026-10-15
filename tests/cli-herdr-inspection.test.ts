import { afterEach, expect, test, vi } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { runCli } from '../src/cli/entry.js'
import { HerdrEngine } from '../src/engines/herdr.js'

const roots: string[] = []
afterEach(() => {
  vi.restoreAllMocks(); process.exitCode = undefined
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'adng-inspection-cli-')); roots.push(root)
  const project = join(root, 'project'), data = join(root, 'data'), config = join(root, 'config.json')
  mkdirSync(project); mkdirSync(join(data, 'executions', 'active'), { recursive: true }); mkdirSync(join(data, 'herdr'))
  writeFileSync(config, JSON.stringify({ projectPath: './project', backlogFile: './project/BACKLOG.md', dataDir: './data', engine: 'mock' }))
  const id = 'cli-execution', taskId = 'task-cli', base = 'a'.repeat(40), requestId = `adng-${taskId}-aaaaaaaa-${id}`
  writeFileSync(join(data, 'executions', 'active', id + '.json'), JSON.stringify({ version: 1, executionId: id, taskId, projectPath: project, adapter: 'herdr',
    hostPid: 123, hostStartedAt: 10, startedAt: 20, observedAt: 30, sequence: 0, phase: 'unknown', outputBytes: 0,
    unknownSamples: 0, degraded: false, cancelRequested: false }))
  writeFileSync(join(data, 'herdr', requestId + '.expected.json'), JSON.stringify({ schemaVersion: 1, executionId: id, taskId, repo: project, requestId, baseCommit: base,
    session: 'herdr-autopilot', launcher: join(root, 'owned-launcher.ps1'), issuedAt: '2000-01-01T00:00:00.000Z' }))
  const result = { schemaVersion: 1, executionId: id, taskId, repo: project, requestId, baseCommit: base, session: 'herdr-autopilot',
    server: 'owned-server', pane: 'owned-pane', status: 'done', detail: 'ordinary producer detail' }
  const resultFile = join(data, 'herdr', requestId + '.result.json')
  writeFileSync(resultFile, JSON.stringify(result))
  return { root, data, project, config, id, requestId, result, resultFile }
}

function inventory(root: string): Record<string, string> {
  const values: Record<string, string> = {}
  function visit(path: string, prefix: string) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const name = prefix + entry.name, file = join(path, entry.name)
      values[name + (entry.isDirectory() ? '/' : '')] = entry.isDirectory() ? 'directory' : createHash('sha256').update(readFileSync(file)).digest('hex')
      if (entry.isDirectory()) visit(file, name + '/')
    }
  }
  visit(root, ''); return values
}

async function inspect(config: string, id: string, requestId?: string) {
  const stdout: string[] = []
  const log = vi.spyOn(console, 'log').mockImplementation(value => { stdout.push(String(value)) })
  process.exitCode = undefined
  try {
    await runCli(['execution', 'inspect-herdr', '--config', config, '--id', id,
      ...(requestId === undefined ? [] : ['--request-id', requestId])], 'cli.js')
    return { stdout, observation: JSON.parse(stdout[0]!), exitCode: process.exitCode ?? 0 }
  } finally { log.mockRestore() }
}

test('actual public CLI chooses inspection twice, not Engine.run/preflight or state creation', async () => {
  const f = fixture(), before = inventory(f.root)
  const run = vi.spyOn(HerdrEngine.prototype, 'run').mockRejectedValue(new Error('unexpected dispatch'))
  const preflight = vi.spyOn(HerdrEngine.prototype, 'preflight').mockRejectedValue(new Error('unexpected preflight'))
  const first = await inspect(f.config, f.id)
  expect(first).toMatchObject({ exitCode: 0, observation: { status: 'correlated-v1-done', dispatched: false, trustedTerminal: false, deliveryVerified: false } })
  expect((await inspect(f.config, f.id, f.requestId)).observation).toEqual(first.observation)
  expect(inventory(f.root)).toEqual(before)
  expect(run).not.toHaveBeenCalled(); expect(preflight).not.toHaveBeenCalled()
  expect(first.stdout.join('')).not.toContain(f.result.detail)
  expect(first.stdout.join('')).not.toContain(f.result.server)
  expect(first.stdout.join('')).not.toContain('owned-launcher')
})

test('public CLI failed-v1 exit0 is explicitly correlation only', async () => {
  const f = fixture(); writeFileSync(f.resultFile, JSON.stringify({ ...f.result, status: 'failed' }))
  expect(await inspect(f.config, f.id)).toMatchObject({ exitCode: 0, observation: { status: 'correlated-v1-failed', hostCommitted: false, trustedTerminal: false } })
})

test('public CLI missing or mismatched result exits2 and never rewrites/retries', async () => {
  const f = fixture(); rmSync(f.resultFile)
  let before = inventory(f.root)
  expect(await inspect(f.config, f.id)).toMatchObject({ exitCode: 2, observation: { status: 'missing', reason: 'result-missing-or-unsupported' } })
  expect(inventory(f.root)).toEqual(before)
  writeFileSync(f.resultFile, JSON.stringify({ ...f.result, requestId: 'another-request' })); before = inventory(f.root)
  expect(await inspect(f.config, f.id)).toMatchObject({ exitCode: 2, observation: { status: 'mismatch', reason: 'result-mismatch' } })
  expect(inventory(f.root)).toEqual(before)
})

test('public CLI untracked ID and wrong selector exit2 without reconstructing state', async () => {
  const f = fixture(), before = inventory(f.root)
  expect(await inspect(f.config, 'unknown-execution')).toMatchObject({ exitCode: 2, observation: { status: 'untracked' } })
  expect(await inspect(f.config, f.id, 'old-request')).toMatchObject({ exitCode: 2, observation: { status: 'mismatch', reason: 'request-selector-mismatch' } })
  expect(inventory(f.root)).toEqual(before)
})

test('inspection selector is exclusive to inspection and never falls into cancellation', async () => {
  const f = fixture(), before = inventory(f.root)
  await expect(runCli(['execution', 'cancel', '--config', f.config, '--id', f.id, '--request-id', f.requestId], 'cli.js')).rejects.toThrow('用法：adng execution')
  expect(inventory(f.root)).toEqual(before)
})
