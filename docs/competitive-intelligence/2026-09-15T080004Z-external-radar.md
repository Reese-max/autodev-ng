# 外部競品／新品／工作流靈感雷達 — 2026-09-15T08:00:04Z

> 查閱日：2026-09-15（UTC；臺灣 2026-09-15）。
>
> Issue Quality：`issue_quality_version: 2`；規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`（`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`）。
>
> 本輪只做公開網路研究、repository / Issue / PR / audit 唯讀核對及新增本報告。沒有修改產品原始碼、CI/config、secret、權限、repository settings；沒有建立實作 branch、merge/deploy、啟動 worker/run/GOAL、付費試用或變更正式資料。

## Executive Summary

延續上一輪 `2026-09-15T060522Z-external-radar.md` 的公平輪巡，本輪深讀 `Reese-max/ai-novel-workstation`。重新完整列舉 connected owner inventory：**42 個 Reese-max owned repositories，3 archived、39 owned + unarchived**；目前仍沿用已核對範圍 **36 product-like + 3 support/compatibility-only**（`adng-memory`, `internship-notes-sites-mirror`, `police-exam-practice`），沒有操作他人 repository。

本輪沒有建立或更新產品 Issue。原因不是沒有外部訊號，而是新的深讀證據仍不足以越過 Issue Quality v2 的「需求已證明」門檻：

- Quarkle 在 2026-07-24～08-31 把 version history、diff preview、accept/reject edit cards、partial accept/reject 做成核心作者控制；2026-09-04 又提供可自動套用但一鍵 Undo 的 YOLO mode。
- NovelShaft 在 2026-09-02 提供 AI 變更比較，在 09-03 以 `@Manuscript` / `@Reference` 讓作者不用手動複製稿件脈絡，在 08-31 提供 whole-work undo/redo；其 07-14 重新定位更明確把「作者仍是作者」放在 AI 協作核心。
- Entangled Text 2026-08 的 Kestrel 把「聊天結論 → 候選章節修改 → 使用者 review 後才落稿」做成正式流程。
- AsgineAI 2026-09-02 顯示另一個相鄰風險：branch/rewind 若只復原文字、不復原記憶、關係、場景狀態等 derived state，會留下被丟棄回答造成的幽靈狀態；因此它改成 restore complete engine state。

`ai-novel-workstation` 的 current default branch 確實有可觀察的設計差異：`AuthorLoop` 的 automatic `revise` 會把 reviser 產生的新版立即透過 `BookManager.save_chapter()` 寫成目前章節 draft，再重新跑 gate；`create_backup()` 只有單一 sibling `.md.bak`，每次 revision 會再覆寫同一個 backup。這表示多輪自動 revision 並沒有面向作者的逐輪 diff / retained candidate lineage。

但反方同樣成立：

1. 產品已經有 `.bak`、quality/volume checkpoints、continuity/critic/reviser、whole-book reader panel、runlog 與 fail-closed production loop；不能把「沒有完整 version history」本身當缺陷。
2. Product Board 2026-09-13 已明確排序：先恢復 #5 真正執行的 default-branch CI receipt，再驗收 #2 / PR #3 context manifest，再證明 provider/interruption/export；這些目前比新 revision UX 更優先。
3. 2026-09-11 的歷史 radar 已把 `candidate edits/revision diffs` 放入 `ai-novel-workstation` Opportunity Map，因此本輪不能把同一抽象想法換名字重開。
4. 尚無真人作者 session / telemetry 證明逐輪 revision review 是 top friction；強制每一輪都人工 accept/reject 反而可能破壞本產品「bounded unattended production」的既有價值。

因此本輪決策是：**保留為 radar-only `RESEARCH_CANDIDATE / NEEDS_EVIDENCE`，不開 Issue。** 下一個最小可驗證問題不是「做 version-control framework」，而是：在一個既有 quality checkpoint 顯示「進入本輪自動修訂前版本 vs 最終候選稿」的 diff，是否足以讓作者判斷 AI 過度改寫；若現有 `.bak` + 外部 Git/editor 已足夠，就 REJECT。沒有真人或 owner-level runtime evidence 前不升級。

本輪：**0 新 Issue、0 既有 Issue 修改、0 新實作授權。**

---

# Scope / Repository Truth

## Portfolio enumeration

Owned + unarchived（39）：

`92-duty-scheduler`, `academic-mcp`, `adng-memory`, `ai-flight-radar`, `ai-novel-workstation`, `autodev-ng`, `avatar-vfo`, `cf-ai-router`, `cf-mcp-server`, `chatgpt-dual-pipeline`, `claude-mem`, `clinical-scribe-worker`, `cyber-prep-coach`, `exam-archive`, `flux-image-gen`, `google-maps-personal-mcp`, `herdr-skills`, `internship-notes-sites-mirror`, `lobsterpulse`, `lplrs-judicial-sync`, `MaterialYouNewTab`, `minideck`, `neciken-summer-poem`, `ninax-line-hermes`, `note-filler`, `police-exam-archive`, `police-exam-practice`, `ppt-studio`, `project-doctor-web`, `prompt-autoresearch`, `skill-foundry`, `soundbox-offline`, `spotify-playlist-organizer-mcp`, `taichung-police-intel`, `taiwan-intel-dashboard`, `tick-stock-panel`, `UkePack`, `video-timeline-pipeline`, `voice-actress`。

Archived / excluded：`gemini-deidentifier`, `obsidian-vault`, `openab`。

Support / compatibility-only：`adng-memory`, `internship-notes-sites-mirror`, `police-exam-practice`。

本輪 inventory 重新透過 connected GitHub owner listing 取得，page size 100 覆蓋目前 42 筆，不沿用舊 inventory 當全集。

## Current product truth — `ai-novel-workstation`

- Default branch：`main`。
- Rechecked HEAD：`267a0b6a9856f1de5f20afe44c7e0fd23d0390aa`（2026-09-13 Product Board audit）。
- Owner-approved direction（2026-09-13 Product Board）：**INVEST / SIMPLIFY**；local-first Traditional Chinese long-form creation workstation；moat 是 inspectable manuscript state、deterministic context/evidence、resumable bounded production、portable exports。
- `books/` 是 canonical work/story truth；`production-loop` 是唯一跨階段主流程。
- 現有重要 open work：#5 default-branch CI execution receipt；#2 / PR #3 deterministic Context Manifest；#4 / PR #7 pre-run cost quote；#6 external-agent Story Workspace research。
- Product Board 明確要求：在上述 contract 未可信前，不擴張 multi-tenant SaaS、marketplace/community、native mobile、LMS、automatic publishing、更多 model integrations。

### Revision path evidence

Current `lib/author.py`：

- 初稿先持久化成章節檔，再跑 continuity / critique。
- `decision.action == "revise"` 時，reviser 生成 `revised_text` 後立刻 `_persist_draft()`，再重新跑 gate。
- `_persist_draft()` 每次先 `create_backup()` 再 `save_chapter()`。

Current `lib/book_manager.py`：

- `save_chapter()` 直接寫 `books/<id>/chapters/000N_*.md`，該路徑屬 canonical `books/` 工作真相。
- `create_backup()` 寫同一個 `<chapter>.md.bak` sibling；沒有 per-revision timestamp/ID，後續 revision 會覆寫上一個 backup。

因此 repo 能證明的是：**automatic revision candidate 不是長期保留的多版本候選；它成為目前 draft，且最多直接保留一層 `.bak`。** 這不等於「資料遺失事故」或「現有流程錯誤」，只形成一個待驗證的作者控制摩擦。

## Coordination / duplicate truth

- All-state PR 核對：PR #3 正處理 #2 context manifests；PR #7 正處理 #4 cost quote。兩者都不應被本輪 revision UX research 搶 scope。
- Existing #6 已經擁有 **external AI client → candidate-only patch → validation → explicit promotion** fingerprint；本輪不得另開一張泛化「candidate patch framework」。
- Historical radar `2026-09-11-external-radar-r6.md` 已把 `candidate edits/revision diffs` 列為 `ai-novel-workstation` 的 `SHOULD BE BETTER`，所以這不是可用換名重開的新概念。
- `autodev-ng` 搜尋未發現 current ai-novel-specific owner heartbeat / GOAL 證據要求本輪接管此方向；本輪也沒有啟動 run/status mutation。

---

# Product → Market Category

`ai-novel-workstation` 的有效比較市場：

1. AI-native long-form writing/editing：Quarkle、NovelShaft、Sudowrite、Novelcrafter。
2. Author-controlled AI collaboration：Entangled Text / Kestrel、Quarkle edit cards。
3. Long-running narrative state engines：AsgineAI branches / memory rewind（僅相鄰模式）。
4. Local-first / inspectable writing workflows：Markdown/Git/Scrivener 類可逆工作方式。

產品中心不是「最多模型」或「最大 SaaS 功能面」，而是：**作者真相可讀、AI 修改可追、長流程可續跑、成本/外呼邊界可證明。**

---

# External Signals

## A. Direct competitor update — Quarkle 把 AI 修改做成可局部接受/拒絕的 edit cards

**CONFIRMED｜2026-07-24～2026-09-04｜checked 2026-09-15**

Sources:
- https://www.quarkle.ai/changelog
- https://www.quarkle.ai/
- https://www.quarkle.ai/pricing

Relevant releases:
- 2026-07-24：version history 支援 checkpoint side-by-side compare / restore。
- 2026-07-31：inline AI edit 在落稿前 preview diff。
- 2026-08-25：chat chapter edits 以 accept/reject cards 呈現。
- 2026-08-31：可只接受/拒絕 suggestion 的一部分；rejected edit 不再反覆重提。
- 2026-09-04：YOLO mode 可直接套用 chat edits，但保留 one-tap undo；Story Atlas 可設 read-only。

Current pricing checked 2026-09-15：Free 已包含 inline edits / version control；Pro 官方頁面目前標示首月 US$4.99、之後 US$19.99/月。這只代表「作者控制／可逆修改」被放進基礎產品價值，不代表 Reese-max 使用者願付相同價格或此功能本身提高留存。

### JTBD / reduced manual steps
作者收到 AI 修稿後，不需要：
`複製原稿 → 外部 diff → 判斷哪些接受 → 手動把片段貼回`。
產品把 decision point 留在修改落稿前，並保留 undo / history。

### Transfer
- 可移植原理：AI suggestion 是 proposal；作者決策與 canonical write 分離。
- 不照抄：不導入十二評審、hosted cloud workspace、200x usage 或完整 SaaS revision engine。
- 目前 Reese-max 已有自己的 critic/reviser/reader panel；真正待驗證的是**作者是否需要看 revision delta**，不是再增加 AI reviewer。

---

## A2. Direct competitor update — NovelShaft 把「引用目前稿件」與「比較 AI 變更」留在同一工作區

**CONFIRMED｜2026-08-31～09-03｜checked 2026-09-15**

Sources:
- https://en.novelshaft.com/updates
- https://en.novelshaft.com/updates/20260903-142759
- https://en.novelshaft.com/news/restarted

Recent workflow:
- 08-31：whole-work undo/redo、AI reply management。
- 09-02：比較 AI 如何修改 manuscripts / references。
- 09-03：選 passage / manuscript item / reference，以可編輯 `@Manuscript` / `@Reference` tag 放入 AI conversation，避免重新複製全文。
- 09-09：AI operation 後保留 selected view，讓使用者能接續寫作。

NovelShaft 2026-07-14 的重新定位明確說明「作者仍是作者」；這是 vendor product philosophy，不是獨立品質證據，但與 Reese-max 的 owner-approved author-control direction 一致。

### Transfer
- 脈絡引用與修改審查應靠 canonical object/selection，不靠人工 copy/paste。
- 這部分若是 **external AI client**，已由 existing #6 研究，不重開。
- 若是 **內部 auto-reviser**，本輪只形成待驗證的 preview/recovery friction，不直接立案。

---

# Adjacent Ideas

## B. Entangled Text — 對話結論先變候選修改，再由作者 review

**CONFIRMED｜August 2026｜checked 2026-09-15**

Source: https://www.entangledtext.com/whats-new

Kestrel 可以把 AI conversation 變成章節修改，但官方 workflow 是先 draft change、由使用者 review，再落稿。同時其記憶可讓作者查看與刪除。

Transferable principle：

`conversation / critique → proposed edit → author review → manuscript`

而不是：

`AI output → current manuscript → user later discovers change`。

對 Reese-max 的重要限制：不能因此把每一個 `reviser` pass 都強迫成人工 checkpoint；要先驗證這會不會破壞 unattended production 的核心價值。

---

# Emerging Tool / Technology Possibility

## C. AsgineAI — rewind 必須復原 derived story state，不只是 visible text

**CONFIRMED｜2026-09-02 / 09-08｜checked 2026-09-15**

Source: https://www.asgineai.com/changelog

2026-09-02 的更新指出：
- restore branch 現在會連 story board、stats、scene context、appearance、relationships、meters、cast、character evolution 一起復原；
- regenerated replies 不再殘留 discarded reply 產生的 active memories；
- memory processing 改為 durable retry queue。

2026-09-08 又明確說 failed drafts 不會被加入故事。

### Transfer / do not copy
這提醒任何 future revision-history 設計都不能只保存章節 Markdown；如果 restore 會改變已派生的 story truth，就需要確保狀態一致。但 **本輪完全不支持建立 complete-state snapshot engine**：`ai-novel-workstation` 已有 author/production state、observer truth updates 和 checkpoints，真正是否需要 multi-state rewind 尚未證明。這個 signal 因此列為 `DO NOT COPY YET`，避免 scope creep。

---

# Community Pain

本輪沒有找到足夠可信、且能改變上述決策的 30–90 天作者社群資料。避免把零散 Reddit 個案湊成發生率。本輪主要依第一手產品更新 + current repo behavior；「作者會普遍要求逐輪 revision review」仍屬 UNKNOWN。

---

# Opportunity Map — `ai-novel-workstation`

| 類別 | 本輪判斷 |
|---|---|
| MUST MATCH | 先完成可信 save/resume/export/CI contract；#5 的 remote execution receipt 仍高於新 UX 研究。 |
| SHOULD BE BETTER | AI 自動修訂的變更應至少可追查／可理解；但是否需要逐輪 accept/reject 尚未證明。 |
| DIFFERENTIATOR | Local-first canonical `books/` + deterministic context/evidence + bounded production + Traditional Chinese/BL-aware quality controls。 |
| ADJACENT IDEA | 在**既有 quality checkpoint** 顯示一次 before/after revision diff，作為最小研究 probe；不先做完整 version history。 |
| DO NOT COPY | 每輪 revision 人工中斷、完整 cloud revision SaaS、multi-tenant collaboration、generic version-control framework、complete-state branch engine。 |

---

# Four-Gate Decision — revision candidate preview

## 1. Problem / value

**Repo evidence: CONFIRMED；user pain: UNKNOWN。**

- 受支援流程：automatic critic → revise → re-gate。
- 可觀察行為：revised text 在 review 前成為 current draft；single `.md.bak` 只有一層。
- 現有替代：`.bak`、local Git/editor diff、quality checkpoints、whole-book reader panel。
- 不做後果：可能需要外部 diff / Git 才能比較 AI 過度修訂，但目前沒有真人 evidence 證明這是高頻或阻塞問題。

## 2. Priority

```yaml
kind: RESEARCH_CANDIDATE
severity: NOT_ESTABLISHED
decision_priority: LOW_TO_MEDIUM
triage: NEEDS_EVIDENCE
auto_implementation: false
runtime: NEEDS_RUNTIME_VERIFICATION
```

#5 P2 validation gap 與 active #2/#4 work 更優先。競品有功能不構成 P1/P2。

## 3. Minimum approach

依小方案順序：

1. **不改產品**：以目前 `.bak` + Git/editor diff 觀察作者是否真的需要內建比較。
2. **文件/UX**：在 existing quality checkpoint 顯示如何找到目前稿與 immediate backup。
3. **局部 probe**：只保留一次「修訂前 vs 最終候選」unified diff，掛在既有 checkpoint；不保存每輪 timeline、不建 DB。
4. 只有前述不足且真人/owner session 顯示明確價值，才研究完整 candidate history。

## 4. BUILD / NARROW / REJECT

- **BUILD（僅支持下一步決策，不授權實作）**：代表性 owner/author session 確認現行流程必須跳 Git/editor 才能判斷 AI revision，且 checkpoint diff 能直接支援 accept/keep-current 決策。
- **NARROW**：只在 `quality` checkpoint 顯示 immediate before/after 即可；不保留完整多輪 history。
- **REJECT**：`.bak` + current checkpoint / Git 已足夠，或新增 preview 讓 bounded unattended run 反而更碎裂。

**本輪不開 Issue。** 原因：缺真人/owner runtime evidence，且歷史 radar 已有 revision-diff 概念；現在立案容易把既有 abstract opportunity 重新包裝成工程工作。

---

# Cross-Portfolio Ideas

本輪只有兩個值得保留、且都不需新 umbrella Issue 的原則：

1. **Candidate before canonical**：對會改稿的 AI surface，候選與正式稿的 semantic boundary 應可讀；`ai-novel-workstation #6` 已在 external-agent path 擁有這個問題，不另建 cross-portfolio framework。
2. **Rollback must restore relevant derived truth**：若未來任何產品支援 branch/rewind，不能只回復 visible artifact 而留下 derived memory/state；目前各產品已有自己的 state contracts，先逐案證明，不建立通用 snapshot service。

