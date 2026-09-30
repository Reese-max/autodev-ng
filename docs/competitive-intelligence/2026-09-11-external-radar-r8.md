# External Competitive / Product / Workflow Inspiration Radar — 2026-09-11 r8

## Scope / Method

本輪重新確認 Reese-max 擁有的 repositories：排除已 archived 的 `gemini-deidentifier`、`obsidian-vault`、`openab` 後，目前仍為 **37 個未封存、可視為產品或產品基礎設施的 repositories**。

本輪主要情報來源是 GitHub 之外的公開網路，GitHub 僅用於建立產品→市場類別對照、讀取近期變更、確認現有 Issues / PR / locks / repository gap。優先時間窗為最近 30–90 天；較舊資料只在其產品模式仍直接代表當前市場結構時保留。

Status semantics:
- **CONFIRMED**：官方產品/文件/商店/release notes 或可核對的一手資料。
- **LIKELY**：多項可信訊號一致，但缺少完整一手契約。
- **COMMUNITY_SIGNAL**：Reddit / 社群個案，只代表質性痛點，不代表發生率。
- **UNKNOWN**：目前證據不足，不推定。

本輪沒有修改任何產品原始碼、實作分支、merge、deploy、secrets、權限或 repository settings。

---

# Executive Result

本輪找到一個達到高價值立案門檻的新產品機會：

> **MaterialYouNewTab — 將既有 Workspaces 從「靜態 preset + launch URLs」升級成 opt-in、local-first 的 Session Capsule：擷取目前實際 tabs、先 preview，再只還原 missing tabs，保留 dedupe / privacy / unsupported-state receipt。**

**Opportunity Score: 91/100**

這不是要把 MYNT 變成完整 vertical-tab manager，而是補上目前最明顯的 context-switching 人工斷點：使用者已經有 Work/Study/Coding workspace，但真正工作幾小時後產生的 GitHub Issue、Docs、Figma、研究頁仍要靠「一直留著 tabs」或人工重找才能回復。

建立 Issue 前已檢查 `MaterialYouNewTab` 的相關 Issues / PR：未找到 `session / stash / restore / tabs / dedupe` 同 fingerprint，open PR #5 是 exam UI / weather / video lifecycle，不是本題；repo code search 也未找到 `github-issue-lock:v1`。嘗試建立正式 `[Competitive Inspiration][FEATURE]` Issue 時，GitHub 回覆 **410: Issues has been disabled in this repository**。本輪遵守「不改 repository settings」規則，**沒有為了立案而重新開啟 Issues**；機會完整記錄在本中央 radar，待 repository owner 決定是否啟用 Issues 或改用既有產品規劃機制。

Stable fingerprint:

`MaterialYouNewTab + local-first workspace presets + static launch URLs + no opt-in current-tab capture / saved-session preview / dedupe-aware restore + users manually preserve browser context by leaving tabs open or rebuilding it`

---

# External Signals

## S1 — Perch：new-tab dashboard 將「關掉也不怕」做成 local browser-state primitive

**Status:** CONFIRMED  
**Date:** 2026-07-18  
**Source:** https://www.piyushgambhir.com/projects/perch

Perch 是 local-first browser extension / new-tab dashboard；named stashes 能保存一組或所有 open tabs，之後一鍵 restore。它的 command palette 同時搜尋 open tabs、saved items 與 stashes，並處理 duplicates、recently closed/archive、inactive tabs。產品頁明確標示 no account、no sync、no telemetry，browser state 只存在本機/browser-profile storage。

### Job-to-be-Done
使用者在 Work / Research / Side Project 之間切換時，希望能放心關閉整批 tabs，又能回到「剛剛真正做到哪裡」，不必把 tab strip 當外部記憶。

### 為何比現有做法省時間／步驟／更可靠
- Capture 的是實際 browser state，不只是預先設定的首頁 URL。
- Restore 之前仍能搜尋 saved context。
- Duplicate-aware workflow 比「workspace 每次重新 launch 全部 URL」更不容易堆出重複頁面。

### Onboarding / Distribution
直接在 new-tab / extension surface 內完成，不要求使用者學另一套 project manager。

### 新能力模式
`Live browser context → local snapshot → close safely → search → restore`

### 限制／失敗點
URL reopen 不代表 SPA/form/login runtime state 真的復原；若產品把 URL restore 宣稱成完整 session resurrection，會形成假可靠性。

