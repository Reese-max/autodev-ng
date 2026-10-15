# External Competitive Radar — 2026-09-20T06:01:55Z

Status: **COMPLETE**

查閱日：2026-09-20。主要市場證據來自 GitHub 之外的公開第一方產品／支援文件；GitHub 僅用於 Reese-max 自有 repository inventory、產品方向、default-branch 現況、Issue/PR 去重與報告寫入。

## Scope / Direction Check

- Governing rule：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Rules blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`
- Fresh connected owner inventory：本輪實際分頁列舉 **42 個 Reese-max-owned repositories / 41 個未封存**；offset 100 為空。唯一 archived repo 是 `obsidian-vault`，不沿用舊 inventory 當全集。
- Fair-rotation focal repository：`Reese-max/ppt-studio`，承接上一輪 `2026-09-20T040155Z-external-radar.md` 游標。
- Default branch：`master@dc2aab78dbf5acc41d97fbf17645b8331cd21bfd`。最新 default commit 是 2026-09-15 的 docs/product-board audit；本輪未把 docs commit 當作產品功能修正。
- Owner direction：`INVEST / SIMPLIFY`；P5/K1–K5 已完成後進入維護期，明文禁止為已達標 KPI 繼續做 micro-polish；P6 retention / realtime collaboration / marketplace 都要 owner 另行拍板。North Star 仍是讓非設計師在約五分鐘內從文字/PDF/URL 等得到可繼續編輯、符合品牌的簡報。
- Active coordination：#7 translation lost-update 已有 PR #8；#1 Docker/auth 有 PR #2/#4；#5 structured slide-state research 沒有另開 implementation PR；#9 是獨立 upstream FastAPI/Starlette security finding。本輪不搶改這些 scope。
- 本輪未修改產品原始碼、CI/config、secret、permissions/settings，未建立 implementation branch、merge/deploy、啟動 worker/GOAL、付費服務或外部資料寫入。

## Product → Market Category

`ppt-studio` 目前最適合視為：

1. local-first / provider-optional 的 **editable presentation workstation**；
2. 外部內容（URL/PDF/Markdown/JSON）到可編輯 deck 的 authoring / review / export 層；
3. 以 bounded AI edit、brand profile、translation、present/export 為核心，而不是 collaboration SaaS；
4. 競爭重點是「可接手、可驗證、可安全修改」而不是 connector 數量或完整 Office 套件 breadth。

## External Signals

### A. CONFIRMED — PowerPoint Copilot 在 2026-08 把「品牌」從風格提示升成結構約束

**事件：2026-08 rollout；查閱：2026-09-20。**

來源：
- https://techcommunity.microsoft.com/blog/microsoft-copilot-blog/what%E2%80%99s-new-in-microsoft-copilot--august-2026/4551960
- https://support.microsoft.com/en-us/powerpoint/copilot/copilot-in-powerpoint-skills

Microsoft 公開的 August Copilot update 新增 **Strict brand adherence**：啟用後 Copilot 只能使用核准 template / slide-master layouts，不會自行新增或刪除 placeholders，也不會發明新 layout。相同更新亦加入 **Note steering**，可用 slide notes 的自然語言逐頁約束 Copilot；同時 PowerPoint 現已支援可重複使用的 **custom skills**，能在 PowerPoint 內選用、`@mention`、啟停，並以 `SKILL.md` 形式保存。

這是一個比先前「AI 會參考品牌／模板」更具體的市場訊號：品牌一致性正在被拆成至少兩層：

- **deterministic structural constraints**：哪些 layouts / placeholders 可以被使用或改動；
- **reusable steering instructions**：某種重複工作要如何做。

對 `ppt-studio` 的直接 repository 對照：現行 `brand_profile` 只有 `logo_url / primary_color / font_family / enabled`；品牌色主要映射到既有 theme。這足以處理色彩、字型、Logo，但尚未形成「核准 layout / 禁止 layout drift」的明確 contract。

**反證 / 不升級理由：** #5 已經擁有目前四種 layout 的 stable object/slot graph、layout invariants、candidate patch、render/export verification 研究範圍；而 MISSION 又禁止 K1–K5 達標後自動 micro-polish。沒有真人或 runtime evidence 證明 `ppt-studio` 使用者目前因 brand-layout drift 發生顯著失敗。因此本輪不另開 Brand Policy / Skills framework Issue。

### B. CONFIRMED — PowerPoint custom skills 把「重複 prompt」商品化，但不構成 PPT Studio 必須複製的功能

**現行支援頁查閱：2026-09-20。**

Microsoft 的 PowerPoint skills 是 reusable instruction-based capabilities；使用者可在 PowerPoint 內上傳或建立，存於 OneDrive `Skills` folder，並用 `SKILL.md` frontmatter + body 定義。這證明「把重複簡報工作流程封裝成可選 instruction pack」正在進入主流 presentation app。

但 `ppt-studio` 已有 structured brief、情境 preset、chips、模板/主題/頁數建議與本機 draft persistence。現在沒有證據顯示「反覆重打相同 prompt」是高頻人工斷點，因此最小動作是 **不改**。若未來真人證據成立，也應先把一個既有 preset 變成可保存／可命名的 bounded instruction recipe，再評估是否需要 skills subsystem；不應直接複製 OneDrive skill library、marketplace 或 agent framework。

### C. CONFIRMED — Google Slides 在 2026-08-20 把 deck → narrated video 的跨工具 handoff 收進 Slides + Vids

**發布：2026-08-20；Scheduled Release full rollout starting 2026-09-07；查閱：2026-09-20。**

來源：https://workspaceupdates.googleblog.com/2026/08/record-presentations-in-google-slides-with-Google-Vids.html

Slides 現在可直接從介面啟動錄製，輸出可分享連結；較進階的 Vids 路徑提供 transcript-based editing 與 voiceover generation。

這確實減少「做完 deck → 開另一個錄影／剪輯工具 → 再分享」的步驟，但 `ppt-studio` 的 current North Star 是可編輯簡報產出與 handoff，repository 也沒有可驗證的 recording/voiceover user pain。故本輪只列 **ADJACENT IDEA / HOLD**，不建 recording、TTS、video editor 或 media pipeline Issue。

### D. CONFIRMED — Pitch 把 presentation backend 變成 assistant-distribution surface

**發布：2026-08-10（Claude workflow）；API 文件 2026-08-17；查閱：2026-09-20。**

來源：
- https://help.pitch.com/en/articles/16220369-create-presentations-with-claude
- https://help.pitch.com/en/articles/16151949-build-presentations-with-variables-and-claude
- https://help.pitch.com/en/articles/15926009-use-pitch-s-api

Pitch 可讓 Claude 從 prompt、既有 template、call notes / Slack context 產生 deck，填 template variables，完成後回到 Pitch 繼續編輯；其 API 也明確定位在 recurring / event-triggered presentation generation。這支持「assistant 可以是 distribution surface，但 editable presentation artifact 仍應留在 canonical editor」的方向。

對 PPT Studio 而言，這不是要求立刻做 Claude/ChatGPT connector。現有 OpenAPI 已可作為 integration surface；owner 又未批准 connector breadth。可移植原則是保持 API contract / editable handoff 清楚，而不是追逐每個 assistant connector。

### E. CONFIRMED — Canva 最新教學仍強調 outline review → generate → chat/direct-edit

**頁面 last updated：2026-09-17；查閱：2026-09-20。**

來源：https://www.canva.com/design-school/resources/prompt-stunning-presentations/

Canva 的最新 Design School presentation workflow 仍把「先調 prompt 的 topic/aesthetic → review outline → 生成 → chat 或直接編輯」作為標準流程。這主要是反證：PPT Studio 現有 structured brief / review-first direction不是明顯落後點，不需要因此再加一輪 onboarding micro-polish。

## New Releases / Market Moves

| Date | Product | Signal | Confidence | Radar consequence |
|---|---|---|---|---|
| 2026-09-17 | Canva | outline review + AI refine 教學更新 | CONFIRMED | 驗證既有 brief/review-first，不新增 polish |
| 2026-09-07 | Google Slides/Vids | scheduled full rollout of Slides recording integration | CONFIRMED | async narration 保留 adjacent；不擴產品邊界 |
| 2026-08 | PowerPoint Copilot | strict brand adherence + note steering + custom skills | CONFIRMED | 高價值策略變化；品牌約束應是 deterministic contract，不是更多 prompt |
| 2026-08-17 | Pitch | presentation API for recurring/custom generation | CONFIRMED | API/distribution commodity；不追 connector catalog |
| 2026-08-10 | Pitch + Claude | assistant → template/variables → editable Pitch deck | CONFIRMED | 保留 canonical editor/handoff 邊界 |

## Community Pain

本輪社群訊號只作 anecdotal 背景，不作發生率或優先級：

- 2026-01 的個別使用者描述「已有 speaker notes 的 slide deck，希望快速生成 AI voiceover 且之後仍能重生成／修改」，支持 recording/voiceover 可能是真實 JTBD，但不足以證明 PPT Studio 使用者也有同樣高頻需求。
- 2026-08 的個別 PowerPoint / AI-deck 討論仍提到 generic、text-heavy、難以正常編輯或 template drift；這些 failure modes 已被 #5 的 native editability / bounded patch / render verification 覆蓋，不建立第二張 Issue。

## Adjacent Ideas

### 1. Brand constraint 不應只是「更像品牌」，而應能 fail closed

如果 #5 之後得到研究實作授權，最小可加入的 **research fixture** 不是新 Brand Policy service，而是針對目前四個 layout 做 2–3 個 deterministic constraint：例如只允許核准 layout set、必要 placeholder 不可被刪除、未觸及區塊不得漂移。AI candidate 違反時回 `UNSUPPORTED / CONSTRAINT_VIOLATION`，不靠 prompt 說「請遵守品牌」。

這重用 #5 的 exact-base / touched-object / render verification，不需要 DB、policy engine、admin portal、template marketplace。

### 2. Reusable instruction pack 先從既有 preset 驗證，不先做 skills framework

若未來觀察到使用者反覆貼相同「董事會摘要／課堂講義／銷售提案」規則，可先把 1 個現有 preset 變成可保存的 local recipe，量測是否真的減少重輸。BUILD/NARROW/REJECT 後才討論更通用 skills；不把 Microsoft 的 SKILL.md 支援本身當需求證據。

### 3. Deck → video 是鄰接工作，不是目前 canonical artifact 的延伸義務

Google 正把 narrated-video 生產吸到 Vids；專門 media tooling 也已成熟。PPT Studio 若沒有真人 evidence，維持 share link / speaker mode / rehearsal 比另建 video pipeline 更符合最小產品策略。

## Opportunity Map — `ppt-studio`

| Bucket | Decision | Evidence / reason |
|---|---|---|
| MUST MATCH | 長時間 AI mutation 不可 silent overwrite；native/editable handoff 不能虛假宣稱 | #7 + PR #8；#5 existing research |
| MUST MATCH | 先守住 local/remote auth 與 upstream framework security truth | #1 active PRs + #9 |
| SHOULD BE BETTER | 若 #5 後續研究成立，把 brand consistency 表成目前四種 layout 上可檢驗的 structural constraints | PowerPoint August strict-brand move；目前真人 pain UNKNOWN |
| DIFFERENTIATOR | local-first / provider-optional + bounded patch + explicit stale/conflict/render/export receipt | 與 cloud suite breadth 不同；可直接重用既有 product direction |
| ADJACENT IDEA | local reusable instruction recipe / preset | PowerPoint skills，但目前無高頻重輸證據 |
| ADJACENT IDEA | narrated deck / recording bridge | Google Slides + Vids；目前產品需求證據不足 |
| DO NOT COPY | OneDrive skills library、enterprise brand admin、realtime collaboration、comment task workflow、完整 Vids/video editor、connector catalog | Owner scope + no validated user pain + high maintenance/permission breadth |

## Four-Gate Candidate Calibration

### Candidate: structural brand constraints for existing layouts

- `kind=RESEARCH`
- `severity=NOT_ESTABLISHED`
- `decision_priority=MEDIUM`
- `evidence=NEEDS_EVIDENCE`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`

