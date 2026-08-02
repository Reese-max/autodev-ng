import { expect, test } from 'vitest'
import { formatVerifyFailureDetail } from '../src/engines/verify-detail.js'

const ansi = (code: string, text: string) => `\u001B[${code}m${text}\u001B[0m`

test('ANSI 移除：Vitest 輸出保留失敗名稱、AssertionError 鄰近內容與末尾統計', () => {
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

test('FAIL、✗、×、AssertionError 與鄰近上下文都會被擷取且移除 ANSI', () => {
  const detail = formatVerifyFailureDetail('', [
    'before FAIL context',
    ansi('31', 'FAIL tests/fail.test.ts > rejects invalid input'),
    'after FAIL context',
    'before ✗ context',
    ansi('33', '✗ tests/cross.test.ts > rejects invalid input'),
    'after ✗ context',
    'before × context',
    ansi('35', '× tests/multiply.test.ts > rejects invalid input'),
    'after × context',
    'before AssertionError context',
    ansi('31', 'AssertionError: expected 401 to be 422'),
    'after AssertionError context',
    ansi('31', ' Test Files  4 failed | 0 passed (4)'),
    ansi('31', '      Tests  4 failed | 0 passed (4)'),
  ].join('\n'))

  for (const line of [
    'FAIL tests/fail.test.ts > rejects invalid input',
    '✗ tests/cross.test.ts > rejects invalid input',
    '× tests/multiply.test.ts > rejects invalid input',
    'AssertionError: expected 401 to be 422',
    'before FAIL context',
    'after FAIL context',
    'before ✗ context',
    'after ✗ context',
    'before × context',
    'after × context',
    'before AssertionError context',
    'after AssertionError context',
  ]) expect(detail).toContain(line)
  expect(detail).toContain('Test Files  4 failed | 0 passed (4)')
  expect(detail).toContain('Tests  4 failed | 0 passed (4)')
  expect(detail).not.toContain('\u001B')
  expect(detail.length).toBeLessThanOrEqual(1000)
})

test('超長 Vitest 鄰近行仍同時保留失敗名稱、AssertionError 與統計且不超過 1000 字', () => {
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

test('接近實際 Vitest 結構時，尾端通過列表不會擠掉失敗病灶', () => {
  const passed = Array.from({ length: 120 }, (_, i) => ansi('32', ` ✓ tests/passed-${i}.test.ts`)).join('\n')
  const detail = formatVerifyFailureDetail('', [
    '⎯⎯ Failed Tests 1 ⎯⎯',
    ansi('41;30', ' FAIL ') + ' ' + ansi('2', 'tests/cart.test.ts') + ' > checkout > rejects invalid total',
    ansi('31', 'AssertionError: expected 401 to be 422'),
    ' ❯ tests/cart.test.ts:42:9',
    '⎯⎯',
    passed,
    ansi('31', ' Test Files  1 failed | 120 passed (121)'),
    ansi('31', '      Tests  1 failed | 120 passed (121)'),
  ].join('\n'))

  expect(detail).toContain('tests/cart.test.ts > checkout > rejects invalid total')
  expect(detail).toContain('AssertionError: expected 401 to be 422')
  expect(detail).not.toContain('passed-0.test.ts')
  expect(detail).not.toContain('\u001B')
  expect(detail).toMatch(/Test Files  1 failed \| 120 passed \(121\)\n\s*Tests  1 failed \| 120 passed \(121\)$/)
  expect(detail.length).toBeLessThanOrEqual(1000)
})

test('保留最後一組 Test Files／Tests 統計並清除 C1 ANSI 序列', () => {
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

test('無失敗行時退回清理後合併輸出的尾 1000 字', () => {
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

test('空的非 Vitest 輸出回傳空 detail 且維持長度上限', () => {
  const detail = formatVerifyFailureDetail('', '')

  expect(detail).toBe('')
  expect(detail.length).toBeLessThanOrEqual(1000)
})
