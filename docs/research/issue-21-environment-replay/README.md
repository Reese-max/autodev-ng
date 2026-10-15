# Issue #21 bounded environment/handoff research replay

**Decision: NARROW.** A provider-free research instrument can verify actual
Git/artifact/evidence readback and refuse drift before starting its trusted local
fixture. Current native runtime is **not** a cross-host resume implementation.
The old PR24 JSONC sketches and illustrative `RESUMABLE` table are superseded for
this study by executable strict `environment-research/v1` schemas and actual
receipts. No provider adapter is production-ready on this evidence.

## Reproduce

Use a separate checkout of published source
`a2378aa6fea3605f596e3ee264adbb2eb04c9010`, tree
`26314c41dbe5f7b40da0f242fd8268ec5f0178f8`, its existing dependencies and Node22.
Every reviewer must select a new owned output directory:

```sh
python3 run.py SOURCE_CHECKOUT NODE_EXECUTABLE REVIEWER_OUTPUT
```

The launcher builds that exact tracked source afresh and records source/compiled
SHA256 for fourteen imported SDK modules. It never runs the default engine or
LLM manager. The fixture environment is a whitelist; Git uses an owned empty
global config, disables system config and has an absent owned hooks path.
All Git clone/fetch/commit operations use disposable local projects. There is no
real remote fetch, provider account, credential loading, product edit or merge.
Results and schemas are written under `OUTPUT/run-*` and `latest-result.json`.

Actual SDK primitives are `LongHorizonBackend`, strict native backend schemas,
`takeInterrupt`, mechanical auditor/verify command, `RunDb`,
`attemptAccounting`, `globalCostReport` and `TeamState`. `source-evidence.json`
records the comparison with main `f86a36d5cde92e09c93038fa8d75f0d18f4007e7`:
the only eleven changed files concern GitHub owner handling/its tests/docs/CI;
the fourteen selected modules are unchanged. This historical source pin does
not claim a full current-main regression result.

## Boundaries

Target observation comes from a fresh Node subprocess and actual Git, Node,
fixture CLI, files and local policy reads. `actualFacts` always retains those
facts; `simulatedOverrides` is separate scenario provenance. Both actual and
scenario facts must satisfy a hard requirement. A simulator cannot disguise
an actual Node/OS mismatch. Storage is `SAME_PROCESS_WRITE_READ`, with separate
fresh-process artifact/checkpoint reads; neither proves crash/power-loss
durability. The API network sentinel is trusted-fixture instrumentation, not
a host firewall, OS containment, or adversarial worker security proof.

Windows evidence is an archived CI observation (run37267990741,
job111628765470, Windows Server2025, Node22.23.3). Its source checkout is
`4f27f434f4063a19549f1174864feea2c87a8dd8`. Its metadata/log hashes are preserved.
The frozen Windows observation attaches an explicitly synthetic owned Git
project, never claims it ran on that CI job, and rejects the actual Linux
target. Current Windows CLI/auth/skill/capability/storage facts remain UNKNOWN.
The successful portable roundtrip uses two actual owned Linux directories;
`MANAGED_SANDBOX` denotes the logical no-provider simulator.

Principal evaluation reuses the #17 trusted mock registry/validator/evaluator,
with exact execution/lease/parent/ref/class binding. This is mock authority
only. SHARED, revoked and missing leases fail; real auth remains UNKNOWN.
The actual read-back `declaredEffectDecision` is preserved separately from the
fail-closed synthetic external-effect gate `effectDecision=DENY`. A changed
ALLOW policy is recorded as ALLOW and refused. This is not actual #12 egress
containment or permission to make an external request. Reviewer gates are
NOT_RUN; environment facts confer no review/merge approval.

Native backend resume accepts no target cwd and reuses the persisted source
cwd. Its ordinary pause/fresh-process same-path recovery is proved separately;
The actual paused SDK state/goal/attempt/evidence continuation inputs are copied into another owned target and every selected source/copy hash is read back. Coordination SQLite/driver locks are excluded because they are not continuation/checkpoint inputs; no raw DB or ownership tokens are exported. Its recorded cwd causes the research wrapper to refuse relocation before native dispatch. Native resume itself has no relocation check or target cwd argument. The paused snapshot has zero verified checkpoints, which is explicitly recorded; the subsequent same-path resume creates a real verified checkpoint. Native interrupt supports
pause/abort/approve only. Actual STEER/QUEUE bytes are kept opaque, hash-bound
and preserved at source; handoff is refused **before** dispatch. Normal-path
pause consumption is not STEER/QUEUE delivery, nor crash-safe exactly-once:
`takeInterrupt` itself permits a repeat if sentinel deletion fails.

