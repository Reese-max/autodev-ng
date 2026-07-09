import { describe, test, expect } from 'vitest'
import { ConfigSchema } from '../src/types.js'

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
