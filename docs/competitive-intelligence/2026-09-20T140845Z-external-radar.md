# External Competitive Radar — 2026-09-20T14:08:45Z

Status: **COMPLETE / NO_NEW_ISSUE**

查閱日：2026-09-20。主要市場情報來自 GitHub 之外的 Unpaywall/OpenAlex、Elicit、Consensus、Scite、Zotero 第一方公開資料；GitHub 僅用於 Reese-max 自有 repository inventory、owner 方向、default-branch 現況、Issue/PR 去重、repo source evidence 與本中央報告寫入。

## Scope / Direction Check

- Governing rule：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Rules blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`
- Fresh connected owner inventory：完整列舉 **42 個 Reese-max-owned repositories / 41 個未封存**；offset 100 再查為空。唯一 archived repo 為 `obsidian-vault`。
- Fair-rotation focal repository：`Reese-max/academic-mcp`，承接 `2026-09-20T120234Z-external-radar.md` 的 cursor。
- Current default HEAD：`main@c61d6fac1ab697748ac738382665d930d5361255`；latest product-changing baseline 仍為 `4eb25de5005d33572095ed566ccf00762011bb50`，後續 default-branch commits 為 audit/docs。
- Owner direction rechecked from Product Board：**INVEST / SIMPLIFY**。核心產品是 private、single-owner、local-first academic research MCP gateway；保留 pinned arXiv / paper-search / Semantic Scholar 的 81 tools + 7 prompts、local papers/indexes、source-specific semantics 與 truthful degraded-provider state。現階段優先 recovery、host-independent admission、least-privilege、source truth；不以 provider breadth、public multi-tenant SaaS、native mobile、collaboration workspace、billing 或 opaque AI synthesis 為下一步。
- Existing active scopes：#1 / PR #8 ResearchBundle；#2 / PR #5 + #13 verification gate；#3 / PR #6 recovery/cold-start；#4 / PR #7 systemd confinement；#9 / PR #10 progressive tool exposure；#12 publication-status research；#14 OpenAlex false-empty；#15 Crossref false-empty。沒有搶改任何 active PR scope。
- 本輪未修改產品原始碼、vendored upstream、CI/config、secrets、permissions/settings；未建 implementation branch、未 merge/deploy、未啟動 worker/GOAL、未付費、未執行正式外部寫入。

## Product → Market Category

`academic-mcp` 目前屬於：

1. 私人/self-hosted scholarly MCP aggregation gateway；
2. heterogeneous scholarly-source capability preservation，而非單一 opaque research agent；
3. local paper/full-text/index workflow；
4. evidence/source-state truthful gateway，必須能區分 empty、provider failure、rate limit、partial、unknown；
5. differentiation 應落在 private/local persistence、inspectable upstream parity、bounded source truth/recovery，而非「也能在 ChatGPT 搜論文」。

## External Signals

### A. CONFIRMED — Unpaywall 於 2026-09-18 正式退役 title/article search，但 DOI lookup 明確保留

Sources（updated / checked 2026-09-18～20）：
- https://data.unpaywall.org/products/api
- https://help.openalex.org/access/unpaywall-and-openalex/
- https://unpaywall.org/articles

Unpaywall 第一方 API 文件現在明確標示：

- `GET /v2/search?query=...` 已於 **2026-09-18**退役，現在回 `410 Gone`；一般 paper search 應改用 OpenAlex。
- `GET /v2/{doi}` 的 DOI lookup **沒有退役**，仍是 Unpaywall 的穩定核心介面。
- 官方明確說 Unpaywall 本身不會被退役；DOI lookup、Simple Query Tool、browser extension、Data Feed 繼續存在。

**對 repo 的直接核對：** current pinned `vendor/paper/.../unpaywall.py` 並沒有呼叫已退役的 `/v2/search?query=`。它是 DOI-centric adapter：從 query 擷取 DOI，實際只呼叫 `https://api.unpaywall.org/v2/{doi}?email=...`，也明確把 `UnpaywallSearcher.search()` 描述為 DOI lookup、最多回一筆。

**結論：** 這個最新 provider 變更看起來很像 breaking change，但對 current `academic-mcp` 支援路徑是**反方證據**：目前沒有 Unpaywall migration bug，也不應因為看到「Unpaywall search retired」就新開 migration Issue、改成 OpenAlex-only、或移除現有 DOI OA resolver。

Opportunity-map effect：`MUST MATCH / DO NOT OVERREACT`。

### A2. CONFIRMED — Unpaywall/OpenAlex 現在把產品邊界講得更清楚：DOI OA resolution vs general discovery

同一套第一方文件將分工明確化：

