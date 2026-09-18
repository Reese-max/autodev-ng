# 交付健康監測 v1

## 範圍與邊界

此模組只讀 GitHub CI／PR，核對外部提供的排程與驗收收據，產生報告。
它不建立 AI 排程、不呼叫模型、不認領 Issue、不更新 PR、不合併、不部署、
不停止服務、不修改權限，也不取代既有 Guardian、team.db 或跨程序鎖。

預設只監測本公開儲存庫。其他 repo 應使用本機設定加入，先核對資料可見性，
不要將私人設定、排程識別碼或私人研究資料提交到公開儲存庫。

既有董事會／Issue 執行器的 6 小時／1 小時，是既定頻率意圖，**不是實際
排程後台的觀測**。設定故意保留 `enabled: null`、`external_id: null`；
有實際後台資料前必須 UNKNOWN。每週研究條目是 disabled 的提案，不會執行。

## 使用

需要 Node.js 22，無新增 npm 相依套件。

```sh
node --test tests/operations/delivery-health.test.mjs
node scripts/delivery-health.mjs --out data/operations/delivery-health.json
node scripts/delivery-health.mjs --config /private/health.json --snapshot /private/snapshot.json --out /private/report.json --strict
```

讀取憑證僅來自 `GH_TOKEN`／`GITHUB_TOKEN`，不顯示、不寫入報告。
GitHub workflow token 不代表能讀其他私人 repo；404／403／查無執行證據均不能
推定為 repo 不存在或 CI 通過。每 repo 最多四次 GET，十秒逾時，拒絕重新導向，
不重試；429 或帶限流標頭的 403 會停止本輪後續 API 查詢。

一般模式的 exit 0 只表示報告已產生；必須讀 `status` 與各項結果。
`--strict`：PASS=0、BLOCKED=1、INCOMPLETE=2；輸入或執行失敗=2。
即使 PASS，`deployment_authorized` 永遠是 false；本工具不能核准部署。

## 狀態

- CI 僅接受目前 default-branch SHA 上指定 workflow 的最新 attempt；舊 SHA、
  查無結果、資料不足都是 UNKNOWN。取消、略過、neutral、失敗不能當作通過。
- 驗收收據須綁 SHA、24 小時內完成、每個 check 真正執行且有 evidence_ref、
  writer/reviewer 不同。這只檢驗結構與一致性，**不證明收據真實性或獨立性**；
  真正的可信 producer、原始日誌與實機驗收仍是部署閘門。
- 排程觀測與成功心跳需在兩倍預期間隔內；實際 ID 與 config_version 必須相符。
  enabled 不明、缺證據、未讀取後台或觀測過期不可稱健康。
- 兩個啟用條目指向相同 external_id 會標 BLOCKED；這不是對未讀取的整個帳號
  做完整重複排程掃描，也不會刪除任何排程。
- 只讀最多 100 個 open PR；剛好 100 個即標 PARTIAL，不宣稱完整清單。
  有 PR 時輸出接續既有工作的提醒，不產生新的派工副作用。
- 私人或可見性不明的 repo 預設隱去名稱、SHA、PR 與 CI 細節。

## 外部收據格式（由可信執行器在本機輸出，不提交公開 repo）

```json
{
  "repositories": {},
  "schedules": {
    "product-board": {
      "schedule_id": "actual-id-read-from-scheduler",
      "config_version": "hash-of-actual-prompt-and-config",
      "observed_at": "2026-09-11T04:00:00Z",
      "last_success_at": "2026-09-11T03:00:00Z",
      "status": "PASS"
    }
  },
  "acceptances": {
    "owner/repo": {
      "sha": "0000000000000000000000000000000000000000",
      "finished_at": "2026-09-11T04:00:00Z",
      "writer_id": "writer-instance",
      "reviewer_id": "independent-reviewer-instance",
      "checks": [{ "status": "PASS", "executed": true, "evidence_ref": "private-run-log" }]
    }
  }
}
```

以上是示意資料，不是真實驗收，也不能以零 SHA 通過實際目標版本核對。
`--snapshot` 是明確的離線輸入模式，不會另外連線查 GitHub。repositories 應有
每 repo 的 private、sha、runs（原始 workflow_runs）、open_prs、pr_coverage；
不完整資料會降級，不補造。本機執行器可將 GitHub 觀測與收據合成此快照。

## 部署與停用

新 workflow 僅含離線測試及唯讀報告。合併到 default branch 後，設定每日
08:17（Asia/Taipei）及 workflow_dispatch；GitHub 的實際觸發可能延遲。
PR 階段只跑離線測試，不讀取私人資料。現有 ci.yml 與所有 release gate 原樣保留。

正式啟用前必須驗證 workflow 權限、Actions 容量與首次真實執行。若 Actions
本身無法啟動，這個同平台監測也無法自我偵測；必須保留獨立主機／外部監督。
本模組不聲稱已解決跨平台、跨主機可用性。

停止此新增 workflow 即可停止每日報告，或 revert 本新增提交；不涉及正式資料、
資料庫 migration 或既有 AI 工作。不要為了啟用它放寬既有 CI、安全或成本政策。

參考官方文件（查核 2026-09-11）：
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency
- https://nodejs.org/api/test.html
