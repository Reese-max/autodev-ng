import { githubStopFile, loadGithubConfig } from './config.js'
import { githubClient } from './client.js'
import { runGithub } from './runner.js'
import { issueDir, states } from './state.js'
import { eligibleForRun } from './repair.js'
import { existsSync } from 'node:fs'

export const GITHUB_MODES = ['scan', 'sync', 'run', 'status', 'owner-sync', 'owner-run', 'owner-status'] as const

export const GITHUB_USAGE = `用法：adng github <${GITHUB_MODES.join('|')}> --config <github-config.json>`

export const GITHUB_HELP = [
  'adng github：GitHub Issue intake、同步、執行與 owner 管理',
  '',
  GITHUB_USAGE,
  '',
  '模式：',
  '  scan         掃描符合條件的 Issue',
  '  sync         同步 Issue 狀態至本機',
  '  run          執行一個可處理的 Issue',
  '  status       顯示本機 Issue 狀態',
  '  owner-sync   同步 owner 擁有的 repositories',
  '  owner-run    執行 owner repositories 的一輪工作',
  '  owner-status 顯示 owner repositories 狀態',
  '',
  '  doctor [--live]、retry/resume --issue N --reason TEXT：診斷與恢復',
  '  delivery、metrics、accept --issue N --commit SHA --reason EVIDENCE：交付與驗收',
  '  report/report-collect/report-status、repair/repair-status/repair-batch：通報與修復',
  '  proposal-review/proposal-status/proposal-feedback：提案審查',
  '  followup=true 啟用受 maxRuns 限制的 PR 修正；不自動合併或部署。',
  '  --help       顯示本說明；不讀取 config、不連線 GitHub 或通知服務',
].join('\n')

export function printGithubHelp(): void {
  console.log(GITHUB_HELP)
}

export async function githubCli(argv: string[]): Promise<void> {
  if (argv.includes('--help') || (argv.length === 1 && ['-h', 'help'].includes(argv[0]!))) {
    process.exitCode = 0
    printGithubHelp()
    return
  }
  const [mode, flag, file, ...extra] = argv
  if (['proposal-review', 'proposal-status', 'proposal-feedback'].includes(mode ?? '')) {
    await (await import('./proposals.js')).proposalCli(mode!, argv.slice(1)); return
  }
  if (['doctor', 'retry', 'resume', 'delivery', 'metrics', 'accept', 'repair-doctor', 'repair-retry', 'repair-resume', 'repair-delivery', 'repair-metrics'].includes(mode ?? '')) {
    await (await import('./operations.js')).operationsCli(mode!, argv.slice(1)); return
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
    if (/blocked$/.test(result) || /: queued$/.test(result)) process.exitCode = 1
  }
}
