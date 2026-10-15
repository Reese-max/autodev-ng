import { createRequire } from 'node:module'
import { basename, join } from 'node:path'
// Resolve the repository's existing Zod dependency, including in actual MCP children.
const entry=basename(process.argv[1]||'')
const source=process.env.RESEARCH_SOURCE||(entry==='replay.mjs'?process.argv[2]:entry==='mock-mcp.mjs'?process.argv[4]:entry==='mock-authority.mjs'?process.argv[6]:undefined)||'/workspace/repos/autodev-principal-research'
const { z }=createRequire(join(source,'package.json'))('zod')
const version=z.literal('principal-research/v1'),id=z.string().regex(/^[A-Za-z0-9-]{1,80}$/),hash=z.string().regex(/^[a-f0-9]{64}$/)
const capabilities=z.array(z.enum(['LOCAL_FIXTURE_COMMIT','READ_METADATA'])).max(2)
export const Principal=z.object({schemaVersion:version,principalId:id,ownerRef:z.literal('fixture-owner:human-boundary-unmodified'),role:z.literal('offline-research-worker'),engineTag:z.literal('freebuff'),runtimeFingerprint:hash,lifecycle:z.enum(['ACTIVE','SUSPENDED','REVOKED','EXPIRED']),identityIsolation:z.enum(['MOCK_DEDICATED','SHARED','UNKNOWN']),credentialBinding:z.enum(['MOCK_REFERENCE','SHARED_REFERENCE','UNKNOWN']),parentPrincipalId:id.nullable(),capabilities}).strict()
export const Lease=z.object({schemaVersion:version,leaseId:id,principalId:id,executionId:id,credentialRef:z.string().regex(/^fixture-ref:[A-Z]{1,16}$/),notBeforeMs:z.number().int().nonnegative().safe(),expiresAtMs:z.number().int().positive().safe(),capabilities}).strict()
export const Observation=z.object({schemaVersion:version,adapter:id,classification:z.enum(['DEDICATED','PROVIDER_NATIVE','SHARED','UNKNOWN']),credentialBinding:z.literal('UNKNOWN'),perPrincipalRevocation:z.literal('UNVERIFIED'),evidence:z.string().min(1).max(1024),inventoryMode:z.literal('READ_ONLY_SOURCE_ONLY')}).strict()
export const Receipt=z.object({schemaVersion:version,principalId:id,executionId:id,leaseId:id,engineTag:z.literal('freebuff'),scope:z.literal('MOCK_AUTHORITY_ONLY'),identityIsolation:z.enum(['MOCK_DEDICATED','SHARED','UNKNOWN']),credentialBinding:z.enum(['MOCK_REFERENCE','SHARED_REFERENCE','UNKNOWN']),parentPrincipalId:id.nullable(),sourceSha:z.string().regex(/^[a-f0-9]{40}$/),runtimeFingerprint:hash,grantPolicyDigest:hash,result:z.enum(['MOCK_LOCAL_FIXTURE_COMPLETED','BLOCKED_OR_UNCONFIRMED']),reason:z.string().regex(/^[A-Z_]{1,100}$/),gateBundleHash:hash,originalReviewerGate:z.literal('not-run'),backendRecoveryRequired:z.boolean(),providerCalls:z.literal(0),networkAttempts:z.literal(0),receiptDigest:hash}).strict()
export const schemas={AgentPrincipal:Principal,AgentPrincipalLease:Lease,PrincipalObservation:Observation,PrincipalReceipt:Receipt}
export const jsonSchemas=()=>Object.fromEntries(Object.entries(schemas).map(([name,schema])=>[name,z.toJSONSchema(schema)]))
