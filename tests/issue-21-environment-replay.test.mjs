import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import test, { after } from 'node:test'

const repo = fileURLToPath(new URL('../', import.meta.url))
const sdk = mkdtempSync(join(tmpdir(), 'adng-environment-sdk-'))
after(() => rmSync(sdk, { recursive: true, force: true }))
const exec = (command, args, cwd = repo) => execFileSync(command, args, {
  cwd, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], timeout: 90_000,
})
const archive = join(sdk, 'source.tar')
exec('git', ['archive', '--format=tar', `--output=${archive}`, 'a2378aa6fea3605f596e3ee264adbb2eb04c9010', 'src', 'package.json', 'tsconfig.json', 'tsconfig.build.json'])
exec('tar', ['-xf', 'source.tar'], sdk)
symlinkSync(join(repo, 'node_modules'), join(sdk, 'node_modules'), 'junction')
exec(process.execPath, [join(repo, 'node_modules/typescript/bin/tsc'), '-p', join(sdk, 'tsconfig.build.json')])
process.env.RESEARCH_SOURCE = sdk
const { observe, preflight, sha, ledgerIdentity, safeEnv } = await import('../docs/research/issue-21-environment-replay/contract.mjs')
const { digest } = await import('../docs/research/issue-21-environment-replay/mock-authority.mjs')
const { RunDb } = await import(pathToFileURL(join(sdk, 'dist/db.js')))
const { TeamState } = await import(pathToFileURL(join(sdk, 'dist/engines/team-state.js')))
const { attemptAccounting } = await import(pathToFileURL(join(sdk, 'dist/engines/attempt-accounting.js')))
const template = JSON.parse(readFileSync(new URL('../docs/research/issue-21-environment-replay/evidence/run/cases/actual-portable-forward/input.json', import.meta.url), 'utf8'))

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'adng-environment-review-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const cwd = join(root, 'source')
  mkdirSync(cwd)
  const git = (...args) => execFileSync('git', ['-c', 'core.autocrlf=false', '-c', `core.hooksPath=${join(cwd, 'absent-hooks')}`, ...args], {
    cwd, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
  git('-c', 'init.templateDir=', 'init', '-b', 'main')
  git('config', 'user.name', 'Offline regression fixture')
  git('config', 'user.email', 'fixture@invalid.example')
  git('remote', 'add', 'origin', 'fixture://owned-project/no-network')
  for (const [name, content] of Object.entries({
    'fixture-cli.mjs': "import {writeFileSync} from 'node:fs'; if(process.argv[2]==='--version') console.log('offline-fixture-cli/v1'); else writeFileSync('finished.txt','done')\n",
    'check.cjs': "require('node:assert/strict').equal(require('node:fs').readFileSync('finished.txt','utf8'),'done')\n",
    'capability.json': JSON.stringify({ networkCapability: 'TRUSTED_FIXTURE_NETWORK_SENTINEL_ONLY' }),
    'effect-policy.json': JSON.stringify({ decision: 'DENY' }),
    'skill.txt': 'fixture skill\n', 'artifact.txt': 'fixture artifact\n', 'evidence.json': '{}\n', 'checkpoint.txt': 'fixture checkpoint\n',
  })) writeFileSync(join(cwd, name), content)
  git('add', '.')
  git('commit', '-m', 'fixture checkpoint')
  return { root, cwd, git, q: { ...structuredClone(template), cwd } }
}

function handoff(t) {
  const f = fixture(t), { root, cwd, git } = f
  const data = join(root, 'billing'), configs = join(root, 'configs')
  mkdirSync(data); mkdirSync(configs)
  const db = new RunDb(join(data, 'run.db'))
  db.record({ taskId: 'synthetic-booked', ok: true, costUsd: .25, detail: 'synthetic only', engine: 'fixture', accounting: attemptAccounting({ ok: true, output: 'fixture', costUsd: .25, tokensIn: 0, tokensOut: 0, tokensCached: 0 }, { costPerRunUsd: .25 }) })
  db.close()
  const config = join(configs, 'source.json')
  writeFileSync(config, JSON.stringify({ dataDir: data, timezoneOffsetHours: 0, engines: {} }))
  const team = new TeamState(cwd), ledger = team.path
  const budget = { ...template.budget, policyHash: sha(readFileSync(config)), ledgerIdentityDigest: ledgerIdentity(ledger) }
  team.close()
  const authority = JSON.parse(readFileSync(new URL('../docs/research/issue-21-environment-replay/evidence/run/mock-principal-registry.json', import.meta.url), 'utf8'))
  authority.leases[0].notBeforeMs = Date.now() - 1000
  authority.leases[0].expiresAtMs = Date.now() + 60_000
  const authorityPath = join(root, 'authority.json')
  writeFileSync(authorityPath, JSON.stringify(authority))
  const target = join(root, 'target')
  git('clone', '--no-local', cwd, target)
  exec('git', ['config', 'remote.origin.url', 'fixture://owned-project/no-network'], target)
  const sourceObservation = observe({ ...f.q, budget, environmentId: 'source', providerKind: 'MANAGED_SANDBOX' })
  const requirement = { ...template.requirement, ...Object.fromEntries(['os', 'node', 'cli', 'skillDigest', 'policyDigest', 'networkCapability', 'storageDurability'].map(k => [k, sourceObservation[k]])), budget }
  const bundle = { ...template.bundle, sourceEnvironment: 'source', targetEnvironment: 'target', requirementDigest: digest(requirement), sourceObservationDigest: digest(sourceObservation), repoIdentity: sourceObservation.repoIdentity, commit: sourceObservation.commit, sourceWorktreePath: cwd, dirtyDigest: sourceObservation.dirtyDigest, artifacts: sourceObservation.artifacts, evidence: sourceObservation.evidence, budget, checkpoint: { ...template.bundle.checkpoint, sha256: sha(readFileSync(join(cwd, 'checkpoint.txt'))), cwdBinding: cwd } }
  const q = { ...f.q, cwd: target, budget, environmentId: 'target', requirement, bundle, sourceObservation, sourceCwd: cwd, authorityPath, authoritativeBudget: { ledgerRef: budget.ledgerRef, config, project: cwd }, attemptId: 'review-admission', commandLog: join(root, 'command.log'), observationOutput: join(root, 'observation.json'), receiptOutput: join(root, 'receipt.json') }
  return { ...f, q, ledger, run: (source = sdk) => preflight(q, observe(q), source) }
}

test('observation preserves existing tracked and untracked storage probe files', t => {
  for (const tracked of [false, true]) {
    const { cwd, git, q } = fixture(t)
    const probe = join(cwd, '.durability-probe')
    writeFileSync(probe, 'existing data must survive\n')
    if (tracked) {
      git('add', '.durability-probe')
      git('commit', '-m', 'existing storage probe')
    }
    const before = git('status', '--porcelain=v1', '--untracked-files=all')
    const files = readdirSync(cwd).sort()
    observe(q)
    assert.ok(existsSync(probe), 'observation deleted pre-existing data')
    assert.equal(readFileSync(probe, 'utf8'), 'existing data must survive\n')
    assert.equal(git('status', '--porcelain=v1', '--untracked-files=all'), before)
    assert.deepEqual(readdirSync(cwd).sort(), files, 'observation left probe artifacts')
  }
})

test('simulation cannot upgrade UNKNOWN environment identity', t => {
  const { q } = fixture(t)
  assert.throws(() => observe({ ...q, providerKind: 'UNKNOWN', simulatedOverrides: { providerKind: 'MANAGED_SANDBOX' } }), /INVALID_SIMULATED_OVERRIDE/)
})

test('unchanged handoff still verifies', async t => {
  const { run } = handoff(t)
  assert.equal((await run()).state, 'RESUMED_VERIFIED')
})

test('source changes after observation refuse handoff before fixture execution', async t => {
  const { cwd, run } = handoff(t)
  writeFileSync(join(cwd, 'artifact.txt'), 'new uncommitted source data\n')
  const receipt = await run()
  assert.equal(receipt.state, 'DIVERGED')
  assert.deepEqual(receipt.fixtureCommand, [])
  assert.equal(readFileSync(join(cwd, 'artifact.txt'), 'utf8'), 'new uncommitted source data\n')
})

test('missing source artifacts produce a divergence receipt', async t => {
  const { cwd, run } = handoff(t)
  unlinkSync(join(cwd, 'artifact.txt'))
  const receipt = await run()
  assert.equal(receipt.state, 'DIVERGED')
  assert.deepEqual(receipt.fixtureCommand, [])
})

test('missing authoritative ledger refuses without recreating the database', async t => {
  const { ledger, run } = handoff(t)
  renameSync(ledger, ledger + '.original')
  const receipt = await run()
  assert.equal(receipt.state, 'BUDGET_BLOCKED')
  assert.deepEqual(receipt.fixtureCommand, [])
  assert.equal(existsSync(ledger), false, 'preflight recreated lost authority')
})

test('replaced authoritative ledger cannot reset reservations at the same path', async t => {
  const { cwd, ledger, q, run } = handoff(t)
  const prior = new TeamState(cwd)
  assert.equal(prior.claim({ executionId: 'prior-reservation', task: { id: 'prior', text: 'prior', line: 0, status: 'open', ownership: { write: ['prior.txt'], resources: [] } }, workerId: 'fixture', reservedCostUsd: .6, spentUsd: .25, dailyHardUsd: 1, leaseMs: 60_000 }).ok, true)
  prior.close()
  q.budget.reservationUsd = .2
  q.bundle.requirementDigest = digest(q.requirement)
  renameSync(ledger, ledger + '.original')
  new TeamState(cwd).close()
  const receipt = await run()
  assert.equal(receipt.state, 'BUDGET_BLOCKED')
  assert.deepEqual(receipt.fixtureCommand, [])
})

test('SDK source paths containing URL delimiters can be loaded', async t => {
  const { root, run } = handoff(t)
  const alias = join(root, 'sdk#review%25')
  mkdirSync(alias)
  symlinkSync(join(sdk, 'dist'), join(alias, 'dist'), 'junction')
  assert.equal((await run(alias)).state, 'RESUMED_VERIFIED')
})

test('corrupted native continuation copies cannot be masked by relocation refusal', async t => {
  const { root, cwd, q, run } = handoff(t)
  const sourceRunDir = join(root, 'native-source'), targetRunDir = join(root, 'native-copy')
  mkdirSync(sourceRunDir); mkdirSync(targetRunDir)
  const state = JSON.parse(readFileSync(new URL('../docs/research/issue-21-environment-replay/evidence/run/native-copied-run/state.json', import.meta.url), 'utf8'))
  state.cwd = cwd
  const files = Object.entries({ 'state.json': JSON.stringify(state), 'goal.json': JSON.stringify(state.goal) }).map(([locator, content]) => {
    writeFileSync(join(sourceRunDir, locator), content)
    writeFileSync(join(targetRunDir, locator), content)
    return { locator, sha256: sha(content) }
  })
  q.checkpointPath = join(targetRunDir, 'state.json')
  q.nativeCopyManifestPath = join(root, 'native-copy-manifest.json')
  writeFileSync(q.nativeCopyManifestPath, JSON.stringify({ sourceRunDir, targetRunDir, files }))
  q.bundle.checkpoint = { kind: 'NATIVE_HOST_BOUND', locator: 'state.json', sha256: files[0].sha256, cwdBinding: cwd, copyManifest: { locator: 'native-copy-manifest.json', sha256: sha(readFileSync(q.nativeCopyManifestPath)) } }
  writeFileSync(join(targetRunDir, 'goal.json'), 'corrupted continuation input')
  const receipt = await run()
  assert.equal(receipt.checks.find(c => c.name === 'nativeTargetReadback:goal.json').ok, false)
  assert.equal(receipt.state, 'DIVERGED')
  assert.deepEqual(receipt.fixtureCommand, [])
})

test('fixture child network attempts are denied even when the child catches errors', t => {
  const { cwd, q } = fixture(t)
  for (const call of ["await fetch('http://127.0.0.1:9/')", "const {get}=await import('node:http');get('http://127.0.0.1:9/').on('error',()=>{})"]) {
    writeFileSync(join(cwd, 'fixture-cli.mjs'), `try { ${call} } catch {} console.log('offline-fixture-cli/v1')\n`)
    assert.throws(() => observe(q), /FIXTURE_CLI_UNAVAILABLE/)
  }
})

test('observer accounts for child network attempts even after explicit exit zero', t => {
  const { root, q } = handoff(t)
  writeFileSync(join(q.cwd, 'fixture-cli.mjs'), "try { await fetch('http://127.0.0.1:9/') } catch {} console.log('offline-fixture-cli/v1'); process.exit(0)\n")
  const input = join(root, 'input.json')
  writeFileSync(input, JSON.stringify(q))
  const r = spawnSync(process.execPath, [join(repo, 'docs/research/issue-21-environment-replay/observer.mjs'), input], { env: safeEnv({}), encoding: 'utf8', windowsHide: true, timeout: 20_000 })
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /NETWORK_ATTEMPT_OBSERVED/)
  assert.equal(existsSync(q.receiptOutput), false)
  assert.equal(readFileSync(q.commandLog + '.network-attempts', 'utf8'), '1\n')
})
