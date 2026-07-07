import { expect, test } from 'vitest'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { runProcess } from '../src/proc.js'

const FAKE = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'fake-cli.mjs')
const base = { command: process.execPath, args: [FAKE], cwd: process.cwd(), timeoutMs: 10_000 }

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

test('timeout 後 resolve 時間 < timeoutMs + 4s（強制 settle timer 不再拖尾事件迴圈）', async () => {
  process.env.FAKE_MODE = 'hang'
  const timeoutMs = 1000
  const t0 = Date.now()
  const r = await runProcess({ ...base, stdinText: 'x', timeoutMs })
  const elapsed = Date.now() - t0
  expect(r.timedOut).toBe(true)
  expect(elapsed).toBeLessThan(timeoutMs + 4000)
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
