import { existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { withPauseGate } from '../src/supervisor/pause-gate.js'

test('pause gate：pause 先取得閘並落檔後，後續 starter 看得到停止令', () => {
  const stopFile = join(mkdtempSync(join(tmpdir(), 'adng-pause-gate-')), '.adng.stop')
  withPauseGate([stopFile], () => writeFileSync(stopFile, 'pause\n'))

  let started = false
  withPauseGate([stopFile], () => { if (!existsSync(stopFile)) started = true })

  expect(started).toBe(false)
  expect(existsSync(`${stopFile}.lockdir`)).toBe(false)
})
