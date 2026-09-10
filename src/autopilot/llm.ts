import { z } from 'zod'
import type { Config } from '../types.js'
import { codexJson } from '../engines/cli-json.js'
import { callFreeModel, FreeModelUnavailable, type FreeModelOptions } from '../engines/free-model-policy.js'
import { runDevinModel } from '../engines/devin-runtime.js'

export interface LlmOpts extends FreeModelOptions { apiKey: string }

export interface LlmResult { text: string; totalTokens: number; error?: string; retryAt?: number; actualModel?: string }

export async function callAgent(opts: LlmOpts, prompt: string): Promise<LlmResult> {
  if (opts.transport === 'devin-cli') {
    try {
      if (!opts.dataDir) throw new Error('Devin CLI requires dataDir for evidence')
      const answer = await runDevinModel({ ...opts, dataDir: opts.dataDir, prompt, timeoutMs: opts.timeoutMs ?? 60_000 })
      opts.onModel?.(answer.actualModel)
      return { text: answer.answer, totalTokens: answer.tokensIn + answer.tokensOut, actualModel: answer.actualModel }
    } catch (error) { return { text: '', totalTokens: 0, error: String(error), ...(error instanceof FreeModelUnavailable ? { retryAt: error.retryAt } : {}) } }
  }
  if (opts.tierMode === 'free-only') {
    try { return await callFreeModel(opts, prompt) }
    catch (error) { return { text: '', totalTokens: 0, error: String(error), ...(error instanceof FreeModelUnavailable ? { retryAt: error.retryAt } : {}) } }
  }
  if (opts.transport === 'cli') {
    let totalTokens = 0
    try {
      if (!opts.dataDir) throw new Error('CLI model requires dataDir for evidence')
      const answer = await codexJson({ dataDir: opts.dataDir, model: opts.model, effort: opts.effort ?? 'low', timeoutMs: opts.timeoutMs ?? 60_000, onUsage: tokens => { totalTokens = tokens } },
        z.object({ text: z.string() }).strict(), prompt + '\nReturn your entire answer in the text field.')
      return { text: answer.text, totalTokens }
    } catch (error) { return { text: '', totalTokens, error: String(error) } }
  }
  if (!opts.url) return { text: '', totalTokens: 0 }
  const f = opts.fetchFn ?? fetch
  const controller = new AbortController()
  const timer = opts.timeoutMs === undefined ? undefined : setTimeout(() => controller.abort(), opts.timeoutMs)
  try {
    const res = await f(`${opts.url.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${opts.apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: opts.model,
        reasoning_effort: opts.effort ?? 'low',
        messages: [{ role: 'user', content: prompt }]
      })
    })
    if (!res.ok) return { text: '', totalTokens: 0, error: `HTTP ${res.status}` }
    const data = await res.json() as {
      choices?: Array<{ message?: { content?: string } }>
      usage?: { total_tokens?: number }
    }
    const text = data.choices?.[0]?.message?.content ?? ''
    const totalTokens = typeof data.usage?.total_tokens === 'number' ? data.usage.total_tokens : 0
    return { text, totalTokens }
  } catch (error) {
    const detail = controller.signal.aborted
      ? `timeout after ${opts.timeoutMs}ms`
      : `call failed: ${error instanceof Error ? error.message : String(error)}`
    return { text: '', totalTokens: 0, error: detail }
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

export function llmFromConfig(cfg: Pick<Config, 'tierMode' | 'llmTransport' | 'dataDir' | 'judgeUrl' | 'judgeModel' | 'judgeApiKey' | 'judgeEffort' | 'judgeTimeoutMs'> & Partial<Pick<Config, 'engines' | 'defaultEngine'>>, model = cfg.judgeModel, url = cfg.judgeUrl): LlmOpts {
  return { tierMode: cfg.tierMode, transport: cfg.llmTransport, dataDir: cfg.dataDir, url, model, apiKey: cfg.judgeApiKey, effort: cfg.judgeEffort, timeoutMs: cfg.judgeTimeoutMs,
    ...(cfg.llmTransport === 'devin-cli' ? { command: cfg.engines?.[cfg.defaultEngine ?? '']?.command } : {}) }
}

export function reviewLlmFromConfig(cfg: Config, model = cfg.reviewEngine ?? cfg.auditModel ?? '', url = cfg.reviewUrl ?? cfg.judgeUrl): LlmOpts {
  return { ...llmFromConfig(cfg, model, url), ...(cfg.tierMode === 'free-only' ? {
    fallbackModels: cfg.freeReviewFallbacks, excludedModels: [cfg.judgeModel, ...Object.values(cfg.engines).map(engine => engine.model ?? '')],
  } : {}) }
}
