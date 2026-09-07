import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { z } from 'zod'
import { acquireLock, releaseLock } from '../lock.js'
import { FindingSchema, observeProject, projectContext, publicationSafe, reportFingerprint, researchProject, type Finding } from '../autopilot/report-research.js'
import { command } from './client.js'
import { loadReportConfig, type ReportConfig, type ReportProject } from './report-config.js'
import { fingerprint } from './state.js'

const RemoteSchema = z.object({ number: z.number().int().positive(), html_url: z.string().url(), body: z.string().nullable(), title: z.string(),
  state: z.enum(['open', 'closed']), user: z.object({ login: z.string() }), labels: z.array(z.object({ name: z.string() })), created_at: z.string(), pull_request: z.unknown().optional() })
type RemoteIssue = z.infer<typeof RemoteSchema>
const EntrySchema = z.object({ finding: FindingSchema, status: z.enum(['pending', 'publishing', 'posted', 'suppressed']),
  issueFingerprint: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  firstSeen: z.string(), lastSeen: z.string(), attemptAt: z.string().optional(), issue: z.number().int().positive().optional(), url: z.string().url().optional(), detail: z.string().optional() }).strict()
const StateSchema = z.object({ version: z.literal(1), owner: z.string(), nextApiAt: z.number(),
  projects: z.record(z.string(), z.object({ nextObserveAt: z.number(), nextResearchAt: z.number(), lastRun: z.string().optional(), detail: z.string().optional() }).strict()),
  entries: z.record(z.string(), EntrySchema), lastRun: z.string().optional(), lastError: z.string().optional() }).strict()
export type ReportState = z.infer<typeof StateSchema>
const statePath = (cfg: ReportConfig) => join(cfg.dataDir, 'state.json')
export function readReportState(cfg: ReportConfig): ReportState {
  let raw: string
  try { raw = readFileSync(statePath(cfg), 'utf8') } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e
    return { version: 1, owner: cfg.owner, nextApiAt: 0, projects: {}, entries: {} }
  }
  const state = StateSchema.parse(JSON.parse(raw))
  if (state.owner.toLowerCase() !== cfg.owner.toLowerCase() || Object.entries(state.entries).some(([key, e]) => key !== reportFingerprint(e.finding))) throw new Error('Reporting state identity mismatch')
  return state
}
export function saveReportState(cfg: ReportConfig, state: ReportState): void {
  mkdirSync(cfg.dataDir, { recursive: true })
  const temp = `${statePath(cfg)}.${randomUUID()}.tmp`
  writeFileSync(temp, JSON.stringify(StateSchema.parse(state), null, 2) + '\n', { mode: 0o600 })
  renameSync(temp, statePath(cfg))
}
export const reportMarker = (fingerprint: string) => `<!-- adng:report:v1:${fingerprint} -->`
const labels = (f: Finding) => ['autodev-reported', 'needs-triage', ...(f.kind === 'proposal' ? ['needs-validation'] : [])]
export function reportBody(f: Finding): string {
  const body = `此案由 AutoDev 巡檢自動建立，等待分流。persona 為模擬，並非真人研究。\n\n` +
    `類型：${f.kind === 'defect' ? '可重現缺陷' : '改善提案（仍需驗證）'}；證據：${f.evidence === 'runtime' ? '宿主實際執行' : '靜態資料與模型評審，尚未執行使用者旅程'}\n` +
    `Persona：${f.persona}；情境：${f.scenario}\n\n使用者任務：${f.task}\n\n預期結果：${f.expected}\n\n目前觀察：\n${f.actual}\n\n` +
    `重現方式：\n${f.reproduction}\n\n驗收條件：\n${f.acceptance}\n\n評審：${f.review}\n\n` +
    `觀察時間：${f.observedAt}\n本機觀察版本：${f.sha}\n\n` +
    (f.sources.length ? `公開靈感來源（只作研究依據）：\n${f.sources.map(s => `- ${s.url}（擷取 ${s.fetchedAt}；來源更新 ${s.updatedAt}）`).join('\n')}\n\n` : '')
  if (!publicationSafe(body + f.title) || body.length > 15_000) throw new Error('Publication content failed safety/size gate')
  return body + reportMarker(reportFingerprint(f))
}

