import { afterEach, expect, test } from 'vitest'
import { createServer, type Server } from 'node:http'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { mechanicalAuditor, LongHorizonBackend } from '../src/backends/long-horizon.js'
import { BackendGoalSchema, type AuditRequest } from '../src/backends/types.js'

const roots: string[] = [], servers: Server[] = []
afterEach(async () => {
  for (const server of servers.splice(0)) {
    server.closeAllConnections()
    await new Promise<void>(resolve => server.close(() => resolve()))
  }
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

async function fixture(reply: { status?: number; text?: string; malformed?: boolean }, verifyExit = 0) {
  const cwd = mkdtempSync(join(tmpdir(), 'adng-audit-http-')); roots.push(cwd)
  const git = (...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  writeFileSync(join(cwd, 'check.mjs'), `import {appendFileSync} from 'node:fs'; appendFileSync('verify.log','executed\\n'); process.exit(${verifyExit});\n`)
  git('init', '-q'); git('config', 'user.name', 'Auditor fixture'); git('config', 'user.email', 'fixture@invalid.local')
  git('add', 'check.mjs'); git('commit', '-q', '-m', 'fixture baseline')
  const requests: { model: string }[] = []
  const server = createServer(async (req, res) => {
    let body = ''; for await (const chunk of req) body += chunk
    requests.push(JSON.parse(body) as { model: string })
    res.writeHead(reply.status ?? 200, { 'content-type': 'application/json' })
    res.end(reply.malformed ? 'unparseable fixture response' : JSON.stringify({ choices: [{ message: { content: reply.text ?? '' } }], usage: { total_tokens: 7 } }))
  }); servers.push(server)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address(); if (!address || typeof address === 'string') throw Error('Missing loopback fixture address')
  const audit = mechanicalAuditor({ timeoutMs: 3000, llm: { url: `http://127.0.0.1:${address.port}/v1`, model: 'fixture-independent-auditor', apiKey: 'fixture-placeholder', timeoutMs: 3000 } })
  const request: AuditRequest = { runId: 'audit-fixture', round: 1, cwd, goal: { objective: 'verify a bounded fixture', verifyCommand: 'node check.mjs' }, step: { text: 'bounded fixture' }, exec: { ok: true, output: 'claimed done', costUsd: 0 }, claim: false }
  return { cwd, audit, request, requests, sha: git('rev-parse', 'HEAD') }
}

test.each([
  { status: 503 }, { malformed: true }, { text: '' }, { text: ' \n ' },
  { text: 'No verified decision is available.' }, { text: 'PASS with unreviewed reservations' },
  { text: 'This is not a REJECT decision' }, { text: 'FAIL' }, { text: 'PASS\nREJECT missing evidence' },
])('configured independent Auditor cannot certify missing/ambiguous evidence %j', async reply => {
  const f = await fixture(reply)
  const verdict = await f.audit(f.request)
  expect(verdict.outcome).toBe('blocked')
  expect(verdict.goalAchieved).toBeUndefined()
  expect(verdict.verifyStatus).toBe('pass') // actual mechanical verification remains separate evidence
  expect(verdict.gitSha).toBe(f.sha)
  expect(readFileSync(join(f.cwd, 'verify.log'), 'utf8')).toBe('executed\n')
  expect(f.requests.map(r => r.model)).toEqual(['fixture-independent-auditor'])
})

test.each(['PASS', ' \npass\n '])('configured Auditor accepts explicit positive %j after mechanical verification', async text => {
  const f = await fixture({ text })
  expect(await f.audit(f.request)).toMatchObject({ outcome: 'verified', verifyStatus: 'pass', goalAchieved: true, gitSha: f.sha, usage: { tokensIn: 7 } })
})

test('explicit REJECT retains the rejection and cannot certify completion', async () => {
  const f = await fixture({ text: 'REJECT independently found missing acceptance evidence' })
  const verdict = await f.audit(f.request)
  expect(verdict.outcome).toBe('rejected'); expect(verdict.goalAchieved).toBeUndefined()
})

test('mechanical failure rejects before asking the independent Auditor', async () => {
  const f = await fixture({ text: 'PASS' }, 1)
  expect((await f.audit(f.request)).outcome).toBe('rejected')
  expect(f.requests).toEqual([])
})

test('unconfigured Auditor preserves actual mechanical-only verification', async () => {
  const f = await fixture({ status: 503 })
  expect(await mechanicalAuditor({ timeoutMs: 3000 })(f.request)).toMatchObject({ outcome: 'verified', verifyStatus: 'pass', goalAchieved: true })
  expect(f.requests).toEqual([])
})

test('missing trusted verification command cannot ask an Auditor or certify completion', async () => {
  const f = await fixture({ text: 'PASS' })
  expect((await f.audit({ ...f.request, goal: { objective: f.request.goal.objective } })).outcome).toBe('rejected')
  expect(f.requests).toEqual([])
})

test.each([0, 17])('ordered trusted verification executes every step and gates Auditor on second exit=%i', async exit => {
  const f = await fixture({ text: 'PASS' })
  for (const [name, code] of [['first', 0], ['second', exit], ['last', 0]] as const) {
    writeFileSync(join(f.cwd, `${name}.mjs`), `import {appendFileSync} from 'node:fs'; appendFileSync('steps.log','${name}\\n'); process.exit(${code});\n`)
  }
  const commands = ['node first.mjs', 'node second.mjs', 'node last.mjs']
  const goal = BackendGoalSchema.parse({ objective: f.request.goal.objective, verifyCommand: commands })
  const verdict = await f.audit({ ...f.request, goal })
  expect(verdict.outcome).toBe(exit === 0 ? 'verified' : 'rejected')
  expect(verdict.goalAchieved).toBe(exit === 0 ? true : undefined)
  expect(readFileSync(join(f.cwd, 'steps.log'), 'utf8')).toBe(exit === 0 ? 'first\nsecond\nlast\n' : 'first\nsecond\n')
  expect(f.requests).toHaveLength(exit === 0 ? 1 : 0)
  expect(goal.verifyCommand).toEqual(commands)
})

test('trusted goal schema rejects empty or blank verification arrays', () => {
  for (const commands of [[], [''], ['node check.mjs', '  ']]) {
    expect(() => BackendGoalSchema.parse({ objective: 'fixture', verifyCommand: commands })).toThrow()
  }
})

test('configured Auditor outage remains rejected evidence with no verified checkpoint at the failure cap', async () => {
  const f = await fixture({ status: 503 })
  const backend = new LongHorizonBackend({ dataDir: join(f.cwd, 'data'), auditor: f.audit, maxSameFingerprint: 2,
    executor: async () => ({ ok: true, output: 'claimed done', costUsd: 0 }) })
  const handle = await backend.start(f.request.goal, { cwd: f.cwd, runId: 'outage' })
  expect(await handle.done).toMatchObject({ phase: 'blocked', rounds: 2, verifiedSteps: 0 })
  const evidence = await backend.collectEvidence(handle.runId)
  expect(evidence.checkpoints).toEqual([]); expect(evidence.state.verifiedSteps).toEqual([])
  expect(evidence.attempts.map(a => a.outcome)).toEqual(['blocked', 'blocked'])
})
