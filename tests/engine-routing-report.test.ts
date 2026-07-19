import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'

const report = readFileSync(join(process.cwd(), 'docs', 'engine-routing-insertion-points.md'), 'utf8')

describe('engine routing insertion point report', () => {
  test('盤點 pickReadyTask、事件派發與狀態讀寫入口', () => {
    expect(report).toContain('src/scheduler.ts::pickReadyTask()')
    expect(report).toContain('src/events.ts::EventLog.append()/appendOnce()/heartbeat()')
    expect(report).toContain('src/db.ts::RunDb.failCount()')
    expect(report).toContain('src/backlog.ts::BacklogStore.report()')
  })

  test('標明戰績感知路由的最小改動點與 fallback 守門條件', () => {
    expect(report).toContain('candidateEngines()')
    expect(report).toContain('無戰績資料、未設定新路由狀態、或新模組判定資料不可用時')
    expect(report).toContain('直接回到既有 `candidateEngines()` 結果')
  })

  test('輸出檔案級變更清單且避開受限目錄', () => {
    expect(report).toContain('src/engines/rotation.ts')
    expect(report).toContain('src/scheduler.ts')
    expect(report).toContain('tests/engine-rotation.test.ts')
    expect(report).not.toContain('configs/')
    expect(report).not.toContain('scripts/')
    expect(report).not.toContain('data/')
  })
})
