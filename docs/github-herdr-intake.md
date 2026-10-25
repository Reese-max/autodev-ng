# Herdr GitHub intake (#35)

Ordinary authorized bugfix Issues have a separate, default-off Herdr admission policy. Report repair remains unsupported, including when ordinary intake is opted in. Issue text cannot select an adapter, supply capability evidence or enable the policy. Owner templates do not opt in automatically.

The trusted GitHub config may contain `herdrIntake: { enabled, evidenceFile, evidenceSha256 }`. Omit it or keep `enabled: false` until an operator separately authorizes and observes the Windows canary below. `evidenceFile` is relative to the GitHub config; the hash pins its exact bytes. Store receipts outside the directory scanned as fleet source configs. No enabled production config or native canary receipt is shipped by this change.

An enabled policy requires a regular bounded receipt (`herdr-github-intake-acceptance/v1`, at most 64 KB). Every field is required:

| Binding | Fields |
| --- | --- |
| Trusted runtime | `repo`, `engine`, `provider` (Codex/Pi), explicit `model`, `sourceConfigSha256`, full `launcherSha256`, `runtimeSha256`, current `host`, `platform: win32`, observed `herdrVersion` and `backendVersion` |
| Lifetime | UTC `verifiedAt`, `expiresAt`; not future-dated, expired, or valid longer than 24 hours |
| Compatible contracts | `contracts: { exactReceipt: 1, singleDispatchRecovery: 1, backendReadiness: 1 }` |
| Observed checks | `checks` entries `exactBinding`, `backendStopped`, `hostCommit`, `regression`, `independentReview`, `draftPr`, each `PASS` |
| Backend readiness | `readiness: { login: available, model: verified, quota: available }` |
| Real canary references | `canary: { issue, snapshot, executionId, commit, draftPr, ciRun }`; snapshot is SHA-256, commit is a Git SHA, and PR/CI URLs must belong to the configured repository |

`herdrIntakeRuntimeHash()` from `dist/github/herdr-admission.js` hashes all shipped AutoDev runtime modules and the dependency lock. Compute it from the exact built distribution used by the native canary. A changed launcher, source config, backend/model, host, registry, schema, verifier or other runtime implementation requires reviewed evidence and a new pin. Arbitrary version labels, launcher health or a passing Windows CI job are not a native Herdr canary.

The first supported cost route is an explicit conservative positive per-run estimate with `globalDailyHardUsd`. Verified-free requirements and free-only mode remain refused because this adapter cannot currently prove free provider cost. Unknown cost never becomes confirmed zero. Existing scheduler fleet billing, attempt caps and live preflight still run.

Only eligible Issues additionally labeled `bug` enter this route. AutoDev keeps its existing single execution slot, isolated checkout, exact task/Issue snapshot, persisted request/execution binding, one-dispatch recovery fence, host-only commit, original-red/candidate-green regression, independent reviewer, exact-commit publication and draft-PR boundary. Dirty/wrong worktrees, unknown backends, bad receipts, rejected reviews and budget failures retain the existing publication fences. Agents receive no push, PR, merge or deployment authority.

Admission also checks the running OS is native Windows; copying a receipt into Linux/WSL does not admit it. Offline tests explicitly emulate that OS check, use synthetic operator receipts and inject the launcher transport while running the real adapter, scheduler, Git, host commit, regression and review functions. They prove software admission/lifecycle behavior. A separately authorized native Windows Herdr Issue → real Agent → host gates → draft PR canary and the #31/#38 host/72-hour trial remain outstanding; no production switch is enabled by these tests.