### Reese-max 可吸收 / 不照抄
- **吸收：** `workspace ↔ session snapshot`、local-first、open+saved context 共用 palette。
- **不照抄：** 不先做自動關閉、背景 inactivity daemon 或 heavy tab-manager UI。

---

## S2 — SignalTabs：2026-08-22 把 open tabs / saved items / archive / duplicate cleanup 收斂進 new-tab workspace

**Status:** CONFIRMED  
**Date:** updated 2026-08-22  
**Source:** https://chromewebstore.google.com/detail/signaltabs-tab-workspace/paamdcbpjkcpcpnncoggpdikfmeeinhd

SignalTabs 的核心不是更多 widgets，而是把「目前 browser state」直接變成 new-tab 的可操作內容：按 domain 看 open tabs、清 duplicate、save for later、restore archive，並搜尋 open tabs / saved items / bookmarks / history。它也誠實揭露 memory release 的副作用：背景音訊可能停止、未儲存的 transient page state 可能遺失。

### Job-to-be-Done
在 tab 太多時先看清楚、去重、收起，再回來，而不是一直把工作記憶壓在 tab bar 上。

### Reliability signal
值得移植的是其「副作用要說清楚」：MYNT future receipt 應區分 `URL_RESTORED` 與 `PAGE_STATE_UNKNOWN`，不能把重開 URL 冒充完整 page-state restore。

### DO NOT COPY
SignalTabs 可搜尋 history；MYNT 現有 minimal-permission 是明顯優勢，MVP 不應為了「Find Anything」一開始就要求 browsing history。

---

## S3 — SuperchargeNavigation：workspace 正從 UI preset 變成 persistent browser context

**Status:** CONFIRMED  
**Dates:** 2026-08 current v1.3.4；new-tab page updated 2026-08-10  
**Sources:**
- https://www.superchargebrowser.com/navigation/
- https://www.superchargebrowser.com/features/new-tab-page/

SuperchargeNavigation 的 command bar 可搜尋 open tabs / bookmarks / workspaces；multi-window mode 將不同 window 與 workspace 綁定，browser restart / extension reload 後仍保留。其 current product 也把 new-tab dashboard、workspace switch、pinned tabs、search 放在同一 surface。

### Job-to-be-Done
切 workspace 時不只是換一組顏色與 shortcuts，而是回到該工作的 browser context。

### Onboarding / Distribution
Chrome / Edge extension，使用 browser-native account sync，不需要另外建立產品帳號。

### Pricing / Business Model Signal
目前全部 navigation/workspace 功能免費，沒有 PRO tier；這只是市場 packaging 訊號，不是效果證據。對 MYNT 的啟示是：**Session Capsule 可先當 local/browser-native core capability，不需要先發展 SaaS account。**

### DO NOT COPY
不要把 MYNT 改造成完整 vertical-tabs browser shell；workspace restore 是可移植核心，sidebar suite 不是。

---

## S4 — Tabisto：Saved Sessions 已變成 new-tab 產品的 power-user monetization primitive

**Status:** CONFIRMED  
**Dates:** current 2026；privacy policy updated 2026-08-08  
**Sources:**
- https://tabisto.app/
- https://tabisto.app/privacy-policy

Tabisto 將 Workspaces、Saved Sessions、Command Palette、Notes、Reminders 整合進 new tab。Free tier 有 1 個 saved session；Pro 提供 unlimited sessions、session history / auto-snapshots、workspace export/import。核心資料 local-first，登入只用於 optional cloud sync。

### Product design signal
市場不是只把「session restore」做成工程工具，而是當成一般 power-browser workflow；而且 local-first 與 optional sync 可以同時存在。

### Pricing signal
Tabisto 以容量/history 作付費邊界，而不是把基本 session workflow 完全鎖住。Reese-max 不必複製定價，但這說明 saved session 是有足夠使用價值的 first-class object。

### DO NOT COPY
MYNT 目前是 customized fork，不應因外部產品有 subscription 就導入 billing/account backend。

---

## S5 — Floorp 12.17：workspace 開始攜帶執行上下文，而非只攜帶外觀

**Status:** CONFIRMED  
**Date:** 2026-08-21  
**Source:** https://blog.floorp.app/en/release/12.17.0/

