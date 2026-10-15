# 外部競品／新品／工作流靈感雷達 — 2026-09-24T02:03:41Z

## Status / scope / evidence boundary

- 狀態：**COMPLETE / NO_MATERIAL_NEW_SIGNAL / ZERO_NEW_ISSUE**。
- 本輪主要市場情報來自 GitHub 之外的公開網路；GitHub 只用於 owner inventory、目前產品真值、owner 核定方向、去重、active ownership 與本報告持久化。
- Issue Quality v2：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`，blob SHA **`8167e10798071d2276addaff6b201c6b0e904a2a`**。
- Fresh connected-owner inventory 已完整分頁至空頁：**42 Reese-max-owned repositories / 41 unarchived / 1 archived**；`obsidian-vault` archived，排除。
- 最新 pending radar cursor 來自 `autodev-ng` PR #85：`exam-archive` 已處理，下一個 target 為 `Reese-max/flux-image-gen`。
- Focal default branch：**`main@dfadcf30ca1d3daf479e05dd97aa457afa265333`**；該 HEAD 為 audit/docs commit，最近 substantive security baseline 仍為 `ce69e934e43df5a9cc0d76337414c63d82b778de`。
- Owner direction 沿用最近已核定的 **安全／可靠性／provider-cost truth／provenance 優先，簡化而非擴成完整 editor、帳號雲端專案或 provider framework**。
- 本輪沒有執行 production deploy、正式 provider 付費呼叫、真實使用者測試、手機真機、正式資料寫入，也不宣告 portfolio CLEAN。

## Coordination / current ownership

寫入中央報告前重新核對 current PR / branch / comments：

- PR #21 仍 open，直接處理 #7–#10 的 batch retry、export、regenerate、moderation；其 review 已指出 Workers AI timeout 可能造成 uncancellable duplicate call、retry 成本低估、seed 漂移與 moderation 過度攔截。這些 provider retry / cost truth / moderation 路徑均視為 **active scope**，本輪不搶改、不留言。
- PR #19 仍 open，直接處理 #18 provenance/C2PA 並同時觸及 #7–#10；Issue #18 comment 已記錄它與 #21 有 overlap、需人工決定 merge 順序。本輪不調整 #18 scope。
- #26 已於 2026-09-21 完成一輪窄實驗，結論為 **NARROW**：local deterministic raster 對單行短中文字可行，但 Browser Canvas、history/localStorage、derived lineage 與 C2PA transform boundary 仍未實測；沒有因此授權 BUILD。
- #23 與 #22 本輪沒有新的 issue comment；既有研究仍是 spatial target 與 edit-session continuity，不因本輪市場掃描擴大。
- branches 仍存在 `devin-cli/user-bugs-7-10`、`feature/issues-7-8-9-10-18`、`feat/edit-tab-toolkit` 等相關工作分支；因此本輪不建立任何產品 branch 或 Issue lease。

四道 Gate 前即已存在 active ownership 的相近 fingerprint，全部維持 `SKIPPED_LOCKED/DEDUPE`；外部新證據若只是支持同一 root cause，只進本報告。

# Product → market category mapping

`Reese-max/flux-image-gen` 本輪對照：

- **Direct image generation/editing:** Midjourney V8.2 editor、OpenAI ChatGPT Images 2.5、Adobe Firefly / Photoshop image editor。
- **Adjacent creative workflow:** Google Vids 的 template / generation / watermark packaging；只看可移植的 provenance 與低摩擦 finishing pattern，不把 image product 擴成 video suite。
- **Enabling stack:** Cloudflare Workers AI / Images；只核對可直接影響現有 Worker path 的能力。
- **Community signal:** Midjourney iterative-edit degradation 與 open image-edit model討論；僅作假設補充，不推估普遍發生率。
- **Do-not-copy boundary:** 新 provider catalog、完整 Canva/Photoshop layer editor、video suite、帳號協作、背景 agent、自動付費生成。

# External Signals

## A. Direct competitors — 9/22 後沒有新的 image-edit strategy change 通過門檻

**Status: CONFIRMED_CURRENT / NO_NET_NEW_SIGNAL**  
**Checked: 2026-09-24**

重新核對：

- Midjourney 最新可見的 V8.2 Alpha editor 重大更新仍是 **2026-09-16**：prompt bar 針對 attached image 改成「What would you like to change?」、draft batch 顯示 source image grid/hover preview，延續 session-edit / reference continuity；沒有找到 9/22 之後的新 image-editor release。  
  Source: https://updates.midjourney.com/alpha-changelog-9-16-26/
- OpenAI ChatGPT Images 2.5 仍是 **2026-09-08** 的 template / Sketch / comment-based focused edit / prompt sharing 更新；已由既有 #23 等雷達吸收，沒有 9/22 後的新 image release。  
  Sources: https://openai.com/index/introducing-chatgpt-images-2-5/ ; https://help.openai.com/en/articles/6825453-chatgpt-release-notes
- Adobe Firefly 的 September 公告仍是 **2026-09-18** 的更多 aspect ratios、longer prompts 等；官方 What's New 頁於 **2026-09-22** 更新，但本輪未看到比既有雷達更新的 image workflow root cause。  
  Sources: https://community.adobe.com/announcements-402/what-s-new-in-adobe-firefly-september-2026-1642552 ; https://helpx.adobe.com/firefly/web/whats-new/new-features/whats-new.html

### Decision

這些產品仍支持「從一次性生成轉向可連續編輯／reference-aware workflow」，但 `flux-image-gen` 已有 #22/#23/#26 對應研究；本輪沒有新的使用者痛點、repo gap 或策略變化足以重開／擴寫 Issue。

## B. Enabling stack — Cloudflare 沒有出現新的 image-specific capability

**Status: CONFIRMED_CURRENT / NO_NET_NEW_STACK_SIGNAL**  
**Checked: 2026-09-24**

Cloudflare Workers AI changelog目前最新與現有 image runtime 直接相關的變化仍是 **2026-09-17 `rejectIfBusy`**；Cloudflare Images 最近相關能力仍是 **2026-09-02 text rasterization / draw overlay**。兩者已分別在前輪映射到「capacity fail-fast research」與 #26 exact-text finishing。

Sources:
- https://developers.cloudflare.com/changelog/product/workers-ai/
- https://developers.cloudflare.com/changelog/post/2026-09-02-images-binding-updates/

沒有新證據證明本產品實際遇到 Workers AI 3040 capacity queue；而 PR #21 正在處理 retry semantics，並已有 review 指出 Workers AI timeout 不可取消時重試可能產生額外 call。故 `rejectIfBusy` 候選仍維持：

`kind=RESEARCH / severity=NOT_ESTABLISHED / decision_priority=MEDIUM / triage=NEEDS_EVIDENCE / auto_implementation=false / SKIPPED_ACTIVE_SCOPE`

不能因平台已有 API 就改成 P2/P1，也不能在 active retry PR 上再疊第二套 recovery。

## C. Adjacent release — Google Vids 9/23 擴大免費 1080p 生成，但不形成 image-product mandate

**Status: CONFIRMED_ADJACENT / DO_NOT_COPY_BY_DEFAULT**  
**Event date: 2026-09-23**  
**Checked: 2026-09-24**  
Source: https://blog.google/products-and-platforms/products/workspace/gemini-omni-in-google-vids/

Google Vids 把 Gemini Omni 1080p video generation、scene duration/transition、templates 與 AI-generated clip digital watermark 放到免費 Google Account workflow。

可移植的訊號只有兩點：

1. beginner creative product 持續把「生成 → 可控 finishing → export」壓成同一工作流；
2. provenance / visible origin signal 正逐漸變成生成媒體的產品層能力。

但對 `flux-image-gen`：
- finishing 已由 #23/#26 研究；
- provenance 已由 #18 / PR #19 處理；
- video generation、timeline、transition、模板庫不是 current owner scope。

因此這是 **ADJACENT IDEA / DEDUPED**，不是新 Feature。

# New Releases

本輪真正新的 9/22 後相鄰 release 只有 Google Vids 2026-09-23；它不改變 `flux-image-gen` 的 image-first 最小產品方案。

沒有找到 9/22 後新的 Midjourney/OpenAI/Adobe/Cloudflare image release 能形成獨立 root cause。未為了湊 A/B/C 數量引入弱訊號。

# Community Pain

近期 community 訊號仍集中在 **iterative edit 對未修改區域造成品質下降**、以及 open image-edit model 在 major/reference edit 的一致性不足：

- Midjourney subreddit 2026-08-30 有使用者回報多次局部 edit 後，未修改區域亦劣化。  
  https://www.reddit.com/r/midjourney/comments/1w2adon/midjourneys_new_editing_interface_reduces_overall/
- Stable Diffusion subreddit 2026-09-17 討論 open image-edit model 對 major/reference edits 的不足。  
  https://www.reddit.com/r/StableDiffusion/comments/1wimkoc/why_havent_we_got_an_sota_open_image_edit_model/

這些是 `COMMUNITY_SIGNAL`，不是發生率或 severity 證據；而 #22 本來就要求 branch/compare/rollback 而非 destructive linear overwrite，#23 也要求觀察 non-target preservation。因此本輪只記為 supporting evidence，不留言、不升級。

# Adjacent Ideas

1. **Result-preservation > mode-count growth**：迭代改圖如果要增加價值，應先證明能保留 parent/reference/未修改區，而不是新增更多 edit mode。
2. **Failure taxonomy 必須維持 provider truth**：capacity / quota / timeout / uncancellable-call 不可被一個 `rate_limited` 重試規則抹平；但目前 PR #21 已是 active owner。
3. **Media provenance 可跨格式借鏡，但不應跨媒體擴 scope**：Google Vids watermark 只補強 #18 的產品價值，不授權做 video。

沒有足夠 evidence 將任何一項升格為 portfolio-wide framework。

# Opportunity Map — `flux-image-gen`

| Class | Decision |
|---|---|
| MUST MATCH | 先完成既有 public abuse-control、batch/export/regenerate/moderation reliability 與 truthful provider/cost evidence；open PR 不等於 main 已修好。 |
| SHOULD BE BETTER | 若 #23/#26 之後有 runtime evidence，局部 edit / exact-text finishing 應以最小 bounded control 減少跨工具 handoff，不新增完整 editor。 |
| DIFFERENTIATOR | 中文/local-first、可重播 seed/reference/history、truthful provider/model/cost/provenance，以及 fail-closed public generation。 |
| ADJACENT IDEA | Google Vids 的「生成 + finishing + provenance signal」可作 packaging 參考；僅重用既有 image workflow。 |
| DO NOT COPY | video suite、layer editor、帳號 collaboration、更多 provider/model catalog、background autonomous generation、為競品 parity 重啟任意 custom-size/control surface。 |

# Four-gate decisions

## Candidate 1 — 9/22 後 direct-competitor delta

1. **Problem/value:** 沒有新的 repo-observable manual break 或 supported-workflow gap。  
2. **Priority:** `kind=OPPORTUNITY_CONTEXT / severity=NOT_ESTABLISHED / decision_priority=LOW / triage=NO_ACTION`。  
3. **Minimum:** 不改產品；沿用 #22/#23/#26 的 bounded research。  
4. **Research/implementation split:** 無新窄問題需要另開 Issue。

**Decision: NO ISSUE.**

## Candidate 2 — Google Vids 9/23 generation + watermark packaging

1. **Problem/value:** 外部產品證明跨媒體 creative suite 持續整合 finishing/provenance，但沒有證據顯示 `flux-image-gen` 使用者需要 video timeline 或 transition。  
2. **Priority:** `kind=OPPORTUNITY / severity=NOT_ESTABLISHED / decision_priority=LOW / triage=DEFERRED_TO_EXISTING_#18_#23_#26`。  
3. **Minimum:** provenance 走 #18，image finishing 走 #23/#26；不新增 video 功能。  
4. **Research/implementation split:** 無新研究問題。

