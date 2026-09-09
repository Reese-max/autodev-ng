# External Competitive Intelligence Radar — 2026-09-10

## Executive Summary

本輪重新盤點 Reese-max 目前可存取、未封存且可視為產品的 35 個 repositories。最近一輪後沒有看到需要推翻既有 Portfolio 方向的新產品程式碼變更；最新 commit 主要是產品董事會／50 Persona audit、`taichung-police-intel` publication refresh，以及上一輪 memory-security radar。

本輪主要外部資料來源為 GitHub 之外的公開網路，重點掃描 browser/new-tab/workspace/session-management 市場，因為 `MaterialYouNewTab` 已有 Workspaces、local-first、backup/restore、Pomodoro、Scratchpad、command palette，但目前 workspace 仍以人工 `launch URLs` 建立。最近 30–90 天出現一批直接競品，把「目前瀏覽器狀態 → 可搜尋/可恢復的本機 workspace snapshot」做成核心產品，而不是要求使用者再人工重建工作區。

本輪保留 1 個高價值新機會：

**MaterialYouNewTab — Workspace Tab Session Snapshot / Preview / Restore**

Opportunity Score: **94/100**

核心方向：

`Current browser context → CandidateSnapshot → Permission-aware capture preview → Versioned local workspace snapshot → Restore diff → Bounded restore → RestoreReceipt`

此機會通過 duplicate/fingerprint/PR 檢查，但嘗試依規則建立 `[Competitive Inspiration][FEATURE]` Issue 時，GitHub API 回覆 **410: Issues has been disabled in this repository**。本輪因此沒有修改 repository settings、沒有另開替代 repository 的重複 Issue，只把完整規格寫入中央 radar。

---

## Portfolio Discovery / What Changed Since Last Radar

- 目前範圍：35 個 Reese-max owned + unarchived product-like repositories。
- `exam-archive`、`lobsterpulse` 最近新增 2026-09-09 product-board audit；沒有新的產品功能 commit。
- `taichung-police-intel` 持續刷新 V1/V2 publication bundle；既有 read-only Evidence MCP / canonical publication 方向不變。
- `cf-mcp-server` 最近是 Round 3 audit 與既有 regression tracking，沒有新的競品機會勝過既有 deployment/auth/security backlog。
- `clinical-scribe-worker`、`avatar-vfo` 最近為 Round 3 audit；既有 P0/P1 或 continuity validation 優先。
- `MaterialYouNewTab` 最近產品程式碼變更仍是 2026-08-28 的 layout/bookmark personalization；2026-09-05 是 audit 文件。README 明確把 Workspaces 定義為保存 widgets、focus duration、background、launch URLs 的 local-first preset；`myntNormalizeWorkspaces()` 目前保存 `{id,name,widgets,background,focusMinutes,urls}`，workspace 上限 8、URL 上限 10；Chromium manifest 目前沒有 `tabs` / `tabGroups` permission。
- 上一輪高價值主題 `adng-memory #4` 的 Memory Poisoning / origin-aware admission / quarantine 仍成立，本輪沒有重複立案。

---

# External Signals

## A. Direct Competitor Recent Capabilities

### CONFIRMED — SessionGrid X, updated 2026-09-08

Chrome Web Store 的 SessionGrid X 把完整 window 轉成 local-first workspace，保存 tab URL/title、pinned state、active tab、window structure、Chrome tab groups，並提供 recovery snapshot、search、duplicate detection、JSON backup。這是**產品能力證據**，不是其可靠性或使用者成效的獨立驗證。

JTBD：使用者已經在 Chrome 裡形成一個專案工作環境，希望關掉 tabs 後仍能完整回到那個 context。

產品訊號：workspace 不只是「一組 bookmarks」，而是 versioned/recoverable browser state。

Source: https://chromewebstore.google.com/detail/sessiongrid-x-tab-workspa/gghgjnmclndonogigpahmgopldpomcel