**Gate 1 — problem/value:** external market signal is strong, but repo evidence currently proves only a narrower representation gap (`brand_profile` does not encode layout approval). It does **not** prove an actual supported user workflow failure. Existing theme/logo/font plus manual review may already be sufficient for current users. Therefore no BUG/P2/P1 classification.

**Gate 2 — priority:** PowerPoint shipping strict brand controls raises Strategic Fit, not severity. No real incident, completion-rate loss, support burden or owner-approved P6 goal exists.

**Gate 3 — smallest path:** no code now. If #5 later gains research implementation approval, add at most one fixture class using the **existing four layouts** and the existing patch/render verification proposal. A new policy database, template service, state machine, admin portal or layout DSL is unjustified.

**Gate 4 — research/implementation separation:** experiment must exit BUILD/NARROW/REJECT. BUILD would only support a next decision; it would not authorize shipping a brand-policy subsystem.

**Issue decision:** **NO NEW ISSUE.** Same root/workflow boundary is already covered by #5 (`structured slide state + layout invariants + render verification`). New evidence is retained in this central radar only to avoid reopening the same problem under a new “brand policy” name.

## Rejected Ideas

1. **New `[FEATURE] Brand Policy Engine`** — rejected as duplicate/over-engineered; #5 already owns structural layout invariants, and user pain is unproven.
2. **PowerPoint-style custom skills subsystem** — rejected now; existing presets/brief builder are a smaller substitute and no repeated-prompt pain is established.
3. **Repurpose speaker notes as AI control plane** — rejected; notes are already user-facing presentation content. Steering, if ever needed, should use a separate explicit field so content and control instructions are not conflated.
4. **Slides/Vids-style recording + TTS + transcript editor** — rejected from current scope; interesting adjacent JTBD but no validated PPT Studio demand and high media breadth.
5. **Pitch/Claude/ChatGPT connector catalog** — rejected; OpenAPI already provides an integration surface, and owner has not authorized connector breadth.
6. **More outline/brief UI polish because Canva teaches outline review** — rejected; current product already has structured brief/presets/review behavior and MISSION explicitly forbids treadmill polish.

