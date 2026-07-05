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

test('CRLF 來源檔 report 後仍為 CRLF，且僅目標行語意變更', () => {
  const crlfMd = MD.split('\n').join('\r\n')
  const crlfFile = join(mkdtempSync(join(tmpdir(), 'adng-')), 'BACKLOG.md')
  writeFileSync(crlfFile, crlfMd)
  const s = new BacklogStore(crlfFile)
  const t = s.nextTask()!
  s.report(t.id, { kind: 'done', commitHash: 'abc1234' })

  const out = readFileSync(crlfFile, 'utf8')
  expect(out).toContain('\r\n')
  expect(out).not.toMatch(/[^\r]\n/) // 全檔沒有裸 LF（每個 \n 前都有 \r）

  const outLines = out.split('\r\n')
  const origLines = crlfMd.split('\r\n')
  expect(outLines.length).toBe(origLines.length)
  outLines.forEach((line, i) => {
    if (i === t.line) {
      expect(line).toBe('- [x] 修好登入頁 RWD <!-- adng:done abc1234 -->')
    } else {
      expect(line).toBe(origLines[i])
    }
  })
})

test('reason 含 >：report blocked 後 re-read，text 乾淨、id 與 report 前一致', () => {
  const s = new BacklogStore(file)
  const t = s.nextTask()!
  const idBefore = t.id

  s.report(t.id, { kind: 'blocked', reason: 'x > y failed' })

  const again = new BacklogStore(file).read()
  const found = again.find(x => x.line === t.line)!
  expect(found.text).toBe('修好登入頁 RWD')
  expect(found.id).toBe(idBefore)
  expect(found.status).toBe('blocked')
})

test('縫 A：重複任務文字 id 碰撞，nextTask 只給第一筆，第一筆 done 後不再重派第二筆', () => {
  const dupMd = `# Backlog
- [ ] 修好登入頁 RWD
- [ ] 修好登入頁 RWD
- [ ] 第三個開放任務
`
  const dupFile = join(mkdtempSync(join(tmpdir(), 'adng-')), 'BACKLOG.md')
  writeFileSync(dupFile, dupMd)
  const s = new BacklogStore(dupFile)

  const first = s.nextTask()!
  expect(first.text).toBe('修好登入頁 RWD')
  expect(first.line).toBe(1) // 第一個重複行

  s.report(first.id, { kind: 'done', commitHash: 'dup1234' })

  // 第一筆已 done，第二筆重複 id 在記憶體中視為 blocked，不會被重新派工
  const s2 = new BacklogStore(dupFile)
  expect(s2.nextTask()!.text).toBe('第三個開放任務')
})

test('縫 A：重複行不影響其他正常任務的解析', () => {
  const dupMd = `# Backlog
- [ ] 修好登入頁 RWD
- [ ] 修好登入頁 RWD
- [x] 已完成項
- [ ] 第三個開放任務 <!-- adng:blocked reason="x" -->
`
  const dupFile = join(mkdtempSync(join(tmpdir(), 'adng-')), 'BACKLOG.md')
  writeFileSync(dupFile, dupMd)
  const tasks = new BacklogStore(dupFile).read()

  expect(tasks).toHaveLength(4)
  expect(tasks[0]!.status).toBe('open')
  expect(tasks[1]!.status).toBe('blocked') // 重複第二筆被強制視為 blocked
  expect(tasks[2]!.status).toBe('done')
  expect(tasks[2]!.text).toBe('已完成項')
  expect(tasks[3]!.status).toBe('blocked')
  expect(tasks[3]!.text).toBe('第三個開放任務')
})

test('duplicateIds 列出重複 id，無重複時為空', () => {
  const dup = join(mkdtempSync(join(tmpdir(), 'adng-')), 'B.md')
  writeFileSync(dup, '- [ ] 同一件事\n- [ ] 別件事\n- [ ] 同一件事\n')
  expect(new BacklogStore(dup).duplicateIds()).toEqual([taskId('同一件事')])
  const clean = join(mkdtempSync(join(tmpdir(), 'adng-')), 'C.md')
  writeFileSync(clean, '- [ ] 唯一\n')
  expect(new BacklogStore(clean).duplicateIds()).toEqual([])
})
