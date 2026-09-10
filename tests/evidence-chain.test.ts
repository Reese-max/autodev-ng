import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test } from 'vitest'
import { EvidenceStore, type VerificationEvidence } from '../src/engines/evidence-chain.js'
import type { Task } from '../src/types.js'

const dirs: string[] = []
const verification: VerificationEvidence = {
  candidateCommit: 'a'.repeat(40),
  ci: { status: 'pass', command: 'npm test', executed: true, exitCode: 0, detail: 'ok' },
  reviewer: { status: 'pass', identity: 'review:gpt-test', executionId: 'review-1', detail: 'review contract passed' },
}

afterEach(() => { while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true }) })

function fixture(text = '修正一般功能'): { dir: string; task: Task; store: EvidenceStore } {
  const dir = mkdtempSync(join(tmpdir(), 'adng-evidence-'))
  dirs.push(dir)
  return { dir, task: { id: 'task1234', text, line: 0, status: 'open' }, store: new EvidenceStore(dir) }
}

test('非發布任務：寫入綁定 candidate commit 的 CI／Reviewer／Release receipt 與 hash', () => {
  const f = fixture()
  const receipt = f.store.record({ executionId: 'exec-1', task: f.task, risk: 'medium', writerIdentity: 'codex:writer', verification })
  const body = JSON.parse(readFileSync(receipt.path, 'utf8')) as Record<string, unknown>
  expect(body).toMatchObject({ candidateCommit: 'a'.repeat(40), verdict: 'ready', bundleHash: receipt.bundleHash })
  expect(body.gates).toMatchObject({ ci: { status: 'pass' }, reviewer: { status: 'pass' }, release: { status: 'not-applicable' } })
  expect(f.store.verifiedTaskCommit(f.task.id, f.task.text)).toBeUndefined()
  const merged = f.store.recordMerge({ executionId: 'exec-1', taskId: f.task.id, mergedCommit: verification.candidateCommit })
  expect(JSON.parse(readFileSync(merged.path, 'utf8'))).toMatchObject({ mergedCommit: verification.candidateCommit, gateBundleHash: receipt.bundleHash })
  expect(f.store.verifiedTaskCommit(f.task.id, f.task.text)).toBe(verification.candidateCommit)
  expect(f.store.verifiedTaskCommit(f.task.id, 'different requirement')).toBeUndefined()
  writeFileSync(merged.path, readFileSync(merged.path, 'utf8').replace(verification.candidateCommit, 'b'.repeat(40)))
  expect(() => f.store.verifiedTaskCommit(f.task.id, f.task.text)).toThrow('checksum')
})

test('發布任務：沒有人工核可或 commit 不符時 BLOCKED；精確相符才通過', () => {
  const f = fixture('release production')
  const args = { executionId: 'exec-2', task: f.task, risk: 'high' as const, writerIdentity: 'codex:writer', verification }
  expect(f.store.record(args).releaseBlocked).toContain('missing')

  const approval = join(f.dir, 'release-approval.json')
  writeFileSync(approval, JSON.stringify({ status: 'approved', candidateCommit: 'b'.repeat(40), approvedBy: 'human@example' }))
  expect(f.store.record({ ...args, releaseApprovalFile: approval }).releaseBlocked).toContain('does not match')

  writeFileSync(approval, JSON.stringify({ status: 'approved', candidateCommit: verification.candidateCommit, approvedBy: 'human@example' }))
  const receipt = f.store.record({ ...args, releaseApprovalFile: approval })
  expect(receipt.releaseBlocked).toBeUndefined()
  expect(JSON.parse(readFileSync(receipt.path, 'utf8'))).toMatchObject({ verdict: 'ready', gates: { release: { status: 'pass', identity: 'human@example' } } })
})

test.each([
  ['do not access GitHub or publish anything', false],
  [JSON.stringify({ title: 'Fix clamp', body: 'Fix clamp.cjs.\nDo not access GitHub or publish anything.' }), false],
  ['只修復，不要部署或發布', false],
  ["Fix it without publishing changes. Don't deploy anything.", false],
  ['No need to publish anything', false],
  ['Repair local regressions (deterministic diagnosis, trust in release evidence)', false],
  ['Improve trust in release evidence; publish the fix', true],
  ['Improve trust in release evidence and deploy production', true],
  ['release evidence', true],
  ['publish locally but do not deploy', true],
  ['do not publish anything; deploy production', true],
  ['do not publish anything and then deploy production', true],
  ['不要部署，但是發布新版', true],
  ['do not forget to publish', true],
  ['不要忘記發布', true],
  ['do not prevent anyone from deploying; publish tomorrow', true],
  ['do not publish unless approved', true],
  ['do not deploy until tests pass', true],
  ['除非核准，否則不要發布', true],
  ['Unless approved, do not publish', true],
  ['release production', true],
])('發布意圖 %s → requires approval=%s', (text, required) => {
  const f = fixture(text)
  const receipt = f.store.record({ executionId: 'intent', task: f.task, risk: 'high', writerIdentity: 'codex:writer', verification })
  expect(Boolean(receipt.releaseBlocked)).toBe(required)
  expect(JSON.parse(readFileSync(receipt.path, 'utf8')).gates).toMatchObject({
    ci: { status: 'pass' }, reviewer: { status: 'pass' }, release: { status: required ? 'blocked' : 'not-applicable' },
  })
})
