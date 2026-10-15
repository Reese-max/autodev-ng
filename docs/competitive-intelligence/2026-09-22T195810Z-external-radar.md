# 外部競品／新品／工作流靈感雷達 — 2026-09-22T19:58:10Z

## Status / scope / evidence boundary

- 狀態：**COMPLETE / MATERIAL_COMPETITOR_STRATEGY_SIGNAL / NO_NEW_ISSUE / USER_NOTIFICATION_WARRANTED**。
- 主要情報來源為 Reese-max GitHub 之外的公開網路；GitHub 僅用於 current product truth、owner scope/direction、Issue/PR 去重、active ownership 與持久化本報告。
- Issue Quality 規則：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`；rules blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- Fresh connected-owner pagination：**42 Reese-max-owned repositories / 41 unarchived**；page 2 為空；`obsidian-vault` 為唯一 archived repo。未以舊 inventory 當全集。
- Fair-rotation focus：`Reese-max/academic-mcp`，承接 `2026-09-22T182603Z-external-radar.md` 的 cursor。
- Focal default branch / current HEAD：`main@c61d6fac1ab697748ac738382665d930d5361255`。最新 product-changing baseline 仍是目前 audit 所引用的 `4eb25de5005d33572095ed566ccf00762011bb50`；本輪沒有觀察到新的 default-branch product-code delta。
- Owner-approved direction 重新核對：**INVEST / SIMPLIFY**。產品是 private、owner-operated、local-first academic research MCP gateway；保留三個 pinned upstream、81 tools + 7 prompts、local papers/indexes、source-specific semantics 與 truthful degraded-provider states。不要變成 public multi-tenant research SaaS、provider-count race、collaborative workspace、billing/growth product 或 opaque synthesis layer。
- Current README 明確說未取得的 API 權限、付費來源、上游未實作能力與 429 不會因整合自動解鎖；下載／本機全文與 bibliographic/source availability 是不同事實。
- Current issue/PR mapping 重新核對：#1/PR #8 canonical identity + ResearchBundle research；#2 with PR #5/#13 admission gate；#3/PR #6 recovery；#4/PR #7 service confinement；#9/PR #10 progressive exposure；#12 publication-status research；#14 OpenAlex false-empty；#15 Crossref false-empty。Active PR scope 未搶改。
- `autodev-ng/main` 寫入前 HEAD：`3f3e431f636181244927a1f737e21b2fb9369b81`。
- 本輪沒有執行 live provider query、付費全文取得、外部寫入、CI trigger、merge/deploy、worker/GOAL、secret/permission/settings 變更，也沒有修改產品 source/config。
- 本雷達不宣告 portfolio CLEAN。

## Executive decision

**0 new Issue、0 existing Issue/PR comment、0 issue update/reopen、0 implementation authorization。**

本輪有一個足以通知 owner 的新市場訊號：**Consensus 在 2026-09-21 宣布與 AAAS 合作，讓 Consensus 可直接 index 並對 Science 系列期刊全文做 AI analysis；這不是單一功能 release，而是再次確認其產品競爭正在從「誰有更多搜尋 UI／assistant host」往「誰取得合法、可追溯的 authoritative full-text access」移動。**

這個訊號不支持 `academic-mcp` 去追 publisher licensing、爬 paywall 或新增付費 provider。相反，它強化一個更小、更符合 owner scope 的產品邊界：

`source identity / provider state`
`→ access entitlement / full-text availability`
`→ local artifact/index state`
`→ evidence receipt`

這些狀態不能因「AI 能分析」就被折成 `full_text_available=true`。Consensus 自己的 help 也明確說，平台可能因 publisher partnership 取得全文做 AI analysis，但 end user 是否能 view/download 原文仍取決於個人或機構訂閱。這正好支持 `academic-mcp #1` 已有的「bibliographic identity 與 full-text availability/index state 分開」方向。

因此最小判斷是：**守住 access/provenance truth，不新增 publisher-integration 專案。**

---

## Product → market category mapping

`academic-mcp` 本輪對照：

1. **Direct academic-AI competitor / content-access strategy**：Consensus — AI-native discovery + publisher-licensed full text + assistant distribution；
2. **Direct research-agent workflow**：Elicit — Agent 與 durable Library/shared collections 共用 evidence context；
3. **Direct academic MCP / evidence access**：Scite — full-text + Smart Citations + institution/holdings-aware access resolution；
4. **Infrastructure providers**：Crossref / OpenAlex / Semantic Scholar — metadata/citation APIs，能力與限流仍需 source-specific truth；
5. **Current product job**：private single-owner research gateway，重點是 pinned upstreams、local custody、exact provider semantics、truthful partial/error state，而非 commercial full-text licensing breadth。