- Unpaywall：DOI → OA status / best OA location；
- OpenAlex：一般 search、authors、institutions、citations、topics、broader discovery。

這和 current repo 的 provider 分工方向一致：Unpaywall adapter 已是 DOI-centric；OpenAlex 有獨立 search adapter。適合移植的是**保持 provider job 語義清楚**，不是做一個會在背景替換來源的 generic scholarly router。

這也形成對 #14 的邊界校準：OpenAlex 的 request/error truth 要修的是 OpenAlex adapter 本身；不應把 Unpaywall DOI resolver 一起重寫成同一套大 migration framework。

### B. CONFIRMED / DEDUPED — Elicit 的「agent + bounded evidence collection」已在 2026-09-17 進一步產品化

Source：
- https://elicit.com/blog/library-into-resesearch-hub

Elicit Research Agent 現在可以從 personal/shared collections 搜尋、將新 paper 存回 collection，且 Project 可以連結 collection 來限定「這個工作真正重要的 evidence」。這個訊號在 2026-09-17 academic-mcp radar 已經記錄並去重到 #1：ResearchBundle 應把 candidate/included evidence set 做成明確、可回訪的 project context，而不是依賴聊天記憶。

本輪沒有新的 repo evidence 推翻該判斷，也沒有理由把 shared team collections / multiplayer 引入 single-owner product。`#1 / PR #8` 已是 active scope，因此本輪只保留 dedupe，不留言、不擴 scope。

### B2. CONFIRMED / DEDUPED — Consensus 持續把 research source 嵌入現有工作面

Sources：
- https://help.consensus.app/en/articles/11954907-consensus-product-changelog
- https://consensus.app/home/blog/consensus-everywhere/

Consensus 在 2026-08-26 開放 self-serve API，2026-09-15 進 Microsoft 365 Copilot，並已在 ChatGPT / Claude 等 assistant surface 分發。這個方向在前輪 academic-mcp radar 已核對：**「在 AI assistant 裡可用 academic search」正在變成 table stakes**。

對本產品的結果不是再做另一個 connector catalog，而是把 private/local persistence、source parity、truthful source state、recovery receipt 做得更可靠。這與 Product Board 的 INVEST/SIMPLIFY 一致，沒有新 Issue。

### C. CONFIRMED / DEDUPED — Scite citation traversal 仍支持「evidence graph 可沿 source 展開」，但不是新 graph 需求

Source：
- https://scite.ai/blog/citation-surfing-scite-mcp

Scite 於 2026-09-09 加入 MCP `citation_graph`，讓 agent 能沿 references/citing papers 前後 traversal。`academic-mcp` 已有 Semantic Scholar citation-related tools；歷史 radar 已把可用訊號放進 #1 的 source-observation / research-bundle 脈絡。沒有證據支持另造 citation graph、classifier 或 licensed corpus。

## New Releases / Provider Changes

| Date | Product / provider | Change | Confidence | Current consequence |
|---|---|---|---|---|
| 2026-09-18 | Unpaywall | `/v2/search?query=` 正式退役，410；DOI `/v2/{doi}` 保留 | CONFIRMED | current adapter 不受影響；拒絕 migration Issue |
| 2026-09-18 | OpenAlex / Unpaywall docs | 明確把 DOI OA lookup 與 general discovery 分工 | CONFIRMED | 支持 provider-specific job semantics；不做 generic fallback router |
| 2026-09-17 | Elicit | Research Agent 可讀寫 Library collections，Project 可連 collection | CONFIRMED / previously covered | 去重到 #1，active PR #8 不擴 scope |
| 2026-09-15 | Consensus | Microsoft 365 Copilot app；API/MCP/assistant distribution 持續擴大 | CONFIRMED / previously covered | embedded research = table stakes；不新增 UI/channel parity work |
| 2026-09-09 | Scite | MCP citation graph traversal | CONFIRMED / previously covered | current S2 capability + #1 已涵蓋，不另造 graph |

## Community Pain

本輪沒有社群訊號能比第一方 provider contract 更改變決策，因此不為了湊分類加入 Reddit/HN anecdote。

## Repository Truth / Counter-evidence

### 1. Current Unpaywall implementation already uses the surviving endpoint

Current source `vendor/paper/paper_search_mcp/academic_platforms/unpaywall.py`：

- `BASE_URL = https://api.unpaywall.org/v2`
- `search()` 只接受 DOI / 可抽出的 DOI，最多返回一篇 paper；
- `_fetch_doi_record()` 呼叫 `GET /v2/{doi}`；
- README/DEPLOYMENT 也把 Unpaywall 描述為需要 owner email/config 的 existing upstream capability，而不是一般關鍵字搜尋服務。

