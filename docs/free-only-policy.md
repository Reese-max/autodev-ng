# 全流程免費政策

`tierMode: "free-only"` 現在涵蓋 worker、規劃、拆解、judge、Reviewer、反思、教訓複核、研究與 GitHub 修復。未設定時維持原有流程。

第一版使用 [OpenRouter 的明確免費變體](https://openrouter.ai/docs/guides/routing/model-variants/free)。每次有界呼叫前，向[官方模型目錄](https://openrouter.ai/api/v1/models)核對精確模型 ID 與所有已提供的價格欄位。缺少輸入／輸出價格、未知值或任一非零價格都拒絕呼叫；不以引擎名稱、訂閱標籤或記帳數字推定免費。文字角色使用固定 HTTPS 端點，拒絕重新導向，不提供 tools，禁止付費 fallback。HTTP 回應的模型身分必須符合要求；價格或身分異常會隔離該路由，保留收據等待檢查。

worker 第一版支援隔離的 OpenCode：只啟用 OpenRouter、只允許指定 `:free` 模型，`small_model` 使用同一模型，停用專案設定、外部技能與子代理工具。背景模型也受同一白名單限制。其他 CLI 尚未驗證完整計費路由，因此在 free-only 下會於預檢前阻擋；mock 不呼叫模型。Guardian 的直接 Codex 呼叫停用，既有 supervisor 與本機測試仍可運作。這些限制不改寫其他模式的 CLI 行為。

設定範例（合併進已審閱的專案設定；API key 使用既有環境變數）：

```json
{
  "tierMode": "free-only",
  "llmTransport": "http",
  "judgeUrl": "https://openrouter.ai/api/v1",
  "judgeApiKey": "{env:OPENROUTER_API_KEY}",
  "judgeModel": "nex-agi/nex-n2.5-mini:free",
  "auditModel": "poolside/laguna-s-2.1:free",
  "freeReviewFallbacks": ["cohere/north-mini-code:free", "nvidia/nemotron-3.5-lightning:free"],
  "defaultEngine": "oc-free",
  "engineRotation": ["oc-free"],
  "engines": {
    "oc-free": {
      "adapter": "opencode",
      "command": "opencode.exe",
      "model": "openrouter/nex-agi/nex-n2.5-mini:free",
      "env": { "OPENROUTER_API_KEY": "{env:OPENROUTER_API_KEY}" },
      "timeoutMs": 1800000,
      "pingTimeoutMs": 45000,
      "idleTimeoutMs": 300000,
      "dailyAttemptCap": 5,
      "costPerRunUsd": 0,
      "subscription": true
    }
  }
}
```

模型免費資格與可用性會改變，範例不構成永久名單；實際派送仍須通過即時檢查。Windows npm 安裝可能需要將 `command` 設成原生 `opencode.exe` 的完整路徑。Reviewer 必須與 writer／judge 使用不同模型；既有 `reviewEngine` 若有設定，仍優先於 `auditModel`，也必須改成已驗證的免費模型。

`freeReviewFallbacks` 最多兩個候補，加上主要審查模型，每次最多嘗試三個不同模型。只對 HTTP 408／429／5xx 或傳輸故障／逾時切換，沿用同一個 API key；每個候補都需重新驗證免費價格，且不能與 writer／judge 相同。MiniMax-M3 明確排除於候補設定與呼叫層。此設定只接到獨立審查角色，包含提交、GitHub 修復、最終稽核、研究／提案複核與教訓複核；Worker 與規劃路由保持單一模型。

模型已回覆拒絕、格式不符、憑證／計費錯誤、價格未知或異常、身分不符時不換人重審。全部候補暫不可用時，以最早的有效重設時間續審；各模型冷卻寫入磁碟，重啟不會重試尚在冷卻中的模型。候補已完成審查並合併時，不因先前失敗審查模型的冷卻而延後下一個任務。舊版未記錄故障類別的冷卻收據，不推測為可切換錯誤，仍等到原期限。通過證據記錄實際完成審查的模型。

free-only daemon 每個本地日的第一個有效迴圈刷新 `dataDir/free-model-catalog.json`，不是另外建立系統排程；暫停時不掃描。空清單、服務錯誤或資料異常不覆寫最後成功的目錄，也不改寫候補設定。成功且清單未變保持安靜，更新、故障與恢復使用固定文字通知；通知失敗保留待送狀態，相同故障不重複通知。掃描不會啟用未設定的模型，舊目錄也不能取代每次呼叫的即時價格檢查。

候選提交等待審查時，`dataDir/pending-review/` 保存精確 commit、worktree、任務與政策摘要、CI 證據及重試時間。重啟後先核對 Git 實體目錄、分支、HEAD、乾淨狀態與 ownership marker，再重跑驗收；不重派 worker、不重複計入每日 writer 嘗試。供應商提供 `Retry-After`／重設時間時優先採用，否則使用既有冷卻。等待不增加程式失敗計數，低風險任務也不能略過必要審查。候選或任務範圍變動會保留現場並阻擋；已保存的 CI 證據不會取代重啟後的驗收。

`dataDir/free-model-calls.jsonl` 記錄價格來源、檢查時間、呼叫身分、回應模型與可取得的 usage；不寫入 API key 或提示內容。OpenCode NDJSON 未提供供應商的實際模型 ID 時明記未知，缺少 cost 時不填入 `reportedCost`，不能把要求的模型名稱或缺失值當成回報證據。這些收據證明本機路由與供應商回報，帳單仍須另行核對。成本／身分異常的隔離紀錄與額度等待分開保存，其他並行請求不能以新的冷卻紀錄解除隔離。

規劃、品質判斷與 worker 預檢的免費供應不足也保留 GOAL，不消耗「沒有進展」的判定額度；daemon 優先讀取保存的供應商重試時間。

有界免費實測（建立全新的合成 Git repo，只跑一次，不改動現有專案）：

```powershell
npm run build
node scripts/free-only-canary.mjs --run --key-env OPENROUTER_API_KEY --command "C:/path/to/opencode.exe"
# 可選：在合成專案測試兩個已核對的免費審查候補
# 加上 --review-fallback cohere/north-mini-code:free --review-fallback nvidia/nemotron-3.5-lightning:free
```

退出碼 0 要求：規劃完成、worker 產生新提交、原測試不變且通過、獨立審查通過、精確提交的合併收據齊全。退出碼 2 代表尚未通過，候選與報告留在 `data/free-only-validation/canary-*/`。API 額度不足時不切換其他 key、不改用付費模型。

24 小時驗收為後續獨立 gate；本機測試與單次 canary 不代表已通過。長跑應分開統計服務存活時間、worker／審查工作時間、等待額度時間、恢復次數、完成任務，以及可取得的帳單證據。

## 2026-09-10 本機驗收

此節保存截至 14:55 的階段結果；15:55 的續審交付見下一節。

分批回歸共 27 個測試檔、434 項通過，彙整與原始結果位於 `data/free-only-validation/validation-summary.json`。首次整批有兩個新案例設定不完整、一個研究案例因未隔離原生額度預檢而逾時；修正測試替身後，相關 3 檔／67 項重跑 exit 0，保留原斷言及 20 秒限制。`npm run typecheck`（含憑證掃描）、`npm run build`、`git diff --check` 均 exit 0；kernel 頂層 2184 行，低於 2250 行。未執行完整 repo 的所有測試，也未部署。

實測使用全新的合成專案，報告位於 `data/free-only-validation/canary-WnI108/report.json`：

- 免費規劃完成，OpenCode 產生候選 `931c148729aa1bd378e52814ac174238df6fae95`；候選執行 `node test.cjs` 通過，exit 0，原測試未改動。
- judge 回報 `nex-agi/nex-n2.5-mini:free`、cost 0；獨立 Reviewer `poolside/laguna-s-2.1:free` 回 HTTP 429，未合併。缺少供應商重設標頭，採 30 分鐘冷卻，原定可重試時間為台灣時間 14:54:27。
- `restart-check.json` 記錄新程序重啟後仍為 `deferred`，worker resolver 呼叫 0 次、模型呼叫紀錄未增加、worker admission 維持 1 次，exit 0。
- 冷卻後於 14:55 使用真正 CLI `node dist/cli.js run-once --config data/free-only-validation/canary-WnI108/config.json` 續審；judge 再次回報 cost 0，獨立 Reviewer 仍回 HTTP 429。`resume-check.json` 記錄原候選保留、新增 worker 呼叫 0、worker admission 1、任務失敗計數 0；未合併，下次最早可重試時間為 15:25:34。CLI exit 0 只代表這一輪正常返回 `deferred`；驗收檢查仍 exit 2、`accepted: false`。本次未啟動背景重試。
- 單次 canary exit 2、`accepted: false`；報告中的主分支測試 exit 1 是候選尚未合併的原始基線，不能與候選 CI exit 0 混用。
- 完整免費實測、帳單核對及 24 小時長跑均尚未通過；既有專案設定與服務未啟用此新模式。

## 2026-09-10 免費審查候補驗收

新增 `freeReviewFallbacks`、每日免費目錄刷新、持久化通知去重，以及包含候選提交與最早重試時間的固定告警。MiniMax-M3 不列入候補。23 個測試檔／301 項回歸通過，原始結果為 `data/free-only-validation/reviewer-pool-final-gate.json`；初次整合發現舊模式回傳形狀不相容及新測試誤讀待審狀態為完成證據，已修正並重跑，舊失敗報告保留。完成審查後不因失敗模型的冷卻阻塞下一任務，另以 `reviewer-pool-cooldown-gate.json` 驗證。

最後的 3 檔／63 項冷卻回歸中，62 項通過，一個既有的四次 Git 流程案例超過 20 秒；保持原斷言與時間限制，單獨重跑通過，見 `reviewer-pool-daemon-isolated.json`。依各案例最新結果彙整，23 檔／301 項均通過。最終 `npm run build`、`npm run typecheck`（含憑證掃描）、`git diff --check` 均 exit 0，彙整見 `data/free-only-validation/reviewer-pool-validation-summary.json`；未執行整個 repo 的所有測試。

15:55 用真正 CLI 對原合成候選續審：主要 Reviewer `poolside/laguna-s-2.1:free` 已恢復，judge 與 Reviewer 都回報 cost 0。候選 `931c148729aa1bd378e52814ac174238df6fae95` 通過獨立審查並合併，`node test.cjs` exit 0，測試檔未變、worker admission 維持 1、新增 worker 呼叫 0。本次沒有觸發實際候補切換，切換與等待行為由隔離的 408／429／503／逾時、拒絕、格式異常及重啟案例驗證。

最初的驗收包裝把 CLI 的 `CycleResult: done` 當成未辨識輸出，故 `reviewer-pool-resume-check.json` 保留 exit 2 的錯誤判定。隨後執行下列唯讀檢查，核對 Git、原測試、雜湊合併證據、實際審查身分與 worker 次數，exit 0；沒有再次呼叫模型。最終收據是 `data/free-only-validation/canary-WnI108/reviewer-pool-delivery-check.json`，`accepted: true`。

```powershell
node data/free-only-validation/canary-WnI108/check-review-delivery.mjs
```

此結果只完成合成專案的續審交付；既有正式專案設定與服務未啟用或重啟，未推送或部署。帳單核對、真實故障下的候補切換與 24 小時長跑仍未驗證。
