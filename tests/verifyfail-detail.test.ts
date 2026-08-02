import { expect, test } from 'vitest'
import { formatVerifyFailureDetail } from '../src/engines/verify-detail.js'

const ansi = (code: string, text: string) => `\u001B[${code}m${text}\u001B[0m`

test('ANSI Vitest 輸出保留失敗名稱、AssertionError 鄰近內容與末尾統計', () => {
  const passed = Array.from({ length: 80 }, (_, i) => ansi('32', ` ✓ tests/passed-${i}.test.ts`)).join('\n')
  const detail = formatVerifyFailureDetail('', [
    passed,
    ansi('41;30', ' FAIL ') + ' ' + ansi('2', 'tests/payment.test.ts') + ' > checkout > rejects invalid total',
    'AssertionError: expected 401 to be 422',
    'expected response status to match',
    ansi('31', ' Test Files  1 failed | 80 passed (81)'),
    ansi('31', '      Tests  1 failed | 80 passed (81)'),
  ].join('\n'))

  expect(detail).toContain('tests/payment.test.ts > checkout > rejects invalid total')
  expect(detail).toContain('AssertionError: expected 401 to be 422')
  expect(detail).toContain('expected response status to match')
  expect(detail).toContain('Test Files  1 failed | 80 passed (81)')
  expect(detail).toContain('Tests  1 failed | 80 passed (81)')
  expect(detail).not.toContain('passed-0.test.ts')
  expect(detail).not.toContain('\u001B')
  expect(detail.length).toBeLessThanOrEqual(1000)
})

test('超長 Vitest 鄰近行仍同時保留失敗名稱、AssertionError 與統計', () => {
  const detail = formatVerifyFailureDetail([
    'FAIL tests/oversized.test.ts > suite > keeps useful diagnostics',
    `debug payload: ${'x'.repeat(1_200)}`,
    'AssertionError: expected false to be true',
    'at tests/oversized.test.ts:42:7',
  ].join('\n'), [
    ' Test Files  1 failed | 2 passed (3)',
    '      Tests  1 failed | 4 passed (5)',
  ].join('\n'))

  expect(detail).toContain('FAIL tests/oversized.test.ts > suite > keeps useful diagnostics')
  expect(detail).toContain('AssertionError: expected false to be true')
  expect(detail).toContain('Test Files  1 failed | 2 passed (3)')
  expect(detail).toContain('Tests  1 failed | 4 passed (5)')
  expect(detail.length).toBeLessThanOrEqual(1000)
})

test('清除 C1 ANSI 序列，只把最後一組統計附加在 detail 末尾', () => {
  const detail = formatVerifyFailureDetail('', [
    '\u009B31mFAIL tests/first.test.ts > first\u009B0m',
    'first context',
    ' Test Files  2 failed | 1 passed (3)',
    '      Tests  2 failed | 1 passed (3)',
    'retrying',
    '× tests/final.test.ts > final',
    'final context',
    ' Test Files  1 failed | 2 passed (3)',
    '      Tests  1 failed | 2 passed (3)',
  ].join('\n'))

  expect(detail).not.toContain('\u009B')
  expect(detail).not.toContain('2 failed | 1 passed')
  expect(detail).toContain('FAIL tests/first.test.ts > first')
  expect(detail).toContain('× tests/final.test.ts > final')
  expect(detail).toMatch(/Test Files  1 failed \| 2 passed \(3\)\n\s*Tests  1 failed \| 2 passed \(3\)$/)
})

test('非 Vitest 且無失敗標記時回退清理後的合併輸出尾段', () => {
  const stderr = `compiler prelude\n${'e'.repeat(1_050)}${ansi('31', 'stderr tail')}`
  const stdout = `${'o'.repeat(80)}\nstdout tail`
  const clean = `${stderr}\n${stdout}`.replace(/\u001B\[[0-9;]*m/g, '')
  const detail = formatVerifyFailureDetail(stderr, stdout)

  expect(detail).toBe(clean.slice(-1000))
  expect(detail).toContain('stderr tail')
  expect(detail).toContain('stdout tail')
  expect(detail).not.toContain('\u001B')
  expect(detail.length).toBeLessThanOrEqual(1000)
})
