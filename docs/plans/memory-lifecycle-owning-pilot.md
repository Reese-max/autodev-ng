# Optional source-pinned snapshot lifecycle pilot

This is a default-off, isolated research path through the existing native
snapshot entry, copier and Git publisher. It is not a fleet rollout or a claim
that production memory is governed. The normal snapshot command, STOP gate,
Windows behavior and required test matrix remain unchanged when the opt-in is
absent. Opted-in execution requires Linux no-follow file operations; unsupported
platforms return a typed refusal before effects.

The canonical lifecycle policy is an **external, source-pinned artifact**. No
policy implementation, operational memory or private verification receipts are
shipped in this repository. A trusted operator must provide the reviewed artifact
and its source hashes. Missing artifacts return `CANNOT_VERIFY`; there is no
fallback policy, fixture PASS or candidate-selected validator.

## Isolated layout and interface

Use a complete source copy in an owned mode-0700 temporary area named
`adng-memory-pilot-*`, with children `writer`, `memory`, `host`, `canonical` and
`remote.git`. The writer source must execute from that copy: changing only
`ADNG_MEMORY_DIR` still leaves the ordinary writer's source ROOT unchanged.
Provide exactly one synthetic project configuration and synthetic source files.
Opaque `run.db`, unknown destinations, extra projects, symlinks and executable
Git configuration/hooks are refused. Nothing starts a daemon or reads an
existing fleet store. No networking, provider account or production credentials
are needed; the Git target is an owned local bare repository only.

`ADNG_MEMORY_LIFECYCLE_PILOT` selects `host/pilot.json`; `ADNG_MEMORY_DIR` must
select the fixed sibling `memory` directory. The closed host manifest contains
version, pilot ID, owner/canonical commit and tree references, and exact hashes
of every relevant owner module and canonical artifact. It is host control data,
never a field in an observed file or candidate. Minimal environment and empty
Git templates/hooks are required. Source/configuration drift invalidates old
jobs and grants rather than silently rebinding them.

The external CLI contract has three fixed operations, `--owner-capture`,
`--owner-admit` and `--owner-read`. Candidate/history JSON is one channel;
host-selected origin context path/hash and receipt-stream hash are a separate
channel. Nonempty and empty receipt streams both use an explicit host pin.
The native snapshot capture describes measured manifest hashes, not the semantic
trust of raw file contents. Raw text cannot select an origin class, approval,
scope, model, shell command or policy implementation. Every current memory read
has `action_authority: NONE`.

## Native commands

Run the copied `scripts/memory-snapshot.mjs` with one explicit pilot command:

- `--lifecycle-prepare`: measure source inputs and retain an immutable proposal.
- `--lifecycle-propose-conflict`: explicitly record an operator-observed conflict
  in the measured snapshot proposal; canonical admission decides quarantine.
  Raw source text cannot set this flag, and it cannot grant trust or permission.
- `--lifecycle-admit JOB`: rerun canonical admission under the writer lock, then
  use the native copier and stage the exact proposed Git tree.
- `--lifecycle-stage JOB`: produce a fresh stage after inspecting a changed
  host checkpoint; this does not issue permission.
- `--lifecycle-read`: validate persisted history, origin context, source
  freshness and host anchor, returning `ACTIVE` or `CANNOT_VERIFY`.
- `--lifecycle-publish STAGE`: require a separate exact host grant, then invoke
  the existing native publisher and confirm actual local-bare Git readback.
- `--lifecycle-repair MEMORY_ID`: explicitly tombstone a registered target and
  its registered descendants. This command is an operator action; observed text
  cannot request it. It does not erase raw files, clones or backups.

Admission can update factual memory and stage a working tree while publication
remains `UNPUBLISHED`. It never advances the published-head acknowledgement or
snapshot stamp. A proposed or ACTIVE memory does not authorize publication.
Ordinary snapshots retain their accepted predecessor and origin chain; after
tombstoning, ordinary preparation refuses rather than resetting scope or
dropping the deleted ancestry.

## Independent publication permission

The local operator supplies a closed grant under `host/grants`, separately from
memory. It names the exact stage/hash, current host anchor, registry and receipt
stream, owner source pin, payload Git tree, prior head, fixed local target,
one-use nonce and a bounded expiry. An `allowed` or `PASS` value in a candidate
is never permission. Missing or changed grants refuse; each native Git effect
rechecks the grant bytes and identity, source inputs, exact tree, STOP and heads.

The actual push uses the fixed local target and exact own commit with an
expected-old ref lease. Its own tree, single parent and operation marker must
match; the lease does not permit arbitrary history rewrites. Fetch and push URLs
must both match the fixed target. Receive-pack overrides, filters, alternative
object stores, hooks and Git configuration expansion are refused.

Only confirmed push/readback plus stamp completion can advance the external
host's published-head acknowledgement. A failed push can leave an owned local
commit for inspection; this is not remote success and it is never hidden by a
blind reset. Uncertain writes or abandoned locks require operator recovery.

## Restart and evidence limits

The host anchor holds raw history/registry hashes and the canonical receipt-stream
pin **outside** the memory backup. Replaying an old backup or editing receipt
times cannot self-authorize a new head. Missing/mismatched anchors, registry,
stream pins and unresolved write intents fail closed. Restoring the trusted host
authority itself is outside this guarantee. There is no hostile-same-user,
distributed atomicity, independent human identity or global-erasure claim.

Public tests exercise native default behavior, isolation and typed refusal with
non-executable placeholder artifact bytes. They do not pretend to test canonical
admission. Coupled positive tests require the separately supplied reviewed
artifact and owned local namespace; their source-pinned receipts are maintained
by the owner rather than copied into this public repository. No queued CI job is
reported as a pass, and no existing build or native matrix gate is waived.
