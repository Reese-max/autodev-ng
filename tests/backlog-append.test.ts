import { describe, test, it, expect, beforeEach } from 'vitest'
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, utimesSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { BacklogStore, withBacklogLock } from '../src/backlog.js'

let file: string
let tmpDir: string
beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'adng-append-'))
  file = join(tmpDir, 'BACKLOG.md')
  writeFileSync(file, '- [ ] 使用者手排任務\n')
})

describe('BacklogStore.append (鐵律 #1 受控例外)', () => {
  test('append 後 read() 看到新任務且標 source:autopilot', () => {
    const store = new BacklogStore(file)
    store.append('自主子任務甲', { goalId: 'a1b2', round: 3 })
    const tasks = store.read()
    expect(tasks).toHaveLength(2)
    const auto = tasks.find(t => t.text === '自主子任務甲')!
    expect(auto.source).toBe('autopilot')
    expect(auto.status).toBe('open')
  })

  test('手排任務標 source:user，與自主可區分', () => {
    const store = new BacklogStore(file)
    store.append('自主子任務甲', { goalId: 'a1b2', round: 3 })
    const tasks = store.read()
    expect(tasks.find(t => t.text === '使用者手排任務')!.source).toBe('user')
  })

  test('append 寫入的行帶 autopilot annotation（goal + round 可稽核）', () => {
    const store = new BacklogStore(file)
    store.append('自主子任務甲', { goalId: 'a1b2', round: 3 })
    const md = readFileSync(file, 'utf8')
    expect(md).toContain('- [ ] 自主子任務甲 <!-- adng:autopilot goal:a1b2 round:3 -->')
  })

  test('鐵律 #1 回歸：report() 對未知 id 仍拒絕（append 不是唯一破口）', () => {
    const store = new BacklogStore(file)
    expect(() => store.report('deadbeef', { kind: 'done', commitHash: 'x' })).toThrow(/鐵律 #1/)
  })

  test('round-trip：autopilot 任務 report(done) 後重讀仍 source:autopilot，goal/round 溯源保留', () => {
    const store = new BacklogStore(file)
    store.append('自主子任務甲', { goalId: 'a1b2', round: 3 })
    const appended = store.read().find(t => t.text === '自主子任務甲')!

    store.report(appended.id, { kind: 'done', commitHash: 'deadbeef' })

    const reread = new BacklogStore(file).read()
    const found = reread.find(t => t.text === '自主子任務甲')!
    expect(found.status).toBe('done')
    expect(found.source).toBe('autopilot')

    const md = readFileSync(file, 'utf8')
    const line = md.split('\n').find(l => l.includes('自主子任務甲'))!
    expect(line).toContain('adng:autopilot goal:')
    expect(line).toContain('adng:done deadbeef')
  })

  test('round-trip：autopilot 任務 report(blocked) 後重讀仍 source:autopilot，goal/round 溯源保留', () => {
    const store = new BacklogStore(file)
    store.append('自主子任務乙', { goalId: 'c3d4', round: 7 })
    const appended = store.read().find(t => t.text === '自主子任務乙')!

    store.report(appended.id, { kind: 'blocked', reason: 'verify 連敗' })

    const reread = new BacklogStore(file).read()
    const found = reread.find(t => t.text === '自主子任務乙')!
    expect(found.status).toBe('blocked')
    expect(found.source).toBe('autopilot')

    const md = readFileSync(file, 'utf8')
    const line = md.split('\n').find(l => l.includes('自主子任務乙'))!
    expect(line).toContain('adng:autopilot goal:')
    expect(line).toContain('adng:blocked reason=')
  })

  test('round-trip：純使用者任務 report(done) 後重讀仍 source:user（無回歸）', () => {
    const store = new BacklogStore(file)
    const userTask = store.read().find(t => t.text === '使用者手排任務')!

    store.report(userTask.id, { kind: 'done', commitHash: 'cafef00d' })

    const reread = new BacklogStore(file).read()
    const found = reread.find(t => t.text === '使用者手排任務')!
    expect(found.status).toBe('done')
    expect(found.source).toBe('user')

    const md = readFileSync(file, 'utf8')
    const line = md.split('\n').find(l => l.includes('使用者手排任務'))!
    expect(line).not.toContain('adng:autopilot')
  })
})

describe('withBacklogLock', () => {
  // 設計關係（M9.4 fast-follow #1）：waitMs 預設 15_000 必須 > stale 門檻 10_000。
  // 若 waitMs < stale 門檻，死鎖持有者的殘留鎖在前 10s 窗內，等待者會先觸發
  // deadline 逾時拋錯，而不是等到 stale 檢查生效去強拆——daemon done-path report()
  // 若剛好在此窗內被呼叫，會誤判失敗、可能重派已完成任務。15s > 10s 保證等待者
  // 一定會撐過 stale 門檻，讓強拆路徑而非逾時路徑接手（15s 真等違反禁 sleep，
  // 這裡不新增計時測試，只記載此設計關係；下方三案例分別以 waitMs=50 或
  // 預建 stale mtime 繞開真等待，驗證行為不受此次改值影響）。
  it('鎖被他人持有(fresh mtime，非 stale)時等待至逾時拋錯，fn 不執行、不動別人的鎖', () => {
    // 單執行緒 sync 阻塞下 timer 不會 fire，「等待後成功」場景無法單進程測——
    // 預建 fresh lockdir 模擬活鎖持有者，waitMs=50 真正驗 wait+deadline 路徑（毫秒級，不違反禁 sleep）。
    const lockDir = `${file}.lockdir`
    mkdirSync(lockDir, { recursive: true })
    let ran = false
    expect(() => withBacklogLock(file, () => { ran = true }, 50)).toThrow('鎖等待逾時')
    expect(ran).toBe(false)
    expect(existsSync(lockDir)).toBe(true) // 逾時方不得拆活鎖
  })
  it('殘留鎖(舊 mtime)會被強拆而非死等', () => {
    const lockDir = `${file}.lockdir`
    mkdirSync(lockDir, { recursive: true })
    const old = Date.now() / 1000 - 60
    utimesSync(lockDir, old, old)          // 佯裝 60s 前的殘留
    let ran = false
    withBacklogLock(file, () => { ran = true })
    expect(ran).toBe(true)
    expect(existsSync(lockDir)).toBe(false)
  })
  it('fn 拋出時鎖必釋放', () => {
    expect(() => withBacklogLock(file, () => { throw new Error('boom') })).toThrow('boom')
    expect(existsSync(`${file}.lockdir`)).toBe(false)
  })
})
