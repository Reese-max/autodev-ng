import { afterEach, describe, expect, test } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { summarizeEventsTail } from '../src/engines/events-tail-summary.js'

const dirs: string[] = []

function freshDir(): string {
  const dir = mkdtempSync(join(process.cwd(), '.tmp-events-tail-'))
  dirs.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('events.jsonl 尾段統計', () => {
  test('只統計尾段有效事件，保留 verify-fail、preflight-failed、killed 的最近樣本', () => {
    const dir = freshDir()
    writeFileSync(join(dir, 'events.jsonl'), [
      JSON.stringify({ type: 'old', seq: 0 }),
      JSON.stringify({ type: 'verify-fail', seq: 1 }),
      '{broken',
      JSON.stringify({ type: 'preflight-failed', seq: 2 }),
      JSON.stringify({ type: 'verify-fail', seq: 3 }),
      JSON.stringify({ type: 'killed', seq: 4 }),
      JSON.stringify({ type: 'verify-fail', seq: 5 }),
    ].join('\n'))

    expect(summarizeEventsTail(dir, { tailLines: 6, maxTypes: 8 })).toEqual([
      { type: 'verify-fail', count: 3, latest: { type: 'verify-fail', seq: 5 } },
      { type: 'killed', count: 1, latest: { type: 'killed', seq: 4 } },
      { type: 'preflight-failed', count: 1, latest: { type: 'preflight-failed', seq: 2 } },
    ])
  })

  test('檔案缺失、壞 JSON 與不足目標行數都 fail-open 回傳可用部分', () => {
    const dir = freshDir()
    expect(summarizeEventsTail(dir)).toEqual([])

    writeFileSync(join(dir, 'events.jsonl'), [
      '{broken',
      JSON.stringify({ type: 'preflight-failed', seq: 1 }),
      JSON.stringify({ type: 'killed', seq: 2 }),
    ].join('\n'))
    expect(summarizeEventsTail(dir, { tailLines: 200 })).toEqual([
      { type: 'killed', count: 1, latest: { type: 'killed', seq: 2 } },
      { type: 'preflight-failed', count: 1, latest: { type: 'preflight-failed', seq: 1 } },
    ])
  })

  test('尾端位元組不足時忽略截斷的首行，仍回傳後續完整事件', () => {
    const dir = freshDir()
    writeFileSync(join(dir, 'events.jsonl'), [
      JSON.stringify({ type: 'old', payload: 'x'.repeat(200) }),
      JSON.stringify({ type: 'verify-fail', seq: 1 }),
      JSON.stringify({ type: 'verify-fail', seq: 2 }),
    ].join('\n'))

    expect(summarizeEventsTail(dir, { tailBytes: 80 })).toEqual([
      { type: 'verify-fail', count: 2, latest: { type: 'verify-fail', seq: 2 } },
    ])
  })
})
