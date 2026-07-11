export interface LlmOpts { url?: string; model: string; apiKey: string; fetchFn?: typeof fetch }

export interface LlmResult { text: string; totalTokens: number }

export async function callAgent(opts: LlmOpts, prompt: string): Promise<LlmResult> {
  if (!opts.url) return { text: '', totalTokens: 0 }
  const f = opts.fetchFn ?? fetch
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)
  try {
    const res = await f(`${opts.url.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${opts.apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: opts.model,
        reasoning_effort: 'low',
        messages: [{ role: 'user', content: prompt }]
      })
    })
    if (!res.ok) return { text: '', totalTokens: 0 }
    const data = await res.json() as {
      choices?: Array<{ message?: { content?: string } }>
      usage?: { total_tokens?: number }
    }
    const text = data.choices?.[0]?.message?.content ?? ''
    const totalTokens = typeof data.usage?.total_tokens === 'number' ? data.usage.total_tokens : 0
    return { text, totalTokens }
  } catch {
    return { text: '', totalTokens: 0 }
  } finally {
    clearTimeout(timer)
  }
}
