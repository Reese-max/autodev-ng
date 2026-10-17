import { expect, test } from 'vitest'
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

test('npm test builds current runtime artifacts before collecting runtime tests', () => {
  const root = resolve(import.meta.dirname, '..'), project = mkdtempSync(join(tmpdir(), 'adng-test-build-'))
  try {
    const { scripts } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
    writeFileSync(join(project, 'package.json'), JSON.stringify({ type: 'module', scripts }))
    for (const file of ['tsconfig.json', 'tsconfig.build.json']) copyFileSync(join(root, file), join(project, file))
    symlinkSync(join(root, 'node_modules'), join(project, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir')
    mkdirSync(join(project, 'src')); mkdirSync(join(project, 'tests'))
    writeFileSync(join(project, 'src/cli.ts'), 'export const value = 42\n')
    writeFileSync(join(project, 'tests/built.test.ts'), `import { expect, test } from 'vitest'
import { value } from '../dist/cli.js'
test('compiled runtime executes', () => expect(value).toBe(42))
`)
    expect(existsSync(join(project, 'dist/cli.js'))).toBe(false)
    const result = spawnSync('npm test -- --reporter=json --outputFile=results.json', { cwd: project, shell: true, encoding: 'utf8', windowsHide: true, timeout: 60_000 })
    const report = readFileSync(join(project, 'results.json'), 'utf8')
    expect(result.status, report).toBe(0)
    expect(JSON.parse(report)).toMatchObject({
      success: true, numPassedTests: 1, numPendingTests: 0, numFailedTests: 0,
    })
  } finally { rmSync(project, { recursive: true, force: true }) }
}, 90_000)
