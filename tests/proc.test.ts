import { expect, test } from 'vitest'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { killTree, runProcess, withGitSafeDirectory } from '../src/engines/proc.js'

const FAKE = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'fake-cli.mjs')
const base = { command: process.execPath, args: [FAKE], cwd: process.cwd(), timeoutMs: 10_000 }

test('Git 子程序只信任自身 cwd，保留既有 -c 設定且冪等', () => {
  const cwd = join(process.cwd(), 'bounded-worktree')
  const original = {
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: 'user.name',
    GIT_CONFIG_VALUE_0: 'adng-test',
  }

  const once = withGitSafeDirectory(original, cwd)
  expect(once).toMatchObject({
    GIT_CONFIG_COUNT: '2',
    GIT_CONFIG_KEY_0: 'user.name',
    GIT_CONFIG_VALUE_0: 'adng-test',
    GIT_CONFIG_KEY_1: 'safe.directory',
    GIT_CONFIG_VALUE_1: cwd.replace(/\\/g, '/'),
  })
  expect(withGitSafeDirectory(once, cwd)).toEqual(once)
  expect(original.GIT_CONFIG_COUNT).toBe('1')
})

test('ok：stdin 進、stdout 出、exit 0', async () => {
  process.env.FAKE_MODE = 'ok'
  const r = await runProcess({ ...base, stdinText: 'hello' })
  expect(r.exitCode).toBe(0)
  expect(r.timedOut).toBe(false)
  expect(r.stdout).toContain('done: hello')
})

test('fail：非零 exit、stderr 不被吞', async () => {
  process.env.FAKE_MODE = 'fail'
  const r = await runProcess({ ...base, stdinText: 'x' })
  expect(r.exitCode).toBe(3)
  expect(r.stderr).toContain('simulated 429')
})

test('empty：exit 0 但零輸出要能被呼叫端看穿', async () => {
  process.env.FAKE_MODE = 'empty'
  const r = await runProcess({ ...base, stdinText: 'x' })
  expect(r.exitCode).toBe(0)
  expect(r.stdout.trim()).toBe('')
})

test('hang：逾時樹斬、timedOut=true、不留殭屍', async () => {
  process.env.FAKE_MODE = 'hang'
  const t0 = Date.now()
  const r = await runProcess({ ...base, stdinText: 'x', timeoutMs: 1500 })
  expect(r.timedOut).toBe(true)
  expect(Date.now() - t0).toBeLessThan(8000) // 樹斬要快，不能拖
}, 15_000)

test('slow：慢但在時限內 → 正常完成', async () => {
  process.env.FAKE_MODE = 'slow'
  const r = await runProcess({ ...base, stdinText: 'x', timeoutMs: 5000 })
  expect(r.timedOut).toBe(false)
  expect(r.exitCode).toBe(0)
})

test('timeoutMs=0：停用 wall timeout，不會立刻斬掉程序', async () => {
  process.env.FAKE_MODE = 'slow'
  const r = await runProcess({ ...base, stdinText: 'x', timeoutMs: 0 })
  expect(r.timedOut).toBe(false)
  expect(r.exitCode).toBe(0)
})

test('idleTimeoutMs：無輸出進度才斬樹，不能把 wall timeout 偷加回來', async () => {
  const activity: number[] = []
  const t0 = Date.now()
  const r = await runProcess({
    command: process.execPath,
    args: ['-e', 'setInterval(() => {}, 1000)'],
    cwd: process.cwd(), stdinText: '', timeoutMs: 0, idleTimeoutMs: 300,
    onActivity: () => activity.push(Date.now()),
  })
  expect(r.timedOut).toBe(true)
  expect(r.timeoutReason).toBe('idle')
  // 逾時結果須等 Windows 收斂樹斬（taskkill 後 2s＋重枚舉）完成，不能為了快返回而遺留持鎖後代。
  expect(Date.now() - t0).toBeLessThan(8000)
  expect(activity).toHaveLength(0)
}, 10_000)

test('idleTimeoutMs：stdout 持續前進會續租，合法長任務不因總時間被終止', async () => {
  const activity: number[] = []
  // ponytail: 閒置窗 1500ms——300ms 在多 daemon 滿載機器上連 node 冷啟動都蓋不住，
  // 偽逾時反覆假紅（2026-08-03/04 兩日實證；同 neciken 1s 逾時血訓）。續租語義不變。
  const r = await runProcess({
    command: process.execPath,
    args: ['-e', 'let n=0;const t=setInterval(()=>{console.log(++n);if(n===4){clearInterval(t)}},250)'],
    cwd: process.cwd(), stdinText: '', timeoutMs: 0, idleTimeoutMs: 1500,
    onActivity: () => activity.push(Date.now()),
  })
  expect(r.timedOut).toBe(false)
  expect(r.exitCode).toBe(0)
  expect(activity.length).toBeGreaterThanOrEqual(4)
})

