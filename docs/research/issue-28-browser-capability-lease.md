# Issue #28 — Browser Capability Lease + Human Takeover Receipt

Research contract for `Reese-max/autodev-ng#28`（P1 Research / SECURITY）。與 #12（egress）、#17（principal/credential lease）、#21（execution env）互補：本合約只界定既有瀏覽器 tab 的觀察、有限控制權、接管與可驗證歸還；不實作瀏覽器 bridge。

## 1. 安全邊界

已登入 tab 帶有 ambient authority。lease 是綁定單一 opaque tab、execution、principal、origin、動作與期限的暫時 capability；不是 profile 權限、credential transfer，也不是外部效果授權。`window` 不作為 surface：window 內只能明確選定一個 tab，其他 tab 與 profile 一律在範圍外。

以下 schema 名稱與 `schemaVersion: 1` 是此研究合約的 canonical v1。未知版本、欄位或 capability 一律拒絕控制；不以猜測降級。時間採 RFC 3339 UTC；識別碼不透明且不可重用。

## 2. Versioned contracts

### 2.1 `BrowserCapabilityObservation` v1

唯讀盤點只回報 adapter 可觀察的 metadata，不讀取 DOM 內容、表單值或 credentials。

```json
{
  "schema": "BrowserCapabilityObservation",
  "schemaVersion": 1,
  "observationId": "bco_01",
  "taskId": "task_01",
  "executionId": "exec_01",
  "environmentId": "env_01",
  "observedAt": "2026-10-21T00:00:00Z",
  "capability": "SUPPORTED",
  "connection": "CONNECTED_READONLY",
  "surface": { "kind": "existing-tab", "opaqueTabId": "tab_01" },
  "origin": "https://github.com",
  "sharedAuth": "USER_SESSION",
  "evidenceRefs": ["meta:observation/bco_01"]
}
```

`capability` 為 `SUPPORTED | UNSUPPORTED | UNKNOWN`；`connection` 為 `DISCONNECTED | CONNECTED_READONLY | CONTROL_ACTIVE | UNKNOWN`。唯讀盤點不得改變 tab、focus、navigation 或 auth 狀態。Inventory 必須逐 tab 列出 opaque id、origin、capability、connection、shared-auth 分類及 observation 時間；不得列 title、URL path/query、DOM、storage、profile 路徑或秘密。不能讀到的欄位標 `UNKNOWN`，不推論為安全。

### 2.2 `BrowserCapabilityRequest` v1

```json
{
  "schema": "BrowserCapabilityRequest",
  "schemaVersion": 1,
  "requestId": "bcr_01",
  "taskId": "task_01",
  "executionId": "exec_01",
  "environmentId": "env_01",
  "principalId": "prin_01",
  "observationId": "bco_01",
  "purpose": "Read the requested public issue page",
  "sharedAuth": "USER_SESSION",
  "requested": {
    "surface": { "kind": "existing-tab", "opaqueTabId": "tab_01" },
    "origins": ["https://github.com"],
    "actions": ["navigate", "read-dom"],
    "ttlSeconds": 120
  },
  "effectRefs": []
}
```

### 2.3 `BrowserCapabilityLease` v1

```json
{
  "schema": "BrowserCapabilityLease",
  "schemaVersion": 1,
  "leaseId": "bcl_01",
  "requestId": "bcr_01",
  "taskId": "task_01",
  "executionId": "exec_01",
  "environmentId": "env_01",
  "principalId": "prin_01",
  "observationId": "bco_01",
  "purpose": "Read the requested public issue page",
  "sharedAuth": "USER_SESSION",
  "granted": {
    "surface": { "kind": "existing-tab", "opaqueTabId": "tab_01" },
    "origins": ["https://github.com"],
    "actions": ["navigate", "read-dom"],
    "expiresAt": "2026-10-21T00:02:00Z"
  },
  "state": "CONTROL_ACTIVE",
  "leaseGeneration": 1,
  "nextActionSequence": 1,
  "effectRefs": []
}
```

Grant must be a subset of the request and the fresh observation. Only `existing-tab` or an explicitly created `new-tab` is valid; a window/profile grant is invalid. `origin` is a canonical serialized origin: scheme + host + effective port, no credentials/path/query/fragment. Match exact origins; subdomains, scheme changes and non-default ports do not inherit a grant. Redirects and popups/new tabs are `OUT_OF_SCOPE` until separately observed and approved.

Each action is a one-use envelope bound to `leaseId`, `executionId`, `leaseGeneration`, monotonically increasing `sequence`, `actionClass`, target tab, origin, and deadline no later than the lease expiry. Check all fields immediately before dispatch. Reject duplicates, gaps, expired actions, stale generation, revoked lease and wrong execution. Revocation/takeover fences queued actions and waits for in-flight dispatch to settle; no action may be dispatched after the fence. A timeout with uncertain dispatch is recorded as unknown, never replayed.

States: `UNKNOWN`, `UNSUPPORTED`, `CONNECTED_READONLY`, `CONTROL_ACTIVE`, `TAKEN_OVER`, `RETURNED`, `EXPIRED`, `REVOKED`. Only `CONTROL_ACTIVE` can dispatch granted actions. Read-only connection cannot click, fill, navigate or invoke effects. Expiry, revoke, rejection, or takeover ends control. A user-approved continuation creates a new request and lease generation after a fresh observation; it never renews the old lease or preserves DOM/node references. Every observation invalidates prior DOM references on navigation, tab switch, takeover, reconnect or generation change.

### 2.4 `BrowserLeaseReceipt` v1

