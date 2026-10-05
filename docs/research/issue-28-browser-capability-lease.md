# Issue #28 — Browser Capability Lease + Human Takeover Receipt（研究設計）

Research deliverable for `Reese-max/autodev-ng#28`（P1 Research / SECURITY）。
與 #12（egress）、#17（principal/credential lease）、#21（execution env）
互補但不重疊：本 issue 管的是「借用已登入瀏覽器分頁」的取得/歸還/接管
生命週期。

## 1. 核心命題

已登入 tab 代表 ambient authority（cookies/session）；借給 agent 時必須是
**tab-scoped 的暫時 capability lease**，不是整個 profile 的權力，也不是
cookie 匯出。

## 2. Schema

### 2.1 `BrowserCapabilityLease`

```jsonc
{
  "leaseId": "bcl_<ulid>",
  "principalId": "prin_...",            // 接 #17
  "executionId": "...",
  "surface": {
    "kind": "existing-tab | new-tab | window",
    "opaqueTabId": "tab_...",           // 不透明 id，不存 URL 以外資訊
    "originAllowlist": ["github.com"]
  },
  "actionClasses": ["navigate","read-dom","click","fill-form-field"],
  "expiresAt": "...",
  "state": "ACTIVE | RETURNED | EXPIRED | REVOKED | TAKEN_OVER"
}
```

### 2.2 `HumanTakeoverReceipt`

```jsonc
{ "leaseId": "bcl_...", "takeoverAt": "...",
  "trigger": "user-hotkey | user-click | timeout | policy",
  "agentNotified": true, "finalAgentAction": "act_...",
  "postTakeoverAgentActions": 0 }       // 必須是 0；>0 = 違規證據
```

### 2.3 `ReturnReceipt`

```jsonc
{ "leaseId": "...", "disposition": "RETURNED | EXPIRED | REVOKED",
  "ambientAuthorityDropped": true, "evidenceRefs": ["..."] }
```

## 3. 規則（issue 明文）

- **永不儲存** cookies、bearer tokens、password-manager 值、
  localStorage/sessionStorage dump、form secrets 到 observation/receipt。
- human takeover ≠ agent credential transfer；接管是終止 lease 的事件，
  不是把權力移給別的 principal。
- 使用者取消 takeover 是 **rejection**，不是讓 agent 換條路重試。
- lease 結束必須有 `RETURNED/EXPIRED` 證據——daemon/extension/profile
  還開著不代表 agent 還有權。
- 跳出 lease 範圍的 redirect/新 tab → `OUT_OF_SCOPE`，需另行批准。

## 4. Fixtures

| Fixture | 情境 |
|---|---|
| `scoped-tab-lease` | 借用單一已登入 tab，action 限 allowlist |
| `human-takeover` | 使用者接管 → lease → TAKEN_OVER，agent 動作計數=0 |
| `lease-expiry` | 逾時 → EXPIRED + ReturnReceipt |
| `redirect-out-of-scope` | 分頁導向非 allowlist origin → OUT_OF_SCOPE |
| `no-cookie-leak` | receipt 驗證不含 cookie/storage dump |

## 5. 不做什麼

- 不做 cookie/session 匯出機制。
- 不給 agent whole-profile 權限。
- 不實作真實瀏覽器控制（Phase 1 只 contract + fixtures）。
