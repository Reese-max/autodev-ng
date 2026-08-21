import { expect, test } from 'vitest'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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

test('low risk：verify pass + judge 未設 → pass:true 且 judge SKIP 進 alerts', async () => {
  const v = new KernelVerifier({ cfg: cfg({ defaultRisk: 'low', verifyCommand: `"${NODE}" -e "process.exit(0)"` }) })
  const r = await v.check(JOB, RES)
  expect(r.pass).toBe(true)
  expect(r.alerts.some(a => a.includes('judge'))).toBe(true)
})

test('low risk：verify skip（無指令）→ pass 並 alert', async () => {
  const v = new KernelVerifier({ cfg: cfg({ defaultRisk: 'low' }) })
  const r = await v.check(JOB, RES)
  expect(r.pass).toBe(true)
  expect(r.alerts.some(a => a.includes('verify-skip'))).toBe(true)
})

test('medium risk：verify skip（無指令）→ BLOCKED', async () => {
  const v = new KernelVerifier({ cfg: cfg() })
  const r = await v.check(JOB, RES)
  expect(r).toMatchObject({ pass: false, risk: 'medium', blockedReason: 'verification-infra' })
  expect(r.reason).toContain('requires verifyCommand')
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

test('low risk：無 baseCommitHash 且 judgeUrl 有設 → judge 不被呼叫、alerts 含 judge-skipped', async () => {
  const resNoBase: RunResult = { ok: true, output: 'done', costUsd: 0.1, commitHash: 'bbb' }
  const bombFetch = (async () => {
    throw new Error('judge fetchFn should not be called')
  }) as unknown as typeof fetch
  const v = new KernelVerifier({
    cfg: cfg({ defaultRisk: 'low', verifyCommand: `"${NODE}" -e "process.exit(0)"`, judgeUrl: 'http://fake-judge.invalid' }),
    judgeFetchFn: bombFetch
  })
  const r = await v.check(JOB, resNoBase)
  expect(r.pass).toBe(true)
  expect(r.alerts.some(a => a.includes('judge-skipped'))).toBe(true)
})

test('medium risk：無 baseCommitHash → BLOCKED reviewer evidence', async () => {
  const v = new KernelVerifier({ cfg: cfg({ verifyCommand: `"${NODE}" -e "process.exit(0)"` }) })
  const r = await v.check(JOB, { ...RES, baseCommitHash: undefined })
  expect(r).toMatchObject({ pass: false, risk: 'medium', blockedReason: 'review-unavailable' })
})

test('CI 執行期間出現 stop sentinel → paused，且不啟動 judge／Reviewer', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-vf-pause-')), stopFile = join(dir, '.adng.stop')
  let reviewed = false
  const script = `require('node:fs').writeFileSync(${JSON.stringify(stopFile)},'pause')`
  const payload = Buffer.from(script).toString('base64')
  const v = new KernelVerifier({
    cfg: cfg({ stopFile, verifyCommand: `"${NODE}" -e "eval(Buffer.from('${payload}','base64').toString())"`, reviewEngine: 'reviewer' }),
    getDiff: () => 'diff --git a/a b/a\n+x', getNameStatus: () => 'M\ta',
    judgeFetchFn: async () => { throw new Error('judge must not run') },
    reviewRun: async () => { reviewed = true; return 'REVIEW: PASS' },
  })
  const r = await v.check(JOB, RES)
  expect(r).toMatchObject({ pass: false, paused: true, reason: 'paused after CI' })
  expect(reviewed).toBe(false)
})

test('defaultRollback 在無 .adng-worktree marker 的目錄拒絕執行且 alerts 可見', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-vf-'))  // 無 marker、也非 git repo
  const v = new KernelVerifier({ cfg: cfg({ verifyCommand: `"${NODE}" -e "process.exit(1)"` }) })
  const job = { task: { id: 'x1x1x1x1', text: 't', line: 0, status: 'open' as const }, projectPath: dir }
  const r = await v.check(job, { ok: true, output: 'o', costUsd: 0, commitHash: 'b', baseCommitHash: 'a' })
  expect(r.pass).toBe(false) // verify fail 照舊
  expect(r.alerts.some(a => /rollback-(refused|failed|exception)/.test(a))).toBe(true) // 但 rollback 被拒且留痕
})

test('有 .adng-worktree marker 才允許 defaultRollback 嘗試 reset', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-vf-'))
  writeFileSync(join(dir, '.adng-worktree'), '')
  // 非 git repo，reset 會失敗 → alerts 記 rollback-failed（而非 refused）
  const v = new KernelVerifier({ cfg: cfg({ verifyCommand: `"${NODE}" -e "process.exit(1)"` }) })
  const job = { task: { id: 'x2x2x2x2', text: 't', line: 0, status: 'open' as const }, projectPath: dir }
  const r = await v.check(job, { ok: true, output: 'o', costUsd: 0, commitHash: 'b', baseCommitHash: 'a' })
  expect(r.alerts.some(a => a.includes('rollback-failed') || a.includes('rollback-exception'))).toBe(true)
})
