import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { z } from 'zod'
import { QualityConfigSchema } from './quality.js'
import { ApprovedFixtureSchema, fixtureHash } from './fixture-profile.js'
import { ConfigSchema } from '../types.js'
const outputPattern = z.string().min(3).max(200).refine(value => { try { new RegExp(value); return true } catch { return false } }, 'Invalid output pattern')

export const GithubConfigSchema = z.object({
  repo: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9_.-]+$/).refine(v => !['.', '..'].includes(v.split('/')[1]!)),
  base: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_./-]*$/).default('main'),
  label: z.string().min(1).max(50).nullable().default('autodev'),
  authors: z.array(z.string().regex(/^[A-Za-z0-9][A-Za-z0-9-]*$/)).min(1),
  sourceConfig: z.string().min(1),
  dataDir: z.string().min(1),
  engine: z.string().min(1),
  verifyCommand: z.string().trim().min(1).optional(),
  regressionPrepareCommand: z.string().trim().min(1).optional(),
  regression: z.object({
    file: z.string().regex(/^tests\/regressions\/[A-Za-z0-9_.{}-]+$/).refine(v => v.includes('{issue}') && v.includes('{revision}') && !/[{}]/.test(v.replaceAll('{issue}', '1').replaceAll('{revision}', '0'))),
    command: z.string().min(1), args: z.array(z.string()).refine(args => args.some(a => a.includes('{file}')), 'Regression command must execute {file}'),
    passPattern: outputPattern, failPattern: outputPattern,
  }).strict().optional(),
  acceptance: z.object({ command: z.string().min(1), args: z.array(z.string()) }).strict().optional(),
  quality: QualityConfigSchema.optional(),
  /** External operator approval for one exact existing fixture replacement; absent keeps BUGFIX. */
  fixtureMaintenance: ApprovedFixtureSchema.optional(),
  followup: z.boolean().default(false),
  template: z.boolean().optional(),
  stopFile: z.string().optional(),
  enabled: z.boolean().default(false),
  publish: z.boolean().default(false),
  maxRuns: z.number().int().min(1).max(5).default(3),
  retryMs: z.number().int().min(60_000).default(300_000),
  repair: z.object({
    reportConfig: z.string().min(1),
    probeIds: z.array(z.string().regex(/^[a-z0-9][a-z0-9._-]{0,79}$/)).min(1).max(5),
    prepareCommand: z.string().trim().min(1),
  }).strict().optional(),
}).strict()
export type GithubConfig = z.infer<typeof GithubConfigSchema>
export const githubStopFile = (cfg: GithubConfig): string => cfg.stopFile ?? join(cfg.dataDir, '.adng.stop')

// Only this loader can mint provenance; callers cannot bind a parsed config to
// unrelated approval bytes. The capability stays in the host process.
const fixtureApprovals = new WeakMap<object, { selectedPath: string; path: string; bytes: Buffer; config: string; sourcePath: string; sourceBytes: Buffer }>()
function canonical(path: string): string {
  const absolute = resolve(path)
  if (existsSync(absolute)) return realpathSync.native(absolute)
  return resolve(canonical(dirname(absolute)), basename(absolute))
}
const contains = (root: string, file: string) => {
  const part = relative(canonical(root), file)
  return part === '' || (!isAbsolute(part) && part !== '..' && !part.startsWith('..' + sep))
}
function registerFixtureConfig(cfg: GithubConfig, file: string, bytes: Buffer): void {
  if (!cfg.fixtureMaintenance) return
  const sourceBytes = readFileSync(cfg.sourceConfig)
  const source = ConfigSchema.parse(JSON.parse(sourceBytes.toString('utf8')))
  const selectedPath = resolve(file), path = canonical(selectedPath), origin = dirname(cfg.sourceConfig)
  const project = resolve(origin, source.projectPath)
  const gitPath = (arg: string) => resolve(project, execFileSync('git', ['-c', `safe.directory=${project.replace(/\\/g, '/')}`, 'rev-parse', arg],
    { cwd: project, encoding: 'utf8', windowsHide: true, timeout: 120_000, stdio: ['ignore', 'pipe', 'pipe'] }).trim())
  const roots = [project, gitPath('--show-toplevel'), gitPath('--git-dir'), gitPath('--git-common-dir'), cfg.dataDir,
    resolve(origin, source.worktreesDir), resolve(origin, source.dataDir)]
  if (roots.some(root => contains(root, path))) throw new Error('Fixture approval config must be external to repositories, worktrees and run data')
  fixtureApprovals.set(cfg, { selectedPath, path, bytes: Buffer.from(bytes), config: JSON.stringify(cfg), sourcePath: canonical(cfg.sourceConfig), sourceBytes })
}
export function trustedFixtureDigest(cfg: GithubConfig): string {
  const approval = fixtureApprovals.get(cfg)
  if (!approval || JSON.stringify(cfg) !== approval.config || canonical(approval.selectedPath) !== approval.path
    || !readFileSync(approval.selectedPath).equals(approval.bytes)
    || canonical(cfg.sourceConfig) !== approval.sourcePath || !readFileSync(approval.sourcePath).equals(approval.sourceBytes))
    throw new Error('Fixture maintenance requires unchanged external operator config loaded by the host')
  return fixtureHash(JSON.stringify([fixtureHash(approval.bytes), fixtureHash(approval.sourceBytes), approval.config]))
}
export function loadGithubConfig(path: string): GithubConfig {
  const bytes = readFileSync(path)
  const cfg = GithubConfigSchema.parse(JSON.parse(bytes.toString('utf8')))
  const loaded = { ...cfg, sourceConfig: resolve(dirname(path), cfg.sourceConfig), dataDir: resolve(dirname(path), cfg.dataDir),
    stopFile: cfg.stopFile ? resolve(dirname(path), cfg.stopFile) : undefined,
    repair: cfg.repair ? { ...cfg.repair, reportConfig: resolve(dirname(path), cfg.repair.reportConfig) } : undefined }
  registerFixtureConfig(loaded, path, bytes)
  return loaded
}

export const IssueSchema = z.object({
  number: z.number().int().positive(), title: z.string().min(1).max(500),
  body: z.string().max(64_000).nullable(), state: z.enum(['open', 'closed']),
  user: z.object({ login: z.string() }),
  labels: z.array(z.object({ name: z.string() })),
  pull_request: z.unknown().optional(),
})
export type Issue = z.infer<typeof IssueSchema>
export function eligible(issue: Issue, cfg: GithubConfig, approvedReport = false): boolean {
  const reported = issue.body?.includes('<!-- adng:report:') || issue.labels.some(label => label.name.toLowerCase() === 'autodev-reported')
  return !issue.pull_request && issue.state === 'open'
    && (reported ? approvedReport : !cfg.repair)
    && cfg.authors.some(author => author.toLowerCase() === issue.user.login.toLowerCase())
    && !issue.labels.some(label => label.name.toLowerCase() === 'no-autofix')
    && (cfg.label === null || issue.labels.some(label => label.name === cfg.label))
}
