# Herdr 無人值守總驗收契約（追蹤 #31）

本文件是 #31 的最小可驗證契約：把「已授權 Issue → AutoDev 認領／隔離 → Herdr 執行 → 宿主驗證與獨立審查 → 草稿 PR」的總驗收條件、子單相依、狀態語彙與硬停條件固定下來。本文件不宣告任何子單已實作、已啟用或已通過實機驗收。

## 子單地圖與相依

| 子單 | 範圍 | 相依 |
|---|---|---|
| #32 | 精確 execution／request 與完成回執核對 | 無 |
| #33 | 逾時、斷線、取消與重啟後的後端狀態對帳 | #32 |
| #34 | server／backend 模型、登入、額度與成本政策分開驗證 | 無 |
| #35 | 明確 opt-in 一般 GitHub Issue 接入 | #32、#33、#34 及 release gate |
| #36 | owner 持久派工游標、等待時間與掃描／執行區分 | 無 |
| #37 | 測試／CI 維護驗收類型的有界小實驗 | 無（平行） |
| #38 | 無桌面登入啟動、故障演練、備份還原／回滾、外部告警與 72 小時試跑 | #35、#36 |
| #39 | 過期鎖回收互斥原語 | 無，優先 |
| #40 | GitHub Issue 組裝缺少 cfgPath 時略過全域預算 | 無，優先 |
| #41 | owner 執行期間撤回 enabled／publish | 無，優先 |
| #42 | 接單前明確否決 metadata 接入 runner | 無 |
| #43 | Worker 完成後 GitHub 暫時讀取失敗保留候選檢查點 | 無 |
| #44 | 單張超長／格式錯誤 Issue 解析失敗隔離 | 無 |
| #45 | 完成紀錄容量閘與活動索引界限 | 無 |
| #46 | 需求改版後同一 Issue 的明確重新批准入口 | 決策，非前置 |
| #47 | Node regression gate 可信核對 | 無 |
| #48 | 驗收命令多步語意一致 | 無 |
| #49 | 未啟動 writer 的預算／前置阻擋不扣 lifetime 次數 | #36、#43 |

## 狀態語彙與硬停條件

- 狀態：`NOT_RUN`、`PASS`、`FAIL`、`BLOCKED`、`WAITING_HUMAN`。
- 總體判定：`INCOMPLETE`（任一關鍵項未 PASS）或 `HALTED`（觸發硬停）。
- 硬停種類：`duplicate-writer`、`unconfirmed-backend`、`stale-lock-fence`、`budget-leak`、`revoked-publish`、`veto-bypass`、`uncheckpointed-candidate`、`parser-fanout-abort`、`capacity-masquerade`。

## 證據來源（皆須保留現場）

- 程式與既有政策：`src/engines/herdr.ts`、`src/github/job.ts`、`src/github/owner.ts`。
- 主機部署與驗收工具：`docs/host-deployment.md`。
- 不盲目重送：斷線、逾時或重啟後無法確認時，保留隔離與預算紀錄，不宣告成功。

## 單機試行紀錄模板

```json
{
  "version": 1,
  "parent": "#31",
  "verdict": "INCOMPLETE",
  "environment": {
    "node": "",
    "workerCli": "",
    "herdr": "",
    "configSha256": "",
    "singleHost": false
  },
  "subIssues": {
    "#32": { "status": "NOT_RUN", "evidence": [] },
    "#33": { "status": "NOT_RUN", "evidence": [] },
    "#34": { "status": "NOT_RUN", "evidence": [] },
    "#35": { "status": "NOT_RUN", "evidence": [] },
    "#36": { "status": "NOT_RUN", "evidence": [] },
    "#37": { "status": "NOT_RUN", "evidence": [] },
    "#38": { "status": "NOT_RUN", "evidence": [] },
    "#39": { "status": "NOT_RUN", "evidence": [] },
    "#40": { "status": "NOT_RUN", "evidence": [] },
    "#41": { "status": "NOT_RUN", "evidence": [] },
    "#42": { "status": "NOT_RUN", "evidence": [] },
    "#43": { "status": "NOT_RUN", "evidence": [] },
    "#44": { "status": "NOT_RUN", "evidence": [] },
    "#45": { "status": "NOT_RUN", "evidence": [] },
    "#46": { "status": "NOT_RUN", "evidence": [] },
    "#47": { "status": "NOT_RUN", "evidence": [] },
    "#48": { "status": "NOT_RUN", "evidence": [] },
    "#49": { "status": "NOT_RUN", "evidence": [] }
  },
  "hardFailures": []
}
```
