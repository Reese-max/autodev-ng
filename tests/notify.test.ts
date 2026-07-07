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

test('loadDiscordToken 移除 CRLF、剝除成對引號', () => {
  expect(loadDiscordToken(tokenFile('LPBOT_TOKEN="abc.def"\r\n'))).toBe('abc.def')
})

test('loadDiscordToken 移除前後空白', () => {
  expect(loadDiscordToken(tokenFile('LPBOT_TOKEN=  tok  \n'))).toBe('tok')
})

test('loadDiscordToken 空引號回 null', () => {
  expect(loadDiscordToken(tokenFile('LPBOT_TOKEN=""\n'))).toBeNull()
})

test('loadDiscordToken 容忍 cmd batch set 前綴（CRLF 行尾）', () => {
  expect(loadDiscordToken(tokenFile('set LPBOT_TOKEN=abc.fake.token\r\n'))).toBe('abc.fake.token')
  expect(loadDiscordToken(tokenFile('SET LPBOT_TOKEN=abc.fake.token\r\n'))).toBe('abc.fake.token')
})

test('loadDiscordToken 容忍 shell export 前綴', () => {
  expect(loadDiscordToken(tokenFile('export LPBOT_TOKEN=abc.fake.token\n'))).toBe('abc.fake.token')
})

test('loadDiscordToken set 前綴的其他變數不誤抓', () => {
  expect(loadDiscordToken(tokenFile('set OTHER_TOKEN=x\nset ANOTHER=y\n'))).toBeNull()
})

// MEDIUM-4：notify-dlq.jsonl 無界成長治理。行數制門檻（brief：>2000 保尾 1000）。
function seedDlqFile(dir: string, n: number): string {
  const file = join(dir, 'notify-dlq.jsonl')
  const lines: string[] = []
  for (let i = 1; i <= n; i++) {
    lines.push(JSON.stringify({ ts: '2026-01-01T00:00:00.000Z', reason: 'seed', textHead: `x${i}` }))
  }
  writeFileSync(file, lines.join('\n') + '\n')
  return file
}

test('DLQ 超過 2000 行 → 保尾 1000 行，內容為最新且每行合法 JSON', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-nt-'))
  seedDlqFile(dir, 2000)
  const bad = (async () => new Response('nope', { status: 500 })) as typeof fetch
  const n = new DiscordNotifier({ channelId: 'C', tokenFile: tokenFile('LPBOT_TOKEN=t\n'), dataDir: dir, fetchFn: bad })
  expect(await n.send('新失敗訊息')).toBe(false)
  const lines = readFileSync(join(dir, 'notify-dlq.jsonl'), 'utf8').trim().split('\n')
  expect(lines).toHaveLength(1000)
  for (const line of lines) expect(() => JSON.parse(line)).not.toThrow()
  // 原 2000 行 + 新 1 行 = 2001 行，保尾 1000 = 原 index 1002..2000（999 行）+ 新事件（1 行）
  const first = JSON.parse(lines[0]!) as { textHead: string }
  expect(first.textHead).toBe('x1002')
  const last = JSON.parse(lines[lines.length - 1]!) as { reason: string }
  expect(last.reason).toBe('http-500')
})

test('DLQ 剛好 2000 行（未超過）不觸發保尾', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-nt-'))
  seedDlqFile(dir, 1999)
  const bad = (async () => new Response('nope', { status: 500 })) as typeof fetch
  const n = new DiscordNotifier({ channelId: 'C', tokenFile: tokenFile('LPBOT_TOKEN=t\n'), dataDir: dir, fetchFn: bad })
  await n.send('x')
  const lines = readFileSync(join(dir, 'notify-dlq.jsonl'), 'utf8').trim().split('\n')
  expect(lines).toHaveLength(2000)
})
