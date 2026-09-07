import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { z } from 'zod'
import { GithubConfigSchema } from './config.js'

const Key = z.string().regex(/^[a-z0-9][a-z0-9._-]{0,79}$/)
const Persona = z.string().regex(/^[A-J]0[1-5]$/)
const Scenario = z.object({ id: Key, persona: Persona, task: z.string().min(8).max(500), success: z.string().min(8).max(500) }).strict()
export const ReportProjectSchema = z.object({
  repo: GithubConfigSchema.shape.repo, sourceConfig: z.string().min(1),
  purpose: z.string().min(8).max(1000), constraints: z.string().max(2000).default(''),
  scenarios: z.array(Scenario).min(1).max(3),
  // Only operator-configured commands are executable; model output never becomes a command.
  probes: z.array(z.object({ id: Key, scenario: Key, command: z.string().min(1), args: z.array(z.string()),
    expectedExit: z.number().int().default(0), expectedText: z.string().min(1).optional(),
    timeoutMs: z.number().int().min(1000).max(30_000).default(10_000),
  }).strict()).max(5).default([]),
  githubSearch: z.string().max(300).optional(),
  publicDocs: z.array(z.string().url().refine(s => {
    const u = new URL(s)
    return u.protocol === 'https:' && !u.username && !u.password && !u.search && !u.hash
      && ['docs.github.com', 'developers.openai.com', 'docs.python.org', 'developer.mozilla.org', 'playwright.dev', 'clig.dev'].includes(u.hostname)
  })).max(2).default([]),
}).strict().superRefine((p, ctx) => {
  if (new Set(p.scenarios.map(s => s.id)).size !== p.scenarios.length || new Set(p.probes.map(s => s.id)).size !== p.probes.length)
    ctx.addIssue({ code: 'custom', message: 'Duplicate scenario/probe id' })
  for (const probe of p.probes) if (!p.scenarios.some(s => s.id === probe.scenario)) ctx.addIssue({ code: 'custom', message: 'Unknown probe scenario' })
})
export const ReportConfigSchema = z.object({
  owner: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9-]*$/), enabled: z.boolean().default(false), publish: z.boolean().default(false),
  dataDir: z.string().min(1), stopFile: z.string().min(1), personaFile: z.string().min(1),
  projects: z.array(ReportProjectSchema).min(1).max(50),
  repairConfigs: z.array(z.string().min(1)).max(50).default([]),
  proposalRepos: z.array(GithubConfigSchema.shape.repo).max(50).default([]),
  intervalMs: z.number().int().min(60_000).default(900_000),
  dailyRepoLimit: z.number().int().min(1).max(3).default(3), dailyAccountLimit: z.number().int().min(1).max(10).default(10),
  research: z.object({ enabled: z.boolean().default(false), model: z.string().min(1),
    effort: z.enum(['low', 'medium', 'high', 'xhigh', 'max']).default('max'),
    intervalMs: z.number().int().min(86_400_000).default(604_800_000),
    timeoutMs: z.number().int().min(10_000).max(300_000).default(180_000),
    anysearchScript: z.string().optional(),
  }).strict(),
}).strict().superRefine((cfg, ctx) => {
  const names = cfg.projects.map(p => p.repo.toLowerCase())
  if (cfg.proposalRepos.some(repo => !names.includes(repo.toLowerCase()))) ctx.addIssue({ code: 'custom', message: 'Proposal adoption must be scoped to a configured project' })
  if (new Set(names).size !== names.length || names.some(n => n.split('/')[0] !== cfg.owner.toLowerCase()))
    ctx.addIssue({ code: 'custom', message: 'Only unique repositories owned by the configured account are allowed' })
})
export type ReportConfig = z.infer<typeof ReportConfigSchema>
export type ReportProject = z.infer<typeof ReportProjectSchema>
export function loadReportConfig(file: string): ReportConfig {
  const cfg = ReportConfigSchema.parse(JSON.parse(readFileSync(file, 'utf8')))
  const path = (p: string) => resolve(dirname(file), p)
  return { ...cfg, dataDir: path(cfg.dataDir), stopFile: path(cfg.stopFile), personaFile: path(cfg.personaFile),
    repairConfigs: cfg.repairConfigs.map(path),
    projects: cfg.projects.map(p => ({ ...p, sourceConfig: path(p.sourceConfig) })),
    research: { ...cfg.research, anysearchScript: cfg.research.anysearchScript ? path(cfg.research.anysearchScript) : undefined } }
}
