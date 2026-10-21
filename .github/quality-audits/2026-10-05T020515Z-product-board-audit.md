# Product board incremental audit — 2026-10-05T02:05:15Z

Status: **PARTIAL / NOT_CLEAN**  
Rules: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md` blob `8167e10798071d2276addaff6b201c6b0e904a2a`  
Baseline report: [2026-10-04T200319Z](https://github.com/Reese-max/autodev-ng/pull/146)  
Write scope: audit-only; no product source, CI/config, merge, deploy, worker, provider, paid action, secret, permission, or production-data mutation.

## Discovery and inventory

The connected owner inventory was fully paginated: **46 repositories**, **45 active**, one archived (`obsidian-vault`). All active default refs were read. Compared with the prior complete snapshot, 13 default branches moved; `autodev-ng` advanced once more during this run and was re-read before this report branch was created.

| Repository | Inspected default HEAD | Delta classification |
|---|---|---|
| ai-flight-radar | `03102534e8fb4794cf5897423d108035662fd3bc` | Product fix + exact-head checks |
| ai-novel-workstation | `bfa7912d46995a8a006e44abc175562502fc7029` | Product/CI merges; deferred deep review |
| autodev-ng | `4babd0fcd5c054c82ed76dc722295b961a429f88` | Product/CI merges; rule blob unchanged |
| chatgpt-dual-pipeline | `747fd8a59f789f0572dd7c4bb88fd1c95934feef` | Product/CI merges; deferred deep review |
| neciken-summer-poem | `d54daa39867374534fa340df5fa6fb7e8062e18c` | Product/CI merge; next fair deep target |
| ninax-line-hermes | `2c3b3740312a9fd4b73b4f7344eb8953bb8f11e2` | Product/CI merge; deferred |
| note-filler | `7d5ae038422139e442a80b8faa1520a77eb1cf6f` | Documentation-only README merge |
| project-doctor-web | `da58a0193ca720b26b609035f878db7ab95cb641` | Product fixes; known trackers, deferred |
| prompt-autoresearch | `b26b0b44d37f3892fe1540254f81a0b413b22fa5` | Product/docs merge; deferred |
| spotify-playlist-organizer-mcp | `a8de3a800b7d23397b4e92b7b8de8b1c57715ba8` | Tests/docs merge; deferred |
| tick-stock-panel | `6a220174afb3bc1c50bd6250490c56aeaa97b81c` | Known #10 fix merge; deferred regression |
| video-timeline-pipeline | `33c17df24790df05527e6c425eef9972a3e72eff` | #42/#43 fixes landed; regression review below |
| voice-actress | `f11169080682d49d8485bb5fcbf53556aca795c5` | Broad product merge; deferred deep review |

The other 32 active HEADs matched the prior baseline. Missing deep review for the deferred deltas is explicitly retained as remaining work; this report does not claim full-portfolio completion.

## Exact regression evidence

### ai-flight-radar — VERIFIED_FIXED

Issue [#2](https://github.com/Reese-max/ai-flight-radar/issues/2) is closed at default `03102534e8fb4794cf5897423d108035662fd3bc`. The merged graph includes committed Python hash locks, `cloudflare/package-lock.json`, deterministic install commands, immutable Action pins, regeneration drift coverage, and the SQLModel UTC-naive storage repair.

Exact default-head checks completed successfully on 2026-10-05 UTC:

- [tests](https://github.com/Reese-max/ai-flight-radar/actions/runs/37252619737/job/111583180792)
- [container-smoke](https://github.com/Reese-max/ai-flight-radar/actions/runs/37252619737/job/111583180955)
- [drift](https://github.com/Reese-max/ai-flight-radar/actions/runs/37252619883/job/111583181080)

This meets #2's stated CI-sufficient closure requirement. No production deployment or provider call is inferred or required.

### video-timeline-pipeline #42 — PARTIALLY_FIXED / NEEDS_RUNTIME_VERIFICATION

PRs [#46](https://github.com/Reese-max/video-timeline-pipeline/pull/46) and [#47](https://github.com/Reese-max/video-timeline-pipeline/pull/47) are merged; Issue [#42](https://github.com/Reese-max/video-timeline-pipeline/issues/42) was closed as completed. Default source now:

- returns structured `MEDIA_EXPIRED` after retained media disappears;
- uses strict manifest reads for the completed-operation refresh path;
- propagates manifest/media inspection errors;
- clears visible media, evidence rows, findings and Drive handoff.

However, the exact merged PR #47 review identified a still-reachable default-path defect: `acceptOperation()` saves widget state before terminal handling, then `clearExpiredMedia()` clears visible state without another `saveState()`. The host-facing `modelContent` can therefore continue to claim prior analysis after `get_video_job` returns `MEDIA_EXPIRED`. Tracking: [PR #47 review thread](https://github.com/Reese-max/video-timeline-pipeline/pull/47#discussion_r4180157117).

Classification remains **BUG / P2 / HIGH / SOURCE_CONFIRMED / NEEDS_RUNTIME_VERIFICATION**. The minimal correction is bounded: persist state immediately after clearing expired media, plus a regression asserting host `widgetState.modelContent` no longer claims analysis. No new Issue was opened because the merged review thread already tracks the exact root and active retention branches/PR #45 remain; this run did not seize that scope.

Default `33c17df...` has zero Actions workflow runs, zero check runs, and zero commit statuses. Merge/closure is not runtime verification.

### video-timeline-pipeline #43 — CANNOT_VERIFY / NEEDS_RUNTIME_VERIFICATION

PR [#44](https://github.com/Reese-max/video-timeline-pipeline/pull/44) is merged and Issue [#43](https://github.com/Reese-max/video-timeline-pipeline/issues/43) remains open. Source inspection confirms the follow-up preserves the queue worker supervisor boundary, creates an owned POSIX process group only for synchronous calls, and binds synchronous Windows calls to the existing Job Object cleanup path. This addresses the two earlier review objections in source.

No exact-default checks/statuses exist, and no isolated POSIX heartbeat or Windows descendant test was executed in this audit environment. Therefore this is not `VERIFIED_FIXED`.

## Competitor and substitute refresh

Official pages were rechecked on 2026-10-05 UTC. Product claims are not outcome evidence.

| Product / workflow | Current official signal | Implication |
|---|---|---|
| [Adobe Premiere Media Intelligence](https://helpx.adobe.com/sg/premiere/desktop/organize-media/file-organization/media-intelligence-and-search-panel.html) | Search exact clip ranges; FAQ updated 2026-08-19; visual search remains desktop/editor oriented | SHOULD BE BETTER on inspectable evidence; do not copy a full NLE |
| [Descript](https://www.descript.com/pricing) | Text-based editing with plan media-hour/AI-credit limits | MUST MATCH clear progress and recovery; do not copy subscription breadth |
| [Twelve Labs](https://docs.twelvelabs.io/docs/get-started/release-notes) | API-first indexing/search; current release notes include lifecycle and pricing changes | MUST MATCH structured async/expiry states; do not copy hosted indexing |
| [Azure AI Video Indexer](https://learn.microsoft.com/en-us/azure/azure-video-indexer/video-indexer-search) | Search transcript/OCR/insights and jump to exact moments; cloud pay-as-you-go workflow | SHOULD BE BETTER on local privacy/cost visibility |

MUST MATCH: truthful lifecycle/error states, bounded cancellation, visible progress, recoverable jobs.  
SHOULD BE BETTER: local-first privacy, source-to-evidence traceability, deterministic no-provider tests.  
DIFFERENTIATOR: inspectable URL/local-video → transcript/timeline/evidence workflow.  
DO NOT COPY: full editor, hosted tenancy, mobile collaboration, broad provider/platform matrix without evidence.

## Synthetic product board

These are model-simulated viewpoints, not independent expert votes.

| View | Judgment |
|---|---|
| CEO | If only three things: persist truthful expired state, execute #43 cross-platform fixtures, keep reproducible builds green. Do not add editing/mobile/hosted indexing. |
| CPO | Closing #42 while host-facing stale analysis remains is a user-trust gap; restore the acceptance contract before new features. |
| CTO | Use one additional `saveState()` and existing test harness; no new state machine. |
| Staff/Principal Engineer | #43 source shape is now bounded; verification, not redesign, is the remaining step. |
| UX/Research | Visible evidence clearing is good, but host/model state must tell the same story. |
| Growth | Reliability of reopen/recovery precedes acquisition features. |
| CFO | Reproducible builds reduce uncertainty, but no ROI is claimed. |
| Security/Privacy | Stale analysis after source expiry is a provenance/privacy boundary, but current evidence supports P2, not P1. |
| QA | Merge and green unrelated review are insufficient; test the exact default path and persisted widget state. |
| SRE | Keep timeout, cancellation and retention expiry distinct and machine-readable. |
| Accessibility | Text status exists; keyboard/screen-reader regression still lacks execution. |
| Support | One truthful expired receipt is more useful than another feature surface. |

## 50 synthetic personas

Thirty regression baselines and twenty exploratory personas were retained. This simulation does not replace fixed A01–J05 and does not establish prevalence or ROI.

| ID | Background / constraint | Goal / journey | Friction / result | Triage / evidence |
|---|---|---|---|---|
| R01 | 影片重開使用者 | retention 後恢復 | default 已回 structured expiry；缺 runtime | PARTIALLY_FIXED / #42 |
| R02 | ChatGPT widget 使用者 | 背景 poll 後過期 | 畫面清除但 modelContent 可保留舊分析 | P2 / PR #47 review |
| R03 | 支援工程師 | 解釋過期狀態 | 有明確 MEDIA_EXPIRED | 改善；runtime pending |
| R04 | 證據稽核者 | 過期後確認引用 | 可見證據清除；host state 未再保存 | P2 / static confirmed |
| R05 | 同 job-ID 重準備使用者 | 過期後重新 prepare | 測試存在；default 無 checks | NEEDS_RUNTIME_VERIFICATION |
| R06 | Drive 交接使用者 | 過期後檢查交接 | 可見 handoff 清除 | SOURCE_CONFIRMED |
| R07 | 鍵盤/讀屏使用者 | 讀取過期提示 | 有文字狀態；未做 a11y runtime | NEEDS_RUNTIME_VERIFICATION |
| R08 | 同步 CLI 操作者 | timeout 後停止 command tree | POSIX group cleanup 已入 default | CANNOT_VERIFY / #43 |
| R09 | Windows 操作者 | timeout 後停止 FFmpeg descendants | Job Object 路徑已入 default | CANNOT_VERIFY / #43 |
| R10 | queue worker 操作者 | parent death 清理 | source 保留 worker supervisor boundary | CANNOT_VERIFY / #43 |
| R11 | 本機開發者 | fresh Python install | hash lock 已提交 | VERIFIED_FIXED / ai-flight #2 |
| R12 | Cloudflare 開發者 | fresh npm install | package lock + npm ci gate | VERIFIED_FIXED |
| R13 | Docker 操作者 | 從 lock 啟動服務 | exact-head container-smoke success | VERIFIED_FIXED |
| R14 | 供應鏈審查者 | 重建 dependency graph | drift check success | VERIFIED_FIXED |
| R15 | 回滾操作者 | 重建舊 dependency graph | 文件與 locks 已落地 | VERIFIED_FIXED |
| R16 | CI 維護者 | manifest 未同步時 fail | drift job 存在且成功 | VERIFIED_FIXED |
| R17 | 日期資料維護者 | 新 SQLModel lock 啟動 | timezone=False regression tests landed | VERIFIED_FIXED |
| R18 | minideck 作者 | 建立/修訂 deck | default 未變 | NO_NEW_FINDING |
| R19 | minideck 分享者 | 隱藏歷史版本 | 既有 #2/PR #3 追蹤 | DEDUPLICATED |
| R20 | minideck 發布者 | 草稿不公開 | 既有 #4/#5 與 PRs | DEDUPLICATED |
| R21 | minideck OAuth owner | idempotency replay | 既有 #10/active PRs | SKIPPED_LOCKED |
| R22 | minideck SRE | expired lease recovery | 既有 #9/active PRs | SKIPPED_LOCKED |
| R23 | minideck 資安 | 敏感 claim egress | 既有 #12/PR #24 | SKIPPED_LOCKED |
| R24 | minideck QA | visual judge coverage | 既有 #11/PR #23 | SKIPPED_LOCKED |
| R25 | minideck 部署者 | named env bindings | 既有 #14/PR #28 | SKIPPED_LOCKED |
| R26 | minideck 修訂者 | slide scope integrity | 既有 #13/PR #19 | SKIPPED_LOCKED |
| R27 | 慢網路使用者 | 背景狀態恢復 | 本輪未執行網路 fault | UNKNOWN |
| R28 | 無 provider 開發者 | 離線測試 | 未呼叫 provider | 維持安全邊界 |
| R29 | 成本敏感者 | 避免 timeout 後資源延續 | #43 尚需 runtime | HIGH / runtime pending |
| R30 | 隱私敏感者 | retention 後不殘留內容 | host model state 尚可殘留 | P2 / review thread |
| E01 | PR reviewer | 合併後追 review finding | PR #47 finding 已在 default | ACTIONABLE / tracked |
| E02 | 事故應變者 | 辨識 fix 是否真完成 | merge 不等於驗證 | 保留 PARTIALLY_FIXED |
| E03 | 跨平台 QA | Windows process tree | 無 exact-head test | NEEDS_RUNTIME_VERIFICATION |
| E04 | Linux QA | POSIX descendant heartbeat | 無 exact-head test | NEEDS_RUNTIME_VERIFICATION |
| E05 | host state 研究者 | widgetState remount | modelContent 保存順序缺口 | P2 / static |
| E06 | AI 安全研究者 | 避免 stale evidence 進 prompt | 可見層清除但 host 可讀舊描述 | P2 |
| E07 | 平台整合者 | operation expiry callback | acceptOperation 先 save 再 clear | P2 |
| E08 | 產品經理 | 只做三件事 | 先關閉已落地但未驗證的 reliability | NOW |
| E09 | CTO | 避免新 framework | 在 clear 後再 save 即可 | 最小局部修正 |
| E10 | CFO | 鎖定 build 可重現性 | 不宣稱 ROI | VERIFY_ONLY |
| E11 | Growth | 新功能 vs reliability | 不新增 editor/mobile | DON'T |
| E12 | Support | 過期恢復文案 | 已有明確提示 | 維持 |
| E13 | Accessibility | 狀態文字與焦點 | 只有靜態證據 | NEEDS_EVIDENCE |
| E14 | 資料工程師 | manifest corruption | strict read 回傳真錯誤 | SOURCE_CONFIRMED |
| E15 | 可靠性工程師 | exact-head CI | video 無 checks；ai-flight 3 green | 分開判定 |
| E16 | repo owner | Issue 關閉決策 | #42 已 completed；不自動重開 | 尊重 owner / tracked review |
| E17 | 稽核者 | fair cursor | minideck 完成增量核對 | next neciken |
| E18 | 競品切換使用者 | 需要 hosted search/edit | 模擬不足以立案 | NO ISSUE |
| E19 | 本地優先使用者 | 避免雲端索引 | 差異化仍成立 | MAINTAIN |
| E20 | 維護者 | 13 repos 同時前進 | 先分流已知高風險與 runtime | PARTIAL |

Synthetic preference share was not calculated; these rows are scenario coverage, not votes.

## Red Team

- Counterevidence accepted: #42's original server exception and visible stale-evidence UI paths are substantially addressed; the remaining defect is narrower host-state persistence.
- Counterevidence accepted: #43's source now uses existing process ownership primitives; a new supervisor framework is unnecessary.
- Counterevidence rejected: Issue closure or merge alone does not satisfy #42/#43 runtime requirements.
- Counterevidence accepted: `minideck@31f7131a` default is unchanged; active Issues #9–#14 and open PRs already own observed Runner/idempotency/publish/security roots. No duplicate issue was opened.
- Environment limit: the connected repository API supplied exact source and hosted check evidence, but this workspace could not authenticate a private checkout; no local test execution is claimed.
- No competitor feature, model vote, missing framework, or broad architecture preference is treated as a defect.

## NOW / NEXT / LATER / DON'T

- **NOW:** track the PR #47 modelContent persistence finding; execute exact-default #42/#43 isolated regressions.
- **NEXT:** deep-review `neciken-summer-poem@d54daa3` and remaining changed-default repos by risk/fair cursor.
- **LATER:** revisit broader market direction only after reliability receipts and owner evidence.
- **DON'T:** reopen #42 without executed reproduction or new owner decision; create a duplicate Issue; add a state platform; merge/deploy/start workers from this audit.

## Decision memo

- **Serves:** local-first video evidence users and operators who need recoverable, inspectable processing; contributors/operators needing reproducible builds.
- **Why choose/compete:** local provenance and explicit evidence contracts, not feature breadth.
- **Top three priorities:** truthful expired host state; cross-platform command-tree runtime proof; preserve deterministic build gates.
- **Not doing/removing:** no NLE/mobile/collaboration expansion, no hosted-index platform, no new lifecycle framework.
- **Risks/experiments:** one widget-state regression fixture; POSIX + Windows owned-descendant fixtures; monitor exact-head CI receipts.
- **Portfolio recommendation:** `video-timeline-pipeline` = MAINTAIN/SIMPLIFY reliability path; `ai-flight-radar` = MAINTAIN after verified fix; `minideck` = PAUSE new scope while active reliability/security PRs resolve. These are recommendations, not implementation authorization.

## Writes, tracking and completion

- New Issues: 0.
- Reopened: 0.
- Issue comments/labels/state changes: 0.
- New actionable finding: 1, already tracked by PR #47 review thread.
- Verified fixes: 1 (`ai-flight-radar` #2).
- Deduplicated/skipped locked: minideck active issue/PR roots and video retention branch/PR ownership.
- Product implementation/deploy/merge/provider/paid actions: 0.
- Audit report: 1.

Result: **PARTIAL / NOT_CLEAN**. Fixed A01–J05 has not completed two new qualifying rounds and required runtime evidence remains missing. Fair cursor completed for unchanged `minideck@31f7131a`; next fair target remains `neciken-summer-poem@d54daa3` until its deep review completes.