---

# Rejected / Deferred Ideas

1. **完整 revision timeline / Git-like UI — DEFERRED**：沒有真人 evidence；現有 local files + Git + `.bak` 可先當低成本替代。
2. **每一輪 reviser 都人工 accept/reject — REJECT FOR NOW**：會直接破壞目前 bounded unattended loop；競品 UX 不能覆蓋 owner 已核定的自動 production 方向。
3. **把 Quarkle 多 reviewer / model suite 全抄過來 — REJECT**：本 repo 已有 critic、continuity、reader panel；近期內部實驗還證明「更多指標」可能產生錯誤優化。
4. **完整 branch engine / whole-state snapshots — DEFERRED**：AsgineAI 的需求來自 interactive story engine，不能直接外推到 long-form manuscript production。
5. **新 external AI candidate API — DUPLICATE**：existing #6 已追蹤 external-client typed candidate patch / promotion。
6. **新 context reference system — DUPLICATE / ACTIVE**：existing #2 / PR #3 已處理 Context Manifest。
7. **新成本系統 — DUPLICATE / ACTIVE**：existing #4 / PR #7 已處理 pre-run quote。

---

# Issue Mapping

| Finding | Mapping | Action |
|---|---|---|
| automatic internal revisions lack author-facing per-pass diff/history | historical radar concept; no exact open Issue | `RADAR_ONLY / NEEDS_EVIDENCE` — no Issue |
| external AI candidate edit / review / promotion | `ai-novel-workstation #6` | DUPLICATE; no update |
| deterministic context / selective truth | `#2 / PR #3` | ACTIVE; no scope change |
| cost quote / paid effect preflight | `#4 / PR #7` | ACTIVE; no scope change |
| default-branch remote CI receipt | `#5` | higher-priority existing P2; no update |

