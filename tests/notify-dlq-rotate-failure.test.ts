import { expect, test, vi } from 'vitest'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// 只對 notify-dlq.jsonl 保尾輪替的 tmp write 那一步注入故障；其餘路徑走真實 fs。
// 獨立成檔案（風格鏡像 tests/daemon-cooldown-write-failure.test.ts）：vi.mock('node:fs') 的
// 作用域只限本檔，不波及 tests/notify.test.ts 既有測試。
const writeFileSync_ = vi.hoisted(() => vi.fn())

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  writeFileSync_.mockImplementation((...args: Parameters<typeof actual.writeFileSync>) => {
    if (String(args[0]).endsWith('notify-dlq.jsonl.tmp')) {
      throw new Error('ENOSPC（模擬 DLQ 保尾輪替寫入失敗）')
    }
    return actual.writeFileSync(...args)
  })
  return { ...actual, writeFileSync: writeFileSync_ }
})

const { DiscordNotifier } = await import('../src/notify.js')

test('DLQ 保尾輪替寫入失敗 → send 仍回 false 不拋、DLQ 追加本身照樣成功（send 永不 throw 的既有契約不可破，鐵律 #4）', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-nt-rotfail-'))
  const dlqFile = join(dir, 'notify-dlq.jsonl')
  const lines: string[] = []
  for (let i = 1; i <= 2000; i++) {
    lines.push(JSON.stringify({ ts: '2026-01-01T00:00:00.000Z', reason: 'seed', textHead: `x${i}` }))
  }
  writeFileSync_(dlqFile, lines.join('\n') + '\n')

  const tokenDir = mkdtempSync(join(tmpdir(), 'adng-tk-rotfail-'))
  const tokenFilePath = join(tokenDir, 'tokens.env')
  writeFileSync_(tokenFilePath, 'LPBOT_TOKEN=t\n')

  const bad = (async () => new Response('nope', { status: 500 })) as typeof fetch
  const n = new DiscordNotifier({ channelId: 'C', tokenFile: tokenFilePath, dataDir: dir, fetchFn: bad })

  await expect(n.send('x')).resolves.toBe(false)

  const content = readFileSync(dlqFile, 'utf8')
  const allLines = content.trim().split('\n')
  // 輪替嘗試失敗未截斷（仍是 2001 行），但新條目本身照樣成功 append。
  expect(allLines).toHaveLength(2001)
})
