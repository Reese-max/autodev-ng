# Product Board Audit — 2026-10-01T08:00:29Z

## 結論摘要

- 狀態：**PARTIAL / NOT CLEAN**
- 新 finding：1（`BUG / P1 / decision_priority=NOW / triage=NEEDS_REVIEW / auto_implementation=false`）
- 寫入策略：`SKIPPED_LOCKED_ACTIVE_PR`。根因位於仍開啟的 [autodev-ng PR #121](https://github.com/Reese-max/autodev-ng/pull/121)，不修改其 Issue、PR、branch 或 scope；本報告為獨立中央證據。
- 沒有啟動 worker/GOAL、沒有產品實作、merge、deploy、設定或權限變更。
- CLEAN 不成立：本輪非完整 A01–J05 全量輪次，且 finding 缺必要隔離 runtime 終止證據。

## 依據、範圍與證據版本

| 項目 | 結果 |
|---|---|
| 規則文件 | `docs/portfolio-audit/2026-09-14-issue-quality-v2.md` |
| 規則 blob SHA | `8167e10798071d2276addaff6b201c6b0e904a2a` |
| inventory | Reese-max 自有 45 repositories；44 未封存、1 封存（`obsidian-vault`） |
| 本輪公平增量 | 自上輪 cutoff 後的新/更新 PR、精確 PR HEAD CI、default-branch HEAD、所有狀態去重 |
| 主要 inspected default HEAD | `Reese-max/autodev-ng@99eba2458a82a4fb8e70c25c5a454014b568c659` |
| 主要 inspected candidate HEAD | PR #121 `9c6fe6f79338110a448cd89d4e1519b2effbc239` |
| 查閱時間 | 2026-10-01 UTC |
| 限制 | 本輪為增量風險優先，未重新執行 44 個未封存 repo 的完整 A01–J05；沒有在隔離環境啟動真 worker；CI logs 不可取，只能看到 run/job/step 狀態 |

本輪核對的近期新增/更新產品 PR 包含 `academic-mcp#23/#24`、`92-duty-scheduler#53`、`taiwan-intel-dashboard#72`、`autodev-ng#121/#122`、`minideck#26`、`taichung-police-intel#103`、`project-doctor-web#31`、`police-exam-archive#91`、`spotify-playlist-organizer-mcp#62`、`cyber-prep-coach#23` 等。本輪深查優先落在控制平面且具 P0/P1 因果鏈的 #121；其餘保留於後續公平游標，不能據此宣稱 portfolio 全集已驗證。

## 新 finding F-20261001-01

**標題：Conductor timeout 只結束等待、未證明 worker 終止，retry 可與遲到 worker 同時寫 repo**

- fingerprint：`autodev-ng+conductor-timeout+engine-ignores-abort+promise-race-returns+late-worker-continues-mutating+retry-overlap`
- kind：`BUG`
- severity：`P1`
- decision_priority：`NOW`
- triage：`NEEDS_REVIEW`
- auto_implementation：`false`
- confidence：高（靜態因果鏈）；runtime 終止/子行程行為仍需實測
- tracking：活躍 [PR #121](https://github.com/Reese-max/autodev-ng/pull/121) 與原 [Issue #52](https://github.com/Reese-max/autodev-ng/issues/52) 已持有此產品範圍，但沒有既有 comment/review thread 追蹤此根因；因此本輪採 `SKIPPED_LOCKED_ACTIVE_PR`，不搶 scope、不貼重複留言。

### 誰受影響、可到達流程與實際失敗

受影響者是把 Conductor 當作單一 writer / timeout / retry 安全邊界的 repo owner、SRE 與執行昂貴外部模型的操作員。

可到達前提：

1. Task Envelope 設定 `budget.timeout_ms`，且 `max_retries > 0`（schema 預設 2）。
2. `engine.run(job)` 忽略或無法及時響應 `AbortSignal.timeout`。PR 文件明確把此情境列為 watchdog 要處理的情境。
3. watchdog 的 `Promise.race` 先回傳 timeout。
4. Conductor 立即擷取 `headAfter`/dirty snapshot、記錄失敗並進入下一次迴圈；沒有 await/kill/join/termination acknowledgment。
5. 原 worker Promise/子行程仍可在後方繼續修改、commit 或產生外部費用；下一個 attempt 也可能已開始。

預期：timeout 後，在新的 worker 開始前，舊 worker 已被確認終止；若無法確認，該 task fail closed 且 repo 被隔離/標記 blocked。

實際：`src/conductor/conductor.ts` 只 race `engine.run(job)` 與 timeout result。race 不會取消 loser；AbortSignal 只是傳給 adapter。程式在未等待 loser 結束的情況下做 post-attempt snapshot 並可 retry。文件同時承認「worker 結束後殘留行程」的晚到寫入不在 snapshot 視窗內，交由 adapter 清理，但 Conductor 並未要求 adapter 回報已清理才重試。

### 影響與分級理由

- 這不是單純缺 log/CI；它破壞 #52 的核心產品承諾「單一 Conductor → 單一 Worker」、timeout 停損、stale context 與 unexpected diff 防護。
- 可造成兩個 writer 同時修改同一 repo、遲到 commit 落在終局後、下一輪基準被污染、重複 provider 成本，且 post-attempt snapshot 可能完全錯過晚到變更。
- 因果鏈已存在於受支援路徑，且 PR 明確聲稱要處理 engine 忽略 signal；不必假設外部事故才成立。故分為 P1，而不是把「缺 runtime 證據」誤降為一般維護。
- 尚未在隔離 repo 以真 adapter 重現 kill/late-write；因此不宣稱資料損毀已發生，且保持 `NEEDS_RUNTIME_VERIFICATION`。

### 原始證據

- PR #121 candidate HEAD：`9c6fe6f79338110a448cd89d4e1519b2effbc239`
- default base：`99eba2458a82a4fb8e70c25c5a454014b568c659`
- timeout 建構：`AbortSignal.timeout(timeout)`
- watchdog：`await Promise.race([engine.run(job), timeoutResult])`
- race 返回後立即讀 `headAfter`、`snapshot` 並在 failure branch `continue`
- 已知邊界文件承認 post-attempt 之後的殘留行程寫入抓不到
- 測試只證明 conductor 可以先返回 timeout；沒有等待晚到 worker 並斷言「沒有晚到 commit」「沒有第二 worker」「沒有並行寫入」。
- exact-head GitHub Actions：[run 36819166531](https://github.com/Reese-max/autodev-ng/actions/runs/36819166531) = failure；job `test` 失敗，API 顯示 `npm run test:flaky-regression` 未完成。logs URL 未提供，故 CI 根因為 UNKNOWN，不能拿來證明或推翻本 finding。
- PR 作者自行報告 focused tests 43/43、typecheck/build 綠；這是 SOURCE_CONFIRMED 的 PR 宣稱，不是本輪獨立 EXECUTED_REPRODUCTION。

### 最小有效修正與非目標

依序比較：

1. **不改**：不可接受；timeout/retry 仍可能重疊。
2. **只補文件**：不足；產品行為仍違反單 writer。
3. **局部 fail-closed**（建議）：timeout 後呼叫 adapter 的 cancel/stop，並等待可驗證的 termination acknowledgment；未在界限內證明終止就直接 `blocked/escalated`、不 retry、不釋放 ownership。確認終止後重新擷取 HEAD/dirty snapshot，再決定是否可重試。
4. **新 scheduler/DB/平台**：沒有證據需要，列為非目標。

非目標：建立通用分散式 lease 服務、跨 repo orchestration、新 persistence framework、擴充多 worker swarm。

直接驗收：

1. 測試 engine 故意忽略 AbortSignal 且在 timeout 後嘗試 commit；Conductor 不得啟動第二 worker。
2. 無 termination acknowledgment 時結果 fail closed（blocked/escalated），不得回報可安全 retry。
3. adapter 證明終止後，Conductor 重新擷取 snapshot；晚到變更必須被偵測並隔離，不得當成下一輪正常輸入。
4. termination 已證明且 repo/head 未變時才允許 retry。
5. 對可安全取消的既有 adapter 路徑跑鄰近回歸，確保正常 timeout 不留下 owner/child process。

必要 runtime：隔離 git repo + 可控假 engine/真子行程；分別覆蓋忽略 signal、延遲 commit、正常取消、終止逾時與 `max_retries=0/1`。不得在正式 repo 做失敗注入。

## 外部替代與競品基準

查閱日皆為 2026-10-01；這些是公開官方產品語意，不是本產品收益證據。

| 方案 | 類型 | 已確認語意 | 對本產品的意義 |
|---|---|---|---|
| [GitHub Actions concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency) | 直接替代工作流 | CONFIRMED：concurrency group 保證同 group 至多一個 running；`cancel-in-progress` 用於取消正在跑的舊 run | MUST MATCH：同一 task/repo 不應因 timeout/retry 形成雙 running writer |
| [GitLab interruptible jobs](https://docs.gitlab.com/ci/yaml/#interruptible) | 直接替代工作流 | CONFIRMED：只有可安全取消的 job 才應標 `interruptible: true`；deployment 通常不宜任意取消 | SHOULD BE BETTER：adapter 必須誠實宣告/證明可取消，不能把 AbortSignal 當終止證明 |
| [Kubernetes Jobs](https://kubernetes.io/docs/concepts/workloads/controllers/job/) | 間接控制平面 | CONFIRMED：deadline 觸發終止；較新語意會等 Pods 終止後才加 terminal condition，文件也警告過早 replacement 會與舊 Pod 重疊 | MUST MATCH：終局與 replacement/retry 應區分「已要求終止」和「已完成終止」 |
| [Temporal TypeScript cancellation](https://docs.temporal.io/develop/typescript/workflows/cancellation) | 新興/間接 orchestration | CONFIRMED：提供結構化 workflow cancellation 語意 | DIFFERENTIATOR 候選：autodev-ng 可維持輕量，只需在 Engine seam 加終止確認，不複製完整 durable workflow 平台 |

分類：
- MUST MATCH：同一 writer key 不重疊；timeout 後分開 cancellation requested 與 termination confirmed。
- SHOULD BE BETTER：對 CLI/provider adapter 顯示真實 cancellation 能力與未確認狀態。
- DIFFERENTIATOR：以 repo evidence + adapter acknowledgment 做小型 fail-closed，而非引入大型 orchestration 平台。
- DO NOT COPY：不要因競品有 workflow engine 就新增 DB、DAG 或跨專案控制平面。

## 產品董事會（模型多視角推演，非真人共識）

| 角色 | 判斷 |
|---|---|
| CEO | 若只做三件事：先守住單 writer；再證明 timeout 後真終止；最後才擴大 Conductor adoption。不做多 worker、動態路由與新平台。 |
| CPO | #121 的價值主張就是「可放心委派與重試」；此缺口直接傷害核心信任，NOW。 |
| CTO | 要求 Engine contract 把 request-cancel 與 confirmed-terminated 分開；反對把責任只寫在 adapter 文件。 |
| Staff/Principal Engineer | 最小 seam 是 `cancelAndWait/stop` 或 run handle 的 termination promise；不需要重寫 scheduler。 |
| UX Lead/Researcher | 狀態應顯示 `TIMED_OUT_TERMINATION_PENDING`，避免操作員以為已停止。 |
| Growth | 未有 adoption/轉換資料；不同意用合成偏好宣稱商業收益。 |
| CFO | retry 疊跑會重複 provider 成本；但金額 UNKNOWN，不給偽 ROI。 |
| Security/Privacy | 遲到 worker 可能在授權窗口之外繼續動作；要求 fail closed。 |
| QA | 目前測試只證明 conductor 不被掛死，未證明 worker 停止；需要 late-write regression。 |
| SRE | replacement 前等 terminal/confirmed stop 是基本防重疊界線。 |
| Accessibility | 狀態文字不能只靠顏色；需明確區分「取消已請求／終止已確認」。 |
| Support | timeout 後晚到 commit 會產生難以解釋的幽靈變更，排障成本高。 |

實質分歧：Growth/CFO 希望先量化真實發生率；Security/SRE/CTO 認為可到達的單 writer 破壞不應等待事故。董事會決議是 NOW review，但不授權本輪實作。

## 50 合成 Persona

這是純模型推演，不是訪談、真人票數、發生率或優先級證據。B01–B30 為約 60% 回歸基線，E01–E20 為約 40% 探索；與固定 A01–J05 CLEAN 稽核分開。

| ID | 背景/限制 | 目標與旅程 | 摩擦/結果 | 分級/建議/證據 |
|---|---|---|---|---|
| B01 | 單人 maintainer；一個 repo | 夜間跑小修→timeout→retry | 可能雙 writer；失去信任 | P1；fail closed；靜態 |
| B02 | Windows CLI 使用者 | agy timeout 後續跑 | 舊 WSL 行程或晚到 commit | P1；確認 termination；靜態 |
| B03 | Linux CI owner | mock/CLI worker 回應慢 | Conductor 先返回但 child 未停 | P1；join child；靜態 |
| B04 | 多 repo owner | 逐 repo 自動修正 | 一 repo 殘留可污染下一輪判斷 | P1；隔離 ownership；靜態 |
| B05 | 成本敏感個人 | max_retries=2 | 同時燒兩次 provider 成本 | P2/P1；禁止 overlap；靜態 |
| B06 | 安全敏感 repo | 授權窗內委派 | timeout 後仍可寫 | P1；termination receipt；靜態 |
| B07 | 測試工程師 | 驗證 timeout test | 測試未等待 late commit | P1；補 late-write regression；靜態 |
| B08 | SRE 值班 | 看 task-finished | 終局不等於 worker terminal | P1；拆狀態；靜態 |
| B09 | 新手 operator | 看到 escalated | 誤以為執行已停止 | P2；明確狀態文案；靜態 |
| B10 | 無網路環境 | child 卡住 | watchdog 回來但行程留存 | P1；kill/join；靜態 |
| B11 | repo 有預存髒檔 | timeout 後 retry | 晚到修改跨 snapshot 邊界 | P1；終止後重快照；靜態 |
| B12 | commit 型 worker | 慢 commit | commit 落在 task finish 後 | P1；late mutation quarantine；靜態 |
| B13 | 檔案型 worker | 慢寫 working tree | delta 被下一輪錯歸因 | P1；禁止下一輪；靜態 |
| B14 | provider 429 | worker 未正常返回 | timeout 與 provider recovery 競態 | P2；同一終止 gate；推論 |
| B15 | crash-resume 使用者 | session 重啟 | open attempt 與舊 process 不明 | P1；先確認 host/process；靜態 |
| B16 | herdr 使用者 | launcher timeout | pane/process 清理未證明 | P1；adapter receipt；推論 |
| B17 | codex adapter 使用者 | long generation | abort request 非完成 | P1；capability truthful；推論 |
| B18 | qwen adapter 使用者 | stream 卡住 | Promise race 留 loser | P1；join/kill；靜態 |
| B19 | copilot adapter 使用者 | retry 快速開始 | 兩個 process 共用 repo | P1；single-writer gate；靜態 |
| B20 | opencode 使用者 | provider timeout 疊 conductor timeout | 雙 timeout 狀態混淆 | P2；單一 terminal contract；推論 |
| B21 | Devin adapter 使用者 | export file 遲到 | task finish 後產物出現 | P1；late artifact detection；推論 |
| B22 | 低成本 worker 路由 | 自動 retry | 省成本目的反被重疊破壞 | P1；stop-before-retry；靜態 |
| B23 | repo reviewer | 看 verification.md | snapshot 早於晚到變更 | P1；post-termination verify；靜態 |
| B24 | 稽核員 | 看 ledger | timeout 記錄缺 termination | P2；receipt 欄位；靜態 |
| B25 | 支援工程師 | 排幽靈 commit | 很難對應 attempt | P2；execution/termination ID；推論 |
| B26 | 有 branch protection | worker 無法 push | 仍可能改 working tree/花費 | P2；本機也需終止；推論 |
| B27 | max_retries=0 | 單次 timeout | 不重試但 finish 後仍會寫 | P1；finish 前等 terminal；靜態 |
| B28 | max_retries=1 | 第二次可成功 | 第一個 worker 可與第二個同跑 | P1；禁止 overlap；靜態 |
| B29 | empty tests task | timeout | unverified 不代表 child 停止 | P1；正交處理 termination；靜態 |
| B30 | 手動審 envelope | 自認風險可控 | 人工審查不能停止 child | P1；技術 gate；靜態 |
| E01 | 慢網路筆電 | provider 回覆超時 | signal 傳遞延遲 | P2；grace + confirmed stop；推論 |
| E02 | 容器 worker | PID 1/child tree | kill parent 可能留孫行程 | P1；process-tree receipt；需 runtime |
| E03 | WSL worker | Windows/WSL 邊界 | taskkill/pkill 語意不同 | P1；平台 runtime matrix；CI 限制 |
| E04 | SSH remote worker | 網路分割 | 本地無法證明 remote 終止 | P1；quarantine/no retry；推論 |
| E05 | MCP remote tool | cancel notification | notification 不等於 terminal | P1；await terminal ack；推論 |
| E06 | 付費 API agent | request 已送出 | 本地 abort 未必停計費 | P2；cost UNKNOWN + no retry；推論 |
| E07 | monorepo owner | 共用 working tree | late write 影響其他 task | P1；writer key/lease；推論 |
| E08 | worktree owner | 每 task worktree | 風險縮小但成本仍重疊 | P2；仍需 terminal；反證 |
| E09 | read-only task | files_allowed empty | worker 仍可能副作用 | P1；read-only 也需 stop；推論 |
| E10 | 外部部署 adapter | timeout during deploy | 任意 cancel 可能半部署 | P1；adapter 宣告 non-interruptible；競品基準 |
| E11 | 資料遷移任務 | timeout | 重試可能重複 side effect | P1；本產品應拒絕/人工 gate；推論 |
| E12 | 分支隔離 worker | late commit 在隔離 branch | 主工作樹風險較低 | P2；可作 defense-in-depth；反證 |
| E13 | 無 commit worker | late file write | phantom 判斷可能先成立 | P1；late-write test；靜態 |
| E14 | worker 回傳成功恰逢 timeout | race 邊界 | 結果 nondeterministic | P1；terminal state arbitration；推論 |
| E15 | 時鐘漂移 host | timeout/receipt timestamps | 排序不可只靠 wall clock | P2；execution state/monotonic；推論 |
| E16 | process 已停但 Promise 不 resolve | adapter bug | 永久 quarantine 但安全 | P2；bounded admin recovery；反證 |
| E17 | 大型二進位產物 | late write | snapshot 成本高 | P2；先 stop，再局部 hash；推論 |
| E18 | 低權限 runner | 無法 kill child | 不應重試 | P1；blocked/escalated；推論 |
| E19 | 觀測 dashboard 使用者 | 看 timeout badge | 需要知道 termination pending | P2；可存取文字狀態；推論 |
| E20 | 未來多 worker | DAG 並行 | 此缺口會倍增 | LATER；先修單 worker，不以未來規模升級；Red Team |

## Red Team

嘗試推翻 finding：

1. **「AbortSignal 已傳給 engine」**：不足；PR 自己的 watchdog 情境就是 engine 無視 signal，且 Promise.race 不取消 loser。
2. **「真正清理由 adapter 負責」**：若是如此，Conductor 必須在 retry/finish 前取得清理完成證據；目前 contract 沒有。
3. **「post-attempt snapshot 會抓到變更」**：只抓 snapshot 當下；文件明確認了之後的殘留寫入抓不到。
4. **「max_retries=0 沒有重疊」**：仍可在 Conductor 回傳終局後晚到寫入；只是沒有第二 worker。
5. **「使用 worktree/branch 可隔離」**：是較小風險替代，但 #121 的 contract 接受一般 projectPath，且外部費用/狀態副作用仍未停止。
6. **「CI 失敗表示 candidate 根本不會合併」**：CI failure 不能取代根因追蹤；同樣也不能證明本 finding 已重現。
7. **「應做完整 durable workflow engine」**：過度工程。Engine seam 加終止確認與 fail-closed 已足以解根因。

Red Team 後結論：finding 保留；範圍縮到 termination acknowledgment + no-retry-until-terminal + post-termination snapshot。

## Decision Memo

- 服務誰：需要把小型 repo 任務委派給外部/低成本 worker、但不能接受幽靈寫入與雙重執行的 owner。
- 為何選擇/競爭：差異化應是「repo evidence + fail-closed control」，不是 agent 數量。
- 前三優先：
  1. 修復 #121 timeout/termination/retry 邊界；
  2. 在隔離環境補 late-write 與真 adapter 終止證據；
  3. 精確 HEAD CI 綠後才評估 default merge。
- 不做/刪除：不做 multi-worker、DAG、動態 router、新 DB；刪除「Promise.race 返回即安全 timeout」的隱含假設。
- 風險/實驗：最小實驗是故意忽略 signal 的 child process；BUILD/NARROW/REJECT 退出分別為：確認可在 Engine seam 安全終止 / 只能 fail-closed 不 retry / 若 product 明確禁止任何可寫 worker retry 則拒絕自動 retry。
- 建議：`MAINTAIN + SIMPLIFY`，不建議 `REPOSITION/MERGE/ARCHIVE`。

## NOW / NEXT / LATER / DON'T

- NOW：#121 owner 在既有 PR 內審 termination contract；CI 根因另行核對。
- NEXT：隔離 runtime 重現，精確驗證 late commit、child tree 與四種主要 adapter。
- LATER：觀測 UI 增加 termination-pending 狀態；有實際需要再擴 adapter capability matrix。
- DON'T：不啟動實作代理、不重開新大型 issue、不把本報告當 merge/deploy 授權。

## 寫入與回歸帳

| 類別 | 數量/結果 |
|---|---|
| 新 Issue | 0 |
| 更新/重開 Issue | 0 |
| PR scope/comment 修改 | 0（活躍 owner，跳過） |
| 中央 audit report | 1 |
| 去重拒絕 | 搜尋 all-state issues/PRs 未命中相同 root cause；Issue #52 與 PR #121 為同產品範圍但沒有此根因追蹤 |
| 已驗證修復 | 0 |
| regression | 無法宣稱；candidate 尚未進 default |
| runtime pending | 1（late worker termination/overlap） |
| portfolio CLEAN | 否 |

回歸狀態：`CANNOT_VERIFY / NEEDS_RUNTIME_VERIFICATION`。PR 未進 default；精確 HEAD CI 失敗且無 logs；因此不標 VERIFIED_FIXED，也不把 diff/單元測試宣稱當作完成。
