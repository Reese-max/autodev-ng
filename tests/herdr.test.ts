import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test, vi } from 'vitest'
import { HerdrEngine } from '../src/engines/herdr.js'
import { makeEngineRegistry } from '../src/engines/registry.js'
import { runProcess } from '../src/engines/proc.js'
import { PreflightCache } from '../src/preflight.js'
import { ConfigSchema } from '../src/types.js'

const task = { id: 'a/b:c', text: '修好功能', line: 1, status: 'open' as const }
const proc = (stdout = '', exitCode = 0) => ({ exitCode, stdout, stderr: '', timedOut: false, durationMs: 1 })

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'adng-herdr-'))
  const launcher = join(dir, 'Start-Herdr-Autopilot.ps1')
  writeFileSync(launcher, '# fake launcher')
  writeFileSync(join(dir, '.adng-worktree'), '{}')
  return { dir, launcher, cache: new PreflightCache(join(dir, 'preflight.json')) }
}

const argAfter = (args: string[], flag: string): string => {
  const i = args.indexOf(flag)
  if (i < 0) throw new Error(`launcher args 缺少 ${flag}`)
  return args[i + 1]!
}

/** Fake launcher：依 -ResultFile 寫回 v1 結果契約；patch=null 時只印 stdout、不寫檔（舊 launcher）。 */
function contractRunner(patch: Record<string, unknown> | null = {}, stdout = '') {
  const calls: Parameters<typeof runProcess>[0][] = []
  const runner: typeof runProcess = async opts => {
    calls.push(opts)
    if (patch !== null) {
      const file = argAfter(opts.args, '-ResultFile')
      writeFileSync(file, JSON.stringify({
        schemaVersion: 1,
        requestId: argAfter(opts.args, '-RequestId'),
        executionId: argAfter(opts.args, '-ExecutionId'),
        repo: opts.cwd, taskId: task.id, baseCommit: 'aaa',
        server: 'srv-1', session: 'herdr-autopilot', pane: 'p1', status: 'done',
        ...patch,
      }))
    }
    return proc(stdout)
  }
  return { calls, runner }
}

test('registry 接受 herdr 並要求 launcher 路徑', () => {
  const { dir, launcher } = fixture()
  const cfg = ConfigSchema.parse({
    projectPath: dir, backlogFile: join(dir, 'BACKLOG.md'), dataDir: dir,
    defaultEngine: 'herdr', engines: { herdr: { adapter: 'herdr', command: launcher, provider: 'Pi', costPerRunUsd: 0 } },
  })
  expect(makeEngineRegistry(cfg).resolve('herdr')).toBeInstanceOf(HerdrEngine)
})

test('preflight 只查固定 session 且要求 compatible=true', async () => {
  const { launcher, cache } = fixture()
  const calls: Parameters<typeof runProcess>[0][] = []
  const runner: typeof runProcess = async opts => {
    calls.push(opts)
    return proc('{"running":true,"compatible":true,"protocol":20}')
  }
  const engine = new HerdrEngine({ command: launcher, cache, runProcess: runner })

  expect(await engine.preflight()).toMatchObject({ ok: true, admission: { quota: { state: 'unknown' }, model: { state: 'unknown' } } })
  expect(calls).toHaveLength(1)
  expect(calls[0]?.args).toEqual(['--session', 'herdr-autopilot', 'status', 'server', '--json'])
  await engine.preflight()
  expect(calls).toHaveLength(1)
})

test('run 固定單輪、禁止 Herdr commit，成功後才由 AutoDev 宿主提交', async () => {
  const { dir, launcher, cache } = fixture()
  const commit = vi.fn(() => 'bbb')
  const { calls, runner } = contractRunner()
  const engine = new HerdrEngine({
    command: launcher, cache, dataDir: dir, verifyCommand: 'npm test', runProcess: runner,
    getCommitHash: () => 'aaa', commitChanges: commit,
  })

  const result = await engine.run({ task, projectPath: dir, executionId: 'exec-9' })

  expect(result).toMatchObject({ ok: true, baseCommitHash: 'aaa', commitHash: 'bbb' })
  expect(commit).toHaveBeenCalledTimes(1)
  const args = calls[0]!.args
  expect(args).toEqual(expect.arrayContaining([
    '-BudgetPolicy', 'GPTOnly', '-Provider', 'Codex', '-SessionName', 'herdr-autopilot', '-MaxRounds', '1', '-AllowLocalCommit:$false', '-FullGate', 'npm test', '-Wait',
  ]))
  expect(args.join(' ')).not.toContain('-ParallelTask')
  const requestId = argAfter(args, '-RequestId')
  expect(requestId).toBe('adng-a-b-c-aaa-exec-9')
  expect(argAfter(args, '-ExecutionId')).toBe('exec-9')
  expect(argAfter(args, '-ResultFile')).toContain(requestId)
})

