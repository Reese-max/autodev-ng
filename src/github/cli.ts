import { githubStopFile, loadGithubConfig } from './config.js'
import { githubClient } from './client.js'
import { runGithub } from './runner.js'
import { issueDir, states } from './state.js'
import { eligibleForRun } from './repair.js'
import { existsSync } from 'node:fs'

export async function githubCli(argv: string[]): Promise<void> {
  const [mode, flag, file, ...extra] = argv
  if (['proposal-review', 'proposal-status', 'proposal-feedback'].includes(mode ?? '')) {
    await (await import('./proposals.js')).proposalCli(mode!, argv.slice(1)); return
  }
  if (['repair-doctor', 'repair-retry', 'repair-resume', 'repair-delivery', 'repair-metrics'].includes(mode ?? '')) {
    await (await import('./operations.js')).operationsCli(mode!, argv.slice(1)); return
  }
  if (argv.length === 1 && ['--help', '-h', 'help'].includes(mode!)) {
    console.log('Usage: adng github <scan|sync|run|status|owner-sync|owner-run|owner-status|report|report-collect|report-status|repair|repair-status> --config <path>\nrepair --dry-run previews eligible reports; repair runs one bounded CLI repair.\nrepair-doctor --live: test login/sandbox; repair-retry|repair-resume --issue N --reason "details": preserve attempts.\nrepair-delivery --issue N: verify exact commit; repair-metrics: observed outcomes.\nproposal-review|proposal-status|proposal-feedback: validate, schedule and learn.\nrepair-batch: separate scheduled repairs (report never waits for them).'); return
  }
  if (mode === 'repair-batch' && flag === '--config' && file && !extra.length) {
    await (await import('./repair.js')).repairFromReports(file)
    console.log(`github-proposals: ${await (await import('./proposals.js')).reviewProposals(file)}`); return
  }
  if (['report', 'report-collect', 'report-status'].includes(mode ?? '') && flag === '--config' && file
    && (extra.length === 0 || (mode === 'report' && extra.length === 1 && extra[0] === '--dry-run'))) {
    await (await import('./report.js')).reportCli(mode!, file, extra[0] === '--dry-run'); return
  }
  if (!['scan', 'sync', 'run', 'status', 'owner-sync', 'owner-run', 'owner-status', 'repair', 'repair-status'].includes(mode ?? '') || flag !== '--config' || !file
    || (extra.length && !(mode === 'repair' && extra.length === 1 && extra[0] === '--dry-run'))) {
    throw new Error('Usage: adng github <scan|sync|run|status|repair|repair-status> --config <github-config.json> [--dry-run (repair only)]')
  }
  if (mode!.startsWith('owner-')) { await (await import('./owner.js')).ownerCli(mode!, file); return }
  const cfg = loadGithubConfig(file)
  if (mode!.startsWith('repair') && !cfg.repair) throw new Error('Repair CLI requires a local report/probe policy in configuration')
  if (mode === 'scan' || (mode === 'repair' && extra[0] === '--dry-run')) {
    console.log(JSON.stringify((await githubClient(cfg).list()).filter(i => eligibleForRun(i, cfg)).map(i => ({ number: i.number, title: i.title })), null, 2))
  } else if (mode === 'status' || mode === 'repair-status') {
    console.log(JSON.stringify({ enabled: cfg.enabled, publish: cfg.publish, paused: !cfg.enabled || existsSync(githubStopFile(cfg)), repo: cfg.repo,
      issues: states(cfg).map(s => ({ number: s.issue.number, status: s.status, runs: s.runs, detail: s.detail, commit: s.commit, directory: issueDir(cfg, s.issue.number), pr: s.pr })) }, null, 2))
  } else {
    const result = await runGithub(cfg, { syncOnly: mode === 'sync', configPath: file })
    console.log(result)
    if (/blocked$/.test(result) || (cfg.repair && /: queued$/.test(result))) process.exitCode = 1
  }
}