### CONFIRMED — Hoby, updated 2026-09-05

Hoby 是新的 new-tab workspace：可保存單一 tab 或整個 window、`Save & close`、restore 時避免重複開啟已存在 URL、undo 最近 workspace change，且其產品說明特別強調 tab/favicon access 為 optional、只在 capture 啟用時要求，沒有 page-content access / browser-history permission。

可移植原理：**高價值 session capture 不需要把 extension 升級成全面瀏覽監控工具。**

Source: https://chromewebstore.google.com/detail/hoby-%E2%80%94-tab-workspace/ldmdmjcmdmhkmgmpakppdnanmpmbchol

### CONFIRMED — TabDeck, updated 2026-09-05

TabDeck 是新上架的 offline/private new-tab workspace。其目前產品頁已把 `Save All Tabs Sessions & One-Click Restore`、Export / Import、Focus Mode、Notes 等列入未來 Pro superpowers；這只是 roadmap / pricing signal，不證明市場轉換率。

設計訊號：session depth 可以是 new-tab 工具的高價值付費軸，而不是一定要靠 AI 或 cloud sync 收費。

Source: https://chromewebstore.google.com/detail/tabdeck-tab-manager-works/abjaibfiiljlddkimjhpchbodijkdddh

### CONFIRMED — Tab Organizer, updated 2026-07-07

Tab Organizer 把 new-tab dashboard、workspace、auto-save session、search、local storage 放在一起，且明確提供 Replace / Keep / Additive 三種切換語意。

可移植原理：**restore 應是有名稱、可預測的操作模式，而不是單一「全部打開」按鈕。**

Source: https://chromewebstore.google.com/detail/tab-organizer-workspace-t/fpkgcoeealjomofoephoebmpkjpkpano

### CONFIRMED — Toby, updated 2026-06-03

Toby 的現行 extension 仍把「不用重找歷史、不用重新 Google、從任何 window 儲存/打開 collections」作為核心 workflow。它代表成熟市場中 tabs → reusable collection 的直接競爭基線。

Source: https://chromewebstore.google.com/detail/toby-tab-management-tool/hddnkoipeenegfoeaoibdmnaalmgkpip

---

## B. Adjacent Transferable Workflow

### CONFIRMED — Chrome Tabs / Tab Groups official APIs, rechecked 2026-09-10

Chrome 官方文件確認：

- `chrome.tabs` 可建立、修改、重新排列 tabs；
- `tabs` permission 主要提供 URL、pendingUrl、title、favIconUrl 等敏感欄位；
- `chrome.tabGroups` 有獨立 `tabGroups` permission，可讀 title/color/collapsed/window 等 group metadata；
- tab ID、group ID 都是 browser-session scoped，不能當 durable workspace identity。

所以 MYNT 若做持久化 snapshot，應保存 stable URL/order/pinned/group metadata + 自己的 local keys，而不是保存 runtime ID。

更重要的是：這條路不必使用 `<all_urls>`、page DOM、content scripts、form content、cookies 或 headers。這讓 **explicit optional capture** 與現有 narrow-permission/local-first 定位相容。

Sources:
- https://developer.chrome.com/docs/extensions/reference/api/tabs
- https://developer.chrome.com/docs/extensions/reference/api/tabGroups

### CONFIRMED — Tame Tabs, updated 2026-04-17

Tame Tabs 把整個 window state、tab groups name/color、local-only storage、no-account 做成 workspace switching；免費 10 workspaces，Pro 為 unlimited、$5/year。這是 pricing + permission UX 的代表性模式，而非成效證據。

Source: https://chromewebstore.google.com/detail/tame-tabs/jjnonamcgamlcnceihmbogleinliiicf

### CONFIRMED — Orbit Workspace, updated 2026-06-19

Orbit 把 saved links 保存在 Chrome bookmarks，再映射成 native tab groups，強調不要取代 Chrome workflow，而是使用既有 bookmarks/tabs/tab-groups 原語。

