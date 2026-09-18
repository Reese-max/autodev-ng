# 外部競品／新品／工作流靈感雷達 — 2026-09-18T16:10:10Z

> 查閱日：2026-09-18 UTC／2026-09-19 臺灣凌晨前後。
>
> Issue Quality：`issue_quality_version: 2`；規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`（`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`）。
>
> 本輪只做公開網路研究、GitHub read、建立一張窄 Research Issue 與新增本中央報告。**沒有修改產品原始碼、CI/config、secrets、權限/settings，沒有建立實作 branch、merge/deploy、啟動 worker/run/GOAL、付費 provider request 或更動正式資料。**

## Executive Summary

本輪 fresh connected inventory 為 **41 個 Reese-max-owned repositories／40 個 unarchived**；`obsidian-vault` 為 archived，排除。沒有以舊 inventory 當全集。

上一輪（`2026-09-18T140128Z-external-radar.md`）完成 `exam-archive`，公平輪巡 cursor 指向 **`Reese-max/flux-image-gen`**，因此本輪以它為 primary repo。

`flux-image-gen` current default branch 在寫入前再次確認為：

- `main@dfadcf30ca1d3daf479e05dd97aa457afa265333`；
- 最近 substantive security baseline：`ce69e934e43df5a9cc0d76337414c63d82b778de`；
- Round 3 audit 仍為 **NOT CLEAN**，既有 #11 production abuse-control release-path P1 尚未以正確 release/runtime evidence 收斂；本輪任何新研究都不能降低其優先級。

本輪真正的新外部訊號來自 **Cloudflare Images 2026-09-02 的 text rasterization / text overlay**：Images binding 可用 `.text()` 把文字 rasterize，再用 `.draw()` 疊到現有圖片；`cf.image` 的 `draw` 也可直接接受 `text`。這與 `flux-image-gen` 既有 Cloudflare Worker surface 相鄰，而且是 deterministic image transformation，不需要依賴生成模型把指定中文字拼對。

它剛好命中 repo 已經明確承認的人工 handoff：公開產品測試 fixture 的咖啡店海報要求顯示「明日開幕」，目前期望產品提示「文字渲染可能亂碼，建議後製加字」。產品本身又已支援海報、YouTube 縮圖、IG／社群等用途。因此這次不是因競品『有功能』而開單，而是有 **external enabling capability + repo-observed cross-tool step** 的交集。

經四道 Gate 後，本輪建立 **`flux-image-gen #26`**：

> `[Research][Competitive Inspiration] 驗證「生成後精準加字」能否用最小 deterministic overlay 取代跨工具後製`

分類維持：

