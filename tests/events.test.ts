import { expect, test } from 'vitest'
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { EventLog } from '../src/events.js'

test('append 寫 JSONL、每行可 parse、含 ts/type', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-ev-'))
  const ev = new EventLog(dir)
  ev.append('round-start', { n: 1 })
  ev.append('round-end')
  const lines = readFileSync(join(dir, 'events.jsonl'), 'utf8').trim().split('\n')
  expect(lines).toHaveLength(2)
  const first = JSON.parse(lines[0]!)
  expect(first.type).toBe('round-start')
  expect(first.ts).toMatch(/^\d{4}-/)
  expect(first.n).toBe(1)
})

test('appendOnce 24h 內同 type 去重', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-ev-'))
  const ev = new EventLog(dir)
  expect(ev.appendOnce('idle')).toBe(true)
  expect(ev.appendOnce('idle')).toBe(false)
})

test('heartbeat 覆寫 heartbeat.json', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-ev-'))
  const ev = new EventLog(dir)
  ev.heartbeat({ state: 'idle', todayCostUsd: 1.2 })
  const hb = JSON.parse(readFileSync(join(dir, 'heartbeat.json'), 'utf8'))
  expect(hb.state).toBe('idle')
  expect(hb.ts).toBeDefined()
})

test('appendOnce 遇 events-once.json 損壞不 throw，降級重建為合法 JSON', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-ev-'))
  const ev = new EventLog(dir)
  const onceFile = join(dir, 'events-once.json')
  writeFileSync(onceFile, '{broken')
  expect(() => ev.appendOnce('idle')).not.toThrow()
  expect(ev.appendOnce('idle')).toBe(false)
  const seen = JSON.parse(readFileSync(onceFile, 'utf8'))
  expect(seen.idle).toBeDefined()
})

test('append 的 data 不可覆蓋內建 ts/type', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-ev-'))
  const ev = new EventLog(dir)
  ev.append('x', { ts: 'FAKE', type: 'EVIL', n: 1 })
  const line = readFileSync(join(dir, 'events.jsonl'), 'utf8').trim()
  const parsed = JSON.parse(line)
  expect(parsed.type).toBe('x')
  expect(parsed.ts).not.toBe('FAKE')
  expect(parsed.ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  expect(parsed.n).toBe(1)
})

test('heartbeat 寫入後目錄中無殘留 .tmp 檔', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-ev-'))
  const ev = new EventLog(dir)
  ev.heartbeat({ state: 'running', todayCostUsd: 0 })
  const tmpFiles = readdirSync(dir).filter((f) => f.endsWith('.tmp'))
  expect(tmpFiles).toHaveLength(0)
  expect(existsSync(join(dir, 'heartbeat.json'))).toBe(true)
})

// MEDIUM-4：events.jsonl 無界成長治理。行數制門檻（>20000 保尾 10000，與 DLQ 對稱）。
function seedEventsFile(dir: string, n: number): string {
  const file = join(dir, 'events.jsonl')
  const lines: string[] = []
  for (let i = 1; i <= n; i++) {
    lines.push(JSON.stringify({ ts: '2026-01-01T00:00:00.000Z', type: 'seed', n: i }))
  }
  writeFileSync(file, lines.join('\n') + '\n')
  return file
}

test('append 使 events.jsonl 超過 20000 行 → 保尾 10000 行，內容為最新且每行合法 JSON', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-ev-'))
  seedEventsFile(dir, 20000)
  const ev = new EventLog(dir)
  ev.append('new-tail-event', { marker: 'tail' }) // 第 20001 行，觸發 >20000 保尾
  const lines = readFileSync(join(dir, 'events.jsonl'), 'utf8').trim().split('\n')
  expect(lines).toHaveLength(10000)
  for (const line of lines) expect(() => JSON.parse(line)).not.toThrow()
  // 原 20000 行 + 新 1 行 = 20001 行，保尾 10000 = 原 index 10002..20000（9999 行）+ 新事件（1 行）
  const first = JSON.parse(lines[0]!) as { n: number }
  expect(first.n).toBe(10002)
  const last = JSON.parse(lines[lines.length - 1]!) as { type: string; marker: string }
  expect(last.type).toBe('new-tail-event')
  expect(last.marker).toBe('tail')
})

test('events.jsonl 剛好 20000 行（未超過）不觸發保尾', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-ev-'))
  seedEventsFile(dir, 19999)
  const ev = new EventLog(dir)
  ev.append('normal') // 第 20000 行，等於上限、不觸發（>20000 才觸發）
  const lines = readFileSync(join(dir, 'events.jsonl'), 'utf8').trim().split('\n')
  expect(lines).toHaveLength(20000)
})

test('appendOnce 觸發的 append 也計入輪替行數（appendOnce 不繞過保尾機制）', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-ev-'))
  seedEventsFile(dir, 20000)
  const ev = new EventLog(dir)
  expect(ev.appendOnce('idle')).toBe(true) // 第 20001 行，觸發保尾
  const lines = readFileSync(join(dir, 'events.jsonl'), 'utf8').trim().split('\n')
  expect(lines).toHaveLength(10000)
  const last = JSON.parse(lines[lines.length - 1]!) as { type: string }
  expect(last.type).toBe('idle')
})
