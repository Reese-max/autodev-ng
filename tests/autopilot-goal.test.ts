import { describe, test, expect } from 'vitest'
import { ConfigSchema } from '../src/types.js'
import { parseGoal } from '../src/autopilot/goal.js'

describe('config goalFile', () => {
  test('goalFile 是可選字串，能被 parse', () => {
    const cfg = ConfigSchema.parse({
      projectPath: '/p', backlogFile: '/p/BACKLOG.md', dataDir: '/p/data',
      engine: 'mock', goalFile: '/p/GOAL.md'
    })
    expect(cfg.goalFile).toBe('/p/GOAL.md')
  })
  test('goalFile 省略時為 undefined', () => {
    const cfg = ConfigSchema.parse({
      projectPath: '/p', backlogFile: '/p/BACKLOG.md', dataDir: '/p/data', engine: 'mock'
    })
    expect(cfg.goalFile).toBeUndefined()
  })
})

describe('parseGoal', () => {
  const md = [
    '# GOAL', '把覆蓋率拉到 80%。', '',
    '## 驗收條件（可量測；exit 0 = 達成）', '```sh', 'npm run verify', '```', '',
    '## 邊界', '- 引擎：devin', '- 連續無進展上限：2'
  ].join('\n')

  test('抽出 objective / verifyCommand / engine / noProgressLimit', () => {
    const g = parseGoal(md)
    expect(g.objective).toContain('覆蓋率')
    expect(g.verifyCommand).toBe('npm run verify')
    expect(g.engine).toBe('devin')
    expect(g.noProgressLimit).toBe(2)
  })
  test('noProgressLimit 未寫時預設 3', () => {
    expect(parseGoal('# GOAL\n只有目標。').noProgressLimit).toBe(3)
  })
  test('無驗收 code block 時 verifyCommand 為 undefined', () => {
    expect(parseGoal('# GOAL\n只有目標。').verifyCommand).toBeUndefined()
  })
})