- `kind=RESEARCH`
- `severity=NOT_ESTABLISHED`
- `decision_priority=MEDIUM`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`
- `NEEDS_RUNTIME_VERIFICATION`

本輪 **1 新 Research Issue、0 既有 Issue 修改／留言、0 PR 留言、0 實作授權**。

下一個公平輪巡 cursor：**`Reese-max/google-maps-personal-mcp`**（沿用先前完成 `flux-image-gen` 後已驗證的 rotation order）。

---

## Direction / Owner Scope / Current Coordination

### 已核對的產品方向

`CHANGELOG.md` 顯示產品近期明確做過簡化：對 casual 生圖使用者投報過低的 project board、custom idea cards 等重 UI 已被移除；custom-size 等進階入口也被縮減。這是本輪的重要反證：**即使市場往完整設計器走，也不應因此重建 Canva/Photoshop 類 editor。**

`docs/spec-coverage.md` / `docs/release-acceptance-checklist.md` 也明確要求：局部修改、換背景、擴圖、去背、加文字、比例等若沒有真正完整流程，不得先露出可點擊 stub／空承諾。

所以本輪新研究的問題只能是：**有沒有一個足夠小、足夠完整的「生成後精準加一行字」finishing action 值得做？** 而不是重新開啟完整文字／圖層編輯器方向。

### 現有 active work / 不搶 scope

- #11：production abuse-control fail-closed release-path，仍是既有 P1；不得被本研究阻塞。
- #7 / #8 / #9 / #10：batch / export / regenerate / moderation reliability，有 active PR/branches。
- #18：provenance / Content Credentials，有 active PR #19；本研究只要求 derived output 不得冒用舊 credential truth，不改 #18 scope。
- #22：Creative Edit Session / Reference Tray；解 session/reference reuse，不是 exact text finishing。
- #23：ephemeral markup → existing FLUX.2 edit；解 spatial target ambiguity，不是 deterministic typography。

寫入前再次搜尋 open/closed Issues、all-state PR 與 branches；沒有找到與 #26 相同 stable fingerprint。新 Issue 不修改既有 thread，因此未取得／搶占既有 Issue lease；active PR scope 全部保持不動。

---

# Product → Market Category

本輪對 `flux-image-gen` 的外部比較只保留以下相關類別：

1. **AI image generation/editing**：Midjourney、Google Pics、Adobe Firefly。
2. **Post-generation finishing**：exact text / deterministic compositing / image transforms。
3. **Same-stack enabling capability**：Cloudflare Images binding + text rasterization。
4. **Do-not-copy boundary**：完整 layer editor、account/collaboration、project system、OCR typography platform、Images storage migration。

---

# External Signals

## A. 直接競品近期變化 — Midjourney 仍在壓縮「附件 → 修改」摩擦

**CONFIRMED｜2026-09-16｜checked 2026-09-18**

Source: https://updates.midjourney.com/alpha-changelog-9-16-26/

Midjourney 9/16 繼續調整 v8.2 editor：附上圖片時 prompt bar 直接變成「What would you like to change?」，draft batch 會展示 source images grid，並改善 mobile/tablet editor 體驗。

### 判定

這強化「生成後立即 refinement」的市場方向，但 fingerprint 仍落在既有 #22（session/reference continuity）與 #23（focused edit），**沒有新的 exact-text root cause**，因此不留言、不重開、不擴 scope。

---

## B. 相鄰工作流 — Google Pics / Adobe 把文字修改留在圖片完成流程裡

### Google Pics

**CONFIRMED｜2026-09-01｜checked 2026-09-18**

Source: https://blog.google/products-and-platforms/products/workspace/google-pics/

Google Pics 把 isolate objects、edit text、translate words directly inside images 放進圖片工作流。可移植訊號是：使用者不需要因為「最後一行字」離開原工作流。

### Adobe Firefly Generative Text Edit

**CONFIRMED｜官方文件更新 2026-03-17｜checked 2026-09-18**

Source: https://helpx.adobe.com/firefly/web/create-mood-boards/firefly-boards/generative-text-edit.html

Firefly 可在 flat image 中偵測並修改／刪除既有文字，但官方也明確列出限制：非 Latin、傾斜／旋轉／高度 stylized text 等不可靠。

### 判定

這些產品證明「圖像產生完成後，文字仍是 finishing work」是合理市場工作流；**但它們不證明本 repo 應做 OCR、可編輯文字層或 full design canvas**。`flux-image-gen` 更小的候選方案應先是「在生成結果上 deterministic 疊一行 exact text」。

---

## C. 新工具／技術 — Cloudflare Images text rasterization 讓 exact-text finishing 有更小路徑

**CONFIRMED｜發布 2026-09-02｜checked 2026-09-18**

Primary sources:

- Changelog: https://developers.cloudflare.com/changelog/post/2026-09-02-images-binding-updates/
- Binding: https://developers.cloudflare.com/images/optimization/binding/
- Overlays: https://developers.cloudflare.com/images/optimization/draw-overlays/
- Pricing: https://developers.cloudflare.com/images/pricing/

第一方文件確認：

- `.text(content, options)` 可 rasterize text；
- 支援 font / size / color；
- `.draw()` 可把文字 handle 疊在 base image；
- `cf.image.draw[]` 也可直接帶 `text`；
- text 最長 1,000 chars，輸出上限 4096×4096；
- Images Free 每月最多 5,000 unique transformations；超過後新的 transformation 回 `9422`，不是自動計費；Paid 才在 included quota 後按 transformation 收費。

### User job / saved step

Current repo fixture：

`生成咖啡店開幕海報 → 模型可能把「明日開幕」畫錯 → 產品提示使用者去外部工具後製加字`

可研究的更短流程：

`生成背景 → 在同產品用 deterministic exact-text finishing → 下載／保存 derived revision`

### 關鍵限制

Cloudflare capability **不是自動採用理由**。repo 同時有 FastAPI twin；新增 Images binding 會增加 Worker-specific dependency、usage/cost 與 config responsibility。若 browser-local Canvas 已能可靠完成同一工作，就應優先 browser-local；若 current warning 本身已足夠且真人需求很低，就應 REJECT。

---

# New Releases

1. **Cloudflare Images text rasterization — 2026-09-02**：本輪唯一真正改變產品可行性判斷的新 capability；從「只能提醒後製」變成「同產品或本機 deterministic finishing 值得做 bounded experiment」。
2. **Midjourney Alpha editor — 2026-09-16**：近期但只補強已追蹤的 edit/session friction，沒有新 Issue。
3. **OpenAI Images 2.5 — 2026-09-08**：先前已由 #23 納入 focused/spatial editing，避免重複。

---

# Community Pain

本輪**沒有**把 Reddit／HN anecdotes 當發生率，也沒有找到足以證明 `flux-image-gen` 使用者高頻因文字失敗流失的真人資料。

因此：

- `User Pain frequency = UNKNOWN`
- 不升 P1/P2；
- 不捏造「可省幾分鐘」「提升幾%完成率」；
- 只因 repo 已有可重播 text-rendering fixture + 明確跨工具後製步驟，允許建立 bounded research。

---

# Adjacent Ideas

## 1. Deterministic finishing 應與 generative editing 分層

「背景／主體創意」可以交給生成模型；「必須逐字正確的標題」應優先走 deterministic layer/overlay。這是一個可跨媒體產品重用的設計原則，但本輪沒有檢查其他 repo 的 current contract，因此**只記中央雷達，不建立跨 repo Issue**。

## 2. Derived output 不等於原 credential

任何 Canvas/Images transform 都可能重新編碼 bytes。即使 #18 未來能驗證上游 C2PA/Content Credentials，也不能把 upstream verified badge silent copy 到 transformed output。研究只需記 `derived_from` / provenance state；不需要另建 provenance framework。

---

# Opportunity Map — `flux-image-gen`

| Class | Decision |
|---|---|
| MUST MATCH | 先完成 #11 production abuse-control release truth，以及 #7–#10 reliability；這些仍高於新功能研究。 |
| SHOULD BE BETTER | 對已有 poster/thumbnail/social 用途，驗證 exact short text 是否能在產品內完成，而不是永遠要求外部後製。 |
| DIFFERENTIATOR | 中文優先、低摩擦、local-first history/privacy + truthful provider/cost/provenance；不是功能數量。 |
| ADJACENT IDEA | Browser Canvas 或 Cloudflare Images text overlay；先 local proof，只有不足才碰 binding。 |
| DO NOT COPY | Canva/Photoshop layer editor、OCR／字體 marketplace、project/account/collaboration、Cloudflare Images storage/Direct Upload 整包導入、為了文字直接換生成模型。 |

---

# Four-gate calibration — Issue #26

## 1. 問題／價值

- Target user：用現有產品產生海報、縮圖、社群素材並需要 exact visible text 的使用者。
- Repo evidence：`eval/product-test-prompts.json` 已有「明日開幕」fixture，現行預期是顯示亂碼風險＋建議外部後製加字。
- Existing alternative：外部 Canva/Photoshop/其他工具後製；或接受模型文字風險。
- New enabling evidence：Cloudflare 9/2 same-stack text rasterization。
- Counterevidence：真人使用頻率未知；產品近期主動刪減重 UI。
- Gate：**只通過 Research，不通過直接 Build**。

## 2. 優先級

- `kind=RESEARCH`
- `severity=NOT_ESTABLISHED`
- `decision_priority=MEDIUM`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`

