# 外部競品／新品／工作流靈感雷達 — 2026-09-14T20:00:41Z

> 查閱日：2026-09-15（Asia/Taipei）；檔名與本輪 run 時間使用 UTC。
>
> Issue Quality：`issue_quality_version: 2`；本輪讀取 `docs/portfolio-audit/2026-09-14-issue-quality-v2.md` blob `8167e10798071d2276addaff6b201c6b0e904a2a`。
>
> Evidence labels：`CONFIRMED`＝第一方官方資料或可直接檢查的 repository truth；`LIKELY`＝有支持但仍需 runtime／真人證據；`COMMUNITY_SIGNAL`＝個別社群經驗；`UNKNOWN`＝資料不足。
>
> 本輪沒有修改產品原始碼、CI/config、secret、權限或 repository settings；沒有建立實作 branch、merge、deploy、啟動 worker/run 或新 GOAL；沒有付費試用或變更正式資料。

## Executive Summary

本輪從上一輪 cold-rotation cursor `minideck` 深讀。重新列舉 connected GitHub owner listing，仍為 42 個 Reese-max owned repositories，其中 3 個 archived、39 個 owned + unarchived；沿用已重新校準的產品範圍：36 個 product-like + 3 個 support/compatibility-only（`adng-memory`、`internship-notes-sites-mirror`、`police-exam-practice`）。沒有操作他人 repo。

這一輪找到的市場訊號很清楚，但**不通過新增 Issue gate**：近期簡報產品正在把「來源資料直接進 deck」、「只改被點名的 slide/object」、「從既有 AI 助手／CRM／call notes 直接建立簡報」變成標準工作流；然而 `minideck` 的 open draft PR #1 已經同時實作 source objects / claim-to-source mapping、MCP、以及限制在 `changedSlides` 的 slideSpec patch。換句話說，外部訊號主要是在驗證一條**已存在的 active implementation scope**，不是新的未覆蓋產品缺口。

同時，current default branch 仍有兩個更高優先且已知的可信度問題：#4/#5 的 draft/publication boundary，以及 #6 的 CI execution validation gap。Product Board 也已明確決定 `INVEST / SIMPLIFY`，要求先完成 publication lifecycle，而不是增加更多 generator、collaboration 或 sharing analytics。因此本輪結果是 **0 新 Issue、0 existing Issue scope rewrite**；PR #1 相關機會標記 `SKIPPED_LOCKED`，只保留中央 radar 證據。

下一個 cold-rotation cursor：`ppt-studio`（跳過 support-only `police-exam-practice`）。

## Scope / Repository Truth

### Portfolio enumeration

- Connected owner listing：42 repositories。
- Archived：`gemini-deidentifier`、`obsidian-vault`、`openab`。
- Owned + unarchived：39。
- Current scope calibration：36 product-like + 3 support/compatibility-only。
- 本輪 deep product：`minideck`。

### minideck current truth

Current default branch：`main@31f7131ae24af9d89287000e8048750e598686a1`。

Recent default-branch product state：
- 2026-09-12 HEAD 是 audit/documentation commit；
- 2026-09-07 `d3026875d9ef0f0010137639e789359463139a89` 修正歷史 deck version 的匿名讀取；
- Product Board 2026-09-12：**INVEST / SIMPLIFY**；核心價值是 prompt → shareable HTML 的低負擔流程，先修明確 publish/unpublish 邊界，不增加產品廣度。

Current default-branch behavior relevant to this radar：
- `generate` 已接受 optional `sourceData: string`，最多 3000 字；prompt 明確把來源當資料而非指令，觀眾可見數字若不在來源中就標「待補數據」。
- UI 仍要求使用者把參考資料貼入單一 textarea；不是 file/link/source-object workflow。
- `revise` 讀取整份 current HTML，將完整 HTML + instruction 丟給 model，要求輸出完整新版 HTML；因此 main branch 的 editing granularity 仍是 whole-deck regeneration。
- #4/#5：匿名 `/p/:id` 追隨 `current_version`，draft/public head 尚未分離。
- #6：recent CI records 曾在 runner/steps 前失敗，最新自動 gate 仍需真實執行證據。

### Active work / coordination