所以「2026-09-18 Unpaywall search retirement」不是 current repo regression。

### 2. Unpaywall adapter 仍有 failure→None/[] 的 source-truth pattern，但這不是本輪新 fingerprint

Static source 也顯示 `_fetch_doi_record()` 在 422、RequestException、unexpected exception 時會回 `None`，`search()` 再回 `[]`。從產品契約角度，這和 #14/#15 已經確認的「provider failure 不應看起來像 confirmed empty」原則相同。

但本輪**不再開第三張 provider-specific Issue**，理由：

- 9/18 的 breaking change 並沒有打到 current DOI endpoint；
- 沒有新的 owner runtime incident、頻率或實際 Unpaywall-selected workflow failure；
- #14 / #15 已經把同類 source-truth風險帶進當前 triage，先看 owner 如何收斂共通 acceptance fixture，比機械地每個 adapter 開一張單更符合 Issue-quality v2 的去重與最小修正原則。

這不是宣稱 Unpaywall failure semantics 已被修好；只是不把「找到同模式」誤當新高優先根因。若之後有 actual Unpaywall path reproduction，應先比較與 #14/#15 的 actual root / shared adapter contract，再決定 merge / independent tracking。

### 3. No product-changing default-branch delta since prior academic-mcp radar

Current HEAD `c61d6fac...` 只是 Round-2 audit commit；latest product-changing baseline 仍 `4eb25de...`。因此沒有新的 current default-branch feature 能推翻 2026-09-17 radar 的 Elicit/Consensus/OpenAlex decisions。

## Opportunity Map — academic-mcp

### MUST MATCH

- 每個來源的 `CONFIRMED_EMPTY`、`RATE_LIMITED`、`INVALID_REQUEST`、`UPSTREAM_ERROR`、`UNKNOWN` 不應被混為同一個空陣列語意。
- DOI OA resolution 與 general paper discovery 要保留來源/工作語義，不 silent provider substitution。
- provider deprecation/migration 先核對 actual endpoint，再決定是否需要動產品。

### SHOULD BE BETTER

- 未來修 #14/#15 時，優先抽取最小可共用的 failure fixture/acceptance semantics，避免每個 adapter 重複發明錯誤表示；但不要先建立 central provider-health framework。
- ResearchBundle 若後續得到 owner 授權，應維持 bounded explicit evidence set，而非自動把所有找到的 paper 加入 canonical set。

### DIFFERENTIATOR

- private/local paper/index storage；
- pinned upstream source/version + exact namespace parity；
- source-specific failure honesty，而不是用另一來源產生看似完整的答案；
- 可恢復、可驗證的 single-owner research gateway。

### ADJACENT IDEA

- Provider contract compatibility matrix（endpoint / auth / current limit / failure semantics）只在 maintenance 成本真的上升時再研究。現在 README + issues 已足以指出已知 OpenAlex/Crossref contract drift，沒有資料支持新 registry/service。

### DO NOT COPY

- 不把 Elicit team/shared collection 搬進 single-owner MCP。
- 不因 Consensus/Scite 有 hosted corpus/API 就付費新增 provider。
- 不把 Unpaywall DOI lookup 遷到 OpenAlex，只因另一個 Unpaywall endpoint 退役。
- 不新增 automatic fallback router；provider failed 不能由另一來源悄悄冒充同一答案。
- 不為了 #14/#15/Unpaywall pattern 建大型 central provider framework。

## Four-Gate Decision

### Candidate: Unpaywall 2026-09-18 retirement

1. **Problem/value gate — REJECT as current defect.** Current repo does not use retired title-search endpoint；existing DOI endpoint explicitly remains supported.
2. **Priority gate — NOT_ESTABLISHED.** No supported current path is broken by the retirement event.
3. **Minimum solution — NO CHANGE.** Current provider split is already smaller and correct. Documentation/report note is sufficient.
4. **Research/implementation separation — NO ISSUE.** There is no decision-relevant experiment needed to answer whether current endpoint was retired; first-party contract + source inspection already answer it.

### Candidate: Elicit/Consensus embedded evidence context

- `kind=RESEARCH`, `severity=NOT_ESTABLISHED` if treated standalone, but exact workflow is already represented by #1/#9 and owner direction.
- active PRs already own those scopes; external evidence is not permission to expand them.

## Rejected Ideas / Why

