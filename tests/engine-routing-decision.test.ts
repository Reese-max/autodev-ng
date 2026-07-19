import { describe, test } from 'vitest'

// 待路由決策函式落地後，僅餵入已取得的輪替、戰績與隔離狀態；不建 DB、不讀檔、不碰 scheduler。
describe('引擎路由決策契約（待實作）', () => {
  test.todo('無 engineRotation 時維持既有 defaultEngine 路徑')
  test.todo('無 run.db 時沿用既有候選順序')
  test.todo('樣本數未達門檻時沿用既有候選順序')
  test.todo('成功率恰在門檻時可晉升，低於門檻時不可晉升')
  test.todo('有健康候選時，仍在隔離期的候選不應被派工')
})