test('requestId 綁定 executionId：同 task/base 不同 execution 產生不同 request；同 execution 沿用原 ID', async () => {
  const { dir, launcher, cache } = fixture()
  const { calls, runner } = contractRunner()
  const engine = new HerdrEngine({
    command: launcher, cache, dataDir: dir, runProcess: runner,
    getCommitHash: () => 'aaa', commitChanges: () => 'bbb',
  })

  await engine.run({ task, projectPath: dir, executionId: 'exec-1' })
  await engine.run({ task, projectPath: dir, executionId: 'exec-2' })
  await engine.run({ task, projectPath: dir, executionId: 'exec-1' }) // 同一 attempt 重查沿用原 ID

  const requests = calls.map(c => argAfter(c.args, '-RequestId'))
  expect(requests[0]).not.toBe(requests[1])
  expect(requests[0]).toBe(requests[2])
  expect(requests[0]).toContain('exec-1')
})

test('送件前先把 repo/task/execution/request/base/session/launcher 綁定落盤', async () => {
  const { dir, launcher, cache } = fixture()
  let seen: Record<string, unknown> | undefined
  const runner: typeof runProcess = async opts => {
    // 於 launcher 執行期間讀回——證明保存發生在送件之前
    seen = JSON.parse(readFileSync(join(dir, 'herdr', `${argAfter(opts.args, '-RequestId')}.expected.json`), 'utf8'))
    writeFileSync(argAfter(opts.args, '-ResultFile'), JSON.stringify({
      schemaVersion: 1, requestId: argAfter(opts.args, '-RequestId'), executionId: argAfter(opts.args, '-ExecutionId'),
      repo: opts.cwd, taskId: task.id, baseCommit: 'aaa', server: 's', session: 'herdr-autopilot', pane: 'p', status: 'done',
    }))
    return proc('')
  }
  const engine = new HerdrEngine({ command: launcher, cache, dataDir: dir, runProcess: runner, getCommitHash: () => 'aaa', commitChanges: () => 'bbb' })

  expect((await engine.run({ task, projectPath: dir, executionId: 'exec-p' })).ok).toBe(true)
  expect(seen).toMatchObject({
    schemaVersion: 1, requestId: 'adng-a-b-c-aaa-exec-p', executionId: 'exec-p',
    taskId: 'a/b:c', baseCommit: 'aaa', session: 'herdr-autopilot', launcher,
  })
  expect(typeof seen?.repo).toBe('string')
})

test('Pi provider 以 CostAware 明確路由，不落入 GPTOnly 阻擋', async () => {
  const { dir, launcher, cache } = fixture()
  const { calls, runner } = contractRunner()
  const engine = new HerdrEngine({
    command: launcher, cache, dataDir: dir, provider: 'Pi', runProcess: runner,
    getCommitHash: () => 'aaa', commitChanges: () => 'bbb',
  })

  expect((await engine.run({ task, projectPath: dir })).ok).toBe(true)
  expect(calls[0]?.args).toEqual(expect.arrayContaining(['-BudgetPolicy', 'CostAware', '-Provider', 'Pi']))
})

test('Herdr 自行 commit 時 fail-closed，不做第二次宿主提交', async () => {
  const { dir, launcher, cache } = fixture()
  const hashes = ['aaa', 'bbb']
  const commit = vi.fn(() => 'ccc')
  const { runner } = contractRunner()
  const engine = new HerdrEngine({
    command: launcher, cache, dataDir: dir,
    runProcess: runner,
    getCommitHash: () => hashes.shift(), commitChanges: commit,
  })

  const result = await engine.run({ task, projectPath: dir })

  expect(result.ok).toBe(false)
  expect(result.failureReason).toContain('unexpected-commit')
  expect(commit).not.toHaveBeenCalled()
})

test('bound failed 契約＝已核對的失敗終態：不提交但不要求 recovery', async () => {
  const { dir, launcher, cache } = fixture()
  const commit = vi.fn(() => 'bbb')
  const { runner } = contractRunner({ status: 'failed', detail: 'gate failed' })
  const engine = new HerdrEngine({ command: launcher, cache, dataDir: dir, runProcess: runner, getCommitHash: () => 'aaa', commitChanges: commit })

  const result = await engine.run({ task, projectPath: dir })

  expect(result.ok).toBe(false)
  expect(result.failureReason).toContain('herdr-failed')
  expect(result.recoveryRequired).toBeUndefined()
  expect(commit).not.toHaveBeenCalled()
})

