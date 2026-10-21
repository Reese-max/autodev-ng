import { afterEach, expect, test } from 'vitest'
import { basename, dirname, isAbsolute, join, resolve } from 'node:path'
import { lstatSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { HerdrEngine } from '../src/engines/herdr.js'
import { PreflightCache } from '../src/preflight.js'
import type { runProcess } from '../src/engines/proc.js'

// A synthetic fourteen-character bait, never a real credential or provider call.
const BAIT = 'BAIT_QA_26_ONLY'
const roots: string[] = []
afterEach(() => {
  for (const root of roots.splice(0)) {
    expect(isAbsolute(root)).toBe(true)
    expect(dirname(resolve(root))).toBe(resolve(tmpdir()))
    expect(basename(root).startsWith('adng-herdr-preflight-private-')).toBe(true)
    expect(lstatSync(root).isSymbolicLink()).toBe(false)
    rmSync(root, { recursive: true, force: true })
  }
})

const cases = [
  { name: 'compatible short-string protocol is not reflected', protocol: BAIT, compatible: true, display: '?' },
  { name: 'refused short-string protocol is not reflected', protocol: BAIT, compatible: false, display: '?' },
  { name: 'compatible array protocol is not reflected', protocol: [BAIT], compatible: true, display: '?' },
  { name: 'refused array protocol is not reflected', protocol: [BAIT], compatible: false, display: '?' },
  { name: 'compatible finite numeric protocol retains its original display', protocol: 20, compatible: true, display: '20' },
  { name: 'refused finite numeric protocol retains its original display', protocol: 20, compatible: false, display: '20' },
  { name: 'omitted protocol retains the original unknown display', protocol: undefined, compatible: true, display: '?' },
] as const

test.each(cases)('$name through the actual preflight and its normal cache', async item => {
  const root = mkdtempSync(join(tmpdir(), 'adng-herdr-preflight-private-')); roots.push(root)
  const launcher = join(root, 'owned-inert-launcher.ps1')
  writeFileSync(launcher, '# Inert fixture, never executed')
  const calls: Parameters<typeof runProcess>[0][] = []
  const runner: typeof runProcess = async opts => {
    calls.push(opts)
    return { exitCode: 0, stdout: JSON.stringify({ running: true, compatible: item.compatible, protocol: item.protocol }), stderr: '', timedOut: false, durationMs: 1 }
  }
  const engine = new HerdrEngine({ command: launcher, cache: new PreflightCache(join(root, 'preflight.json')), runProcess: runner })
  for (const result of [await engine.preflight(), await engine.preflight()]) {
    expect(result.ok).toBe(item.compatible)
    expect(result.admission).toMatchObject({ quota: { state: 'unknown' }, model: { state: 'unknown' } })
    expect(result.detail).toContain(`protocol=${item.display}`)
    expect(result.detail).not.toContain(BAIT)
    expect(result.detail).not.toContain('BAIT_QA_26')
    expect(result.detail).toContain(item.compatible ? 'Herdr compatible' : 'Herdr 未就緒或不相容')
  }
  expect(calls).toHaveLength(1)
  expect(calls[0]?.command).toBe('herdr.exe')
  expect(calls[0]?.args).toEqual(['--session', 'herdr-autopilot', 'status', 'server', '--json'])
  expect(calls[0]?.timeoutMs).toBe(15_000)
})
