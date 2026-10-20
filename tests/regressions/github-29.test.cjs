'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const doc = readFileSync(join(__dirname, '../../docs/research/issue-28-browser-capability-lease.md'), 'utf8')
const fixtures = JSON.parse(readFileSync(join(__dirname, '../fixtures/browser-capability-lease-v1.json'), 'utf8'))

// Offline reference policy only; this does not verify production browser enforcement.
function decision(f) {
  if (f.receiptDisposition) return `RECEIPT_${f.receiptDisposition}`
  if (f.state === 'EXPIRED') return 'RECEIPT_EXPIRED'
  if (f.state === 'UNKNOWN') return 'RECEIPT_UNKNOWN'
  if (f.state === 'TAKEN_OVER' && f.domFresh === false) return 'DENY_FRESH_OBSERVATION'
  if (f.state === 'REVOKED' || f.state === 'TAKEN_OVER') return 'DENY_INACTIVE'
  if (f.executionMatches === false) return 'DENY_STALE'
  if (f.domFresh === false) return 'DENY_FRESH_OBSERVATION'
  if (f.surface === 'profile' || f.tab !== f.activeTab || !f.allowedOrigins.includes(f.origin)) return 'OUT_OF_SCOPE'
  if (f.state === 'CONNECTED_READONLY' && ['navigate', 'click', 'fill-form-field'].includes(f.action)) return 'DENY_READONLY'
  if (f.pageRequestedOrigin && !f.allowedOrigins.includes(f.pageRequestedOrigin)) return 'DENY_SCOPE_WIDENING'
  if (f.duplicateSubmit && !f.canonicalAbsenceConfirmed) return 'EFFECT_UNKNOWN'
  if (f.protectedEffect && f.effectDecision === 'human-required') return 'HANDOFF'
  if (f.state !== 'CONTROL_ACTIVE' || !f.allowedActions.includes(f.action)) return 'DENY_INACTIVE'
  return 'ALLOW'
}

test('versioned browser contracts and lifecycle safeguards are documented', () => {
  for (const name of ['BrowserCapabilityObservation', 'BrowserCapabilityRequest', 'BrowserCapabilityLease', 'BrowserLeaseReceipt']) {
    assert.match(doc, new RegExp(`\\\"schema\\\": \\\"${name}\\\"`), `${name} v1 schema must be present`)
  }
  for (const required of ['CONNECTED_READONLY', 'CONTROL_ACTIVE', 'UNKNOWN', 'leaseGeneration', 'nextActionSequence', 'TAKEN_OVER', 'EFFECT_UNKNOWN', 'ExternalEffectSpec', 'evidenceRefs', 'exact origins']) {
    assert.ok(doc.includes(required), `contract must define ${required}`)
  }
})

test('lease origin allowlist uses complete canonical origins', () => {
  const origin = 'https://github.com'
  assert.equal(URL.canParse(origin), true)
  assert.equal(new URL(origin).origin, origin)
  assert.match(doc, /"origins": \["https:\/\/github\.com"\]/)
})

test('synthetic inventory fixtures execute their expected policy outcomes', () => {
  assert.deepEqual(fixtures.inventory, {
    mode: 'readonly-synthetic', network: false, realBrowser: false, realProfile: false,
    realCredentials: false, fields: ['opaqueTabId', 'origin', 'capability', 'connection', 'sharedAuth', 'observedAt'],
    tabs: [{ opaqueTabId: 'tab_1', origin: 'https://example.test', capability: 'SUPPORTED', connection: 'CONTROL_ACTIVE', sharedAuth: 'USER_SESSION', observedAt: '2026-10-21T00:00:00Z' }, { opaqueTabId: 'tab_2', origin: 'https://example.test', capability: 'SUPPORTED', connection: 'CONNECTED_READONLY', sharedAuth: 'USER_SESSION', observedAt: '2026-10-21T00:00:00Z' }]
  })
  assert.ok(fixtures.fixtures.length >= 12)
  for (const fixture of fixtures.fixtures) {
    assert.equal(decision(fixture), fixture.expected, fixture.id)
  }
  for (const id of ['sibling-tab-denied', 'profile-denied', 'readonly-control-denied', 'stale-replay-denied', 'revoked-action-denied', 'takeover-freshness', 'protected-effect-handoff', 'page-injection-cannot-widen', 'ambiguous-submit-no-retry', 'redirect-out-of-scope', 'lease-expiry-receipt', 'bridge-loss-unknown', 'no-secret-evidence']) {
    assert.ok(fixtures.fixtures.some(f => f.id === id), `missing fixture ${id}`)
  }
})

test('receipt dispositions all have an honest lease-end evidence path', () => {
  const dispositions = ['RETURNED', 'EXPIRED', 'REVOKED', 'UNKNOWN']
  for (const value of dispositions) assert.ok(doc.includes(value), `receipt must support ${value}`)
  assert.match(doc, /`TAKEN_OVER` always terminates the agent lease and requires this same receipt path/)
})
