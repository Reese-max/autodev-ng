# Issue #33：Herdr launcher／backend 恢復

基底 `57762c1c131930668eaa7e9f3549f817fa933e73`，分支 `issue-loop/issue-33`。測試全部使用離線 injected runner／臨時 Git repo；沒有把 mock 回報當成真實後端停止證據。

## 能力盤點（2026-10-16，Asia/Taipei）

- `herdr.exe --version`：`herdr 0.9.3`。`--help`、`agent` 顯示 `agent get/read/wait` 可唯讀觀測，`agent send-keys` 可送取消 UI 按鍵；沒有 request 綁定的續接／stop-confirmation 契約。沒有執行任何輸入／停止命令。
- [Herdr 官方 Agent automation](https://herdr.dev/docs/agent-automation/) 於本次透過 AnySearch 讀回：timeout／`agent_prompt_stalled` 可能已送入輸入，等待不追蹤個別 turn；`idle`／`done` 不是任務驗收或後端停止證據。
- 發現的本機 launcher：`C:/Users/Administrator/.codex-herdr-routing-stage-v5/.orchestrator/Start-Herdr-Autopilot.ps1`，僅靜態讀取 param 與等待實作。支援 `RequestId`、`RequestPath`、`Wait`、`WaitTimeoutMs`，缺 `ExecutionId` 與 `ResultFile`；因此對本 repo 的 #32 v1 回執及精確後端恢復為 **UNSUPPORTED**，未執行此腳本，也未將它配置成正式 launcher。
- `codex-raw.cmd --version`：`codex-cli 0.162.1`；`resume --help` 支援指定 session UUID，但 launcher 未提供此 session 與 request／server／occupant 的可信映射，不能據此自動續接或宣稱停止。
- v1 expected／result 是關聯證據；dispatch intent 只證明本宿主已保留一次派工權。它們都不建立 server epoch 或 pane occupant 的原生權威。無此證據時安全降級為隔離與人工接手。

## 驗收對照

| 固定故障 | 離線驗收與機制 | Windows 隔離主機實測 |
| --- | --- | --- |
| Prompt 可能送達後 timeout／斷線；控制端重啟 | **PASS（離線）**。`herdr-recovery.test.ts`：原始 raw execution 的 exclusive intent 只允許一次 runner 呼叫；舊版僅留 expected、HEAD／task 改變、worktree 標記／HEAD 消失皆保留隔離；expected 與部分檔案不變 | **NOT_RUN**；尚未另行授權 |
| Agent 完成但宿主結果未落地 | **PASS（離線）**。同檔：精確 v1 回執只導向 `validation-required`；保留 base SHA／回執，重查不做新 commit 或第二次派工；宿主提交失敗／未改變／缺 SHA 不觸發 nudge。`cli-herdr-inspection.test.ts`：公開 CLI 零寫入且 exit2 | **NOT_RUN**；不聲稱真實 PR 或宿主驗收恢復完成 |
| Cancel、server／pane 重啟或名稱重用 | **PASS（隔離決策的離線測試）**。同檔：取消優先為 unknown；不同 server 字串／重用 pane 皆不能核准停止、新輸入或解除隔離；完成回執不能蓋過 corrupt／mismatched intent。缺 server epoch／occupant-start 契約時屬 **UNSUPPORTED** 能力降級 | **NOT_RUN**；沒有 mock backend-stop PASS |
| waiting-human、長時間靜默、unknown | **PASS（離線）**。同檔：等待理由在 `finish(unconfirmed)` 後仍保存；長靜默保持 observing；損壞證據保持 unknown。`guardian.test.ts`：理由／下一步進入既有唯讀診斷，重複告警受既有冷卻抑制 | **NOT_RUN**；未按 Enter／同意／取消 |
| 保存離線測試後另行實測 | `.issue-loop-evidence.json` 保存紅燈摘錄與可由 Git Bash 重跑的命令；本表明確區分離線測試與真實主機驗收 | **NOT_RUN**；需依下表逐案補證據 |

`scheduler-parallel-team.test.ts` 額外核對：直接不明停止與 nudge 後不明停止都只記一個宿主 attempt，保留估算成本、部分檔案與 QUARANTINED claim；下輪不重派、不消耗 task-failure 配額。正式 Issue／owner 的既有 fail-closed 與 publication recovery 不另建替代流程。

## 本機驗證紀錄

新增 `herdr-recovery.test.ts`：0 → 21 個案例；公開 CLI 與 Guardian 各新增 1 個案例，共新增 23 個。最終相關命令於 2026-10-16 21:26:16–21:27:43（Asia/Taipei）執行，15 檔 205 項及 2 項 scheduler 隔離案例皆通過，合計 **207 passed、0 failed、exit0**。命令全文與實作前紅燈摘錄保存於 `.issue-loop-evidence.json`。

離線主要綁定為 execution `original-execution`、request `adng-recovery-task-aaaaaaaa-original-execution`、base SHA `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`；CLI fixture 另用 `cli-execution`／`adng-task-cli-aaaaaaaa-cli-execution`。這些是各自臨時目錄內的測試身分，不對應真實 server 或 pane。相關版本為 Node `26.7.0`、Vitest `4.1.11`；runner／commit 為 injected fixture。

| 驗證 | 結果 |
| --- | --- |
| `npm run build` | exit0 |
| `npm run typecheck` | exit0，包含 secret scan |
| 相關 Git Bash 驗收命令 | 207 passed、0 failed、exit0 |
| `git diff --check` 與獨立唯讀審查 | exit0；審查發現均已補先紅後綠的回歸測試 |
| `npm run test:mutation` | exit0；專案既有 scope `src/github/quality.ts`，100%：104 killed、0 survived、60 compile errors、20 ignored；不宣稱涵蓋本次 Herdr 模組 |
| `npm run quality:crap` | exit0；既有 scope 10 個函式，max 13；另對 `herdr-recovery.ts`／`attempt-accounting.ts` 執行相同腳本，12 個函式、max 16、exit0（門檻 30） |
| 未過濾的完整 coverage 套件 | exit1；249 檔／2,787 項，第一輪 2,775 passed、12 failed。11 項修正中的回歸已由最終相關命令驗證為綠；另 1 項為下述基底既有 timeout。不能稱完整套件全綠 |

既有 `tests/steering.test.ts:658` 的 `full control inventory refuses admission before creating the unreadable 10001st record` 寫入／查核 10,000 檔，具有測試內明訂的 30 秒限制。候選單獨重現為 100.939 秒、exit1；從 admitted base 以 `git archive` 取得的獨立快照也重現為 80.378 秒、exit1。快照 `src/engines/steering.ts` 的 blob 為 `f078ef7aa845ef6348b5f9d1e9ef5a42ccbde6bb`，與 admitted base 相同；未切換分支、修改該測試或放寬限制。相同失敗停止重試，這是尚未通過的全套門檻。

固定最終程式版本後，另以 `npm run test:coverage -- --testNamePattern="^(?!.*full control inventory refuses admission before creating the unreadable 10001st record)" --coverage.reportOnFailure=true --reporter=dot` 驗證其餘套件並收集 coverage。2026-10-16 21:28:34 起執行 1,260.91 秒，249 檔通過、2,786 passed／1 skipped、exit0；報表（含 `dist`）為 statements 56.70%、branches 51.72%、functions 58.47%、lines 55.57%。此命令刻意略過上述一案，不能取代未過濾的完整套件門檻。專案沒有 lint script 或 coverage ratchet 門檻，未另外安裝工具。

## 真實案例回執格式

取得獨立授權的 Windows 隔離主機後，每個案例逐一記錄以下欄位，使用 `PASS`／`FAIL`／`UNSUPPORTED`／`NOT_RUN`。只有精確 server 啟動與 occupant 身分及原生停止證據均可信時，才能把停止驗收標為 PASS。

| 案例 | 狀態 | Herdr／launcher／CLI 版本 | execution／request | server 啟動／pane occupant | 起訖時間 | 原始證據／SHA／attempt／成本／驗收 |
| --- | --- | --- | --- | --- | --- | --- |
| timeout／斷線 | NOT_RUN | 待測 | 待測 | 待測 | 待測 | 待測 |
| 完成／宿主未記帳 | NOT_RUN | 待測 | 待測 | 待測 | 待測 | 待測 |
| cancel／server／pane 重啟 | NOT_RUN | 待測 | 待測 | 待測 | 待測 | 待測 |
| 等待人工／靜默／unknown | NOT_RUN | 待測 | 待測 | 待測 | 待測 | 待測 |

不推送、不建 PR、不操作正式 Herdr server、不清鎖、不回收 worktree、不修改 launcher 或帳號。原生續接／停止、自動宿主驗收／publication 恢復與其他 repo 繼續執行均未啟用；維持既有隔離政策。