本輪無 Issue write，因此沒有取得 `github-issue-lock:v1`；也沒有修改任何 active Issue scope。新 Issue duplicate gate 已透過 open/closed Issue search、all-state PR search、historical radar search 完成。

---

# What Changed Since Last Radar

相較 `2026-09-15T060522Z-external-radar.md`：

1. 公平輪巡從 `video-timeline-pipeline` 前進至 `ai-novel-workstation`。
2. 再確認 current HEAD `267a0b6...` 與 2026-09-13 Product Board 的 INVEST/SIMPLIFY direction。
3. 深讀 `AuthorLoop` / `BookManager` 後，將舊 radar 的「revision diffs」抽象機會縮成具體行為：**automatic revised draft 立即持久化；single `.md.bak` 僅保留一層**。
4. 用 Quarkle / NovelShaft / Entangled Text / AsgineAI 的當前第一手更新交叉核對 author-control / reversible-edit 模式。
5. 經四道 Gate 後決定 **0 新 Issue**，避免把已出現過的 candidate-edit 概念包裝成 version-history 大工程。
6. 下一個公平輪巡 cursor：`clinical-scribe-worker`。

---

# Sources

## Reese-max / GitHub evidence

- `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md` — blob `8167e10798071d2276addaff6b201c6b0e904a2a`
- `Reese-max/ai-novel-workstation` HEAD `267a0b6a9856f1de5f20afe44c7e0fd23d0390aa`
- `README.md`
- `lib/author.py`
- `lib/book_manager.py`
- `.github/quality-audits/2026-09-13-2215-product-board-audit.md`
- Issues #1, #2, #4, #5, #6
- PR #3, #7
- Historical radar: `docs/competitive-intelligence/2026-09-11-external-radar-r6.md`

