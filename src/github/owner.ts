import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { TextDecoder } from 'node:util'
import { z } from 'zod'
import { ConfigSchema } from '../types.js'
import { issueBillingDbs, type ExtraBillingScope } from '../globalcost.js'
import { acquireLock, releaseLock } from '../lock.js'
import { api, command } from './client.js'
import { GithubConfigSchema, type GithubConfig } from './config.js'
import { runGithub } from './runner.js'
import { states } from './state.js'

export const OwnerConfigSchema = GithubConfigSchema.omit({ repo: true, base: true, template: true, stopFile: true, verifyCommand: true, repair: true, billingScope: true }).extend({
  owner: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9-]*$/),
  projects: z.record(GithubConfigSchema.shape.repo, z.string().min(1)).optional(),
  verifyCommands: z.record(GithubConfigSchema.shape.repo, GithubConfigSchema.shape.verifyCommand.unwrap()).optional(),
}).strict()
type OwnerConfig = z.infer<typeof OwnerConfigSchema>
export type OwnerGithubConfig = GithubConfig & { billingScopeResolver?: () => ExtraBillingScope[] }
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
function projectSource(cfg: OwnerConfig, repoName: string): string {
  return Object.entries(cfg.projects ?? {}).find(([name]) => name.toLowerCase() === repoName.toLowerCase())?.[1] ?? cfg.sourceConfig
}
function repoDataDir(cfg: OwnerConfig, repoName: string): string {
  return join(cfg.dataDir, 'repo-' + createHash('sha256').update(repoName.toLowerCase()).digest('hex').slice(0, 16))
}

/** Build per-repository accounting policies for owner-mode Issue/revision databases.
 * Unknown historical repo directories with attempts fail closed instead of inheriting this repo's policy. */
export function ownerBillingScopes(cfg: OwnerConfig, repos: Repo[], currentRepo: string): ExtraBillingScope[] {
  const known = new Map<string, { repoName: string; sourceConfig: string }>()
  for (const repo of repos) known.set(repo.full_name.toLowerCase(), { repoName: repo.full_name, sourceConfig: projectSource(cfg, repo.full_name) })
  for (const [repoName, sourceConfig] of Object.entries(cfg.projects ?? {}))
    if (!known.has(repoName.toLowerCase())) known.set(repoName.toLowerCase(), { repoName, sourceConfig })
  if (!known.has(currentRepo.toLowerCase()))
    known.set(currentRepo.toLowerCase(), { repoName: currentRepo, sourceConfig: projectSource(cfg, currentRepo) })

  const expected = new Map<string, { repoName: string; sourceConfig: string }>()
  for (const item of known.values()) {
    const dir = resolve(repoDataDir(cfg, item.repoName))
    if (expected.has(dir)) throw new Error(`Ambiguous owner billing directory for ${item.repoName}`)
    expected.set(dir, item)
  }

  const allDbFiles = issueBillingDbs(cfg.dataDir).map(file => resolve(file))
  const accountedDbFiles = new Set<string>()
  const scopes: ExtraBillingScope[] = []
  for (const [dir, item] of expected) {
    const current = item.repoName.toLowerCase() === currentRepo.toLowerCase()
    if (!existsSync(dir) && !current) continue
    const dbFiles = existsSync(dir) ? issueBillingDbs(dir) : []
    for (const file of dbFiles) accountedDbFiles.add(resolve(file))
    if (!current && dbFiles.length === 0) continue

    const source = ConfigSchema.parse(JSON.parse(readFileSync(item.sourceConfig, 'utf8')))
    const subscriptions = Object.entries(source.engines).filter(([, engine]) => engine.subscription).map(([tag]) => tag).sort()
    scopes.push({ dir, offset: source.timezoneOffsetHours, subscriptions })
  }
  const unmapped = allDbFiles.filter(file => !accountedDbFiles.has(file))
  if (unmapped.length) throw new Error(`Unmapped owner billing database(s): ${unmapped.join(', ')}`)
  return scopes.sort((a, b) => a.dir.localeCompare(b.dir))
}