#11 P1 與既有 reliability work 保持優先。

## 3. 最小方案

優先順序：

1. **不改**：維持現在外部後製提示；
2. **Browser-local Canvas fixture**：不增加 server/provider/binding；
3. **Cloudflare Images fixture**：只有 browser-local 不足才測 `.text()+.draw()`；
4. 只有 1–3 不足且未來真人證據成立，才考慮更完整文字工具。

不允許從 Cloudflare 新 API 直接跳成 storage migration、layer editor、template engine 或 typography service。

## 4. 研究／實作分離

#26 的 narrow experiment 只比較 3 個 fixed fixtures：

- 海報：「明日開幕」；
- YouTube thumbnail：一行短標題；
- IG social：一行活動／產品標籤。

決策只能是：

- **BUILD**：exact string、download/history/export、成本/privacy/provenance boundary 都能以薄 finishing action成立；
- **NARROW**：只支援單行短標題＋固定位置／樣式；
- **REJECT**：需要重型 editor/font/storage/provider complexity，或效益不足。

即使結果 BUILD，也只支持下一步 owner decision，不自動批准實作／deploy。

---

# Rejected Ideas / 為何不做

1. **直接新增 Cloudflare Images binding 到 production** — REJECT NOW：研究尚未證明 browser-local 不足，也會新增 config/cost responsibility。
2. **把整個 gallery / history 搬進 Cloudflare Images storage** — DO NOT COPY：新 changelog 同時推出 storage/list/upload 能力，但與 exact-text job 無必要因果。
3. **做完整文字／圖層 editor** — REJECT：與近期「刪重 UI、服務 casual generation」產品方向相反；沒有真人價值證據。
4. **用更強 image model 解拼字** — REJECT：exact string 是 deterministic requirement，不應先增加 model/provider variance。
5. **把 #26 合併 #23** — REJECT：#23 是 spatial targeting；#26 是 exact text finishing，trigger/symptom/root cause 不同。
6. **把 transformation 後輸出繼承舊 C2PA badge** — REJECT：bytes 已可能改變，必須重新判定 derived evidence。

