import { expect, test } from 'vitest'
import { RUNTIME_BUILT } from './helpers/runtime-build.js'

test('runtime is prepared before build-dependent acceptance tests are collected', () => {
  expect(RUNTIME_BUILT, 'npm test must prepare dist instead of skipping acceptance tests').toBe(true)
})
