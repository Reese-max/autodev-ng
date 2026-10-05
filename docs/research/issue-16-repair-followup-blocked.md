# Issue #16 — Why a verified repair follow-up becomes `blocked` with detail `failed`

Research deliverable for `Reese-max/autodev-ng#16`. No code change is proposed;
the issue explicitly asks for the exact state transition first.

## TL;DR

`blocked` + detail `failed` in the follow-up scenario can only be produced by
**two** transitions, and both collapse the diagnosis into a generic string:

1. `runner.ts:117` — the follow-up **executed**, `runOnce` returned `failed`
   (the bounded repair cycle did not produce a verified candidate), `runs`
   incremented to `maxRuns=2`, and neither `alternativeRetryPending` nor
   `reviewPending` was set → `status='blocked'`, `detail='failed'`.
2. `runner.ts:100` — the follow-up was **re-queued** with `runs` already at
   `maxRuns` and no pending alternative/review gate → blocked **before**
   executing, inheriting whatever `detail` the previous run left (`failed`).

In CI run 34469734636 the stored detail was only `failed`, which is exactly
what both paths emit. The transition itself is correct fail-closed behavior —
the defect is that `blocked` does not name **which gate** produced it.

## Every `blocked` transition in the follow-up path

| Site | Trigger | Detail written |
|---|---|---|
| `runner.ts:77` | a `running` state survives into a new runner tick | `Previous runner interrupted; inspect artifacts before retry` |
| `runner.ts:89` | queued, an existing PR found, **no** `revision` | `Existing PR; manual review required before further execution` |
| `runner.ts:94` | `revision` set but PR drifted (`head.sha !== revision.baseCommit`, closed, or base changed) | throws → `blocked` via catch at :123, message `PR changed before revision execution` |
| `runner.ts:100` | `runs >= maxRuns` and no `alternativeRunPending`/`issueReviewPending` | **unchanged — keeps prior `failed`** |
| `runner.ts:107` | `executeIssue` returned `recoveryRequired` (`team-state-quarantined`) | `Execution recovery required: …` |
| `runner.ts:117` | `executeIssue` done=false and `runs>=maxRuns` with no retry gates | `result.detail` — `failed` when `runOnce` returned the literal `'failed'` |
| `runner.ts:123` | any throw inside the dispatch | the error message |

Only **:100** and **:117** produce the observed `blocked` + `failed`
combination. `:94` and `:123` write a descriptive message; `:77`/`:89` write
their own strings.

## Which gate fired in CI?

The fixture preserves the first repair's probe receipt and queues a revision
(`queued.revision.baseCommit = first.commit`), so `runner.ts:94` would have
thrown `PR changed before revision execution` — not `failed`. Similarly the
interrupted-runner path writes its own message. That leaves:

- **Most likely — `runner.ts:117`**: the second `runOnce` cycle returned
  `failed` (e.g., the follow-up repair's verification, worker output, or
  acceptance check did not pass inside the bounded scheduler cycle), `runs`
  hit `2 >= maxRuns`, and no retry gate was armed. `detail='failed'` is then
  the *scheduler's* result string, not the gate's name.
- **Possible — `runner.ts:100`**: if a prior attempt had already pushed
  `runs` to 2 (e.g., a first failed execution inside the same lifetime),
  the next tick blocks at entry without consuming anything, and the stale
  `failed` detail persists.

The two are indistinguishable from `detail` alone — which is itself the bug
the audit flagged: *"a blocked repair must name its first failing gate and
safe recovery path."*

## Why CI failed while local main passes

`npx vitest run tests/github-repair.test.ts` on `main@181df4e` passes all 18
tests, including the exact follow-up scenario (37s wall). The CI failure is
therefore either:

- on an older commit whose `runOnce`/verify path differed, or
- **timing-sensitive**: the test file carries a `30_000`ms timeout and the
  follow-up scenario runs ~37s locally; under CI scheduling the bounded
  scheduler cycle can legitimately return `failed` (e.g., worker or verify
  step exceeding its window) — in which case `blocked` is *correct* and the
  assertion's expectation of `published` is the flaky part.

Either way, the durable fix is instrumentation, not a behavior guess.

## Recommendation (not implemented — per issue scope)

1. Give `runner.ts:100`/`:117` a **gate-named detail**, e.g.
   `blocked: run-limit after failed execution` vs `blocked: run-limit reached before dispatch` — both are different recovery actions.
2. Persist `result` sub-reason (runOnce's `reason`) into `detail` whenever
   blocking, so `failed` alone can never reach the ledger.
3. If the CI failure recurs, capture `state.history` + `repairMetrics` at the
   assertion — the entry-vs-execution distinction is decidable from `runs`
   and the history tail.

## Verification performed

- `npx vitest run tests/github-repair.test.ts` on `main@181df4e`:
  **18/18 pass** (the follow-up test included).
- `runner.ts` / `job.ts` / `state.ts` read in full; all `blocked` writes
  enumerated above.
