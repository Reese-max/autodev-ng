# 單機試行驗收紀錄合約（issue #38）

本文件定義 issue #38「無桌面登入啟動、故障恢復、還原告警與 72 小時單機試跑」的驗收紀錄格式、判定規則與執行手冊。試行本身必須在另行明確授權的 Windows 測試主機上執行：3–5 個隔離測試 repo、1 個 Worker、一條指定 Herdr 主力 backend，每 repo 維持單一執行主機。本文件只釘死紀錄合約——未取得證據的項目一律 `NOT_RUN`，`FAIL`／`UNSUPPORTED` 原樣保留，不得以排程註冊成功、版面恢復或 CI 綠燈冒充驗收通過。

試行前置：#32、#33、#34、#35 的指定 Herdr 路徑與 #36 公平派工須完成相應驗證，並恢復 #13 release CI；在 `boot-reconnect.evidence` 保存各前置的 commit、檢查結果與私有收據參照。未取得前置證據不得開始試行或判 PASS；維持 `INCOMPLETE`。#37 的測試維護研究不是 bugfix-only 試行的必要前置。

## 驗收紀錄檔

試行期間由操作員在測試主機維護 `data/host-trial.json`（私有證據，不上傳公開 repo）。以本範本初始化後逐項填寫；`hostId`、`releaseSha` 必須與 `scripts/host.mjs` 的 `host.json`／runtime commit 一致，`environment.configSha256` 為 `configs/project.json` 位元組的 SHA-256。

```json
{
  "version": 1,
  "hostId": "",
  "releaseSha": "",
  "recordedAt": "",
  "windowHours": 72,
  "environment": {
    "node": "",
    "workerCli": "",
    "herdr": "",
    "launcher": "",
    "configSha256": ""
  },
  "authorizedRepos": [],
  "costCapUsd": 0,
  "criteria": {
    "boot-reconnect": { "status": "NOT_RUN", "evidence": [] },
    "fault-injection": { "status": "NOT_RUN", "evidence": [] },
    "backup-restore-rollback": { "status": "NOT_RUN", "evidence": [] },
    "external-offline-alert": { "status": "NOT_RUN", "evidence": [] },
    "trial-72h": {
      "status": "NOT_RUN",
      "evidence": [],
      "metrics": {
        "required": ["observedStart", "observedEnd", "effectiveRuntimeMs", "counts", "scheduledFaults", "unscheduledRescues", "recoveryDurationsMs", "reposWithDeliverables", "repoWaits", "cost"],
        "zero": ["unauthorizedWrites", "duplicateWriters", "costSwitches"]
      }
    }
  },
  "hardFailures": [],
  "verdict": "INCOMPLETE"
}
```

`evidence` 每筆為 `{ "at": "<ISO8601>", "summary": "<一句話>", "ref": "<收據路徑或雜湊>" }`；公開報告只保留 metadata／雜湊／遮蔽後證據。

## 狀態詞彙

- `NOT_RUN`：初始與未觀測狀態；不得以任何形式改寫為通過。
- `PASS`：只在有對應 `evidence` 時合法；`evidence` 為空不得標 PASS。
- `FAIL`：觀測到未達標行為；原樣保留，不得覆蓋。
- `UNSUPPORTED`：環境或相依元件不支援該項驗收（例如實際版本依賴互動 client）；須附最小待補項說明，不得假裝已通過。

## 五組驗收鍵與既有工具對應

| criterion | 驗收內容 | 既有工具（不重新開發） |
|---|---|---|
| `boot-reconnect` | 未登入桌面重開機後由正確帳號載入指定 release 與設定；Herdr 定位／恢復正確工作；完成至少一次真實 Issue → Agent → 宿主驗證／獨立審查 → 草稿 PR | `scripts/install-host-task.ps1`（Password logon，`-WhatIf` 先行）、`scripts/host.mjs doctor --home DIR --live`、`scripts/verify-host-release.mjs` |
| `fault-injection` | 對 worker／控制端／Herdr server 的已授權中斷：等待端失聯、完成未落地、重複事件／同案競爭、長靜默、waiting-human；零錯單、零重複 writer／PR、零假成功；unknown 安全隔離 | execution／Issue state、team.db、`scripts/host.mjs health --home DIR`；auth／quota 失敗用隔離 fixture |
| `backup-restore-rollback` | 依停工條件建私有快照、新目錄還原核對 Issue 收據／成果雜湊／attempt／成本；保持 integrations disabled 與暫停；失敗更新回切已驗證 runtime；schema 不相容不得直接降版覆寫 | `scripts/host.mjs handoff|pause|backup|restore|switch|rollback`（backup／restore 實作在 `scripts/host-state.mjs`） |
| `external-offline-alert` | 被監控主機之外的觀察端收心跳，主機離線時告警真的送達授權通知管道；記錄事件／偵測／送達時間、去重與恢復通知 | `scripts/host.mjs health --home DIR --out FILE`＋另一台主機的 `scripts/check-host-heartbeat.mjs --file FILE --host HOSTID` |
| `trial-72h` | 完成固定故障演練後的 72 小時觀測窗；須跨多個 repo 產生可驗收成果，不以空轉計時 | 既有 daemon／supervise 收據、attempt 帳務、delivery-health 報告（僅在其實際可用並驗證後引用） |

