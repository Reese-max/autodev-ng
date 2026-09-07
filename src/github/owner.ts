import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { z } from 'zod'
import { acquireLock, releaseLock } from '../lock.js'
import { api, command } from './client.js'
import { GithubConfigSchema, type GithubConfig } from './config.js'
import { runGithub } from './runner.js'
import { states } from './state.js'

export const OwnerConfigSchema = GithubConfigSchema.omit({ repo: true, base: true, template: true, stopFile: true, verifyCommand: true, repair: true }).extend({
  owner: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9-]*$/),
  projects: z.record(GithubConfigSchema.shape.repo, z.string().min(1)).optional(),
  verifyCommands: z.record(GithubConfigSchema.shape.repo, GithubConfigSchema.shape.verifyCommand.unwrap()).optional(),
}).strict()
type OwnerConfig = z.infer<typeof OwnerConfigSchema>
export const RepoSchema = z.object({ full_name: GithubConfigSchema.shape.repo, owner: z.object({ login: z.string() }),
  default_branch: GithubConfigSchema.shape.base, archived: z.boolean(), disabled: z.boolean(), has_issues: z.boolean(),
  permissions: z.object({ push: z.boolean() }) })
type Repo = z.infer<typeof RepoSchema>
export function ownedRepos(owner: string, pages: unknown): Repo[] {
  return z.array(z.array(RepoSchema)).parse(pages).flat().filter(r => r.owner.login.toLowerCase() === owner.toLowerCase()
    && r.full_name.split('/')[0]!.toLowerCase() === owner.toLowerCase())
}
export function discoverRepos(owner: string): Repo[] {
  const user = z.object({ login: z.string() }).parse(api('user'))
  if (user.login.toLowerCase() !== owner.toLowerCase()) throw new Error('GitHub authenticated account does not match configured owner')
  return ownedRepos(owner, JSON.parse(command('gh', ['api', '--hostname', 'github.com',
    'user/repos?per_page=100&affiliation=owner&visibility=all', '--paginate', '--slurp'])))
}
export function repoConfig(cfg: OwnerConfig, repo: Repo): GithubConfig {
  const { owner: _owner, projects, verifyCommands, ...source } = cfg
  const project = Object.entries(projects ?? {}).find(([name]) => name.toLowerCase() === repo.full_name.toLowerCase())?.[1]
  return GithubConfigSchema.parse({ ...source, sourceConfig: project ?? cfg.sourceConfig,
    verifyCommand: Object.entries(verifyCommands ?? {}).find(([name]) => name.toLowerCase() === repo.full_name.toLowerCase())?.[1],
    repo: repo.full_name, base: repo.default_branch, template: !project,
    dataDir: join(cfg.dataDir, 'repo-' + createHash('sha256').update(repo.full_name.toLowerCase()).digest('hex').slice(0, 16)),
    stopFile: join(cfg.dataDir, '.adng.stop') })
}
export async function runOwner(cfg: OwnerConfig, scanOnly = false, discover = discoverRepos, run = runGithub) {
  mkdirSync(cfg.dataDir, { recursive: true })
  const lock = join(cfg.dataDir, 'owner.lock')
  // ponytail: one account lock and one Issue per tick; add concurrency only if queue latency warrants it.
  if (!acquireLock(lock)) return { status: 'locked' }
  const report: { status: string; at: string; repositories: { repo: string; result: string; issues?: ReturnType<typeof states> }[] } = {
    status: 'ok', at: new Date().toISOString(), repositories: [] }
  try {
    let executed = false
    const repos = discover(cfg.owner)
    // Rotate the starting repository each tick so a permanently busy project cannot starve others.
    const offset = repos.length ? Math.floor(Date.now() / cfg.retryMs) % repos.length : 0
    for (const repo of [...repos.slice(offset), ...repos.slice(0, offset)]) {
      if (repo.archived || repo.disabled || !repo.has_issues || !repo.permissions.push) {
        report.repositories.push({ repo: repo.full_name, result: 'skipped: archived, disabled, Issues disabled, or no push access' }); continue
      }
      const child = repoConfig(cfg, repo)
      try {
        const result = await run(child, { syncOnly: scanOnly || executed })
        if (!['synced', 'idle', 'paused', 'locked'].includes(result)) executed = true
        report.repositories.push({ repo: repo.full_name, result, issues: states(child) })
        if (/blocked$/.test(result)) report.status = 'blocked'
      } catch (err) {
        report.status = 'error'
        report.repositories.push({ repo: repo.full_name, result: err instanceof Error ? err.message : String(err) })
      }
    }
    const tmp = join(cfg.dataDir, `status-${process.pid}.tmp`)
    writeFileSync(tmp, JSON.stringify(report, null, 2) + '\n'); renameSync(tmp, join(cfg.dataDir, 'status.json'))
    return report
  } finally { releaseLock(lock) }
}
export async function ownerCli(mode: string, file: string): Promise<void> {
  const raw = OwnerConfigSchema.parse(JSON.parse(readFileSync(file, 'utf8')))
  const cfg = { ...raw, sourceConfig: resolve(dirname(file), raw.sourceConfig), dataDir: resolve(dirname(file), raw.dataDir),
    projects: raw.projects ? Object.fromEntries(Object.entries(raw.projects).map(([repo, path]) => [repo, resolve(dirname(file), path)])) : undefined }
  const statusFile = join(cfg.dataDir, 'status.json')
  const result = mode === 'owner-status'
    ? { enabled: cfg.enabled, publish: cfg.publish, label: cfg.label, authors: cfg.authors, paused: !cfg.enabled || existsSync(join(cfg.dataDir, '.adng.stop')),
        lastRun: existsSync(statusFile) ? JSON.parse(readFileSync(statusFile, 'utf8')) : null }
    : await runOwner(cfg, mode === 'owner-sync')
  console.log(JSON.stringify(result, null, 2))
  if ('status' in result && ['blocked', 'error'].includes(result.status)) process.exitCode = 1
}
