// Opt-in real-provider acceptance; never part of npm test or the driver's offline rerun.
import assert from 'node:assert/strict'
import { execFileSync, fork } from 'node:child_process'
import { copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { BacklogStore } from '../dist/backlog.js'
import { RunDb } from '../dist/db.js'
import { EventLog } from '../dist/events.js'
import { ConfigSchema } from '../dist/types.js'
import { PreflightCache } from '../dist/preflight.js'
import { runOnce } from '../dist/scheduler.js'
import { runDaemon } from '../dist/daemon.js'
import { CodexEngine } from '../dist/engines/codex.js'
import { ControlStore } from '../dist/engines/steering.js'
import { EvidenceStore } from '../dist/engines/evidence-chain.js'
import { KernelVerifier } from '../dist/engines/kernel-verifier.js'
import { enqueueMerge } from '../dist/engines/merge-queue.js'
import { TeamState } from '../dist/engines/team-state.js'
import { ensureFleetCodexHome } from '../dist/engines/codex-runtime.js'

const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url))
const self = fileURLToPath(import.meta.url)
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const json = file => JSON.parse(readFileSync(file, 'utf8'))
const save = (file, value) => writeFileSync(file, JSON.stringify(value, null, 2) + '\n')
for (const key of Object.keys(process.env)) if (/^(OPENAI_API_KEY|CODEX_API_KEY|CODEX_ACCESS_TOKEN)$/i.test(key)) delete process.env[key]
async function bounded(promise, ms, label) {
  let timer
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(label)), ms) })]) }
  finally { clearTimeout(timer) }
}
function control(config, action, id, text) {
  try { return JSON.parse(execFileSync(process.execPath, [cli, 'execution', action, '--config', config, '--id', id, '--text', text], { encoding: 'utf8', timeout: 30_000, windowsHide: true })) }
  catch (error) { if (error.stdout?.toString().trim().startsWith('{')) return JSON.parse(error.stdout); throw error }
}
function dependencies(config, onEvent, execOnly = false, afterRun) {
  const cfg = ConfigSchema.parse(json(config)), homeDir = join(cfg.dataDir, 'codex-home')
  const engine = new CodexEngine({ command: cfg.engines.codex.command, homeDir,
    cache: new PreflightCache(join(cfg.dataDir, 'preflight.json')), timeoutMs: 180_000, idleTimeoutMs: 60_000,
    ...(execOnly ? { baseArgs: ['exec', '--json', '--ephemeral', '--strict-config'] } : {}) })
  const team = new TeamState(cfg.projectPath), db = new RunDb(join(cfg.dataDir, 'run.db')), controller = new AbortController()
  const writer = { id: engine.id, preflight: () => engine.preflight(), async run(job) {
    const result = await engine.run({ ...job, control: { ...job.control, onEvent(event) { job.control?.onEvent?.(event); onEvent?.(event, job) } } })
    await afterRun?.(job, result)
    return result
  } }
  // Local backlog with the same durable team admission and merge queue used by the CLI.
  return { cfg, db, team, controller, runControl: { signal: controller.signal }, store: new BacklogStore(cfg.backlogFile), events: new EventLog(cfg.dataDir),
    engines: { resolve: () => writer }, evidence: new EvidenceStore(cfg.dataDir), verifier: new KernelVerifier({ cfg }) }
}
if (process.argv[2] === '--restart-child') {
  const deps = dependencies(process.argv[3], undefined, false, async (job, result) => {
    process.send?.({ executionId: job.executionId, taskId: job.task.id, ok: result.ok, transportClosed: true })
    // Restart only after native process exit, before the scheduler can consume QUEUE.
    if (process.argv[4] === 'hold') await new Promise(() => {})
  })
  process.on('message', message => { if (message?.type === 'cancel') deps.controller.abort() })
  try { await runDaemon({ deps, notifier: { send: async () => false }, lockDir: join(deps.cfg.dataDir, 'daemon.lock'), cooldownMs: 0, idleSleepMs: 0, maxCycles: 1 }) }
  finally { deps.db.close(); deps.team.close(); process.disconnect?.() }
} else {
  const { values } = parseArgs({ options: { codex: { type: 'string' }, 'auth-file': { type: 'string' }, output: { type: 'string' } } })
  assert(values.codex && values['auth-file'] && values.output, 'Usage: node scripts/verify-steering.mjs --codex <binary> --auth-file <existing login JSON> --output <new directory>')
  assert.equal(process.platform, 'linux', 'Run this isolated restart acceptance on Linux or WSL')
  const output = resolve(values.output)
  assert(!existsSync(output), 'output must be a new directory')
  mkdirSync(output, { recursive: true })
  const root = mkdtempSync(join(tmpdir(), 'adng-controls-runtime-')), homes = [], report = { root, version: '', checks: {}, controls: [] }
  const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, '-c', 'core.hooksPath=/dev/null', ...args], { encoding: 'utf8', timeout: 30_000, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  function fixture(name, text, verifySource) {
    const dir = join(root, name), projectPath = join(dir, 'project'), dataDir = join(dir, 'data'), home = join(dataDir, 'codex-home')
    mkdirSync(projectPath, { recursive: true }); ensureFleetCodexHome(home)
    homes.push(home); copyFileSync(values['auth-file'], join(home, 'auth.json'))
    git(projectPath, 'init', '-b', 'main'); git(projectPath, 'config', 'user.name', 'Steering acceptance')
    git(projectPath, 'config', 'user.email', 'acceptance@example.invalid'); git(projectPath, 'config', 'core.autocrlf', 'false')
    writeFileSync(join(projectPath, 'README.md'), '# Isolated steering acceptance\n')
    verifySource ??= 'import { existsSync } from "node:fs"; if (!existsSync("result.txt")) process.exit(1)\n'
    writeFileSync(join(projectPath, 'verify-runtime.mjs'), verifySource)
    git(projectPath, 'add', '.'); git(projectPath, '-c', 'commit.gpgSign=false', 'commit', '-qm', 'initial acceptance')
    const config = join(dir, 'config.json'), backlogFile = join(dir, 'BACKLOG.md')
    writeFileSync(backlogFile, `- [ ] ${text}\n`)
    save(config, { projectPath, dataDir, backlogFile, worktreesDir: join(dir, 'worktrees'), stopFile: join(dir, '.stop'),
      engines: { codex: { adapter: 'codex', command: values.codex, executionMode: 'observed', subscription: true, costPerRunUsd: 0, dailyAttemptCap: 10 } },
      defaultEngine: 'codex', defaultRisk: 'low', verifyCommand: 'node verify-runtime.mjs', verifyTimeoutMs: 10_000 })
    return { dir, projectPath, dataDir, config, backlogFile, verifySource, base: git(projectPath, 'rev-parse', 'HEAD') }
  }
  function preserve(name, f) {
    for (const path of ['controls', 'evidence', 'executions', 'events.jsonl']) if (existsSync(join(f.dataDir, path))) {
      mkdirSync(join(output, name), { recursive: true }); cpSync(join(f.dataDir, path), join(output, name, path), { recursive: true })
    }
  }
  const children = new Set()
  const spawnDaemon = (config, hold = false) => {
    const child = fork(self, ['--restart-child', config, ...(hold ? ['hold'] : [])], { stdio: ['ignore', 'pipe', 'pipe', 'ipc'], windowsHide: true })
    const state = { child, drained: false }; children.add(state); let log = ''
    child.on('message', message => { if (message?.transportClosed) state.drained = true })
    child.stdout.on('data', chunk => { log += chunk.toString() }); child.stderr.on('data', chunk => { log += chunk.toString() })
    state.ended = new Promise(resolve => child.once('exit', (code, signal) => { children.delete(state); resolve({ code, signal, log }) }))
    return state
  }
  let releaseMerge, activeDeps, activeCycle, failure
  try {
    report.version = execFileSync(values.codex, ['--version'], { encoding: 'utf8', timeout: 10_000, windowsHide: true }).trim()
    const main = fixture('native', 'Only edit result.txt and scratch.txt. On the first turn when result.txt is absent, create scratch.txt, wait 12 seconds and remove scratch.txt in ONE shell call; then write ORIGINAL_PLAN to result.txt. An operator may correct that plan. On later turns preserve the existing result and apply queued instructions in their given order.',
      'import assert from "node:assert/strict"; import {readFileSync,existsSync} from "node:fs"; const s=readFileSync("result.txt","utf8"); assert(s.includes("STEER_OK")); assert(s.indexOf("QUEUE_ONE")>s.indexOf("STEER_OK")); assert(s.indexOf("QUEUE_TWO")>s.indexOf("QUEUE_ONE")); assert(!existsSync("scratch.txt")); console.log("STEERING_RUNTIME_OK")\n')
    const events = [], hookErrors = [], submitted = []; let target, sent = false
    activeDeps = dependencies(main.config, (event, job) => {
      if (event.type !== 'output' || event.stream !== 'stdout') return
      const frame = JSON.parse(event.text); events.push({ at: Date.now(), executionId: job.executionId, frame })
      if (!sent && frame.type === 'item.started' && frame.item?.type === 'command_execution') {
        sent = true; target = { executionId: job.executionId, taskId: job.task.id }
        setTimeout(() => { try {
          assert(existsSync(join(job.projectPath, 'scratch.txt')), 'critical scratch operation was not active at submission')
          submitted.push(control(main.config, 'steer', target.executionId, 'Correct the initial plan: write STEER_OK to result.txt after the current tool completes. Do not interrupt or repeat scratch removal.'))
          submitted.push(control(main.config, 'enqueue', target.executionId, 'Append QUEUE_ONE to result.txt; preserve STEER_OK and do not repeat the initial scratch task.'))
          submitted.push(control(main.config, 'enqueue', target.executionId, 'After QUEUE_ONE append QUEUE_TWO to result.txt; preserve previous content and do not repeat the initial scratch task.'))
          submitted.forEach((reply, i) => assert.equal(reply.disposition, i ? 'QUEUED' : 'PENDING'))
          console.log(JSON.stringify({ stage: 'native-controls-submitted', ...target, submitted }))
        } catch (error) { hookErrors.push(String(error)) } }, 400)
      }
    })
    const heldMerge = enqueueMerge(main.projectPath, () => new Promise(resolve => { releaseMerge = resolve }))
    const cycle = activeCycle = runOnce(activeDeps)
    let finished = false; void cycle.then(() => { finished = true }, () => { finished = true })
    const deadline = Date.now() + 240_000
    while (!existsSync(join(main.dataDir, 'evidence')) && !finished && Date.now() < deadline) await sleep(100)
    assert(existsSync(join(main.dataDir, 'evidence')), `candidate did not reach merge: ${hookErrors.join('; ')}`)
    const late = control(main.config, 'steer', target.executionId, 'MUST_NOT_APPLY_DURING_MERGE')
    assert.equal(late.disposition, 'TOO_LATE_QUEUED')
    releaseMerge(); await heldMerge
    assert.equal(await cycle, 'done'); assert.deepEqual(hookErrors, [])
    const controls = new ControlStore(main.dataDir).list(), result = readFileSync(join(main.projectPath, 'result.txt'), 'utf8')
    assert(result.includes('STEER_OK') && result.indexOf('QUEUE_TWO') > result.indexOf('QUEUE_ONE'))
    assert(!result.includes('MUST_NOT_APPLY_DURING_MERGE') && !existsSync(join(main.projectPath, 'scratch.txt')))
    assert.equal(controls.resolved.find(env => env.id === submitted[0].envelopeId)?.disposition, 'STEERED')
    const steering = controls.resolved.find(env => env.id === submitted[0].envelopeId)
    const firstTool = events.find(event => event.frame.type === 'item.started' && event.frame.item?.type === 'command_execution')
    const toolEnd = events.find(event => event.frame.type === 'item.completed' && event.frame.item?.id === firstTool.frame.item.id)
    assert(toolEnd.at <= steering.claimedAt && firstTool.at <= steering.createdAt && steering.createdAt <= toolEnd.at)
    assert(toolEnd.at - firstTool.at >= 10_000, 'critical tool must run for at least ten seconds')
    for (const reply of submitted.slice(1)) assert.equal(controls.resolved.find(env => env.id === reply.envelopeId)?.disposition, 'DELIVERED')
    assert.equal(controls.resolved.find(env => env.id === late.envelopeId)?.disposition, 'STALE')
    const replay = control(main.config, 'steer', target.executionId, 'replay after completion')
    assert.equal(replay.disposition, 'REJECTED_STALE_TARGET')
    const evidence = readdirSync(join(main.dataDir, 'evidence')).map(name => json(join(main.dataDir, 'evidence', name)))
    const bundle = evidence.find(body => body.controls?.length === 3), merged = evidence.find(body => body.mergedCommit)
    assert(bundle && merged && merged.gateBundleHash === bundle.bundleHash && merged.mergedCommit === git(main.projectPath, 'rev-parse', 'HEAD'))
    assert.equal(readFileSync(join(main.projectPath, 'verify-runtime.mjs'), 'utf8'), main.verifySource)
    assert.equal(git(main.projectPath, 'diff', '--name-only', main.base, 'HEAD'), 'result.txt')
    const team = activeDeps.team.snapshot(), attempts = activeDeps.team.attemptsToday('codex')
    assert.equal(team.claims.length, 1); assert.equal(attempts, 2)
    assert.equal(team.queue.find(item => item.execution_id === target.executionId)?.state, 'DONE')
    save(join(output, 'native-team.json'), { ...team, attempts })
    report.checks.native = { ...target, result, submitted, late, replay, commit: merged.mergedCommit, controls: bundle.controls,
      boundary: { toolId: firstTool.frame.item.id, startedAt: firstTool.at, completedAt: toolEnd.at, submittedAt: steering.createdAt, claimedAt: steering.claimedAt, acknowledgedAt: steering.resolvedAt } }
    console.log(JSON.stringify({ stage: 'native-commit-verified', commit: merged.mergedCommit }))
    save(join(output, 'native-events.json'), events); preserve('native', main); activeDeps.db.close(); activeDeps.team.close(); activeDeps = undefined

    const unsupported = fixture('unsupported', 'Only create result.txt with UNSUPPORTED_OK. First wait 8 seconds in a shell tool, then write the file.')
    let denied
    activeDeps = dependencies(unsupported.config, (event, job) => {
      if (!denied && event.type === 'output' && event.stream === 'stdout' && event.text.includes('"command_execution"'))
        denied = control(unsupported.config, 'steer', job.executionId, 'must explicitly reject unsupported native steering')
    }, true)
    assert.equal(await (activeCycle = runOnce(activeDeps)), 'done'); assert.equal(denied?.disposition, 'UNSUPPORTED')
    report.checks.unsupported = denied; preserve('unsupported', unsupported); activeDeps.db.close(); activeDeps.team.close(); activeDeps = undefined
    console.log(JSON.stringify({ stage: 'unsupported-verified', disposition: denied.disposition }))

    const restart = fixture('restart', 'Only create old.txt with OLD_ATTEMPT. Do not modify any other files. <!-- adng:ownership {"write":["old.txt"],"resources":[],"risk":"low"} -->')
    const before = spawnDaemon(restart.config, true)
    const first = await bounded(Promise.race([new Promise(resolve => before.child.once('message', resolve)), before.ended.then(result => { throw new Error(`daemon exited before active turn: ${JSON.stringify(result)}`) })]), 240_000, 'restart active-turn timeout')
    const queued = control(restart.config, 'enqueue', first.executionId, 'OLD_ENVELOPE_MUST_NOT_REACH_NEW_TASK')
    assert.equal(first.ok, true); assert.equal(first.transportClosed, true)
    assert.equal(queued.disposition, 'QUEUED')
    console.log(JSON.stringify({ stage: 'restart-before', ...first, envelopeId: queued.envelopeId }))
    assert(before.drained); before.child.kill('SIGTERM'); await bounded(before.ended, 10_000, 'idle daemon stop timeout')
    // The old ownership lease remains intact. Only a disjoint task may start after restart.
    writeFileSync(restart.backlogFile, '- [ ] Only create result.txt with NEW_ATTEMPT; do not modify other files. <!-- adng:ownership {"write":["result.txt"],"resources":[],"risk":"low"} -->\n')
    const after = spawnDaemon(restart.config), second = await bounded(Promise.race([new Promise(resolve => after.child.once('message', resolve)), after.ended.then(result => { throw new Error(`restarted daemon exited before active turn: ${JSON.stringify(result)}`) })]), 240_000, 'restarted active-turn timeout')
    assert.notEqual(second.executionId, first.executionId); assert.notEqual(second.taskId, first.taskId)
    const ended = await bounded(after.ended, 240_000, 'restarted daemon completion timeout'); assert.equal(ended.code, 0)
    const stale = new ControlStore(restart.dataDir).list().resolved.find(env => env.id === queued.envelopeId)
    assert.equal(stale?.disposition, 'STALE')
    assert.equal(readFileSync(join(restart.projectPath, 'result.txt'), 'utf8').trim(), 'NEW_ATTEMPT')
    report.checks.restart = { boundary: 'native process closed; scheduler continuation held', before: first, after: second, queued, disposition: stale.disposition, daemonExit: ended.code }
    const restartedTeam = new TeamState(restart.projectPath)
    try { save(join(output, 'restart-team.json'), restartedTeam.snapshot()) } finally { restartedTeam.close() }
    preserve('restart', restart)
  } catch (error) {
    failure = error
  } finally {
    try {
      releaseMerge?.(); activeDeps?.controller.abort(); await bounded(activeCycle?.catch(() => undefined), 45_000, 'active cycle cleanup timeout'); activeDeps?.db.close(); activeDeps?.team.close()
      for (const state of children) {
        if (state.drained) state.child.kill('SIGTERM')
        else state.child.send({ type: 'cancel' })
        await bounded(state.ended, 45_000, 'daemon cleanup timeout')
      }
    } catch (error) { failure ??= error }
    finally {
      for (const home of homes) try { rmSync(home, { recursive: true, force: true }); assert(!existsSync(home)) } catch (error) { failure ??= error }
      report.status = failure ? 'NOT_VERIFIED' : 'VERIFIED'; report.credentialsRemoved = homes.every(home => !existsSync(home))
      if (failure) report.error = String(failure)
      save(join(output, 'acceptance.json'), report)
    }
  }
  if (failure) throw failure
  console.log(JSON.stringify({ status: report.status, output, commit: report.checks.native.commit }))
}
