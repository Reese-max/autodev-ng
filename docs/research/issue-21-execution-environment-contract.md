# Issue #21 — Execution Environment Contract + Cloud↔Local Handoff Receipt

Research deliverable for `Reese-max/autodev-ng#21`（P1 Research）。
第一階段只定義 contract、synthetic fixture 與 read-back verification 設計；
不部署雲端 runner、不搬 secrets、不改 repo settings。

## 1. 問題陳述

`projectPath` / `dataDir` / `worktree` / `team.db` 都是 host-bound；long-running
task 想移到雲端或另一台機器續跑時，沒有 first-class 的 versioned environment
descriptor / handoff bundle / read-back receipt 可證明「code/input/toolchain/
policy/local-only-resource」在新環境等價。手動複製會產生 silent drift。

## 2. Schema

### 2.1 `ExecutionEnvironment`

```jsonc
{
  "schemaVersion": 1,
  "envId": "env_<ulid>",
  "hostKind": "windows-local | wsl | cloud-runner | partner-sandbox",
  "facts": {
    "os": "windows-11-x64",
    "nodeVersion": "22.x", "pythonVersion": "3.11.x",
    "enginesAvailable": ["codex","freebuff"],
    "projectPathBinding": "C:/Users/.../repo",      // host-absolute
    "dataDirBinding": "C:/Users/.../data",
    "capabilities": ["git-worktree","sqlite","mcp"]
  },
  "policy": {
    "secretsPresent": ["names only — never values"],
    "localOnlyResources": ["team.db","evidence-ledger"]
  }
}
```

### 2.2 `EnvironmentRequirement`（task 端宣告）

```jsonc
{ "required": ["git-worktree","sqlite","engine:codex"],
  "preferred": ["engine:freebuff"],
  "forbidden": ["public-internet-egress"] }
```

### 2.3 `HandoffBundle`

```jsonc
{
  "bundleId": "hb_<ulid>",
  "taskId": "...", "executionId": "...",
  "sourceEnv": "env_a", "targetEnv": "env_b",
  "repoHash": "sha256(git rev-parse HEAD + diff of worktree)",
  "dataHash": "sha256(dataDir manifest)",
  "evidenceRefs": ["receipt_..."],
  "environmentContractDigest": "sha256(requirement ∩ env.facts)",
  "direction": "local→cloud | cloud→local | local→local",
  "createdAt": "..."
}
```

### 2.4 `ResumeReceipt`（read-back verification）

```jsonc
{
  "bundleId": "hb_...", "targetEnv": "env_b",
  "checks": [
    { "name": "repoHash", "expected": "...", "actual": "...", "ok": true },
    { "name": "enginePresent", "expected": "codex", "actual": "codex@x.y", "ok": true },
    { "name": "localOnlyResource", "expected": "team.db readable", "actual": "absent", "ok": false }
  ],
  "verdict": "RESUMABLE | DIVERGED-NEEDS-RECONCILE | UNSAFE",
  "reconcilePlan": null
}
```

## 3. 核心規則（issue 明文）

- **同一份 contract 雙向用**：cloud→local、local→cloud 都用 HandoffBundle +
  ResumeReceipt；回本機先比 repo/artifact/evidence hash，divergence →
  candidate reconcile plan，**不 silent overwrite worktree/dataDir**。
- environment 是 typed/inspectable/evidence-backed；「可攜」不代表
  「任何環境都可安全執行」。
- policy 可允許預先批准的 bounded auto-offload，但 contract 層仍留 exact
  receipt 且不擴權。
- provider-neutral：不直接變成某 vendor 的 client。

## 4. Phase-0/1 fixtures

| Fixture | 情境 |
|---|---|
| `identical-env` | 同機不同 worktree → RESUMABLE |
| `missing-engine` | target 無 codex → UNSAFE |
| `drifted-worktree` | repoHash 不同 → DIVERGED + reconcile plan |
| `local-only-absent` | team.db 不存在於 target → check 失敗但不 silent 複製 |
| `capability-subset` | 缺 preferred 但滿足 required → RESUMABLE with warning |

## 5. 不做什麼

- 不部署雲端 runner、不新增 provider 帳號。
- 不搬 secrets（secrets 只記名字；target 環境自行持有）。
- 不指定唯一雲端 backend（Cloudflare Workers port 是 portfolio 訊號，
  不是本 issue 的預設答案）。
