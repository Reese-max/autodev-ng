import { describe, test, expect, beforeEach } from 'vitest'
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { BacklogStore } from '../src/backlog.js'

let file: string
beforeEach(() => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-append-'))
  file = join(dir, 'BACKLOG.md')
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
