import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test } from 'vitest'
import { TeamState } from '../src/engines/team-state.js'
import { checkOwnership } from '../src/engines/ownership.js'
import type { Task } from '../src/types.js'

const repos: string[] = []
afterEach(() => { while (repos.length) rmSync(repos.pop()!, { recursive: true, force: true }) })

function repo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'adng-team-'))
  repos.push(dir)
  execFileSync('git', ['init', '-b', 'main'], { cwd: dir, stdio: 'ignore' })
  writeFileSync(join(dir, 'README.md'), '# team\n')
  return dir
}

function task(id: string, write: string[]): Task {
  return { id, text: id, line: 0, status: 'open', ownership: { write, resources: [], risk: 'medium' } }
}

test('ownership 拒絕 junction／symlink 別名，不能以兩個名稱取得重疊寫入權', () => {
  const root = repo(), team = new TeamState(root)
  mkdirSync(join(root, 'actual'))
  symlinkSync(join(root, 'actual'), join(root, 'alias'), process.platform === 'win32' ? 'junction' : 'dir')
  try {
    const linked = task('linked', ['alias/new.ts'])
    expect(() => team.claim({ executionId: 'e1', task: linked, workerId: 'w1', reservedCostUsd: 0, spentUsd: 0, dailyHardUsd: 0, leaseMs: 60_000 })).toThrow(/ownership path follows a link/)
    expect(team.snapshot().claims).toEqual([])
    expect(checkOwnership(root, linked, 'base', 'candidate')).toMatchObject({ ok: false, detail: expect.stringContaining('ownership path follows a link') })
    expect(team.claim({ executionId: 'e2', task: task('plain', ['actual/new.ts']), workerId: 'w2', reservedCostUsd: 0, spentUsd: 0, dailyHardUsd: 0, leaseMs: 60_000 }).ok).toBe(true)
  } finally { team.close() }
})

test('每日額度跨實例原子保留，完成釋放與重啟均不能重設', () => {
  const root = repo(), a = new TeamState(root), b = new TeamState(root)
  const args = { workerId: 'codex-astra', reservedCostUsd: 0, spentUsd: 0, dailyHardUsd: 0, leaseMs: 60_000, dailyAttemptCap: 1 }
  try {
    const first = a.claim({ ...args, executionId: 'first', task: task('first', ['src/a.ts']) })
    expect(first.ok).toBe(true)
    if (first.ok) a.release('first', first.token)
    expect(b.claim({ ...args, executionId: 'second', task: task('second', ['src/b.ts']) })).toMatchObject({ ok: false, reason: 'attempt-cap' })
  } finally { a.close(); b.close() }
  const reopened = new TeamState(root)
  try { expect(reopened.claim({ ...args, executionId: 'third', task: task('third', ['src/c.ts']) })).toMatchObject({ ok: false, reason: 'attempt-cap' }) }
  finally { reopened.close() }
})

test('跨實例 admission：ownership 衝突與進行中成本保留在同一 Git common-dir DB', () => {
  const root = repo(), a = new TeamState(root), b = new TeamState(root)
  try {
    const first = a.claim({ executionId: 'e1', task: task('t1', ['src/']), workerId: 'w1', reservedCostUsd: 3, spentUsd: 2, dailyHardUsd: 10, leaseMs: 60_000 })
    expect(first.ok).toBe(true)
    expect(b.claim({ executionId: 'e2', task: task('t2', ['src/a.ts']), workerId: 'w2', reservedCostUsd: 1, spentUsd: 2, dailyHardUsd: 10, leaseMs: 60_000 })).toMatchObject({ ok: false, reason: 'ownership-conflict' })
    expect(b.claim({ executionId: 'e3', task: task('t3', ['docs/']), workerId: 'w3', reservedCostUsd: 6, spentUsd: 2, dailyHardUsd: 10, leaseMs: 60_000 })).toMatchObject({ ok: false, reason: 'cost-reserved' })
  } finally { a.close(); b.close() }
})

test('durable merge queue：兩個 DB 實例仍嚴格 FIFO，且只允許一個 Merge Captain', async () => {
  const root = repo(), a = new TeamState(root), b = new TeamState(root), order: string[] = []
  try {
    const ca = a.claim({ executionId: 'e1', task: task('t1', ['src/a.ts']), workerId: 'w1', reservedCostUsd: 0, spentUsd: 0, dailyHardUsd: 0, leaseMs: 60_000 })
    const cb = b.claim({ executionId: 'e2', task: task('t2', ['src/b.ts']), workerId: 'w2', reservedCostUsd: 0, spentUsd: 0, dailyHardUsd: 0, leaseMs: 60_000 })
    if (!ca.ok || !cb.ok) throw new Error('fixture claims failed')
    a.enqueue({ executionId: 'e1', token: ca.token, taskId: 't1', candidateHead: 'a', branch: 'a', worktreePath: 'a' })
    b.enqueue({ executionId: 'e2', token: cb.token, taskId: 't2', candidateHead: 'b', branch: 'b', worktreePath: 'b' })
    let release = () => {}
    const gate = new Promise<void>(resolve => { release = resolve })
    const first = a.withMergeTurn('e1', ca.token, 5_000, async () => { order.push('first:start'); await gate; order.push('first:end') })
      .then(() => a.finishMerge('e1', true, 'a'))
    const second = b.withMergeTurn('e2', cb.token, 5_000, () => { order.push('second') })
      .then(() => b.finishMerge('e2', true, 'b'))
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(order).toEqual(['first:start'])
    release()
    await Promise.all([first, second])
    expect(order).toEqual(['first:start', 'first:end', 'second'])
    expect(a.snapshot().queue.map(q => q.state)).toEqual(['DONE', 'DONE'])
  } finally { a.close(); b.close() }
})

test('過期 worker 不猜測續跑：既有 worktree 任務進 QUARANTINED，拒絕重複 admission', async () => {
  const root = repo(), first = new TeamState(root)
  const claim = first.claim({ executionId: 'dead', task: task('t1', ['src/a.ts']), workerId: 'dead-worker', reservedCostUsd: 0, spentUsd: 0, dailyHardUsd: 0, leaseMs: 30 })
  expect(claim.ok).toBe(true)
  first.close()
  await new Promise(resolve => setTimeout(resolve, 60))
  const recovered = new TeamState(root)
  try {
    expect(recovered.claim({ executionId: 'new', task: task('t1', ['src/a.ts']), workerId: 'new-worker', reservedCostUsd: 0, spentUsd: 0, dailyHardUsd: 0, leaseMs: 60_000 })).toMatchObject({ ok: false, reason: 'quarantined' })
    expect(recovered.snapshot().claims[0]).toMatchObject({ state: 'QUARANTINED', active: 0 })
  } finally { recovered.close() }
})
