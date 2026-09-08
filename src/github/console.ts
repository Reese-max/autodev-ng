import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { loadGithubConfig, githubStopFile, type GithubConfig } from './config.js'
import { states, runDir } from './state.js'
import { acceptDelivery, delivery, recoverIssue, repairDoctor } from './operations.js'
import { acquireLock, releaseLock } from '../lock.js'
import { githubClient } from './client.js'
import { observePr } from './followup.js'
import { z } from 'zod'

// Only administrator-owned integration files matching the selected project are exposed.
export async function githubConsole(sourceFile: string, input: { action?: string; integration?: string; issue?: number; reason?: string; commit?: string } = {}) {
  input = z.object({ action: z.enum(['doctor', 'retry', 'resume', 'accept', 'refresh', 'evidence']).optional(), integration: z.string().regex(/^[A-Za-z0-9_.-]+\.json$/).optional(), issue: z.number().int().positive().optional(), reason: z.string().max(2000).optional(), commit: z.string().regex(/^[a-f0-9]{40,64}$/).optional() }).strict().parse(input)
  const dir = join(dirname(resolve(sourceFile)), 'integrations')
  const integrations = existsSync(dir) ? readdirSync(dir).filter(n => n.endsWith('.json')).flatMap((name): { name: string; file: string; cfg?: GithubConfig; error: string }[] => {
    const file = join(dir, name)
    let raw: { repo?: string; sourceConfig?: string }
    try { raw = JSON.parse(readFileSync(file, 'utf8')) } catch { return [] }
    if (!raw.repo || !raw.sourceConfig || resolve(dir, raw.sourceConfig).toLowerCase() !== resolve(sourceFile).toLowerCase()) return []
    try { return [{ name, file, cfg: loadGithubConfig(file), error: '' }] }
    catch { return [{ name, file, cfg: undefined, error: 'Integration configuration invalid; check schema and required fields' }] }
  }) : []
  if (input.action) {
    const selected = integrations.find(i => i.name === input.integration)
    if (!selected?.cfg) throw new Error('Unknown or invalid project integration')
    const { cfg, file } = selected
    if (input.action === 'evidence') {
      const state = states(cfg).find(s => s.issue.number === input.issue)
      if (!state) throw new Error('Issue not found')
      return delivery(cfg, state)
    }
    if (input.action === 'doctor') return repairDoctor(cfg, false)
    if (input.action === 'retry' || input.action === 'resume') return recoverIssue(file, input.issue!, input.reason ?? '', input.action === 'resume')
    if (input.action === 'accept') return acceptDelivery(file, input.issue!, input.commit ?? '', input.reason ?? '')
    if (input.action !== 'refresh') throw new Error('Unknown GitHub action')
    const lock = join(cfg.dataDir, 'runner.lock')
    if (!existsSync(cfg.dataDir) || !acquireLock(lock)) throw new Error('No initialized data or runner active')
    const original = readFileSync(file, 'utf8'), source = readFileSync(sourceFile, 'utf8')
    const active = () => readFileSync(file, 'utf8') === original && readFileSync(sourceFile, 'utf8') === source && cfg.enabled && !existsSync(githubStopFile(cfg))
    try { for (const state of states(cfg).filter(s => s.status === 'published')) await observePr(cfg, state, githubClient(cfg), active) }
    finally { releaseLock(lock) }
  }
  return { integrations: integrations.map(({ name, cfg, error }) => ({ name, error, repo: cfg?.repo,
    enabled: cfg?.enabled, paused: cfg ? !cfg.enabled || existsSync(githubStopFile(cfg)) : true, followup: cfg?.followup,
    issues: cfg ? states(cfg).map(state => {
      let verified = false
      if (['ready', 'published'].includes(state.status)) try { delivery(cfg, state); verified = true } catch { /* No green badge without evidence. */ }
      return { number: state.issue.number, title: state.issue.title, status: state.status, runs: state.runs, maxRuns: cfg.maxRuns,
        revision: state.revision?.round ?? 0, detail: state.detail, commit: state.commit, pr: state.pr, history: state.history ?? [],
        verified, projectAcceptance: verified && !!cfg.acceptance, remote: state.remote?.head === state.commit ? state.remote : undefined,
        accepted: !!state.acceptance && state.acceptance.commit === state.commit,
        evidenceDirectory: runDir(cfg, state), nextRunAt: state.nextRunAt }
    }) : [] })) }
}
