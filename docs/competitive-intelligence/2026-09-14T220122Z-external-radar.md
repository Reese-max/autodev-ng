# 外部競品／新品／工作流靈感雷達 — 2026-09-14T22:01:22Z

> 查閱日：2026-09-15（Asia/Taipei）；檔名與 run 時間使用 UTC。
>
> Issue Quality：`issue_quality_version: 2`；本輪讀取 `docs/portfolio-audit/2026-09-14-issue-quality-v2.md` blob `8167e10798071d2276addaff6b201c6b0e904a2a`。
>
> Evidence labels：`CONFIRMED`＝第一方官方資料或可直接檢查的 repository truth；`LIKELY`＝有支持但仍需 runtime／真人證據；`COMMUNITY_SIGNAL`＝個別社群經驗；`UNKNOWN`＝資料不足。
>
> 本輪沒有修改產品原始碼、CI/config、secret、權限或 repository settings；沒有建立實作 branch、merge、deploy、啟動 worker/run 或新 GOAL；沒有付費試用或變更正式資料。

## Executive Summary

本輪依上一輪 cold-rotation cursor 深讀 `Reese-max/ppt-studio`。重新列舉 connected GitHub owner listing，仍為 **42 個 Reese-max owned repositories**，其中 3 個 archived、39 個 owned + unarchived；沿用最新範圍校準：**36 個 product-like + 3 個 support/compatibility-only**（`adng-memory`、`internship-notes-sites-mirror`、`police-exam-practice`）。沒有操作他人 repository。

市場訊號很一致：2026 年的 AI 簡報產品正在從「從空白生成 deck」進一步走向 **在既有原生簡報裡繼續工作**，並把既有 `.pptx` 的匯入／原地修改／可編輯 handoff 當成正常入口。OpenAI 於 2026-07-06 將 ChatGPT for PowerPoint 對 Business GA，可直接在既有 PowerPoint 中新增或修改投影片；Pitch 當前可直接匯入 `.pptx`，且明確列出 unsupported elements；Gamma 當前也允許 PowerPoint import，但官方明講 master layouts、custom templates、background images 無法保留。這些訊號支持一個真實的產品假設：**如果 PPT Studio 使用者已經有一份工作中的 PPTX，現在必須先轉成 JSON/Markdown/PDF、重新輸入或到別的工具修改，才進得來 PPT Studio。**

但這項假設**沒有通過新 Issue gate**。原因不是競品證據不足，而是 Reese-max 自己的產品方向與證據不足：`MISSION.md` 明確說 P5 已完成、K1–K5 進維護期、P6 候選未經 owner 拍板不得主動開工；2026-09-14 Product Board 又明確排定 `#1 trust boundary → #5 bounded native editing → #3 provenance`，並要求 INVEST / SIMPLIFY，不擴成完整設計／Office 平台。現在沒有 PPT Studio 真人使用者證據證明「匯入既有 PPTX」是 top friction；#5 的 native object / render-export contract 也尚未完成。因此本輪 **0 新 Issue、0 existing Issue scope rewrite**，只將「existing-deck continuity」保留為高價值但 `NEEDS_EVIDENCE` 的研究候選。

下一個 cold-rotation cursor：`project-doctor-web`。

## Scope / Repository Truth

### Portfolio enumeration

Owned + unarchived（39）：

`92-duty-scheduler`, `academic-mcp`, `adng-memory`, `ai-flight-radar`, `ai-novel-workstation`, `autodev-ng`, `avatar-vfo`, `cf-ai-router`, `cf-mcp-server`, `chatgpt-dual-pipeline`, `claude-mem`, `clinical-scribe-worker`, `cyber-prep-coach`, `exam-archive`, `flux-image-gen`, `google-maps-personal-mcp`, `herdr-skills`, `internship-notes-sites-mirror`, `lobsterpulse`, `lplrs-judicial-sync`, `MaterialYouNewTab`, `minideck`, `neciken-summer-poem`, `ninax-line-hermes`, `note-filler`, `police-exam-archive`, `police-exam-practice`, `ppt-studio`, `project-doctor-web`, `prompt-autoresearch`, `skill-foundry`, `soundbox-offline`, `spotify-playlist-organizer-mcp`, `taichung-police-intel`, `taiwan-intel-dashboard`, `tick-stock-panel`, `UkePack`, `video-timeline-pipeline`, `voice-actress`.

