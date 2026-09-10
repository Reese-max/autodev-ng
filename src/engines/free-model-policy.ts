import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import { join } from 'node:path'
import type { EngineConfig } from '../types.js'

export const FREE_MODEL_URL = 'https://openrouter.ai/api/v1'
export const FREE_MODEL_CATALOG = `${FREE_MODEL_URL}/models`
export const FREE_MODEL_COOLDOWN_MS = 30 * 60_000
export interface FreeModelOptions { tierMode?: 'free-only'; transport?: 'http' | 'cli' | 'devin-cli'; command?: string; dataDir?: string; url?: string; model: string; apiKey?: string; effort?: string; timeoutMs?: number; fetchFn?: typeof fetch; callId?: string;
  fallbackModels?: string[]; excludedModels?: string[]; onModel?: (model: string) => void }
export class FreeModelUnavailable extends Error {
  constructor(message: string, readonly retryAt = Date.now() + FREE_MODEL_COOLDOWN_MS, readonly fallbackAllowed = false) { super(`free-policy: ${message}`) }
}
export const modelIdentity = (model: string): string => model.replace(/^openrouter\//, '').replace(/:free$/, '')

export function freeModelId(model: string): string {
  const id = model.replace(/^openrouter\//, '')
  if (!/^[a-z0-9._-]+\/[a-z0-9._-]+:free$/.test(id)) throw new FreeModelUnavailable('an explicit OpenRouter :free model is required')
  return id
}
export function assertFreeWorker(engine: EngineConfig, transport?: string): void {
  if (engine.adapter === 'mock') return // This adapter cannot issue model requests.
  if (transport === 'devin-cli' && engine.adapter === 'devin' && engine.model && !engine.env) return // Native catalog and generation identity are checked on every inference.
  if (engine.adapter !== 'opencode' || !engine.model?.startsWith('openrouter/')) throw new FreeModelUnavailable('worker CLI route is not verified; no preflight/model request sent')
  freeModelId(engine.model)
}
function route(opts: FreeModelOptions): string {
  if (opts.url?.replace(/\/$/, '') !== FREE_MODEL_URL) throw new FreeModelUnavailable('unverified endpoint; no model request sent')
  return freeModelId(opts.model)
}
export function freeModelReceipt(opts: FreeModelOptions, fields: Record<string, unknown>): void {
  if (!opts.dataDir) throw new FreeModelUnavailable('dataDir is required for pricing and request evidence')
  mkdirSync(opts.dataDir, { recursive: true })
  appendFileSync(join(opts.dataDir, 'free-model-calls.jsonl'), JSON.stringify({ at: new Date().toISOString(), callId: opts.callId, model: opts.model, provider: 'openrouter', ...fields }) + '\n')
}
export function retryAt(headers: Headers, now = Date.now()): number {
  const retry = headers.get('retry-after'), reset = headers.get('x-ratelimit-reset')
  const time = retry ? (/^\d+(\.\d+)?$/.test(retry) ? now + Number(retry) * 1000 : Date.parse(retry))
    : reset && /^\d+$/.test(reset) ? Number(reset) * (Number(reset) < 1e12 ? 1000 : 1) : NaN
  return Number.isFinite(time) && time > now ? time : now + FREE_MODEL_COOLDOWN_MS
}
function cooldownFile(opts: FreeModelOptions, kind = 'wait'): string | undefined {
  return opts.dataDir ? join(opts.dataDir, `free-model-${kind}-${createHash('sha256').update(opts.model.replace(/^openrouter\//, '')).digest('hex').slice(0, 20)}.json`) : undefined
}
export function checkCooldown(opts: FreeModelOptions): void {
  const quarantine = cooldownFile(opts, 'quarantine')
  if (quarantine && existsSync(quarantine)) throw new FreeModelUnavailable('route quarantined; inspect the cost/identity receipt before retry')
  const file = cooldownFile(opts)
  if (!file || !existsSync(file)) return
  const state = JSON.parse(readFileSync(file, 'utf8')) as { retryAt: number; blocked?: boolean; fallbackAllowed?: boolean }
  if (!Number.isFinite(state.retryAt)) throw new FreeModelUnavailable('invalid cooldown receipt')
  if (state.blocked) throw new FreeModelUnavailable('route quarantined; inspect the cost/identity receipt before retry')
  if (state.retryAt > Date.now()) throw new FreeModelUnavailable('waiting for provider quota/reset', state.retryAt, state.fallbackAllowed === true)
}
export function quarantineFreeModel(opts: FreeModelOptions): void {
  // A concurrent quota response may replace the wait receipt, but cannot clear quarantine.
  const file = cooldownFile(opts, 'quarantine')
  if (!file) throw new FreeModelUnavailable('cannot persist route quarantine')
  mkdirSync(opts.dataDir!, { recursive: true })
  const tmp = `${file}.${randomUUID()}.tmp`
  writeFileSync(tmp, JSON.stringify({ blocked: true, retryAt: Date.now() + FREE_MODEL_COOLDOWN_MS })); renameSync(tmp, file)
}
function waitForProvider(opts: FreeModelOptions, response: Response, modelRequest = false): never {
  const until = retryAt(response.headers), file = cooldownFile(opts)
  const fallbackAllowed = modelRequest && (response.status === 408 || response.status === 429 || response.status >= 500 && response.status <= 599)
  if (file) { mkdirSync(opts.dataDir!, { recursive: true }); const tmp = `${file}.${randomUUID()}.tmp`; writeFileSync(tmp, JSON.stringify({ retryAt: until, fallbackAllowed, reviewOnly: Boolean(opts.fallbackModels?.length) })); renameSync(tmp, file) }
  throw new FreeModelUnavailable(`HTTP ${response.status}`, until, fallbackAllowed)
}

export function zeroPricing(pricing: unknown): pricing is Record<string, string | number> {
  return typeof pricing === 'object' && pricing !== null && !Array.isArray(pricing)
    && 'prompt' in pricing && 'completion' in pricing
    && Object.values(pricing).every(value => ['number', 'string'].includes(typeof value) && String(value).trim() !== '' && Number(value) === 0)
}

/** Current provider metadata, explicit free variant and a fixed endpoint are all required; accounting aliases are not evidence. */
export async function admitFreeModel(opts: FreeModelOptions): Promise<{ model: string; source: string; checkedAt: string }> {
  const model = route(opts)
  checkCooldown(opts)
  const response = await (opts.fetchFn ?? fetch)(FREE_MODEL_CATALOG, { redirect: 'error', signal: AbortSignal.timeout(Math.min(opts.timeoutMs || 15_000, 15_000)) })
  if (!response.ok) waitForProvider(opts, response)
  const catalog = await response.json() as { data?: Array<{ id?: string; pricing?: Record<string, unknown> }> }
  const pricing = catalog.data?.find(entry => entry.id === model)?.pricing
  if (!zeroPricing(pricing))
    throw new FreeModelUnavailable('missing, unknown or nonzero provider pricing; no model request sent')
  const proof = { model, source: FREE_MODEL_CATALOG, checkedAt: new Date().toISOString() }
  freeModelReceipt(opts, { phase: 'admitted', ...proof, pricing, quota: 'unknown', modelCalls: 0 })
  return proof
}

/** Only explicitly configured, independent free reviewers may fail over. A returned verdict never triggers another model. */
export async function callFreeModel(opts: FreeModelOptions, prompt: string): Promise<{ text: string; totalTokens: number; actualModel: string }> {
  const models = [...new Set([opts.model, ...(opts.fallbackModels ?? [])].map(freeModelId))]
  if (models.length > 3) throw new FreeModelUnavailable('at most three free review models are allowed')
  if (opts.fallbackModels?.some(model => /minimax-m3/i.test(model))) throw new FreeModelUnavailable('MiniMax-M3 is not an allowed fallback')
  if (models.some(model => opts.excludedModels?.some(excluded => modelIdentity(model) === modelIdentity(excluded))))
    throw new FreeModelUnavailable('an independent reviewer model is required')
  const waits: number[] = []
  for (const model of models) {
    let answer: Awaited<ReturnType<typeof callSingleFreeModel>>
    try {
      answer = await callSingleFreeModel({ ...opts, model }, prompt)
    } catch (error) {
      if (!(error instanceof FreeModelUnavailable) || !error.fallbackAllowed || !opts.fallbackModels?.length) throw error
      waits.push(error.retryAt)
      continue
    }
    opts.onModel?.(answer.actualModel)
    return answer
  }
  throw new FreeModelUnavailable('all configured free reviewers are unavailable; candidate must wait', Math.min(...waits), true)
}

/** Text-only HTTP: no CLI, tools, title model, key rotation or provider fallback. */
async function callSingleFreeModel(opts: FreeModelOptions, prompt: string): Promise<{ text: string; totalTokens: number; actualModel: string }> {
  opts = { ...opts, callId: randomUUID() }
  let modelCalls = 0
  try {
    const proof = await admitFreeModel(opts)
    if (!opts.apiKey || /^\{(?:env|file):/.test(opts.apiKey)) throw new FreeModelUnavailable('configured API credential is unavailable')
    freeModelReceipt(opts, { phase: 'request-start', ...proof, modelCalls: 1 }); modelCalls = 1
    const response = await (opts.fetchFn ?? fetch)(`${FREE_MODEL_URL}/chat/completions`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(opts.timeoutMs || 60_000),
      headers: { 'content-type': 'application/json', authorization: `Bearer ${opts.apiKey}` },
      body: JSON.stringify({ model: proof.model, max_tokens: 4096, reasoning: { effort: opts.effort ?? 'low' }, provider: { allow_fallbacks: false, max_price: { prompt: 0, completion: 0 } },
        messages: [{ role: 'user', content: prompt }] }),
    }).catch(error => {
      const kind = error instanceof Error && ['TimeoutError', 'AbortError', 'TypeError'].includes(error.name) ? error.name : 'transport error'
      throw new FreeModelUnavailable(`${kind}: model transport failed or timed out`, undefined, true)
    })
    if (!response.ok) waitForProvider(opts, response, true)
    const data = await response.json() as { model?: string; choices?: Array<{ message?: { content?: string } }>; usage?: { total_tokens?: number; cost?: number } }
    if (typeof data.model !== 'string' || modelIdentity(data.model) !== modelIdentity(proof.model)) { quarantineFreeModel(opts); throw new FreeModelUnavailable('response model identity mismatch') }
    if (data.usage?.cost !== undefined && data.usage.cost !== 0) {
      freeModelReceipt(opts, { phase: 'cost-mismatch', ...proof, reportedCost: typeof data.usage.cost === 'number' ? data.usage.cost : 'invalid', modelCalls: 1 })
      quarantineFreeModel(opts)
      throw new FreeModelUnavailable('provider reported nonzero cost; stop and inspect receipt')
    }
    const text = data.choices?.[0]?.message?.content
    if (typeof text !== 'string' || !text.trim()) throw new FreeModelUnavailable('empty model response')
    const totalTokens = Number.isSafeInteger(data.usage?.total_tokens) && data.usage!.total_tokens! >= 0 ? data.usage!.total_tokens! : 0
    freeModelReceipt(opts, { phase: 'completed', ...proof, actualModel: data.model, totalTokens, reportedCost: data.usage?.cost, modelCalls: 1 })
    return { text, totalTokens, actualModel: data.model }
  } catch (error) {
    const cause = error instanceof Error && ['TimeoutError', 'AbortError', 'SyntaxError', 'TypeError'].includes(error.name) ? error.name : 'unavailable'
    const failure = error instanceof FreeModelUnavailable ? error : new FreeModelUnavailable(`${cause}: transport, catalog or receipt failed`, undefined, modelCalls > 0 && ['TimeoutError', 'AbortError'].includes(cause))
    const file = cooldownFile(opts)
    const previous = file && existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) as { retryAt: number; blocked?: boolean } : undefined
    if (modelCalls && file && (!previous || (!previous.blocked && previous.retryAt <= Date.now()))) {
      const tmp = `${file}.${randomUUID()}.tmp`
      writeFileSync(tmp, JSON.stringify({ retryAt: failure.retryAt, fallbackAllowed: failure.fallbackAllowed, reviewOnly: Boolean(opts.fallbackModels?.length) })); renameSync(tmp, file)
    }
    freeModelReceipt(opts, { phase: 'blocked', detail: failure.message, retryAt: failure.retryAt, modelCalls })
    throw failure
  }
}