Open draft PR #1 `feat(presentation): add v2 MCP and Dashi runner`：
- head `feature/presentation-studio-mcp-v2@0cb4ebc32fd4b75f2470f92854c6ceed79f0103e`；
- 44 changed files；
- MCP `create_presentation` 接受 ChatGPT-first slideSpec、inline/base64 source content、claim-to-source mappings；source objects 存 R2；
- revision planner 僅允許 existing slide IDs、`changedSlides`、受限欄位與 verified non-sensitive claim IDs，並提示模型做 smallest targeted change；未選 slide 保持原 spec；
- production 未部署。

因此本輪凡屬 `source ingestion / claim mapping / MCP authoring / slide-scoped revision` 的候選，均與 active PR #1 同 scope，依跨排程規則 **SKIPPED_LOCKED**。沒有評論或改寫 PR #1。

## External Signals

### A. Direct competitor — Beautiful.ai 把 source context 變成 first-class onboarding

**CONFIRMED；官方 help updated 2026-08-03；查閱 2026-09-15**

Sources:
- https://support.beautiful.ai/hc/en-us/articles/12885226948109-Creating-a-presentation-with-AI
- https://www.beautiful.ai/planpricing
- https://support.beautiful.ai/hc/en-us/articles/30629528652685-Exporting-your-slides-and-presentations

Current workflow：Create with AI 從 prompt-first 開始，但可直接用 `+` 加 documents、PDFs 或 links 作 supporting context；官方把這描述成從 idea、outline、pre-written content 都能起步。

**JTBD / manual step removed**：使用者已經有 memo/PDF/link 時，不必先人工摘要、截取再貼成 prompt；source context 能直接進 creation flow。

**Onboarding / distribution pattern**：先收意圖與來源，再產生 deck；不是把使用者直接丟進空白 editor。

**Business-model signal（當輪查證）**：Pro 目前 US$12/月（年繳）、Team US$40/user/月（年繳；月繳 US$50）；context from files/links 是 Pro feature surface。Editable PowerPoint/Google Slides export 只在 Pro/Team/Enterprise；官方也明示外部平台不支援其 transition/animation，export 會失去這些能力。價格只當 packaging 訊號，不推算 Reese-max WTP。

**Limit / what not to copy**：不要因此在 current MiniDeck main 新建 file-upload system；PR #1 已有 source objects，而且 publication #4 與 CI #6 更優先。真正可移植的是「來源不必先被人類重新整理成一段 prompt」；該方向已在 active PR 中。

### B. Adjacent workflow — Claude Design 將 design system 當一次性 onboarding，再做細粒度修改與多格式 handoff

**CONFIRMED；產品 2026-04-17，近期官方實作 webinar 2026-09-03；查閱 2026-09-15**

Sources:
- https://www.anthropic.com/news/claude-design-anthropic-labs
- https://www.anthropic.com/webinars/getting-started-with-claude-design

2026-09-03 webinar 的近期 onboarding 訊號是「先匯入 design system」，之後 deck/doc/graphic 都沿用品牌；從 brief 到 final 可 export PowerPoint、Google Slides 或 handoff 到其他工具。原產品支援 inline comments、direct text edits、spacing/color/layout controls，而不是每次從頭 regenerate。

**JTBD / manual step removed**：團隊不用每份 deck 重新描述 fonts/colors/components；使用者也不需為一個局部修改重跑整份 artifact。

**Transferable principle**：`persistent design constraints → targeted artifact patch → export/handoff`。這與 MiniDeck 的低負擔定位相容，但 current owner decision 不支持現在新增 team design-system SaaS。

**Why not copy**：organization collaboration、多 design systems、prototype→code handoff 是較大 platform scope；本輪沒有真人／repo evidence 證明 MiniDeck 的主要摩擦是品牌管理。最小可用原則已可由 existing style presets + PR #1 slide-scoped patch 承接。

### C. New tool/workflow — Pitch MCP/API 將 deck creation 移到 AI assistant / workflow surface

**CONFIRMED；Pitch product roundup 2026-08-12；查閱 2026-09-15**

Sources:
- https://pitch.com/whats-new/introducing-pitch-mcp-and-api
- https://help.pitch.com/en/articles/15888133-connect-claude-with-pitch
- https://help.pitch.com/en/articles/16446558-connect-pitch-with-chatgpt

Pitch 現在讓 Claude 從 call notes / CRM records 建 deck，也可從自己的 workflow 觸發 deck delivery；Agent 還能 edit current slide。Claude connector 使用 MCP + OAuth；ChatGPT 也有對應連接流程。

