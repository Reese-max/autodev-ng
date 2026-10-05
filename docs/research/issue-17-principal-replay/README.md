# Issue 17 bounded principal research

Decision: **NARROW to attribution-only design; mock authority proof only**.
The study executes the unchanged `FreebuffEngine` NDJSON stdio path using a
local Node MCP fixture, actual disposable Git commits, native execution
observations and the existing `EvidenceStore`. It creates no product registry,
provider request, real credential binding, deployment or production change.

The supported fixture is a trusted local mock credential authority. Its
`MOCK_DEDICATED` label means only that this authority can reject one fixture
principal while another remains usable. It proves no provider isolation or
revocation. Current source adapters remain `SHARED/UNKNOWN`; real per-principal
revocation remains `UNVERIFIED/UNENFORCEABLE`. A provider-native test would require
its own isolated evidence before that status could change.

Pinned actual runtime source: `a2378aa6fea3605f596e3ee264adbb2eb04c9010`, tree
`26314c41dbe5f7b40da0f242fd8268ec5f0178f8`. The original research PR 25 is
`7db9509a5650e12f0a1f1e243bbd2ebe758d6e97`; it does not contain the runtime
instrument. The earlier local owner worktree `f8b8509c8c6d87410a86fc654a81d5f50e50df5c`
had identical imported adapter/observation/evidence/reviewer blobs; final replay
uses the published main source directly. This is a Linux/Node 22 experiment,
with no Windows or actual provider claim.

Prepare a detached worktree at the pinned source and install the existing locked
dependencies. The driver rebuilds the exact source before every replay. Run:

```sh
python3 run.py /absolute/path/to/pinned-worktree /absolute/path/to/node22 /absolute/path/to/owned-output
```

Each reviewer uses a separate output directory; frozen author receipts are never
overwritten. The driver records the actual compiler command, exit code, Node
identity and SHA-256 of all four imported compiled entry modules. The replay
checks those hashes and pins the tracked source blobs independently.

`run.py` launches the instrument with only system execution variables; it drops
ambient credential, provider and home variables. The actual adapter also applies
its existing `safeMcpEnv` whitelist. Only an in-memory fake parent secret is
introduced to test that it is absent in the MCP child and stored artifacts.
The fixture's network APIs throw on use and record attempts; this is trusted
fixture instrumentation, not a host firewall or a hostile-worker sandbox.
Git uses local temporary projects with global/system configuration disabled.

`schemas.mjs` uses the repository's existing Zod dependency. Principal, lease,
observation and receipt records are strictly parsed; `schemas.json` is generated
from those runtime schemas. Raw credential fields, non-reference lease binding,
false reviewer PASS and invented verified inventory states are rejected.

The fixed sequence currently passes 13 cases with 12 actual adapter invocations.
Four local candidate commits pass their actual Node check. All 12 original gate
bundles remain **BLOCKED** because independent review is `not-run`. Original
`writerIdentity` remains `freebuff` for reviewer-model lookup; the new principal
identifier exists only in a research sidecar linked to the existing bundle hash.
No lease, author identity, reviewer identity, cost/lock or release gate is reused
or widened. Cancellation preserves `unknown` / recovery-required backend truth.

Each invocation writes a strictly parsed `PrincipalReceipt` and a native
execution record. `latest-result.json` names the complete retained run directory,
case evidence, timestamps, runtime identity and result digest. Wall-clock values,
PIDs and resulting Git commit hashes vary between replays; the verdict sequence
is deterministic. No hidden tests, real prompts, private account data or raw
credential values enter these records.

Registry mutations are serialized within this deterministic fixture. Atomic
rename proves ordinary fresh-process restart behavior; no adversarial concurrent
update, power-loss durability or OS containment is claimed.

The child has a logical parent grant approved by the trusted fixture authority
in a fresh process; its real MCP process is launched by the existing host adapter.
Logical principal lineage is not claimed to be OS process ancestry. The separate
effect DENY is a harmless local fixture policy; it supplies no #12 hard-egress
enforcement claim. The existing exact-execution cancellation API supplies the
targeting test with both siblings in the same actual execution-control store;
both samplers read the targeted request. No new #11 steering or queue
implementation is claimed.

