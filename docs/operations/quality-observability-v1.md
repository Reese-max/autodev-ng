# 品質排程長期觀測與證明契約 v1

日期：2026-09-17（Asia/Taipei）

適用於 `self-review`、`upstream-watch`、`runtime-evidence`、`research-experiment`、`delivery-watch`，由既有 `成果與決策摘要` 做唯讀彙總。此契約補充 `fair-selection-v2.md`，目標不是增加另一套掃描，而是用跨輪資料回答三件事：

1. 是否真的逐步覆蓋整個可存取 portfolio，而不是只反覆看熱門 repo。
2. 可處理候選是否會被餓死，以及實際等候多久。
3. 缺 runtime／provider／browser／授權環境時，是否一直保留為 PARTIAL/BLOCKED，而沒有被誤寫成 PASS／VERIFIED_FIXED／CLEAN。

不新增產品修復權限、不改產品程式碼／CI／部署／secrets／權限、不啟動 worker、不降低 Issue Quality、固定 Persona 或 CLEAN 門檻。觀測結果本身不是產品缺陷，也不是實作授權。

## 1. 證明狀態

整體與各 task 使用下列驗證階段，禁止跳級：

- `CALIBRATING`：cursor 與 metrics 已接通，但候選分類尚未完成，或樣本不足。
- `COVERAGE_BASELINE_COMPLETE`：目前可存取 inventory 已完成 applicability/work-discovery 第一輪；能說明每個 repo 為 applicable、no-candidate、excluded-with-reason 或仍 blocked，且沒有未讀 shard。
- `SHORT_WINDOW_VALIDATED`：在 baseline 完成後連續至少 7 個完整日曆日，沒有成立的 discovery stall、fairness violation、waiting-probe overdue 或 blocked→false-pass invariant violation；必要 wait/service metrics 有足夠樣本。
- `LONG_WINDOW_VALIDATED`：符合短期條件且連續至少 30 個完整日曆日。這只證明排程控制面在觀察窗內符合契約，不代表產品全部 CLEAN。

任何 inventory 重大變動、新不可讀範圍、cursor 遺失、無法重建 discovery、成立的嚴重 invariant violation，都將相關證明狀態降回至少 `CALIBRATING` 或 `COVERAGE_BASELINE_COMPLETE`，並保留既有歷史，不清零證據。

## 2. 兩層 Coverage，避免假分母

### 2.1 Repository classification coverage

以當輪完整可存取、owned、unarchived inventory 為分母。每 task 對每個 repo 保存一個 applicability 狀態：

- `APPLICABLE_WORK_FOUND`
- `APPLICABLE_NO_CURRENT_WORK`
- `NOT_APPLICABLE_WITH_REASON`
- `CLASSIFICATION_PARTIAL`
- `ACCESS_BLOCKED`

只有前三者才算 repository 已分類。`ACCESS_BLOCKED` 不算不存在。報告：

`repository_classification_coverage = classified_repo_count / observed_unarchived_repo_count`

若 inventory 本身不完整，百分比不得標為 portfolio coverage，只能標 `PARTIAL_DENOMINATOR`。

### 2.2 Work discovery completeness

repo 被分類不代表其所有 PR／Issue／研究／runtime 候選已列完。每個適用來源另保存：source kind、實際 request、page/offset/token、最後完整頁、未分類 IDs、terminal receipt、last_progress_at。

只有所有 applicable repo 的必要來源都具 terminal receipt 或明確不適用理由，才設：

`work_discovery_complete=true`

搜尋命中數、known work items、open Issue count 不得冒充完整候選分母。

## 3. 每個候選的等待時間欄位

每個 active／waiting 工作至少維護：

- `first_discovered_at`：第一次看到它；若歷史未知則 null，不回填猜測。
- `first_eligible_at`：第一次確認「本 task 本輪有權限且有能力處理」的時間。blocked item 不設或暫停 runnable clock。
- `runnable_since`：最近一次進入可處理狀態後持續等待的起點。
- `last_attempted_at`
- `last_service_at`：真正完成一個事前定義、可引用 receipt 的實質服務單位。
- `last_full_check_at`：只有 task 的完整範圍完成才更新。
- `service_count`
- `service_intervals[]`：有界保存最近的 `{eligible_at, serviced_at, wait_seconds, selection_id}`；不需要永久無限增長，舊資料由每日 metrics snapshot 保留。

從 waiting 被證據重新喚醒時才重設 `runnable_since`；純新 HEAD、時間到或 bot comment 不得重設。完成有界 partial service 可以結束該次等待 interval，但不等於整個 item 完成；若還有明確可處理剩餘範圍，下一個 interval 從保存 receipt 後重新開始。

## 4. Starvation 指標

只有 `first_eligible_at/runnable_since` 有可信值的可處理候選進入等待統計；BLOCKED_ENVIRONMENT、BLOCKED_AUTHORIZATION、WAITING_FIX、WAITING_RESULT 不混進 runnable wait 分布。

每 task 計算：

- `runnable_count`
- `oldest_runnable_since`
- `max_runnable_age_seconds`
- `service_intervals_sample_count`
- `median_service_wait_seconds`（至少 5 個有效 interval 才顯示；否則 `INSUFFICIENT_SAMPLE`）
- `p95_service_wait_seconds`（至少 20 個有效 interval 才顯示；否則 `INSUFFICIENT_SAMPLE`）
- `max_service_wait_seconds`
- `repos_serviced_in_window`
- `unique_items_serviced_in_window`

在第一個完整 discovery cycle 之前，這些統計標 `PROVISIONAL`，不能用來聲稱整個 portfolio 的等待 SLA。

### Fairness invariant