Archived（排除）：`gemini-deidentifier`, `obsidian-vault`, `openab`。

Support/compatibility-only（不列獨立產品競爭面）：`adng-memory`, `internship-notes-sites-mirror`, `police-exam-practice`。

### ppt-studio current truth

Current default branch：`master@6a0dbddf1f81843dea303db49ba7e528d4ef189c`（2026-09-14；audit/documentation HEAD）。近期實質產品修正 `da303f7cdc93883b6aed1b414286ef640a6c99ee` 已限制 Docker Compose loopback 並增加 APP_TOKEN network auth；#1 仍有 active PR #2 `github-1-local-only-compose@830fa55286b20f43860db374a6ff461e6fd93191`，正在補完整 Docker runtime/persistence/CI evidence，因此不碰其 scope。

North Star / owner scope（`MISSION.md` + 2026-09-14 Product Board）：
- 核心使用者：非設計師的個人知識工作者／學生／講師／業務，需要快速生成、審核、局部修改並匯出可繼續編輯的 PPTX。
- 現有 K1：PDF/URL/text → slides；K1–K5 已進維護期。
- `MISSION.md` 明確要求 P6 未經 owner 拍板不得主動加 task。
- Product Board：INVEST / SIMPLIFY；優先 #1 → #5 → #3；不做多人協作 SaaS、Marketplace、完整自由排版引擎、任意 LLM geometry/code。

Current default behavior relevant to this radar：
- README 支援 topic / JSON / Markdown / URL / PDF 進入生成流程；支援 PPTX / JSON / Markdown 輸出。
- 沒有 `/api/import-pptx` 或其他 PPTX ingestion endpoint；repository code search 未找到 PPTX import path。
- `python-pptx` 已是既有 export/rebuild dependency，不需要為最小驗證先引入另一個解析服務。
- #5 已追蹤四種既有 layout 的 bounded native edit / stable object / render-export verification；2026-09-14 comments 已明確要求只做窄 research 並以 BUILD/NARROW/REJECT 結束，且目前無 #5 implementation branch/PR。
- #3 已追蹤外部內容的 claim/source provenance，不應因 PPTX import 再建第二套 evidence system。

## External Signals

### A. Direct competitor update — ChatGPT for PowerPoint 把「既有 deck 內直接修改」做成正式產品面

**CONFIRMED；事件日期 2026-07-06；查閱 2026-09-15**

Sources:
- https://help.openai.com/en/articles/11391654-chatgpt-team-release-notes
- https://help.openai.com/en/articles/20001242

OpenAI 於 2026-07-06 宣布 ChatGPT for PowerPoint 對 Business generally available。官方目前文件描述它直接存在於 PowerPoint sidebar，可對**既有簡報**新增／修改投影片、檢查敘事與結構，並保留 editable slide structure；同時官方明確警告 advanced editing / template matching 仍可能有限，重要工作要 review，最好先 duplicate file 以便回復。

**JTBD / manual step removed**：已有公司 deck、上月報告或既有模板時，不必把內容複製到另一個 AI deck app、再匯回 PowerPoint；AI 在 capability owner（PowerPoint）內工作。

**Onboarding / distribution**：不是要求使用者先建立新 deck，而是把 AI 放到現有 Office 工作面；Skills / apps 可在相同 surface 取 approved source context。

**Business-model signal**：Business 在 2026-08-06 後按 flexible pricing / workspace credit pool；這只表示「原生文件內 AI 操作」可以被當成可計量 agentic action，不拿來推估 Reese-max 付費意願或 ROI。

**Known limits / do not copy**：官方仍要求 review、advanced shapes/charts/template matching 可能有限。PPT Studio 不應因此做 Office add-in 或企業 connector 平台；值得吸收的是「使用者已有 artifact 時，不強迫重新開始」。