/** 用 signal 0 探測 pid 是否還活著（跨平台；Windows 上 Node 亦支援）。 */
function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

test('hang-tree：雙層樹斬——父子兩層 PID 逾時後皆不存活', async () => {
  process.env.FAKE_MODE = 'hang-tree'
  const r = await runProcess({ ...base, stdinText: 'x', timeoutMs: 1500 })
  expect(r.timedOut).toBe(true)

  const m = r.stderr.match(/CHILD_PID=(\d+)/)
  expect(m).not.toBeNull()
  const grandchildPid = Number(m![1])

  // 給 taskkill /T /F（或 SIGKILL）一點時間真正收尾
  await new Promise(res => setTimeout(res, 500))
  expect(isPidAlive(grandchildPid)).toBe(false)
}, 15_000)

test('hang-worktree-lock：實機引擎逾時斬樹完成後，worktree 目錄可立即刪除', async () => {
  if (process.platform !== 'win32') return
  const worktree = mkdtempSync(join(process.cwd(), '.tmp-proc-timeout-worktree-'))
  const lockedFile = join(worktree, 'result.txt')
  writeFileSync(lockedFile, 'locked')
  process.env.FAKE_MODE = 'hang-worktree-lock'
  process.env.FAKE_LOCK_FILE = lockedFile
  try {
    const r = await runProcess({ ...base, stdinText: 'x', timeoutMs: 3_000 })
    expect(r.timedOut).toBe(true)
    expect(r.stderr).toContain('WORKTREE_LOCK_READY')
    rmSync(worktree, { recursive: true, force: true, maxRetries: 5 })
    expect(existsSync(worktree)).toBe(false)
  } finally {
    delete process.env.FAKE_MODE
    delete process.env.FAKE_LOCK_FILE
    if (existsSync(worktree)) rmSync(worktree, { recursive: true, force: true, maxRetries: 5 })
  }
}, 20_000)

test('不存在的指令：失敗必須可見，不可全空（win32 經 cmd /c 非零 exit；其他平台 error 進 stderr）', async () => {
  const r = await runProcess({
    command: 'this-command-definitely-does-not-exist-xyz',
    args: [],
    cwd: process.cwd(),
    stdinText: 'x',
    timeoutMs: 5000
  })
  const failureVisible = r.exitCode !== 0 || r.stderr.trim() !== ''
  expect(failureVisible).toBe(true)
})

test('timeout 後 resolve 等候樹斬收斂且仍受 8 秒上限約束', async () => {
  process.env.FAKE_MODE = 'hang'
  const timeoutMs = 1000
  const t0 = Date.now()
  const r = await runProcess({ ...base, stdinText: 'x', timeoutMs })
  const elapsed = Date.now() - t0
  expect(r.timedOut).toBe(true)
  expect(elapsed).toBeLessThan(timeoutMs + 8000)
}, 15_000)

test('輸出超過 maxOutputChars 被截斷且有標記', async () => {
  process.env.FAKE_MODE = 'ok'
  const r = await runProcess({ ...base, stdinText: 'x'.repeat(10), maxOutputChars: 5 })
  expect(r.stdout.length).toBeLessThan(200)
  expect(r.stdout).toContain('[adng: output truncated]')
})

// ---------------------------------------------------------------------------
// M5 Task 1：env 透傳（m3 檔位 ANTHROPIC_* 注入路徑）

test('env 透傳：opts.env 疊在 process.env 上進子進程；未設時行為不變（不注入）', async () => {
  const args = ['-e', 'console.log(process.env.ADNG_M5_PROBE ?? "(unset)")']
  const withEnv = await runProcess({
    command: process.execPath, args, cwd: process.cwd(), stdinText: '', timeoutMs: 10_000,
    env: { ADNG_M5_PROBE: 'hello-m5' }
  })
  expect(withEnv.stdout).toContain('hello-m5')
  const without = await runProcess({
    command: process.execPath, args, cwd: process.cwd(), stdinText: '', timeoutMs: 10_000
  })
  expect(without.stdout).toContain('(unset)')
})

test('env 透傳：opts.env 是「疊加」不是「取代」——父進程既有環境變數仍可見', async () => {
  process.env.ADNG_M5_PARENT = 'from-parent'
  try {
    const r = await runProcess({
      command: process.execPath,
      args: ['-e', 'console.log((process.env.ADNG_M5_PARENT ?? "?") + "|" + (process.env.ADNG_M5_EXTRA ?? "?"))'],
      cwd: process.cwd(), stdinText: '', timeoutMs: 10_000,
      env: { ADNG_M5_EXTRA: 'from-opts' }
    })
    expect(r.stdout).toContain('from-parent|from-opts')
  } finally {
    delete process.env.ADNG_M5_PARENT
  }
})