Floorp v12.17.0 的 command palette 在 Open URL 時可選 container，亦可使用 workspace default container；搜尋結果也跟隨 current workspace 的 default container。

### Adjacent transferable principle
`workspace` 正從「一組 UI/快捷鍵」往「執行這份工作時應恢復的 browser context」移動。

### Reese-max 可吸收
MYNT 不需要複製 Firefox identity containers；最小跨 Chromium/Firefox 共用能力先做**實際 tab/session context**。

### DO NOT COPY
身份隔離/container 與 account boundary 牽涉 browser-specific API 與更大 permission surface，不應和 Session Capsule MVP 綁在一起。

---

## S6 — Post-booking airfare monitoring：機票產品的價值正從「買之前找便宜」延伸到「買完後仍持續看」

**Status:** CONFIRMED product pattern / PARTIAL applicability to Taiwan-departure product  
**Dates:** current 2026；Gondola help updated 2026-07-13  
**Sources:**
- https://www.tripmanta.com/
- https://www.gondola.ai/help/auto-save-guide
- https://faretracker.thriftytraveler.com/
- https://travel.capitalone.com/terms/price-drop-protection/

TripManta 已把「Already booked?」做成獨立 workflow：forward confirmation，持續監控 booked itinerary，符合 fare rules 時處理 airline credit/refund。Gondola 將 Rate Monitoring 與 AutoSave 分開，且對不同航空公司/fare type 明確區分可自動處理、只能通知、或不可監控。Thrifty Traveler FareTracker 採更保守模式：不讀 inbox、不拿 reservation credentials，只要求使用者輸入 flight details，價格下降後提供 airline-specific rebooking steps。Capital One Travel 則對 eligible booking 提供自動 10-day price-drop protection，credit 有上限。

### Job-to-be-Done
「我已經買了，現在不想每天再查一次；如果同一票價條件真的下降，告訴我是否值得做下一步。」

### Why more reliable
成熟產品都把 eligibility/fare rules/期限/airline-specific path 拉進 workflow，而不是只比一個 headline price。

### 對 `ai-flight-radar` 的機會
可研究：
`BookedItinerary → exact fare/booking facts → read-only price watch → RepriceCandidate → eligibility/policy evidence → user action guide / receipt`

### 為何本輪不立案
`ai-flight-radar` 現在 P0/P2 仍明確要求真實來源健康、第二獨立票源、完整往返與行李總價、下單前 reconfirm；而台灣出發常涉及 EVA / China Airlines / 亞洲 OTA / 不同 reissue/refund 規則。若現在直接把美國市場「flight credit」模式當普遍能力，會把 **US airline fare policy** 誤當全球產品 truth。

**Action:** Research list，Score 88；先建立 Taiwan/international fare-rule evidence matrix，再決定是否升級成正式 Issue。

---

## S7 — PPT Studio：新功能擴張目前被既有 P1 fail-open remote-auth boundary 壓過

**Status:** CONFIRMED internal product constraint  
**Date:** 2026-09-11 repo audit

本輪 GitHub recent-change check 發現，自 r7 之後唯一明顯產品狀態變化是 `ppt-studio` Round-3 audit：default Compose 已改為 loopback bind，但應用層 `NetworkAuthMiddleware` 在缺少 `APP_TOKEN` 時仍 pass-through，且 same-host reverse proxy 可因 loopback bypass 跳過 auth；current default CI 也仍失敗。

### Product implication
外部簡報市場即使持續往 Agent/chat-edit/on-brand workflow 前進，本產品本輪 **DO NOT ADD** 新 remote/collaboration/agent surface。先把 fail-closed remote boundary 與 CI 做到 VERIFIED，再談更多公開服務能力。

這是「刪除/延後功能」而非 ADD FEATURE 的重要例子。

---

# New Releases / Market Moves

| Date | Product / Release | Signal | Confidence |
|---|---|---|---|
| 2026-08-22 | SignalTabs 1.0.8 | new-tab workspace 直接處理 live tabs、duplicates、archive、restore | CONFIRMED |
| 2026-08-21 | Floorp 12.17.0 | workspace + command palette 開始攜帶 container context | CONFIRMED |
| 2026-08-10 / current Aug | SuperchargeNavigation | new-tab + workspace + open-tab unified navigation | CONFIRMED |
| 2026-08-08 | Tabisto privacy update | saved sessions local-first；sync optional | CONFIRMED |
| 2026-07-18 | Perch | local-first new-tab session stash/restore + command palette | CONFIRMED |
| 2026-07-13 | Gondola AutoSave docs | post-booking monitoring / airline-specific automation states | CONFIRMED |