class ApiFailure extends Error { constructor(readonly retryAt: number) { super('GitHub request failed; publication paused, ambiguous POST will only be reconciled') } }
export function reportApi(endpoint: string, body?: unknown): unknown {
  const response = (raw: string) => {
    const at = raw.search(/\r?\n\r?\n/)
    if (at < 0) throw new Error('Missing GitHub response headers')
    return JSON.parse(raw.slice(at).trim()) as unknown
  }
  try {
    return response(command('gh', ['api', '--hostname', 'github.com', '--include', endpoint, '--method', body === undefined ? 'GET' : 'POST',
      ...(body === undefined ? [] : ['--input', '-'])], undefined, body === undefined ? undefined : JSON.stringify(body)))
  } catch (error) {
    const detail = String((error as { stdout?: unknown }).stdout ?? '') + '\n' + String((error as { stderr?: unknown }).stderr ?? '')
    const retry = detail.match(/^retry-after:\s*(.+)$/im)?.[1]?.trim()
    const reset = detail.match(/^x-ratelimit-reset:\s*(\d+)/im)?.[1]
    const retryAt = retry ? (/^\d+$/.test(retry) ? Date.now() + Number(retry) * 1000 : Date.parse(retry)) : 0
    // ponytail: persistent backoff instead of an in-process retry loop; inspect uncertain POSTs before any retry.
    throw new ApiFailure(Math.max(Date.now() + 3_600_000, Number.isFinite(retryAt) ? retryAt : 0, Number(reset ?? 0) * 1000))
  }
}
function listIssues(repo: string, request: typeof reportApi): RemoteIssue[] {
  const rows: RemoteIssue[] = []
  for (let page = 1; page <= 100; page++) {
    const batch = z.array(RemoteSchema).parse(request(`repos/${repo}/issues?state=all&per_page=100&page=${page}&sort=created&direction=desc`))
    rows.push(...batch.filter(i => !i.pull_request))
    if (batch.length < 100) return rows
  }
  throw new Error('Issue pagination ceiling reached; incomplete deduplication prevents publication')
}
export function stopped(cfg: ReportConfig, project?: ReportProject): boolean {
  if (!cfg.enabled || existsSync(cfg.stopFile) || existsSync(join(cfg.dataDir, '.adng.stop'))) return true
  if (!project) return false
  const raw = z.object({ dataDir: z.string(), stopFile: z.string().optional() }).parse(JSON.parse(readFileSync(project.sourceConfig, 'utf8')))
  const base = dirname(project.sourceConfig)
  return [join(base, '.adng.stop'), resolve(base, raw.stopFile ?? join(raw.dataDir, '.adng.stop')), resolve(base, raw.dataDir, '.adng.stop')].some(existsSync)
}
export async function runReports(cfg: ReportConfig, options: { dryRun?: boolean; collectOnly?: boolean; configPath?: string; now?: number;
  request?: typeof reportApi; observe?: typeof observeProject; research?: typeof researchProject } = {}): Promise<string> {
  if (stopped(cfg)) return 'paused'
  mkdirSync(cfg.dataDir, { recursive: true })
  // ponytail: one account ledger/lock on one host; use a shared lease before enabling a second reporting host.
  const lock = join(cfg.dataDir, 'report.lock')
  if (!acquireLock(lock)) return 'locked'
  try {
    const state = readReportState(cfg), now = options.now ?? Date.now(), stamp = new Date(now).toISOString()
    const configHash = options.configPath ? createHash('sha256').update(readFileSync(options.configPath)).digest('hex') : ''
    const canWrite = (project: ReportProject) => cfg.publish && !options.dryRun && !options.collectOnly && !stopped(cfg, project)
      && (!options.configPath || configHash === createHash('sha256').update(readFileSync(options.configPath)).digest('hex'))
    if (state.nextApiAt > now) return 'api-cooldown'
    const request = options.request ?? reportApi
    if (z.object({ login: z.string() }).parse(request('user')).login.toLowerCase() !== cfg.owner.toLowerCase()) throw new Error('GitHub account mismatch')
    let researched = false, posted = 0
    const remote = new Map<string, RemoteIssue[]>()
    // Complete the account-wide dedup/quota read before allowing the first write.
    for (const project of cfg.projects) {
      const meta = z.object({ full_name: z.string(), owner: z.object({ login: z.string() }), archived: z.boolean(), disabled: z.boolean(), has_issues: z.boolean(), permissions: z.object({ push: z.boolean() }) })
        .parse(request(`repos/${project.repo}`))
      if (meta.full_name.toLowerCase() !== project.repo.toLowerCase() || meta.owner.login.toLowerCase() !== cfg.owner.toLowerCase() || meta.archived || meta.disabled || !meta.has_issues || !meta.permissions.push) throw new Error('Repository ownership/Issue permission gate failed')
      remote.set(project.repo, listIssues(project.repo, request))
    }
    for (const project of cfg.projects) {
      if (stopped(cfg, project)) continue
      const issues = remote.get(project.repo)!
      const progress = state.projects[project.repo] ??= { nextObserveAt: 0, nextResearchAt: 0 }
      let observationFailed = false
      for (const [id, entry] of Object.entries(state.entries).filter(([, e]) => e.finding.repo === project.repo)) {
        const matches = issues.filter(i => i.body?.includes(reportMarker(id)) && i.user.login.toLowerCase() === cfg.owner.toLowerCase())
        if (matches.length > 1) throw new Error('Multiple remote Issues match one fingerprint')
        const match = matches[0]
        if (match) { entry.issue = match.number; entry.url = match.html_url; entry.status = match.state === 'closed' ? 'suppressed' : 'posted' }
        else if (entry.status === 'posted') { entry.status = 'suppressed'; entry.detail = 'Remote marker/Issue was removed; preserve human disposition' }
        // publishing without a remote match is deliberately never converted back to pending.
      }
      if (!options.dryRun && now >= progress.nextObserveAt) {
        progress.nextObserveAt = now + cfg.intervalMs
        progress.lastRun = stamp
        observationFailed = true
        try {
          const found = await (options.observe ?? observeProject)(project, stamp)
          observationFailed = false
          for (const entry of Object.values(state.entries).filter(e => e.finding.repo === project.repo && e.status === 'pending' && e.finding.kind === 'defect'))
            if (!found.some(f => reportFingerprint(f) === reportFingerprint(entry.finding))) { entry.status = 'suppressed'; entry.detail = 'Current patrol did not reproduce this finding; no longer reportable' }
          for (const finding of found) {
            FindingSchema.parse(finding)
            if (finding.repo !== project.repo) throw new Error('Cross-repository finding rejected')
            const id = reportFingerprint(finding), previous = state.entries[id]
            state.entries[id] = previous ? { ...previous, finding, lastSeen: stamp } : { finding, status: 'pending', firstSeen: stamp, lastSeen: stamp }
          }
          progress.detail = `observed ${found.length} reproducible findings`
          if (cfg.research.enabled && !researched && now >= progress.nextResearchAt && !stopped(cfg, project)) {
            researched = true; progress.nextResearchAt = now + cfg.research.intervalMs
            saveReportState(cfg, state) // Charge the weekly model budget before invocation, including crashes.
            const local = Object.values(state.entries).filter(e => e.finding.repo === project.repo).map(e => `${e.status}: ${e.finding.scenario} ${e.finding.title}`).join('\n')
            const existing = local + '\n' + issues.slice(0, 100).map(i => `#${i.number} ${i.state} ${i.title}\n${i.body ?? ''}`).join('\n').slice(0, 16000)
            for (const finding of await (options.research ?? researchProject)(cfg, project, stamp, undefined, existing)) {
              FindingSchema.parse(finding)
              if (finding.repo !== project.repo || finding.kind !== 'proposal' || finding.sources.length === 0) throw new Error('Invalid research finding')
              if (Object.values(state.entries).some(e => e.finding.repo === project.repo && e.finding.scenario === finding.scenario && e.finding.kind === 'defect' && e.status !== 'suppressed')) continue
              const id = reportFingerprint(finding)
              if (!state.entries[id]) state.entries[id] = { finding, status: 'pending', firstSeen: stamp, lastSeen: stamp }
              else if (state.entries[id]!.status === 'pending') { state.entries[id]!.finding = finding; state.entries[id]!.lastSeen = stamp }
            }
            progress.detail += '; research completed'
          }
        } catch (error) { progress.detail = `collection blocked: ${error instanceof Error ? error.message.split('\n')[0] : 'unknown error'}` }
        saveReportState(cfg, state)
      }
      if (observationFailed) continue
      const pending = Object.values(state.entries).filter(e => e.finding.repo === project.repo && e.status === 'pending').sort((a, b) => b.finding.value - a.finding.value)
      for (const entry of pending) {
        const f = entry.finding, id = reportFingerprint(f)
        const match = issues.find(i => i.body?.includes(reportMarker(id)) && i.user.login.toLowerCase() === cfg.owner.toLowerCase())
        if (match) { entry.issue = match.number; entry.url = match.html_url; entry.status = match.state === 'closed' ? 'suppressed' : 'posted'; continue }
        const manual = f.key === 'docs:readme' ? issues.find(i => /(?:no|missing|lack\w*|absent)\s+(?:root\s+)?readme|readme[^\n]{0,60}(?:missing|absent)|(?:缺少|沒有|未提供)[^\n]{0,30}README/i.test((i.title + '\n' + i.body).replace(/[`*_]/g, ''))) : undefined
        if (manual) { entry.status = 'suppressed'; entry.issue = manual.number; entry.url = manual.html_url; entry.detail = 'Existing Issue already tracks missing README'; continue }
        const body = reportBody(f)
        if (options.dryRun) { console.log(JSON.stringify({ repo: project.repo, title: f.title, body, labels: labels(f) }, null, 2)); continue }
        if (!canWrite(project) || now - Date.parse(f.observedAt) > (f.kind === 'defect' ? cfg.intervalMs * 2 : cfg.research.intervalMs)) continue
        const ctx = projectContext(project)
        if ((!ctx.clean && f.evidence === 'runtime') || ctx.sha !== f.sha) { entry.detail = 'Evidence revision changed; waiting for fresh observation'; continue }
        const since = now - 86_400_000
        const count = (repo: string) => Math.max(
          Object.values(state.entries).filter(e => e.finding.repo === repo && e.attemptAt && Date.parse(e.attemptAt) >= since).length,
          remote.get(repo)!.filter(i => i.user.login.toLowerCase() === cfg.owner.toLowerCase() && i.body?.includes('<!-- adng:report:v1:') && Date.parse(i.created_at) >= since).length)
        if (count(project.repo) >= cfg.dailyRepoLimit || cfg.projects.reduce((sum, p) => sum + count(p.repo), 0) >= cfg.dailyAccountLimit) break
        const existingLabels = z.array(z.object({ name: z.string() })).parse(request(`repos/${project.repo}/labels?per_page=100`))
        for (const label of labels(f)) if (!existingLabels.some(l => l.name === label)) {
          if (!canWrite(project)) break
          request(`repos/${project.repo}/labels`, { name: label, color: label === 'autodev-reported' ? '1d76db' : 'fbca04', description: 'AutoDev report; requires triage before execution' })
        }
        if (!canWrite(project)) break
        entry.status = 'publishing'; entry.attemptAt = stamp
        saveReportState(cfg, state) // Outbox commit MUST precede the non-idempotent request.
        if (!canWrite(project)) { entry.status = 'pending'; delete entry.attemptAt; saveReportState(cfg, state); break }
        const result = RemoteSchema.parse(request(`repos/${project.repo}/issues`, { title: f.title, body, labels: labels(f) }))
        entry.issue = result.number; entry.url = result.html_url
        saveReportState(cfg, state)
        const verified = RemoteSchema.parse(request(`repos/${project.repo}/issues/${result.number}`))
        if (verified.html_url !== `https://github.com/${project.repo}/issues/${result.number}` || verified.title !== f.title || verified.body !== body
          || verified.user.login.toLowerCase() !== cfg.owner.toLowerCase() || labels(f).some(l => !verified.labels.some(v => v.name === l))) throw new Error('Issue readback mismatch; reconcile before any further publication')
        entry.issueFingerprint = fingerprint(verified)
        entry.status = 'posted'; posted++
        issues.push(verified)
        saveReportState(cfg, state)
        break // At most one new Issue per repository per patrol.
      }
    }
    if (!options.dryRun) { state.lastRun = stamp; delete state.lastError; saveReportState(cfg, state) }
    return `reported=${posted}; pending=${Object.values(state.entries).filter(e => e.status === 'pending').length}; uncertain=${Object.values(state.entries).filter(e => e.status === 'publishing').length}`
  } catch (error) {
    try {
      const state = readReportState(cfg) // Corrupt state is never replaced with an empty ledger.
      if (error instanceof ApiFailure) state.nextApiAt = error.retryAt
      state.lastError = `${new Date().toISOString()} ${error instanceof Error ? error.message.split('\n')[0] : 'report failed'}`.slice(0, 700)
      saveReportState(cfg, state)
    } catch { /* Preserve the original failure and any corrupt ledger for inspection. */ }
    throw error
  } finally { releaseLock(lock) }
}

export async function reportCli(mode: string, file: string, dryRun = false): Promise<void> {
  const cfg = loadReportConfig(file)
  if (mode === 'report-status') console.log(JSON.stringify({ enabled: cfg.enabled, publish: cfg.publish, paused: stopped(cfg), ...readReportState(cfg) }, null, 2))
  else {
    console.log(await runReports(cfg, { dryRun, collectOnly: mode === 'report-collect', configPath: file }))
    if (mode === 'report' && !dryRun) await (await import('./repair.js')).repairFromReports(file)
  }
}
export async function reportFromPatrol(configsDir: string): Promise<void> {
  const file = resolve(configsDir, 'integrations', 'github-reports.json')
  if (!existsSync(file)) return
  try {
    console.log(`github-report: ${await runReports(loadReportConfig(file), { configPath: file })}`)
    await (await import('./repair.js')).repairFromReports(file)
  } catch { console.error('github-report/repair: blocked; inspect github report-status and repair-status') }
}
