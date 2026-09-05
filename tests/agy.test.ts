import { afterAll, expect, test } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { AgyEngine, buildKillArgs, toWslPath } from '../src/engines/agy.js'
import { PreflightCache } from '../src/preflight.js'
import type { Task } from '../src/types.js'

const FAKE = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'fake-wsl.mjs')
const T: Task = { id: 'ab12cd34', text: '修好登入頁', line: 0, status: 'open' }
const PLAIN_PROJECT = mkdtempSync(join(tmpdir(), 'adng-agy-project '))
afterAll(() => rmSync(PLAIN_PROJECT, { recursive: true, force: true }))

// ---------------------------------------------------------------------------
// toWslPath：路徑轉換助手（小寫碟符、反斜線轉正斜線、空格原樣、尾斜線剝除）

test('toWslPath：基本 D:\\ 路徑（小寫碟符＋正斜線）', () => {
  expect(toWslPath('D:\\Users\\Administrator\\Desktop\\autodev-ng')).toBe('/mnt/d/Users/Administrator/Desktop/autodev-ng')
})

test('toWslPath：含空格路徑原樣保留（argv 直傳不經 shell，毋須跳脫）', () => {
  expect(toWslPath('C:\\Program Files\\My App\\repo dir')).toBe('/mnt/c/Program Files/My App/repo dir')
})

test('toWslPath：小寫碟符輸入、混用正斜線輸入、尾斜線剝除、碟符根目錄', () => {
  expect(toWslPath('d:\\work\\x')).toBe('/mnt/d/work/x')
  expect(toWslPath('D:/work/x')).toBe('/mnt/d/work/x')
  expect(toWslPath('D:\\work\\x\\')).toBe('/mnt/d/work/x')
  expect(toWslPath('D:\\')).toBe('/mnt/d')
})

test('toWslPath：已是 POSIX 路徑者原樣（只正規化反斜線）', () => {
  expect(toWslPath('/root/agy-probe')).toBe('/root/agy-probe')
})

// ---------------------------------------------------------------------------
// buildKillArgs：超時補刀指令組裝（精準 marker，絕不寬鬆 pattern）

test('buildKillArgs：pkill -f 只帶本次 run 專屬 marker，不含寬鬆 pattern', () => {
  const args = buildKillArgs('Ubuntu', 'adng-run-ab12cd34-deadbeef')
  expect(args).toEqual(['-d', 'Ubuntu', '-u', 'root', '--', 'pkill', '-f', 'adng-run-ab12cd34-deadbeef'])
  expect(args[args.length - 1]).toMatch(/^adng-run-/) // pkill 目標必為 run-id，非 'agy' 之類寬鬆字串
})

// ---------------------------------------------------------------------------
// AgyEngine：以 fake-wsl.mjs 模擬 wsl.exe 介面（不真打 WSL）

function makeEngine(mode: string, hashes: (string | undefined)[], opts: { timeoutMs?: number; model?: string } = {}): { e: AgyEngine; logFile: string } {
  process.env.FAKE_MODE = mode
  const dir = mkdtempSync(join(tmpdir(), 'adng agy ')) // 目錄名帶空格：一路驗到 --cd 轉換
  const logFile = join(dir, 'calls.jsonl')
  process.env.FAKE_WSL_LOG = logFile
  let i = 0
  const e = new AgyEngine({
    command: process.execPath, argvPrefix: [FAKE],
    timeoutMs: opts.timeoutMs ?? 10_000, pingTimeoutMs: 10_000, model: opts.model,
    cache: new PreflightCache(join(dir, 'pf.json')),
    getCommitHash: () => hashes[Math.min(i++, hashes.length - 1)]
  })
  return { e, logFile }
}

function loggedCalls(logFile: string): string[][] {
  return readFileSync(logFile, 'utf8').trim().split('\n').map(l => JSON.parse(l) as string[])
}