test('長 stdout 蓋過展示 buffer 上限時，合法終態仍可由結果檔核對（不依賴可截斷輸出）', async () => {
  const { dir, launcher, cache } = fixture()
  const { runner } = contractRunner({}, `${'x'.repeat(2_000_001)}`) // 超過 proc 預設 2,000,000 字元上限且無 marker
  const engine = new HerdrEngine({ command: launcher, cache, dataDir: dir, runProcess: runner, getCommitHash: () => 'aaa', commitChanges: () => 'bbb' })

  const result = await engine.run({ task, projectPath: dir })

  expect(result.ok).toBe(true)
  expect(result.output.length).toBeLessThan(10_000) // 人讀日誌維持有界
})

test('launcher 殘留舊回執檔在送件前被清掉，不會被當成本次結果', async () => {
  const { dir, launcher, cache } = fixture()
  const { runner } = contractRunner(null, 'AUTOPILOT_WAIT_OK request=old') // 舊 launcher：只印字串不寫檔
  mkdirSync(join(dir, 'herdr'), { recursive: true })
  writeFileSync(join(dir, 'herdr', 'adng-a-b-c-aaa-exec-s.result.json'), JSON.stringify({ stale: true }))
  const engine = new HerdrEngine({ command: launcher, cache, dataDir: dir, runProcess: runner, getCommitHash: () => 'aaa', commitChanges: () => 'bbb' })

  const result = await engine.run({ task, projectPath: dir, executionId: 'exec-s' })

  expect(result.ok).toBe(false)
  expect(result.failureReason).toContain('unsupported')
})

const rejectCases: Array<{ name: string; patch?: Record<string, unknown> | null; raw?: string; want: string }> = [
  { name: '舊 launcher 只有 stdout marker 字串', patch: null, want: 'unsupported' },
  { name: 'requestId 屬於別的 request', patch: { requestId: 'adng-other' }, want: 'mismatch' },
  { name: 'executionId 屬於舊 attempt', patch: { executionId: 'exec-old' }, want: 'mismatch' },
  { name: 'repo 不符', patch: { repo: '/tmp/other-repo' }, want: 'mismatch' },
  { name: 'taskId 不符', patch: { taskId: 'other/task' }, want: 'mismatch' },
  { name: 'baseCommit 不符', patch: { baseCommit: 'zzz' }, want: 'mismatch' },
  { name: 'session 不符（舊 pane occupant）', patch: { session: 'old-session' }, want: 'mismatch' },
  { name: 'candidateCommit 與 no-commit 政策矛盾', patch: { candidateCommit: 'ccc' }, want: 'mismatch' },
  { name: '缺 pane 欄位', patch: { pane: '' }, want: 'invalid' },
  { name: '缺 server 欄位', patch: { server: '' }, want: 'invalid' },
  { name: 'status 非契約值', patch: { status: 'maybe' }, want: 'invalid' },
  { name: '契約版本不符', patch: { schemaVersion: 2 }, want: 'unsupported' },
  { name: '非法 JSON', raw: '{not json', want: 'invalid' },
  { name: '截斷 JSON', raw: '{"schemaVersion":1,"requestId":"adng', want: 'invalid' },
]
for (const c of rejectCases) {
  test(`拒收錯單／舊回執：${c.name}（拒收後不做宿主提交）`, async () => {
    const { dir, launcher, cache } = fixture()
    const commit = vi.fn(() => 'bbb')
    const runner: typeof runProcess = async opts => {
      const file = argAfter(opts.args, '-ResultFile')
      if (c.raw !== undefined) writeFileSync(file, c.raw)
      else if (c.patch !== null && c.patch !== undefined) {
        writeFileSync(file, JSON.stringify({
          schemaVersion: 1, requestId: argAfter(opts.args, '-RequestId'), executionId: argAfter(opts.args, '-ExecutionId'),
          repo: opts.cwd, taskId: task.id, baseCommit: 'aaa', server: 'srv-1', session: 'herdr-autopilot', pane: 'p1',
          status: 'done', token: 'sk-never-echo', ...c.patch,
        }))
      }
      return proc('noise AUTOPILOT_WAIT_OK request=old noise') // 混入普通 stdout 的完成字串不算數
    }
    const engine = new HerdrEngine({ command: launcher, cache, dataDir: dir, runProcess: runner, getCommitHash: () => 'aaa', commitChanges: commit })

    const result = await engine.run({ task, projectPath: dir, executionId: 'exec-r' })

    expect(result.ok, c.name).toBe(false)
    expect(result.failureReason, c.name).toContain(c.want)
    expect(result.recoveryRequired, c.name).toBe(true)
    expect(result.failureReason).not.toContain('sk-never-echo')
    expect(commit).not.toHaveBeenCalled()
    expect(existsSync(join(dir, 'herdr', 'adng-a-b-c-aaa-exec-r.expected.json'))).toBe(true)
  })
}