---

# Community Pain Points

## Browser tabs 被當作 external memory

**Status:** COMMUNITY_SIGNAL  
**Dates:** 2026-07-01 / 2026-07-06  
**Sources:**
- https://www.reddit.com/r/chrome_extensions/comments/1ukns5u/my_chrome_extension_glitches_your_browser_the/
- https://www.reddit.com/r/chrome_extensions/comments/1up5nt0/tired_of_losing_chrome_sessions_between_projects/

個別使用者／開發者描述多專案切換時，會用大量 open tabs 保存「我做到哪裡」；因此 session manager 產品往 save workspace / restore / duplicate cleanup / local-only 發展。只視為質性 failure-mode，不推定市場比例。

## Tab restore ≠ page state restore

SignalTabs 官方商店頁自己揭露 suspend/release memory 可能讓背景音訊停止、未儲存 transient page state 遺失。這是比社群抱怨更值得保留的產品限制：任何 Session Capsule 必須把「URL 可重開」和「應用狀態可復原」分開。

## Post-booking fare 的痛點不是只有「價格變了」

外部服務普遍要額外判斷 fare class、basic economy、award ticket、airline rules、credit/refund/reissue path。對 `ai-flight-radar`，若只把 booked fare 加到現有 price watcher 而沒有 eligibility truth，反而可能製造不可執行的 alert。

---

# Adjacent Ideas

1. **Workspace Session Capsule**：static workspace preset 與 live browser session revision 分離。
2. **Restore Preview before browser mutation**：先列 already-open / missing / duplicate / unsupported，再 apply。
3. **URL_ONLY receipt**：重開 URL 不等於 SPA/form/login/page runtime state 已復原。
4. **Permission-on-use**：只有真正啟用 Session Capsule 時才要求 tab metadata permission。
5. **Backup privacy split**：一般設定備份預設排除 captured session URLs；若匯出另行 consent。
6. **Find Current + Saved，不先要 History**：Command Palette 可先統一 open tabs / saved capsules / bookmarks，保留 minimal permission。
7. **Workspace runtime context**：先吸收「context」原理，不複製 browser-specific identity/container。
8. **Post-booking Watch Candidate**：`ai-flight-radar` 未來可從 pre-book price watch延伸到 booked itinerary，但 eligibility evidence先行。
9. **Research before automation**：對航空 credit/reissue，不因 Gondola/TripManta 能自動處理就直接加入 autonomous claim。
10. **Security blocker overrides feature race**：`ppt-studio` 遠端 auth P1 未關閉前，競品新 collaboration/agent feature 不應改變排序。

---

# Opportunity Scores

| Candidate | User Pain | Strategic Fit | Novelty | Evidence | Reuse | Effort | Risk | Score | Action |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| MaterialYouNewTab Workspace Session Capsule | 9 | 10 | 7 | 9 | 7 | 7 | 8 | **91** | **High-value; Issue creation attempted but repo Issues disabled** |
| ai-flight-radar Post-booking Fare Watch / Reprice Candidate | 9 | 9 | 8 | 9 | 7 | 6 | 6 | **88** | Research list；先做 Taiwan/international fare-rule evidence |
| MaterialYouNewTab Unified Find: open + saved + bookmarks | 8 | 9 | 7 | 9 | 7 | 7 | 8 | 86 | Fold into Session Capsule later；不另開功能 |
| MaterialYouNewTab Workspace Snapshot History | 7 | 8 | 7 | 8 | 6 | 6 | 7 | 80 | Deferred；先證明 manual snapshot有用 |
| ppt-studio more remote collaboration / live agent editing | 7 | 7 | 7 | 7 | 6 | 5 | 3 | 66 | **Reject for now**；P1 auth + red CI first |
| ai-flight-radar Auto-claim/rebook airline credit | 8 | 7 | 7 | 7 | 5 | 3 | 3 | 62 | **DO NOT COPY now**；policy/credential/airline differences太大 |

Score 是 prioritization aid，不是統計預測；高 implementation difficulty / security/privacy/cost risk 會降低 actionability。

