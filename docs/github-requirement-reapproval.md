# Explicit changed-requirement approval (#46)

Changing an imported Issue still cancels the old work. Sync, label toggles, Issue-body approval claims and ordinary retry never accept the new fingerprint. `github reconcile --config FILE --issue N` remains a read-only review packet with exact old/new snapshots and captured state/config hashes; `--apply` only retires old work.

After reviewing that packet, an allowed operator may use:

```sh
adng github reapprove --config FILE --issue N --old OLD_SHA256 --new NEW_SHA256 --state CAPTURED_STATE_SHA256 --reason 'Specific approval reason' --stopped OLD_EXECUTION_ID
```

Repeat `--stopped` for each writer attempt in the current requirement generation, or omit it when none started. Identity comes from authenticated `gh api user` and must match the trusted config authors. The API accepts no caller-supplied actor and never interprets an Issue marker as approval. This is a trusted host/operator action: authenticated account identity does not prove independent human intent or confine a same-user process already holding host config and GitHub credentials. Keep this action and its credentials outside Worker authority; runtime confinement and native host acceptance remain separate #12/#31 gates.

The initial supported transition is deliberately narrow: enabled, unpaused ordinary intake; exact cancelled state; still-authorized new Issue; no existing/linked PR; no PR-followup revision; clean owned checkout with its exact preserved head and no additional worktrees; every prior writer has an exact terminal normal-exit receipt bound to the old task/workspace; no protected backend state; complete fleet/Issue accounting and remaining global/lifetime budget. Missing historical execution evidence remains manual handoff. Reconciliation alone is not backend-stop proof. A timeout, transport stop or recovery record explicitly leaving backend stop unconfirmed cannot authorize a successor.

The operation locks the existing runner, rereads remote Issue/PR and local state/config/backend/worktree/accounting observations, and refuses drift. It does not run an engine, unpause the daemon, publish or reset counters. Approval pins both raw config bytes and the normalized complete GitHub/source policy. Runner dispatch, direct runtime/checkout and publication admission enforce that canonical binding. Changing verification, budget, engine, publication or other trusted policy after approval requires restoring the reviewed configuration or reviewed manual handoff; it cannot silently reuse the old approval.

Each accepted transition atomically points `state.json` to a new numbered requirement. Exact predecessor bytes and authenticated approval receipts are written without overwrite under `requirements/snapshots/` and `requirements/approvals/`. Stored SHA-256 links and strictly decreasing versions validate the complete ancestry on state reads. Original candidate commits, artifacts, history and databases stay in place. Work runs in `requirements/N/`, with any later PR revisions beneath it. The fleet billing scanner includes every generation and PR revision; cumulative writer attempts are carried forward.

Repeating an exact accepted approval returns the same successor, even after it has run; it does not queue again. A crash after immutable evidence creation can reuse identical prepared evidence after all gates are checked again. Conflicting prepared evidence or an unexplained successor workspace requires manual inspection. This action handles changed requirements; #43 recovery handles the same requirement and does not confer new authorization.

Isolated tests cover authenticated successor/restart, three-generation immutable lineage, an actual preserved Git candidate/SQLite cost/terminal execution, single subsequent dispatch, stale approvals, authorization/config/Issue drift, backend/worktree/PR/budget refusals and generation billing. They do not approve any real cancelled Issue, change production labels/config, restart a Worker, create a real PR, merge or deploy.
