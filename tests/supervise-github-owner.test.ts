import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { expect, test } from 'vitest'

test('GitHub watcher supervisor process contract', async () => {
  const { stdout } = await promisify(execFile)(process.execPath, ['--test', 'tests/regressions/github-80.test.cjs'], {
    windowsHide: true, timeout: 240_000,
  })
  expect(stdout).toMatch(/(?:fail 0|failing 0)/)
}, 250_000)