# External Signals

## A. Direct competitor — Consensus × AAAS 把 authoritative paywalled full text 變成 AI-native discovery input

**Status:** `CONFIRMED` first-party。  
**Published:** 2026-09-21。  
**Checked:** 2026-09-22 UTC / 2026-09-23 Asia/Taipei。  
**Sources:**
- https://consensus.app/home/blog/our-partnership-with-aaas/
- https://help.consensus.app/en/articles/10055108-consensus-research-database

Consensus 宣布 AAAS 允許其 index 並對 Science、Science Advances、Science Immunology、Science Robotics、Science Signaling、Science Translational Medicine 等期刊全文做 AI analysis。官方同時聲明這些內容不拿來訓練模型，而是用於 search / analysis，結果仍導回原始文章。

Consensus 目前的 research-database help 進一步列出 Wiley、Taylor & Francis、Sage、ACS、APA、AAAS、De Gruyter Brill 等 publisher partnerships，並說明：平台可以利用 participating articles 的 full text 做分析，但使用者是否能直接查看／下載原文仍取決於 institutional/personal subscription；不是每篇 paper 都有 full-text access。

### User job / reduced manual work

解掉的不是「再多一個搜尋框」，而是：研究者不必只靠 title/abstract 猜 paper 是否相關，再跳到多個 publisher site 手動判讀 methods/results/discussion 後才知道是否值得追。對被授權 corpus，retrieval/analysis 可在 AI workflow 先讀到更深內容，再把研究者導回 primary source。

### Important evidence boundary

AAAS 公告聲稱其內容在 Consensus 上線後的 click-through per search appearance 相較 2025 同期增加超過 2 倍。這只記為 **vendor-reported partnership metric**，不是獨立成效測量、不是 Reese-max ROI，也不拿來升 severity。

### Transferable signal for academic-mcp

可移植的是狀態邊界，而不是授權商業模式：

- `metadata visible` != `full text available to backend`；
- `backend can analyze full text` != `user may download/read full article`；
- `local file exists` != `license permits redistribution`；
- `search returned paper` != `full text indexed locally`；
- access/source/observed-at 必須可追溯，不能用 generic `available` 掩蓋不同權利與資料狀態。

這與 #1/PR #8 已研究的 `PaperIdentity` 與 `full-text availability/index state` 分離高度重疊，因此 **DEDUPE / SKIPPED_ACTIVE_SCOPE**，不留言、不擴 scope。

### What not to copy

- 不建立 publisher licensing program；
- 不抓取或繞過 paywall；
- 不把付費全文複製進 receipt / bundle；
- 不因競品有 licensed corpus 就把 provider breadth 當 KPI；
- 不新增 entitlement DB、institution SSO、subscription resolver 或 commercial content cache；
- 不以 summary/AI preview 取代原文授權狀態。

### Gate result

```yaml
kind: OPPORTUNITY_CONTEXT
severity: NOT_ESTABLISHED
decision_priority: MEDIUM
triage: NEEDS_EVIDENCE
auto_implementation: false
decision: DEDUPE_TO_ISSUE_1 / NO_COMMENT / NO_IMPLEMENTATION
```

## B. Direct workflow recheck — Elicit 的 Research Agent + persistent collections 已是已知 active-scope signal

**Status:** `CONFIRMED / KNOWN SIGNAL / NO DELTA`。  
**Published:** 2026-09-17。  
**Checked:** 2026-09-22 UTC。  
**Source:** https://elicit.com/blog/library-into-resesearch-hub

Elicit 讓 Research Agent 搜尋 personal/shared collections、使用 collection 內容研究、把新 paper 保存回 collection，並讓 Projects link collections 以形成 durable evidence context。

這個方向與 `academic-mcp #1` 的 ResearchBundle / candidate-vs-included / replayable evidence state 已有同 fingerprint；PR #8 是 active research scope。**本輪不因競品再出一次相似證據就留言、加需求、擴成 collaboration/team workspace。**

Decision：`KNOWN / DEDUPE -> #1 / SKIPPED_ACTIVE_SCOPE`。