---

# Issue Mapping

- **#26 NEW** — exact-text deterministic finishing research。建立後已讀回，URL：https://github.com/Reese-max/flux-image-gen/issues/26
- **#23 unchanged** — spatial markup research；本輪 OpenAI/Midjourney signals 不製造重複 Issue。
- **#22 unchanged** — session/reference reuse；不擴大為 project/editor framework。
- **#18 unchanged / active PR #19** — provenance；只列 #26 downstream constraint。
- **#11 unchanged P1** — production abuse-control release path，仍是更高優先。
- **#7–#10 unchanged / active remediation** — 本輪不搶 scope。

---

# Sources

## First-party / CONFIRMED

1. Cloudflare Images changelog — 2026-09-02 — https://developers.cloudflare.com/changelog/post/2026-09-02-images-binding-updates/
2. Cloudflare Images binding docs — updated 2026-09-02 — https://developers.cloudflare.com/images/optimization/binding/
3. Cloudflare overlays docs — updated 2026-09-02 — https://developers.cloudflare.com/images/optimization/draw-overlays/
4. Cloudflare Images pricing — updated 2026-08-27 — https://developers.cloudflare.com/images/pricing/
5. Midjourney Alpha changelog — 2026-09-16 — https://updates.midjourney.com/alpha-changelog-9-16-26/
6. Google Pics — 2026-09-01 — https://blog.google/products-and-platforms/products/workspace/google-pics/
7. Adobe Firefly Generative Text Edit — official doc checked 2026-09-18 — https://helpx.adobe.com/firefly/web/create-mood-boards/firefly-boards/generative-text-edit.html

沒有把 vendor marketing claims 當獨立成效測量；沒有使用 community anecdotes 估計 prevalence。

---

# What Changed

相較最近 `flux-image-gen` radar：

- 新增的是 **Cloudflare 2026-09-02 deterministic text rasterization** 對現有「後製加字」人工 handoff 的可行性影響。
- 沒有再開 #22 session continuity、#23 spatial edit、#18 provenance 的同義 Issue。
- 建立 #26，但保持 `NOT_ESTABLISHED / NEEDS_EVIDENCE / auto_implementation=false`。
- 特別把 **browser-local Canvas** 放在 Cloudflare binding 前面，避免「看到新 API 就直接整合」。
- 保留 #11 safety/release work 的更高 priority。

---

# Completion / Gaps / Cursor

**Status: COMPLETE for this radar slice.**

完成：

- fresh owner inventory；
- rules blob re-check；
- current `flux-image-gen` HEAD / product simplification direction / audit / Issues / PRs / branches / historical radar dedupe；
- current public-web A/B/C exploration；
- new Issue pre-write dedupe + post-write read-back；
- unique report write。

尚缺、且刻意不冒稱：

- 沒有真人 user-frequency / completion-rate evidence；
- 沒有執行 browser Canvas fixture；
- 沒有啟用或呼叫 Cloudflare Images binding；
- 沒有驗證中文字體在 Cloudflare Images 的實際 font asset/runtime 行為；
- 沒有驗證 re-encode 後 C2PA/metadata 保留狀態；
- 沒有 production deploy/runtime evidence；
- 不宣告 portfolio CLEAN。

下一個公平輪巡 target：**`Reese-max/google-maps-personal-mcp`**。