TeamState reservations are tied to Git common-dir. The fresh-clone SDK probe
actually admits a reservation its source ledger would deny, exposing the reset
risk. The research gate instead requires the original ledger identity and a
complete hash-pinned `globalCostReport`; missing/substituted references and the
source reservation/hard-cap conflict refuse execution. Booked$0.25 and reserved
$0.60 are explicitly synthetic accounting inputs, not real provider spend.
Distributed cross-host authoritative ledger availability remains UNKNOWN.

## Original fourteen acceptance criteria

| AC | Result and evidence |
|---|---|
|1|Strict executable versioned Requirement/Observation/Bundle/Receipt plus generated JSON schemas; unknown extra secret fields rejected.|
|2|LOCAL_WINDOWS, MANAGED_SANDBOX, PARTNER_CLOUD, UNKNOWN all schema values; actual UNKNOWN target refuses. No partner runtime tested.|
|3|Credential refs/classes only; actual random fake parent secret stripped at child boundary and absent from all generated artifacts/logs/receipts.|
|4|Exact repo identity/commit/source cwd/dirty/artifact/evidence/checkpoint/schema and observation digests checked. Both wrong bundle source path and wrong source cwd refuse; actual native state copy bytes and recorded cwd are read back.|
|5|Fresh target subprocess reads actual facts; simulation provenance retained and cannot upgrade them.|
|6|Actual CLI/skill/policy changes and declared Node/OS/storage/network drift fail closed with no fixture command.|
|7|LAN/device/browser/Windows-app fixtures refuse LOCAL_ONLY; even a declared Windows class cannot establish actual resource availability.|
|8|Separate synthetic DENY on both directions; policy ALLOW drift preserved/refused. Real containment UNKNOWN.|
|9|Mock principal/lease/ref/parent/execution/class preserved; missing/revoked/shared/duplicated-ID and insufficient grants refuse. Real isolation UNKNOWN.|
|10|NARROW refusal: unsupported actual #11 pending STEER/QUEUE bytes remain unchanged and are never fed into native interrupt. Native ordinary pause consumption/recovery is separately tested. No native handoff delivery claim.|
|11|Real SDK billing/reservation cap refusal and clone-ledger reset proof; substituted/missing authority and changed policy refuse. Distributed authority UNKNOWN.|
|12|Actual local Git→owned simulator continuation→explicit clean local fast-forward: exact continued commit and original artifact/evidence hashes return. Dirty return refuses without overwrite. Frozen Windows→Linux refuses.|
|13|Explicit selection required by strict schema; no background offload loop.|
|14|No real cloud/account/secret needed or used; provider adapter remains a future independent experiment.|

## Original eleven runtime requirements

| Runtime | Result and scope |
|---|---|
|1|Archived LOCAL_WINDOWS observation + clearly synthetic project/commit/artifact fixture; no current Windows execution.|
|2|Provider-free real-directory simulator; six deliberate facts drifts plus actual changed CLI/skill/policy.|
|3|Positive actual target reads + real CLI continuation + independent node:test pass; hard mismatch/UNKNOWN refuse first.|
|4|Actual return exact hashes/commit; dirty target snapshot unchanged on refusal; no silent overwrite. Actual copied paused native state causes wrapper refusal before native dispatch; no native cross-host protection is claimed.|
|5|Real in-memory fake secret boundary + schema rejection + generated-byte scan.|
|6|Missing lease/grant, revoked/shared principal and missing network fact refuse, with no fixture action.|
|7|Both successful directions retain synthetic independent DENY; actual host containment UNKNOWN.|
|8|Four local-only classes refuse without public exposure or fallback.|
|9|Stale actual source commit, actual changed Skill/policy/CLI and wrong observation/target bindings refuse.|
|10|Actual native source reservation/hard-cap denial; fresh cloned ledger substitution refused despite its independent SDK admission.|
|11|Conditional future real provider experiment NOT_RUN; no provider failure can mutate canonical state because none is invoked.|

Each negative case asserts the fixture command did not start and source/target
tracked bytes/head/status plus source claims are unchanged after the intentional
scenario input is prepared. Metrics cover this bounded fixture only; no human
step reduction, provider reliability or production migration metric is inferred.
