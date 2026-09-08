import { describe, test, expect, vi } from 'vitest'
import fs from 'node:fs'
import { spawn } from 'node:child_process'
import { syncBuiltinESMExports } from 'node:module'
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { LessonStore, parseLessons, MAX_LESSONS } from '../src/learn/store.js'

function dir(): string { return mkdtempSync(join(tmpdir(), 'adng-learn-')) }

describe('parseLessons', () => {
  test('解析 L 編號/日期/文字,忽略標題與雜行', () => {
    const md = '# Learnings\n- L001 [2026-07-10] 教訓甲\n雜行\n- L003 [2026-07-11] 教訓乙\n'
    expect(parseLessons(md)).toEqual([
      { num: 1, date: '2026-07-10', text: '教訓甲' },
      { num: 3, date: '2026-07-11', text: '教訓乙' }
    ])
  })
})

describe('LessonStore.add', () => {
  test('跨程序新增不覆蓋其他寫入者，讀取失敗保留原始檔案', async () => {
    const file = join(dir(), 'shared.md'), moduleUrl = new URL('../dist/learn/store.js', import.meta.url).href
    const script = `import { LessonStore } from ${JSON.stringify(moduleUrl)}; const s=new LessonStore(process.argv[1]); for(let i=0;i<12;i++) if(!s.add(process.argv[2]+' item '+i+' end')) process.exit(1)`
    await Promise.all(['writer-a', 'writer-b'].map(id => new Promise<void>((done, fail) => {
      const child = spawn(process.execPath, ['--input-type=module', '-e', script, file, id], { windowsHide: true, stdio: 'ignore' })
      child.once('error', fail); child.once('exit', code => code === 0 ? done() : fail(new Error(`lesson writer exited ${code}`)))
    })))
    const original = readFileSync(file, 'utf8')
    expect(parseLessons(original)).toHaveLength(24)
    const read = fs.readFileSync
    const spy = vi.spyOn(fs, 'readFileSync').mockImplementation(((path: fs.PathOrFileDescriptor, ...args: unknown[]) => {
      if (path === file) throw Object.assign(new Error('fixture access denied'), { code: 'EACCES' })
      return (read as Function)(path, ...args)
    }) as typeof fs.readFileSync)
    syncBuiltinESMExports()
    try { expect(new LessonStore(file).add('must not overwrite')).toBe(false) } finally { spy.mockRestore(); syncBuiltinESMExports() }
    expect(readFileSync(file, 'utf8')).toBe(original)
  })
  test('新檔寫入 L001,含標題', () => {
    const f = join(dir(), 'learnings.md')
    const s = new LessonStore(f)
    expect(s.add('port 3210 才是對的', new Date('2026-07-10T12:00:00Z'))).toBe(true)
    const raw = readFileSync(f, 'utf8')
    expect(raw).toContain('# Learnings')
    expect(raw).toContain('- L001 [2026-07-10] port 3210 才是對的')
  })
  test('編號遞增取 max+1', () => {
    const f = join(dir(), 'learnings.md')
    writeFileSync(f, '# Learnings\n- L007 [2026-07-01] 舊教訓\n')
    const s = new LessonStore(f)
    s.add('新教訓', new Date('2026-07-10T12:00:00Z'))
    expect(readFileSync(f, 'utf8')).toContain('- L008 [2026-07-10] 新教訓')
  })
  test('去重:正規化互為包含則跳過', () => {
    const f = join(dir(), 'learnings.md')
    const s = new LessonStore(f)
    s.add('smoke 必須在 port 3210 跑')
    expect(s.add('smoke 必須在 port 3210 跑 ')).toBe(false)
    expect(s.add('port 3210')).toBe(false) // 被既有條目包含
  })
  test('滿 30 條 FIFO 淘汰最舊', () => {
    const f = join(dir(), 'learnings.md')
    const s = new LessonStore(f)
    for (let i = 1; i <= MAX_LESSONS; i++) s.add(`教訓${i}號內容`)
    expect(s.add('第31條')).toBe(true)
    const raw = readFileSync(f, 'utf8')
    expect(raw).not.toContain('教訓1號內容')
    expect(raw).toContain('第31條')
    expect(parseLessons(raw)).toHaveLength(MAX_LESSONS)
  })
  test('超長截斷至 200 code point、空字串回 false', () => {
    const f = join(dir(), 'learnings.md')
    const s = new LessonStore(f)
    expect(s.add('')).toBe(false)
    s.add('長'.repeat(300))
    const parsed = parseLessons(readFileSync(f, 'utf8'))
    expect([...parsed[0]!.text]).toHaveLength(200)
  })
})

describe('LessonStore.inject', () => {
  test('兩層皆空回空字串', () => {
    expect(new LessonStore(join(dir(), 'none.md')).inject()).toBe('')
  })
  test('合併全局(前綴[全局])與專案層', () => {
    const d = dir()
    const g = join(d, 'global.md'); const p = join(d, 'learnings.md')
    writeFileSync(g, '- L001 [2026-01-01] 全局教訓\n')
    const s = new LessonStore(p, g)
    s.add('專案教訓', new Date('2026-07-10T12:00:00Z'))
    const out = s.inject()
    expect(out).toContain('## 過往教訓')
    expect(out).toContain('- [全局] 全局教訓')
    expect(out).toContain('- L001 [2026-07-10] 專案教訓')
    expect(out.startsWith('## ')).toBe(true)
  })
  test('全局檔缺失不炸,只出專案層', () => {
    const d = dir()
    const s = new LessonStore(join(d, 'p.md'), join(d, 'missing-global.md'))
    s.add('專案教訓')
    expect(s.inject()).toContain('專案教訓')
  })
})
