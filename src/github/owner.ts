import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { z } from 'zod'
import { acquireLock, releaseLock } from '../lock.js'
import { writeJsonAtomic } from '../guardian/incident.js'
import { api, command } from './client.js'
import { GithubConfigSchema, type GithubConfig } from './config.js'
import { runGithubOutcome, type RunOutcome } from './runner.js'
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
const DispatchCursorSchema = z.object({
  version: z.literal(1),
  seq: z.number().int().nonnegative(),
  repos: z.record(z.string(), z.object({
    attemptSeq: z.number().int().nonnegative(),
    lastAttemptedAt: z.number(),
    lastScannedAt: z.number(),
  })),
})
type DispatchCursor = z.infer<typeof DispatchCursorSchema>

const CURSOR_FILE = 'dispatch-cursor.json'

function readDispatchCursor(dataDir: string): DispatchCursor {
  try {
    return DispatchCursorSchema.parse(JSON.parse(readFileSync(join(dataDir, CURSOR_FILE), 'utf8')))
  } catch {
    return { version: 1, seq: 0, repos: {} }
  }
}

export async function runOwner(cfg: OwnerConfig, scanOnly = false, discover = discoverRepos,
  run: (child: GithubConfig, options: { syncOnly?: boolean }) => Promise<RunOutcome> = runGithubOutcome) {
  mkdirSync(cfg.dataDir, { recursive: true })
  const lock = join(cfg.dataDir, 'owner.lock')
  // ponytail: one account lock and one Issue per tick; add concurrency only if queue latency warrants it.
  if (!acquireLock(lock)) return { status: 'locked' }
  const report: { status: string; at: string; repositories: {
    repo: string; result: string; attempted?: boolean; syncOnly?: boolean;
    lastScannedAt?: string; lastAttemptedAt?: string; issues?: ReturnType<typeof states> }[] } = {
    status: 'ok', at: new Date().toISOString(), repositories: [] }
  try {
    let executed = false
    const repos = discover(cfg.owner)
    // Persisted fair cursor: order by last attempt sequence (not wall-clock
    // modulo) so aligned ticks, restarts, reorders and clock jumps cannot pin
    // the worker slot to the same repository. Never-attempted repos go first.
    const cursor = readDispatchCursor(cfg.dataDir)
    const order = [...repos].sort((a, b) => {
      const sa = cursor.repos[a.full_name.toLowerCase()]?.attemptSeq ?? 0
      const sb = cursor.repos[b.full_name.toLowerCase()]?.attemptSeq ?? 0
      return sa - sb || a.full_name.localeCompare(b.full_name)
    })
    const seen = new Set<string>()
    for (const repo of order) {
      const id = repo.full_name.toLowerCase()
      seen.add(id)
      if (repo.archived || repo.disabled || !repo.has_issues || !repo.permissions.push) {
        report.repositories.push({ repo: repo.full_name, result: 'skipped: archived, disabled, Issues disabled, or no push access' }); continue
      }
      const child = repoConfig(cfg, repo)
      const entry = cursor.repos[id] ?? { attemptSeq: 0, lastAttemptedAt: 0, lastScannedAt: 0 }
      entry.lastScannedAt = Date.now()
      cursor.repos[id] = entry
      try {
        const sync = scanOnly || executed
        const outcome = await run(child, { syncOnly: sync })
        if (outcome.attempted) {
          executed = true
          entry.attemptSeq = ++cursor.seq
          entry.lastAttemptedAt = Date.now()
        }
        report.repositories.push({ repo: repo.full_name, result: outcome.disposition, attempted: outcome.attempted,
          syncOnly: sync || undefined,
          lastScannedAt: new Date(entry.lastScannedAt).toISOString(),
          lastAttemptedAt: entry.lastAttemptedAt ? new Date(entry.lastAttemptedAt).toISOString() : undefined,
          issues: states(child) })
        if (/blocked$/.test(outcome.disposition)) report.status = 'blocked'
      } catch (err) {
        report.status = 'error'
        report.repositories.push({ repo: repo.full_name, result: err instanceof Error ? err.message : String(err),
          lastScannedAt: new Date(entry.lastScannedAt).toISOString(),
          lastAttemptedAt: entry.lastAttemptedAt ? new Date(entry.lastAttemptedAt).toISOString() : undefined })
      }
    }
    // Prune identities no longer discovered so the cursor cannot grow without bound.
    for (const id of Object.keys(cursor.repos)) if (!seen.has(id)) delete cursor.repos[id]
    writeJsonAtomic(join(cfg.dataDir, CURSOR_FILE), cursor)
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
