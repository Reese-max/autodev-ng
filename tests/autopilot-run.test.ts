import { describe, test, expect } from 'vitest'
import { stopAlertMessage } from '../src/autopilot/run.js'

describe('stopAlertMessage', () => {
  test('achieved → null（不告警）', () => {
    expect(stopAlertMessage('a1b2', { kind: 'achieved', rounds: 3 })).toBeNull()
  })
  test('no-progress → 含 goalId/kind/rounds', () => {
    const m = stopAlertMessage('a1b2', { kind: 'no-progress', rounds: 5 })!
    expect(m).toContain('a1b2')
    expect(m).toContain('no-progress')
    expect(m).toContain('5')
  })
  test('stuck → 含 reason', () => {
    const m = stopAlertMessage('a1b2', { kind: 'stuck', rounds: 2, reason: '缺測試框架' })!
    expect(m).toContain('stuck')
    expect(m).toContain('缺測試框架')
  })
  test('killed → 含 kind', () => {
    expect(stopAlertMessage('a1b2', { kind: 'killed', rounds: 0 })!).toContain('killed')
  })
})
