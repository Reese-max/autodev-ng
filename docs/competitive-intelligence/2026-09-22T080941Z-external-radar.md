# 外部競品／新品／工作流靈感雷達 — 2026-09-22T08:09:41Z

## Status / scope / evidence boundary

- 狀態：**COMPLETE / MATERIAL MARKET VALIDATION / NO NEW ACTIONABLE ISSUE / NO USER NOTIFICATION**。
- 主要情報來源為 Reese-max GitHub 之外的公開網路；GitHub 僅用於 current product truth、owner direction、Issue/PR 去重、協調與持久化報告。
- Issue Quality 規則：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`；rules blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- Fresh connected-owner pagination：**42 Reese-max-owned repositories / 41 unarchived**；第二頁為空，`obsidian-vault` archived。舊 inventory 不當作全集，也不從過去數量推論刪除／新增。
- 本輪 fair-rotation focus：`Reese-max/exam-archive`。
- Current default branch：`main@5d74726eed8f507bb9527aff2047945c6de10d79`。最近三個 commit 均為 audit/product-board 文件；candidate-facing artifact 仍是較早的 single-file `index.html`。
- Owner-approved direction 沿用 2026-09-09 Product Board：**SIMPLIFY / MAINTAIN**。先處理 practice accessibility、truthful repository/product contract 與 sibling canonical ownership；不要把本 repo 擴成 generic AI tutor、LMS、帳號／雲端同步、社群或另一個大型題庫平台。
- Existing active scopes：#1（monolith / repository contract / canonical relationship；open PR #2，另有 related PR #5）、#3（practice keyboard/AT；open PR #6；仍缺真人 screen-reader smoke）。本輪不搶改、不留言擴 scope。
- `autodev-ng/main` 寫入前最新可見 HEAD：`3f7939d85cfb1d4958db9b449322f44a750f7064`，為其他排程的 audit 寫入；本報告使用唯一檔名，未覆寫共用歷史。
- 本輪沒有執行 production、真人 AT、CI 觸發、merge/deploy、付費 provider、secret/permission/settings 變更，也沒有修改任何產品 source/config。

## Executive decision

**0 new Issue、0 existing Issue/PR comment、0 implementation authorization。**

本輪找到兩個真正值得保留的新鮮外部訊號，但都沒有形成新的 root cause：

1. 台灣國考 archive / prep 市場已出現更強的 **「官方來源可追溯 + 最新年度 + 關聯考點」** 體驗。JumpVault 目前公開展示 42,000+ 題、官方 PDF、最近一年度免註冊詳解、逐年考頻與關聯題；這代表「把考古題放上網」本身更接近 commodity。對 `exam-archive` 的結論不是追 AI，而是更應守住 specialist、local/no-login、stable lookup/anchor/print，並把 freshness/source truth 做得極清楚。
2. 考選部本身已有每日更新的 machine-readable open-data dataset（dataset 170565），欄位直接包含考試年度、考試名稱、等級、類科、科目、試題網址與測驗題答案網址；Twinkle Hub 最近又把這個 corpus 轉成 64.8k papers / 320k question-level search。這使「如何發現最新官方卷」的技術成本顯著下降，但**不代表 Twinkle 的衍生 question chunks 可以取代考選部 authority**，也不需要現在替 `exam-archive` 建新的 source service / registry。

兩者都映射回 existing #1 的 source/build/canonical ownership 決策：若這個 surface 要保留，最小路徑是讓它成為 **thin specialist view over one canonical corpus**；若 sibling 已能更好完成核心工作，redirect / archive notice 仍比再建 ingestion stack 小。

---

## Product → market category mapping

本輪對 `exam-archive` 對照：

1. **official source / authority**：考選部考畢試題平台與 data.gov.tw dataset 170565；
2. **direct / indirect exam archive competitor**：阿摩、JumpVault；
3. **new technical distribution / discovery layer**：Twinkle Hub `tw-opendata-exam`；
4. **adjacent workflow**：concept-linked past-paper navigation、source-grounded AI explanation；只取可移植 workflow，不預設新增 AI 功能。

Current supported job：警察三等資訊管理考生能快速找到 105–114 年指定年份／科目的題目、搜尋內容、收藏／列印，必要時進入輕量 practice。產品價值不是 broader national-exam platform，也不是 AI tutoring。

# External Signals

## A. CONFIRMED — 考選部已有可每日更新的 machine-readable 試題索引

**Status:** `CONFIRMED` first-party open data。  
**Dataset:** 170565。  
**Checked:** 2026-09-22。  
**Source:** https://data.gov.tw/dataset/170565

考選部資料集提供 101 年起國家考試資料，欄位包含：考試年度、考試代碼、考試名稱、等級、類科、節次、科目全名、試題型態、**試題網址**與**測驗式試題答案網址**；資料頁標示更新頻率為 **每日**，授權為政府資料開放授權條款第 1 版。

### User job / reduced manual work

對維護者而言，這可以減少「手動巡考選部搜尋頁 → 判斷有沒有新年度／新科目 → 手貼官方 PDF URL」的 discovery 工作；對使用者真正有價值的不是 API 本身，而是 archive 能清楚回答：**最新官方年度到哪裡、本站涵蓋到哪裡、每一卷的 authority 在哪裡。**

### `exam-archive` implication

這是 **SHOULD BE BETTER / existing #1 evidence**，不是新 Feature Issue。最小可行方向若 #1 最終決定保留此 surface：

- 先用官方 dataset 當 **source enumeration / freshness check**；
- 題目內容仍綁定官方 PDF／既有 canonical corpus；
- 只產生 covered-year/source receipt 或 deterministic build input；
- 不建 crawler fleet、source registry DB、background watcher、API server 或 multi-provider abstraction。

官方 dataset 是 authority；第三方轉換不得取代官方來源標記。

## B. CONFIRMED — 115 年警察資訊管理卷已經被 secondary distribution 收錄

**Status:** `CONFIRMED current secondary availability / COMMUNITY_SIGNAL for user distribution`。  
**Checked:** 2026-09-22。  
**Sources:**
- https://yamol.tw/cat-%E8%AD%A6%E6%94%BF%E8%B3%87%E8%A8%8A%E7%AE%A1%E7%90%86%E8%88%87%E6%87%89%E7%94%A8-1858.htm
- https://yamol.tw/cat.php?id=1859

阿摩目前把 **115 年警察特種考試三等警察資訊管理人員**的「警政資訊管理與應用」與「數位鑑識執法」列在 114 年之前。這只證明 secondary discovery 已經把 115 放進使用者入口，不證明答案／解析 authority、流量或使用率。

`exam-archive` current default branch 仍是 105–114 scope；這個 freshness gap 已由前輪確認並映射至 #1，因此本輪不重複建立「補 115 年」單一 Issue。若 canonical sibling 已有 115，重用／redirect 比再次手工嵌入第二份 truth 更小。

## C. LIKELY CURRENT PRODUCT SHIFT — JumpVault 把 archive 往「來源 + 概念關聯」推進

**Status:** `CONFIRMED current product capability; launch date not independently established`。  
**Checked:** 2026-09-22。  
**Source:** https://www.jumpvault.tw/

JumpVault current site 公開宣稱／展示：

- 42,000+ 國考歷屆題；
- 題目連到考選部官方 PDF；
- 最近一年度詳解免註冊；
- 逐年考頻、關鍵字與「同考點歷屆題」；
- 站上可重現表格、附圖、公式；
- AI 詳解前先建題庫／概念／法規來源，再做引用檢查；網站也明確承認 AI 詳解並非逐題真人查證。

這是 vendor/product claim，不是獨立 learning-effect benchmark，也不能把其 94.1% 等數字當成 `exam-archive` 的 ROI 或品質證據。

### `exam-archive` implication

**市場校準：**「可搜尋歷屆題 + 最新年度」正在被更大的 national-exam product commodity 化。`exam-archive` 若繼續存在，更合理的差異化是：

- 極窄 police-IT scope；
- 零登入、低資料蒐集；
- local-first / printable / stable anchors；
- source/version receipt；
- 和 sibling practice product 的界線清楚。

**DO NOT COPY:** AI 詳解、法規 RAG、concept graph、付費歷史詳解，都沒有此 repo 的 user-value evidence；且會直接違反目前 SIMPLIFY / MAINTAIN 邊界。

## D. CONFIRMED adjacent technology — Twinkle Hub 已把 MOEX corpus 變成 question-level agent search

**Status:** `CONFIRMED current capability; provider-derived corpus`。  
**Published / update evidence:** 2026-06-30 changelog note；checked 2026-09-22。  
**Sources:**
- https://hub.twinkleai.tw/en/skills/tw-opendata-exam
- https://hub.twinkleai.tw/en/skills/tw-opendata-tools

Twinkle Hub `tw-opendata-exam` current page列出約 **64,815 papers / 320,663 questions**、2000→至今、30+ exam types，並提供 paper search、question-level search、whole-paper retrieval；頁面將 MOEX data.gov.tw dataset 170565 標為來源。

### What is transferable / what is not

可移植的是 **discovery/search workflow**：machine-readable source index → paper/question retrieval → human-facing surface。這可能跨 `exam-archive`、`police-exam-archive`、`police-exam-practice` 共用「發現官方最新卷」的思路。

不應照抄：

- 不把第三方 embedding / parsed chunk 當 authoritative question truth；
- 不讓 archive runtime 依賴外部 MCP 才能讀題；
- 不先做 portfolio-wide source framework；
- 不因 agent search 很方便，就把 no-login static archive 改成 online-agent-only product。

**Classification:** `ADJACENT IDEA / decision_priority=LOW_MEDIUM / NEEDS_EVIDENCE / auto_implementation=false`。若未來真的研究，只應做 read-only source reconciliation sample，不做產品依賴。

# New Releases / strategy changes

| Date / status | Product / change | Confidence | Consequence |
|---|---|---|---|
| current, checked 2026-09-22 | 考選部 dataset 170565 每日更新，提供 official paper/answer URL fields | CONFIRMED first-party | freshness discovery 可更 deterministic；支持 #1 source/build contract |
| current, checked 2026-09-22 | 阿摩已列 115 police-IT papers | COMMUNITY_SIGNAL / current distribution | `exam-archive` 105–114 ceiling 已明顯落後 latest-year discovery；前輪已知，不另立案 |
| current, checked 2026-09-22 | JumpVault 展示 42k+ 題、官方 PDF、最新年度免費詳解、考點關聯 | CONFIRMED vendor capability / effectiveness UNKNOWN | generic archive/search 價值被壓縮；支持 specialist + source-truth positioning |
| 2026-06-30 changelog evidence | Twinkle Hub MOEX corpus 可作 paper/question semantic retrieval | CONFIRMED provider capability | 可作 read-only reconciliation inspiration；不取代 MOEX authority |

# Community Pain

本輪沒有找到足以改變產品決策的近期 Reddit/HN police-IT 使用者痛點，因此**不為了湊類別引用弱 anecdote**。阿摩只作 secondary distribution/currentness signal，不推導使用率或 prevalence。

目前 repo 可直接確認的高價值問題仍是既有 #1 / #3；沒有真人 evidence 證明使用者要求 AI 詳解、跨裝置帳號、社群、analytics 或 broad national-exam coverage。

# Adjacent Ideas

## 1. Official-source freshness receipt — REUSE / existing #1

若保留 `exam-archive`，最小方案不是自動抓全國 64k 卷，而是讓 build/report 可以回答：

- current official latest year；
- this surface covered years；
- official source URL；
- last checked / generated time；
- sibling canonical corpus identifier（若已有）。

先用 static/generated receipt 即可；沒有必要新建 ledger/registry/service。

## 2. Thin specialist view over canonical corpus — existing strategic decision

外部市場更證明「資料取得」不是稀缺能力；真正會造成維護成本的是多份 truth。`exam-archive` 若保留 UI，應優先成為一個 thin view，而不是再新增第三套 ingestion/AI logic。

## 3. Concept-linked old questions — HOLD / do not implement here

JumpVault 的 related-question workflow可以減少考生手工搜尋「同概念跨年度」的工作，但目前 `exam-archive` owner direction 要求 specialist archive，不是 adaptive learning product；sibling practice / learning repo 更適合承接。沒有 real-user evidence 前不立案。

# Opportunity Map — `exam-archive`

### MUST MATCH

- practice keyboard / AT operability：existing #3 + open PR #6；真人 screen-reader smoke 尚未完成。
- truthful current coverage / source relationship：existing #1；115 external availability 與 official open-data index再次支持，但不是新 root cause。
- 不把部署成功冒充 interaction/a11y validation。

### SHOULD BE BETTER

- 免登入、local-first、低資料蒐集、print/share/stable anchors；這些是與更大 SaaS/AI 題庫相比仍合理的 specialist value。
- 顯式 `covered through 114` / `official latest 115` / source receipt，而不是讓使用者自行猜 freshness。
- 若 sibling canonical corpus 可用，重用／生成 view，不維護第二份題目真值。

### DIFFERENTIATOR

- 警察三等資訊管理窄領域 archive；
- 低摩擦 no-account lookup；
- 可攜、可列印、stable anchor；
- source/version truth 清楚，且不依賴雲端 learner profile。

### ADJACENT IDEA

- read-only official dataset reconciliation；
- concept-related past papers 僅作 sibling learning-product inspiration。

### DO NOT COPY

- AI tutor / AI explanation pipeline；
- national-exam marketplace / 42-category expansion；
- law RAG / concept graph framework；
- paid history layer / pass guarantee；
- account/cloud sync / analytics / social；
- runtime dependency on Twinkle/MCP just to browse archive；
- portfolio-wide source registry before canonical ownership is decided。

# Four-Gate Decision

## Candidate 1 — 新增「MOEX Open Data 自動同步服務」

1. **Problem/value:** freshness/manual discovery is real, but root cause is already #1: no stable source/build/canonical contract; current surface may not even remain canonical.
2. **Priority:** no new failure/severity established. This is maintenance/opportunity evidence, not P1/P2 product breakage.
3. **Minimum solution:** static/source receipt or build-time read-only check is much smaller than sync service.
4. **Research/implementation:** if canonical decision later chooses this surface, a bounded sample reconciliation can answer usefulness without a framework.

**Result:** `DEDUPED -> #1 / NO NEW ISSUE / SKIPPED_ACTIVE_SCOPE`。