可移植原理：MYNT 不需要創造一套平行「虛擬瀏覽器」，只要把自己的 Workspace intent 與 browser-native context 接好。

Source: https://chromewebstore.google.com/detail/orbit-workspace/fppmdkfmppjkjngfdedpldgjmpahhija

---

## C. Emerging Tools / Product Possibilities

### CONFIRMED — SignalTabs, updated 2026-08-22

SignalTabs 把 open tabs 稱作外部記憶，採 local-first、no server-side sync，釋放 tabs 前讓使用者 review/confirm；同時明示 unsaved transient page state 可能遺失。

這是一個重要反向證據：**URL/session restore ≠ 完整 application-state restore**。MYNT 不應承諾表單、editor unsaved buffer、登入 session、影音播放位置等都可重建。

Source: https://chromewebstore.google.com/detail/signaltabs-tab-workspace/paamdcbpjkcpcpnncoggpdikfmeeinhd

### CONFIRMED — TabMend, updated 2026-06-10

TabMend 與 MYNT 結構很接近：new tab + workspace + sessions + Pomodoro + tasks + command palette；免費限制 workspace/session，Pro 解鎖 unlimited。這代表「新分頁生產力整合」已不只比 widgets，而是在比 **context switching / recovery**。

Source: https://chromewebstore.google.com/detail/tabmend-workspace/icncbohjicjjajbelncddppgofhgafjc

---

# Community Pain Points

以下全部只列 **COMMUNITY_SIGNAL**，不當市場統計：

1. 2026-08-14 TabVault 開發者在 Reddit 描述多專案大量 tabs 的需求：window/all-window capture、groups/pinned preserve、search、recovery snapshots、encrypted local backup、跨 session-manager import。這是開發者自述產品／需求，不代表平均使用者偏好。
   Source: https://www.reddit.com/r/chrome_extensions/comments/1vo9pko/i_built_tabvault_a_private_localfirst_chrome_tab/

2. 2026-05-06 Chrome 使用者描述 forced restart 後一般 session restore 失敗，Sessions 檔案無法恢復。只是單一案例，但支持「browser-native restore 不應被當作唯一 recovery boundary」。
   Source: https://www.reddit.com/r/chrome/comments/1t5t5zy/restoring_google_chrome_tabs_or_sessions/

3. 2026-03-22 Microsoft Q&A 使用者描述管理 50+ Edge Workspaces 時，缺乏 search/filter 使新 UI 幾乎不可用。這是 anecdotal scale warning，不是 Edge Workspaces 的普遍失敗率。
   Source: https://learn.microsoft.com/en-us/answers/questions/5832043/edge-workspaces-update-makes-50-workspaces-unnavig

4. 2026-08-06 Story Tabs 開發者社群貼文顯示 workspace tools 正在加「save whole window、side panel switch、group share code、local-only、inactive tab unload」。分享碼很有趣，但 MYNT 本輪不吸收 collaboration；先完成 local capture truth。
   Source: https://www.reddit.com/r/chrome_extensions/comments/1vhgtdr/i_built_story_tabs_a_chrome_extension_for_saving/

---

# High-Value Opportunity — MaterialYouNewTab

## Proposed product contract

`WorkspacePreset + CandidateBrowserSnapshot + CaptureReview + SnapshotVersion + RestorePlan + RestoreReceipt`

### User workflow

1. 使用者已在 Chrome 建立研究／Coding／Study window。
2. MYNT Workspace 按「擷取目前分頁」。
3. 只有此時要求 optional `tabs`；需要保留 group 時才要求 `tabGroups`。
4. 顯示 capture preview，允許 exclude tabs，標示 special/internal/sensitive-looking URLs。
5. 儲存新的 local snapshot revision，不默默覆寫唯一版本。
6. 日後 restore 前先算 current vs snapshot diff。
7. 預設 `Open missing only`；另可 `Open in new window`。高破壞 `Replace current window` 不必進 MVP。
8. 回報 requested/opened/skipped_duplicate/unsupported/failed counts、group-degraded state 與 snapshot hash。

