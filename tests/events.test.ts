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