## `trial-72h` metrics 合約

PASS 前 `criteria["trial-72h"].metrics` 必須填入實測值並滿足：

- `required` 全部存在且有實測證據；未觀測值不得以 0 或空陣列冒充已觀測。
- `observedStart`、`observedEnd` 為有效 ISO8601 時間，且 `Date.parse(observedEnd) - Date.parse(observedStart) >= windowHours * 3_600_000`。`windowHours` 在本次試行固定為 72；不足 72 小時維持 `INCOMPLETE`。
- `effectiveRuntimeMs` 為觀測窗內有效運作毫秒數，須為有限非負數且不大於觀測長度；`counts` 含 `completed`／`blocked`／`waitingHuman`／`unknown` 非負整數；`scheduledFaults`／`unscheduledRescues` 分別為預定故障／非預期人工救援次數，皆為非負整數；`recoveryDurationsMs` 為各故障／救援事件的恢復毫秒數陣列，逐筆附事件與恢復收據。這些數值須保存，不另增設 issue 未要求的運作率、救援或恢復時間門檻。
- `reposWithDeliverables` 為 `authorizedRepos` 中至少兩個不同 repo；`repoWaits` 必須涵蓋所有 `authorizedRepos`，包括沒有成果的 repo。以 repo 為鍵記錄 `maxEligibleWaitMs`（最長符合條件等待的非負毫秒數）；無符合條件工作時填 `null` 並附原因與觀測證據，不得省略或填 0 冒充無等待。
- `cost`（`{ "known": <usd>, "unknown": <成本未知筆數> }`）：已知金額為有限非負 USD，附帳務來源；未知成本沿用 attempt accounting 的 `unknownCost` 非負整數筆數，不能臆測未知 USD 或將未知費用填為 $0。估算與訂閱名義金額另附來源，不冒充已知實付。
- `zero` 全部為 0：`unauthorizedWrites`、`duplicateWriters`、`costSwitches`——任一不為 0 即硬條件失敗。

## 硬性停止條件

`hardFailures` 記錄以下事件，任一發生即停止受影響試行並保留現場；僅在隔離邊界確認安全後其他 repo 才得繼續：

- `duplicate-writer`：重複接單／重複 PR／成果誤認。
- `unconfirmed-backend`：無法確認舊後端已停止或隔離，包括失聯而無法排除仍在執行／接單；不以證明仍在接工作為停止前提。
- `evidence-mismatch`：證據遺失或與收據雜湊錯配。
- `cost-breach`：超出已授權成本上限。
- `scope-breach`：超出已授權工作範圍。

## 判定規則

- `HALTED`：`hardFailures` 非空。停止並保留現場，不得繼續產生新證據冒充連續試行。
- `PASS`：五組 criterion 全為 `PASS`、`hardFailures` 為空、`trial-72h` metrics 滿足上節合約。僅此狀態可提出「增加第二個不衝突 Worker」的後續決策——提出而非自動啟用。
- `INCOMPLETE`：其餘一切狀態（含任一 `NOT_RUN`／`FAIL`／`UNSUPPORTED`）。INCOMPLETE 不得對外宣稱整體穩定通過。

## 邊界

本紀錄合約不授權現在重開使用者電腦、終止正式工作、在本機註冊排程、跨機接手或搬移 secrets。驗收逐項保存時間、主機、commit、結束碼與證據；細節沿用 `docs/host-deployment.md` 的部署／備份／回切／心跳流程。
