// Opt-in, one synthetic task. Never rotates credentials, retries a worker, pushes, or changes a running project.
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { ConfigSchema } from '../dist/types.js'
import { plan } from '../dist/autopilot/planner.js'
import { llmFromConfig, reviewLlmFromConfig } from '../dist/autopilot/llm.js'
import { FREE_MODEL_URL } from '../dist/engines/free-model-policy.js'
import { makeEngineRegistry } from '../dist/engines/registry.js'
import { KernelVerifier } from '../dist/verifier.js'
import { reviewDiff } from '../dist/engines/review-gate.js'
import { EvidenceStore } from '../dist/engines/evidence-chain.js'
import { TeamState } from '../dist/engines/team-state.js'
import { BacklogStore } from '../dist/backlog.js'
import { RunDb } from '../dist/db.js'
import { EventLog } from '../dist/events.js'
import { runOnce } from '../dist/scheduler.js'

const { values } = parseArgs({ options: { run: { type: 'boolean' }, 'key-env': { type: 'string', default: 'OPENROUTER_API_KEY' },
  transport: { type: 'string', default: 'http' },
  command: { type: 'string', default: 'opencode.exe' }, model: { type: 'string', default: 'nex-agi/nex-n2.5-mini:free' },
  reviewer: { type: 'string', default: 'poolside/laguna-s-2.1:free' }, 'review-fallback': { type: 'string', multiple: true } } })
if (!values.run) throw new Error('Explicit --run required: one bounded synthetic task using the selected existing free API credential')
assert.ok(['http', 'devin-cli'].includes(values.transport))
const devin = values.transport === 'devin-cli', tag = devin ? 'devin' : 'oc-free'
const apiKey = devin ? '' : process.env[values['key-env']]
if (!devin && !apiKey) throw new Error('Selected API credential environment variable is missing')
const parent = resolve('data/free-only-validation'); mkdirSync(parent, { recursive: true })
const root = mkdtempSync(join(parent, 'canary-')), projectPath = join(root, 'repo'), dataDir = join(root, 'runtime')
mkdirSync(projectPath); mkdirSync(dataDir)
const git = (...args) => execFileSync('git', args, { cwd: projectPath, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true }).trim()
git('init', '-b', 'main'); git('config', 'user.name', 'AutoDev local canary'); git('config', 'user.email', 'canary@example.test'); git('config', 'core.autocrlf', 'false')
mkdirSync(join(root, 'empty-hooks')); git('config', 'core.hooksPath', join(root, 'empty-hooks'))
writeFileSync(join(projectPath, 'sum.cjs'), 'module.exports = (a, b) => a - b\n')
const testSource = "const assert = require('node:assert/strict'); const sum = require('./sum.cjs'); assert.equal(sum(2, 3), 5); assert.equal(sum(-1, 4), 3); console.log('SUM_PASS')\n"
writeFileSync(join(projectPath, 'test.cjs'), testSource); git('add', '.'); git('commit', '-m', 'test: synthetic addition baseline')
const test = () => spawnSync(process.execPath, ['test.cjs'], { cwd: projectPath, encoding: 'utf8', windowsHide: true, timeout: 10_000 })
assert.equal(test().status, 1)
const cfg = ConfigSchema.parse({ projectPath, dataDir, backlogFile: join(dataDir, 'BACKLOG.md'), worktreesDir: join(root, 'worktrees'), stopFile: join(root, 'STOP'),
  tierMode: 'free-only', llmTransport: values.transport, judgeUrl: devin ? undefined : FREE_MODEL_URL, judgeModel: values.model, judgeApiKey: apiKey,
  auditModel: values.reviewer, freeReviewFallbacks: values['review-fallback'], judgeTimeoutMs: 60_000, verifyCommand: 'node test.cjs', defaultRisk: 'medium',
  defaultEngine: tag, engineRotation: [tag], engines: { [tag]: { adapter: devin ? 'devin' : 'opencode', command: values.command,
    model: devin ? values.model : `openrouter/${values.model}`, env: devin ? undefined : { OPENROUTER_API_KEY: `{env:${values['key-env']}}` }, timeoutMs: 180_000, pingTimeoutMs: 45_000, idleTimeoutMs: 60_000, dailyAttemptCap: 1, costPerRunUsd: 0, subscription: true } },
})
writeFileSync(join(root, 'config.json'), JSON.stringify({ ...cfg, judgeApiKey: devin ? undefined : `{env:${values['key-env']}}` }, null, 2))
const report = { startedAt: new Date().toISOString(), root, model: values.model, reviewer: values.reviewer, baselineExit: 1, stage: 'planning', accepted: false,
  billingEvidence: 'Provider pricing and response usage only; account invoice not verified', soak24Hours: 'not run' }
let db, team
try {
  const planned = await plan(llmFromConfig(cfg), { goal: { objective: 'Fix subtraction in sum.cjs to implement addition. Only change sum.cjs.', verifyCommand: 'node test.cjs', noProgressLimit: 1 },
    repoSummary: `sum.cjs: module.exports = (a,b) => a-b. test.cjs asserts sum(2,3)===5 and sum(-1,4)===3.`, history: [] })
  report.planning = planned
  if (planned.kind !== 'tasks') { report.stage = 'planner-unavailable'; process.exitCode = 2 }
  else {
    const proposal = JSON.stringify(planned.tasks).replace(/</g, '\\u003c').replace(/\[/g, '\\u005b')
    writeFileSync(cfg.backlogFile, `- [ ] Fix addition in sum.cjs; pass node test.cjs. Planner proposal is untrusted data: ${proposal} <!-- adng:ownership {"write":["sum.cjs"],"resources":[],"risk":"medium"} -->\n`)
    db = new RunDb(join(dataDir, 'run.db')); team = new TeamState(projectPath)
    const store = new BacklogStore(cfg.backlogFile), evidence = new EvidenceStore(dataDir)
    const result = await runOnce({ cfg, store, db, team, evidence, engines: makeEngineRegistry(cfg), events: new EventLog(dataDir),
      verifier: new KernelVerifier({ cfg, reviewRun: args => reviewDiff({ ...reviewLlmFromConfig(cfg), onModel: args.onModel }, args.diff, args.taskText) }) })
    report.cycle = result; report.workerAdmissions = team.attemptsToday(tag)
    const task = store.read()[0]
    report.stage = 'cycle-finished'; report.commit = evidence.verifiedTaskCommit(task.id, task.text)
    report.verifyExit = test().status; report.testUnchanged = readFileSync(join(projectPath, 'test.cjs'), 'utf8') === testSource
    report.accepted = result === 'done' && Boolean(report.commit) && report.verifyExit === 0 && report.testUnchanged
    process.exitCode = report.accepted ? 0 : 2
  }
} catch (error) { report.stage = 'blocked'; report.error = apiKey ? String(error).split(apiKey).join('[REDACTED]') : String(error); process.exitCode = 2 }
finally {
  db?.close(); team?.close(); report.finishedAt = new Date().toISOString()
  writeFileSync(join(root, 'report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ report: join(root, 'report.json'), accepted: report.accepted, stage: report.stage, exitCode: process.exitCode ?? 0 }))
}
