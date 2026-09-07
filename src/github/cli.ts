import { eligible, loadGithubConfig } from './config.js'
import { githubClient } from './client.js'
import { runGithub } from './runner.js'
import { states } from './state.js'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

export async function githubCli(argv: string[]): Promise<void> {
  const [mode, flag, file, ...extra] = argv
  if (['report', 'report-collect', 'report-status'].includes(mode ?? '') && flag === '--config' && file
    && (extra.length === 0 || (mode === 'report' && extra.length === 1 && extra[0] === '--dry-run'))) {
    await (await import('./report.js')).reportCli(mode!, file, extra[0] === '--dry-run'); return
  }
  if (!['scan', 'sync', 'run', 'status', 'owner-sync', 'owner-run', 'owner-status'].includes(mode ?? '') || flag !== '--config' || !file || extra.length) {
    throw new Error('Usage: adng github <scan|sync|run|status> --config <github-config.json>')
  }
  if (mode!.startsWith('owner-')) { await (await import('./owner.js')).ownerCli(mode!, file); return }
  const cfg = loadGithubConfig(file)
  if (mode === 'scan') {
    console.log(JSON.stringify((await githubClient(cfg).list()).filter(i => eligible(i, cfg)).map(i => ({ number: i.number, title: i.title })), null, 2))
  } else if (mode === 'status') {
    console.log(JSON.stringify({ enabled: cfg.enabled, publish: cfg.publish, paused: !cfg.enabled || existsSync(join(cfg.dataDir, '.adng.stop')), repo: cfg.repo,
      issues: states(cfg).map(s => ({ number: s.issue.number, status: s.status, runs: s.runs, detail: s.detail, pr: s.pr })) }, null, 2))
  } else {
    const result = await runGithub(cfg, { syncOnly: mode === 'sync' })
    console.log(result)
    if (/blocked$/.test(result)) process.exitCode = 1
  }
}
