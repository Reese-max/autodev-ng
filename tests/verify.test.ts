import { expect, test } from 'vitest'
import { formatVerifyFailureDetail } from '../src/engines/verify-detail.js'
import { runVerify } from '../src/verify.js'

const NODE = process.execPath

test('無 command → skip', async () => {
  const r = await runVerify({ command: undefined, cwd: process.cwd(), timeoutMs: 5000 })
  expect(r.status).toBe('skip')
})

test('exit 0 → pass', async () => {
  const r = await runVerify({ command: `"${NODE}" -e "process.exit(0)"`, cwd: process.cwd(), timeoutMs: 10_000 })
  expect(r.status).toBe('pass')
})

test('exit 1 → fail 且 detail 含輸出', async () => {
  const r = await runVerify({ command: `"${NODE}" -e "console.error('3 tests failed');process.exit(1)"`, cwd: process.cwd(), timeoutMs: 10_000 })
  expect(r.status).toBe('fail')
  expect(r.detail).toContain('3 tests failed')
})

test('verify fail detail：移除 ANSI、保留失敗行鄰近上下文與末尾統計', () => {
  const detail = formatVerifyFailureDetail(
    [
      'before failure',
      '\u001B[31mFAIL tests/verify.test.ts > failure\u001B[0m',
      'AssertionError: expected 1 to be 2',
      'after assertion',
      '✗ another failure',
      'after checkmark',
      '× third failure',
      'after cross'
    ].join('\n'),
    ['unrelated output', ' Test Files  1 failed', '      Tests  3 failed'].join('\n')
  )
  expect(detail).not.toContain('\u001B')
  expect(detail).toContain('before failure')
  expect(detail).toContain('AssertionError: expected 1 to be 2')
  expect(detail).toContain('✗ another failure')
  expect(detail).toContain('× third failure')
  expect(detail).not.toContain('unrelated output')
  expect(detail).toContain('Test Files  1 failed')
  expect(detail).toContain('Tests  3 failed')
})

test('verify fail detail：保留失敗與統計行且不超過 1000 字元', () => {
  const detail = formatVerifyFailureDetail(
    `FAIL tests/huge.test.ts > keeps the failure\n${'x'.repeat(1_200)}`,
    ' Test Files  1 failed\n      Tests  1 failed'
  )
  expect(detail.length).toBeLessThanOrEqual(1000)
  expect(detail).toContain('FAIL tests/huge.test.ts')
  expect(detail).toContain('Test Files  1 failed')
  expect(detail).toContain('Tests  1 failed')
})

test('verify fail detail：非 Vitest 無法辨識失敗行時，回退合併輸出尾段且清理 ANSI', () => {
  const stderr = `runner diagnostic\n${'x'.repeat(980)}\u001B[31mstderr tail\u001B[0m`
  const stdout = 'stdout tail'
  const detail = formatVerifyFailureDetail(stderr, stdout)

  expect(detail).toBe(`${stderr}\n${stdout}`.replace(/\u001B\[[0-9;]*m/g, '').slice(-1000))
  expect(detail.length).toBeLessThanOrEqual(1000)
  expect(detail).not.toContain('\u001B')
  expect(detail.endsWith('stderr tail\nstdout tail')).toBe(true)
})

test('timeout → skip 不算 fail（附 detail）', async () => {
  const r = await runVerify({ command: `"${NODE}" -e "setInterval(()=>{},1e3)"`, cwd: process.cwd(), timeoutMs: 1200 })
  expect(r.status).toBe('skip')
  expect(r.detail).toContain('timeout')
}, 15_000)

test('exit 9009/127（command not found）→ skip 不算 fail', async () => {
  const r9009 = await runVerify({ command: `"${NODE}" -e "process.exit(9009)"`, cwd: process.cwd(), timeoutMs: 10_000 })
  expect(r9009.status).toBe('skip')
  expect(r9009.detail).toContain('command-not-found')
  const r127 = await runVerify({ command: `"${NODE}" -e "process.exit(127)"`, cwd: process.cwd(), timeoutMs: 10_000 })
  expect(r127.status).toBe('skip')
})

test('指令不存在（bare name 亂打）→ skip 不算 fail', async () => {
  const r = await runVerify({ command: 'adng-no-such-tool-xyz --version', cwd: process.cwd(), timeoutMs: 15_000 })
  expect(r.status).toBe('skip')
}, 20_000)

test('對抗性反例：真測試失敗，stderr 引號開頭斷言 + 混入亂碼(U+FFFD) → 仍必須是 fail（不可誤放行成 skip）', async () => {
  const r = await runVerify({
    command: `"${NODE}" -e "console.error(\\"'expected' does not equal 'actual' \\uFFFD\\uFFFD\\");process.exit(1)"`,
    cwd: process.cwd(),
    timeoutMs: 10_000
  })
  expect(r.status).toBe('fail')
})

test('bare name 不存在（探測法）→ skip 且 detail 含 command-not-found', async () => {
  const r = await runVerify({ command: 'adng-no-such-tool-xyz --version', cwd: process.cwd(), timeoutMs: 15_000 })
  expect(r.status).toBe('skip')
  expect(r.detail).toContain('command-not-found')
}, 20_000)

test('含路徑分隔符但檔案不存在 → skip（探測法，existsSync 直接判斷）', async () => {
  const r = await runVerify({ command: 'C:/no/such/dir/tool.exe --x', cwd: process.cwd(), timeoutMs: 10_000 })
  expect(r.status).toBe('skip')
  expect(r.detail).toContain('command-not-found')
})
