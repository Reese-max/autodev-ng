import { z } from 'zod'
import type { Config } from '../types.js'
import { codexJson } from '../engines/cli-json.js'

export interface LlmOpts { transport?: 'http' | 'cli'; dataDir?: string; effort?: string; url?: string; model: string; apiKey: string; timeoutMs?: number; fetchFn?: typeof fetch }

export interface LlmResult { text: string; totalTokens: number; error?: string }

export async function callAgent(opts: LlmOpts, prompt: string): Promise<LlmResult> {
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

export function llmFromConfig(cfg: Pick<Config, 'llmTransport' | 'dataDir' | 'judgeUrl' | 'judgeModel' | 'judgeApiKey' | 'judgeEffort' | 'judgeTimeoutMs'>, model = cfg.judgeModel, url = cfg.judgeUrl): LlmOpts {
  return { transport: cfg.llmTransport, dataDir: cfg.dataDir, url, model, apiKey: cfg.judgeApiKey, effort: cfg.judgeEffort, timeoutMs: cfg.judgeTimeoutMs }
}
