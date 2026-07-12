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
  test('M9.6：auditModel 可選、supplementLimit 預設 2（向後相容）', () => {
    const bare = ConfigSchema.parse({ projectPath: '/p', backlogFile: '/p/B.md', dataDir: '/p/d', engine: 'mock' })
    expect(bare.auditModel).toBeUndefined() // 未設＝不啟動 supplement 階段
    expect(bare.supplementLimit).toBe(2)
    const set = ConfigSchema.parse({ projectPath: '/p', backlogFile: '/p/B.md', dataDir: '/p/d', engine: 'mock', auditModel: 'gpt-5.5', supplementLimit: 3 })
    expect(set.auditModel).toBe('gpt-5.5'); expect(set.supplementLimit).toBe(3)
  })
  test('M9.7：surveyCommand 可選、surveyTimeoutMs/discoverLenses 有預設（向後相容）', () => {
    const bare = ConfigSchema.parse({ projectPath: '/p', backlogFile: '/p/B.md', dataDir: '/p/d', engine: 'mock' })
    expect(bare.surveyCommand).toBeUndefined()
    expect(bare.surveyTimeoutMs).toBe(120000)
    expect(bare.discoverLenses).toEqual(['correctness', 'tests', 'perf', 'design', 'security'])
    const set = ConfigSchema.parse({ projectPath: '/p', backlogFile: '/p/B.md', dataDir: '/p/d', engine: 'mock', surveyCommand: 'ruff check .', discoverLenses: ['tests'] })
    expect(set.surveyCommand).toBe('ruff check .'); expect(set.discoverLenses).toEqual(['tests'])
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

  test('json fence 在 sh fence 之前時，優先取 sh fence 的內容', () => {
    const mdWithJsonFirst = [
      '# GOAL', '把覆蓋率拉到 80%。', '',
      '## 範例', '```json', '{"foo": "bar"}', '```', '',
      '## 驗收條件（可量測；exit 0 = 達成）', '```sh', 'npm run verify', '```', '',
      '## 邊界', '- 引擎：devin', '- 連續無進展上限：2'
    ].join('\n')
    expect(parseGoal(mdWithJsonFirst).verifyCommand).toBe('npm run verify')
  })

  test('抽出 evidenceFiles（## 佐證檔案 段落，含/不含 - 前綴、空行忽略）', () => {
    const mdWithEvidence = [
      '# GOAL', '補強 api.py 測試斷言。', '',
      '## 佐證檔案', 'tests/test_lib_api.py', '- lib/api.py', '', '',
      '## 邊界', '- 連續無進展上限：2'
    ].join('\n')
    const g = parseGoal(mdWithEvidence)
    expect(g.evidenceFiles).toEqual(['tests/test_lib_api.py', 'lib/api.py'])
  })
  test('無 佐證檔案 段落時 evidenceFiles 為 undefined（向後相容）', () => {
    expect(parseGoal('# GOAL\n只有目標。').evidenceFiles).toBeUndefined()
  })
})
