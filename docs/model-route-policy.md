# 有界模型路由與熔斷器（Issue #51）

`routePolicy` 為非 `free-only`、非 CLI 的純文字 HTTP 模型呼叫提供 opt-in 的**明示順序備援**：模型端點暫時不可用時，在已授權、角色相容的候選間有界切換；全部不可用時回明確原因與最早可重試時間，不無限重試。

未設定 `routePolicy` 或 `enabled: false` 時，`callAgent()` 行為完全不變（單一 URL 路徑）。`tierMode: "free-only"` 與 `llmTransport: "cli"` 分支不受此政策影響；`free-only` 繼續走既有的即時零定價、固定 OpenRouter endpoint 與獨立 reviewer 規則——把 `judgeUrl`/`reviewUrl` 指向 localhost 或 9Router 不會被當成免費路由放行。

## 設定範例

```json
{
  "llmTransport": "http",
  "judgeUrl": "http://127.0.0.1:8401/v1",
  "judgeModel": "combo-judge",
  "judgeApiKey": "{env:GATEWAY_KEY}",
  "routePolicy": {
    "enabled": true,
    "routeId": "judge-primary",
    "policyVersion": "1",
    "maxAttempts": 3,
    "perAttemptTimeoutMs": 30000,
    "totalDeadlineMs": 90000,
    "cooldownMs": 60000,
    "probeLeaseMs": 30000,
    "candidates": [
      { "id": "gw", "url": "http://127.0.0.1:8401/v1", "model": "combo-judge", "apiKey": "{env:GATEWAY_KEY}", "credentialRef": "gateway-main", "gateway": true },
      { "id": "direct", "url": "https://provider.example.com/v1", "model": "vendor/model-x", "apiKey": "{env:PROVIDER_KEY}", "credentialRef": "provider-main", "roles": ["judge"] }
    ]
  }
}
```

- `candidates` 為有序清單；每個候選有固定 `url`／`model`／`apiKey` 配對，金鑰可寫 `{env:VAR}`／`{file:PATH}` 引用（assemble 層展開）。`credentialRef` 是非秘密身分 ID，進入熔斷鍵；未設時以金鑰指紋代替，不落金鑰值。
- `maxAttempts` 上限 3（含首次），同一候選每次 logical call 最多一次。
- `roles` 未設＝全部角色；設定後只對該角色生效（如 `"roles": ["judge"]` 的候選不供 review 使用）。
- `gateway: true` 表示上游是 combo／代理入口：其內部 attempts 不可觀測，receipt 記 `upstreamAttempts: "unknown"`，不宣稱全鏈路次數。
- `maxCostUsd` 設定後，回應缺成本 metadata＝UNKNOWN 阻擋；回報成本超頂＝隔離該候選。
- 秘密引用不可用時在 dispatch 前阻擋整個 logical call，不繞道下一個 provider。

## 失敗分類（不是「失敗就換模型」）

可備援：HTTP 408／429／500／502／503／504、可辨識暫時性傳輸故障、單次嘗試逾時。

不備援（整個 logical call 立即失敗）：caller 取消、總 `totalDeadlineMs` 到期、401／403、其他非暫時狀態碼、無法解析或空回應、秘密引用缺漏、實際模型身分未知（被要求時）、命中排除名單、成本未知或超頂。逾時不代表上游沒有計費：先前 attempt 的成本標記 `unknown` 保留於 receipt，不歸零。

## 熔斷器語意

狀態持久化在 `dataDir/route-breakers/`，鍵＝normalized endpoint + credentialRef（或金鑰指紋）+ model 的雜湊，重啟不抹掉未到期冷卻：

- `CLOSED`（無檔案）：正常嘗試。
- `OPEN`：暫時性失敗後冷卻至 `retryAt`；尊重有效 `Retry-After`，缺漏或非法值採 `cooldownMs` 有界冷卻。冷卻中的候選直接略過，不消耗 attempt。
- `HALF_OPEN`：冷卻到期後只允許一個有 `probeLeaseMs` 期限的探測 lease（mkdir 原子互斥）；搶不到的並行 caller 走下一個候選，不放大嘗試次數。探測成功回 `CLOSED`，暫時性失敗回 `OPEN`。
- `QUARANTINED`：模型身分命中排除名單或成本超頂時持久隔離；計時器與成功競態都不得解除，只能人工檢查 receipt 後刪除狀態檔。

## Reviewer 獨立性

路由模式下 `reviewLlmFromConfig` 自動帶 `requireActualModel` 與排除名單（judgeModel＋所有 engine model）：上游未回報實際模型、gateway 只回 combo 別名（回報值等於要求 alias）、或回報模型命中排除名單時，該次審查 BLOCKED，不產生通過 receipt——gateway 別名不等於獨立模型證據。`actualModel` 只採信上游回報（receipt 標 `upstream-reported`），缺漏即 UNKNOWN，不從 alias 猜測。

## 單一 retry owner

每個 logical call 只有 autodev-ng 這一層做備援。候選指向 gateway 時，營運方必須在 gateway 側設定單一固定 upstream／停用其內部重試備援，否則全鏈路嘗試次數不可觀測（receipt 記 `unknown`），不得宣稱有界。反向情境（要測 gateway 內部 combo 備援）時，autodev-ng 側只應配置單一候選。

## Receipts

`dataDir/route-calls.jsonl` 每次嘗試與結果各記一行：`callId`、`routeId`／`policyVersion`、`role`、`requestedModel`、`candidateId`、`attempt`、`breakerState`、`failureClass`、`httpStatus`、`durationMs`、`actualModel`（`actualModelSource: upstream-reported|unknown`）、`totalTokens`、`cost`（缺漏記 `unknown`，非 0）、`retryAt`、`upstreamAttempts`。不寫入 prompt、程式碼、API key、Authorization header 或 provider 完整 error body。

## 9Router 相容性狀態：**UNVERIFIED**

本案只借鏡 9Router 的 Combo／Fallback 架構概念。對真實 9Router 的相容性只有在使用者授權的隔離環境、固定版本、明示模型與預算下做 bounded canary 後才可標 `VERIFIED`；本機 mock HTTP fixture 通過不代表 9Router 已驗證。當前狀態：UNVERIFIED（未接真實 9Router）。
