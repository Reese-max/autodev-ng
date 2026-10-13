# Issue #16 — Why a verified repair follow-up becomes `blocked`

Research deliverable for `Reese-max/autodev-ng#16`. The change adds synthetic-test diagnostics only; it does not alter repair, verification, publication, or recovery behavior.

## Confirmed failure and first source-level boundary

Hosted run `34469734636`, job `102846569277`, checked out `8103b2129413727dc05471908a4b57d698f22561` on Windows Server 2025 with Node `22.23.2`. Both rounds of `test:flaky-regression` failed the named follow-up assertion: expected `4: published`, received `4: blocked`, with stored detail `failed`.

In that checkout, the fixture completes the first publication, queues the feedback revision, and enters the follow-up with `runs=1` and `maxRuns=2`. The entry-cap check therefore does not explain this named transition. The runner increments the count to 2 and calls `executeIssue`; when that call reports `done=false` with detail `failed`, the post-execution limit stores `blocked`. The historical logs do not retain the inner verifier or scheduler receipt, so they do not identify which internal gate first failed.

The prior PR text suggested a possible timing explanation based on the wrong test timeout and file duration. That explanation has been removed: it was not supported by the recorded failure and did not identify the failed gate.

## New failure artifact

When the named synthetic follow-up test does not return `4: published`, it now captures a structured JSON record before the fixture's `afterEach` removes its temporary files. The record contains:

- first failed scheduler attempt sequence, failure class, and sanitized subreason, read from the follow-up run database in read-only mode;
- state status, run count, detail, commit, and revision base before and after the follow-up;
- first published commit, candidate checkout commit when present, revision round, and outer run number;
- runtime platform and Node major version.

Known verifier reasons are given a stable gate label. Generic `failed` values remain `unknown`; the test does not infer an inner cause when the source did not preserve one. The JSON contains no Issue body, fingerprint, PR data, database contents, raw process output, or local path. Machine paths and token-shaped strings are redacted from diagnostic details.

The artifact uses a unique filename under `RUNNER_TEMP` in CI, so a second suite round cannot overwrite the first failure. The workflow uploads matching JSON files even when a test step fails, with 30-day retention. Local runs use the OS temporary directory. No diagnostic file is produced by a passing follow-up.

## Safety boundary

The test remains end-to-end over its synthetic local repository and fake GitHub client. Its issue fingerprint, ancestry checks, original probe receipt, regression proof, project acceptance, quality, independent reviewer, and human-merge boundaries are unchanged. The diagnostic reads the test run database only after the runner has closed it; it does not invoke providers, access a live repository, push, publish, deploy, or change production behavior.

## Verification and remaining acceptance

The previous local audit ran the named test twice on the exact failure source commit using Linux/Node 24; both runs passed, so they did not reproduce the historical Windows/Node 22 failure. On this diagnostic branch, the named test and its synthetic artifact-reader/writer tests pass on Linux/Node 24. Exact-head hosted CI is still pending. If Windows/Node 22 passes without producing a failure artifact, the historical inner gate remains unknown; keep Issue #16 open pending a controlled reproduction or further captured evidence.

Issue #16 also requires two consecutive current/recent green full two-round CI runs before closure. This PR update is diagnostic evidence only and does not satisfy that closure condition.
