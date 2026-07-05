import { expect, test } from 'vitest'
import { KernelVerifier } from '../src/verifier.js'
import { ConfigSchema } from '../src/types.js'
import type { Job, RunResult } from '../src/types.js'

const NODE = process.execPath
const JOB: Job = { task: { id: 'a1b2c3d4', text: 't', line: 0, status: 'open' }, projectPath: process.cwd() }
const RES: RunResult = { ok: true, output: 'done', costUsd: 0.1, commitHash: 'bbb', baseCommitHash: 'aaa' }

function cfg(over: Record<string, unknown> = {}) {
  return ConfigSchema.parse({
    projectPath: 'p', backlogFile: 'b', dataDir: 'd', engine: 'mock', ...over
  })
}

test('verify fail → pass:false + rollback 被呼叫到 base', async () => {
  const calls: string[] = []
  const v = new KernelVerifier({
    cfg: cfg({ verifyCommand: `"${NODE}" -e "process.exit(1)"` }),
    rollback: (cwd, to) => { calls.push(`${cwd}=>${to}`); return true }
  })
  const r = await v.check(JOB, RES)
  expect(r.pass).toBe(false)
  expect(r.reason).toContain('verify-fail')
  expect(calls).toEqual([`${process.cwd()}=>aaa`])
})

test('verify pass + judge 未設 → pass:true 且 judge SKIP 進 alerts', async () => {
  const v = new KernelVerifier({ cfg: cfg({ verifyCommand: `"${NODE}" -e "process.exit(0)"` }) })
  const r = await v.check(JOB, RES)
  expect(r.pass).toBe(true)
  expect(r.alerts.some(a => a.includes('judge'))).toBe(true)
})

test('verify skip（無指令）→ pass 並 alert', async () => {
  const v = new KernelVerifier({ cfg: cfg() })
  const r = await v.check(JOB, RES)
  expect(r.pass).toBe(true)
  expect(r.alerts.some(a => a.includes('verify-skip'))).toBe(true)
})

test('rollback 回傳 false → check 結果 alerts 含 rollback-failed', async () => {
  const v = new KernelVerifier({
    cfg: cfg({ verifyCommand: `"${NODE}" -e "process.exit(1)"` }),
    rollback: () => false
  })
  const r = await v.check(JOB, RES)
  expect(r.pass).toBe(false)
  expect(r.alerts.some(a => a.includes('rollback-failed'))).toBe(true)
})

test('rollback 拋例外 → alerts 含 rollback-exception 且 check 不 throw', async () => {
  const v = new KernelVerifier({
    cfg: cfg({ verifyCommand: `"${NODE}" -e "process.exit(1)"` }),
    rollback: () => { throw new Error('boom') }
  })
  const r = await v.check(JOB, RES)
  expect(r.pass).toBe(false)
  expect(r.alerts.some(a => a.includes('rollback-exception'))).toBe(true)
})

test('無 baseCommitHash 且 judgeUrl 有設 → judge 不被呼叫、alerts 含 judge-skipped', async () => {
  const resNoBase: RunResult = { ok: true, output: 'done', costUsd: 0.1, commitHash: 'bbb' }
  const bombFetch = (async () => {
    throw new Error('judge fetchFn should not be called')
  }) as unknown as typeof fetch
  const v = new KernelVerifier({
    cfg: cfg({ verifyCommand: `"${NODE}" -e "process.exit(0)"`, judgeUrl: 'http://fake-judge.invalid' }),
    judgeFetchFn: bombFetch
  })
  const r = await v.check(JOB, resNoBase)
  expect(r.pass).toBe(true)
  expect(r.alerts.some(a => a.includes('judge-skipped'))).toBe(true)
})