---

# Opportunity Map — 37 Product Repositories

| Product | Market | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|---|
| exam-archive | Exam archive/search | source/year/question traceability | fewer PDF/context switches | evidence-linked archive | unresolved OCR/source exceptions queue | generic chat-first UI |
| police-exam-practice | Police exam practice | reliable answers/source mapping | one-flow practice→review | Taiwan police-domain evidence | weak-topic decision queue | gamification bloat |
| police-exam-archive | Police exam archive | canonical exam/source identity | inline figures/answers | police-specific provenance | source-health exceptions | duplicate generic archive modes |
| 92-duty-scheduler | Duty scheduling | canonical schedule/revision truth | self-service exception flow | policy+eligibility+receipt | unresolved shift-change queue | full HR/payroll suite |
| UkePack | Music/ukulele creative tools | editable/exportable artifacts | fewer tool hops | human-owned creative state | candidate-change review queue | opaque autonomous generation |
| ppt-studio | Presentation authoring | **fail-closed remote auth + green baseline before expansion** | editable deck + minimal manual reformat | revision/evidence-aware generation | later: agent/edit collaboration after security verification | add remote surfaces while P1 auth remains open |
| voice-actress | Police/legal essay grading | rubric/evidence/legal-source truth | faster evidence review | criterion→answer evidence receipt | unresolved citation/rubric queue | broad LMS expansion |
| taiwan-intel-dashboard | Public intel dashboard | source freshness/provenance | concise verified brief | Taiwan public-data synthesis | reuse AttentionItem later | revive paused scope with feature bloat |
| autodev-ng | Autonomous software factory | locks/gates/evidence/runtime truth | reduce human review congestion | principal+environment+effect receipts | decision-pressure feed | more agents/providers without control |
| flux-image-gen | Image generation/provenance | source/generation provenance | clearer reference/edit lineage | source evidence + receipt | exceptions for missing provenance | imply provenance = truth |
| claude-mem | Agent memory | memory source/version truth | less irrelevant recall | bounded provenance-aware memory | attention only for conflicts/stale memory | auto-promote all remembered text |
| lobsterpulse | Multi-agent CLI monitoring | truthful provider/session state | decision-only attention queue | correlated, receipted human attention | bounded pre-investigation | LLM summary for every event |
| prompt-autoresearch | Prompt/eval optimization | reproducible eval evidence | focus human on failed/ambiguous trials | candidate vs validated distinction | eval-exception queue | optimize solely on self-feedback |
| neciken-summer-poem | Creative poetry | editable human-owned output | simple inspiration flow | lightweight creative experience | optional candidate revisions | workflow/agent complexity |
| note-filler | Note/form filling | field/source correctness | reduce manual re-entry | source-linked fill candidates | ambiguous-field queue | silent autofill of uncertain fields |
| lplrs-judicial-sync | Legal/judicial evidence sync | canonical source/version identity | fewer manual comparisons | legal-source provenance/diff | changed-source decision queue | unsourced legal summaries |
| adng-memory | Software-agent memory/evidence | revision/evidence lineage | reduce stale context | execution-linked memory | conflict/stale attention queue | memory = permission |
| cyber-prep-coach | Cybersecurity training | correct/current source material | targeted remediation | evidence-linked coaching | weak-domain queue | arbitrary AI-generated facts |
| cf-ai-router | AI routing/model gateway | truthful model/cost/availability state | clearer fallback behavior | receipted routing decisions | exception-only route alerts | silent fallback masking |
| avatar-vfo | Avatar/video/voice creation | editable/exportable media state | fewer manual conversion steps | revision-aware creative handoff | failed-render attention queue | closed ecosystem lock-in |
| project-doctor-web | Project diagnostics | reproducible diagnosis | proactive only when action is needed | evidence-first repair preview | unresolved issue Nudge | silent auto-fix |
| minideck | Lightweight slides | fast editable deck | reduce authoring friction | minimal exportable artifact | blocked-step queue only | enterprise suite bloat |
| chatgpt-dual-pipeline | Multi-model pipeline/reviewer | model/run provenance | clearer disagreement handling | independent evidence/review path | disagreement decision queue | consensus = correctness |
| internship-notes-sites-mirror | Notes/static mirror | faithful source mirror | easier navigation/search | stable public artifact | broken-link/content drift queue | dynamic platform complexity |
| taichung-police-intel | Evidence-first public intelligence | source health/evidence/freshness | aging/follow-up prioritization | role-aware deterministic rerank | attention aging after #12 work | autonomous public-safety actions |
| soundbox-offline | Offline soundboard/audio | local/offline reliability | simpler import/dedupe | privacy-preserving offline-first | share-target/import candidate later | cloud account requirement |
| skill-foundry | Skill generation/eval/certification | formal certification + target read-back | focus on failed gates | cross-runtime evidence/receipt | certification attention queue | marketplace before reliability |
| video-timeline-pipeline | Video editing/timeline automation | reversible timeline edits | fewer editor hops | candidate patch + validation | render/review exception queue | destructive autonomous edit |
| ai-novel-workstation | Long-form writing | canonical manuscript/revision | reduce cross-tool copying | human-owned long-form state | continuity/conflict queue | auto-rewrite accepted text silently |
| clinical-scribe-worker | Clinical scribe | PHI/security/source revision truth | section-scoped repair | minimal patch + revision receipt | unresolved validation queue | autonomous clinical action |
| MaterialYouNewTab | Browser productivity/new tab | privacy/minimal permissions | **workspace → live session context handoff** | local-first Session Capsule + preview/dedupe restore | unified open+saved+bookmark palette | broad metadata/history permission by default |
| cf-mcp-server | MCP gateway/server | auth/egress/effect truth | clearer blocked/allowed reason | runtime verification receipt | blocked-effect decision queue | annotations as authorization |
| tick-stock-panel | Stocks/market panel | coverage/freshness/partial truth | exception-only signals | explicit UNKNOWN/PARTIAL | decision-only watch queue | trading automation from weak data |
| herdr-skills | Agent behavior/skills refinement | candidate≠active rule | detect repeated correction | validated promotion + receipt | conflict/promotion queue | auto-learn every correction |
| ninax-line-hermes | LINE agent/workflow | verified identity/current-state truth | reduce chat→system re-entry | typed request + receipt | unresolved approval queue | chat message = canonical truth |
| ai-flight-radar | Flight search/price watch | quote/source/freshness truth | **pre-book watch first; research post-book monitoring** | explainable watch evidence | booked-itinerary RepriceCandidate | auto-purchase / auto-rebook from weak policy evidence |
| academic-mcp | Research/paper MCP | canonical paper/source identity | less cross-source dedupe work | versioned research bundle ledger | rate-limit/conflict exception queue | flatten PARTIAL/RATE_LIMITED to “no result” |