## Public web — primary external intelligence

- Quarkle changelog — https://www.quarkle.ai/changelog — checked 2026-09-15
- Quarkle product — https://www.quarkle.ai/ — checked 2026-09-15
- Quarkle pricing — https://www.quarkle.ai/pricing — checked 2026-09-15
- NovelShaft updates — https://en.novelshaft.com/updates — checked 2026-09-15
- NovelShaft manuscript/reference tags, 2026-09-03 — https://en.novelshaft.com/updates/20260903-142759
- NovelShaft restart/product direction, 2026-07-14 — https://en.novelshaft.com/news/restarted
- Entangled Text changelog — https://www.entangledtext.com/whats-new — checked 2026-09-15
- AsgineAI changelog — https://www.asgineai.com/changelog — checked 2026-09-15

---

# Completion / Gaps / Cursor

- Inventory：完成（42 owned / 39 unarchived；page size 100）。
- Issue Quality v2：完成，blob SHA recorded。
- Product truth / default branch / Product Board：完成。
- Existing Issue / PR / historical radar duplicate check：完成。
- External A/B/C research：完成，主要來源為 GitHub 之外的官方產品/changelog 網頁。
- New Issue：0。
- Existing Issue updates：0。
- Product code/config/CI changes：0。
- Runtime product execution：0；所有產品效果仍不得由本輪靜態研究推論。
- Portfolio CLEAN：未宣告。
- Next cold-rotation cursor：`clinical-scribe-worker`。