### B. Adjacent transferable workflow — Pitch / Gamma 把 import 的「可保留與不可保留」做成明確契約

**CONFIRMED；Pitch / Gamma Help Center 均顯示 updated this week，但頁面未暴露精確更新日；查閱 2026-09-15**

Sources:
- https://help.pitch.com/en/articles/4615453-import-a-presentation
- https://pitch.com/integrations/ppt-import
- https://help.gamma.app/en/articles/11047840-how-can-i-import-slides-or-documents-into-gamma

Pitch 當前支援 `.pptx` 直接 upload / drag-drop；支援 slides、images、text、tables、notes、charts、SmartArt 等，同時明列 custom fonts、animations/transitions、某些 images 等 unsupported，並用黃色 placeholder 顯示 unsupported element 的位置。Pitch integration page 目前把 PowerPoint import 放在 free plan。

Gamma 的設計更能說明「不要假裝 fidelity」：Plain Import 只把內容一頁對一頁帶入；Import with AI 則明確是 restyle/transform。官方直接說 PowerPoint master slide layouts、custom template designs、background images 無法保留；如果 exact layout 很重要，應在 PowerPoint 完成。

**JTBD / manual step removed**：避免「先把舊 deck 逐頁複製成文字 → 再做新 deck」；同時讓使用者在 conversion 前知道哪些部分會 loss。

**Transferable principle**：若 PPT Studio 日後驗證 PPTX input，正確方向不是宣稱 full fidelity，而是 `immutable original → import candidate → per-slide SUPPORTED/PARTIAL/UNSUPPORTED → human review`。這可以直接重用既有 preview/candidate 思路。

**Pricing signal**：Pitch 把 import 放 free、export PPTX 放 premium，說明「把既有 artifact 帶進來」可被視為 onboarding friction remover，而非 necessarily premium differentiator。只作產品包裝訊號，不推算使用者願付價格。

**Do not copy**：不做完整 OOXML editor，不追所有 SmartArt/animation/master effect；Gamma 明確承認 layout architecture 不相容，反而支持 fail-visible / partial fidelity。

### C. New tool / technology possibility — ONLYOFFICE 讓 AI chat 直接產生 PPTX，再進原生 editor

**CONFIRMED；發布 2026-06-08；查閱 2026-09-15**

Source:
- https://www.onlyoffice.com/blog/2026/06/onlyoffice-docspace-3-7

ONLYOFFICE DocSpace 3.7 允許 AI chat 直接生成 DOCX / PDF form / PPTX，生成後立即在 editor 新分頁打開；同時 default AI provider/model 可從 DocSpace 同步到 editor。官方也說 Cloud 預設有這些能力，server build 需要目前 on-request 的 Automation API。

**New possibility**：AI 生成與 native artifact 編輯可以是同一條 workflow，但 canonical editing 仍由文件 editor 擁有。對 PPT Studio 最可移植的是「generation receipt → native handoff」與「不要因 AI chat 而建立第二個完整 editor」。

**Limit / do not copy**：ONLYOFFICE 是完整 office suite；其「少切換」是官方產品宣稱，不是 Reese-max 效果證據。PPT Studio 沒有理由追 document suite breadth。

## New Releases / Current Changes

- **2026-07-06 — OpenAI ChatGPT for PowerPoint GA (Business)**：既有 deck 原地新增／修改、editable structure、Skills/apps；advanced edits仍需 review。
- **2026-06-08 — ONLYOFFICE DocSpace 3.7**：AI chat 可生成 PPTX 並立即開啟編輯。
- **Current, updated this week — Pitch PPTX import**：既有 PowerPoint 直接 import，unsupported element 可視化為 placeholder；精確更新日未在頁面公開。
- **Current, updated this week — Gamma presentation import**：Plain Import vs AI Import 分離，且公開 master/template/background 的保真限制；精確更新日未在頁面公開。

## Community Pain

以下全部為 `COMMUNITY_SIGNAL`，不作發生率或市場統計：