### Why it saves time/steps

目前使用者需逐一複製 URL、刪重、排序、手動重建 group；新模式直接從已存在的 browser state 產生 candidate。這是 workflow 步驟消除，不依賴「AI 更聰明」的假設。

### Onboarding / distribution signal

Hoby 類新產品把 permission 放在 explicit capture 時要求，而不是安裝就要求廣泛權限；此設計尤其適合 MYNT，因為目前 narrow optional permissions 已是明確產品承諾。

### Automation / mobile / offline / collaboration / provenance

- Automation：MVP 不做 silent auto-capture；更新由使用者觸發並 preview diff。
- Offline：所有 snapshot local-first，無需 server。
- Mobile：不宣稱手機 parity；先把 browser capability 寫入 receipt。
- Collaboration：本輪不做 share code/cloud sync，避免 scope 爆炸。
- Provenance：snapshot revision/hash + browser capability + restore receipt 可回答「這次到底恢復哪一版」。

### Pricing / business-model signal

TabMend、Tame Tabs、TabDeck 都把 workspace/session depth 當付費價值軸之一；這只表示市場認為此能力可定價，不代表 MYNT 應立即加付費層。Reese-max fork 目前更適合先用此能力增加實用性與差異化。

### Failure points / constraints

- `tabs` metadata 本身敏感，URL query 可能含 token/搜尋詞／文件 ID；要 preview/redaction。
- 大量 restore 可能造成 memory/network burst；需 bounded concurrency 或 lazy restore。
- browser tab IDs/group IDs 不持久；必須 local identity mapping。
- Firefox / Zen API 不同；保留 manual launch-URL fallback。
- URL restore 不保證未保存 form/editor/app runtime state。

### Opportunity Score

| Dimension | Score | Evidence |
|---|---:|---|
| User Pain | 9/10 | 直接移除目前逐 URL 重輸入、重新整理 context 的步驟；community recovery/scale pain 只作佐證 |
| Strategic Fit | 10/10 | 直接深化既有 Workspaces/local-first/backup，不是旁支產品 |
| Novelty | 7/10 | 市場已有多個 session managers；MYNT 新意在與 widgets/focus/scratchpad 工作模式整合 |
| Evidence Strength | 10/10 | 多個 2026 Web Store 更新 + Chrome 官方 API + repo static evidence |
| Reuse Potential | 8/10 | snapshot/version/diff/receipt primitive 可沿用到 backup/import 與其他 local-state products |
| Implementation Effort | 7/10 | Chrome 可行但需 optional permissions、diff、restore、Firefox degradation、browser runtime tests |
| Security/Privacy/Cost Risk | 7/10 | 無 provider 成本，但 browsing metadata privacy 與 restore fan-out 需治理 |
| **Overall** | **94/100** | High-confidence product gap |

---

# Opportunity Map — 35 Product Repositories

> 本輪每個產品都保留 MUST MATCH / SHOULD BE BETTER / DIFFERENTIATOR / ADJACENT IDEA / DO NOT COPY；沒有新證據者延續既有方向，不為了配額開 Issue。