1. **[REJECT] Unpaywall→OpenAlex migration project.** Current DOI endpoint survives unchanged.
2. **[REJECT] Remove Unpaywall as redundant.** Its DOI-centric OA-resolution contract remains supported and narrower than general search.
3. **[DEDUPE] New Research Collection/Workspace Issue.** Elicit signal is already represented in #1/PR #8; collaboration is explicitly out of scope.
4. **[DEDUPE] New progressive research-agent/tool-router Issue.** #9/PR #10 already owns tool exposure; no new host evidence.
5. **[REJECT] Add Consensus or Scite as paid provider.** No demonstrated workflow gap justifies extra cost/licensing/provider surface.
6. **[HOLD] One Issue per false-empty adapter.** Unpaywall shows the same truthfulness pattern, but no fresh runtime evidence or independent user-impact root justifies mechanical issue multiplication this round.

## Issue Mapping

- New Issues：**0**.
- Existing Issues modified/commented：**0**.
- PRs modified/commented：**0**.
- Locks：none required because no Issue/shared-state mutation was attempted.
- Implementation authorization：**0**.
- Existing actionable source-truth items remain #14 OpenAlex and #15 Crossref; #1/#9 remain research scopes and do not become P1/P2 because competitors moved.

## Sources

Primary external sources:

1. Unpaywall REST API — checked 2026-09-20; search endpoint retired 2026-09-18: https://data.unpaywall.org/products/api
2. OpenAlex/Unpaywall product boundary — updated 2026-09-18: https://help.openalex.org/access/unpaywall-and-openalex/
3. Unpaywall article-search retirement page — checked 2026-09-20: https://unpaywall.org/articles
4. Elicit Library as research hub — 2026-09-17: https://elicit.com/blog/library-into-resesearch-hub
5. Consensus changelog — current, including 2026-09-15 Copilot and 2026-08-26 API: https://help.consensus.app/en/articles/11954907-consensus-product-changelog
6. Consensus Everywhere — 2026-09-14: https://consensus.app/home/blog/consensus-everywhere/
7. Scite citation surfing/MCP — 2026-09-09: https://scite.ai/blog/citation-surfing-scite-mcp
8. Zotero changelog — current 10.0.3 dated 2026-09-17: https://www.zotero.org/support/changelog

Repository evidence:

- `Reese-max/academic-mcp@c61d6fac1ab697748ac738382665d930d5361255`
- latest product-changing baseline `4eb25de5005d33572095ed566ccf00762011bb50`
- `vendor/paper/paper_search_mcp/academic_platforms/unpaywall.py` blob `3802ad92be17a6c2f2178d2db2cbad0e607b48a2`
- Product Board `.github/quality-audits/2026-09-11-1010-product-board-audit.md`
- Fixed-50 Round 2 `.github/quality-audits/2026-09-18T0758Z-50-persona-audit-round-2.md`
- Prior academic radar `docs/competitive-intelligence/2026-09-17T201200Z-external-radar.md`

## What Changed

1. New provider event since the last academic deep radar: Unpaywall formally retired title/article search on 2026-09-18.
2. Repo-source check shows current `academic-mcp` uses the surviving DOI lookup endpoint, so the event **does not become a product bug**.
3. Elicit/Consensus/Scite signals remain strategically relevant but were already captured in #1/#9 or prior radar; no duplicate Issue/comment/report expansion into their active PRs.
4. No product-changing default-branch delta changes current conclusions.
5. No external evidence passed all four gates for a new Issue or priority escalation.

## Classification / Scope Calibration

- Unpaywall search retirement: `CONFIRMED external change / CURRENT_PATH_UNAFFECTED / NO_CHANGE`.
- Elicit collection-agent model: `CONFIRMED / DEDUPED_TO_EXISTING_RESEARCH / no implementation authorization`.
- Consensus embedded distribution: `CONFIRMED / table-stakes signal / no new channel work`.
- Unpaywall failure→empty static pattern: `SOURCE_OBSERVATION / HOLD_FOR_ROOT-CAUSE_DEDUPE / NEEDS_RUNTIME_EVIDENCE`; not promoted to a new P2 in this round.
- Portfolio CLEAN：**NOT DECLARED**.

## Completion / Gaps / Cursor

- Inventory：COMPLETE — 42 owned / 41 unarchived; pagination exhausted.
- Governing rules：COMPLETE — blob `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Focal current HEAD：`c61d6fac1ab697748ac738382665d930d5361255`, rechecked immediately before report write and unchanged.
- External A/B/C exploration：COMPLETE for this focal round, with fresh first-party Unpaywall/OpenAlex change plus direct/adjacent competitor recheck.
- Runtime/provider tests：**NOT EXECUTED**. No need to hit a live provider to determine whether `/v2/{doi}` was retired; no runtime success/failure is claimed.
- Issue/PR writes：none; no lock required.
- Next fair-rotation cursor：`Reese-max/spotify-playlist-organizer-mcp`.