## C. Direct access-model comparison — Scite 已把 full-text search 與 access resolution 商品化，仍不構成 provider-addition 授權

**Status:** `CONFIRMED current capability; older trigger`。  
**Checked:** 2026-09-22 UTC。  
**Source:** https://scite.ai/blog/introducing-scite-mcp

Scite MCP 對外主打 full-text search、Smart Citations 與 access resolution；官方說明 open-access 內容可直接取得，而 institutional holdings 可透過 LibKey/GetFTR/OpenURL 等方式引導到合法閱讀路徑。

此訊號不是本輪新 release，但和 Consensus × AAAS 形成一致的市場方向：**research AI 的競爭正從「metadata search」往「來源＋授權＋可讀取路徑」延伸。**

對 academic-mcp 的最小產品含意仍是 truthful state：如果某來源只回 metadata，就說 metadata；若 local PDF/index 存在才說 local full text/index；付費來源未授權就是 unavailable/unknown，不用其他 provider 冒充等價全文。

Decision：`BACKGROUND CONFIRMATION / NO ISSUE`。

# New Releases / strategy changes

| Date / status | Product | Change | Consequence for academic-mcp |
|---|---|---|---|
| 2026-09-21 | Consensus × AAAS | Science family full text 可被 Consensus index / AI analyze，結果導回原文 | **Major competitor strategy signal**：licensed authoritative content 是競爭層；不要以 provider count 或 host count追趕，守住 access/provenance truth |
| current | Consensus publisher partnerships | Help 現列 Wiley/T&F/Sage/ACS/APA/AAAS/De Gruyter Brill；backend full-text analysis 不代表 user download entitlement | 強化「backend access、user entitlement、local artifact」分離；dedupe #1 |
| 2026-09-17 | Elicit | Agent 可直接以 Library/shared collections 為 persistent evidence context 並保存新 papers | 已知 #1/PR #8 訊號；不擴成 team SaaS |
| current | Scite MCP | full-text + Smart Citations + entitlement/access resolution | 背景確認；不新增 commercial access layer |

# Community Pain

本輪沒有把論壇／社群 anecdote 升級成產品證據。新的 AAAS/Consensus 訊號已由 first-party publisher-partnership／product documentation 直接建立，沒有必要用零散社群案例推估普遍發生率或 ROI。

# Adjacent Ideas

## 1. Explicit access-state receipt — only if #1 later reaches BUILD/NARROW

如果 #1 的 bounded research 最後證實 identity/evidence layer 有價值，最小可考慮的是**重用既有資料**做一個 access-state 欄位，而不是新 integration service。例如：

```text
metadata_state = PRESENT | PARTIAL | UNKNOWN
full_text_state = LOCAL_INDEXED | LOCAL_FILE_ONLY | REMOTE_OA | REMOTE_LICENSED_UNKNOWN_TO_USER | UNAVAILABLE | UNKNOWN
access_source = arxiv | provider | local
observed_at = ...
```

名稱只是研究示意，不是 schema approval。重點是：不要讓 `backend knows more` 自動變成 `user can access full text`。

### Research exit

- `REJECT`：現有 81 tools 已能讓 client 清楚分辨 metadata/full text/local index，不需共用狀態；
- `NARROW`：只在 bundle/receipt 內增加 derived state，不改 tool surface；
- `BUILD`：只有 actual owner workflow 顯示會反覆誤判全文／可下載狀態，且 #1 研究正式核定最小 scope，才進一步設計。

現在不新增 Issue，因 #1/PR #8 正在 active scope。

## 2. Publisher-licensed corpus — HOLD/DO NOT COPY

這是商業產品 moat，不是 owner-operated local gateway 的自然延伸。除非 owner 未來明確改變產品方向且有合法授權來源，否則不研究爬付費內容、institution entitlement、publisher contracts 或 commercial content caching。

# Opportunity Map — academic-mcp

## MUST MATCH

- provider failure 與 confirmed absence 分開（#14/#15）；
- metadata / full-text / entitlement / local-index state 不混為單一 `available`；
- source IDs、observed-at、provider-specific semantics 可核對；
- 未取得權限／付費來源不因另一個 provider 或 AI synthesis 被冒充為已取得。

## SHOULD BE BETTER

- 對 owner-controlled local content，能清楚說明「哪篇、哪個來源、何時取得、是否本機有檔／索引、目前 source health 如何」；
- 讓 degraded provider state 和 access state 都可被 host-independent receipt 重播／檢查；
- 不需要比 hosted competitor 有更多 UI，而要比它更少 ambiguity。