**JTBD / manual step removed**：使用者不用先把 CRM/call context 複製到 presentation app、再建立 deck；authoring surface 可以留在原來的 AI assistant。

**New product possibility**：MiniDeck 的 canonical artifact / render / publish 能力可成為 AI 助手後面的 narrow presentation service，而不必把所有上下文與 workflow UI 都複製進 MiniDeck。

**Coordination decision**：這個方向與 open draft PR #1 的 remote MCP + OAuth + runner 高度重疊，因此 **SKIPPED_LOCKED**；沒有新 Issue、沒有 PR comment、沒有 scope expansion。

### C2. Ecosystem readiness signal — MCP 的 enterprise auth/governance 已進入主流工具教育

**CONFIRMED；Microsoft MCP Live 2026-09-09；查閱 2026-09-15**

Source:
- https://developer.microsoft.com/en-us/reactor/events/27448/

Microsoft 2026-09-09 的 MCP Live 內容已把 authorization、governance、security、event-driven agents 與 MCP Apps 放在同一場企業導向活動中。它支持「MCP 已不只是 demo transport」的市場判斷，但**不構成 MiniDeck 新需求**。PR #1 已有 OAuth/PKCE、private runner token、bounded job payload；本輪不再建另一套 MCP/security framework。

## New Releases

- **2026-08-03 — Beautiful.ai AI creation help refresh**：supporting docs/PDFs/links 成為 Create with AI 的明確入口。
- **2026-08-12 — Pitch MCP/API**：Claude/AI workflow 可從 call notes/CRM context 建 deck並觸發 delivery。
- **2026-09-03 — Anthropic Claude Design webinar**：近期 onboarding 教育強調一次匯入 design system、brief→final export 的完整流程。
- **2026-09-09 — Microsoft MCP Live**：MCP enterprise readiness 聚焦 auth/governance/security。

## Community Pain

所有以下均為 **COMMUNITY_SIGNAL**，不可當發生率或 benchmark：

- 2026-08-11 Reddit 小型顧問使用者描述：AI deck 初稿可很快，但交付 editable PPTX 時仍可能因 master/text box flattening 造成大量重工。
  Source: https://www.reddit.com/r/AI_Agents/comments/1vlh7c0/half_a_year_with_ai_slide_tools_and_i_keep_coming/
- 2026-08-19 Reddit 使用者描述：第一版看起來不錯，但移動內容、收 feedback、交給別人編輯時，常又回到 PowerPoint 重做。
  Source: https://www.reddit.com/r/TopAutomationTools/comments/1vshma7/anyone_using_ai_to_make_decks_that_you_can_still/
- 2026-08-04 一則明顯偏產品推廣語氣的 Reddit 貼文抱怨多數 AI deck generic / weird formatting / hard to edit；因宣傳色彩明顯，只作低權重 hypothesis，不支持產品決策。
  Source: https://www.reddit.com/r/AIToolsAndTips/comments/1vf3mi7/finally_found_an_ai_presentation_maker_that/

可用 regression hypothesis：衡量「生成後還要改多少」與「export 後還要重做多少」，但本輪沒有真人 MiniDeck 使用資料，所以不建立 success-rate claim。

## Opportunity Map — minideck

| Bucket | Decision | Evidence / reasoning |
|---|---|---|
| MUST MATCH | draft/publication boundary + actual CI/runtime evidence | existing #4/#5/#6；Product Board 已核定，先於新增市場功能 |
| SHOULD BE BETTER | 來源資料進 deck 時保持 claim/source 邊界；局部修訂不得無關漂移 | current main 只有 3000-char textarea + whole-HTML revise；PR #1 已在做 source map + changed-slide patch |
| DIFFERENTIATOR | lightweight self-contained HTML + narrow, inspectable AI service | owner north star；不需要追 Canva/Pitch workspace breadth |
| ADJACENT IDEA | design constraints 可重用、revision 用最小 patch、AI assistant 作入口 | Beautiful.ai / Claude Design / Pitch 都支持此 workflow；目前由 style preset + PR #1 承接 |
| DO NOT COPY | Canva/Pitch enterprise collaboration、analytics、多 link、完整 design-system platform、background campaign automation | scope creep；沒有 MiniDeck user evidence，且 #4/#6 更重要 |

### Simplify / reuse order