test('args 組裝：wsl.exe --cd <mnt路徑> -d Ubuntu -u root -- agy 旗標齊全＋marker 進 argv', async () => {
  const { e, logFile } = makeEngine('ok', ['aaa', 'bbb'])
  const cwd = PLAIN_PROJECT // 不依賴測試 runner 本身是否位於 linked worktree
  const r = await e.run({ task: T, projectPath: cwd })
  expect(r.ok).toBe(true)
  const call = loggedCalls(logFile)[0]!
  expect(call.slice(0, 7)).toEqual(['--cd', toWslPath(cwd), '-d', 'Ubuntu', '-u', 'root', '--'])
  expect(call[7]).toBe('/usr/local/bin/agy')
  expect(call).toContain('-p')
  expect(call).toContain('--dangerously-skip-permissions')
  // 1.1.4 契約：全域旗標必在 -p 前（-p 後的旗標被當 prompt 吞掉、權限 auto-deny）
  expect(call.indexOf('--dangerously-skip-permissions')).toBeLessThan(call.indexOf('-p'))
  expect(call[call.indexOf('--add-dir') + 1]).toBe(toWslPath(cwd)) // 真探針實證：缺 --add-dir 會跑去自家 scratch
  const ptIdx = call.indexOf('--print-timeout')
  expect(ptIdx).toBeGreaterThan(7)
  expect(call[ptIdx + 1]).toMatch(/^\d+s$/) // 明確設定，非放任預設 5m
  const promptArg = call[call.indexOf('-p') + 1]!
  expect(promptArg).toContain('任務：修好登入頁')            // prompt 走 -p argv（1.1.4 不讀 stdin）
  expect(promptArg).toMatch(/adng-run-ab12cd34-[0-9a-f]{8}/) // marker 在 prompt 內 → 進 cmdline 供 pkill -f
})

test('prompt 超過 argv 上限 → fail-fast 給明確原因，不 spawn', async () => {
  const { e, logFile } = makeEngine('ok', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: PLAIN_PROJECT, directive: 'x'.repeat(29_000) })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('argv 上限')
  expect(() => loggedCalls(logFile)).toThrow() // 無任何 spawn 紀錄（log 檔不存在）
})

test('--cd 路徑轉換：含空格的 projectPath 保持單一 argv，Windows 轉為 /mnt 形', async () => {
  const { e, logFile } = makeEngine('ok', ['aaa', 'bbb'])
  const spacedDir = mkdtempSync(join(tmpdir(), 'adng probe dir ')) // 真建含空格目錄
  await e.run({ task: T, projectPath: spacedDir })
  const call = loggedCalls(logFile)[0]!
  expect(call[1]).toBe(toWslPath(spacedDir))
  if (process.platform === 'win32') expect(call[1]).toMatch(/^\/mnt\/[a-z]\//)
  else expect(call[1]).toBe(spacedDir)
  expect(call[1]).toContain(' ') // 空格保留在同一個 argv 元素內
})

test('prompt 走 -p argv（1.1.4 契約）：任務文字、commit 硬話、run-id marker 都在（回聲驗證）', async () => {
  const { e } = makeEngine('ok', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: PLAIN_PROJECT })
  expect(r.output).toContain('修好登入頁')
  expect(r.output).toContain('git add -A')
  expect(r.output).toContain('adng-run-ab12cd34-')
})

test('成功＋commit hash 前進 → ok:true、costUsd 0、costUnknown 恆真（純文字無 usage）', async () => {
  const { e } = makeEngine('ok', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: PLAIN_PROJECT })
  expect(r.ok).toBe(true)
  expect(r.commitHash).toBe('bbb')
  expect(r.baseCommitHash).toBe('aaa')
  expect(r.costUsd).toBe(0)
  expect(r.costUnknown).toBe(true)
})

test('linked worktree：agy 前切成 WSL gitdir，結束後交回 Windows Git 驗收', async () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-agy-worktree-'))
  const repo = join(root, 'repo')
  const worktree = join(root, 'worktree')
  mkdirSync(repo)
  try {
    execFileSync('git', ['init', '-b', 'main'], { cwd: repo, stdio: 'ignore' })
    execFileSync('git', ['config', 'user.email', 'adng-test@example.com'], { cwd: repo })
    execFileSync('git', ['config', 'user.name', 'adng-test'], { cwd: repo })
    writeFileSync(join(repo, 'README.md'), 'probe\n')
    execFileSync('git', ['add', '.'], { cwd: repo })
    execFileSync('git', ['commit', '-m', 'chore: init'], { cwd: repo, stdio: 'ignore' })
    execFileSync('git', ['worktree', 'add', '-b', 'adng/agy-probe', worktree], { cwd: repo, stdio: 'ignore' })

    const { e, logFile } = makeEngine('ok', ['aaa', 'bbb'])
    expect((await e.run({ task: T, projectPath: worktree })).ok).toBe(true)

    const calls = loggedCalls(logFile)
    expect(calls).toHaveLength(2)
    expect(calls[0]!.slice(0, 7)).toEqual(['-d', 'Ubuntu', '-u', 'root', '--', 'git', '--git-dir'])
    expect(calls[0]![7]).toMatch(/\/repo\/\.git$/)
    expect(calls[0]!.slice(8)).toEqual(['worktree', 'repair', toWslPath(worktree)])
    expect(calls[1]![7]).toBe('/usr/local/bin/agy')
    const topLevel = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: worktree, encoding: 'utf8' }).trim()
    expect(topLevel).toMatch(/[\\/]worktree$/)
  } finally {
    try { execFileSync('git', ['worktree', 'remove', '--force', worktree], { cwd: repo, stdio: 'ignore' }) } catch { /* 測試清理 */ }
    rmSync(root, { recursive: true, force: true })
  }
})

