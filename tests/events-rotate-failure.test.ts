import { expect, test, vi } from 'vitest'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// 只對 events.jsonl 保尾輪替的 tmp write 那一步注入故障；其餘路徑走真實 fs。
// 獨立成檔案（風格鏡像 tests/daemon-cooldown-write-failure.test.ts、tests/lock-pidfile-cleanup.test.ts）：
// vi.mock('node:fs') 的作用域只限本檔，不波及 tests/events.test.ts 既有測試。
const writeFileSync_ = vi.hoisted(() => vi.fn())

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  writeFileSync_.mockImplementation((...args: Parameters<typeof actual.writeFileSync>) => {
    if (String(args[0]).endsWith('events.jsonl.tmp')) {
      throw new Error('ENOSPC（模擬 events 保尾輪替寫入失敗）')
    }
    return actual.writeFileSync(...args)
  })
  return { ...actual, writeFileSync: writeFileSync_ }
})

const { EventLog } = await import('../src/events.js')

test('events.jsonl 保尾輪替寫入失敗 → append 不拋、新事件本身仍落地（觀測治理故障不可反殺主迴圈，鐵律 #4）', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-ev-rotfail-'))
  const file = join(dir, 'events.jsonl')
  const lines: string[] = []
  for (let i = 1; i <= 20000; i++) {
    lines.push(JSON.stringify({ ts: '2026-01-01T00:00:00.000Z', type: 'seed', n: i }))
  }
  writeFileSync_(file, lines.join('\n') + '\n')

  const ev = new EventLog(dir)
  expect(() => ev.append('new-event')).not.toThrow()

  const content = readFileSync(file, 'utf8')
  const allLines = content.trim().split('\n')
  // 輪替嘗試失敗未截斷（仍是 20001 行），但新事件本身照樣成功 append。
  expect(allLines).toHaveLength(20001)
  const last = JSON.parse(allLines[allLines.length - 1]!) as { type: string }
  expect(last.type).toBe('new-event')
})
