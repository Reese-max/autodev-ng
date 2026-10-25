import { createHash } from 'node:crypto'
import { lstatSync, readFileSync, readdirSync } from 'node:fs'
import { hostname, platform } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import type { Config } from '../types.js'
import { eligible, type GithubConfig, type Issue } from './config.js'

export const HERDR_GITHUB_ADMISSION_BLOCKED = 'Herdr GitHub intake disabled (#35): backend reconciliation (#33), backend readiness (#34), and authorized Windows canary evidence remain unverified; report repairs remain unsupported'
const sha = z.string().regex(/^[a-f0-9]{64}$/), pass = z.literal('PASS')
const Acceptance = z.object({
  schema: z.literal('herdr-github-intake-acceptance/v1'), repo: z.string(), engine: z.string(), provider: z.enum(['Codex', 'Pi']), model: z.string().min(1),
  sourceConfigSha256: sha, launcherSha256: sha, runtimeSha256: sha, host: z.string().min(1), herdrVersion: z.string().min(1), backendVersion: z.string().min(1), platform: z.literal('win32'),
  verifiedAt: z.string().datetime(), expiresAt: z.string().datetime(),
  contracts: z.object({ exactReceipt: z.literal(1), singleDispatchRecovery: z.literal(1), backendReadiness: z.literal(1) }).strict(),
  checks: z.object({ exactBinding: pass, backendStopped: pass, hostCommit: pass, regression: pass, independentReview: pass, draftPr: pass }).strict(),
  readiness: z.object({ login: z.literal('available'), model: z.literal('verified'), quota: z.literal('available') }).strict(),
  canary: z.object({ issue: z.number().int().positive(), snapshot: sha, executionId: z.string().min(1).max(100), commit: z.string().regex(/^[a-f0-9]{40,64}$/), draftPr: z.string().url(), ciRun: z.string().url() }).strict(),
}).strict()
const digest = (value: Buffer) => createHash('sha256').update(value).digest('hex')
/** Fingerprint the shipped runtime and dependency lock, not an asserted version label.
 * Include every runtime module so registry, schema, verification or policy changes also invalidate admission. */
export function herdrIntakeRuntimeHash(): string {
  const extension = new URL(import.meta.url).pathname.endsWith('.ts') ? '.ts' : '.js'
  const root = fileURLToPath(new URL('../', import.meta.url)), modules: [string, string][] = []
  const visit = (dir: string, prefix = '') => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
      if (entry.isSymbolicLink()) throw new Error('Linked runtime modules require fresh reviewed distribution evidence')
      const file = join(dir, entry.name), name = prefix + entry.name
      if (entry.isDirectory()) visit(file, name + '/')
      else if (entry.isFile() && entry.name.endsWith(extension)) modules.push([name, digest(readFileSync(file))])
    }
  }
  visit(root)
  modules.push(['package-lock.json', digest(readFileSync(new URL('../../package-lock.json', import.meta.url)))])
  return createHash('sha256').update(JSON.stringify(modules)).digest('hex')
}

/** Admission consumes an operator-reviewed, pinned host receipt; it never manufactures canary evidence.
 * Readiness remains time-bounded evidence, not a promise that a later provider call succeeds. The
 * existing live preflight, exact completion receipt, recovery fence, verifier and publish gates still run. */
export function assertHerdrGithubAdmission(cfg: GithubConfig, source: Config, sourceBytes: Buffer, issue?: Issue): void {
  if (!cfg.herdrIntake?.enabled || cfg.repair) throw new Error(HERDR_GITHUB_ADMISSION_BLOCKED)
  if (platform() !== 'win32') throw new Error('Herdr GitHub intake requires the accepted native Windows host')
  if (issue && (!eligible(issue, cfg) || !issue.labels.some(l => l.name.toLowerCase() === 'bug')))
    throw new Error('Herdr intake requires an authorized ordinary bugfix Issue')
  const engine = source.engines[cfg.engine]
  if (!engine || engine.adapter !== 'herdr' || !engine.command || !engine.model || !engine.timeoutMs || engine.timeoutMs > 7_200_000
    || engine.requireVerifiedFree || source.tierMode === 'free-only' || !(engine.costPerRunUsd! > 0) || !source.globalDailyHardUsd)
    throw new Error('Herdr intake requires a bounded explicit backend/model, conservative cost estimate and global budget; unknown is not verified-free')
  let accepted: z.infer<typeof Acceptance>
  try {
    const stat = lstatSync(cfg.herdrIntake.evidenceFile)
    if (!stat.isFile() || stat.size > 64_000) throw new Error('not a bounded regular receipt')
    const bytes = readFileSync(cfg.herdrIntake.evidenceFile)
    if (digest(bytes) !== cfg.herdrIntake.evidenceSha256) throw new Error('receipt pin mismatch')
    accepted = Acceptance.parse(JSON.parse(bytes.toString('utf8')))
  } catch { throw new Error('Herdr intake requires pinned compatible Windows canary capability evidence') }
  if (accepted.sourceConfigSha256 !== digest(sourceBytes)) throw new Error('Herdr accepted source configuration changed')
  if (accepted.host !== hostname()) throw new Error('Herdr accepted single host changed')
  if (accepted.runtimeSha256 !== herdrIntakeRuntimeHash()) throw new Error('Herdr accepted runtime capability implementation changed')
  if (accepted.repo !== cfg.repo || accepted.engine !== cfg.engine || accepted.provider !== (engine.provider ?? 'Codex') || accepted.model !== engine.model
    || accepted.launcherSha256 !== digest(readFileSync(engine.command))) throw new Error('Herdr accepted backend identity changed')
  const now = Date.now(), verified = Date.parse(accepted.verifiedAt), expires = Date.parse(accepted.expiresAt)
  if (verified > now || expires <= now || expires <= verified || expires - verified > 86_400_000)
    throw new Error('Herdr accepted capability/readiness evidence expired or has an invalid lifetime')
  for (const [url, kind] of [[accepted.canary.draftPr, 'pull'], [accepted.canary.ciRun, 'actions/runs']] as const) {
    if (!new RegExp(`^https://github\\.com/${cfg.repo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/${kind}/[1-9]\\d*$`).test(url))
      throw new Error('Herdr canary PR/CI evidence belongs to another repository')
  }
}