test('exit 0 但無新 commit → no-commit 失敗（純文字輸出下的唯一硬證據）', async () => {
  const { e } = makeEngine('ok', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: PLAIN_PROJECT })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('no-commit')
})

test('exit 非零 → ok:false、stderr 進 failureReason、costUnknown=true', async () => {
  const { e } = makeEngine('fail', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: PLAIN_PROJECT })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('quota exhausted')
  expect(r.costUnknown).toBe(true)
})

test('exit 0 零輸出 → ok:false（踩雷 §13）', async () => {
  const { e } = makeEngine('empty', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: PLAIN_PROJECT })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('empty')
})

test('超時 → 補刀 pkill 指令組裝正確：目標＝本次 run 的 marker，絕非寬鬆 pattern', async () => {
  const { e, logFile } = makeEngine('hang', ['aaa', 'aaa'], { timeoutMs: 1500 })
  const r = await e.run({ task: T, projectPath: PLAIN_PROJECT })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toBe('timeout')
  const calls = loggedCalls(logFile)
  expect(calls.length).toBe(2) // 第 1 次＝run 本體；第 2 次＝補刀
  // 1.1.4 契約：marker 在 prompt（-p 參數）內，從中萃取
  const marker = /adng-run-ab12cd34-[0-9a-f]{8}/.exec(calls[0]![calls[0]!.length - 1]!)?.[0]
  if (!marker) throw new Error('missing adng run marker')
  expect(marker).toMatch(/^adng-run-ab12cd34-[0-9a-f]{8}$/)
  expect(calls[1]).toEqual(buildKillArgs('Ubuntu', marker)) // pkill -f <本次 marker> 一字不差
}, 20_000)

test('--model 有設才加旗標；未設不出現', async () => {
  const withModel = makeEngine('ok', ['aaa', 'bbb'], { model: 'gemini-3-pro' })
  await withModel.e.run({ task: T, projectPath: PLAIN_PROJECT })
  const call = loggedCalls(withModel.logFile)[0]!
  expect(call[call.indexOf('--model') + 1]).toBe('gemini-3-pro')
  const without = makeEngine('ok', ['aaa', 'bbb'])
  await without.e.run({ task: T, projectPath: PLAIN_PROJECT })
  expect(loggedCalls(without.logFile)[0]).not.toContain('--model')
})

test('preflight：回聲含 PONG 判 ok，第二次走 cache（fake 改壞也不重打）', async () => {
  const { e } = makeEngine('ok', ['aaa'])
  const r1 = await e.preflight()
  expect(r1.ok).toBe(true)
  process.env.FAKE_MODE = 'fail'
  expect((await e.preflight()).ok).toBe(true) // cache 命中
})

test('preflight 失敗也寫 cache（不連環重打死引擎）', async () => {
  const { e } = makeEngine('fail', ['aaa'])
  expect((await e.preflight()).ok).toBe(false)
  process.env.FAKE_MODE = 'ok'
  expect((await e.preflight()).ok).toBe(false)
})

// ---------------------------------------------------------------------------
// 統一小修輪：marker hex 白名單校驗（#4）＋print-timeout 地板（#3）

test('小修輪#4：task.id 非 hex → run 拒組 pkill -f marker（防注入 pattern，defense-in-depth）', async () => {
  const { e } = makeEngine('ok', ['aaa', 'bbb'])
  const bad: Task = { id: 'evil; rm -rf /', text: 'x', line: 0, status: 'open' }
  await expect(e.run({ task: bad, projectPath: PLAIN_PROJECT })).rejects.toThrow(/非 hex/)
})

test('小修輪#3：print-timeout 地板 1s——wall<30s 時不再被舊 30s 地板頂破「print-timeout ≤ wall」不變式', async () => {
  // budgetMs = timeoutMs - 30s buffer = 5000-30000 = 負 → 地板生效。新地板 max(1,…)=1s（≤5s wall，守不變式）；
  // 舊地板 max(30,…) 會給 30s（>5s wall，破不變式）。
  const { e, logFile } = makeEngine('ok', ['aaa', 'bbb'], { timeoutMs: 5_000 })
  await e.run({ task: T, projectPath: PLAIN_PROJECT })
  const call = loggedCalls(logFile)[0]!
  const idx = call.indexOf('--print-timeout')
  expect(call[idx + 1]).toBe('1s')
})
