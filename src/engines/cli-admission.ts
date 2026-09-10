import type { PreflightResult } from '../types.js'
import { cliDiagnostic, cliEvents, codexConfigArgs, redactCli } from './cli-diagnostics.js'
import { withCliRpc } from './cli-rpc.js'
import { runProcess } from './proc.js'

type QuotaWindow = { name: string; remainingPercent: number; resetsAt?: string }
export type CliAdmission = {
  checkedAt: string
  quota: { state: 'available' | 'exhausted' | 'unknown'; detail: string; windows?: QuotaWindow[] }
  model: { state: 'listed' | 'verified' | 'unavailable' | 'unknown'; requested?: string; detail: string; listedId?: string; costTier?: string }
}
const obj = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {}
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const percent = (v: number) => Math.max(0, Math.min(100, v))

export function unknownAdmission(provider: string, model?: string): CliAdmission {
  return { checkedAt: new Date().toISOString(),
    quota: { state: 'unknown', detail: provider + ': remaining quota unverified in this adapter/auth context; PONG does not measure quota' },
    model: { state: 'unknown', ...(model ? { requested: model } : {}), detail: 'not yet verified for this model and auth context' } }
}

export function codexQuota(raw: unknown, model?: string): CliAdmission['quota'] {
  const r = obj(raw), byId = obj(r.rateLimitsByLimitId)
  // Each model bucket is independent; never block a Codex model on an unrelated model's quota.
  const bucket = obj((model && byId[model]) || byId.codex || (Object.keys(byId).length === 0 ? r.rateLimits : undefined))
  const windows: QuotaWindow[] = []
  for (const name of ['primary', 'secondary']) {
    const w = obj(bucket[name])
    if (finite(w.usedPercent) && w.usedPercent >= 0) windows.push({ name, remainingPercent: percent(100 - w.usedPercent),
      ...(finite(w.resetsAt) && Math.abs(w.resetsAt) < 8.64e12 ? { resetsAt: new Date(w.resetsAt * 1000).toISOString() } : {}) })
  }
  const exhausted = bucket.spendControlReached === true || windows.some(w => w.remainingPercent === 0)
  return { state: exhausted ? 'exhausted' : windows.length ? 'available' : 'unknown', windows,
    detail: exhausted ? 'Codex included quota exhausted; automatic paid credit fallback is not authorized' : windows.length ? 'account/rateLimits/read' : 'account/rateLimits/read returned no applicable usage window' }
}

export function copilotQuota(raw: unknown, selectedModel?: unknown): CliAdmission['quota'] {
  const snapshots = obj(obj(raw).quotaSnapshots), windows: QuotaWindow[] = []
  let exhausted = false, known = false
  for (const name of ['chat', 'premium_interactions']) {
    const q = obj(snapshots[name])
    // A verified 0x model does not consume the legacy premium-request bucket.
    if (name === 'premium_interactions' && obj(obj(selectedModel).billing).multiplier === 0) continue
    if (q.isUnlimitedEntitlement === true) { known = true; continue }
    if (!finite(q.remainingPercentage) || q.remainingPercentage < 0) continue
    known = true; exhausted ||= q.remainingPercentage === 0
    windows.push({ name, remainingPercent: percent(q.remainingPercentage), ...(typeof q.resetDate === 'string' ? { resetsAt: q.resetDate } : {}) })
  }
  return { state: exhausted ? 'exhausted' : known ? 'available' : 'unknown', windows,
    detail: exhausted ? 'Copilot included quota exhausted; paid overage is not automatically enabled or used' : known ? 'account.getQuota' : 'account.getQuota returned no applicable quota snapshot' }
}

/** Native subscription status reported during a Claude PONG; never infer API-key/proxy quota. */
export function claudeQuota(stdout: string): CliAdmission['quota'] | undefined {
  const info = obj(cliEvents(stdout).reverse().find(e => e.type === 'rate_limit_event')?.rate_limit_info)
  if (!['allowed', 'allowed_warning', 'rejected'].includes(String(info.status))) return undefined
  return { state: info.status === 'rejected' || info.isUsingOverage === true || info.overageInUse === true || info.errorCode === 'credits_required' ? 'exhausted' : 'available',
    detail: 'rate_limit_event (PONG snapshot): ' + JSON.stringify({ status: info.status, rateLimitType: info.rateLimitType,
      resetsAt: info.resetsAt, isUsingOverage: info.isUsingOverage ?? info.overageInUse, errorCode: info.errorCode }) }
}

/** Reads current native metadata on every admission, before consulting the longer-lived inference cache. */
export async function readDevinModelCatalog(opts: { command: string; args?: string[]; env?: NodeJS.ProcessEnv; replaceEnv?: boolean; timeoutMs?: number }) {
  const config: string[] = []
  for (let i = 0; i < (opts.args?.length ?? 0); i++) if (opts.args![i] === '--config' && opts.args![i + 1]) config.push('--config', opts.args![++i]!)
  const r = await runProcess({ command: opts.command, args: [...config, 'models', 'list', '--format', 'json'],
    env: opts.env as Record<string, string> | undefined, replaceEnv: opts.replaceEnv, cwd: process.cwd(), stdinText: '', timeoutMs: Math.min(opts.timeoutMs || 30_000, 30_000) })
  if (r.timedOut || r.exitCode !== 0) throw new Error('models list failed: ' + cliDiagnostic(r, opts.env, opts.args))
  const families = obj(JSON.parse(r.stdout)).families
  if (!Array.isArray(families) || families.some(f => typeof obj(f).slug !== 'string' || !Array.isArray(obj(f).variants)
    || (obj(f).variants as unknown[]).some(v => typeof obj(v).model_uid !== 'string'))) throw new Error('invalid Devin model catalog')
  return families.map(f => ({ slug: String(f.slug), family: String(f.family_uid ?? f.slug), aliases: Array.isArray(f.aliases) ? f.aliases.filter((a: unknown): a is string => typeof a === 'string') : [],
    variants: (f.variants as unknown[]).map(v => ({ id: String(obj(v).model_uid), costTier: typeof obj(v).cost_tier === 'string' ? String(obj(v).cost_tier) : undefined })) }))
}