1. **No-change first**：保持 current product focus，先處理既有 publish/CI trust work。
2. **Reuse**：已有 `sourceData` safety prompt、styles、versions；PR #1 已有 source map / targeted revision / MCP，不重建。
3. **Narrow validation later**：PR #1 若 merge，應驗證 source→claim→slide 與 changedSlides→unchanged-slide stability，而不是另加 competitor feature。
4. **Reject for now**：new file ingestion UI、team brand system、CRM connectors、share analytics、multi-link SaaS。

## Candidate Quality Gate

### Candidate 1 — file/link source ingestion on current MiniDeck

- `kind`: OPPORTUNITY
- `severity`: NOT_ESTABLISHED
- `triage`: DEFERRED / SKIPPED_LOCKED
- `auto_implementation`: false
- Repo friction：main branch 確實要人工 paste `sourceData`，但 active PR #1 已接受 richer source content/source objects。
- Smaller option：等待/驗證 PR #1，而不是另建 upload/link service。
- Counterargument：current 3000-char paste may be sufficient for lightweight target users；沒有 user evidence 顯示 file upload 是 top friction。
- Decision：**NO ISSUE**。

### Candidate 2 — slide/object-scoped revision instead of whole-deck regeneration

- `kind`: OPPORTUNITY / potential reliability improvement
- `severity`: NOT_ESTABLISHED
- `triage`: SKIPPED_LOCKED
- Repo evidence：main `revise` sends full HTML and asks for full HTML output。
- External evidence：Pitch Agent edits current slide；Claude Design/Canva-style structured editing emphasizes local edits。
- Existing smaller solution：PR #1 already constrains patches to `changedSlides` + allowed fields + source claims and says smallest targeted change。
- Decision：**NO ISSUE**；same workflow scope as active PR #1。

### Candidate 3 — MCP / assistant-first presentation authoring

- `kind`: OPPORTUNITY
- `severity`: NOT_ESTABLISHED
- `triage`: SKIPPED_LOCKED
- External evidence：Pitch MCP/API 2026-08-12；MCP Live 2026-09-09。
- Existing repo evidence：PR #1 already builds stateless remote MCP + OAuth/PKCE + bounded runner jobs。
- Decision：**NO ISSUE**；no duplicate.

## Cross-Portfolio Ideas

本輪只保留兩個有證據、但不需新 umbrella framework 的原則：

1. **Artifact generation → targeted mutation**：對 HTML deck、slide spec、document artifact，生成後的價值越來越取決於「局部修改而不破壞其他區域」。`ppt-studio`、`video-timeline-pipeline` 等已有各自 typed/structured primitives；不另開跨 repo framework。
2. **Assistant as distribution surface, product as canonical artifact owner**：Pitch MCP、Claude Design 等都把 AI assistant 當入口，把 canonical artifact/editor/export 留在 domain product。適用於多個 Reese-max MCP/product，但已有多項產品採此方向，不重開 general issue。

## Ideas Rejected / Deferred

- **Build a Beautiful.ai-style file/link importer now** — REJECT NOW：active PR #1 already covers richer source objects；沒有證據需要第二套。
- **Build a Canva-like design-system/team workspace** — REJECT：與 MiniDeck `INVEST / SIMPLIFY` north star 相衝突；maintenance/auth/collaboration burden 高。
- **Add viewer analytics/passcodes/multiple public links** — REJECT：Product Board 已列 DO NOT COPY；publication trust 還沒解。
- **Add every CRM/Slack/Drive connector** — REJECT：Pitch 的 distribution pattern值得吸收，但 MiniDeck 應保持 narrow service；MCP 能把 integration 留在外部 assistant/tool layer。
- **Create a generic MCP governance framework** — REJECT：PR #1 already contains OAuth/PKCE/private runner boundary；沒有 root cause 需要新 framework。

## Issue Mapping / Coordination

| Repo | Existing work | This run |
|---|---|---|
| `Reese-max/minideck` | #4/#5 publication boundary | no update；沒有新的外部證據改變 root cause / scope |
| `Reese-max/minideck` | #6 CI execution validation gap | no update；external research unrelated |
| `Reese-max/minideck` | PR #1 MCP/Dashi/source map/slide-scoped revision | `SKIPPED_LOCKED` for overlapping market opportunities；no comment/write |