**Decision: DEDUPE / DO NOT COPY video scope.**

## Candidate 3 — provider capacity fail-fast

沿用 2026-09-22 結論：缺本產品 3040 runtime evidence，且 #21 正在 active retry/cost path。  
`kind=RESEARCH / severity=NOT_ESTABLISHED / decision_priority=MEDIUM / triage=NEEDS_EVIDENCE / auto_implementation=false`。

**Decision: SKIPPED_LOCKED / NO ISSUE WRITE.**

# Rejected Ideas

- 新增 video generation / timeline / transitions：與 owner image-first 簡化方向不符，且無 user evidence。
- 新增 Bedrock、更多 image provider 或統一 provider framework：沒有新的 provider pain；會放大成本、測試與 error taxonomy 負擔。
- 完整 Canva/Photoshop-style layer editor：#26 已只支持 NARROW 的 deterministic finishing primitive，沒有證據支持重 UI。
- 以 Reddit anecdote 升 P1/P2：禁止；community signal 只用於提出／補強假設。
- 把 open PR 測試綠燈當 production fixed：禁止；#19/#21 尚未 merge，且 #19 自己仍要求 Preview / real-provider evidence。

# Issue Mapping

- **#18 provenance / Content Credentials**：已有 PR #19 active；Google Vids watermark 是 supporting context，無 scope 修改。
- **#22 Creative Edit Session / Reference Tray**：community iterative degradation 仍支持 branch/compare/rollback，但不是新 root cause；無留言。
- **#23 spatial markup edit**：Midjourney/OpenAI/Adobe pattern 已知；本輪無新 direct release；無留言。
- **#26 deterministic exact-text finishing**：2026-09-21 已得 NARROW；Browser Canvas仍未驗證；本輪不將相鄰產品的文字／模板能力誤當 BUILD 授權。
- **#7–#10 / PR #21**：active reliability owner；provider-retry/cost/moderation related external signals全部 `SKIPPED_LOCKED`。
- **#11**：default branch已有 substantive security fix，但本輪不以 commit/unit tests 冒充完整 runtime acceptance，也不重分類。