- 2026-08-03，一位 PowerPoint 使用者描述對既有 PPT 逐次做小修改時，AI 反覆重讀整份 deck 造成 context 消耗，因此改成分階段 workflow。Source: https://www.reddit.com/r/powerpoint/comments/1vebpm0/i_spent_a_week_building_a_30slide_deck_with/
- 2026-07-08，一位使用者描述 Claude→Canva workflow 中以 PDF handoff 造成結構性破壞，改用 PPTX 後文字物件仍可編輯。Source: https://www.reddit.com/r/ClaudeAI/comments/1ur4glk/what_i_learned_trying_to_connect_claude_and_canva/
- 2026-07-24，一位開源工具作者抱怨「每次小改都重建 PPTX」太重，因此改用 editable JSON intermediate model + web preview；這更支持現有 #5，而非新開另一張 object-model Issue。Source: https://www.reddit.com/r/powerpoint/comments/1v52ezi/i_built_an_opensource_ppt_skill_that_uses_an/

這些只能作 regression / usability hypothesis；沒有任何一則被當成「多數使用者」證據。

## Opportunity Candidate — Existing-deck continuity（研究清單，不開 Issue）

### 真正使用者 / 北極星

非設計師已有工作中簡報，希望用 PPT Studio 改一小段、補一頁或沿用既有內容，而不是重新起一份 deck。這和「本機生成、審核、局部修改、可編輯 PPTX handoff」相鄰，但**不是 MISSION 已核定的必要流程**。

### Repo 內具體摩擦

CONFIRMED：PPT Studio 有 PPTX export，沒有 PPTX import；existing `.pptx` 不能直接進目前 canonical editing model。若使用者要把既有 deck 帶入，目前只能人工重建、另轉 JSON/Markdown/PDF 或在外部工具完成。

### 反方 / 為何現在不做

1. **真人優先級 UNKNOWN**：沒有 PPT Studio target user 的 task evidence 證明 existing-PPTX import 是 top friction。
2. **Owner sequencing 已存在**：Product Board 明確先 #1 → #5 → #3；MISSION 要求 P6 未拍板不主動開 task。
3. **現有替代流程存在**：JSON / Markdown / URL / PDF import 已能涵蓋多數「帶入內容」需求；PowerPoint 本身可以保留 exact layout。
4. **#5 尚未證實 canonical structured edit**：先能證明四種 current layout 的 bounded mutation / export receipt，比先擴大 ingest surface 更重要。
5. **Scope creep 風險高**：一旦把「PPTX import」解讀成 arbitrary PowerPoint fidelity，就會滑向 master/theme/SmartArt/animation/OOXML 相容層。

### 最小可結束研究（未立案）

若 owner 或真人 evidence 後續支持，最小實驗應只重用既有 `python-pptx` 與 current slide JSON，不新增 service/database：

- 3–5 個 synthetic fixtures：只覆蓋現有四種 layout + 1 個刻意 unsupported 的 chart/master/shape case；
- 原始 `.pptx` immutable；只產生一次性的 `IMPORT_CANDIDATE`；
- 每頁分類 `SUPPORTED / PARTIAL / UNSUPPORTED`，比較 title/body/bullets/notes/image 的 semantic retention；
- **BUILD**：現有四 layout 能無語意遺失轉入 current model，而且 unsupported 能明確 fail-visible；
- **NARROW**：若完整 slide import 不穩，但 text/theme reference extraction 有價值，只保留 reference/outline import；
- **REJECT**：若修正成本接近人工重建，或會讓使用者誤以為 arbitrary PowerPoint fidelity 已被保證。

不需要 production canary、真實客戶檔、付費 provider、雲端 upload 或新權限；若未實際跑這個 fixture，狀態維持 `NEEDS_RUNTIME_VERIFICATION`。

### Opportunity Score（定性，不用假精確分數）

