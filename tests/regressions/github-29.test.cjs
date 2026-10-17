'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')

// Static contract consistency only; this does not verify browser enforcement.
test('every ReturnReceipt disposition requires lease-end evidence', () => {
  const doc = readFileSync(join(__dirname, '../../docs/research/issue-28-browser-capability-lease.md'), 'utf8')
  const receipt = doc.match(/### 2\.3 `ReturnReceipt`\s+```jsonc\s+([\s\S]*?)```/)
  const evidence = doc.match(/^- lease 結束必須有 `([^`]+)` 證據/m)
  assert.ok(receipt, 'ReturnReceipt schema example must exist')
  assert.ok(evidence, 'lease-end evidence requirement must exist')
  const dispositions = JSON.parse(receipt[1]).disposition.split('|').map(value => value.trim())
  const required = evidence[1].split('/')
  for (const disposition of dispositions) {
    assert.ok(required.includes(disposition), `${disposition} must require lease-end evidence`)
  }
})