New Issues：**0**。
Existing Issues updated：**0**。
Issue write blocked：**0**。
Runtime verification performed by this radar：**0**。

## Classification / Scope Calibration

- Issue Quality v2 remains the governing rule. External competitor parity is not a P1/P2 finding.
- Main-branch whole-HTML revise is a source-confirmed behavior, but there is no executed reproduction showing a supported user task failing because of unrelated-content drift；therefore this radar does not relabel it BUG/P2.
- Open draft PR #1 materially changes the likely future architecture, so an external radar must not create parallel source-ingestion/MCP/revision work while that branch exists.
- Existing #4/#5 share the publication-boundary fingerprint; this run does not mass-close or rewrite historical issues because no new external evidence requires it and Product Board already has a clear priority.
- No portfolio CLEAN claim is made.

## What Changed Since Last Radar

Compared with `2026-09-14T180112Z-external-radar.md`：

- cold rotation advanced `voice-actress` → `minideck`；
- new direct competitor evidence: Beautiful.ai 2026-08-03 source-context onboarding and current pricing/export packaging；
- new workflow evidence for this product: Pitch 2026-08-12 MCP/API + current Claude/ChatGPT connection docs；
- recent adjacent onboarding evidence: Anthropic 2026-09-03 Claude Design webinar；
- key calibration: the strongest external opportunities are already covered by active draft PR #1, so **zero new Issue** is the correct Issue Quality v2 outcome；
- no previous owner direction was overturned；MiniDeck remains `INVEST / SIMPLIFY`, with publication trust before feature breadth。

## Sources

### GitHub / repository truth
- https://github.com/Reese-max/autodev-ng/blob/main/docs/portfolio-audit/2026-09-14-issue-quality-v2.md
- https://github.com/Reese-max/minideck/blob/main/README.md
- https://github.com/Reese-max/minideck/blob/main/.github/quality-audits/2026-09-12-1010-product-board-audit.md
- https://github.com/Reese-max/minideck/blob/main/docs/audits/50-persona-round-4-2026-09-12.md
- https://github.com/Reese-max/minideck/issues/4
- https://github.com/Reese-max/minideck/issues/5
- https://github.com/Reese-max/minideck/issues/6
- https://github.com/Reese-max/minideck/pull/1

### Public web — first party
- Beautiful.ai Create with AI, updated 2026-08-03: https://support.beautiful.ai/hc/en-us/articles/12885226948109-Creating-a-presentation-with-AI
- Beautiful.ai current pricing, accessed 2026-09-15: https://www.beautiful.ai/planpricing
- Beautiful.ai export, updated 2026-08-03: https://support.beautiful.ai/hc/en-us/articles/30629528652685-Exporting-your-slides-and-presentations
- Pitch MCP/API, 2026-08-12: https://pitch.com/whats-new/introducing-pitch-mcp-and-api
- Pitch Claude connection, accessed 2026-09-15: https://help.pitch.com/en/articles/15888133-connect-claude-with-pitch
- Pitch ChatGPT connection, accessed 2026-09-15: https://help.pitch.com/en/articles/16446558-connect-pitch-with-chatgpt
- Claude Design launch, 2026-04-17: https://www.anthropic.com/news/claude-design-anthropic-labs
- Claude Design webinar, 2026-09-03: https://www.anthropic.com/webinars/getting-started-with-claude-design
- Microsoft MCP Live, 2026-09-09: https://developer.microsoft.com/en-us/reactor/events/27448/

### Community / anecdotal only
- https://www.reddit.com/r/AI_Agents/comments/1vlh7c0/half_a_year_with_ai_slide_tools_and_i_keep_coming/
- https://www.reddit.com/r/TopAutomationTools/comments/1vshma7/anyone_using_ai_to_make_decks_that_you_can_still/
- https://www.reddit.com/r/AIToolsAndTips/comments/1vf3mi7/finally_found_an_ai_presentation_maker_that/

## Incomplete / Next Cursor

- 未做 production Worker/D1/R2/browser runtime；所有未執行路徑維持 `NEEDS_RUNTIME_VERIFICATION`。
- 未訪談 MiniDeck 真人使用者；source upload、targeted revision、editable export 的真實優先順序仍為 `UNKNOWN`。
- PR #1 production 未部署；本報告只把其 open code/PR contract 視為協調證據，不視為已交付產品能力。
- 下一個 cold-rotation cursor：`ppt-studio`。
