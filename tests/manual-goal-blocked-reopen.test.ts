import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { parseBacklog, taskId } from '../src/backlog.js'
import { classifyDedupReopen } from '../src/autopilot/dedup-reopen-classifier.js'
import { applyDedupReopen } from '../src/autopilot/dedup-reopen.js'

describe('手動 goal：blocked 任務單次重開', () => {
  test.each([
    ['done', undefined, { kind: 'reject', reason: 'done' }],
    ['open', undefined, { kind: 'reject', reason: 'already-open' }],
    ['blocked', 'never-reopened', { kind: 'reopen', reason: 'first-blocked' }],
  ] as const)('分類器三路：%s → %j', (existingStatus, reopenHistory, expected) => {
    expect(classifyDedupReopen({ existingStatus, reopenHistory })).toEqual(expected)
  })

  test('2026-07-30 note-filler 實案格式端到端重寫，僅改目標行並追加重開行', () => {
    const prefix = '.tmp-manual-goal-blocked-reopen-'
    const dir = mkdtempSync(join(process.cwd(), prefix))
    try {
      const backlogFile = join(dir, 'BACKLOG.fixture.md')
      const oldText = 'note-filler：補齊 2026-07-30 筆記，只改 notes/ 並保留既有文章'
      const reason = 'review 拒收：notes/2026-07-30.md 未保留；輸出含 "已完成"；Windows 路徑 C:\\notes'
      const reasonLiteral = JSON.stringify(reason)
      const targetLine = `- [ ] ${oldText} [engine:codex-terra] <!-- adng:autopilot goal:nf-20260730 round:3 --> <!-- adng:blocked reason=${reasonLiteral} -->`
      const before = [
        '# note-filler backlog',
        '',
        '<!-- 前置說明與空白必須逐位元組保留 -->',
        '- [x] 已完成的鄰近任務 <!-- adng:done abc1234 -->',
        targetLine,
        '',
        '## 後續',
        '- [ ] 尚未處理的鄰近任務',
        '',
      ].join('\r\n')
      writeFileSync(backlogFile, before)

      const oldTask = parseBacklog(before).find(task => task.text === oldText)!
      const oldId = taskId(oldText)
      const newText = `${oldText}（既有實況：原任務 ${oldId} blocked；修復靶心：adng:blocked reason=${reasonLiteral}）`
      const newId = taskId(newText)
      const result = applyDedupReopen(backlogFile, oldTask, { goalId: 'manual-reopen', round: 4 })
      const expected = before.replace(
        targetLine,
        `${targetLine} <!-- adng:superseded by:${newId} -->`,
      ) + `- [ ] ${newText} [engine:codex-terra] <!-- adng:autopilot goal:manual-reopen round:4 id:${newId} reopen-from:${oldId} -->\r\n`
      const after = readFileSync(backlogFile)

      expect(result).toEqual({
        decision: { kind: 'reopen', reason: 'first-blocked' },
        reopened: { id: newId, text: newText, line: 8 },
      })
      expect(oldTask.id).toBe(oldId)
      expect(newId).not.toBe(oldId)
      expect(newText).toContain(`adng:blocked reason=${reasonLiteral}`)
      expect(after).toEqual(Buffer.from(expected))

      const exhausted = applyDedupReopen(backlogFile, oldTask, { goalId: 'manual-reopen', round: 5 })
      expect(exhausted.decision).toMatchObject({
        kind: 'reject',
        reason: 'superseded',
      })
      expect(readFileSync(backlogFile)).toEqual(after)
    } finally {
      if (dirname(dir) !== process.cwd() || !basename(dir).startsWith(prefix)) {
        throw new Error(`拒絕清理 repo 外路徑：${dir}`)
      }
      rmSync(dir, { recursive: true, force: true, maxRetries: 3 })
    }
  })
})
