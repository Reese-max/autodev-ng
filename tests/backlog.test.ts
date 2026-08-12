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

test('split／重開母任務是 superseded：不算 blocked、不派工也不參與重複判定', () => {
  const text = '已拆解母任務'
  const f = join(mkdtempSync(join(tmpdir(), 'adng-')), 'B.md')
  writeFileSync(f, `- [ ] ${text} <!-- adng:superseded-by-split parts:1 -->\n- [ ] 已重開母任務 <!-- adng:blocked reason="x" --> <!-- adng:superseded by:abcd1234 -->\n- [ ] ${text}\n`)
  const store = new BacklogStore(f)
  expect(store.read().map(task => task.status)).toEqual(['superseded', 'superseded', 'open'])
  expect(store.duplicateIds()).toEqual([])
  expect(store.nextTask()?.line).toBe(2)
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

test('縫 A：重複任務文字 id 碰撞，第一筆 done 後第二筆解凍可派工，兩筆皆 done 後 nextTask 回 null（2026-07-05 語意變更：見 backlog.ts report() 收斂性註解）', () => {
  const dupMd = `# Backlog
- [ ] 修好登入頁 RWD
- [ ] 修好登入頁 RWD
`
  const dupFile = join(mkdtempSync(join(tmpdir(), 'adng-')), 'BACKLOG.md')
  writeFileSync(dupFile, dupMd)
  const s = new BacklogStore(dupFile)

  const first = s.nextTask()!
  expect(first.text).toBe('修好登入頁 RWD')
  expect(first.line).toBe(1) // 第一個重複行

  s.report(first.id, { kind: 'done', commitHash: 'dup1234' })

  // 第一筆已 done，duplicateIds/read 排除 done 後第二筆不再算重複、解凍可派工
  const s2 = new BacklogStore(dupFile)
  const second = s2.nextTask()!
  expect(second.text).toBe('修好登入頁 RWD')
  expect(second.line).toBe(2) // 第二個重複行

  s2.report(second.id, { kind: 'done', commitHash: 'dup5678' })

  // 兩行皆 done，不再有非 done 的重複行可派工
  const s3 = new BacklogStore(dupFile)
  expect(s3.nextTask()).toBeNull()
  const final = readFileSync(dupFile, 'utf8')
  expect(final).toContain('- [x] 修好登入頁 RWD <!-- adng:done dup1234 -->')
  expect(final).toContain('- [x] 修好登入頁 RWD <!-- adng:done dup5678 -->')
})

test('縫 A：第一行 done 後 report 第二筆非 done match 的 id，標的是第二行，第一行 done 標記不被覆寫', () => {
  const dupMd = `# Backlog
- [ ] 修好登入頁 RWD
- [ ] 修好登入頁 RWD
`
  const dupFile = join(mkdtempSync(join(tmpdir(), 'adng-')), 'BACKLOG.md')
  writeFileSync(dupFile, dupMd)
  const s = new BacklogStore(dupFile)

  const first = s.nextTask()!
  s.report(first.id, { kind: 'done', commitHash: 'first111' })
  const afterFirst = readFileSync(dupFile, 'utf8')
  expect(afterFirst).toContain('- [x] 修好登入頁 RWD <!-- adng:done first111 -->')
  expect(afterFirst).toContain('- [ ] 修好登入頁 RWD') // 第二行仍 open

  // 同 id 再次 report（第二行仍非 done）：必須命中第二行，不覆寫第一行的 done 標記
  s.report(first.id, { kind: 'done', commitHash: 'second222' })
  const afterSecond = readFileSync(dupFile, 'utf8')
  expect(afterSecond).toContain('- [x] 修好登入頁 RWD <!-- adng:done first111 -->') // 第一行標記維持原樣
  expect(afterSecond).toContain('- [x] 修好登入頁 RWD <!-- adng:done second222 -->') // 第二行被標上新的 commit
})

test('縫 A：所有相符行皆 done 時 report 已完成/未知 id 仍 throw（鐵律 #1 邊界不鬆動）', () => {
  const dupMd = `# Backlog
- [x] 修好登入頁 RWD <!-- adng:done aaa1111 -->
- [x] 修好登入頁 RWD <!-- adng:done bbb2222 -->
`
  const dupFile = join(mkdtempSync(join(tmpdir(), 'adng-')), 'BACKLOG.md')
  writeFileSync(dupFile, dupMd)
  const s = new BacklogStore(dupFile)

  expect(() => s.report(taskId('修好登入頁 RWD'), { kind: 'done', commitHash: 'ccc3333' })).toThrow(/禁止/)
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

test('duplicateIds 排除 done：同文字 done 舊行 + open 新行不算重複、新行可派工', () => {
  const f = join(mkdtempSync(join(tmpdir(), 'adng-')), 'B.md')
  writeFileSync(f, '- [x] 修登入 <!-- adng:done abc -->\n- [ ] 修登入\n')
  const s = new BacklogStore(f)
  expect(s.duplicateIds()).toEqual([])
  expect(s.nextTask()?.text).toBe('修登入') // 不被永凍
})

test('HIGH #1：N=3 重複行不餓死——第1行 done、第2行 blocked 後仍能派到第3行，第3行 blocked 後才回 null', () => {
  const dupMd = `# Backlog
- [ ] 三重複任務
- [ ] 三重複任務
- [ ] 三重複任務
`
  const dupFile = join(mkdtempSync(join(tmpdir(), 'adng-')), 'BACKLOG.md')
  writeFileSync(dupFile, dupMd)

  const s1 = new BacklogStore(dupFile)
  const first = s1.nextTask()!
  expect(first.line).toBe(1)
  s1.report(first.id, { kind: 'done', commitHash: 'r1111' })

  const s2 = new BacklogStore(dupFile)
  const second = s2.nextTask()!
  expect(second.line).toBe(2)
  s2.report(second.id, { kind: 'blocked', reason: '連敗' })

  // 關鍵斷言：第2行 file-blocked 後，第3行（尚未處理過的 open 行）必須能被派到，不能餓死
  const s3 = new BacklogStore(dupFile)
  const third = s3.nextTask()
  expect(third).not.toBeNull()
  expect(third!.line).toBe(3)

  s3.report(third!.id, { kind: 'blocked', reason: '連敗' })

  // 三行都已 done/blocked，沒有任何 open 行剩下
  const s4 = new BacklogStore(dupFile)
  expect(s4.nextTask()).toBeNull()
})

test('HIGH #1：檔面已 blocked 的行不佔代表名額，nextTask 回真正 open 的那行', () => {
  const dupMd = `# Backlog
- [ ] 撞名任務 <!-- adng:blocked reason="舊的失敗" -->
- [ ] 撞名任務
`
  const dupFile = join(mkdtempSync(join(tmpdir(), 'adng-')), 'BACKLOG.md')
  writeFileSync(dupFile, dupMd)

  const s = new BacklogStore(dupFile)
  const t = s.nextTask()
  expect(t).not.toBeNull()
  expect(t!.line).toBe(2)
  expect(t!.status).toBe('open')
})

// ---------------------------------------------------------------------------
// M5 Task 1：[engine:xxx] 行內 tag 解析（剝離不入 taskId 雜湊）

test('engine tag：行首 [engine:agy] → engineTag=agy、text 剝離 tag、id 與無 tag 同文字一致', () => {
  const t = parseBacklog('- [ ] [engine:agy] 清理 log 檔\n')[0]!
  expect(t.engineTag).toBe('agy')
  expect(t.text).toBe('清理 log 檔')
  expect(t.id).toBe(taskId('清理 log 檔')) // tag 不入雜湊
})

test('engine tag：行尾 [engine:m3] 也解析、blocked 註記共存時仍正確', () => {
  const t = parseBacklog('- [ ] 跑雜務 [engine:m3]\n')[0]!
  expect(t.engineTag).toBe('m3')
  expect(t.text).toBe('跑雜務')
  const b = parseBacklog('- [ ] 跑雜務 [engine:m3] <!-- adng:blocked reason="x" -->\n')[0]!
  expect(b.engineTag).toBe('m3')
  expect(b.status).toBe('blocked')
  expect(b.id).toBe(taskId('跑雜務'))
})

test('雜湊硬回歸線：無 tag 任務 engineTag undefined、id 錨定值不變（M5 改動前實測快照 2026-07-07）', () => {
  const tasks = parseBacklog('- [ ] 任務一\n- [ ] 修 bug\n')
  expect(tasks[0]!.engineTag).toBeUndefined()
  expect(tasks[0]!.rawText).toBeUndefined()
  expect(tasks[0]!.id).toBe('17842c9b') // taskId('任務一') @ HEAD=8fbcae2
  expect(tasks[1]!.id).toBe('625938c7') // taskId('修 bug') @ HEAD=8fbcae2
})

test('雜湊硬回歸線：voice-actress BACKLOG-adng.md 既有 done 行 id 不得漂移', () => {
  const line = '- [x] 修復 dashboard 空資料 500：dashboard 在資料庫無資料（或統計為空）時回 500，應改為回 200 並回傳空狀態（空列表/零統計），不得改動既有非空資料行為；補上空資料情境的回歸測試，並確保 npm run verify 全數通過 <!-- adng:done 21210e24920788705e984d5a3e92a493a0b1ec2c -->\n'
  const t = parseBacklog(line)[0]!
  expect(t.id).toBe('c0166864') // 真實 done 行 id @ HEAD=8fbcae2（漂移＝已完成任務被重新派工燒錢）
  expect(t.status).toBe('done')
})

test('engine tag 寫回：report done/blocked 保留 tag 原文與位置（鐵律 #1 不改寫任務文字），重解析 id 不漂移', () => {
  writeFileSync(file, '- [ ] [engine:m3] 跑雜務\n- [ ] 雜務二 [engine:agy]\n')
  const store = new BacklogStore(file)
  store.report(taskId('跑雜務'), { kind: 'done', commitHash: 'abc123' })
  store.report(taskId('雜務二'), { kind: 'blocked', reason: 'engine-not-allowed' })
  const content = readFileSync(file, 'utf8')
  expect(content).toContain('- [x] [engine:m3] 跑雜務 <!-- adng:done abc123 -->')
  expect(content).toContain('- [ ] 雜務二 [engine:agy] <!-- adng:blocked')
  const again = parseBacklog(content)
  expect(again[0]!).toMatchObject({ id: taskId('跑雜務'), status: 'done', engineTag: 'm3' })
  expect(again[1]!).toMatchObject({ id: taskId('雜務二'), status: 'blocked', engineTag: 'agy' })
})

test('engine tag 不合法位置（文字中間）不解析——只認行首/行尾', () => {
  const t = parseBacklog('- [ ] 修好 [engine:agy] 登入頁\n')[0]!
  expect(t.engineTag).toBeUndefined()
  expect(t.text).toBe('修好 [engine:agy] 登入頁') // 原文照舊、雜湊含全文
})
