# Issue #11 — in-flight Steer 與 next-turn Queue 契約

此文件記錄目前實作。控制面位於 `src/engines/steering.ts`，引擎能力表位於
`src/engines/capabilities.ts`，Discord/CLI 入口與回歸測試分別在
`src/bot/actions.ts`、`src/cli/executions.ts`、`tests/steering.test.ts`。

## 目標綁定信封

`ControlStore.submit()` 接收 `project`、`executionId`、`mode`、`instruction`、
`issuer` 與 `channel`。它從該 execution 的觀測快照取得 `taskId` 與 adapter，
再將以下資料持久化至 `<dataDir>/controls/`：

- `project`、`taskId`、`executionId`、`requestedMode`、實際 `mode`
- 原始 `instruction` 與 SHA-256 `instructionHash`
- `issuer`、`channel`、`createdAt`、`expiresAt`、狀態與 disposition

TTL 為 30 分鐘。每次狀態轉移都在 `controls/receipts/` 寫入包含目標、issuer、
指示雜湊、requested mode、disposition 與時間的雜湊收據。收據中的 `commitId`
須與信封相符且沒有未完成交易，才代表信封可供派送；被拒絕的請求也會留下
不可派送的拒絕收據。

輸入須為非空單行，最多 500 字，並拒絕 HTML 註解與 `adng:` 控制註記。相同
execution 已有相同雜湊的待處理指示會被拒絕重放；每個 execution 最多 16 筆
待處理信封。

## 兩種控制語意

| 模式 | 行為 | 成功受理後的狀態 |
|---|---|---|
| `STEER` | 只在目標 execution 的回合仍為 `running` 且 adapter 宣告支援時，等待 adapter 在安全點取用；取用後為 `STEERED`。 | `PENDING` → `STEERED` |
| `QUEUE` | 保留給同一 `taskId`、同一 `executionId` 的後續安全回合；依 FIFO 順序在派送前 claim，回合成功完成後才記為 `DELIVERED`。 | `QUEUED` → `CLAIMED` → `DELIVERED` |

若 `STEER` 到達時回合已結束，但 execution 仍活著且 adapter 支援 next-turn
queue，會明確轉成 `TOO_LATE_QUEUED`，其實際 `mode` 改為 `QUEUE`，收據仍保留
`requestedMode: STEER`。這不是靜默降級。

`/task <文字>` 與 execution queue 是不同工作：`/task` 新增一個未來 backlog
項目，沒有綁定目前的 task 或 execution；`QUEUE` 不新增 backlog 項目，而是
把指示附到目前 task/execution 的後續回合。該 follow-up 會啟動新的 worker
invocation，不保證延續前一個程序的 session context。

## 拒絕與未確認狀態

- 目標不存在、已終結、degraded、正在取消或宿主程序已不存在：
  `REJECTED_STALE_TARGET`，不會轉送到其他 execution。
- adapter 不支援所需能力：`UNSUPPORTED`。
- 無法安全接受的文字、重放、超出容量或控制紀錄有未完成交易：
  `REJECTED_INVALID`。
- 尚未送達的 queue 過期或目標消失：`STALE`；尚未取用的 steer 無法送達：
  `NOT_DELIVERED`。
- 已 claim 的 queue 若無法確認結果會是 `DELIVERY_UNKNOWN`；不得直接重送，應先
  核對 execution 與收據。派送前失敗則為 `NOT_DELIVERED`。

目前 `mock` adapter 支援 in-flight steer 與 next-turn queue。多數 process
adapter 僅宣告 next-turn queue；`agy`、`herdr`、`freebuff` 不宣告這兩項能力。
能力表代表程式契約，不等於已驗證特定主機上安裝的 CLI 或真實 provider 流程。

## 操作入口與驗收覆蓋

- Discord：`/steer <executionId> <指示>`、`/enqueue <executionId> <指示>`、
  `/controls`。
- CLI：`adng execution steer|enqueue --config <path> --id <executionId> --text <指示>`、
  `adng execution controls --config <path>`。
- `/status`、`/monitor` 顯示完整 execution ID，供操作員指定確切目標。
- `tests/steering.test.ts` 覆蓋 stale target、輸入防線、重放、能力限制、FIFO、
  收據、Discord/CLI 入口與 mock adapter 端到端派送。

目前 API 沒有 `expectedPhase`／turn selector；提交時驗證 execution 快照、phase
與 adapter 能力，派送時再驗證目標 task/execution。收據記錄控制狀態轉移，尚未
宣稱把每筆控制指示連結到最終產出或驗收結果。