## Issue / PR Mapping and Coordination

| Existing item | This round | Reason |
|---|---|---|
| #5 structured slide state / render verification | **EVIDENCE STRENGTHENED IN CENTRAL REPORT ONLY** | Microsoft strict-brand constraints fit same layout-invariant root; no new Issue/comment |
| #7 translation lost-update | **SKIPPED_ACTIVE** | PR #8 actively addresses it; no scope stealing |
| #1 Docker/auth boundary | **SKIPPED_ACTIVE** | PR #2/#4 exist; unrelated external signal |
| #9 FastAPI/Starlette security | **UNCHANGED** | independent upstream security root; no competitor feature can supersede it |
| #3 provenance | **UNCHANGED** | external-source truth remains valuable but no new same-root evidence this round |

No issue lock was acquired because no existing Issue/comment/shared mutable state was changed. No new Issue required a pre-write lock.

## Cross-Portfolio Ideas

1. **Structural policy ≠ prompt instruction.** Where a Reese-max product already has typed artifacts (slides, routes, packs, skills), important invariants should be represented and verified at the artifact boundary rather than only repeated in model prompts. This is a design principle, not authorization for a cross-repo policy framework.
2. **Assistant as distribution surface, product as canonical artifact.** Pitch’s Claude/API direction reinforces a pattern already useful across `ppt-studio`, `travel-planning-mcp`, `UkePack` and others: external agents may initiate work, but canonical state, review, authority and receipts stay in the product. No shared framework is proposed without repo-specific evidence.

