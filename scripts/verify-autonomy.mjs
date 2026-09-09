// Final GOAL gate: component checks alone cannot pass without a real, verified repair.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { loadGithubConfig } from '../dist/github/config.js'
import { loadReportConfig } from '../dist/github/report-config.js'
import { readState, runDir, states } from '../dist/github/state.js'
import { delivery } from '../dist/github/operations.js'
import { parseGoal } from '../dist/autopilot/goal.js'

try {
  const { values } = parseArgs({ options: { config: { type: 'string' }, issue: { type: 'string' } } })
  assert(values.config && (!values.issue || /^[1-9]\d*$/.test(values.issue)), '--config and an optional positive --issue are required')
  const cfg = loadGithubConfig(resolve(values.config))
  const candidates = values.issue ? [readState(cfg, Number(values.issue))].filter(Boolean) : states(cfg).filter(s => ['ready', 'published'].includes(s.status))
  assert.equal(candidates.length, 1, candidates.length ? 'Multiple repair candidates; select --issue explicitly' : 'No completed real repair candidate; reconciled or failed Issues cannot pass')
  const state = candidates[0], source = JSON.parse(readFileSync(cfg.sourceConfig, 'utf8'))
  const root = resolve(dirname(cfg.sourceConfig), source.projectPath), data = resolve(dirname(cfg.sourceConfig), source.dataDir)
  const head = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8', windowsHide: true }).trim()
  assert.equal(execFileSync('git', ['-C', root, 'status', '--porcelain'], { encoding: 'utf8', windowsHide: true }).trim(), '', 'Host checkout must be committed and clean')
  assert.equal(source.llmTransport, 'cli')
  for (const name of ['NORTHSTAR.md', 'USER-SIGNALS.md']) assert(readFileSync(join(data, name), 'utf8').trim().length > 100, `${name} missing actual project direction`)
  assert(parseGoal(readFileSync(join(data, 'GOAL.md'), 'utf8')).verifyCommand?.includes('verify-autonomy.mjs'))
  const reports = loadReportConfig(cfg.repair.reportConfig), project = reports.projects.find(p => p.repo === cfg.repo)
  assert(reports.proposalRepos.includes(cfg.repo), 'Proposal adoption not enabled for this project')
  assert(project.probes.some(p => p.id === 'cli-journey' && p.expectedText === 'CLI_JOURNEY_PASS'))
  const gate = JSON.parse(readFileSync(join(root, 'data/maintenance/cli-autonomy/gate.json'), 'utf8'))
  assert.equal(gate.head, head, 'Build/test evidence belongs to another commit')
  for (const name of ['build', 'typecheck', 'test', 'journey']) assert.equal(gate.exitCodes[name], 0, `${name} not verified`)
  assert(state && ['ready', 'published'].includes(state.status), `Live repair is ${state?.status ?? 'missing'}; ${state?.detail ?? 'no worker evidence'}`)
  const manifest = delivery(cfg, state), receipts = join(runDir(cfg, state), 'codex-home', 'receipts')
  const worker = readdirSync(receipts).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(join(receipts, f), 'utf8')))
    .find(r => r.commit === state.commit && r.command === 'codex' && r.hostCommit === true && r.exitCode === 0 && r.timedOut === false && r.turnCompleted === true
      && r.usage?.input_tokens > 0 && r.usage?.output_tokens > 0 && r.args.includes('--ignore-user-config'))
  assert(worker, 'Missing real Codex worker turn and host commit receipt for the delivered commit')
  console.log(JSON.stringify({ gate: 'CLI_AUTONOMY_PASS', hostCommit: head, ...manifest }, null, 2))
} catch (error) {
  console.error(`CLI_AUTONOMY_INCOMPLETE: ${error.message}`)
  process.exitCode = 1
}
