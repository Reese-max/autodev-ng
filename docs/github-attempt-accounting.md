# GitHub writer attempts and controller waits

`IssueState.runs` remains the lifetime writer budget. The scheduler's existing
`onWorkerStart` callback supplies the current dispatch fact; a reason string does
not prove that a worker started. `executeIssue` exposes `startState` separately
from its existing `attempted`, `verificationAttempted` and human-readable detail.
The external CLI result codes remain unchanged.

Known unstarted budget/preflight/capacity/review waits refund only the reservation
created for the current loop. Started failures, timeouts and uncertain current
dispatches retain that reservation. A prior unresolved execution keeps its
original count, cost and ownership fence: `priorExecutionUnknown` does not charge
it again, and recovery remains mandatory. Throws and failed atomic state writes
never imply a refund; an on-disk `running` reservation is blocked on restart.

A blocked backlog or scheduler result is terminal. It refunds a proven unused
current writer reservation, then remains blocked instead of being polled as idle.
Writer billing records and validation-stage accounting remain separate, including
unknown cost and existing failure estimates.

A structured repair CLI preflight refusal is also a terminal safety block with
`preflight-failed` and a known unused writer reservation. It preserves the original
login/sandbox diagnostic and does not automatically repeat the preflight. A thrown
or uncertain preflight failure retains its reservation instead.

`controlRuns` counts consecutive unstarted waits independently of writer attempts.
`controlReason` is a machine code, not parsed error text. Existing `retryMs` grows
by 1, 2, 4, 8 and 16 times; an explicit future review `retryAt` takes precedence.
Both fields survive restart and are appended to new history entries; existing
history rows remain intact. Cooling issues yield to other eligible issues.

After five consecutive controller waits, `control-retry-exhausted` holds the issue
for the existing explicit recovery operation. This is a bounded controller policy,
not an increase or reset of `maxRuns`. Restoring the environment before exhaustion
lets the same issue resume at its next eligible time. After exhaustion, recovery
checks the original authorization, backend stop evidence, checkout, worktrees and
environment before resetting only the controller state. Original writer counts,
reservations, costs and history are preserved. A started dispatch or successful
completion also ends the consecutive wait sequence.

Review-only recovery at the writer cap accepts only the exact candidate validated
by `readPendingReview`: task/config/model, private worktree/common Git directory,
ownership marker, clean candidate head and ancestry must match. Unrelated worktree
changes, malformed receipts and context/head/path/model drift still block recovery.
The scheduler resumes that review without starting another writer.

The regression suite uses real local Git checkouts, SQLite, scheduler, Issue runner,
atomic state operations and two actual local Node child processes. Provider calls
are prohibited; the explicit doctor injection admits only a synthetic fixture.
These checks do not establish target-host installation, real provider availability,
deployment or human acceptance.
