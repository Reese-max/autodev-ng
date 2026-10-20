'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const doc = readFileSync(join(__dirname, '../../docs/research/issue-28-browser-capability-lease.md'), 'utf8')
const fixtures = JSON.parse(readFileSync(join(__dirname, '../fixtures/browser-capability-lease-v1.json'), 'utf8'))
const scoped = { ...fixtures.fixtures.find(f => f.id === 'scoped-tab-lease'), surface: 'existing-tab', capability: 'SUPPORTED' }
function freshActionContext(f = scoped) {
  return {
    now: '2026-10-21T00:00:30Z',
    lease: { leaseId: 'bcl_1', executionId: 'exec_1', leaseGeneration: 1, nextActionSequence: 1, granted: { expiresAt: '2026-10-21T00:02:00Z' } },
    action: { leaseId: 'bcl_1', executionId: 'exec_1', leaseGeneration: 1, sequence: 1, actionClass: f.action, tab: f.tab, origin: f.origin, deadline: '2026-10-21T00:01:00Z' }
  }
}

// Offline reference policy only; this does not verify production browser enforcement.
function decision(f, context) {
  if (Object.hasOwn(f, 'receiptDisposition') || f.state === 'EXPIRED' || f.state === 'UNKNOWN') {
    const disposition = f.receiptDisposition
    const matchingState = disposition === f.state || (disposition === 'RETURNED' && f.state === 'TAKEN_OVER')
    const verified = ['RETURNED', 'EXPIRED', 'REVOKED'].includes(disposition) && matchingState &&
      f.verification === 'VERIFIED' && f.ambientAuthorityDropped === true &&
      Array.isArray(f.evidenceRefs) && f.evidenceRefs.length > 0 && f.evidenceRefs.every(ref => {
        const evidence = Object.hasOwn(fixtures.evidence, ref) && fixtures.evidence[ref]
        return evidence && evidence.leaseId === f.leaseId && evidence.disposition === disposition &&
          evidence.verification === 'VERIFIED' && evidence.ambientAuthorityDropped === true
      })
    return verified ? `RECEIPT_${disposition}` : 'RECEIPT_UNKNOWN'
  }
  if (f.state === 'TAKEN_OVER' && f.domFresh === false) return 'DENY_FRESH_OBSERVATION'
  if (f.state === 'REVOKED' || f.state === 'TAKEN_OVER') return 'DENY_INACTIVE'
  if (f.domFresh === false) return 'DENY_FRESH_OBSERVATION'
  if (!['existing-tab', 'new-tab'].includes(f.surface) || typeof f.tab !== 'string' || !f.tab ||
    f.tab !== f.activeTab || !Array.isArray(f.allowedOrigins) || !f.allowedOrigins.includes(f.origin)) return 'OUT_OF_SCOPE'
  if (typeof f.origin !== 'string' || !URL.canParse(f.origin) || new URL(f.origin).origin !== f.origin) return 'OUT_OF_SCOPE'
  if (f.capability !== 'SUPPORTED') return 'DENY_CAPABILITY'
  if (f.state === 'CONNECTED_READONLY' && ['navigate', 'click', 'fill-form-field'].includes(f.action)) return 'DENY_READONLY'
  if (f.state !== 'CONTROL_ACTIVE' || typeof f.action !== 'string' || !f.action ||
    !Array.isArray(f.allowedActions) || !f.allowedActions.includes(f.action)) return 'DENY_INACTIVE'
  if (!context?.lease || !context.action) return 'DENY_STALE'
  const lease = context.lease
  const action = { ...context.action, ...f.envelope }
  if (['leaseId', 'executionId'].some(key => typeof lease[key] !== 'string' || !lease[key] || action[key] !== lease[key]) ||
    !Number.isSafeInteger(lease.leaseGeneration) || lease.leaseGeneration < 1 || action.leaseGeneration !== lease.leaseGeneration ||
    !Number.isSafeInteger(lease.nextActionSequence) || lease.nextActionSequence < 1 || action.sequence !== lease.nextActionSequence ||
    action.actionClass !== f.action || action.tab !== f.tab || action.origin !== f.origin) return 'DENY_STALE'
  const times = [context.now, lease.granted?.expiresAt, action.deadline]
  if (!times.every(value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(value))) return 'DENY_EXPIRED'
  const [now, expiry, deadline] = times.map(Date.parse)
  if (![now, expiry, deadline].every(Number.isFinite) || now >= expiry || now >= deadline || deadline > expiry) return 'DENY_EXPIRED'
  if (f.pageRequestedOrigin && !f.allowedOrigins.includes(f.pageRequestedOrigin)) return 'DENY_SCOPE_WIDENING'
  if (f.duplicateSubmit && !f.canonicalAbsenceConfirmed) return 'EFFECT_UNKNOWN'
  if (f.protectedEffect || f.effectful || ['click', 'upload'].includes(f.action)) {
    if (f.effectDecision === 'DENY') return 'DENY_EFFECT'
    if (f.protectedEffect || f.effectDecision === 'ASK') return 'HANDOFF'
    if (f.effectDecision !== 'ALLOW' || !Array.isArray(f.effectRefs) || !f.effectRefs.length ||
      !f.effectRefs.every(ref => typeof ref === 'string' && ref.trim())) return 'DENY_EFFECT'
  }
  lease.nextActionSequence++
  return 'ALLOW'
}