本輪：**0 new Issue / 0 Issue or PR comment / 0 scope rewrite / 0 implementation authorization**。

# Cross-portfolio ideas

本輪沒有一個新訊號同時具備跨 repo 可觀察痛點、足夠 external evidence 與最小共用解法，因此 **0 個新的跨 portfolio proposal**。不為填表建立 shared creative framework。

# Sources

Public web（主要情報）：

1. Midjourney, Alpha Changelog 9/16/26 — https://updates.midjourney.com/alpha-changelog-9-16-26/
2. OpenAI, ChatGPT Images 2.5, 2026-09-08 — https://openai.com/index/introducing-chatgpt-images-2-5/
3. Adobe Firefly September 2026 — https://community.adobe.com/announcements-402/what-s-new-in-adobe-firefly-september-2026-1642552
4. Adobe Firefly What's New, checked 2026-09-24 — https://helpx.adobe.com/firefly/web/whats-new/new-features/whats-new.html
5. Cloudflare Workers AI changelog — https://developers.cloudflare.com/changelog/product/workers-ai/
6. Cloudflare Images text rasterization, 2026-09-02 — https://developers.cloudflare.com/changelog/post/2026-09-02-images-binding-updates/
7. Google Vids Gemini Omni, 2026-09-23 — https://blog.google/products-and-platforms/products/workspace/gemini-omni-in-google-vids/
8. Reddit Midjourney iterative edit degradation, 2026-08-30 — https://www.reddit.com/r/midjourney/comments/1w2adon/midjourneys_new_editing_interface_reduces_overall/
9. Reddit Stable Diffusion open image-edit discussion, 2026-09-17 — https://www.reddit.com/r/StableDiffusion/comments/1wimkoc/why_havent_we_got_an_sota_open_image_edit_model/