---

# Top 10 Cross-Portfolio Ideas

1. **Workspace/Project state should include execution context, not only preferences** — MYNT Session Capsule is最小、低風險實例。
2. **Candidate Restore → Preview → Apply → Receipt** — 對 browser tabs、文件、creative revisions 都比 silent restore安全。
3. **State restoration needs scope labels** — `URL_ONLY`, `ARTIFACT_ONLY`, `FULLY_VERIFIED` 不可混成一個「已恢復」。
4. **Permission-on-use** — 能 optional permission完成的工作，不應預先要求 broad access。
5. **Short-lived context ≠ long-term knowledge** — Session Capsule 與 Bookmark 分離；同理 candidate research 與 canonical evidence 分離。
6. **Local-first can still support portability without central SaaS** — browser-native sync/export可作後續，而非帳號前置。
7. **Post-completion monitoring is a distinct JTBD** — `已買/已發布/已部署` 後的 drift/value opportunity 值得另外建 lifecycle。
8. **Eligibility before notification** — 航空 price drop若不可 reissue，通知本身就不是 actionable opportunity。
9. **Security blocker overrides competitor feature pressure** — `ppt-studio` 是本輪明確的 DO NOT ADD 例子。
10. **Simplify presets when live state exists** — MYNT 固定 launch URLs保留 canonical入口；一次性變動頁面改由 Session Capsule，避免 workspace preset越塞越長。

---

# Ideas Rejected / Deferred

