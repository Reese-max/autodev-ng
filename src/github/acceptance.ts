import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { runProcess } from '../engines/proc.js'
import type { GithubConfig } from './config.js'
import { runDir, type IssueState } from './state.js'
import { git } from './job.js'

const receipt = (cfg: GithubConfig, state: IssueState, commit: string) => join(runDir(cfg, state), `acceptance-${commit}.json`)
export async function verifyAcceptance(cfg: GithubConfig, state: IssueState, cwd: string, commit: string, timeoutMs: number) {
  if (!cfg.acceptance) return
  const result = await runProcess({ ...cfg.acceptance, cwd, timeoutMs, stdinText: '', maxOutputChars: 16000 })
  writeFileSync(receipt(cfg, state, commit), JSON.stringify({ commit, contract: cfg.acceptance, result }, null, 2))
  if (result.exitCode !== 0 || result.timedOut) throw new Error('Project acceptance failed; inspect candidate output')
  if (git(cwd, ['rev-parse', 'HEAD']) !== commit || git(cwd, ['status', '--porcelain', '--untracked-files=no'])) throw new Error('Acceptance changed the tested source')
  writeFileSync(receipt(cfg, state, commit), JSON.stringify({ commit, contract: cfg.acceptance, result, passed: true }, null, 2))
}
export function assertAcceptance(cfg: GithubConfig, state: IssueState) {
  if (!cfg.acceptance) return
  const r = JSON.parse(readFileSync(receipt(cfg, state, state.commit!), 'utf8'))
  if (r.passed !== true || r.commit !== state.commit || JSON.stringify(r.contract) !== JSON.stringify(cfg.acceptance) || r.result?.exitCode !== 0 || r.result?.timedOut !== false) throw new Error('Missing exact project acceptance evidence')
}
