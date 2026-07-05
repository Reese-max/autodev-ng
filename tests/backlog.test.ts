import { expect, test, beforeEach } from 'vitest'
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { BacklogStore, parseBacklog, taskId } from '../src/backlog.js'

const MD = `# Backlog
- [ ] 修好登入頁 RWD
- [x] 舊的已完成項
- [ ] 加申論題匯出 PDF <!-- adng:blocked reason="tests fail" -->
一般文字行不受影響
- [ ] 第三個開放任務
`
let file: string
beforeEach(() => {
  file = join(mkdtempSync(join(tmpdir(), 'adng-')), 'BACKLOG.md')
  writeFileSync(file, MD)
})

test('parse：狀態判定正確', () => {
  const t = parseBacklog(MD)
  expect(t).toHaveLength(4)
  expect(t[0]!.status).toBe('open')
  expect(t[1]!.status).toBe('done')
  expect(t[2]!.status).toBe('blocked')
  expect(t[2]!.text).toBe('加申論題匯出 PDF') // 註解已剝除
})

test('nextTask 跳過 done/blocked，取第一個 open', () => {
  const s = new BacklogStore(file)
  expect(s.nextTask()!.text).toBe('修好登入頁 RWD')
})

test('report done：勾選並附 commit hash，總行數不變', () => {
  const s = new BacklogStore(file)
  const t = s.nextTask()!
  s.report(t.id, { kind: 'done', commitHash: 'abc1234' })
  const out = readFileSync(file, 'utf8')
  expect(out).toContain('- [x] 修好登入頁 RWD <!-- adng:done abc1234 -->')
  expect(out.split('\n').length).toBe(MD.split('\n').length)
})

test('report blocked：標註原因，不勾選', () => {
  const s = new BacklogStore(file)
  const t = s.nextTask()!
  s.report(t.id, { kind: 'blocked', reason: 'verify 連敗' })
  const again = new BacklogStore(file).read()
  expect(again.find(x => x.id === t.id)!.status).toBe('blocked')
})

test('鐵律#1：未知 id 必 throw，檔案不被改動', () => {
  const s = new BacklogStore(file)
  const before = readFileSync(file, 'utf8')
  expect(() => s.report(taskId('系統幻想出來的任務'), { kind: 'done', commitHash: 'x' })).toThrow(/禁止/)
  expect(readFileSync(file, 'utf8')).toBe(before)
})