```json
{
  "schema": "BrowserLeaseReceipt",
  "schemaVersion": 1,
  "leaseId": "bcl_01",
  "taskId": "task_01",
  "executionId": "exec_01",
  "environmentId": "env_01",
  "startedAt": "2026-10-21T00:00:00Z",
  "endedAt": "2026-10-21T00:01:00Z",
  "endReason": "TAKEN_OVER",
  "disposition": "RETURNED",
  "verification": "VERIFIED",
  "agentNotified": true,
  "finalAgentAction": "act_04",
  "postTakeoverAgentActions": 0,
  "ambientAuthorityDropped": true,
  "effectRefs": [],
  "evidenceRefs": ["meta:release/bcl_01"]
}
```

`endReason` is `USER_RETURN | EXPIRED | REVOKED | TAKEN_OVER | REJECTED | BRIDGE_LOST | POLICY`; `disposition` is `RETURNED | EXPIRED | REVOKED | UNKNOWN`; `verification` is `VERIFIED | UNVERIFIED`. `TAKEN_OVER` always terminates the agent lease and requires this same receipt path, normally `disposition: RETURNED`. `UNKNOWN` or `UNVERIFIED` is mandatory if bridge loss or missing runtime evidence prevents verification; never set `ambientAuthorityDropped: true` without verified detach/revocation evidence. This field means the agent's bridge/control was dropped, not that the user's browser session was logged out. Receipt evidence contains metadata references only.

## 3. Effects, page content and privacy

A browser lease never authorizes an external effect. Before any effectful action, evaluate #12 `ExternalEffectSpec` independently and bind its decision id in `effectRefs`. Login, OTP, CAPTCHA, payment, send, delete and publish require human handoff before the action; no lease action can bypass that boundary. Emit `ACTION_ATTEMPTED`, then `EFFECT_CONFIRMED` only with canonical external confirmation evidence, or `EFFECT_UNKNOWN` when outcome cannot be established. An ambiguous submit must not be retried until canonical state is checked and confirms the effect did not occur; otherwise remain unknown and hand off.

Page text, DOM, screenshots, logs and artifacts are untrusted data. They cannot widen origins, action classes, credentials, effect decisions or expiry. Reject an attempted widening and record only a sanitized reason. Never store or include cookies, bearer tokens, passwords, password-manager values, form secrets, local/session storage, request bodies, sensitive URL query/fragment, raw DOM, screenshots, or logs/artifacts that may contain these in observations, receipts or referenced evidence. `evidenceRefs` must resolve to access-controlled metadata-only records with retention policy; do not reference opaque artifacts unless scrubbed and verified safe.

Human takeover is not credential transfer. User cancellation is `REJECTED`, never an instruction to find another path. Takeover fences new dispatch immediately, settles/marks in-flight action outcome, notifies the agent, invalidates all old DOM references, and requires fresh observation before any separately approved continuation.

## 4. Synthetic contract fixtures and evidence map

`tests/fixtures/browser-capability-lease-v1.json` is an offline, synthetic policy test vector set; no browser, profile, network, or credentials are accessed. Run it with:

```powershell
node --test tests/regressions/github-29.test.cjs
```

The Node tests execute the small reference decision table against every fixture. A deterministic clock and lease/action envelopes check identity, generation, deadline and one-use sequence consumption. Effects require an independent `ALLOW` plus a decision reference; `ASK` or protected actions hand off, while `DENY` and unverified decisions cannot dispatch. Release claims must resolve to matching verified records in the synthetic metadata evidence map. This is contract regression coverage, not proof that a production browser adapter enforces the policy.

Issue #28's isolated synthetic browser/profile runtime acceptance remains pending: this table does not exercise a browser adapter, in-flight fencing, DOM invalidation or hostile page/secret handling. Public schema validation, shared-auth classifications and fresh-observation age also need an agreed contract before implementation. This PR remains a partial research deliverable.

| Fixture | Required result | Evidence mapping |
|---|---|---|
| `scoped-tab-lease` | allow same tab/origin/granted read action | observation + lease + action decision |
| `sibling-tab-denied`, `profile-denied` | deny outside selected tab/profile | inventory observation + `OUT_OF_SCOPE` |
| `readonly-control-denied` | deny click while read-only | observation connection + action decision |
| `stale-replay-denied`, `revoked-action-denied` | deny stale generation/replay or revoked lease | lease generation/sequence + rejection |
| `takeover-freshness` | reject an explicitly stale observation after takeover | stale-observation flag + action rejection; DOM runtime acceptance pending |
| `protected-effect-handoff` | hand off before protected action | #12 decision reference + `ACTION_ATTEMPTED` boundary |
| `page-injection-cannot-widen` | reject page-originated scope widening | sanitized rejection metadata |
| `ambiguous-submit-no-retry` | `EFFECT_UNKNOWN`; no second dispatch absent canonical absence proof | effect event + confirmation lookup result |
| `redirect-out-of-scope` | deny changed origin pending separate approval | observed origin + `OUT_OF_SCOPE` |
| `lease-expiry-receipt`, `lease-revocation-receipt`, `bridge-loss-unknown`, `no-secret-evidence` | require verified return/expiry/revocation metadata; unknown if unverifiable | matching synthetic release record + metadata-only evidence refs; live detach/privacy acceptance pending |

## 5. Phase 1 scope

- Deliver only this versioned contract, synthetic fixtures, and offline regressions.
- Do not export cookies/session, grant whole-profile access, or implement a real browser bridge.
- A passing static/reference-model regression is not browser enforcement, security certification, or `BROWSER_LEASE_VERIFIED`.
