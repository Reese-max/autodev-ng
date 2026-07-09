export interface LlmOpts { url?: string; model: string; apiKey: string; fetchFn?: typeof fetch }

export async function callAgent(opts: LlmOpts, prompt: string): Promise<string> {
  if (!opts.url) return ''
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
    if (!res.ok) return ''
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
    return data.choices?.[0]?.message?.content ?? ''
  } catch {
    return ''
  } finally {
    clearTimeout(timer)
  }
}
