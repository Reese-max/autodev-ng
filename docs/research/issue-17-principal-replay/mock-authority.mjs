// Research instrument only. Opaque fixture refs are not provider credentials.
import { readFileSync, writeFileSync, renameSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { Principal, Lease } from './schemas.mjs'
export const VERSION = 'principal-research/v1'
export const CAPABILITIES = ['LOCAL_FIXTURE_COMMIT', 'READ_METADATA']
export function digest(value) {
  const canonical = v => Array.isArray(v) ? v.map(canonical) : v && typeof v === 'object'
    ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canonical(v[k])])) : v
  return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex')
}
export function load(file) {
  const r = JSON.parse(readFileSync(file, 'utf8'))
  if (r.schemaVersion !== VERSION || !Array.isArray(r.principals) || !Array.isArray(r.leases) || !Array.isArray(r.usedExecutions)) throw Error('INVALID_REGISTRY')
  for (const p of r.principals) {
    Principal.parse(p)
    const required = ['schemaVersion','principalId','ownerRef','role','engineTag','runtimeFingerprint','lifecycle','identityIsolation','credentialBinding','parentPrincipalId','capabilities']
    if (Object.keys(p).sort().join() !== required.sort().join() || !p.principalId || !p.ownerRef || !p.runtimeFingerprint
      || p.schemaVersion !== VERSION || !['ACTIVE','SUSPENDED','REVOKED','EXPIRED'].includes(p.lifecycle)
      || !['MOCK_DEDICATED','SHARED','UNKNOWN'].includes(p.identityIsolation)
      || !['MOCK_REFERENCE','SHARED_REFERENCE','UNKNOWN'].includes(p.credentialBinding)
      || !p.capabilities.every(c => CAPABILITIES.includes(c))) throw Error('INVALID_PRINCIPAL')
  }
  for (const l of r.leases) {
    Lease.parse(l)
    const keys=['schemaVersion','leaseId','principalId','executionId','credentialRef','notBeforeMs','expiresAtMs','capabilities']
    if (Object.keys(l).sort().join() !== keys.sort().join() || !l.credentialRef.startsWith('fixture-ref:')
      || l.schemaVersion !== VERSION || !Number.isSafeInteger(l.notBeforeMs) || !Number.isSafeInteger(l.expiresAtMs)
      || l.expiresAtMs <= l.notBeforeMs || !l.capabilities.every(c => CAPABILITIES.includes(c))) throw Error('INVALID_LEASE')
  }
  if (new Set(r.principals.map(p=>p.principalId)).size !== r.principals.length || new Set(r.leases.map(l=>l.leaseId)).size !== r.leases.length) throw Error('DUPLICATE_IDENTITY')
  return r
}
export function save(file, registry) {
  const temporary = file + '.tmp'
  writeFileSync(temporary, JSON.stringify(registry, null, 2) + '\n', {mode:0o600})
  renameSync(temporary, file)
  load(file)
}
export function evaluate(r, principalId, executionId, leaseId, action, now = Date.now()) {
  const principal = r.principals.find(p=>p.principalId===principalId)
  if (!principal) return 'PRINCIPAL_UNKNOWN'
  if (principal.identityIsolation !== 'MOCK_DEDICATED') return 'SHARED_IDENTITY_UNENFORCEABLE'
  if (principal.lifecycle !== 'ACTIVE') return 'PRINCIPAL_' + principal.lifecycle
  let parent = principal
  const seen = new Set([principalId])
  while (parent.parentPrincipalId) {
    parent = r.principals.find(p=>p.principalId===parent.parentPrincipalId)
    if (!parent || seen.has(parent.principalId) || parent.lifecycle !== 'ACTIVE') return 'PARENT_INVALID'
    seen.add(parent.principalId)
    if (!principal.capabilities.every(c=>parent.capabilities.includes(c))) return 'CHILD_SCOPE_ESCALATION'
  }
  const lease = r.leases.find(l=>l.leaseId===leaseId)
  if (!lease || lease.principalId !== principalId || lease.executionId !== executionId) return 'LEASE_BINDING_MISMATCH'
  if (now < lease.notBeforeMs || now >= lease.expiresAtMs) return 'LEASE_EXPIRED'
  if (r.usedExecutions.includes(executionId)) return 'EXECUTION_REPLAY'
  if (!lease.capabilities.every(c=>principal.capabilities.includes(c)) || !lease.capabilities.includes(action)) return 'CAPABILITY_DENIED'
  return 'ALLOW_MOCK_AUTHORITY_ONLY'
}
export function addChild(r, parentId, child) {
  const parent = r.principals.find(p=>p.principalId===parentId)
  if (!parent || parent.lifecycle !== 'ACTIVE' || child.parentPrincipalId !== parentId
    || child.ownerRef !== parent.ownerRef || child.credentialBinding !== parent.credentialBinding
    || !child.capabilities.every(c=>parent.capabilities.includes(c))) throw Error('CHILD_SCOPE_ESCALATION')
  r.principals.push(child)
}
if (process.argv[2] === 'admin') {
  const [file, operation, id] = process.argv.slice(3)
  const r = load(file)
  if (operation === 'create-child') {
    const q=JSON.parse(readFileSync(id,'utf8'))
    Principal.parse(q.principal);Lease.parse(q.lease)
    if(q.policyGrant!=='EXPLICIT_MOCK_CHILD_SUBSET' || q.lease.principalId!==q.principal.principalId || !q.lease.capabilities.every(c=>q.principal.capabilities.includes(c)))throw Error('INVALID_EXPLICIT_CHILD_GRANT')
    addChild(r,q.principal.parentPrincipalId,q.principal);r.leases.push(q.lease)
    r.grantReceipts??=[];r.grantReceipts.push({schemaVersion:VERSION,parentPrincipalId:q.principal.parentPrincipalId,principalId:q.principal.principalId,policyDigest:digest(q),scope:'MOCK_AUTHORITY_ONLY'})
  }
  else if (operation === 'revoke') r.principals.find(p=>p.principalId===id).lifecycle='REVOKED'
  else if (operation === 'expire') r.leases.find(l=>l.leaseId===id).expiresAtMs=Date.now()-1
  else throw Error('UNKNOWN_ADMIN_OPERATION')
  save(file,r)
  process.stdout.write(JSON.stringify({schemaVersion:VERSION,operation,id,registryDigest:digest(r)})+'\n')
}
