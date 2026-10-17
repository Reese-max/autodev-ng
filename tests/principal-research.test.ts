import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { runInNewContext } from 'node:vm'
import { afterEach, expect, test } from 'vitest'

const root = process.cwd()
const study = resolve(root, 'docs/research/issue-17-principal-replay')
const dirs: string[] = []
const temporary = () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-principal-review-'))
  dirs.push(dir)
  return dir
}
afterEach(() => { while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true }) })

test('a refused duplicate child grant preserves the durable registry', () => {
  const dir = temporary(), file = join(dir, 'registry.json'), grant = join(dir, 'child.json')
  const principal = (principalId: string, parentPrincipalId: string | null) => ({
    schemaVersion: 'principal-research/v1', principalId, parentPrincipalId,
    ownerRef: 'fixture-owner:human-boundary-unmodified', role: 'offline-research-worker',
    engineTag: 'freebuff', runtimeFingerprint: 'a'.repeat(64), lifecycle: 'ACTIVE',
    identityIsolation: 'MOCK_DEDICATED', credentialBinding: 'MOCK_REFERENCE',
    capabilities: ['LOCAL_FIXTURE_COMMIT'],
  })
  writeFileSync(file, JSON.stringify({ schemaVersion: 'principal-research/v1', ownerState: 'ACTIVE',
    principals: [principal('PARENT', null)], leases: [], usedExecutions: [] }))
  writeFileSync(grant, JSON.stringify({ principal: principal('CHILD', 'PARENT'), policyGrant: 'EXPLICIT_MOCK_CHILD_SUBSET',
    lease: { schemaVersion: 'principal-research/v1', leaseId: 'lease-CHILD', principalId: 'CHILD',
      executionId: 'execution-child', credentialRef: 'fixture-ref:CHILD', notBeforeMs: Date.now() - 1000,
      expiresAtMs: Date.now() + 60000, capabilities: ['LOCAL_FIXTURE_COMMIT'] } }))
  const createChild = () => spawnSync(process.execPath,
    [join(study, 'mock-authority.mjs'), 'admin', file, 'create-child', grant, root],
    { encoding: 'utf8', timeout: 10000, windowsHide: true })
  expect(createChild().status).toBe(0)
  const before = readFileSync(file, 'utf8')
  const refused = createChild()
  expect(refused.status).toBe(1)
  expect(refused.stderr).toContain('DUPLICATE_IDENTITY')
  expect(readFileSync(file, 'utf8')).toBe(before)
})

test('published lease schema agrees with the runtime nonnegative timestamp constraint', () => {
  const check = spawnSync(process.execPath, ['--input-type=module', '-e', `
    process.argv[1] = 'replay.mjs'; process.argv[2] = ${JSON.stringify(root)};
    const { jsonSchemas, Lease } = await import(${JSON.stringify(pathToFileURL(join(study, 'schemas.mjs')).href)});
    const schema = jsonSchemas();
    const lease = { schemaVersion: 'principal-research/v1', leaseId: 'lease-A', principalId: 'A',
      executionId: 'execution-A', credentialRef: 'fixture-ref:A', notBeforeMs: -1,
      expiresAtMs: 1, capabilities: ['LOCAL_FIXTURE_COMMIT'] };
    console.log(JSON.stringify({ schema, acceptsNegative: Lease.safeParse(lease).success }));
  `], { encoding: 'utf8', timeout: 10000, windowsHide: true })
  expect(check.status).toBe(0)
  const actual = JSON.parse(check.stdout)
  expect(actual.acceptsNegative).toBe(false)
  expect(actual.schema.AgentPrincipalLease.properties.notBeforeMs.minimum).toBe(0)
  expect(JSON.parse(readFileSync(join(study, 'schemas.json'), 'utf8'))).toEqual(actual.schema)
})

test.each([
  ['matching attribution', 'A', 'execution-A-first', 0],
  ['wrong principal', 'B', 'execution-A-first', 1],
  ['wrong execution', 'A', 'execution-B-first', 1],
])('the emitted Node check validates %s', (_, principalId, executionId, exit) => {
  const replay = readFileSync(join(study, 'replay.mjs'), 'utf8').replace(/\r\n/g, '\n')
  // Exercise the actual emitted program without starting the historical adapter replay.
  const expression = replay.match(/writeFileSync\(join\(project,'check\.cjs'\),(.+)\)$/m)?.[1]
  expect(expression).toBeDefined()
  const check = runInNewContext(expression!, { id: 'A', executionId: 'execution-A-first' }) as string
  const dir = temporary()
  writeFileSync(join(dir, 'check.cjs'), check)
  writeFileSync(join(dir, 'result.json'), JSON.stringify({ principalId, executionId }))
  const result = spawnSync(process.execPath, ['--test', 'check.cjs'],
    { cwd: dir, encoding: 'utf8', timeout: 10000, windowsHide: true })
  expect(result.status, result.stdout + result.stderr).toBe(exit)
})

test('the historical design routes readers to the final compatible receipt contract', () => {
  const draft = readFileSync(join(root, 'docs/research/issue-17-agent-principal.md'), 'utf8')
  expect(draft).toContain('issue-17-principal-replay/README.md')
  expect(draft).toContain('PrincipalReceipt')
  expect(draft).toContain('writerIdentity')
})