test('killTree 收斂：逐輪葉到根補殺，可殺者收斂、頑固者 3 輪後記殭屍', async () => {
  const calls: string[] = []
  const alive = new Set([10, 11, 12])
  const events: Array<{ type: string; data: { pid: number; command: string } }> = []

  await killTree(10, {
    command: 'root-command',
    processTree: [
      { pid: 10, command: 'root-command' },
      { pid: 11, parentPid: 10, command: 'child-command' },
      { pid: 12, parentPid: 11, command: 'leaf-command' },
    ],
    events: { append: (type, data) => events.push({ type, data }) },
    deps: {
      platform: 'win32',
      taskkill: async pid => { calls.push(`taskkill:${pid}`) },
      wait: async ms => { calls.push(`wait:${ms}`) },
      isAlive: pid => alive.has(pid),
      kill: pid => {
        calls.push(`kill:${pid}`)
        if (pid === 11) alive.delete(pid) // 11 可殺；12、10 頑固（模擬存取被拒）
      },
    },
  })

  expect(calls.slice(0, 2)).toEqual(['taskkill:10', 'wait:2000'])
  // 第 1 輪殺 [12,11,10]，11 死；第 2、3 輪只剩 [12,10]
  expect(calls.filter(c => c.startsWith('kill:'))).toEqual([
    'kill:12', 'kill:11', 'kill:10', 'kill:12', 'kill:10', 'kill:12', 'kill:10',
  ])
  expect(events).toEqual([
    { type: 'proc-zombie', data: { pid: 12, command: 'leaf-command' } },
    { type: 'proc-zombie', data: { pid: 10, command: 'root-command' } },
  ])
})

test('killTree 收斂：根已死但孤兒後代仍活——必須枚舉並補殺（舊版提前返回＝洩漏主因）', async () => {
  const calls: string[] = []
  const alive = new Set([12])
  const events: Array<{ type: string; data: { pid: number; command: string } }> = []
  await killTree(10, {
    command: 'root-command',
    processTree: [
      { pid: 10, command: 'root-command' },
      { pid: 12, parentPid: 10, command: 'orphan-command' },
    ],
    events: { append: (type, data) => events.push({ type, data }) },
    deps: {
      platform: 'win32',
      taskkill: async () => { calls.push('taskkill') },
      wait: async ms => { calls.push(`wait:${ms}`) },
      isAlive: pid => alive.has(pid),
      kill: pid => { calls.push(`kill:${pid}`); alive.delete(pid) },
    },
  })
  expect(calls.filter(c => c.startsWith('kill:'))).toEqual(['kill:12'])
  expect(events).toEqual([]) // 第 2 輪已零存活，收斂返回，無殭屍
})

test('killTree 收斂：第一輪後才出現的孫代必須由新快照補殺並驗屍', async () => {
  const calls: string[] = []
  const alive = new Set([10, 11, 12])
  const events: Array<{ type: string; data: { pid: number; command: string } }> = []
  let snapshots = 0
  await killTree(10, {
    command: 'root-command',
    events: { append: (type, data) => events.push({ type, data }) },
    deps: {
      platform: 'win32',
      taskkill: async () => { calls.push('taskkill') },
      wait: async ms => { calls.push(`wait:${ms}`) },
      isAlive: pid => alive.has(pid),
      listProcesses: async () => {
        calls.push('list')
        snapshots++
        return snapshots === 1
          ? [{ pid: 10, command: 'root-command' }, { pid: 11, parentPid: 10, command: 'first-child' }]
          : [
              { pid: 10, command: 'root-command' },
              { pid: 11, parentPid: 10, command: 'first-child' },
              { pid: 12, parentPid: 11, command: 'late-grandchild' },
            ]
      },
      kill: pid => { calls.push(`kill:${pid}`) },
    },
  })
  expect(calls.filter(c => c === 'list')).toHaveLength(4) // 3 輪＋終局驗屍，不能沿用首輪快照
  expect(calls.filter(c => c === 'kill:12')).toHaveLength(2)
  expect(events).toEqual([
    { type: 'proc-zombie', data: { pid: 12, command: 'late-grandchild' } },
    { type: 'proc-zombie', data: { pid: 11, command: 'first-child' } },
    { type: 'proc-zombie', data: { pid: 10, command: 'root-command' } },
  ])
})

test('killTree 收斂：全樹已死時一輪即返、不 fallback 不寫事件', async () => {
  const calls: string[] = []
  await killTree(10, {
    command: 'root-command',
    processTree: [{ pid: 10, command: 'root-command' }],
    events: { append: () => { throw new Error('不應寫入') } },
    deps: {
      platform: 'win32',
      taskkill: async () => { calls.push('taskkill') },
      wait: async ms => { calls.push(`wait:${ms}`) },
      isAlive: () => false,
      kill: () => { throw new Error('不應 fallback') },
    },
  })
  expect(calls).toEqual(['taskkill', 'wait:2000'])
})
