import { expect, test } from 'vitest'
import { mkdtempSync, readFileSync } from 'node:fs'
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