| Repository | Market category | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|---|
| exam-archive | 考試資料庫/題庫 | 來源與年度可追查 | coverage/缺件狀態誠實 | canonical source receipts | 與練習/教練共用題目 identity | 無來源 AI 補題 |
| police-exam-practice | 考試練習 | attempt/mastery truth | resume/錯題閉環 | provenance-linked learning state | 外部 AI 只讀學習狀態 | 模式堆疊 |
| police-exam-archive | 歷屆試題庫 | 題目/圖/答案來源 | 題圖內嵌與手機體驗 | source locator + archive integrity | 給 coach 的 canonical corpus | 用模型猜缺失官方答案 |
| 92-duty-scheduler | 排班/勤務 | deterministic eligibility | Rule Studio preview/conflict | PolicySpec + receipt | 自然語言→candidate policy | LLM 直接決定值勤或在 #14 修復前新增 mutation |
| UkePack | 工具包/內容產品 | install/run 可重現 | onboarding/runtime evidence | 小而明確的 packaged workflow | portable preset/export | 為「AI 化」重寫已可用核心 |
| ppt-studio | 簡報生成/編輯 | editable deck + export | claim/source traceability | provenance-aware slide pipeline | automation/API/MCP 可作後續研究 | 只產平面圖、失去 editable truth |
| voice-actress | 語音/配音 | source/legal boundary | criterion-linked evaluation | evidence-backed grading/voice assets | 可重播 benchmark packs | 把主觀模型分數當真人效果 |
| taiwan-intel-dashboard | 公開情報 dashboard | truth/coverage/freshness | summary 不可掩蓋 partial | operating-state receipts | 未來 read-only Evidence surface | truth 尚不穩時擴分發 |
| autodev-ng | 長跑 Agent orchestration | exact task/execution identity | steer/queue、attention、cost truth | receipt-driven operator control | cross-agent behavior regression | 無界 autonomy/靜默 authority drift |
| flux-image-gen | AI 圖像生成 | generation/edit 正確性與 abuse gate | provider truth、downloads、batch | ProvenanceReceipt + C2PA inspect | credential preservation | C2PA 當真假偵測器 |
| claude-mem | coding memory | origin/provenance | poisoning admission/retrieval defense | memory receipts across tool observations | 共用 adng-memory policy | stored memory = trusted instruction |
| lobsterpulse | Agent observability | state detection 正確 | attention inbox after P1 signal fixes | cross-agent needs-attention | replay/cost trace | 在底層狀態不可信時加更多 dashboard |
| prompt-autoresearch | prompt/eval research | reproducible trials | origin-aware memory + behavior contracts | paired replay / non-inferiority | shared eval packs | 單次 benchmark 即自動 promote |
| neciken-summer-poem | 創作/內容體驗 | content fidelity | publish/share clarity | intentional aesthetic UX | lightweight export | 無產品需求的 agent/infra 複雜化 |
| note-filler | 法律/行政筆記 | original immutable、無來源不入正文 | result isolation | claim-level Accept/Reject ledger | AuthorityReceipt consumer | AI 自動批准自己研究結果 |
| lplrs-judicial-sync | 司法資料同步 | erasable body lifecycle | removed/stale/unknown | AuthorityReceipt + SourceSpan | legal AI canonical source | hash = good law / erasure bypass |
| adng-memory | durable Agent memory | candidate≠active | poisoning/quarantine/rollback | origin-aware admission + action reauth | portfolio shared memory policy | memory = authorization |
| cyber-prep-coach | 資安學習教練 | mastery/attempt evidence | evidence-linked coaching | trustworthy learner model | read-only corpus connectors | generic chatbot 取代教學狀態 |
| cf-ai-router | AI routing | provider health/cost truth | local/remote capability-aware routing | verifiable route receipt | local inference providers如 PAIR 類 | opaque fallback/假成本 |
| avatar-vfo | persona/角色 AI | persona continuity | trajectory recall | continuity ablation/regression harness | structured memory + replay | 未驗證就一直增加心理狀態變數 |
| project-doctor-web | 醫療教育模擬 | educator case truth | rubric/debrief evidence | CaseSpec deterministic reveal | replayable competency simulation | LLM 自創 clinical truth |
| minideck | 簡報發布 | draft/publish truth | versioned publication | published_version receipt | data-linked refresh research | draft 自動等於 public truth |
| chatgpt-dual-pipeline | 多模型工作流 | route/role 可追查 | cross-model handoff | exact input/output receipts | behavior regression packs | 模型互評 = objective truth |
| internship-notes-sites-mirror | 筆記/靜態網站 | source/content consistency | navigation/mobile/readability | structured internship knowledge | read-only search/index | 過度平台化簡單內容 |
| taichung-police-intel | 公開警政情報 | canonical public evidence | multi-source verification | read-only Evidence MCP | cross-agency public intel | 內部勤務/個資/operational action |
| soundbox-offline | offline media | backup/restore safety | local transfer reliability | LAN/QR local handoff | capability-limited device bridge | 雲端帳號作基本前置 |
| skill-foundry | Agent skill lifecycle | artifact identity | package security + runtime/quality分離 | Security Attestation | supply-chain policy reuse | hash = safety |
| video-timeline-pipeline | 影片分析 | timeline evidence | sparse→dense evidence escalation | bounded agentic rescan | multimodal evidence packs | 全片昂貴無界掃描 |
| ai-novel-workstation | 長篇 AI 寫作 | truth/continuity/production loop | context/cost preflight | ContextManifest + Cost Envelope | behavior regression on model upgrade | 為省錢靜默換模型 |
| clinical-scribe-worker | ambient clinical docs | auth + reviewer integrity | specialty-scoped validation | omission/misattribution packs | governed workflow expansion | 在 P0/P1 未清前擴自主臨床 action |
| MaterialYouNewTab | new-tab productivity/browser workspace | local-first + optional permissions | **capture current context instead of manual URL entry** | **Workspace Snapshot + diff + restore receipt** | local recovery/search | broad browsing surveillance / cloud-first rebuild |
| cf-mcp-server | Cloudflare MCP/ops | exact target + explicit confirmation | OAuth/abuse/deployment correctness | staged promotion receipts | policy primitives reuse | 以文件 PASS 取代 runtime evidence |
| tick-stock-panel | market panel | source coverage/market state truth | partial/closed/unavailable 分辨 | coverage receipt | multi-provider truth adapter | partial data 當完整市場 |
| herdr-skills | multi-agent skills | tool/engine capability truth | portable orchestration contracts | cross-engine skills + receipts | shared memory/permission primitives | 假設所有 CLI 同權限/同 semantics |
| ninax-line-hermes | LINE/agent workflow | message/event provenance | bounded recovery/cost | resumable evidence-backed review | origin-aware memory admission | 外部訊息直接取得 authority |

