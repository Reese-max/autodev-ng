'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const doc = readFileSync(join(__dirname, '../../docs/research/issue-28-browser-capability-lease.md'), 'utf8')

// Static contract consistency only; this does not verify browser enforcement.
test('every ReturnReceipt disposition requires lease-end evidence', () => {
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

test('lease origin allowlist uses complete canonical origins', () => {
  const allowlist = doc.match(/"originAllowlist":\s*(\[[^\n]+\])/)
  assert.ok(allowlist, 'lease origin allowlist must exist')
  const origins = JSON.parse(allowlist[1])
  assert.ok(origins.length > 0, 'lease origin allowlist must not be empty')
  for (const origin of origins) {
    assert.ok(URL.canParse(origin), `${origin} must be an absolute origin`)
    assert.equal(new URL(origin).origin, origin, 'scope must be an origin without credentials, path, query or fragment')
  }
})