GitHub（產品真值／去重／協調，不是主要市場情報）：Issue Quality v2、`flux-image-gen` README/current HEAD、#18/#22/#23/#26、PR #19/#21、branches、歷史 radar、owner inventory。

# What Changed

相較 2026-09-22 的 `flux-image-gen` radar：

- **沒有新的 direct image competitor strategy change**；OpenAI/Midjourney/Adobe 的 relevant updates 仍早於上一輪 cutoff。
- **沒有新的 Cloudflare image-specific stack capability**；`rejectIfBusy` 與 Images text rasterization 已在既有研究中。
- 9/23 Google Vids 是 fresh adjacent signal，但只補強「finishing + provenance」包裝，完全可由既有 #18/#23/#26 吸收。
- #26 多了一個已存在於 Issue comments 的 `NARROW` research result：local deterministic raster可行，但 Browser Canvas/runtime chain 未驗證；這使「不要擴完整 editor」的理由更強，而不是新建功能的理由。
- PR #19/#21 仍 active；provider/cost/provenance/reliability 路徑保持不搶鎖。

因此本輪沒有實質產品決策變更，不建立新 Issue，也不通知。

# Classification / scope calibration

- Direct-competitor delta：`OPPORTUNITY_CONTEXT / severity=NOT_ESTABLISHED / LOW / NO_ACTION`。
- Google Vids adjacent packaging：`OPPORTUNITY / severity=NOT_ESTABLISHED / LOW / DEFERRED_TO_EXISTING`。
- Workers AI capacity fail-fast：`RESEARCH / severity=NOT_ESTABLISHED / MEDIUM / NEEDS_EVIDENCE / auto_implementation=false / SKIPPED_ACTIVE_SCOPE`。
- #26 exact-text finishing：維持 `RESEARCH / NOT_ESTABLISHED / NARROW / NEEDS_RUNTIME_VERIFICATION / auto_implementation=false`。
- 既有 reliability/security severity 不因本輪外部市場訊號上調或下調。

# Completion / gaps / cursor

- Fresh owner inventory pagination：**COMPLETE — 42 owned / 41 unarchived / 1 archived; page 2 empty**。
- Rule blob verification：**COMPLETE — `8167e10798071d2276addaff6b201c6b0e904a2a`**。
- Focal current HEAD / README / issues / relevant full comments / all-state PRs / branches：**COMPLETE enough for decision**。
- Public-web exploration：**COMPLETE enough for decision** — direct competitors、platform stack、adjacent fresh release、community signal；未為類別配額硬湊弱訊號。
- Product runtime verification：**NOT RUN**；沒有將 unit/static/vendor claim 冒充正式 runtime evidence。
- Issue writes：**0**。
- Notification gate：**NO** — 沒有 high-value net-new opportunity、重大直接競品策略變化、已證明跨專案共用能力，或推翻 owner direction 的外部證據。
- Fair rotation：`flux-image-gen` processed。**Next cursor: `Reese-max/google-maps-personal-mcp`**。