## DIFFERENTIATOR

- private/local custody；
- pinned upstream revisions；
- exact heterogeneous tool semantics；
- truthful `PARTIAL / RATE_LIMITED / ERROR / UNKNOWN`；
- local full-text/index 可與 bibliographic identity 分離，而非 opaque hosted corpus。

## ADJACENT IDEA

- 只有 #1 bounded research 成立時，再考慮在 evidence receipt 中明示 access state；不先建 entitlement service。

## DO NOT COPY

- publisher licensing/business-development program；
- paywall scraping/bypass；
- multi-tenant institution entitlement；
- public research SaaS / billing；
- commercial full-text mirror；
- opaque「AI 有讀到，所以使用者有權看」語意；
- 為了追競品把 81-tool gateway 擴成 provider-count race。

# Four-gate decisions

## Candidate 1 — publisher-licensed/full-text provider expansion

1. **Problem/value:** Consensus 證明合法 full-text licensing 能改善 search/analysis depth，但沒有 current owner breakpoint 顯示 academic-mcp 需要 commercial paywalled corpus；repo 方向反而明確保持 private/local 並不自動解鎖未授權來源。
2. **Priority:** `OPPORTUNITY_CONTEXT / severity=NOT_ESTABLISHED / decision_priority=LOW_MEDIUM`。競品能力不是本產品缺陷。
3. **Smallest solution:** **do nothing**。若 owner 某天真的有一個已合法授權來源與重複 copy/import 摩擦，先研究單一來源、單一 paper 的合法 read path；不要先建 publisher framework。
4. **Research/implementation separation:** 不立案、不授權。任何 publisher/access integration 都需要獨立 owner scope + legal entitlement evidence。

Decision：`REJECT CURRENT IMPLEMENTATION`。

## Candidate 2 — explicit access-state in evidence bundle

1. **Problem/value:** Consensus help 明確證明 backend full-text analysis 與 end-user view/download entitlement 可以不同；這是容易被 generic `available` 混淆的真實市場語義。但 current academic-mcp 尚無實際 owner incident。
2. **Priority:** `RESEARCH SIGNAL / severity=NOT_ESTABLISHED / decision_priority=MEDIUM`。
3. **Smallest solution:** 若 #1 未來進一步，優先由 existing source/local data derive state 並放 receipt；不建 entitlement DB/API。
4. **Research/implementation separation:** **DEDUPE -> #1 / PR #8 active / SKIPPED_ACTIVE_SCOPE**。

Decision：`NO COMMENT / NO NEW ISSUE`。

## Candidate 3 — collaboration/shared evidence workspace

1. **Problem/value:** Elicit 顯示 persistent shared collections 是 direct competitor strategy，但 academic-mcp 是 single-owner private gateway，沒有 team collaboration user evidence。
2. **Priority:** `NOT_ESTABLISHED / LOW`。
3. **Smallest solution:** none；existing local ResearchBundle research already captures durable state without team layer。
4. **Decision:** `DO NOT COPY`。

# Cross-portfolio ideas

保留一個可移植、但**不建 framework** 的概念：

`Resource identity → source observation → access/entitlement state → local artifact state → evidence receipt`

這可能日後適用於法律文件、影片、雲端檔案等 evidence-heavy products，但每個 domain 的 entitlement／rights 狀態都不同；academic publisher access logic 不能直接泛化成跨 portfolio authorization system。

# Rejected Ideas / reasons

1. **新增 AAAS/Science provider — REJECT。** 沒有合法 API/licensing entitlement，也沒有 owner core-flow evidence；競品合作不構成本 repo 權限。
2. **建立 publisher connector registry — REJECT。** 沒有實際 provider 需求，會把 local gateway膨脹成 commercial content platform。
3. **把 Consensus 可 AI analysis 視為「使用者可以下載全文」— REJECT。** 官方 help 明確區分 backend full-text access 與 user subscription/view-download entitlement。
4. **更新 #1 加入一批 publisher/access schema — SKIPPED_ACTIVE_SCOPE。** #1/PR #8 已有 identity + full-text availability/index separation，新的證據留 central report 即可。
5. **因 Elicit shared collections 建 collaboration Issue — REJECT。** owner direction是 single-owner private gateway；沒有 collaboration job evidence。
6. **增加新 provider 只為縮小與 Consensus/Scite 的 corpus breadth 差距 — REJECT。** Provider count 不是 owner-approved success metric。
7. **把 AAAS vendor-reported click-through lift 當 ROI/完成率證據 — REJECT。** 只做 product-strategy signal。

