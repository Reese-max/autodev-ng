import { expect, test } from 'vitest'
import { KernelVerifier } from '../src/verifier.js'
import { ConfigSchema } from '../src/types.js'
import type { Job, RunResult } from '../src/types.js'

const NODE = process.execPath
const JOB: Job = { task: { id: 'a1b2c3d4', text: '修 X', line: 0, status: 'open' }, projectPath: process.cwd() }
const RES: RunResult = { ok: true, output: 'done', costUsd: 0, commitHash: 'bbb', baseCommitHash: 'aaa' }

// verifyCommand 綠 + judge 跳過（getDiff 回空 → judge-skipped），把測試焦點鎖在 review 層。
function cfg(over: Record<string, unknown> = {}) {
  return ConfigSchema.parse({
    projectPath: 'p', backlogFile: 'b', dataDir: 'd', engine: 'mock',
    verifyCommand: `"${NODE}" -e "process.exit(0)"`,
    ...over,
  })
}

// review 需要 diff → 給非空 getDiff；但 judge 也會因非空 diff 觸發，故一併注入 judgeFetchFn 讓 judge 回 MATCH。
const DIFF = 'diff --git a/x b/x\n+bad'
const judgeMatch: typeof fetch = async () =>
  new Response(JSON.stringify({ choices: [{ message: { content: 'MATCH' } }] }), { status: 200 }) as unknown as Response

test('reviewEngine 未設 → 完全跳過 review，行為不變（pass）', async () => {
  let called = false
  const v = new KernelVerifier({
    cfg: cfg(), getDiff: () => DIFF, judgeFetchFn: judgeMatch,
    reviewRun: async () => { called = true; return 'REVIEW: REJECT 不該被呼叫' },
  })
  const r = await v.check(JOB, RES)
  expect(r.pass).toBe(true)
  expect(called).toBe(false) // 未設 reviewEngine 不得呼叫 review
})

test('REVIEW: REJECT → pass:false + rollback 到 base', async () => {
  const calls: string[] = []
  const v = new KernelVerifier({
    cfg: cfg({ reviewEngine: 'swe-check' }), getDiff: () => DIFF, judgeFetchFn: judgeMatch,
    rollback: (cwd, to) => { calls.push(`${cwd}=>${to}`); return true },
    reviewRun: async () => 'REVIEW: REJECT 空實作,沒真的修',
  })
  const r = await v.check(JOB, RES)
  expect(r.pass).toBe(false)
  expect(r.reason).toMatch(/review-reject/)
  expect(calls).toEqual(['aaa=>aaa'.replace('aaa=>aaa', `${process.cwd()}=>aaa`)])
})

test('REVIEW: PASS → 通過', async () => {
  const v = new KernelVerifier({
    cfg: cfg({ reviewEngine: 'swe-check' }), getDiff: () => DIFF, judgeFetchFn: judgeMatch,
    reviewRun: async () => 'REVIEW: PASS 看起來沒問題',
  })
  const r = await v.check(JOB, RES)
  expect(r.pass).toBe(true)
})

test('review 輸出無法解析契約 → pass-with-alert（不確定不擋）', async () => {
  const v = new KernelVerifier({
    cfg: cfg({ reviewEngine: 'swe-check' }), getDiff: () => DIFF, judgeFetchFn: judgeMatch,
    reviewRun: async () => '（一堆沒有 REVIEW: 契約字樣的雜訊）',
  })
  const r = await v.check(JOB, RES)
  expect(r.pass).toBe(true)
  expect(r.alerts.some(a => a.includes('review-gate-skipped'))).toBe(true)
})

test('review 拋例外/逾時 → pass-with-alert，絕不擋產出', async () => {
  const v = new KernelVerifier({
    cfg: cfg({ reviewEngine: 'swe-check' }), getDiff: () => DIFF, judgeFetchFn: judgeMatch,
    reviewRun: async () => { throw new Error('模擬逾時') },
  })
  const r = await v.check(JOB, RES)
  expect(r.pass).toBe(true)
  expect(r.alerts.some(a => a.includes('review-gate-skipped'))).toBe(true)
})

test('reviewEngine 設了但沒接 reviewRun → pass-with-alert（生產接線缺失也不擋）', async () => {
  const v = new KernelVerifier({
    cfg: cfg({ reviewEngine: 'swe-check' }), getDiff: () => DIFF, judgeFetchFn: judgeMatch,
  })
  const r = await v.check(JOB, RES)
  expect(r.pass).toBe(true)
  expect(r.alerts.some(a => a.includes('review-gate-skipped'))).toBe(true)
})
