import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { z } from 'zod'
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
export function loadGithubConfig(path: string): GithubConfig {
  const cfg = GithubConfigSchema.parse(JSON.parse(readFileSync(path, 'utf8')))
  return { ...cfg, sourceConfig: resolve(dirname(path), cfg.sourceConfig), dataDir: resolve(dirname(path), cfg.dataDir),
    stopFile: cfg.stopFile ? resolve(dirname(path), cfg.stopFile) : undefined,
    repair: cfg.repair ? { ...cfg.repair, reportConfig: resolve(dirname(path), cfg.repair.reportConfig) } : undefined }
}

export const IssueSchema = z.object({
  number: z.number().int().positive(), title: z.string().min(1).max(500),
  body: z.string().max(100_000).nullable(), state: z.enum(['open', 'closed']),
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
