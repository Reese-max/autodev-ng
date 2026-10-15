# Issue #21 — Execution Environment Contract / Handoff Research

**Decision: NARROW.** The original research scope now has a runnable provider-free
experiment, strict versioned schemas and actual readback evidence. The former
JSONC sketches and illustrative `RESUMABLE` table are superseded by this bounded
study. Current product runtime is not a cross-host resume implementation.

- [Original 14 acceptance / 11 runtime map and portable command](issue-21-environment-replay/README.md)
- [Generated strict schemas](issue-21-environment-replay/schemas.json)
- [Frozen author evidence and timeline](issue-21-environment-replay/evidence/README.md)
- [Immutable 38-case raw result](issue-21-environment-replay/evidence/run/result.json)
- [Fresh exact-source build receipt](issue-21-environment-replay/evidence/build-receipt.json)

The author replay passed 38 cases. All
34 rejected preflights started no fixture and
preserved source/target tracked bytes, heads/status and source claims. Real
disposable Git continuation and explicit clean return preserve the continued
commit and exact artifact/evidence hashes. Dirty/divergent returns refuse.
Fresh target subprocesses read actual Node/OS/CLI/repository/policy facts;
declared simulator changes cannot upgrade actual facts. Bundle/source
observation/caller worktree paths must match exactly.

An actual native `LongHorizonBackend` pause and fresh-process same-path resume
are verified separately. A real copy of its persisted paused state is parsed
and hash-checked, then refused by the **research wrapper** before native dispatch
because cwd remains host-bound. Native resume has no target cwd mapping or
relocation enforcement. Unsupported STEER/QUEUE bytes are preserved and refused
before handoff; ordinary native pause consumption is not STEER/QUEUE delivery
or crash-safe exactly-once.

Real `RunDb` / `globalCostReport` / `TeamState` primitives demonstrate source
reservation and hard-cap denial. A fresh cloned ledger would admit a reservation
the source refuses; the research wrapper therefore rejects absent/substituted
authority. Distributed authoritative ledger availability stays UNKNOWN.

Source is historical `a2378aa6fea3605f596e3ee264adbb2eb04c9010`, freshly compiled
with fourteen imported source/module hashes. Those primitives match landed
main `f86a36d5cde92e09c93038fa8d75f0d18f4007e7`; its differences concern GitHub
owner handling and its tests/docs/CI. This document branch is not a current-main
source integration. The frozen Windows observation cites actual CI run
37267990741 / job111628765470 and an explicitly synthetic project; current
Linux observations remain Linux, and current Windows toolchain/auth/capabilities
are UNKNOWN.

Principal evaluation uses #17's trusted **mock** authority only. Credential
references retain exact lineage; shared/revoked/missing/wrong bindings refuse.
Actual policy ALLOW readback is recorded separately from the independent
synthetic external-effect DENY gate. No environment observation grants network,
review or merge approval. Real provider/credential isolation and host containment
remain UNKNOWN; original review gates remain NOT_RUN. No cloud/account/secret,
product source/config changes, automatic offload, deployment or feature merge
is required or claimed.

This existing PR retains research records only. Production adapters, native
cross-host migration, portable control delivery and distributed authority
require separate future FEATURE work. Refs #21.
