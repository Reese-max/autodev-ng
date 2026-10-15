# 外部競品／新品／工作流靈感雷達 — 2026-09-17T05:59:12Z

## Scope / rules / evidence boundary

- Owner scope：只處理 `Reese-max` 自有 repository；未操作第三方 repository。
- Issue Quality：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`。
- Quality-rule blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- 本輪重新完整分頁列舉 connected owner inventory：**39 owned repositories；38 unarchived**；第二頁為空。此結果與上一輪 39/38 一致，較早 42/39 差異仍只記為 inventory/access drift，不推論 repository 已刪除。
- 上一輪 cursor 為 `lplrs-judicial-sync`；本輪 fresh inventory 不含該 repository，直接 `get repo` 亦回 404。這只記為 **PARTIAL_CURSOR_ACCESS**，不推論它不存在或已刪除。為避免 starvation，公平輪巡向後移到下一個可存取產品型 target：**`MaterialYouNewTab`**。
- `MaterialYouNewTab` default HEAD：`main@71ed3072adb0db29d68830435eb8325fcc0971b3`；最近三個 main commits 為 audit docs，最近產品程式 baseline 為 `c9e58837534b4853395f9a06e30086d8f7bf5a3f`（2026-08-28）。
- Owner/product contract re-read：README + `AGENTS.md` 明定本 Fork 同時維護 upstream MYNT 與 Reese-max 的繁中優先、生產力、local-first、最小權限、Chromium/Firefox、備份/還原與 accessibility 邊界；不得因外部產品功能自行擴權。
- Repository Issues 目前為 disabled (`has_issues=false`)；現有 open items 是 PR #4 / #5，不是 Issues。此設定不視為產品缺陷，本輪也沒有通過 Gate 的新 Issue 需要寫入。
- Current active ownership：PR #4 `feature/ai-assist-3.5.0` 仍為 open draft；PR #5 `feature/police-exam-countdown` 仍 open。PR #4 已有 stale AI request、重複 Add tasks、dialog accessible name、changelog 等 review findings。本輪不搶改 active scope。
- 本輪沒有執行 Chrome Prompt API、下載 Gemini Nano、真實 zh-TW Prompt runtime、Firefox/Chrome multi-device sync、Safari build、Chrome Web Store 發布或任何正式資料寫入。
- 本輪：**0 new Issues；0 existing Issue modifications；0 PR comments；0 implementation authorization**。
- 未修改產品 source、CI/config、secrets、permissions/settings；未建 implementation branch、未 merge/deploy、未啟動 worker/GOAL、未新增付費承諾。
- 本輪不宣告 portfolio CLEAN。

## Product → Market Category

`MaterialYouNewTab` 本輪對照：

1. **New-tab / start-page productivity dashboards**：upstream MYNT、Bonjourr、Vivaldi Start Page/Dashboard。
2. **Local-first extension state portability**：backup/restore、browser-native sync、cross-device settings continuation。
3. **On-device browser AI**：Chrome Prompt API / Gemini Nano，特別關注 availability、language、hardware、cancel/failure semantics。
4. **Adjacent whole-browser AI**：會讀取 active tab / browsing context 的 agentic browser assistants；用來判斷哪些不應移植到 local-first new-tab scope。
5. **Distribution / maintenance surface**：Chrome/Firefox store、Safari/mobile 支援成本與 fork 發布邊界。

## Executive decision

**0 new Issues；0 existing Issues modified。**

本輪最有價值的新外部證據不是要求增加 AI 功能，而是把 PR #4 的最小修正路徑說得更清楚：Chrome Prompt API 第一方文件（最後更新 2026-08-26）現在明確支援在 `LanguageModel.create()` 與 `session.prompt()` / `promptStreaming()` 傳入 `AbortSignal`，而 `session.destroy()` 也會中止 ongoing execution。

PR #4 現有 review 已 SOURCE-CONFIRMED 一個 P2：使用者關閉 planner 後改開 Scratchpad 時，較慢的前一個 AI request 仍可能回來寫入共用 dialog，產生 stale / wrong-workflow result。目前該 branch 的 `chromePrompt()` 建 session 後直接 `await session.prompt(prompt)`，沒有 AbortController / signal。外部第一手文件因此提供了比「建立通用 request manager」更小的 provider-native 手段。

但這不是新 fingerprint，也不構成 radar 接管 active PR 的理由。Decision：**NEW_EXTERNAL_EVIDENCE + DEDUPE + SKIPPED_LOCKED_ACTIVE_PR#4**。本輪只在中央報告保留，沒有留言、改 PR、改 Issue 或啟動實作。

第二個重要校準是：目前 Chrome foundation-model Prompt API 的第一方文件只列 `en / ja / es / de / fr` 為支援語言，且 foundation-model APIs 目前不支援 Android/iOS，並有顯著桌面硬體與儲存條件。`MaterialYouNewTab` 則是 **zh-TW first**，所以 Chrome AI 必須繼續被視為 optional enhancement，不能當成繁中使用者或所有裝置都會可用的核心路徑。現有 PR #4 已保留 deterministic local fallback，這是相反證據：不需要因競品/平台 API 而增設第二個雲端 provider。

第三個市場訊號來自 Bonjourr：它已把 settings portability 做成兩層——manual export/import，以及同瀏覽器的 Chrome/Firefox/Edge native sync；跨瀏覽器另提供 GitHub Gist / remote URL。這確實減少「每台裝置匯出→搬檔→匯入」的人工作業，但本 repo 尚沒有真實使用者證據顯示跨裝置同步是核心斷點，且導入 sync 會新增 network、merge、secret exclusion、quota、migration 與 privacy 語意。Decision：**ADJACENT IDEA only；不立案**。

---

# External Signals

## A. Direct platform dependency — Chrome Prompt API：取消、語言、硬體是現行契約

**CONFIRMED — Chrome for Developers first-party；Prompt API page last updated 2026-08-26；checked 2026-09-17.**

Source:
- https://developer.chrome.com/docs/ai/prompt-api

### Current capability / contract

Chrome 文件目前明確寫出：

- Prompt API 使用 Chrome 內建 Gemini Nano；extension 自 Chrome 138 起可使用，web path 目前標示 Chrome 148；
- `LanguageModel.availability()` 應使用與真正 request 相同的 options；
- `LanguageModel.create({ signal })` 可以使用 AbortSignal；
- `session.prompt(..., { signal })` 與 `promptStreaming(..., { signal })` 可以停止進行中的 prompt；
- `session.destroy()` 會使 ongoing execution abort；
- supported text languages 目前列 `en`, `ja`, `es`, `de`, `fr`，additional languages 仍在 development；遇 unsupported input/output 可能得到 `NotSupportedError`；
- foundation-model APIs 現在不支援 Chrome Android / iOS / non-Chromebook-Plus ChromeOS；桌面端還有至少 22GB free storage、GPU >4GB VRAM 或 CPU 16GB RAM + 4 cores，以及初次下載需 unmetered network 等要求；
- model 本機使用時不把 prompt data 送往 Google/third party。

### User job / reduced manual work

對 MYNT PR #4 的實際 user job 是：使用者可以在 planner 與 Scratchpad AI Assist 間切換，不必因為前一個模型 request 太慢而等待，且不會讓舊回應污染目前 dialog。

External signal 能減少的不是「跨工具操作」，而是**避免為 stale request 問題自己打造 generic request-generation framework**：先驗證既有 Chrome provider 能否直接用 AbortSignal / session destroy 使前一個 request 失效。

### Repo evidence / opposite evidence

- PR #4 review 已記錄 stale AI request P2；因此根因不是「缺 AI orchestration framework」，而是共用 dialog 的 async request ownership/cancellation 不完整。
- PR #4 branch 的 `chromePrompt()` 目前沒有 AbortController；create / prompt 都未傳 signal。
- 相反證據：PR #4 已有 deterministic local fallback；Chrome AI 不可用時並不會讓整個 Today/Scratchpad 工作流完全失效。

### Decision

- Opportunity Map：**MUST MATCH（provider lifecycle） / SHOULD BE BETTER（使用平台原生 cancel，不另造框架）**。
- Existing fingerprint：PR #4 stale request review finding。
- Coordination：**SKIPPED_LOCKED_ACTIVE_PR#4**。
- No new Issue / no PR comment。

## B. Platform-fit constraint — zh-TW first 與 Chrome Prompt API 語言／裝置可用性不等價

**CONFIRMED for current documented API support；NEEDS_RUNTIME_VERIFICATION for this product branch.**

Source:
- https://developer.chrome.com/docs/ai/prompt-api

MYNT 的 owner contract 要求 zh-TW first，而 Chrome Prompt API 文件目前沒有把 Chinese / zh-Hant 列在 supported Prompt API languages。這不等於「PR #4 現在必然對繁中壞掉」：本輪沒有執行 zh-TW request，也沒有在符合條件的實機測 `availability()` / `create()` / `prompt()`，不能把文件限制冒充 runtime reproduction。

但它足以校準產品承諾：

- Chrome AI 不可被描述成所有繁中 MYNT 使用者的 guaranteed path；
- `Auto → local fallback` 不是暫時 workaround，而是當前產品可達性的必要邊界；
- 不應為了補中文而立刻串雲端 LLM；那會新增 data transfer、API key、cost、host permission/privacy contract，違反目前 local-first phase 方向。

Chrome 另有 first-party Translator API 支援 `zh` / `zh-Hant`，但在沒有證據顯示本機 fallback 不足以前，用「Prompt → translation → Prompt」增加第二個模型流程仍是更大方案，且不能自動得到實作權。

Decision：**MUST PRESERVE fallback / NEEDS_RUNTIME_VERIFICATION；no new Issue。**

## C. Direct competitor — Bonjourr：settings continuity 已從備份演進到 sync

**CONFIRMED — Bonjourr first-party docs；docs checked 2026-09-17；settings import/export page last updated 2026-08-31.**

Sources:
- https://bonjourr.fr/docs/settings-management/import-and-export/
- https://bonjourr.fr/docs/settings-management/syncing/
- https://bonjourr.fr/docs/reference/privacy-policy/

Bonjourr 目前提供：

1. export settings file → 在另一 instance import；local uploaded backgrounds/icons 不包含在 export；
2. extension 預設可使用 Chrome Sync / Firefox Sync / Edge Sync，在同瀏覽器帳號的多台電腦同步 settings；
3. cross-browser 可選 GitHub Gist token 或 remote URL；只有使用者主動選擇並設定 token 時才連 api.github.com。

### User job / reduced manual steps

這直接減少：

`裝置 A 匯出設定 → 手動搬檔 → 裝置 B 匯入 → 重做個人化`。

MYNT 現有 README 已有 backup / restore，但目前沒有 evidence 顯示同瀏覽器多裝置設定會自動延續。因此「browser-native sync of a bounded subset」是合理的 adjacent workflow pattern。

### Why it does not pass Issue gate now

- **User Pain：UNKNOWN**。沒有 current user report / runtime evidence 證明跨裝置轉移是高頻斷點。
- **Strategic Fit：LIKELY**，因為 local-first personal dashboard 的 settings portability 有一致性；但 sync 不是 backup，且 owner contract 對 storage migration/secret exclusion 很嚴格。
- **Effort/Risk：non-trivial**。要處理 localStorage/IndexedDB mapping、quota、merge、schema migration、不同 browser semantics、WeatherAPI key 等 secret exclusion，不能把「加 chrome.storage.sync」當成零成本。
- **Smaller alternative exists**：現有 validated backup/restore 已可完成低頻遷移。

Decision：**ADJACENT IDEA / NOT_ESTABLISHED / no Issue**。

若未來出現真實需求，最小研究問題應先限定為：「只同步非敏感、小型、明確可 merge 的 preference subset，能否在不改目前 backup truth 的情況下減少同瀏覽器多裝置重設？」而不是先建 sync server、GitHub token UX 或跨瀏覽器資料層。

## D. Direct competitor / distribution strategy — Bonjourr 主動退出 Safari App Store

**CONFIRMED — Bonjourr first-party；announcement 2026-03-29；docs current through 2026-08-31；checked 2026-09-17.**

Sources:
- https://bonjourr.fr/
- https://bonjourr.fr/docs/

Bonjourr 公開說明 Safari App Store 版本因 **high maintenance costs + low usage** 而停止，docs 註明 Safari app 自 2026-05 起 discontinued，改以其他方式提供 start page。

這對 MYNT 是重要的「不要照抄」訊號：

- Reese fork 已同時維護 Chromium MV3 + Firefox MV2、上游整合、繁中、自訂 productivity layer；
- 沒有 owner evidence 要求 Safari native packaging / mobile app；
- Safari/mobile 新增一條正式發布線會增加簽章、store、browser behavior、QA 與 support burden。

Decision：**DO NOT COPY / preserve Chromium+Firefox scope until demand exists**。

## E. Adjacent dashboard — Vivaldi Start Page Widgets

**CONFIRMED — Vivaldi first-party docs；checked 2026-09-17.**

Sources:
- https://help.vivaldi.com/desktop/tools/start-page-dashboard/
- https://help.vivaldi.com/desktop/tools/sync/

Vivaldi 將 Start Page 做成可關閉、可重排、可調高度/欄數的 widgets，且 browser account 可 E2E encrypted sync bookmarks、部分 settings、notes 等資料。

Transferable pattern：**使用者控制資訊密度與可見模組**，比持續新增固定 cards 更有價值。

但 MYNT 已有 Work / Study / Relax / custom Workspace、可選 widgets 與現有 personalization；目前沒有證據顯示需要再建 generic dashboard-grid editor。Vivaldi 的 account/sync 也是完整 browser capability，不應直接等同 extension 必須自建 account service。

Decision：**ADJACENT IDEA already partially represented / no Issue**。

## F. Upstream MYNT distribution baseline

**CONFIRMED — Chrome Web Store first-party listing；updated 2026-08-03；checked 2026-09-17.**

Source:
- https://chromewebstore.google.com/detail/mynt-material-you-new-tab/jjpokbgpiljgndebfoljdeihhkpcpfgl

Upstream store listing目前顯示 version `3.3.802`, updated 2026-08-03，並有 Featured badge、4.8 rating / 277 ratings、200,000 users；這些是 store/vendor distribution metrics，不是 Reese fork usage evidence。

可移植訊號只有：**store distribution 可以降低 developer-mode manual install friction**。但 Reese README 已清楚區分 upstream store build 與 custom edition；custom store 發布需要 owner account、release ownership、store policy/maintenance 與明確授權，目前沒有 evidence 讓它越過 Issue Gate。

Decision：**ADJACENT DISTRIBUTION IDEA / no Issue**。

# New Releases / recent changes

- **2026-08-26**：Chrome Prompt API docs last updated，文件化目前 extension/web availability、hardware limits、language list、AbortSignal / destroy lifecycle。
- **2026-08-31**：Bonjourr settings-management docs current，import/export 與 sync workflow 可直接檢查。
- **2026-08-03**：upstream MYNT Chrome Web Store version 3.3.802 更新。
- **2026-09-15~16 repo-side**：MYNT main 只有 audit docs 變更；PR #4 仍 open draft、PR #5 仍 open，故外部 signal 必須與 active scope 去重。

# Community Pain

本輪沒有 community-only 訊號通過保留門檻。沒有用 Reddit、論壇或單一評論推估「新分頁同步需求發生率」「Prompt API 中文失敗率」或「Safari 使用率」。Bonjourr 的 Safari maintenance/usage 說法只視為該產品自己的第一方決策理由，不外推為 MYNT 真實需求。

# Adjacent Ideas

1. **Provider-native cancellation before framework**：若 active PR #4 的實作者修 stale request，優先驗證 `AbortSignal` / `session.destroy()` 能否覆蓋 create + prompt lifecycle，再考慮 request-generation token。這是最小修正原則，不是新實作授權。
2. **Bounded preference sync**：只在出現實際多裝置 pain 時研究 browser-native sync；先限定非敏感、小型 preferences，保留 backup/restore 為 recovery truth。
3. **Fallback is a product capability**：對 zh-TW first / heterogeneous devices，deterministic local fallback 應有獨立可用性與驗收，不把它寫成「只有 Chrome AI 壞掉才用」的二等路徑。
4. **Distribution is separate from feature completeness**：upstream store traction 不代表 Reese fork 必須立刻上架；先決條件是明確 release ownership 與維護承諾。

# Cross-portfolio ideas

本輪沒有足夠 evidence 支持建立跨 portfolio framework。`AbortSignal-first cancellation` 是一般 web/agent 設計原則，但目前只有 MYNT PR #4 有直接 source-confirmed stale request；不能因可重用就先建 shared cancellation library。

# Opportunity Map

| Category | Signal | Decision |
|---|---|---|
| MUST MATCH | AI request lifecycle 不可讓 stale result 寫入目前 workflow | Existing PR #4 review finding；外部文件補上 AbortSignal 最小路徑；SKIPPED_LOCKED |
| MUST MATCH | zh-TW first 不能假設 Prompt API current language support涵蓋中文 | Preserve deterministic local fallback；runtime evidence pending |
| SHOULD BE BETTER | provider-specific cancel/destroy 優先於 generic request framework | Active PR #4 內可評估；radar 不接管 |
| DIFFERENTIATOR | local-first、no MYNT cloud AI、explicit Apply、最小權限 | Preserve |
| ADJACENT IDEA | browser-native bounded settings sync | 有明確競品 workflow，但 user pain 未建立；中央清單 בלבד |
| ADJACENT IDEA | custom fork store distribution | 可降低 manual install friction，但授權/維護未建立 |
| DO NOT COPY | Safari/mobile native product line | competitor 已提供 maintenance-cost 反例；無 owner demand |
| DO NOT COPY | whole-browser contextual AI / remote LLM just to補 zh-TW | 會擴 host/data/permission/cost surface；local fallback 更小 |
| DO NOT COPY | generic draggable dashboard framework | Workspaces/widgets 已有替代；沒有 current gap evidence |

# Four-gate assessment

## Candidate 1 —「修 PR #4 stale AI request，用 Chrome Prompt API 原生 cancellation」

1. **問題/價值**：問題已存在於 active PR review，非本輪新發現；使用者切換 workflow 時 stale response 可寫到錯誤 dialog。
2. **優先級**：既有 review 已標 P2；本輪不重新升降級。外部 docs 只是更好的解法證據，不是新 severity evidence。
3. **最小方案**：先測 `AbortSignal` / `session.destroy()`；只有 provider lifecycle 無法完整覆蓋時才加小型 request generation guard。不要建 orchestration framework。
4. **研究/實作分離**：active PR #4 已有 owner；radar 不留言、不實作、不拿鎖。

**Decision：DEDUPE + SKIPPED_LOCKED_ACTIVE_PR#4。**

## Candidate 2 —「因 Prompt API 不支援 zh-Hant，就加入雲端 LLM 或 Translator→Prompt pipeline」

1. **問題/價值**：文件顯示 current Prompt API language list不含中文，但尚未執行本 repo 的 zh-TW runtime；且 local fallback 已存在。
2. **優先級**：`NOT_ESTABLISHED`；沒有證據顯示核心 Today/Scratchpad 工作因此失敗。
3. **最小方案**：保留/驗證 local fallback 比新增雲端 provider、翻譯層、API key 更小。
4. **研究/實作分離**：若未來要研究，只需兩三個繁中 fixtures 驗證 provider selection / user-visible fallback；不需先做 provider architecture。

**Decision：REJECT EXPANSION / NEEDS_RUNTIME_VERIFICATION。**

## Candidate 3 —「加入 Bonjourr 式設定同步」

1. **問題/價值**：競品確實減少跨裝置搬設定步驟，但本 repo 沒有真實 multi-device pain / support evidence。
2. **優先級**：`kind=OPPORTUNITY`, `severity=NOT_ESTABLISHED`, decision priority LOW/MEDIUM only if future evidence arrives。
3. **最小方案**：現有 backup/restore 已提供低頻遷移；若需求建立，再研究 browser-native sync 的非敏感 subset。
4. **研究/實作分離**：目前連 Research Issue 都不通過；只保留 central idea。

**Decision：ADJACENT IDEA / no Issue。**

## Candidate 4 —「發布 Safari/mobile/custom store build」

1. **問題/價值**：沒有 owner/user evidence 說 manual install 或 Safari/mobile 是目前核心障礙。
2. **優先級**：`NOT_ESTABLISHED`。
3. **最小方案**：維持 Chromium/Firefox current support；README 已清楚描述 custom install 與 upstream store boundary。
4. **外部反證**：Bonjourr 已因 Safari App Store high maintenance / low usage 退出，證明「多一個平台」不能只用 feature parity 理由通過。

**Decision：DO NOT COPY / no Issue。**

# Rejected Ideas

- **Cloud LLM fallback for Chinese**：目前 local deterministic fallback 更小、更符合 privacy contract；沒有 runtime/user evidence要求雲端。
- **Translator API wrapper around Prompt API**：新增第二段 AI pipeline 與語意漂移/錯誤 surface；未證明必要。
- **GitHub Gist sync**：會新增 token handling、外部寫入與 cross-browser conflict；在 browser-native bounded sync 都未證明需要前，不合理。
- **Safari native packaging**：無需求證據且有直接 maintenance-cost 反例。
- **AI reading active tabs / browsing context**：需要更廣 content/host access，改變產品從 new-tab dashboard 到 browsing assistant；超出 owner contract。
- **Generic widget/dashboard framework**：已有 Workspaces、現有 widgets 與 personalization，缺乏可觀察 root-cause gap。

# Existing findings / issue mapping

| Repo | Existing item | This round | Reason |
|---|---|---|---|
| MaterialYouNewTab | PR #4 stale AI request P2 | `NEW_EXTERNAL_EVIDENCE + DEDUPE + SKIPPED_LOCKED` | Chrome first-party AbortSignal/destroy 讓最小修法更具體，但 active PR 不搶改 |
| MaterialYouNewTab | PR #4 duplicate Add tasks / dialog label / changelog reviews | `NO_CHANGE` | 本輪 external evidence 沒有改變 root cause / priority |
| MaterialYouNewTab | PR #5 exam UI/weather/video lifecycle | `NO_CHANGE / SKIPPED_LOCKED` | 與本輪 sync/Prompt API signals 不同 fingerprint |
| MaterialYouNewTab | audit MYNT-R3-01 modal focus/ARIA P2 | `NO_CHANGE` | target Issues disabled，且本輪無新 external evidence 改變 finding |

- **New Issue mapping：none**。
- Target-repo Issues disabled；本輪沒有為了追蹤方便更改 repository setting，也沒有另造 central implementation Issue。

# Sources

## External primary sources

1. Chrome for Developers — Prompt API；published 2025-05-20，last updated 2026-08-26；checked 2026-09-17  
   https://developer.chrome.com/docs/ai/prompt-api
2. Bonjourr — homepage / recent updates；checked 2026-09-17  
   https://bonjourr.fr/
3. Bonjourr Docs — Install；docs current 2026-08-31；checked 2026-09-17  
   https://bonjourr.fr/docs/
4. Bonjourr Docs — Import & Export；last updated 2026-08-31；checked 2026-09-17  
   https://bonjourr.fr/docs/settings-management/import-and-export/
5. Bonjourr Docs — Sync your settings；checked 2026-09-17  
   https://bonjourr.fr/docs/settings-management/syncing/
6. Bonjourr Docs — Privacy Policy；checked 2026-09-17  
   https://bonjourr.fr/docs/reference/privacy-policy/
7. Vivaldi Help — Start Page Widgets；checked 2026-09-17  
   https://help.vivaldi.com/desktop/tools/start-page-dashboard/
8. Vivaldi Help — Sync；checked 2026-09-17  
   https://help.vivaldi.com/desktop/tools/sync/
9. Chrome Web Store — upstream MYNT listing；version 3.3.802，updated 2026-08-03；checked 2026-09-17  
   https://chromewebstore.google.com/detail/mynt-material-you-new-tab/jjpokbgpiljgndebfoljdeihhkpcpfgl

## Repository evidence

- `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md` — blob `8167e10798071d2276addaff6b201c6b0e904a2a`。
- `Reese-max/autodev-ng/docs/competitive-intelligence/2026-09-17T040042Z-external-radar.md` — prior cursor/baseline。
- `Reese-max/MaterialYouNewTab` `main@71ed3072adb0db29d68830435eb8325fcc0971b3`；product-code baseline `c9e58837534b4853395f9a06e30086d8f7bf5a3f`。
- `Reese-max/MaterialYouNewTab/README.md` — local-first dashboard / backup / install / distribution boundary。
- `Reese-max/MaterialYouNewTab/AGENTS.md` — owner maintenance/privacy/storage/accessibility contract。
- PR #4 `feature/ai-assist-3.5.0` — active AI Assist scope and review findings。
- PR #5 `feature/police-exam-countdown` — active exam UI/weather/video scope。
- `docs/audits/50-persona-round-3-2026-09-15.md` — existing modal accessibility P2 + Issues-disabled state。

# What Changed

相較 `2026-09-17T040042Z-external-radar.md`：

1. Fresh inventory 仍為 39 owned / 38 unarchived；沒有把 inventory drift 當 repository deletion。
2. 前一 cursor `lplrs-judicial-sync` 本輪不可存取（不在 inventory + direct 404）；標 `PARTIAL_CURSOR_ACCESS` 並公平向後移，不停在失敗 target 忙迴圈。
3. 完成 `MaterialYouNewTab` cold-rotation review。
4. Chrome 第一方文件為 active PR #4 stale-request finding 提供新的最小修正證據：AbortSignal / session destroy，而不是新 framework。
5. Chrome current Prompt API language/hardware boundary讓 `zh-TW first + local fallback` 的產品必要性更明確；沒有把 unsupported-language docs 冒充 runtime bug。
6. Bonjourr 提供設定 sync 的直接競品模式，但 user pain 未建立，因此保留 Adjacent Idea，不開單。
7. Safari/mobile distribution 反而有競品 maintenance-cost 反證，因此不擴平台。
8. **0 new Issues / 0 issue changes / 0 PR comments / 0 implementation authorization**。

# Classification / scope calibration

- 沒有把「Chrome Prompt API 中文目前未列支援」升成 P1/P2 bug；只有 current docs + no runtime reproduction。
- 沒有把「競品有 sync」轉成 FEATURE gap；尚無 user pain / strategic urgency evidence。
- 沒有把 store user count / rating 外推為 Reese fork ROI、需求量或成功率。
- 沒有把 provider-native AbortSignal 變成新的 architecture initiative；它只是 existing active bug 的更小候選修法。
- 沒有因 target Issues disabled 就更改 settings 或另外建立 central implementation tracker。
- active PR #4/#5 均保持 ownership，不搶 scope。

# Completion / gaps / cursor

- External direct competitor / platform sources：完成。
- Adjacent workflow：完成（settings sync / dashboard modularity / platform maintenance）。
- Current pricing：本輪核心產品/功能無需要付費比較的決策，未以價格訊號立案。
- Community signals：無通過門檻項目。
- Runtime：未執行 Chrome AI、zh-TW Prompt、multi-device sync、Safari/mobile；相關主張保留為 docs-level evidence，標 NEEDS_RUNTIME_VERIFICATION。
- Cursor access gap：`lplrs-judicial-sync` 目前 connector 不可存取；未推論刪除。
- 本輪實際完成 target：`MaterialYouNewTab`。
- **Next fair-rotation cursor：`minideck`**。
- Radar result：**COMPLETE_WITH_CURSOR_ACCESS_GAP**。