1. **把 MYNT 直接改成 vertical-tab / side-panel browser shell** — scope 太大；會重複 Floorp/Supercharge，而不是深化既有 new-tab product。
2. **Session Capsule 一開始就拿 history / webNavigation / all_urls** — 不符合現有 minimal-permission 差異化；先以 optional tabs能力驗證 JTBD。
3. **Background auto-close / auto-suspend / auto-snapshot** — 會改變 browser state；沒有使用者實測前不做。
4. **把 Session URLs 混進一般設定 backup** — URL/title 是敏感瀏覽 metadata；預設應排除。
5. **宣稱重新開 URL 等於恢復完整 session** — SPA runtime、forms、login、unsaved input都可能不存在。
6. **現在為 ai-flight-radar 建 auto-credit / auto-rebook** — 國際/Taiwan airline fare rules、credential、reissue差異太大。
7. **以美國 Main Cabin 可取 credit 的產品模式推論 EVA/China Airlines** — 缺本地 fare-rule evidence，不可外推。
8. **在 ppt-studio 增加 remote collaboration/agent actions** — Round-3 P1 auth與 red CI 仍是更高優先。
9. **因 Tabisto 有 subscription 就替 MYNT 做帳號/付款** — business model訊號不等於產品需求。
10. **再建立一套「Find Anything」獨立產品層** — 應收斂進既有 Command Palette，不增加新導航 surface。

---

# Issue Mapping

## High-value candidate

### `Reese-max/MaterialYouNewTab` — Workspace Session Capsule
- Score: **91/100**
- Fingerprint: `MaterialYouNewTab + local-first workspace presets + static launch URLs + no opt-in current-tab capture / saved-session preview / dedupe-aware restore`
- Duplicate search: no same/near issue found for `workspace/session/tabs/stash/restore/dedupe`.
- PR check: current workspace-related PR #5 concerns exam UI / weather / video lifecycle, not this feature.
- Lock check: no `github-issue-lock:v1` in repo code search.
- Issue creation action: **attempted**.
- GitHub result: **410 — Issues has been disabled in this repository.**
- Coordination action: **do not modify repository settings; preserve full proposal in central radar only.**

Minimum deliverable when/if tracking surface becomes available:
1. Versioned `WorkspaceSessionRevision` local schema.
2. User-gesture optional permission spike for Chromium + Firefox capability matrix.
3. Capture preview with unsupported/incognito/sensitive-scheme filtering.
4. Restore preview: already-open / missing / duplicate / unsupported.
5. Missing-only apply + bounded large-session confirmation.
6. `RestoreReceipt(page_state=URL_ONLY)`.
7. Default backup excludes captured URL/title.
8. True unpacked-extension runtime verification on Chromium + Firefox/Zen.

### `Reese-max/ai-flight-radar` — Post-booking Reprice Candidate
- Score: **88/100**.
- No new Issue this round.
- Reason: external market pattern is strong, but Taiwan/international fare-rule applicability is not yet strong enough; repo roadmap has higher-priority source/fare truth prerequisites.
- Research gate before escalation: build evidence matrix for at least Taiwan-origin common carriers/fare families; separate `PRICE_DROP_DETECTED` from `CREDIT/REISSUE_ELIGIBLE`.

### `Reese-max/ppt-studio`
- No competitive feature Issue created.
- Round-3 P1 remote auth boundary and current default CI failure remain the priority; competitive expansion signals are deliberately rejected until verified remediation.

---

# Proposed MaterialYouNewTab Minimum Contract

```text
Current Browser Window
  → Capture Candidate
  → Sensitive/Unsupported Filter
  → User Preview
  → WorkspaceSessionRevision
  → (later)
  → Restore Preview
      - ALREADY_OPEN
      - MISSING
      - DUPLICATE_CANDIDATE
      - UNSUPPORTED
  → Explicit Apply
  → RestoreReceipt(page_state = URL_ONLY)
```

### Privacy / Permission rules
- Session Capsule default OFF.
- Only request browser tab metadata capability after explicit user gesture.
- Do not make `history`, `webNavigation`, `<all_urls>` MVP dependencies.
- incognito / browser-internal / extension-internal schemes fail closed / unsupported.
- captured URL/title stays local.
- ordinary backup excludes session URLs by default.
- no AI/analytics/remote-sync of session metadata.
- permission revoke = truthful degraded state, not broad fallback permission.

### Acceptance criteria
- Existing workspace static launch URLs remain backwards compatible.
- Capture and restore are candidate/preview flows; no silent browser mutation.
- Existing URL does not open duplicate by default.
- URL query/hash normalization is conservative, versioned and tested.
- Large restores require bounded confirmation.
- Receipt never claims full page state restored.
- Chromium and Firefox capability differences are explicit.