export async function nativeAdmission(provider: 'codex' | 'copilot' | 'devin', opts: {
  command: string; args?: string[]; env?: NodeJS.ProcessEnv; replaceEnv?: boolean; model?: string; timeoutMs?: number
}): Promise<CliAdmission> {
  const result = unknownAdmission(provider, opts.model)
  const explain = (e: unknown) => redactCli(String(e), { ...process.env, ...opts.env }, opts.args).slice(0, 700)
  const timeoutMs = opts.timeoutMs && opts.timeoutMs > 0 ? Math.min(opts.timeoutMs, 30_000) : 30_000
  if (provider === 'devin') {
    try {
      const families = await readDevinModelCatalog({ ...opts, timeoutMs })
      const models = families.flatMap(f => [f.slug, f.family, ...f.aliases, ...f.variants.map(v => v.id)])
      const exact = families.flatMap(f => f.variants).find(v => v.id === opts.model)
      result.model = { ...result.model, state: opts.model ? models.includes(opts.model) ? 'listed' : 'unavailable' : 'unknown',
        ...(exact ? { listedId: exact.id, ...(exact.costTier ? { costTier: exact.costTier } : {}) } : {}),
        detail: 'models list --format json: ' + families.length + ' families; catalog is not an inference receipt' }
    } catch (e) { result.model.detail = explain(e) }
    return result
  }
  const authArgs: string[] = []
  for (let i = 0; i < (opts.args?.length ?? 0); i++) {
    if (opts.args![i] === '--auth-token-env' && opts.args![i + 1]) authArgs.push('--auth-token-env', opts.args![++i]!)
  }
  try {
    await withCliRpc({ ...opts, timeoutMs, args: provider === 'codex'
      ? ['app-server', '--listen', 'stdio://', ...codexConfigArgs(opts.args ?? [])]
      : ['--headless', '--no-auto-update', '--stdio', ...authArgs], framed: provider === 'copilot' }, async (request, notify) => {
      if (provider === 'codex') {
        await request('initialize', { clientInfo: { name: 'autodev_metadata', version: '1.0.0' }, capabilities: { experimentalApi: true } })
        notify('initialized')
      }
      let selected: Record<string, unknown> | undefined
      try {
        const models: Record<string, unknown>[] = [], cursors = new Set<string>()
        let cursor: string | undefined
        do {
          const page = obj(await request(provider === 'codex' ? 'model/list' : 'models.list', provider === 'codex' ? { limit: 100, includeHidden: true, ...(cursor ? { cursor } : {}) } : {}))
          const rows = provider === 'codex' ? page.data : page.models
          if (!Array.isArray(rows) || rows.some(m => typeof obj(m).id !== 'string')) throw new Error('invalid model catalog')
          models.push(...rows.map(obj))
          cursor = typeof page.nextCursor === 'string' && page.nextCursor ? page.nextCursor : undefined
          if (cursor && (cursors.has(cursor) || cursors.size >= 9)) throw new Error('model catalog pagination incomplete')
          if (cursor) cursors.add(cursor)
        } while (cursor)
        selected = models.find(m => opts.model ? m.id === opts.model || m.model === opts.model : m.isDefault === true)
        result.model = { ...result.model, state: selected ? 'listed' : opts.model ? 'unavailable' : 'unknown',
          detail: (provider === 'codex' ? 'model/list' : 'models.list') + ': ' + models.length + ' models; catalog is not an inference receipt' }
        if (provider === 'codex' && opts.args?.some(arg => ['--ignore-user-config', '--profile', '-p'].includes(arg))) {
          result.model.state = 'unknown'
          result.model.detail = 'app-server cannot mirror exec config isolation/profile; configured-model PONG still required'
        }
      } catch (e) { result.model.detail = explain(e) }
      try {
        const raw = await request(provider === 'codex' ? 'account/rateLimits/read' : 'account.getQuota')
        result.quota = provider === 'codex' ? codexQuota(raw, opts.model) : copilotQuota(raw, selected)
      } catch (e) { result.quota.detail = explain(e) }
    })
  } catch (e) { result.quota.detail = explain(e); result.model.detail = explain(e) }
  return result
}

export function admissionFailure(admission: CliAdmission): PreflightResult | undefined {
  if (admission.quota.state === 'exhausted' || admission.model.state === 'unavailable') return {
    ok: false, admission, detail: admission.quota.state === 'exhausted' ? 'quota exhausted: ' + admission.quota.detail
      : 'model unavailable: ' + (admission.model.requested ?? '?') + '; ' + admission.model.detail }
}

export function withAdmission(result: PreflightResult, admission: CliAdmission, cached = false): PreflightResult {
  const model = result.ok ? { ...admission.model, state: 'verified' as const, detail: (cached ? 'cached' : 'successful') + ' terminal PONG with configured model and auth context' } : admission.model
  return { ...result, admission: { ...admission, model }, detail: result.ok ? result.detail + '; quota=' + admission.quota.state + '; model=' + model.state : result.detail }
}