## Sources

First-party / official:

- Microsoft Copilot August 2026: https://techcommunity.microsoft.com/blog/microsoft-copilot-blog/what%E2%80%99s-new-in-microsoft-copilot--august-2026/4551960
- Microsoft PowerPoint custom skills: https://support.microsoft.com/en-us/powerpoint/copilot/copilot-in-powerpoint-skills
- Google Slides + Vids recording: https://workspaceupdates.googleblog.com/2026/08/record-presentations-in-google-slides-with-Google-Vids.html
- Pitch + Claude: https://help.pitch.com/en/articles/16220369-create-presentations-with-claude
- Pitch variables + Claude: https://help.pitch.com/en/articles/16151949-build-presentations-with-variables-and-claude
- Pitch API: https://help.pitch.com/en/articles/15926009-use-pitch-s-api
- Canva Design School presentation prompting: https://www.canva.com/design-school/resources/prompt-stunning-presentations/

Repository truth:

- `Reese-max/ppt-studio` README / MISSION / current default branch
- Issues #1/#3/#5/#6/#7/#9; PR #2/#4/#8
- `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- prior radar `2026-09-20T040155Z-external-radar.md`

## What Changed

Compared with prior PPT Studio competitive evidence, the substantive new signal is **PowerPoint’s August 2026 move from generic brand-aware AI toward explicit structural brand enforcement plus reusable steering**. This materially sharpens the architectural lesson for #5: important brand/layout invariants should be deterministic and inspectable, while reusable instructions remain a separate layer.

It does **not** establish a new defect, P2/P1 impact, or implementation authority. Google’s narrated-video integration and Pitch’s assistant distribution are meaningful adjacent moves but remain outside the validated PPT Studio core.

## Completion / Gaps / Cursor

- Fresh repo inventory: **42 owned / 41 unarchived**; page 2 empty.
- New Issues: **0**.
- Existing Issue comments/updates: **0**.
- PR comments/updates: **0**.
- Product/runtime execution claims: **0**; no new feature is marked runtime-verified.
- Implementation authorization: **0**.
- High-value external strategy change retained: **1** (PowerPoint structural brand + steering/skills split).
- Lower-confidence/adjacent signals retained without Issue: Google Slides/Vids recording; Pitch assistant distribution.
- Main evidence gap: no current real-user measurement shows brand-layout drift, repeated-prompt friction, or narrated-video demand in PPT Studio.
- Next fair-rotation cursor: `Reese-max/voice-actress`.
