import { existsSync, mkdirSync, mkdtempSync, readFileSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { expect, test } from 'vitest'

const runner = resolve('scripts/pause-gated-spawn.mjs')

function run(stopFile: string, env: NodeJS.ProcessEnv = process.env) {
  return spawnSync(process.execPath, [runner, stopFile, process.execPath, '-e', 'process.stdout.write("started")'], {
    encoding: 'utf8', timeout: 10_000, env,
  })
}

test('pause-gated-spawn：停止令存在時不建立工作子行程', () => {
  const stopFile = join(mkdtempSync(join(tmpdir(), 'adng-gated-spawn-')), '.adng.stop')
  writeFileSync(stopFile, 'pause\n')

  const result = run(stopFile)

  expect(result.status).toBe(0)
  expect(result.stdout).toBe('')
})

test('pause-gated-spawn：停止令存在時不建立輸出檔', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-gated-log-'))
  const stopFile = join(dir, '.adng.stop')
  const log = join(dir, 'logs', 'patrol.log')
  writeFileSync(stopFile, 'pause\n')

  const result = spawnSync(process.execPath, [runner, stopFile, '--output', log, process.execPath, '-e', 'process.stdout.write("started")'])

  expect(result.status).toBe(0)
  expect(existsSync(log)).toBe(false)
})

test('pause-gated-spawn：輸出檔建立與工作子行程共用同一 gate', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-gated-log-'))
  const stopFile = join(dir, '.adng.stop')
  const log = join(dir, 'logs', 'patrol.log')

  const result = spawnSync(process.execPath, [runner, stopFile, '--output', log, process.execPath, '-e', 'process.stdout.write("started")'])

  expect(result.status).toBe(0)
  expect(readFileSync(log, 'utf8')).toBe('started')
})

test('pause-gated-spawn：無停止令時建立工作子行程', () => {
  const stopFile = join(mkdtempSync(join(tmpdir(), 'adng-gated-spawn-')), '.adng.stop')

  const result = run(stopFile)

  expect(result.status).toBe(0)
  expect(result.stdout).toBe('started')
})

test('pause-gated-spawn：環境旗標不能繞過停止令', () => {
  const stopFile = join(mkdtempSync(join(tmpdir(), 'adng-gated-spawn-')), '.adng.stop')
  writeFileSync(stopFile, 'pause\n')

  const result = run(stopFile, { ...process.env, ADNG_PAUSE_GATE_ACTIVE: '1' })

  expect(result.status).toBe(0)
  expect(result.stdout).toBe('')
})

test('pause-gated-spawn：可回收逾 60 秒殘留 gate', () => {
  const stopFile = join(mkdtempSync(join(tmpdir(), 'adng-gated-spawn-')), '.adng.stop')
  const gate = `${stopFile}.lockdir`
  mkdirSync(gate)
  const old = new Date(Date.now() - 61_000)
  utimesSync(gate, old, old)

  expect(run(stopFile).stdout).toBe('started')
})
