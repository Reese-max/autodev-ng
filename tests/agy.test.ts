import { expect, test } from 'vitest'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { AgyEngine, buildKillArgs, toWslPath } from '../src/engines/agy.js'
import { PreflightCache } from '../src/preflight.js'
import type { Task } from '../src/types.js'

const FAKE = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'fake-wsl.mjs')
const T: Task = { id: 'ab12cd34', text: '修好登入頁', line: 0, status: 'open' }

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
  const cwd = process.cwd() // 真實存在目錄（spawn cwd 需存在）
  const r = await e.run({ task: T, projectPath: cwd })
  expect(r.ok).toBe(true)
  const call = loggedCalls(logFile)[0]!
  expect(call.slice(0, 7)).toEqual(['--cd', toWslPath(cwd), '-d', 'Ubuntu', '-u', 'root', '--'])
  expect(call[7]).toBe('/usr/local/bin/agy')
  expect(call).toContain('-p')
  expect(call).toContain('--dangerously-skip-permissions')
  expect(call[call.indexOf('--add-dir') + 1]).toBe(toWslPath(cwd)) // 真探針實證：缺 --add-dir 會跑去自家 scratch
  const ptIdx = call.indexOf('--print-timeout')
  expect(ptIdx).toBeGreaterThan(7)
  expect(call[ptIdx + 1]).toMatch(/^\d+s$/) // 明確設定，非放任預設 5m
  expect(call[call.length - 1]).toMatch(/^adng-run-ab12cd34-[0-9a-f]{8}$/) // marker 進 cmdline 供 pkill -f
})

test('--cd 路徑轉換：含空格的 projectPath 完整轉為 /mnt 形（單一 argv 元素）', async () => {
  const { e, logFile } = makeEngine('ok', ['aaa', 'bbb'])
  const spacedDir = mkdtempSync(join(tmpdir(), 'adng probe dir ')) // 真建含空格目錄
  await e.run({ task: T, projectPath: spacedDir })
  const call = loggedCalls(logFile)[0]!
  expect(call[1]).toBe(toWslPath(spacedDir))
  expect(call[1]).toMatch(/^\/mnt\/[a-z]\//)
  expect(call[1]).toContain(' ') // 空格保留在同一個 argv 元素內
})

test('prompt 走 stdin：任務文字、commit 硬話、run-id marker 都在（純文字回聲驗證）', async () => {
  const { e } = makeEngine('ok', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.output).toContain('修好登入頁')
  expect(r.output).toContain('git add -A')
  expect(r.output).toContain('adng-run-ab12cd34-')
})

test('成功＋commit hash 前進 → ok:true、costUsd 0、costUnknown 恆真（純文字無 usage）', async () => {
  const { e } = makeEngine('ok', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(true)
  expect(r.commitHash).toBe('bbb')
  expect(r.baseCommitHash).toBe('aaa')
  expect(r.costUsd).toBe(0)
  expect(r.costUnknown).toBe(true)
})

test('exit 0 但無新 commit → no-commit 失敗（純文字輸出下的唯一硬證據）', async () => {
  const { e } = makeEngine('ok', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('no-commit')
})

test('exit 非零 → ok:false、stderr 進 failureReason、costUnknown=true', async () => {
  const { e } = makeEngine('fail', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('quota exhausted')
  expect(r.costUnknown).toBe(true)
})

test('exit 0 零輸出 → ok:false（踩雷 §13）', async () => {
  const { e } = makeEngine('empty', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('empty')
})

test('超時 → 補刀 pkill 指令組裝正確：目標＝本次 run 的 marker，絕非寬鬆 pattern', async () => {
  const { e, logFile } = makeEngine('hang', ['aaa', 'aaa'], { timeoutMs: 1500 })
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toBe('timeout')
  const calls = loggedCalls(logFile)
  expect(calls.length).toBe(2) // 第 1 次＝run 本體；第 2 次＝補刀
  const marker = calls[0]![calls[0]!.length - 1]!
  expect(marker).toMatch(/^adng-run-ab12cd34-[0-9a-f]{8}$/)
  expect(calls[1]).toEqual(buildKillArgs('Ubuntu', marker)) // pkill -f <本次 marker> 一字不差
}, 20_000)

test('--model 有設才加旗標；未設不出現', async () => {
  const withModel = makeEngine('ok', ['aaa', 'bbb'], { model: 'gemini-3-pro' })
  await withModel.e.run({ task: T, projectPath: process.cwd() })
  const call = loggedCalls(withModel.logFile)[0]!
  expect(call[call.indexOf('--model') + 1]).toBe('gemini-3-pro')
  const without = makeEngine('ok', ['aaa', 'bbb'])
  await without.e.run({ task: T, projectPath: process.cwd() })
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
