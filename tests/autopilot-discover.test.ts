import { describe, test, expect } from 'vitest'
import { parseCandidates, parseRanked } from '../src/autopilot/discover.js'

describe('parseCandidates', () => {
  test('多行候選（全形｜分隔）', () => {
    const r = parseCandidates('tests', 'lib/api.py 無 call_args 斷言｜只驗呼叫不驗參數\nlib/io.py 缺錯誤路徑測試｜read_jsonl 檔案不存在分支未測')
    expect(r).toEqual([
      { lens: 'tests', title: 'lib/api.py 無 call_args 斷言', detail: '只驗呼叫不驗參數' },
      { lens: 'tests', title: 'lib/io.py 缺錯誤路徑測試', detail: 'read_jsonl 檔案不存在分支未測' }
    ])
  })
  test('半形 | 分隔也可', () => {
    expect(parseCandidates('perf', 'X 全掃無快取|每次 O(n)')[0]).toEqual({ lens: 'perf', title: 'X 全掃無快取', detail: '每次 O(n)' })
  })
  test('NONE → 空陣列', () => { expect(parseCandidates('security', 'NONE')).toEqual([]) })
  test('無分隔符行 → 整行為 title', () => { expect(parseCandidates('design', '模組職責糾纏')).toEqual([{ lens: 'design', title: '模組職責糾纏', detail: '' }]) })
})

describe('parseRanked', () => {
  test('正常排序行', () => {
    const r = parseRanked('VALUE:9 | api.py 斷言弱 | tests | 高頻對外呼叫沒驗參數\nVALUE:4 | 命名不一致 | design | 影響小')
    expect(r).toEqual([
      { value: 9, title: 'api.py 斷言弱', lens: 'tests', rationale: '高頻對外呼叫沒驗參數' },
      { value: 4, title: '命名不一致', lens: 'design', rationale: '影響小' }
    ])
  })
  test('value 超界夾 0~10', () => { expect(parseRanked('VALUE:15 | X | perf | y')[0]!.value).toBe(10) })
  test('不符格式行跳過、全空 → 空陣列', () => {
    expect(parseRanked('我覺得都還好\n沒有明確問題')).toEqual([])
  })
})