---

# Top 10 Cross-Portfolio Ideas

1. **Browser/Workspace Snapshot primitive** — 任何「目前狀態 → 可重用工作模式」產品都應有 candidate/version/diff/receipt，而不是直接覆寫。
2. **Optional Capability Permission** — 僅在功能被明確使用時要求敏感能力，拒絕後核心產品仍可運作；可移植到 browser/MCP/Agent control surfaces。
3. **RestoreReceipt** — restore/import/replay 要回報 exact requested/succeeded/skipped/failed，不用單一 success 布林值。
4. **Local Identity ≠ Runtime ID** — browser tab ID、deployment ID、execution handle 都需要 persistent local identity mapping。
5. **Preview before destructive replace** — workspace replace、policy activation、memory promotion、deployment promotion共享同一產品語法。
6. **Search before raising limits** — collections/workspaces/issues/memory 一旦規模上升，先解 findability，再解 unlimited quantity。
7. **Sensitive metadata minimization** — URL/title/trace/receipt 都可能含私密資訊；儲存與 export 必須 allowlist/redact。
8. **Capability-degraded cross-platform mode** — Chromium/Firefox、provider/engine 差異應被建模成 capability state，不是假裝 parity。
9. **Behavior-level migration gates** — API 能跑不代表 workspace restore/persona continuity/clinical behavior未漂移；保留 sealed replay fixtures。
10. **Canonical truth + distributable evidence** — browser workspace、法律來源、政府情報、Agent memory 都應把 underlying truth 與 UI/AI interpretation 分離。

---

# Ideas Rejected / Held

