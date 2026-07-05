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