// Vectors are independent leases; replay tests retain and reuse an explicit context.
const fixtureDecision = f => decision(f, freshActionContext(f))

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
    assert.equal(fixtureDecision(fixture), fixture.expected, fixture.id)
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

test('external effect decisions cannot be upgraded by a browser lease', () => {
  const click = { ...scoped, action: 'click', allowedActions: ['click'], effectRefs: ['effect_1'] }
  for (const effectDecision of ['DENY', 'UNENFORCED', 'UNKNOWN', undefined]) {
    assert.equal(fixtureDecision({ ...click, effectDecision }), 'DENY_EFFECT', String(effectDecision))
  }
  assert.equal(fixtureDecision({ ...click, effectDecision: 'ASK' }), 'HANDOFF')
  assert.equal(fixtureDecision({ ...click, effectDecision: 'ALLOW', effectRefs: [] }), 'DENY_EFFECT')
  assert.equal(fixtureDecision({ ...click, effectDecision: 'ALLOW' }), 'ALLOW')
  for (const effectDecision of ['ALLOW', 'ASK', undefined]) {
    assert.equal(fixtureDecision({ ...click, protectedEffect: true, effectDecision }), 'HANDOFF')
  }
  assert.equal(fixtureDecision({ ...click, protectedEffect: true, effectDecision: 'DENY' }), 'DENY_EFFECT')
  assert.equal(fixtureDecision({ ...scoped, action: 'fill-form-field', allowedActions: ['fill-form-field'], effectful: true, effectDecision: 'DENY' }), 'DENY_EFFECT')
})

test('action bindings expire and are consumed once across resume and replay', () => {
  assert.equal(decision(scoped), 'DENY_STALE', 'dispatch requires an explicit retained context')
  for (const field of ['leaseId', 'executionId', 'leaseGeneration', 'sequence', 'actionClass', 'tab', 'origin']) {
    const context = freshActionContext()
    context.action[field] = typeof context.action[field] === 'number' ? 2 : 'old'
    assert.equal(decision(scoped, context), 'DENY_STALE', field)
    assert.equal(context.lease.nextActionSequence, 1)
  }
  for (const now of ['2026-10-21T00:01:00Z', '2026-10-21T00:02:00Z', 'invalid']) {
    const context = freshActionContext()
    context.now = now
    assert.equal(decision(scoped, context), 'DENY_EXPIRED', now)
  }
  for (const deadline of ['2026-10-21T00:03:00Z', 'invalid', undefined]) {
    const context = freshActionContext()
    context.action.deadline = deadline
    assert.equal(decision(scoped, context), 'DENY_EXPIRED', String(deadline))
  }
  const context = freshActionContext()
  assert.equal(decision(scoped, context), 'ALLOW')
  assert.equal(context.lease.nextActionSequence, 2)
  assert.equal(decision(scoped, context), 'DENY_STALE')
  context.action.sequence = 2
  assert.equal(decision(scoped, context), 'ALLOW')
  context.lease.executionId = 'exec_restarted'
  context.action.sequence = 3
  assert.equal(decision(scoped, context), 'DENY_STALE')
})

test('unknown capabilities and non-tab surfaces fail closed', () => {
  for (const action of [undefined, null, '']) {
    assert.equal(fixtureDecision({ ...scoped, action, allowedActions: [action] }), 'DENY_INACTIVE', String(action))
  }
  for (const surface of ['window', 'profile', 'unknown', undefined]) {
    assert.equal(fixtureDecision({ ...scoped, surface }), 'OUT_OF_SCOPE', String(surface))
  }
  for (const capability of ['UNKNOWN', 'UNSUPPORTED', 'unexpected', undefined]) {
    assert.equal(fixtureDecision({ ...scoped, capability }), 'DENY_CAPABILITY', String(capability))
  }
  assert.equal(fixtureDecision({ ...scoped, tab: undefined, activeTab: undefined }), 'OUT_OF_SCOPE')
  for (const origin of [undefined, 'github.com', 'https://example.test/', 'https://user@example.test', 'https://example.test?x=1', 'https://example.test:443', 'data:text/plain,test']) {
    assert.equal(fixtureDecision({ ...scoped, origin, allowedOrigins: [origin] }), 'OUT_OF_SCOPE', String(origin))
  }
  assert.equal(fixtureDecision(scoped), 'ALLOW')
})

test('lease end claims require matching verified metadata evidence', () => {
  const receipt = { ...fixtures.fixtures.find(f => f.id === 'no-secret-evidence'), leaseId: 'bcl_1', ambientAuthorityDropped: true }
  for (const change of [
    { verification: 'UNVERIFIED' }, { ambientAuthorityDropped: false },
    { state: 'UNKNOWN' }, { receiptDisposition: 'unexpected' },
    { leaseId: 'bcl_other' }, { evidenceRefs: [] },
    { evidenceRefs: ['meta:missing'] }, { evidenceRefs: ['artifact:raw-dom'] }
  ]) {
    assert.equal(decision({ ...receipt, ...change }), 'RECEIPT_UNKNOWN', JSON.stringify(change))
  }
  assert.equal(decision({ state: 'EXPIRED' }), 'RECEIPT_UNKNOWN')
  assert.equal(decision(receipt), 'RECEIPT_RETURNED')
})