### Success metrics
- fewer manual steps to reconstruct an 8–12-tab work context;
- 0 unexpected duplicate opens in deterministic fixtures;
- 0 unsupported URL reported as successfully restored;
- 0 broad permission added for users who do not enable feature;
- 0 session URL/title in default backup / remote requests.

---

# Sources

## Browser / New-tab / Workspace
1. Perch — 2026-07-18: https://www.piyushgambhir.com/projects/perch
2. SignalTabs Chrome Web Store — updated 2026-08-22: https://chromewebstore.google.com/detail/signaltabs-tab-workspace/paamdcbpjkcpcpnncoggpdikfmeeinhd
3. SuperchargeNavigation current: https://www.superchargebrowser.com/navigation/
4. Supercharge new-tab page — updated 2026-08-10: https://www.superchargebrowser.com/features/new-tab-page/
5. Floorp 12.17.0 — 2026-08-21: https://blog.floorp.app/en/release/12.17.0/
6. Tabisto product/pricing current: https://tabisto.app/
7. Tabisto privacy policy — updated 2026-08-08: https://tabisto.app/privacy-policy
8. Tabisto Toby comparison — 2026-06-02: https://tabisto.app/toby-alternative
9. COMMUNITY_SIGNAL — 2026-07-01: https://www.reddit.com/r/chrome_extensions/comments/1ukns5u/my_chrome_extension_glitches_your_browser_the/
10. COMMUNITY_SIGNAL — 2026-07-06: https://www.reddit.com/r/chrome_extensions/comments/1up5nt0/tired_of_losing_chrome_sessions_between_projects/

## Flight / Post-booking monitoring
11. TripManta current: https://www.tripmanta.com/
12. Gondola AutoSave guide — updated 2026-07-13: https://www.gondola.ai/help/auto-save-guide
13. Gondola launch article — 2026-04-29: https://www.gondola.ai/blog/flight-auto-save-united-delta-alaska-american
14. Thrifty Traveler FareTracker current: https://faretracker.thriftytraveler.com/
15. Capital One Travel Price Drop Protection current terms: https://travel.capitalone.com/terms/price-drop-protection/
16. Independent Gondola coverage (NerdWallet, 2026): https://www.nerdwallet.com/travel/news/gondola-introduces-flight-auto-save

---

# What Changed Since Last Radar (r7 → r8)

1. **新增高價值機會：MaterialYouNewTab Workspace Session Capsule（91/100）。**
2. 第一次把 MYNT existing Workspaces 從「preset / launch URLs」與「live browser session state」分層分析；外部 2026-07/08 產品顯示 saved session + local-first + unified palette 已形成穩定市場模式。
3. **Issue 建立被 repository configuration 阻擋**：`MaterialYouNewTab` Issues disabled，GitHub 410；遵守規則未修改 settings，中央 radar保留完整 proposal。
4. 新增 `URL_RESTORED ≠ PAGE_STATE_RESTORED` 產品契約，避免 session功能製造假可靠性。
5. 新增 post-booking airfare monitoring 市場訊號；`ai-flight-radar` 研究方向從單純 pre-book alerts延伸到 `BookedItinerary → RepriceCandidate`，但因 Taiwan/international fare-rule evidence不足而**不立案、不自動 rebook**。
6. 自 r7 後 GitHub recent-change review顯示主要產品狀態變化是 `ppt-studio` Round-3 P1 auth regression evidence；因此其 Opportunity Map改為**安全修復優先於新 remote feature**。
7. 37-repo Opportunity Map 全量重新輸出；未增加 repository 數量。
8. 本輪沒有更新或建立任何其他產品 Issue，沒有 feature quota灌水。

---

# Portfolio Principle Added in r8

> **Workspace ≠ Preset；Restore ≠ Reopen；Reopen URL ≠ Restore State。**

跨產品可抽象成：

`Canonical Intent / Preset → Observed Runtime Context → Candidate Snapshot → Preview → Explicit Restore/Apply → Capability-scoped Mutation → Truthful Receipt`

對 MYNT，最實際的下一步不是再增加一個 widget，而是讓使用者能在不犧牲 minimal-permission / local-first 的前提下，把「真正做到哪裡」安全收起來，再可靠地回來。