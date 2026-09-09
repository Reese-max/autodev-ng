import { expect, test } from 'vitest'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ClaudeCliEngine } from '../src/engines/claude-cli.js'
import { PreflightCache } from '../src/preflight.js'
import type { Task } from '../src/types.js'

const FAKE = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'fake-cli.mjs')
const T: Task = { id: 'ab12cd34', text: '修好登入頁', line: 0, status: 'open' }

function engine(mode: string, hashes: (string | undefined)[], timeoutMs = 10_000): ClaudeCliEngine {
  process.env.FAKE_MODE = mode
  const cache = new PreflightCache(join(mkdtempSync(join(tmpdir(), 'adng-cc-')), 'pf.json'))
  let i = 0
  return new ClaudeCliEngine({
    command: process.execPath, baseArgs: [FAKE], timeoutMs, pingTimeoutMs: 10_000,
    cache, getCommitHash: () => hashes[Math.min(i++, hashes.length - 1)]
  })
}

test('成功+有新 commit → ok、cost、commitHash、costUnknown 不設（真值可信，非估計）', async () => {
  const e = engine('ok', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(true)
  expect(r.costUsd).toBeCloseTo(0.123)
  expect(r.commitHash).toBe('bbb')
  expect(r.costUnknown).toBeFalsy()
})

test('成功但無新 commit → 降級 phantom completion，costUnknown 不設（total_cost_usd 已真實解出）', async () => {
  const e = engine('ok', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('no-commit')
  expect(r.costUnknown).toBeFalsy()
})

test('exit 非零 → ok:false 且 stderr 進 failureReason、costUnknown=true（真花錢前必修：真實成本未知不可記 0）', async () => {
  const e = engine('fail', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('simulated 429')
  expect(r.costUsd).toBe(0)
  expect(r.costUnknown).toBe(true)
})

test('exit 0 空輸出 → ok:false（踩雷 §13）、costUnknown=true', async () => {
  const e = engine('empty', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('empty')
  expect(r.costUsd).toBe(0)
  expect(r.costUnknown).toBe(true)
})

test('hang → timeout、costUsd 0、costUnknown=true（timeout 輪其實照樣燒錢，不可記真 0）', async () => {
  const e = engine('hang', ['aaa', 'aaa'], 1500)
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toBe('timeout')
  expect(r.costUsd).toBe(0)
  expect(r.costUnknown).toBe(true)
}, 15_000)

// Fix 1（M4 run-once 首跑缺陷）：fake-cli 會把收到的 stdin 前段回聲進 result JSON，
// r.output（stdout tail）因此可用來驗證「prompt 實際含什麼」——不用真打 CLI。
test('Fix 1：job.directive 有值時 prompt 採用 directive（extraDirective 真的進 prompt）', async () => {
  const e = engine('ok', ['aaa', 'bbb'])
  const r = await e.run({
    task: T, projectPath: process.cwd(),
    directive: '修好登入頁\n\nDIRECTIVE-MARKER：port 3210 是使用者的進程，不要殺'
  })
  expect(r.output).toContain('DIRECTIVE-MARKER')
})

test('Fix 1：job.directive 未設時 fallback 用 task.text（不退化）', async () => {
  const e = engine('ok', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.output).toContain('修好登入頁')
})

test('Fix 3：prompt 明示必須自行 git add/commit、沒 commit 整輪作廢', async () => {
  const e = engine('ok', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.output).toContain('git add -A')
  expect(r.output).toContain('整輪作廢')
})

test('preflight：PONG 判 ok 且第二次走 cache（fake 只被叫一次）', async () => {
  const e = engine('ok', ['a'])
  const r1 = await e.preflight()
  expect(r1.ok).toBe(true)
  process.env.FAKE_MODE = 'fail' // 若第二次真的打 CLI 會變 fail——用這招驗證 cache 命中
  const r2 = await e.preflight()
  expect(r2.ok).toBe(true)
})

test('preflight 失敗也寫 cache（不連環重打）', async () => {
  const e = engine('fail', ['a'])
  expect((await e.preflight()).ok).toBe(false)
  process.env.FAKE_MODE = 'ok'
  expect((await e.preflight()).ok).toBe(false) // 仍是 cache 的壞結果
})

// ---------------------------------------------------------------------------
// M5 Task 1：env / model 檔位（m3＝claude CLI＋MiniMax 相容端點）

function inlineEngine(script: string, opts: { env?: Record<string, string>; model?: string } = {}): ClaudeCliEngine {
  const cache = new PreflightCache(join(mkdtempSync(join(tmpdir(), 'adng-cc-')), 'pf.json'))
  let i = 0
  const hashes = ['aaa', 'bbb']
  return new ClaudeCliEngine({
    // baseArgs 尾加 `--`：node -e 之後引擎追加的旗標（如 --model）需以 -- 分隔
    // 才會落到 process.argv，而不是被 node 當自己的選項吃掉。
    command: process.execPath, baseArgs: ['-e', script, '--'], timeoutMs: 10_000, pingTimeoutMs: 10_000,
    cache, getCommitHash: () => hashes[Math.min(i++, hashes.length - 1)], ...opts
  })
}

test('nonzero exit retains API errors emitted only in stdout JSON', async () => {
  const e = inlineEngine('process.stdin.resume(); process.stdin.on("end", () => { console.log(JSON.stringify({is_error:true,result:"ConnectionRefused"})); process.exitCode=1 })')
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('ConnectionRefused')
  expect(r.costUnknown).toBe(true)
})

test('M5：opts.env 透傳到 CLI 子進程（值只進子進程環境，不經 argv/log）', async () => {
  const script = 'process.stdin.resume(); process.stdin.on("end", () => console.log(JSON.stringify({ total_cost_usd: 0.01, envSeen: process.env.ADNG_FAKE_TOKEN ?? "(unset)" })))'
  const e = inlineEngine(script, { env: { ADNG_FAKE_TOKEN: 'sk-fake-not-a-real-key' } })
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(true)
  expect(r.output).toContain('sk-fake-not-a-real-key') // 子進程真的看得到注入的 env
})

test('M5：opts.model → CLI args 追加 --model <model>；未設不加旗標', async () => {
  const script = 'process.stdin.resume(); process.stdin.on("end", () => console.log(JSON.stringify({ total_cost_usd: 0.01, argv: process.argv.slice(1) })))'
  const withModel = await inlineEngine(script, { model: 'MiniMax-M3' }).run({ task: T, projectPath: process.cwd() })
  expect(withModel.output).toContain('--model')
  expect(withModel.output).toContain('MiniMax-M3')
  const without = await inlineEngine(script).run({ task: T, projectPath: process.cwd() })
  expect(without.output).not.toContain('--model')
})

test('M5：opts.id override（registry 以 tag 區分同 adapter 多檔位）；未設維持 claude-cli', () => {
  const cache = new PreflightCache(join(mkdtempSync(join(tmpdir(), 'adng-cc-')), 'pf.json'))
  expect(new ClaudeCliEngine({ cache, id: 'claude-cli:m3' }).id).toBe('claude-cli:m3')
  expect(new ClaudeCliEngine({ cache }).id).toBe('claude-cli')
})
