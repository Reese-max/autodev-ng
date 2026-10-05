# Exact approved fixture maintenance (#37)

The default GitHub job remains BUGFIX: add an independent regression that passes
on the candidate and fails an assertion on the base; existing tests cannot change.
This opt-in capability supports one externally approved replacement of one existing
test fixture. It does not offer a general editable-tests or CI maintenance mode.
No repository integration or host setting is enabled by this change.

| Work | Authority and completion |
| --- | --- |
| BUGFIX (default) | Existing additive red/green regression, full CI, independent review and publication evidence. |
| Exact approved fixture | External operator config pins the Issue snapshot, base, test path and entire replacement bytes. All other paths stay frozen. Original full CI, reviewer, acceptance, quality and merge evidence remain required. |
| Arbitrary test/CI maintenance | Unsupported. Hand off the candidate and rejection reason to an operator; no automatic expansion of approved scope. |
| DOCS / RESEARCH | Content and recorded experiment evidence answer the research question. They do not count as successful product repair or enable a profile. |

The source-approved direction follows the bounded experiment in
[issue #37](https://github.com/Reese-max/autodev-ng/issues/37#issuecomment-5701576204).
That experiment showed that preserving assertion text and obtaining green tests
does not exclude `test.skip`. Exact byte approval closes the worker's ability to
choose a different test body; explicit protected assertions and common new bypass
controls provide additional rejection checks. These checks are not a semantic
proof for arbitrary languages, test frameworks or operator-approved code.

## Operator approval

Only the single-repository `loadGithubConfig()` host loader can approve this mode.
The selected operator config must be outside the actual source Git repository and
Git metadata, integration run data and configured worktrees (including schema
defaults and symlink aliases). Private registration inside the loader keeps a
host capability and snapshots the full resolved config, source config and approval
file bytes before dispatch. Changing or removing the selected path also revokes
that capability. Directly parsing, copying or mutating a config
object cannot create or preserve that capability. Owner-wide configuration does
not support this profile.

The optional `fixtureMaintenance` object contains these fixed fields:

| Field | Meaning |
| --- | --- |
| `kind` | Exactly `approved-fixture-v1`. |
| `repo`, `issue`, `fingerprint` | Exact repository, Issue number and host Issue fingerprint. Issue text cannot select the mode. |
| `baseCommit` | Full base commit; only descendants of this base are eligible. |
| `file` | One existing regular `tests/... .test/spec .cjs/mjs/js/ts` file. No product or workflow files. |
| `approvedContent`, `approvedSha256` | Entire operator-reviewed UTF-8 replacement and its SHA-256. Raw working-tree bytes and committed blob must both match. |
| `protectedAssertions` | Nonempty literal assertion anchors present in the base and preserved with the same occurrence counts in approved bytes. |
| `fullVerifyCommand` | Exact original source config verification command; the profile cannot substitute a narrower command. |

The operator chooses and reviews the replacement independently before writing the
external config. A worker-produced manifest, hash or approval claim is never an
authority source. Absence of the object keeps the existing BUGFIX contract. It
applies only to its pinned Issue number; changed requirements, base or PR revision
require a new explicit operator approval. Combining it with template, report
repair or custom regression modes is rejected.

## Execution and recovery

Before the original verifier executes any candidate code, the host requires exactly
one changed approved test path, clean tracked files, and no extra untracked files.
It checks regular-file modes, exact approved bytes, protected assertions and new
explicit skip/todo/only/runIf controls. After full CI and independent review it
rechecks the candidate and writes `fixture-maintenance-<commit>.json`, binding the
exact candidate to the frozen approval and source config and the original gate
evidence. Normal acceptance and quality gates still run. Publication also requires
the existing exact CI/reviewer/merge bundles and this fixture receipt; a receipt
cannot authorize another commit or changed approval/config bytes.

Failures preserve the candidate for operator handoff (`fixture-handoff`), without
expanding paths, reducing full CI or falling back to an automatically generated
approval. Any config drift, missing approval or bytes transformed by checkout
filters is rejected; refresh the reviewed approval and rerun original gates.
Human merge remains required. Building this disabled capability does not provide
production operator approval or real-host acceptance evidence.

## Reproducible integration evidence

The implementation starts from main
`f5892611c856502b8a0a754250689e5ac101c390`. The offline product integration test
uses the actual `executeIssue`, scheduler, managed worktree, `KernelVerifier`,
full Node test command, evidence bundles, merge and `assertPublishable`.
Only provider responses are injected; no network, secrets or production
configuration are used. The base fails because its store fixture lacks `read()`;
the exact approved replacement adds that method. The unchanged original assertion
runs and prints `ORIGINAL_ASSERTION_REACHED`, while the unchanged second test also
runs in the original full suite.

```sh
npm run build
npm run typecheck
npx vitest run tests/github-fixture-maintenance.test.ts tests/github-regression.test.ts tests/github-owner.test.ts
npx vitest run
```

The committed tests cover positive integration, unchanged BUGFIX defaults,
unapproved bytes, changed expectations, new skip, tracked product/workflow and
extra untracked workflow changes, Issue-body profile forgery, wrong base,
revision/receipt replay, missing full CI/reviewer evidence, config/source drift,
direct/copy config capabilities, selected-path drift and repository/data/worktree
approval placement, including omitted defaults and source subdirectories.
The symlink alias case runs where symlink creation is supported. Each rejection
is asserted as rejection, never converted to a warning or green repair.
