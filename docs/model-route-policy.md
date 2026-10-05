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
- `maxAttempts` 上限 3（含首次），同一候選每次 logical call 最多一次。角色相容候選若包含 `gateway: true`，有效外層上限降為 1，避免外層備援與內層隱藏重試相乘；receipt 明示 `outerAttemptLimit`。
- 候選 reference ID 必須唯一；同一 normalized endpoint／credential reference／model 即使用不同 reference ID 重複列出，也只會 dispatch 一次，不因極短冷卻在同一 logical call 重新嘗試。
- `roles` 未設＝全部角色；設定後只對該角色生效（如 `"roles": ["judge"]` 的候選不供 review 使用）。
- `gateway: true` 表示上游是 combo／代理入口：其內部 attempts 不可觀測，receipt 記 `upstreamAttempts: "unknown"`，不宣稱全鏈路次數。
- `maxCostUsd` 是 hard cap。一般 HTTP adapter 目前沒有可在 dispatch 前核對的最壞請求成本／預留機制，因此設定此欄位時以 `cost-unknown` 阻擋整個 logical call，HTTP attempts 為 0。回應自報的成本是事後資訊，不能當成事前成本界限；不新增價格、授權或退款假設。未設定此欄位的路由仍保留每個已送出 attempt 的成本 UNKNOWN receipt。
- 秘密引用不可用時在 dispatch 前阻擋整個 logical call，不繞道下一個 provider。

## 失敗分類（不是「失敗就換模型」）

可備援：HTTP 408／429／500／502／503／504、可辨識暫時性傳輸故障、單次嘗試逾時。

不備援（整個 logical call 立即失敗）：caller 取消、總 `totalDeadlineMs` 到期、401／403、其他非暫時狀態碼、無法解析或空回應、秘密引用缺漏、實際模型身分未知（被要求時）、命中排除名單、成本未知或超頂。逾時不代表上游沒有計費：先前 attempt 的成本標記 `unknown` 保留於 receipt，不歸零。

## 熔斷器語意

狀態持久化在 `dataDir/route-breakers/`，鍵＝normalized endpoint + credentialRef（或金鑰指紋）+ model 的雜湊，重啟不抹掉未到期冷卻：

- `CLOSED`（無檔案）：正常嘗試。
- `OPEN`：暫時性失敗後冷卻至 `retryAt`；尊重有效 `Retry-After`，缺漏或非法值採 `cooldownMs` 有界冷卻。冷卻中的候選直接略過，不消耗 attempt。
- `HALF_OPEN`：冷卻到期後只允許一個探測者，沿用 `src/lock.ts` 的跨行程世代 token／SQLite 互斥。`probeLeaseMs` 是不明持有人狀態的 stale 回收等待窗；活著的探測行程不因等待窗到期失去 lease，每個 HTTP attempt 仍有有限逾時。搶不到 lease 的 caller 走下一個候選；舊 token 的 release 不會刪除下一世代。探測成功回 `CLOSED`，暫時性失敗回 `OPEN`。
- `QUARANTINED`：模型身分違規時持久隔離；新增獨立的 `<key>.quarantine.json` marker，讀取優先於舊 `<key>.json`。計時器、並行成功及 OPEN 寫入都不能移除 marker；已在途的成功回應若發現隔離也回 BLOCKED。人工檢查後解除時必須一併移除 marker 與舊狀態檔，不能只刪除舊檔。既有隔離狀態仍能讀取。

## Reviewer 獨立性

路由模式下 `reviewLlmFromConfig` 自動帶 `requireActualModel` 與排除名單（judgeModel＋所有 engine model）：上游未回報實際模型、gateway 只回 combo 別名（回報值等於要求 alias）、或回報模型命中排除名單時，該次審查 BLOCKED，不產生通過 receipt——gateway 別名不等於獨立模型證據。`actualModel` 只採信上游回報（receipt 標 `upstream-reported`），缺漏即 UNKNOWN，不從 alias 猜測。

## 單一 retry owner

每個 logical call 只有一層能做重試。一般直接 HTTP 候選由 autodev-ng 有界備援；角色相容候選若包含 `gateway: true`，autodev-ng 強制最多送出一次外層請求，不再對失敗的 Gateway 加另一輪備援。Gateway 內部次數仍不可觀測（receipt 記 `unknown`），不宣稱全鏈路最多一次或三次；營運方仍需在 Gateway 側限制內部請求。冷卻中的候選可先略過，但每個 logical call 的實際外層 dispatch 仍最多一次。

## Receipts

`dataDir/route-calls.jsonl` 每次嘗試與結果各記一行：`callId`、`routeId`／`policyVersion`、`role`、`requestedModel`、`candidateId`、`attempt`／`outerAttemptLimit`、`breakerState`、`failureClass`、`httpStatus`、`durationMs`、`actualModel`（`actualModelSource: upstream-reported|unknown`）、`totalTokens`、`cost`（缺漏記 `unknown`，非 0）、`retryAt`、`upstreamAttempts`。不寫入 prompt、程式碼、API key、Authorization header 或 provider 完整 error body。

`phase: completed` 只代表此 logical HTTP 推論已取得可解析回應，並非任務、測試或審查驗證通過。隔離回應、成本阻擋、冷卻等待分別保留 `quarantined`、`blocked`、`skipped`／`retryAt`，不以 HTTP 200 產生任務完成證據。dispatch 前阻擋的 `attempts: 0` 也不是對上游實際帳單的零收費聲明。

回應必須是 JSON object，`choices`／message／usage 的形狀與已提供的 token／成本數值須有效；非法回應以 `invalid-response` 阻擋，不備援，並釋放自己持有的 probe。實際模型 metadata 僅接受最多 256 字元的 identifier 形狀（英數與 `._:/@-`），不能包含當前候選金鑰、URI URL，或等於當前 endpoint／去除首尾空白的完整 prompt；非法值不落 receipt。此格式與已知輸入回顯檢查、`upstream-reported` 都不能證明模型身分或 reviewer lineage 的真實性。傳輸錯誤只記通用類別，不儲存上游 exception 的原文。

## 本機驗證

先以 `npm run build` 建立此 checkout 的 `dist`，再執行：

```sh
npm test -- tests/infra-retry.test.ts tests/model-route-policy.test.ts tests/model-route-policy-http.test.ts tests/scheduler-infra-retry.test.ts
node --test tests/regressions/github-51.test.cjs
```

真實 loopback HTTP fixture 覆蓋 URL／固定認證配對、429 備援、redirect 拒絕、attempt timeout、deadline、成本阻擋、冷卻重啟、並行隔離及跨行程 HALF_OPEN。跨行程測試若沒有此 checkout 的編譯產物會失敗，不略過。測試只使用虛構金鑰與本機端點；不啟動 CLI 模型或真實 9Router。

## 9Router 相容性狀態：**UNVERIFIED**

本案只借鏡 9Router 的 Combo／Fallback 架構概念。對真實 9Router 的相容性只有在使用者授權的隔離環境、固定版本、明示模型與預算下做 bounded canary 後才可標 `VERIFIED`；本機 mock HTTP fixture 通過不代表 9Router 已驗證。當前狀態：UNVERIFIED（未接真實 9Router）。