The smallest possible follow-up is an optional attribution receipt proposal
bound to exact execution IDs. Provider revocation, real credential brokers,
production adoption and a cross-engine authorization service remain outside
this NARROW result.

## Original acceptance mapping

| # | Original acceptance | Executed result / retained limit |
|---|---|---|
| 1 | Versioned observation, principal lease and receipt; no raw credentials | Strict Zod schemas plus generated JSON Schemas; registry and every output parsed. |
| 2 | Every synthetic execution has an exact principal or SHARED/UNKNOWN | 12/12 adapter invocations carry exact sidecar principal and execution IDs; SHARED attempt remains explicitly unenforceable. |
| 3 | Same engine, distinct principal leases | A and B use `engineTag=freebuff` with separate mock leases, receipts and actual Git result commits. |
| 4 | Owner, role, runtime, lifecycle, isolation and binding states | Strict principal record contains all fields and source/runtime fingerprint. |
| 5 | Revoke A without disabling B or owner | Fresh admin revokes A while B's actual MCP child waits; A is refused, B commits, fixture owner remains ACTIVE. |
| 6 | Shared sessions remain SHARED/UNENFORCEABLE | Actual shared fixture returns `SHARED_IDENTITY_UNENFORCEABLE`; real Freebuff source inventory is SHARED. |
| 7 | Expired/revoked lease or old execution cannot replay after restart | Fresh MCP processes refuse expiry, revoked A, completed B replay, wrong execution and foreign principal lease. |
| 8 | Child lineage; no silent capability/credential widening | Fresh authority process records an explicit child subset grant; actual C MCP completes. A broader child grant is rejected without changing registry state. |
| 9 | Binding references only, no raw secrets in output | Lease parser accepts only `fixture-ref:*`; raw-field rejection and stored-artifact scan pass; fake parent secret is absent from child. |
| 10 | Effect authority independent of principal | Valid mock principal plus separate DENY produces no result file; no hard egress claim. |
| 11 | Exact execution targeting remains independent | D and E coexist in the same native observation/cancellation store; after both samplers read it, cancellation targets D only and E completes. No principal-to-steering fan-out path is introduced; future steering/queue capability is unclaimed. |
| 12 | Preserve writerIdentity and independent review checks | Original writerIdentity remains engine tag; actual reviewer gate remains not-run and every gate bundle blocked. Pinned scheduler/kernel source unchanged. |
| 13 | Read-only engine/auth inventory with evidence or UNKNOWN | All 11 schema adapters included: Freebuff SHARED; remaining auth ownership/revocation UNKNOWN; no credential files inspected. |
| 14 | No production implementation beyond synthetic research while reliability gated | Runtime source untouched; experiment files and temporary state only. No worker/adoption/provider mutation. |

## Original runtime mapping

| # | Required runtime probe | Result / scope |
|---|---|---|
| 1 | Two principals, same engine, distinct receipts | Actual A/B MCP invocations and local commits, distinct mock principal leases. |
| 2 | Revoke mock dedicated A; B remains usable | Fresh-process revoke during actual B wait; A refusal and B completion. |
| 3 | Deliberately shared auth is SHARED/UNENFORCEABLE | Actual MCP shared fixture refused; no independent provider revocation claim. |
| 4 | Restart/resume expired/revoked and old grant replay refused | Fresh MCP transport processes reload durable registry and reject expired, revoked, completed replay, wrong execution and foreign principal. |
| 5 | Controlled child lineage and no scope widening | Fresh authority child-creation record; actual child C process; broader child grant refused. Logical parent grant is distinguished from OS spawner. |
| 6 | Valid principal cannot bypass synthetic effect checks | Separate DENY runs before local fixture write; actual adapter reports failure and preserves required recovery truth. |
| 7 | Logs/evidence contain no credential material | Strict schemas, fake parent-env stripping and artifact scan; actual source evidence remains metadata only. |
| 8 | Any real native provider test uses benign isolated environment | Conditional: no provider-native test was attempted. No credentials rotated, logged out or read. |
| 9 | DEDICATED/REVOCABLE only after bounded actual provider revoke | Preserved: no real adapter receives that label. Mock-specific label never becomes provider evidence. |
| 10 | Attribution-only NARROW where provider isolation unavailable | NARROW due unverified real provider isolation; no claim that any provider inherently cannot support isolation. |
