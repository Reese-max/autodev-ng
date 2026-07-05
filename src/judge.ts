export type JudgeVerdict = 'MATCH' | 'MISMATCH' | 'SKIP'

/** 語義判官：便宜模型比對 commit 宣稱 vs diff，抓 phantom completion。infra 故障一律 SKIP（fail-open）。 */
export async function judgeCommit(
  opts: { url: string | undefined; model: string; apiKey: string; fetchFn?: typeof fetch },
  claim: string,
  diff: string
): Promise<{ verdict: JudgeVerdict; detail: string }> {
  if (!opts.url) return { verdict: 'SKIP', detail: 'no judgeUrl configured' }
  const f = opts.fetchFn ?? fetch
  const truncatedDiff = diff.split(/\r?\n/).slice(0, 200).join('\n')
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
        messages: [{
          role: 'user',
          content: `以下是一個 git commit 的宣稱與實際 diff。判斷宣稱與 diff 是否一致。只回答 MATCH 或 MISMATCH，可附一句理由。\n\n宣稱：${claim}\n\nDiff（截前200行）：\n${truncatedDiff}`
        }]
      })
    })
    if (!res.ok) return { verdict: 'SKIP', detail: `judge http ${res.status}` }
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
    const text = data.choices?.[0]?.message?.content ?? ''
    if (text.includes('MISMATCH')) return { verdict: 'MISMATCH', detail: text.slice(0, 300) }
    if (text.includes('MATCH')) return { verdict: 'MATCH', detail: text.slice(0, 300) }
    return { verdict: 'SKIP', detail: `no verdict keyword: ${text.slice(0, 120)}` }
  } catch (err) {
    return { verdict: 'SKIP', detail: `judge error: ${String(err).slice(0, 200)}` }
  } finally {
    clearTimeout(timer)
  }
}
