import { expect, test } from 'vitest'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { digestDeliveryLines, digestGoalLine } from '../src/engines/digest-deliveries.js'

function freshDir(): string {
  return mkdtempSync(join(tmpdir(), 'adng-deliv-'))
}

test('今日交付：本地日內 task-done 前 5 筆＋等 N 筆，長標題截斷', () => {
  const dir = freshDir()
  const rows = []
  for (let i = 1; i <= 7; i++) {
    rows.push(JSON.stringify({ type: 'task-done', ts: `2026-07-28T0${i}:00:00.000Z`, task: `任務${i} ${'長'.repeat(60)}` }))
  }
  rows.push(JSON.stringify({ type: 'task-done', ts: '2026-07-26T01:00:00.000Z', task: '昨日任務不入列' }))
  rows.push(JSON.stringify({ type: 'task-blocked', ts: '2026-07-28T02:30:00.000Z', task: '非 done 不入列' }))
  rows.push('{壞行')
  writeFileSync(join(dir, 'events.jsonl'), rows.join('\n') + '\n')
  const lines = digestDeliveryLines(dir, '2026-07-28', 0)
  expect(lines[0]).toBe('今日交付 7 筆：')
  expect(lines).toHaveLength(7) // 標題 + 5 筆 + 等共行
  expect(lines[1]).toContain('任務1')
  expect(lines[1]).toContain('…') // 截斷標記
  expect(lines[6]).toBe('  …等共 7 筆')
  expect(lines.join('\n')).not.toContain('昨日任務')
})

test('零 task-done／缺檔 → 空（整段省略）', () => {
  const dir = freshDir()
  expect(digestDeliveryLines(dir, '2026-07-28', 0)).toEqual([])
  writeFileSync(join(dir, 'events.jsonl'), JSON.stringify({ type: 'idle', ts: '2026-07-28T01:00:00.000Z' }) + '\n')
  expect(digestDeliveryLines(dir, '2026-07-28', 0)).toEqual([])
})

test('GOAL 行：取 GOAL.md 首個非標題行截 40 字；缺檔回 null', () => {
  const dir = freshDir()
  expect(digestGoalLine(dir)).toBeNull()
  writeFileSync(join(dir, 'GOAL.md'), '# GOAL\n\n建立筆記品質雙指標的機械量測，' + 'x'.repeat(60) + '\n')
  const line = digestGoalLine(dir)
  expect(line).toContain('當前 GOAL：建立筆記品質雙指標的機械量測')
  expect(line!.length).toBeLessThan(60)
})