### DO NOT COPY — automatic continuous browser surveillance
市場有 auto-save/session tools，但 MYNT 目前 narrow permissions/local-first 是既有優勢。MVP 不應為了 convenience 持續監控全部 browser history 或 page content。

### HELD — cloud sync / accounts / E2EE session service
TabHub 類產品把 cross-device sync 做成核心，但這會增加 account、key recovery、server security、retention、privacy scope。MYNT 已有 JSON backup；目前證據不足以證明 cloud sync 應比 local capture 優先。

### HELD — AI auto-grouping of tabs
已有產品宣稱 AI/grouping 能整理 tabs，但 MYNT 的主要 gap 是「人工複製已有 context」。先移除這個確定的 friction，再評估 AI grouping；否則增加模型成本與錯分風險。

### DO NOT COPY — unlimited workspaces without search
Edge 50+ workspace complaint雖只是 COMMUNITY_SIGNAL，但已足以提醒：提高現有 8 workspace 上限前應先建立 search/filter，而不是只放大列表。

### DO NOT COPY — promise “full session restore”
只能保證能重建有證據的 URLs/order/pinned/group metadata；不能承諾未提交表單、登入狀態、SPA memory 或影音進度。

### HELD — collaboration/share codes
Story Tabs 類 share-code workflow有趣，但它改變 threat model 與資料外流面。先完成單機 capture/recovery contract。

---

# Issue Mapping

| Repository | Candidate | Score | Duplicate/Lock result | Action |
|---|---|---:|---|---|
| MaterialYouNewTab | Workspace Tab Session Snapshot / Capture Preview / RestoreReceipt | 94 | `is:issue` = 0；all-state PR 搜尋無同 fingerprint；無可搶鎖 issue | **建立 Issue 嘗試被 GitHub 410 阻擋：Issues disabled；只寫中央 radar，不修改 settings** |
| adng-memory | Memory poisoning / origin-aware admission | 95 (prior) | 已映射 #4 | 本輪不重複更新 |
| 92-duty-scheduler | PolicySpec / Rule Studio | 94 (prior) | 已映射 #20 | 本輪不重複更新 |
| project-doctor-web | CaseSpec / Debrief | 96 (prior) | 已映射 #11 | 本輪不重複更新 |
| taichung-police-intel | read-only Evidence MCP | 93 (prior) | 已映射 #15 | 本輪不重複更新 |
| avatar-vfo | continuity regression harness | 95 (prior) | 已映射 #5 | 本輪不重複更新 |
| lplrs-judicial-sync | AuthorityReceipt / SourceSpan | 92 (prior) | 已映射 #3 | 本輪不重複更新 |

---

# Minimum Deliverable if MaterialYouNewTab Issues Are Enabled Later

1. Workspace schema 增加 optional versioned snapshot；legacy `{urls}` 可 migration。
2. Chromium 只在 explicit capture 時要求 optional `tabs`；group preserve 再要求 `tabGroups`。
3. capture preview 能逐 tab include/exclude，對特殊／敏感 URL fail-safe。
4. snapshot update 顯示 diff；保留至少上一版可 undo。
5. restore 預設 `Open missing only`；另可 `Open in new window`。
6. preserve pinned/order/groups where supported；Firefox 明確 degraded。
7. restore receipt 保存 requested/opened/skipped_duplicate/unsupported/failed + snapshot hash。
8. backup/import 包含 snapshot privacy disclosure 與 schema validation。
9. 20+ tabs / 3 groups / duplicate / permission denied / corrupt import / partial restore failure 實際 unpacked Chromium runtime test。
10. 不能用新增功能取代現有 audit 尚缺的 keyboard/200% zoom/corrupt restore/browser runtime CLEAN evidence。

Success Metric 第一階段不宣稱「節省 X% 時間」；先要求固定 20-tab fixture 可在不逐 URL 複製的情況建立 workspace，且所有 success/failure 都能由 RestoreReceipt 重播。

---

# Sources