沿用 `PRIORITY → PRIORITY → AGING`。若 aging_due 成立且存在可處理 AGING 候選，超過兩個新的非緊急 PRIORITY selection_id 而沒有有效 AGING service receipt，即 `FAIRNESS_VIOLATION`。

只選到、撞鎖、逾時或讀 README 不算支付公平名額。實質 partial service 可以支付名額，但不能刷新 full-check 時間。

## 5. Blocked / Runtime 證據矩陣

runtime 與其他需要外部環境的項目，保存 required closure paths，例如：

- source contract
- local isolated execution
- CI exact-SHA
- browser desktop/mobile
- assistive technology/manual AT
- provider/API sandbox
- deployed path

每條 path 使用：

- `NOT_REQUIRED`
- `NOT_ATTEMPTED`
- `SOURCE_CONFIRMED`
- `MOCK_EXECUTED`
- `LOCAL_EXECUTED`
- `CI_EXECUTED`
- `PROVIDER_EXECUTED`
- `DEPLOYED_PATH_EXECUTED`
- `BLOCKED_ENVIRONMENT`
- `BLOCKED_AUTHORIZATION`
- `WAITING_FIX`
- `FAIL`
- `PASS`

並記 exact SHA/version、receipt、observed_at、限制。Evidence class 不互相冒充：mock/local 不能取代 provider/deployed/mobile/AT，除非原 acceptance 明確不要求後者。

### False-pass invariant

若原 Issue／audit 的 closure contract 仍有 REQUIRED path 為 `NOT_ATTEMPTED`、BLOCKED、WAITING 或 FAIL，該 finding/task 不得寫：

- `VERIFIED_FIXED`
- `FULL_RUNTIME_PASS`
- `CLEAN`（若該 path 是 CLEAN 必要條件）

可以寫 `PARTIAL`、`SOURCE_FIXED_RUNTIME_PENDING` 或更精確狀態。發現 blocked→PASS 無必要新 evidence，記 `FALSE_PASS_INVARIANT_VIOLATION`，保留原結論與錯誤結論證據，不自動改產品。

## 6. Waiting probe 指標

waiting 項目保存：

- `blocked_since`
- `blocking_fingerprint`
- `probe_on`
- `requeue_if`
- `next_probe_at`
- `last_probe_at`
- `probe_result`

計算：

- `waiting_count_by_reason`
- `oldest_blocked_age_seconds`
- `probe_due_count`
- `probe_overdue_count`
- `max_probe_overdue_seconds`

到期只代表可輕量 probe，不代表解除阻塞。若到期後至少兩次已確認 task 執行機會仍沒有 probe 且沒有工具／授權／限流理由，才成立 `WAITING_PROBE_OVERDUE`。

## 7. Environment capability gaps

為 runtime 建立去敏 capability summary，只記能力類型，不記 secret：

- `isolated_repo_dependencies`
- `browser_http_origin`
- `mobile_browser`
- `assistive_technology`
- `provider_sandbox`
- `cloud_runtime_readonly`
- `ci_exact_sha_read`
- `remote_test_dispatch_authorized`

每項為 `AVAILABLE`、`UNAVAILABLE`、`UNKNOWN` 或 `AUTHORIZED_BUT_NOT_CONNECTED`，附 last_verified_at 與 evidence class。若同一 capability gap 阻塞多個 repo，以共因計數；不逐 repo 重試相同環境故障。這些資料用來決定是否值得補環境，不等於自動授權建立環境或付費。

## 8. 長期 metrics snapshot

`成果與決策摘要` 是唯一 metrics 彙總 writer。每次成功健康檢查更新私密 `metrics.json`；同一天最多保留每個成功摘要的一筆精簡 snapshot 於日期檔，跨日不覆蓋前日。

Snapshot 至少包括：

- `observed_at`
- inventory observed/unarchived/refresh age
- 每 task：enabled observed、worker receipt、discovery progress、repository classification coverage、work discovery complete、known active/waiting、runnable wait 指標、waiting probe 指標、fairness counters/invariants
- runtime evidence：closure path status counts、environment capability gaps、false-pass violations
- health findings
- validation stage

不能從缺資料計算百分比；`null` 和 `INSUFFICIENT_SAMPLE` 必須保留。

## 9. 健康與長期驗收

既有 threshold 繼續適用：

- `WORKER_RECEIPT_STALE`
- `DISCOVERY_STALLED`
- `FAIRNESS_VIOLATION`
- `WAITING_PROBE_OVERDUE`

新增：

- `COVERAGE_REGRESSION`：已完成來源在無合理 inventory/scope 變動下倒退成不可恢復未知。
- `FALSE_PASS_INVARIANT_VIOLATION`
- `CURSOR_RECOVERY_FAILURE`
- `METRICS_GAP`：metrics writer 本身連續三個應執行週期無有效 snapshot，且非平台暫停／已知工具阻塞。

長期驗收不用任意「零問題」作產品健康結論。控制面的成功證明是：完整 baseline、持續前進、無成立的重大 invariant violation、blocked 不被冒充 PASS、可處理候選等待有可量化分布且沒有持續惡化未處理。

7/30 天驗收只從第一個 `COVERAGE_BASELINE_COMPLETE` 日開始計算；在此之前歷史只作 calibration，不回填成已驗收天數。

## 10. 通知與輸出

一般 metrics 變化保持靜默。只在下列事件通知：首次建立完整 coverage baseline、validation stage 升／降級、成立新的重大 invariant violation、同一 violation 實質惡化、或原 violation 真正恢復。

不要因 p95 尚無 20 樣本、coverage 仍 partial、某 runtime path 合理 blocked 就每輪提醒。這些是正常校準／等待狀態，除非超過既定探查或進度門檻。
