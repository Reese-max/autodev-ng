import { eligible, loadGithubConfig } from './config.js'
import { githubClient } from './client.js'
import { runGithub } from './runner.js'
import { states } from './state.js'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

export const GITHUB_MODES = ['scan', 'sync', 'run', 'status', 'owner-sync', 'owner-run', 'owner-status'] as const
type GithubMode = typeof GITHUB_MODES[number]

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
  '  --help       顯示本說明；不讀取 config、不連線 GitHub 或通知服務',
].join('\n')

export function printGithubHelp(): void {
  console.log(GITHUB_HELP)
}

export async function githubCli(argv: string[]): Promise<void> {
  if (argv.includes('--help')) {
    process.exitCode = 0
    printGithubHelp()
    return
  }
  const [mode, flag, file, ...extra] = argv
  if (!GITHUB_MODES.includes(mode as GithubMode) || flag !== '--config' || !file || extra.length) {
    throw new Error(GITHUB_USAGE)
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