| Dimension | Assessment | Evidence |
|---|---|---|
| User Pain | UNKNOWN / plausible | repo 確有 handoff gap；無真人頻率／優先級 |
| Strategic Fit | Medium | 相鄰 local editable PPTX handoff；不是既定 P5/P6 scope |
| Novelty | Low–Medium | 市場已有成熟 import / in-place editing；差異化不在「支援 PPTX」本身 |
| Evidence Strength | External high / internal medium | 官方競品證據強；PPT Studio user evidence 缺失 |
| Reuse Potential | High | 已有 python-pptx、current slide JSON、preview/diff、#5 future state model |
| Implementation Effort | UNKNOWN | current-layout parser可能小；arbitrary fidelity 會很大 |
| Security/Privacy/Cost | Low–Medium for local synthetic spike | 本機 fixture 可零 provider 成本；真實檔案 privacy 另需設計 |

**Gate：NEEDS_EVIDENCE / not filed.** 外部市場強不等於本產品需要立即擴 scope。

## Opportunity Map — ppt-studio

| Bucket | Decision | Reason |
|---|---|---|
| MUST MATCH | #1 local/remote trust boundary；#5 bounded native edit + actual render/export evidence | 已核定 owner priority；競品新證據沒有推翻它 |
| SHOULD BE BETTER | 若未來接 existing PPTX，loss 必須 fail-visible，不能 silent flatten/rewrite | Pitch/Gamma 都公開 unsupported boundary；本地工具更應可檢查 |
| DIFFERENTIATOR | local-first candidate + explicit `SUPPORTED/PARTIAL/UNSUPPORTED` + native editable export/read-back | 比「再多一個 AI generator」更貼目前產品方向，但需 #5 先證明 |
| ADJACENT IDEA | existing deck 作 content/style reference；只抽取可安全保留的部分 | 比 full OOXML import 更小，可作 NARROW path |
| DO NOT COPY | Office add-in 平台、enterprise collaboration、完整 OOXML/master/animation/SmartArt editor、cloud connector catalog、silent auto-restyle | scope creep；MISSION/Board 已要求 INVEST / SIMPLIFY |

## Cross-Portfolio Ideas

### 1. Loss-aware artifact conversion

`Source artifact → immutable original → candidate conversion → explicit unsupported set → human promotion`

可移植到 `ppt-studio`、`minideck`、`video-timeline-pipeline` 等會把外部 artifact 轉進自己 canonical model 的產品。這不是新跨-repo framework；每個產品只需在自己的 conversion boundary 明確區分 `PARTIAL/UNSUPPORTED`。既有多個產品已經有 candidate/review primitives，因此本輪不開 umbrella Issue。

### 2. Capability owner owns final fidelity

OpenAI PowerPoint / ONLYOFFICE 的共同訊號是：AI 可以負責 intent、draft、analysis，但最終 native file fidelity 最容易在原生 editor/runtime 中驗證。對 Reese-max 的設計含義是：優先做 inspectable handoff / read-back，而不是每個產品都重造 PowerPoint/Office/NLE/browser capability。

## Ideas Rejected / Deferred

- **直接建立 PPTX import Feature** — REJECT NOW；真人優先級 unknown，且 owner sequencing 已有 #1→#5→#3。
- **把 PPTX import 塞進 #5** — REJECT；#5 fingerprint 是 bounded native mutation/render-export verification，不應因外部新訊號膨脹成 ingestion epic。
- **完整 OOXML / PowerPoint compatibility layer** — DO NOT COPY；維護負擔與北極星不相稱。
- **ChatGPT/Office add-in** — DEFERRED；沒有 distribution evidence，且 local-first 核心不需要先進 Office ecosystem。
- **多使用者 collaboration / marketplace / enterprise connector** — OWNER REJECTED / pending P6 owner decision；本輪沒有新證據推翻。
- **AI import 預設自動 restyle** — DO NOT COPY；Gamma 明確把 Plain Import 與 AI Import 分開，支持 explicit user intent。

## Issue / PR Mapping