export function repoConfig(cfg: OwnerConfig, repo: Repo, billingScopeResolver?: () => ExtraBillingScope[]): OwnerGithubConfig {
  const { owner: _owner, projects, verifyCommands, ...source } = cfg
  const project = Object.entries(projects ?? {}).find(([name]) => name.toLowerCase() === repo.full_name.toLowerCase())?.[1]
  const child = GithubConfigSchema.parse({ ...source, sourceConfig: project ?? cfg.sourceConfig,
    verifyCommand: Object.entries(verifyCommands ?? {}).find(([name]) => name.toLowerCase() === repo.full_name.toLowerCase())?.[1],
    repo: repo.full_name, base: repo.default_branch, template: !project,
    dataDir: repoDataDir(cfg, repo.full_name),
    stopFile: join(cfg.dataDir, '.adng.stop') })
  return billingScopeResolver ? { ...child, billingScopeResolver } : child
}
/** 以「當初解析過的檔案內容快照」做授權重核對：內容位元組有任何變動（含改壞、改回、刪除）一律 fail-closed。
 *  快照必須是產生 cfg 的那份內容——在入口重讀會漏掉 parse→run 之間的撤回。 */
export function policyFileCheck(file: string, snapshot: Buffer): () => boolean {
  return () => {
    try {
      return readFileSync(file).equals(snapshot)
    } catch {
      return false
    }
  }
}

export async function runOwner(cfg: OwnerConfig, scanOnly = false, discover = discoverRepos,
  run: (child: GithubConfig, options: { syncOnly?: boolean; policyCheck?: () => boolean }) => Promise<string> = runGithub,
  options: { policyCheck?: () => boolean } = {}) {
  mkdirSync(cfg.dataDir, { recursive: true })
  const lock = join(cfg.dataDir, 'owner.lock')
  // ponytail: one account lock and one Issue per tick; add concurrency only if queue latency warrants it.
  const lockToken = acquireLock(lock)
  if (!lockToken) return { status: 'locked' }
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
      const child = repoConfig(cfg, repo, () => ownerBillingScopes(cfg, repos, repo.full_name))
      try {
        if (options.policyCheck && !options.policyCheck()) break // 授權撤回：不再為剩餘 repo 收發鎖
        const result = await run(child, { syncOnly: scanOnly || executed, policyCheck: options.policyCheck })
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
  } finally { releaseLock(lock, lockToken) }
}
export async function ownerCli(mode: string, file: string, deps: { discover?: typeof discoverRepos; run?: typeof runGithub } = {}): Promise<void> {
  const policyContent = readFileSync(file) // 快照產生 cfg 的那份位元組，供執行中重核對（issue #41）
  const raw = OwnerConfigSchema.parse(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(policyContent)))
  const cfg = { ...raw, sourceConfig: resolve(dirname(file), raw.sourceConfig), dataDir: resolve(dirname(file), raw.dataDir),
    projects: raw.projects ? Object.fromEntries(Object.entries(raw.projects).map(([repo, path]) => [repo, resolve(dirname(file), path)])) : undefined }
  const statusFile = join(cfg.dataDir, 'status.json')
  const result = mode === 'owner-status'
    ? { enabled: cfg.enabled, publish: cfg.publish, label: cfg.label, authors: cfg.authors, paused: !cfg.enabled || existsSync(join(cfg.dataDir, '.adng.stop')),
        lastRun: existsSync(statusFile) ? JSON.parse(readFileSync(statusFile, 'utf8')) : null }
    : await runOwner(cfg, mode === 'owner-sync', deps.discover, deps.run, { policyCheck: policyFileCheck(resolve(file), policyContent) })
  console.log(JSON.stringify(result, null, 2))
  if ('status' in result && ['blocked', 'error'].includes(result.status)) process.exitCode = 1
}