## Current / recent market
- SessionGrid X — Chrome Web Store, updated 2026-09-08: https://chromewebstore.google.com/detail/sessiongrid-x-tab-workspa/gghgjnmclndonogigpahmgopldpomcel
- Hoby — Chrome Web Store, updated 2026-09-05: https://chromewebstore.google.com/detail/hoby-%E2%80%94-tab-workspace/ldmdmjcmdmhkmgmpakppdnanmpmbchol
- TabDeck — Chrome Web Store, updated 2026-09-05: https://chromewebstore.google.com/detail/tabdeck-tab-manager-works/abjaibfiiljlddkimjhpchbodijkdddh
- SignalTabs — Chrome Web Store, updated 2026-08-22: https://chromewebstore.google.com/detail/signaltabs-tab-workspace/paamdcbpjkcpcpnncoggpdikfmeeinhd
- Tab Organizer — Chrome Web Store, updated 2026-07-07: https://chromewebstore.google.com/detail/tab-organizer-workspace-t/fpkgcoeealjomofoephoebmpkjpkpano
- Orbit Workspace — Chrome Web Store, updated 2026-06-19: https://chromewebstore.google.com/detail/orbit-workspace/fppmdkfmppjkjngfdedpldgjmpahhija
- TabMend — Chrome Web Store, updated 2026-06-10: https://chromewebstore.google.com/detail/tabmend-workspace/icncbohjicjjajbelncddppgofhgafjc
- Toby — Chrome Web Store, updated 2026-06-03: https://chromewebstore.google.com/detail/toby-tab-management-tool/hddnkoipeenegfoeaoibdmnaalmgkpip
- Tame Tabs — Chrome Web Store, updated 2026-04-17: https://chromewebstore.google.com/detail/tame-tabs/jjnonamcgamlcnceihmbogleinliiicf

## Official technical sources
- Chrome Tabs API: https://developer.chrome.com/docs/extensions/reference/api/tabs
- Chrome Tab Groups API: https://developer.chrome.com/docs/extensions/reference/api/tabGroups

## Community signals only
- TabVault developer discussion, 2026-08-14: https://www.reddit.com/r/chrome_extensions/comments/1vo9pko/i_built_tabvault_a_private_localfirst_chrome_tab/
- Story Tabs developer discussion, 2026-08-06: https://www.reddit.com/r/chrome_extensions/comments/1vhgtdr/i_built_story_tabs_a_chrome_extension_for_saving/
- Chrome session restore anecdote, 2026-05-06: https://www.reddit.com/r/chrome/comments/1t5t5zy/restoring_google_chrome_tabs_or_sessions/
- Edge Workspaces scale complaint, 2026-03-22: https://learn.microsoft.com/en-us/answers/questions/5832043/edge-workspaces-update-makes-50-workspaces-unnavig

---

# What Changed Since Last Radar

1. 上一輪焦點是 durable Agent memory poisoning；本輪沒有重複放大 memory backlog。
2. 新增一個此前未正式立案的 browser-product gap：MYNT 已有「工作區意圖」，但尚未把真實 browser context 變成可版本化 workspace state。
3. 2026-09-05～09-08 的 Hoby、TabDeck、SessionGrid X 提供非常新鮮的 direct-market signal；其中 Hoby 的 optional permission + local-only model 特別符合 MYNT 現有安全定位。
4. 技術可行性已由 Chrome 官方 Tabs/TabGroups API 交叉驗證；同時確認 URL/title 等 metadata 確實是敏感 permission surface，所以不是單純 ADD FEATURE。
5. 本輪嘗試建立正式 MaterialYouNewTab Issue，但 repository Issues 已停用；依跨排程規則沒有改 settings、沒有在別的 repo 造替代 Issue。
6. 新的跨 Portfolio primitive：**Capture candidate state → Preview/Diff → Versioned local truth → Bounded restore → Receipt**。這與既有 PolicySpec、Memory admission、deployment promotion、publication truth 的「candidate ≠ authoritative」原則一致。
