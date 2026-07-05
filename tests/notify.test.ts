import { expect, test } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DiscordNotifier, loadDiscordToken } from '../src/notify.js'

function tokenFile(content: string): string {
  const f = join(mkdtempSync(join(tmpdir(), 'adng-tk-')), 'tokens.env')
  writeFileSync(f, content)
  return f
}
function okFetch(): { fn: typeof fetch; calls: Array<{ url: string; init: RequestInit }> } {
  const calls: Array<{ url: string; init: RequestInit }> = []
  const fn = (async (url: unknown, init?: RequestInit) => {
    calls.push({ url: String(url), init: init! })
    return new Response('{}', { status: 200 })
  }) as typeof fetch
  return { fn, calls }
}

test('loadDiscordToken 解析 LPBOT_TOKEN 行；缺檔/缺行回 null', () => {
  expect(loadDiscordToken(tokenFile('A=1\nLPBOT_TOKEN=abc.def.ghi\nB=2\n'))).toBe('abc.def.ghi')
  expect(loadDiscordToken(tokenFile('A=1\n'))).toBeNull()
  expect(loadDiscordToken(join(tmpdir(), 'no-such-file-xyz.env'))).toBeNull()
})

test('send 成功：URL 對、Bot header、2xx 回 true、無 DLQ', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-nt-'))
  const { fn, calls } = okFetch()
  const n = new DiscordNotifier({ channelId: 'C123', tokenFile: tokenFile('LPBOT_TOKEN=tok123\n'), dataDir: dir, fetchFn: fn })
  expect(await n.send('哈囉')).toBe(true)
  expect(calls[0]!.url).toBe('https://discord.com/api/v10/channels/C123/messages')
  expect((calls[0]!.init.headers as Record<string, string>).authorization).toBe('Bot tok123')
  expect(existsSync(join(dir, 'notify-dlq.jsonl'))).toBe(false)
})

test('非 2xx → false + DLQ 留痕且不含 token', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-nt-'))
  const bad = (async () => new Response('nope', { status: 401 })) as typeof fetch
  const n = new DiscordNotifier({ channelId: 'C123', tokenFile: tokenFile('LPBOT_TOKEN=SECRETTOK\n'), dataDir: dir, fetchFn: bad })
  expect(await n.send('msg')).toBe(false)
  const dlq = readFileSync(join(dir, 'notify-dlq.jsonl'), 'utf8')
  expect(dlq).toContain('401')
  expect(dlq).not.toContain('SECRETTOK')
})

test('未設 channelId → false + DLQ reason=not-configured；fetch throw → false 不炸', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-nt-'))
  const n1 = new DiscordNotifier({ channelId: undefined, tokenFile: tokenFile('LPBOT_TOKEN=t\n'), dataDir: dir })
  expect(await n1.send('x')).toBe(false)
  expect(readFileSync(join(dir, 'notify-dlq.jsonl'), 'utf8')).toContain('not-configured')
  const boom = (async () => { throw new Error('ECONNRESET') }) as unknown as typeof fetch
  const n2 = new DiscordNotifier({ channelId: 'C', tokenFile: tokenFile('LPBOT_TOKEN=t\n'), dataDir: dir, fetchFn: boom })
  expect(await n2.send('x')).toBe(false)
})

test('超長訊息截 1900 字', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-nt-'))
  const { fn, calls } = okFetch()
  const n = new DiscordNotifier({ channelId: 'C', tokenFile: tokenFile('LPBOT_TOKEN=t\n'), dataDir: dir, fetchFn: fn })
  await n.send('x'.repeat(5000))
  const body = JSON.parse(String(calls[0]!.init.body)) as { content: string }
  expect(body.content.length).toBeLessThanOrEqual(1920)
  expect(body.content).toContain('[truncated]')
})