| Repo | Existing work | Decision this round | Coordination |
|---|---|---|---|
| `ppt-studio` | #1 Docker/network trust boundary | `SKIPPED_ACTIVE` | open PR #2 `github-1-local-only-compose@830fa552...`；不評論、不搶 scope |
| `ppt-studio` | #5 Structured Slide State + Render Verification | `NO_UPDATE` | comments 已完整讀取；2026-09-14 lock 已 release；無 active #5 PR/branch；新外部 evidence 只支持 adjacent continuity，不改 fingerprint |
| `ppt-studio` | #3 claim/source provenance | `NO_UPDATE` | PPTX existing-deck continuity 不應塞入 provenance scope |
| `ppt-studio` | existing-PPTX continuity candidate | `RESEARCH_LIST_ONLY / NEEDS_EVIDENCE` | open/closed Issues、all-state PR、`pptx` branch search 去重後無同 fingerprint，但 owner scope + user evidence gate 未通過，因此不開單 |

New Issues：**0**。Existing Issues updated：**0**。Issue lock writes：**0**（因本輪沒有 issue mutation）。

## Sources

First-party / official:
- OpenAI Business release notes — 2026-07-06 ChatGPT for PowerPoint GA: https://help.openai.com/en/articles/11391654-chatgpt-team-release-notes
- OpenAI ChatGPT for PowerPoint help — current, crawled 2026-09-15: https://help.openai.com/en/articles/20001242
- Pitch PowerPoint import — current, updated this week; exact update date not exposed: https://help.pitch.com/en/articles/4615453-import-a-presentation
- Pitch import integration / free-plan packaging: https://pitch.com/integrations/ppt-import
- Gamma import help — current, updated this week; exact update date not exposed: https://help.gamma.app/en/articles/11047840-how-can-i-import-slides-or-documents-into-gamma
- ONLYOFFICE DocSpace 3.7 — 2026-06-08: https://www.onlyoffice.com/blog/2026/06/onlyoffice-docspace-3-7

Community signals only:
- https://www.reddit.com/r/powerpoint/comments/1vebpm0/i_spent_a_week_building_a_30slide_deck_with/
- https://www.reddit.com/r/ClaudeAI/comments/1ur4glk/what_i_learned_trying_to_connect_claude_and_canva/
- https://www.reddit.com/r/powerpoint/comments/1v52ezi/i_built_an_opensource_ppt_skill_that_uses_an/

Repository evidence:
- `Reese-max/ppt-studio@6a0dbddf1f81843dea303db49ba7e528d4ef189c`
- `MISSION.md` blob `7b263b649878f2932995fcab251901bf5937fd4f`
- `README.md` blob `b35260f5f0446db2e33d18b07c2dd9dc030b26cd`
- Product Board audit in commit `6a0dbddf1f81843dea303db49ba7e528d4ef189c`
- Issue Quality v2 blob `8167e10798071d2276addaff6b201c6b0e904a2a`

## What Changed Since Last Radar

1. Fair rotation 從 `minideck` 推進到 `ppt-studio`；下一站 `project-doctor-web`。
2. 新增市場觀察：AI presentation workflow 不再只競爭「生成速度」，existing-deck continuity / native-editor continuation 正成為更重要入口。
3. 但沒有因此創建功能工單：PPT Studio 的 owner-approved sequence 與真人證據 gate 比競品功能更重要。
4. 對 #5 的策略沒有改變：先證明四種 existing layout 的 bounded native edit / render-export receipt，再談更廣 ingestion surface。
5. 本輪增加一個明確 NARROW fallback：若未來研究 PPTX input，先測 content/theme reference extraction，不預設 full slide fidelity。

## Calibration / Incomplete / Next Cursor

- `issue_quality_version: 2`；未以競品功能、模型 persona 或高分數自動升級 severity。
- existing-PPTX candidate：`kind=RESEARCH/OPPORTUNITY hypothesis`、`severity=NOT_ESTABLISHED`、`triage=NEEDS_EVIDENCE`、`auto_implementation=false`；**未建立 Issue**。
- 沒有執行 PPTX import fixture、Docker/CI、production deployment、paid provider、真實使用者檔案或 usability study；相關路徑一律 `NEEDS_RUNTIME_VERIFICATION`。
- 沒有把 README、測試檔、競品文案當成 runtime success。
- 本輪不宣告 `ppt-studio` 或 portfolio CLEAN。
- **Next cold-rotation cursor: `project-doctor-web`.**