## Candidate 2 — 導入 Twinkle Hub question-level corpus

1. It can reduce discovery/query effort but is third-party transformed data.
2. No user evidence requires semantic agent search in this static archive.
3. Official MOEX dataset + sibling corpus is a smaller source-of-truth path.
4. External runtime/provider dependency would weaken current local-first value.

**Classification:** `OPPORTUNITY / severity=NOT_ESTABLISHED / decision_priority=LOW_MEDIUM / NEEDS_EVIDENCE / auto_implementation=false`。

**Result:** HOLD, no Issue。

## Candidate 3 — 跟進 JumpVault：AI 詳解 + 考點圖譜 + 關聯題

1. Competitive capability exists, but owner direction explicitly keeps this repo as archive / light practice.
2. No observable user breakpoint says lack of explanation blocks lookup/archive use.
3. Smaller option: no change; route rich learning needs to sibling learning/practice surface.
4. Building AI/content graph here would be a large new product, not a minimal fix.

**Classification:** `OPPORTUNITY / severity=NOT_ESTABLISHED / decision_priority=LOW / DEFERRED / auto_implementation=false`。

**Result:** DO NOT COPY / no Issue。

## Candidate 4 — 單獨開「補 115 年」Issue

This remains the same known freshness/canonical fingerprint. 115 is already current externally; the correct next decision is whether to reuse sibling canonical data / redirect / generate thin view, not hand-copy another year into the monolith.