# Issue Mapping

- New Issues: **0**。
- Existing Issue comments/edits: **0**。
- PR comments/edits: **0**。
- Implementation authorizations: **0**。
- Locks acquired: **0**（no Issue/shared-state mutation）。
- Relevant current scopes remain #1/#2/#3/#4/#9/#12/#14/#15；active PRs remain #5/#6/#7/#8/#10/#13。
- New AAAS evidence maps to #1 conceptually, but active PR #8 means **SKIPPED_ACTIVE_SCOPE**; central report only。

# Sources

Primary public-web sources checked this round:

1. Consensus × AAAS, **Announcing Our Partnership with AAAS**, published 2026-09-21 — https://consensus.app/home/blog/our-partnership-with-aaas/
2. Consensus Help, **Consensus Research Database**, current page checked 2026-09-22 — https://help.consensus.app/en/articles/10055108-consensus-research-database
3. Elicit, **Turn your Elicit Library into a shared research hub**, published 2026-09-17 — https://elicit.com/blog/library-into-resesearch-hub
4. Scite, **Introducing Scite MCP**, published 2026-02-26, current capability rechecked 2026-09-22 — https://scite.ai/blog/introducing-scite-mcp
5. Consensus × Taylor & Francis, published 2026-05-15, background on publisher strategy — https://consensus.app/home/blog/announcing-our-partnership-with-taylor-francis/
6. Consensus × De Gruyter Brill, published 2026-08-05, background on publisher strategy — https://framer.consensus.app/home/blog/announcing-our-partnership-with-de-gruyter-brill/

GitHub evidence used only for product truth/dedup:
- `Reese-max/academic-mcp@c61d6fac1ab697748ac738382665d930d5361255`
- README current contract / 81 tools + 7 prompts / paid-source boundary
- Issues #1/#2/#3/#4/#9/#12/#14/#15 and PRs #5/#6/#7/#8/#10/#13
- Product Board Delta `docs/portfolio-audit/2026-09-19T1102Z-product-board-delta.md`
- Previous academic radar `2026-09-21T035919Z-external-radar.md`

# What Changed

Compared with the prior academic-mcp radar on 2026-09-21:

1. **NEW:** Consensus/AAAS partnership announced 2026-09-21, adding Science-family authoritative full-text indexing/AI analysis to an already growing publisher-partnership strategy.
2. **NEW CALIBRATION:** Market differentiation is no longer only “assistant-native evidence layer”; direct competitors are also acquiring lawful corpus-depth advantages. This is a commercial access moat, not proof Reese-max should add providers.
3. **NO ROADMAP CHANGE:** owner direction remains INVEST/SIMPLIFY around source truth, reliability, provenance and local custody.
4. **NO NEW ISSUE:** the only transferable product implication—separating identity/access/full-text/local-index state—already sits inside #1/PR #8 research and is active; no duplicate or scope expansion.
5. **NO SEVERITY CHANGE:** no new runtime incident, provider outage or owner task failure was observed; #14/#15 remain the existing P2 source-truth bugs.

# Completion / gaps / cursor

- External web: **completed** for current direct/adjacent academic-research products and publisher-access strategy; key claims were checked against first-party sources.
- Fresh owner inventory: **42 owned / 41 unarchived**; full pagination completed。
- Rules reread: **completed**; blob SHA recorded。
- Current repo HEAD / owner direction / README / Issues / all-state PRs / previous radar: **rechecked**。
- New Issue dedupe: **completed**; no new fingerprint passed all four gates。
- Runtime executions claimed: **0**。
- Product writes: **0**。
- Issue/PR writes: **0**。
- Report write: this unique report only。
- Gaps: no real owner query demonstrating paywalled-content friction; no legal/licensing entitlement for commercial publisher corpus; no live provider query; no user telemetry; Consensus click-through result is vendor-reported; current first-party docs do not prove independent research-quality improvement。
- Notification threshold: **met** because a direct competitor announced a material publisher-content strategy expansion (AAAS/Science full-text AI analysis) after the previous academic-mcp radar. Notification should focus on scope impact and smallest next step, not feature count。
- Next fair-rotation target：**`Reese-max/spotify-playlist-organizer-mcp`**。
