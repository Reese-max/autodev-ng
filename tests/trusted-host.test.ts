import { expect, test } from 'vitest'
import { isTrustedHost, markTrustedHost } from '../src/engines/trusted-host.js'
import type { Config } from '../src/types.js'

test('trusted-host context is runtime-only and cannot be set from a JSON config', () => {
  const cfg = { projectPath: '/tmp' } as unknown as Config
  expect(isTrustedHost(cfg)).toBe(false)
  markTrustedHost(cfg)
  expect(isTrustedHost(cfg)).toBe(true)

  const forged = { ...cfg }
  expect(isTrustedHost(forged)).toBe(false)
})
