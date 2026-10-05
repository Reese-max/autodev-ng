# Issue #17 — Agent Principal / Credential Lease Registry

Research deliverable for `Reese-max/autodev-ng#17`（P1 Research）。
只做 identity contract、read-only inventory、synthetic fixture、evidence
mapping；不新增 credential broker、不改 secrets、不做 runtime enforcement。
#13–#16 恢復綠燈前不進 production 實作。

## 1. 問題陳述

`Job.executionId` 已是 correlation key，但 `writerIdentity` 只解析到
`engineTag`——同 engine 的兩個 instance 無法被證明是不同 actor，也無法被
獨立撤銷。缺的是 `engineTag` 之上、human owner 之下的 **accountable
principal**。

## 2. Schema

### 2.1 `AgentPrincipal`

```jsonc
{
  "principalId": "prin_<ulid>",
  "ownerSubject": "subj_<human/team>",
  "engineTag": "codex | claude | freebuff | ...",
  "instanceLabel": "worktree-adng-17 | discord-bot-1",   // 同 engine 的區分
  "lifecycle": "active | suspended | revoked | expired",
  "createdAt": "...", "revokedAt": null,
  "revocationReason": null
}
```

### 2.2 `CredentialLease`

```jsonc
{
  "leaseId": "lease_<ulid>",
  "principalId": "prin_...",
  "scope": ["repo:autodev-ng","action:commit","action:open-pr"],
  "notBefore": "...", "expiresAt": "...",
  "binding": "engine-session | mcp-connection | cli-invocation",
  "revocable": true
}
```

### 2.3 `EffectReceipt` 延伸（接既有 evidence chain）

既有 receipt 的 `writer` 欄位從 `engineTag` 擴成：

```jsonc
{ "writer": { "principalId": "prin_...", "engineTag": "codex",
              "leaseId": "lease_...",
              "identityConfidence": "verified | shared | unknown" } }
```

`shared`/`unknown` 是合法值——當多 actor 共用 runtime 時明說，不假裝可歸因。

## 3. 核心規則（issue 明文）

- `Principal → bounded credential binding/lease → requested action →
  independent runtime policy → effect receipt`。
- 每個 consequential receipt 都要能歸因到 principal，**或明說 identity 是
  shared/unknown**。
- 撤銷 principal → 其所有 lease 一併失效；revocation 本身也留 receipt。
- inventory 是 read-only：Phase 1 只**列舉**現有 engineTag/env/file/
  provider-native credential paths，不修改。

## 4. Phase-0 fixtures

| Fixture | 情境 |
|---|---|
| `two-same-engine` | 兩個 codex instance → 兩個 principalId，可獨立撤銷 |
| `lease-expired` | expiresAt 過期 → action 拒絕且 receipt 記 `lease-expired` |
| `shared-identity` | 共用 runtime → `identityConfidence: shared`，不假裝獨立 |
| `revocation-receipt` | revoke principal → 產 receipt + 其 leases 全失效 |
| `cross-env` | principal 在兩台機器各跑過 → 同 principalId、不同 envId（接 #21） |

## 5. Incident-response 價值（issue §132）

有 principal contract 時，事故處理從「找 process、翻 log、撤整個 provider
session」變成「revoke principalId → 其 lease 全失效 → receipt 自動說清哪
些 action 出自它」。

## 6. 不做什麼

- 不建 broker/OAuth client/host identity provider。
- 不旋轉 secrets、不登出使用者、不改 OS/Cloud IAM。
- 不在 #13–#16 綠燈前做 runtime enforcement。
