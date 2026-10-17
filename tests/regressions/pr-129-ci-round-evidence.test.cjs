const test = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')

test('issue #13 preserves the distinct failure totals from both original CI rounds', () => {
  const document = readFileSync(join(__dirname, '../../docs/flaky-ci-regression-2026-09-10.md'), 'utf8')
  const rounds = document.split(/\r?\n/).map(line => line.split('|').map(cell => cell.trim()))
    .filter(cells => /^[12]\/2$/.test(cells[1] ?? '') && cells[2]?.includes('failed'))
    .map(cells => cells.slice(1, -1))
  // Original Windows CI job 102846569277, round summaries at log lines 192-193 and 303-304.
  assert.deepEqual(rounds, [
    ['1/2', '4 failed / 197 passed (201)', '6 failed / 1,971 passed (1,977)', '1', 'false'],
    ['2/2', '3 failed / 198 passed (201)', '5 failed / 1,972 passed (1,977)', '1', 'false'],
  ])
})
