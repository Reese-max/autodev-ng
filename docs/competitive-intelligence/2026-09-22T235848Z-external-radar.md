# 外部競品／新品／工作流靈感雷達 — 2026-09-22T23:58:48Z

## Status / scope / evidence boundary

- 狀態：**COMPLETE / MATERIAL_CONTEXT_ONLY / ZERO_NEW_ISSUES / NO_NOTIFICATION**。
- 主要情報來源為 Reese-max GitHub 之外的公開網路；GitHub 僅用於 owner inventory、current product truth、方向、Issue/PR 去重與本報告持久化。
- Issue Quality v2：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`，blob SHA `8167e10798071d2276addaff6b201c6b0e904a2a`。
- Fresh connected-owner inventory 已完整分頁至 page 2 空頁：**42 Reese-max-owned repositories / 41 unarchived**；唯一 archived 為 `obsidian-vault`。
- Fair-rotation focus：`Reese-max/soundbox-offline`。
- Focal current default HEAD：`main@68d8137b77be063cc5ae5468e9e31b81455060a9`；最新 default commit 仍為 audit/docs，owner board 記錄的最後 substantive product SHA 為 `44c22cc8d41f5944e0df811c96aa162d49db44e2`。
- Owner-approved direction 重新核對：**INVEST / SIMPLIFY**。優先 local/offline ownership、import fidelity、restore/recovery truth、CI/runtime evidence；不預設擴成 cloud catalog、server-account music service、native rewrite、AI recommendation platform 或 subscription product。
- Open Issues/all-state PR surface 已重新核對。#3/PR #8（LAN/browser import）、#4/PR #6（CI regression gate）、#5/PR #7/#9（RSC patch）都有 active implementation scope；本輪不留言、不改 scope、不搶鎖。
- 本輪未執行 browser/device/IndexedDB/WebRTC、Cloudflare deploy、production mutation、CI trigger、merge、worker/GOAL、secret/permission/settings 變更，也未修改任何產品 source/config。
- 本雷達不宣告 portfolio CLEAN。

## Executive decision

**0 new Issue、0 existing Issue/PR comment、0 issue update/reopen、0 implementation authorization。**

本輪保留兩個新的外部訊號，但都沒有通過建立新 Issue 的四道 Gate：

1. **Trove 在 2026 年 9 月把 local-first 音樂產品擴到 Mac，並把 iPhone/iPad/Mac/Apple Watch + Wi-Fi import + WebDAV/SMB/NAS 做成同一產品面。**這驗證「local-first 不等於單裝置」的市場方向，也再次支持 #3 所處理的跨裝置匯入工作；但 Soundbox 本身已是 PWA，且 #3/PR #8 正在 active scope，沒有證據支持再加 NAS streaming、native Apple stack、CarPlay/Watch 或新的 sync architecture。
2. **Chrome 150（2026-06-30 stable）加入 same-site PWA origin migration，但 WICG explainer 明確把 IndexedDB/Cache Storage 的 local data migration 列為 non-goal。**這對 Soundbox 很重要，因為音訊在 IndexedDB、library/player state 在 browser-local storage；如果未來真的換 origin，不能把「PWA 安裝已成功遷移」誤當成「音樂庫資料也遷移」。目前沒有 planned/current origin migration 證據，所以只留下 operational guardrail；既有 backup/restore 是更小且已存在的 recovery primitive。

這兩項都**沒有推翻 owner 方向，也沒有建立可觀察的 current supported-workflow failure**。因此只寫中央報告，不製造新工單。

## Product → market category mapping

`Reese-max/soundbox-offline` 本輪對照：

- **Direct local-first player / adjacent workflow:** Trove Player — local files + Wi-Fi import + NAS/WebDAV/SMB + multi-device native app；
- **Known direct local/offline players:** Prismatic Music、WaveFlow、Kasette — 前輪已覆蓋 personalization / deterministic mixes / embedded metadata，不重複當成新訊號；
- **Platform/runtime:** Chrome PWA origin migration、browser origin-scoped local data；
- **Existing transfer alternative:** LocalSend / OS file transfer — 仍是 #3 runtime spike 未證明前的較小替代流程。

# External Signals

## A. Trove：local-first 從「本機檔案播放器」擴成跨裝置／網路來源產品面

**Status:** `CONFIRMED current first-party capability`。  
**Event date:** Mac 版為 **2026-09**；官方未在本輪來源提供精確日。  
**Checked:** 2026-09-22 UTC / 2026-09-23 Asia/Taipei。  
**Sources:**
- https://troveplayer.com/
- https://troveplayer.com/about
- https://troveplayer.com/features
- https://troveplayer.com/faq
- https://troveplayer.com/blog/webdav-music-player-iphone-mac

Trove current first-party site 表示：

- 2026 年 9 月加入 Mac，與 iPhone/iPad/Apple Watch 共用同一 App Store listing / codebase；
- local files 可由 Files/folder/Wi-Fi import；
- Pro 可直接連 WebDAV/SMB/NAS，主張無 cloud middleman、無 account；
- free tier 可播放完整 local library；本輪查閱時 Pro 為一次性 **US$9.99**，不是 subscription；
- tags/artwork/lyrics 從檔案讀取；Pro 可把 tag 修正寫回檔案。

### User job / reduced manual work

核心工作不是「更多格式」，而是讓使用者的自有音樂在桌面、手機、Watch、NAS 之間保持可達，少做 `桌面檔案 → 第三方傳檔/雲端 → 手機 Files → 播放器` 的搬運。

### Transferable signal

- #3 的「瀏覽器/Wi-Fi 匯入」確實對應現在 local-first player 的有效 onboarding 模式；
- #10 的 embedded tags 方向也與 Trove「檔案本身是 metadata truth」一致；
- 但「network source as first-class library」是另一種產品模型，不等於 Soundbox 現在必須做 NAS streaming。

### Gate result

```yaml
kind: OPPORTUNITY
severity: NOT_ESTABLISHED
decision_priority: LOW_MEDIUM
evidence: SOURCE_CONFIRMED
triage: NEEDS_EVIDENCE
auto_implementation: false
decision: DEDUPE_TO_3_AND_10_CONTEXT / HOLD_NAS_STREAMING / NO_ISSUE
```

理由：外部產品證明 category pattern，但沒有 Soundbox-specific user evidence 顯示 NAS/跨裝置持續 library 是核心阻塞；#3/PR #8 已 active，不能用競品訊號擴 scope。

## B. Chrome 150：PWA 可以換 origin，但 local library data 不會自動跟著搬

**Status:** `CONFIRMED platform capability + CONFIRMED design non-goal`。  
**Stable:** **2026-06-30 — Chrome 150**。  
**Checked:** 2026-09-22 UTC。  
**Sources:**
- https://developer.chrome.com/release-notes/150
- https://developer.chrome.com/blog/seamless-pwa-origin-migration
- https://github.com/WICG/manifest-incubations/blob/gh-pages/pwa-migration-explainer.md

Chrome 150 提供 same-site PWA origin migration：新 origin manifest 以 `migrate_from` 宣告前身，舊 origin 以 `/.well-known/web-app-origin-association` 雙向授權；destination 需要 stable manifest `id`。Soundbox current manifest 已有 `"id": "/"`、`start_url`/`scope` 為 `/`，因此不是缺 manifest identity 的 current bug。

但 WICG migration explainer 明確將 **Data Migration** 排除在 initial feature 範圍外：IndexedDB / Cache Storage 等本機資料要由開發者自己處理。這與 Soundbox 的產品 truth 直接相關：README 明列音訊 Blob 在 IndexedDB，播放清單/播放器狀態存在 browser-local storage，且清網站資料或 profile 會移除。

### Minimum operational consequence

如果未來要改正式 origin，最小安全流程不是建立 migration service，而是：

1. 先把 existing versioned library backup/restore 當成資料搬移 primitive；
2. 明確驗證新 origin 是「空 local store」還是另有資料搬移路徑；
3. 不以 Chrome 顯示 PWA migration success 推論 library migrated；
4. 只有真的有 origin change proposal 時，才建立 bounded migration checklist/runtime acceptance。

目前沒有 origin-change roadmap、deployed-domain change 或真實資料遺失證據，因此不建立 Issue。

```yaml
kind: MAINTENANCE
severity: NOT_ESTABLISHED
decision_priority: LOW
evidence: SOURCE_CONFIRMED_PLATFORM_CONSTRAINT
triage: DEFERRED_UNTIL_TRIGGER
implementation_authority: false
decision: CENTRAL_GUARDRAIL_ONLY
```

## C. Chrome Local Network Access：不要因新 transport 可用就擴 #3

**Status:** `CONFIRMED platform change; no new Soundbox fingerprint`。  
**Sources:**
- https://developer.chrome.com/blog/local-network-access
- https://developer.chrome.com/release-notes/145
- https://developer.chrome.com/release-notes/147

Chrome 142 起 local-network requests 進入 permission model；145 將 local/loopback permissions 拆開；147 又把 WebTransport 與 WebSocket 的 local-network access 納入 permission restrictions。這代表 browser-based LAN transport 的 permission/runtime surface 還在演進。

然而 open PR #8 目前使用的是 WebRTC DataChannel，且本來就標示 **live browser/WebRTC transfer 未實測**。本輪沒有取得足以把 Chrome WebTransport/WebSocket 規則直接套成 PR #8 WebRTC failure 的第一手執行證據，因此只強化既有 `NEEDS_RUNTIME_VERIFICATION`，不留言、不改 scope，也不要求改 transport。

# New Releases / strategy changes

| Date | Product/platform | Change | Decision |
|---|---|---|---|
| 2026-09（精確日未確認） | Trove | 同一 local-first 產品擴到 Mac，與 iOS/Watch、Wi-Fi import、NAS sources 合一 | 支持 #3/#10 的方向背景；NAS/native expansion `HOLD` |
| 2026-06-30 | Chrome 150 | same-site PWA origin migration | useful operational capability，但不能當資料搬移 |
| 2026-06（design contract current） | PWA migration spec/explainer | IndexedDB/Cache Storage data migration 為 non-goal | 對 local-first app 是重要 guardrail；沒有 current trigger，不立案 |
| 2026 releases | Chrome 142/145/147 | Local Network Access permissions 持續擴張 | #3/PR #8 保持 real-browser/device verification，不擴架構 |

# Community Pain

本輪沒有新的 community signal 足以提升 Soundbox-specific User Pain、發生率或 decision priority。前輪已記錄的本機音樂 rediscovery／傳檔 anecdote 不重複引用；沒有用 Reddit/HN 個案推算普遍需求、留存或 ROI。

# Adjacent Ideas

### 1. Network source ≠ cloud account — HOLD

Trove 顯示 local-first 產品可以把 NAS/WebDAV/SMB 當第一級來源，不必經 vendor cloud。這是有效產品模式，但對 Soundbox 目前最小方案仍是 existing local import + #3 bounded browser transfer。只有當 owner/user evidence 顯示「音樂庫大到不適合複製到手機」是核心工作時，才值得問一個窄研究問題：**read-only network source 是否比 repeated manual subset transfer 更能完成核心 job？**

研究若未來啟動，第一步也只應是 read-only single-source spike；不先做 server account、sync engine、media catalog backend 或 bidirectional delete。

### 2. Origin-change runbook — trigger-based, not a feature

未來若 Cloudflare hostname/custom domain 真要變更，才把「PWA install migration + library backup/restore + clean-origin verification」列入 release checklist。現在沒有 trigger，所以不建立永久 framework/registry。

# Opportunity Map — `soundbox-offline`

| Category | Current decision |
|---|---|
| **MUST MATCH** | local import/playback、offline truth、storage integrity、backup/restore、bounded failure、可信 runtime/CI evidence |
| **SHOULD BE BETTER** | 優先保留 file-owned title/artist/album，再 fallback filename/default — 已 #10 |
| **DIFFERENTIATOR** | 無帳號/無 server music library + 使用者可帶走 backup；#3 只有在真實 device/browser path 成立後才成為 LAN onboarding differentiator |
| **ADJACENT IDEA** | NAS/WebDAV/SMB read-only source；只有 owner/user pain 出現才做 bounded research |
| **DO NOT COPY** | native Apple rewrite、CarPlay/Watch scope、cloud music account、server catalog、automatic bidirectional sync、AI/recommendation platform、monetization redesign |

# Four-gate review

## Candidate 1 — NAS/network library source

1. **Problem/value:** competitor proves a category workflow, but no Soundbox user observation shows device storage/subset transfer is a current core blocker. #3 already tackles the smaller transfer job.
2. **Priority:** `OPPORTUNITY / NOT_ESTABLISHED / LOW_MEDIUM / NEEDS_EVIDENCE`；不是 P2。
3. **Minimum:** no change now. If evidence appears, read-only one-source spike before sync/database/account work.
4. **Research vs implementation:** no research Issue; central hypothesis only. `auto_implementation=false`.

**Gate: FAIL issue creation.**

## Candidate 2 — PWA origin migration safety

1. **Problem/value:** platform constraint is real, but current repo has no proposed/observed origin change. Manifest already has stable `id`.
2. **Priority:** `MAINTENANCE / NOT_ESTABLISHED / LOW / DEFERRED_UNTIL_TRIGGER`.
3. **Minimum:** reuse existing backup/restore and explicit migration checklist only when a domain-change trigger exists.
4. **Research vs implementation:** no current BUILD question; no Issue.

**Gate: FAIL issue creation.**

# Cross-portfolio ideas

沒有足夠 repo-specific evidence 建立跨 portfolio 共用能力。PWA origin-change safety 可能適用其他 local-first web apps，但本輪沒有逐 repo 驗證哪些產品持有 irreplaceable origin-scoped data，因此不把它膨脹成 shared migration framework。

# Rejected Ideas

- **新增 NAS/WebDAV/SMB streaming Issue：**缺 owner/user pain，且會把 Soundbox 從 offline-owned copy 模式拉向 network-source player；保留 HOLD。
- **因 Trove 加 Mac 而做 native desktop app：**Soundbox 已是 web/PWA，可跨桌面/手機；native rewrite 仍違反既有方向。
- **擴 #10 到 cover art/lyrics/tag write-back：**#10 的 minimum 是 title/artist/album preservation；競品有功能不構成擴 scope 證據。
- **擴 #3/PR #8 到 WebTransport/WebSocket/multi-transport framework：**Chrome LNA 變化更支持實測當前最小 transport，而不是新增 abstraction。
- **建立 PWA migration service/registry：**沒有 origin-change trigger；既有 backup/restore 是更小 primitive。
- **把 Chrome 150 IndexedDB backend 改動當成資料安全修復：**browser implementation improvement 不等於 Soundbox restore correctness，也不能取代 #1 的產品層資料完整性工作。

# Issue Mapping / coordination

| Signal / fingerprint | Existing mapping | Decision |
|---|---|---|
| local file tags should remain source truth | #10 | Trove strengthens context only; no scope expansion/comment |
| same-network browser/Wi-Fi import | #3 / active PR #8 | competitor support exists, but `SKIPPED_LOCKED`; no comment/lock |
| destructive/unsafe restore correctness | #1 | PWA origin migration does not alter root cause/severity; existing backup is only future migration primitive |
| CI test admission/coverage | #4 / active PR #6 | no new external evidence changing decision |
| RSC upstream patch | #5 / active PR #7/#9 | no new external evidence changing decision |
| NAS/WebDAV/SMB source | none | central `OPPORTUNITY/HOLD`; insufficient issue gate |
| PWA origin-change data runbook | none | trigger-based maintenance note only |

No Issue lock was acquired because no Issue/PR/shared issue-state was modified.

# Sources

Public web, checked 2026-09-22 UTC / 2026-09-23 Asia/Taipei:

- Trove current product: https://troveplayer.com/
- Trove about / September 2026 Mac expansion: https://troveplayer.com/about
- Trove feature matrix: https://troveplayer.com/features
- Trove FAQ / cross-device and CarPlay details: https://troveplayer.com/faq
- Trove WebDAV guide, published 2026-07-05, updated 2026-09-07: https://troveplayer.com/blog/webdav-music-player-iphone-mac
- Chrome 150 release notes, stable 2026-06-30: https://developer.chrome.com/release-notes/150
- Chrome PWA origin migration article, published 2026-06-03: https://developer.chrome.com/blog/seamless-pwa-origin-migration
- WICG PWA migration explainer: https://github.com/WICG/manifest-incubations/blob/gh-pages/pwa-migration-explainer.md
- Chrome Local Network Access article: https://developer.chrome.com/blog/local-network-access
- Chrome 145 release notes: https://developer.chrome.com/release-notes/145
- Chrome 147 release notes: https://developer.chrome.com/release-notes/147

GitHub was used only for owner/product/coordination truth:

- `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-16T1958Z-product-board-delta.md`
- `Reese-max/autodev-ng/docs/competitive-intelligence/2026-09-21T100013Z-external-radar.md`
- `Reese-max/autodev-ng/docs/competitive-intelligence/2026-09-22T220038Z-external-radar.md`
- `Reese-max/soundbox-offline` current README/manifest/Issues/all-state PR surface

# What Changed / classification calibration / completion

- Fresh owner inventory: **42 owned / 41 unarchived**, page 2 empty。
- Rules blob: `8167e10798071d2276addaff6b201c6b0e904a2a`。
- Soundbox current HEAD before report write: `68d8137b77be063cc5ae5468e9e31b81455060a9`；本輪沒有產品程式修改。
- New retained external context: Trove September 2026 Mac/cross-device/network-source strategy；Chrome 150 PWA migration + explicit local-data non-goal；Chrome LNA evolution。
- Prior owner direction **INVEST / SIMPLIFY**：unchanged。
- New Issues: **0**。
- Existing Issue updates/comments: **0**。
- PR comments/scope changes: **0**。
- Implementation authorizations: **0**。
- Runtime validations: **0**；未執行路徑不冒充已驗證。
- Notification threshold: **not met**。新訊號只強化 existing direction/active scopes，沒有新的高價值 owner-specific opportunity、重大方向翻轉或需立即決策的競品威脅。
- Portfolio CLEAN: **not declared**。
- Next fair cursor: **`Reese-max/skill-foundry`**。
