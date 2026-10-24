import { expect, test } from 'vitest'
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ModuleKind, ScriptTarget, transpileModule } from 'typescript'

const repoRoot = resolve(import.meta.dirname, '..')
const markers = ['dist/engines/proc.js', 'dist/autopilot/llm.js', 'dist/learn/store.js']

test('runtime build explicitly hides its Windows shell', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-runtime-hide-'))
  try {
    const setup = existsSync(join(repoRoot, 'tests/setup-runtime.ts')) ? 'tests/setup-runtime.ts' : 'tests/setup-windowshide.ts'
    const compiled = join(dir, 'setup.mjs')
    writeFileSync(compiled, transpileModule(readFileSync(join(repoRoot, setup), 'utf8'), {
      compilerOptions: { module: ModuleKind.ESNext, target: ScriptTarget.ES2022 },
    }).outputText)
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
      import assert from 'node:assert/strict';
      import cp from 'node:child_process';
      import fs from 'node:fs';
      import { syncBuiltinESMExports } from 'node:module';
      const calls = [];
      cp.execSync = (_command, options) => { calls.push(options); return Buffer.alloc(0); };
      fs.existsSync = () => false;
      syncBuiltinESMExports();
      const setup = await import(${JSON.stringify(pathToFileURL(compiled).href)});
      await setup.default?.();
      assert.equal(calls.length, 1);
      assert.equal(calls[0].windowsHide, true);
    `], { encoding: 'utf8', windowsHide: true, timeout: 10_000 })
    expect(result.error).toBeUndefined()
    expect(result.status, result.stderr).toBe(0)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test.each(['clean', 'stale', 'partial'] as const)('builds current runtime once before parallel tests in a %s checkout', state => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-runtime-build-'))
  const put = (file: string, value: string): void => {
    mkdirSync(dirname(join(dir, file)), { recursive: true })
    writeFileSync(join(dir, file), value)
  }
  try {
    put('package.json', JSON.stringify({ type: 'module', scripts: { build: 'node build.cjs' } }))
    put('build.cjs', `
      const fs = require('node:fs'), path = require('node:path');
      fs.appendFileSync('builds.txt', 'build\\n');
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
      for (const file of ${JSON.stringify([...markers, 'dist/cli.js'])}) {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, 'current');
      }
    `)
    for (const file of ['tests/setup-windowshide.ts', 'tests/setup-runtime.ts']) {
      if (existsSync(join(repoRoot, file))) {
        mkdirSync(dirname(join(dir, file)), { recursive: true })
        copyFileSync(join(repoRoot, file), join(dir, file))
      }
    }
    if (state !== 'clean') {
      for (const marker of markers) put(marker, 'stale')
      if (state === 'stale') put('dist/cli.js', 'stale')
    }
    for (const name of ['first', 'second']) {
      put(`tests/${name}.test.ts`, `
        import { readFileSync } from 'node:fs';
        test('runtime is ready', () => {
          expect(readFileSync('dist/cli.js', 'utf8')).toBe('current');
        });
      `)
    }
    const result = spawnSync(process.execPath, [
      join(repoRoot, 'node_modules/vitest/vitest.mjs'), 'run',
      '--config', join(repoRoot, 'vitest.config.ts'), '--root', dir,
      '--globals', '--maxWorkers=2', '--reporter=dot',
    ], { cwd: dir, encoding: 'utf8', windowsHide: true, timeout: 30_000 })
    expect(result.error).toBeUndefined()
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0)
    expect(readFileSync(join(dir, 'builds.txt'), 'utf8').trim().split(/\r?\n/)).toEqual(['build'])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}, 40_000)