**Result:** REJECT_AS_DUPLICATE (#1 strategic source/canonical scope)。

# Cross-portfolio ideas

有一項**值得保留但尚未立案**的共用能力：`MOEX official source enumeration + per-surface coverage receipt`。

Potential consumers: `exam-archive`, `police-exam-archive`, `police-exam-practice`；其他題庫只有在資料模型與來源真的一致時才加入。Evidence:

- official dataset 170565 已有 daily machine-readable paper metadata/URLs；
- 三個 portfolio repo 存在重疊 exam-domain 維護；
- owner board 已把 canonical ownership 視為現有決策點。

但現在**不建立中央 service/framework**。最小順序是：先在 #1 canonical decision 中確認唯一題目 truth；只有實際量到重複更新／漂移，才考慮抽出共享 build input。研究若進行，也只需 sampled diff：official index vs canonical corpus vs each surface coverage，產生 BUILD / NARROW / REJECT 結論。

# Rejected Ideas

- 再把 115 題目手工貼入 1.35 MB `index.html`：延續多份 truth，且不解 source/build contract。
- 因 JumpVault 有 AI 詳解就複製 AI 解題：產品方向不符，且 vendor claim ≠ 本產品需求。
- 因 Twinkle 有 semantic search 就新增 MCP runtime：local-first archive 不需要 agent 才能使用。
- 把 Twinkle parsed questions 當第一方 authority：不可；真正 authority 是 MOEX/data.gov source metadata/PDF。
- 為 3 個考試 repo 立即做 shared database / source registry / ingestion service：尚未證明框架成本合理，先 canonical ownership。
- 因 115 freshness gap 把 severity 升為 P1/P2：目前這是明示 product scope / maintenance gap，不是已證實核心任務故障。
- 因 PR #6 有 headless Chrome/AX tests 就宣告 #3 fixed：仍缺其 Issue 自己要求的真人 desktop screen-reader smoke，且 PR 未 merge。

# Issue Mapping / coordination

- **#1** — monolith / source-build contract / sibling canonical relationship：本輪 official open-data + JumpVault/Twinkle 訊號都屬同 root cause。PR #2 open；related PR #5 已在處理 budget gate。**No lock, no comment, no rewrite.**
- **#3** — pointer-only practice accessibility：open PR #6 active；其 headless/browser evidence不能替代 pending manual AT smoke，且 unmerged 不能視為 default fixed。**No lock, no comment, no rewrite.**
- No other fingerprint crossed Issue gate。

### Scope / severity calibration

- #1 舊 title/body 以 P2 audit framing描述 monolith，但 current Issue Quality v2 應把「最新年度／source automation／shared framework」和真正性能／可用性缺陷分開。這輪沒有新增 P2 證據，也不在 active PR 下重寫 issue。
- #3 的 source-confirmed pointer-only core-practice barrier仍可維持 P2；但 PR #6 未 merge，manual SR path未執行，不宣稱 fixed。
- 新的 Twinkle / JumpVault 能力皆為 `OPPORTUNITY` / `NOT_ESTABLISHED`，沒有因競品存在而升級。

# Sources

External public web（主要情報來源）：

1. 考選部政府資料開放平台 dataset 170565 — checked 2026-09-22 — https://data.gov.tw/dataset/170565 — `CONFIRMED` first-party; daily update frequency, paper/answer URLs and exam metadata.
2. 阿摩「警政資訊管理與應用」 — checked 2026-09-22 — https://yamol.tw/cat-%E8%AD%A6%E6%94%BF%E8%B3%87%E8%A8%8A%E7%AE%A1%E7%90%86%E8%88%87%E6%87%89%E7%94%A8-1858.htm — `COMMUNITY_SIGNAL` / current secondary distribution.
3. 阿摩「數位鑑識執法」 — checked 2026-09-22 — https://yamol.tw/cat.php?id=1859 — `COMMUNITY_SIGNAL` / current secondary distribution.
4. JumpVault — checked 2026-09-22 — https://www.jumpvault.tw/ — `CONFIRMED current vendor capability`; performance/effectiveness and launch date not independently established.
5. Twinkle Hub MOEX National Exams — checked 2026-09-22 — https://hub.twinkleai.tw/en/skills/tw-opendata-exam — `CONFIRMED provider capability`, derivative corpus.
6. Twinkle Hub tool navigator — checked 2026-09-22 — https://hub.twinkleai.tw/en/skills/tw-opendata-tools — `CONFIRMED provider capability`, question/paper search surface.

Repository evidence（只作 current-product truth / coordination）：

- `exam-archive/.github/quality-audits/2026-09-09-2244-product-board-audit.md`
- `exam-archive/docs/audits/50-persona-round-2-2026-09-10.md`
- `exam-archive` Issues #1 / #3
- open PR #2 / open PR #6
- prior radar `docs/competitive-intelligence/2026-09-18T140128Z-external-radar.md`

# What Changed

Compared with the prior deep `exam-archive` radar (2026-09-18):

1. **NEW external workflow evidence:** first-party MOEX open-data dataset 170565 is now explicitly incorporated into the radar as the smallest machine-readable freshness/source-index option; prior radar relied mainly on the human-facing MOEX search platform.
2. **NEW competitor pattern:** JumpVault surfaces latest-year national exam content as no-login free content and connects questions through concept/frequency/source context. This raises the bar for generic archive/search but does not justify feature expansion here.
3. **NEW adjacent technical evidence:** Twinkle Hub exposes a large question-level MOEX-derived corpus suitable for discovery/reconciliation experiments, but remains non-authoritative derivative data.
4. No new repo root cause: all actionable maintenance implications still collapse into #1 canonical/source/build contract or #3 accessibility.
5. No default-branch product drift observed; `exam-archive` remained `main@5d74726eed8f507bb9527aff2047945c6de10d79` before write.

# Completion / gaps / cursor

- Rules blob: checked `8167e10798071d2276addaff6b201c6b0e904a2a`。
- Fresh owner pagination: **42 owned / 41 unarchived / page 2 empty**。
- Owner direction / current default changes / existing Issues / open PRs / prior radar / rejected directions: checked。
- Public-web A/B/C exploration: completed; first-party MOEX used as authority, secondary/vendor sources explicitly bounded。
- New Issues: **0**。
- Existing Issue/PR comments: **0**。
- Product code/config/CI/settings writes: **0**。
- Implementation authorization: **0**。
- Runtime gaps: no production/browser/manual screen-reader/provider execution; no claim that PR #6 is verified fixed。
- Portfolio CLEAN: **not declared**。
- Next fair external-radar cursor: **`Reese-max/flux-image-gen`**。
