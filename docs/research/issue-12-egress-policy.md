# Issue #12 — 跨引擎 Egress Policy / External-Effect Firewall

Research deliverable for `Reese-max/autodev-ng#12`（P1 Research）。
只授權 contract / synthetic fixture / isolated runtime probe 設計；
不改主機防火牆、系統 proxy、憑證、secrets、production 網路。

## 1. 問題陳述

各 engine adapter（Codex/Claude/Copilot/Qwen/Grok/OpenCode/Devin/Herdr/
Freebuff）的 sandbox/network 語意各自不同；沒有一個 task-bound 的
central outbound contract。agent/MCP/subprocess 可能把未知網站變成
寫入通道。

## 2. Schema

### 2.1 `EgressPolicy`（task-bound）

```jsonc
{
  "policyVersion": 1,
  "taskId": "...",
  "allowedDomains": ["github.com","api.github.com"],
  "deniedDomains": [],
  "allowedMethods": ["GET","POST"],
  "dataClasses": {
    "repo-content": "allow",
    "secrets": "deny",
    "issue-body": "allow"
  },
  "defaultRule": "deny",
  "ttl": "PT2H"
}
```

### 2.2 `EgressAttempt`（runtime probe 記錄）

```jsonc
{
  "attemptId": "eg_<ulid>",
  "executionId": "...", "engineTag": "...",
  "destination": "example.com", "method": "POST",
  "dataClass": "repo-content",
  "disposition": "allowed | denied | deferred-for-approval",
  "policyVersion": 1,
  "receiptRef": "rcpt_..."
}
```

### 2.3 `EgressReceipt`（每次 enforcement 決策）

```jsonc
{ "receiptId": "rcpt_...", "attemptId": "eg_...",
  "policyDigest": "sha256(policy)",
  "reason": "domain-allowed | domain-not-in-allowlist | method-denied | data-class-denied",
  "latencyMs": 4 }
```

## 3. Enforceability matrix（issue §208：contract 成立前不做 UI）

| Engine | Enforcement 可行性 | Phase-1 方式 |
|---|---|---|
| Codex | 已有受限 sandbox + `sandbox_permissions` | 讀既有 flag 映射到 EgressPolicy |
| Freebuff | CLI wrapper 可包 env/proxy | subprocess env 攔截 |
| 其他 CLI | 無原生 sandbox | runtime probe（見 §5） |
| MCP tool call | 經本地 MCP server | server 端 policy check |

**Contract 不裝成 enforcement**——enforcement 由 owning runtime 實作，
central schema 只定義型別與 receipt。

## 4. 規則（issue 明文）

- `defaultRule: deny`；allowlist 是正向列舉，不是預設放行。
- receipt **不保存** Authorization header、cookie、query token、body。
- blocked attempt 要能回答：哪個 execution、哪個 origin、去哪、被哪版
  policy 擋——但 secret/payload 不落 log。
- 只有 contract + runtime probe 成立後才考慮 CLI/Discord `egress status` UI。

## 5. Phase-0 fixtures

| Fixture | 情境 |
|---|---|
| `allowlisted-github` | POST api.github.com → allowed + receipt |
| `unknown-domain` | POST telemetry.example.com → denied + receipt |
| `method-denied` | GET 允許但 DELETE github.com → denied |
| `secret-egress` | dataClass=secrets → 一律 denied（不受 domain allowlist 影響） |
| `probe-unavailable` | engine 無 enforcement → attempt 記 `unenforced`，不假裝擋下 |

## 6. 不做什麼

- 不實作 host firewall / system proxy / cert 變更。
- 不把 OpenAI 內部 proxy stack 照抄進本 repo。
- 不在 enforcement 成立前做漂亮 UI。
