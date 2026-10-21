# Product Board Audit — 2026-10-05T19:58:38Z

## 結論與範圍

- 狀態：**PARTIAL / NOT CLEAN**。本輪重新分頁列舉 Reese-max 自有 inventory（45 total／44 active／1 archived），核對上一份 17:04Z 報告後的 default-branch commit，並完成公平游標 `openab-pty` 的 README、manifest、source、tests、deploy/security docs、commits、全部 branches、所有狀態 Issues／PR 與 CI/status 深讀。
- 上輪後 44 個 active repositories 的 default branch 均未前進；不重貼相同 Issue 留言，也不把 audit-only PR 前進當成產品變更。
- 新 actionable finding 0；新 Issue 0；Issue 更新／重開 0；已驗證 regression 0；產品／CI／設定寫入 0。
- `openab-pty@9e1464058335bcba73593651837433c11c9e6eb5` 是 upstream tracking fork：fork main 是 `openabdev/openab-pty` main 的祖先，無 fork-only commit，upstream 多 8 commits。差異包含兩個 upstream 已修 correctness edge cases，但 fork README／images／security routing均指向 upstream，且沒有 Reese-max-specific deployment、Issue 或 roadmap 證據，因此不把同步落差硬開成獨立產品缺陷。
- 下一公平游標：`police-essay-mcp`。

## 規則與證據版本

- Issue quality v2 blob：`8167e10798071d2276addaff6b201c6b0e904a2a`
- 上一份完整 snapshot/report commit：`05e2f1c29ee5865270e4e44f33c5f2f235b588a2`
- openab-pty inspected HEAD：`9e1464058335bcba73593651837433c11c9e6eb5`
- README blob：`ca3767f9f7f5b1dcfc187d4e106d7ba842a21e47`
- runtime session blob：`85db00fac4eca6211ce7fcf4013a31fa4a2fc2ce`
- runtime tools blob：`447e1d8b8422f93707e9285c3d2813a2b1e6c563`
- termfilter blob：`3a819303d718b926ab67fcb03860249d170350e3`
- CI blob：`1b98d5954a8dd1798593d11d0ed2e11ced1cbed5`
- Evidence type：SOURCE_CONFIRMED + STATIC_INFERENCE。沒有 fork exact-head Actions、image build、Kubernetes/ECS、tailnet、real client 或 terminal-application runtime重現。

## Inventory 與增量 discovery

本輪 inventory 與上一輪一致；歷史更早的 46/45 count差異仍缺 raw page，因此 continuity保持 UNKNOWN，而不是推定刪除。

Active 44：exam-archive、police-exam-practice、police-exam-archive、92-duty-scheduler、UkePack、ppt-studio、voice-actress、taiwan-intel-dashboard、autodev-ng、flux-image-gen、claude-mem、lobsterpulse、prompt-autoresearch、neciken-summer-poem、note-filler、adng-memory、cyber-prep-coach、cf-ai-router、avatar-vfo、project-doctor-web、minideck、chatgpt-dual-pipeline、taichung-police-intel、soundbox-offline、skill-foundry、video-timeline-pipeline、ai-novel-workstation、clinical-scribe-worker、MaterialYouNewTab、cf-mcp-server、tick-stock-panel、herdr-skills、ninax-line-hermes、ai-flight-radar、academic-mcp、spotify-playlist-organizer-mcp、google-maps-personal-mcp、travel-planning-mcp、octobroker、openab、police-essay-mcp、openab-pty、travel-planning-app、studio。

Archived/excluded：`obsidian-vault`（archived content vault；保留 inventory，不因沒有 app/CI 開單）。

上輪後 default delta：**0**。最近產品 commit仍為 `taichung-police-intel@bd0152b0`（2026-10-05T16:14:13Z），早於上一份報告。

## Fair cursor：openab-pty

- Repository：https://github.com/Reese-max/openab-pty
- Default HEAD：`9e1464058335bcba73593651837433c11c9e6eb5`
- Upstream：https://github.com/openabdev/openab-pty ，current main `b82a36620a76c84a67bc6a7ab316cbc60a30e1a9`
- Compare：merge base等於 fork HEAD；upstream ahead 8、fork-only divergence 0。
- Branches：完整分頁 13 branches，第二頁 0；所有狀態 Reese-max Issues 0、PR 0；current HEAD workflow runs 0、combined statuses 0。
- Product scope：sandboxed remote PTY over a WireGuard tailnet；uid 1000、no sudo、no service-account token、read-only root、ephemeral workspace、per-session token。README明示 images來自 `ghcr.io/openabdev/openab-pty`，design of record在 upstream openab，client不在此 repo。
- Source/manifest：runtime Rust crate位於 `runtime/Cargo.toml`；CI在 Linux/macOS執行 check、clippy、unit、ignored PTY e2e、fmt；Kubernetes manifest禁用 SA token、drop all capabilities、read-only root，runtime loopback only。
- 明示限制：Tier 1 teardown best-effort；shared tailnet attach throttle可造成有界 60 秒拒絕；tailnet本身受信任。這些有文件和 security policy，不重複開成缺陷。

### Upstream delta 的兩個反例

1. `std::env::vars()` 在 fork `runtime/src/session.rs:1196` 建 session env；upstream `89a6aa1` 改為 `vars_os()`，避免非 UTF-8 env 讓 create worker panic。這是 SOURCE_CONFIRMED edge case，但 shipped Kubernetes/ECS env來自 JSON/string projection，fork沒有獨立 runtime或使用者證據；不升 P2。
2. fork termfilter會剝除 OSC 4 palette與 XTVERSION replies，而 capability proxy把這些 query交給 client；upstream `b82a366` 改為放行，以免 querying application等不到 response。這是 SOURCE_CONFIRMED compatibility edge case；沒有 fork runtime reproduction、受影響 app頻率或 owner-specific supported flow，維持 NOT_ESTABLISHED/P3 candidate，不開 fork Issue。

最小替代是使用 current upstream source/image，或在 owner明確把 fork當產品時同步已存在 upstream fixes；不需要新 terminal proxy、session recorder、control plane或 fork sync service。

## 外部競品／替代工作流

官方來源查閱日 2026-10-05 UTC（2026-10-06 Asia/Taipei）。功能聲明只作產品邊界比較，不作收益或本 repo缺陷證據。

| 對象 | 官方證據 | 比較結論 | 分類 |
|---|---|---|---|
| Tailscale SSH | https://tailscale.com/kb/1193/tailscale-ssh ，官方頁最後驗證 2026-01-05 | tailnet ACL與 SSH auth是成熟替代；MUST MATCH identity/policy boundary | CONFIRMED |
| Tailscale SSH recording | https://tailscale.com/docs/features/tailscale-ssh/tailscale-ssh-session-recording ，最後驗證 2026-01-05 | enforceRecorder不可用時可拒絕 session；SHOULD MATCH fail-closed evidence，但 openab-pty尚未承諾 recording | CONFIRMED |
| Teleport | https://goteleport.com/docs/reference/architecture/session-recording/ ，查閱 2026-10-05 | RBAC、audit、recording是 enterprise替代；DO NOT COPY整套平台 | CONFIRMED |
| HashiCorp Boundary | https://developer.hashicorp.com/boundary/docs/session-recording ，查閱 2026-10-05 | fixed-time proxied sessions、KMS-backed recording；適合高治理需求，不證明本 repo缺 recording | CONFIRMED |
| AWS ECS Exec | https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html ，查閱 2026-10-05 | CloudTrail identity與 S3/CloudWatch command/output logging；ECS內建替代路徑 | CONFIRMED |

- MUST MATCH：identity、per-session authority、expiry/revocation、least privilege、bounded teardown與誠實限制。
- SHOULD BE BETTER：小型、自架、與 agent workspace同地、無 ambient host/cloud credentials。
- DIFFERENTIATOR：same-image in-situ recovery與薄 WebSocket contract；需要真 owner runtime才可主張。
- DO NOT COPY：enterprise RBAC suite、recording storage/KMS、multi-protocol control plane、付費託管或合規矩陣。

## Product Board 多視角推演

- CEO：只做三件事——完成公平輪巡、保持 tracking fork角色誠實、若 owner實際使用 fork則同步 upstream已修 correctness edge cases。不做 enterprise access platform。
- CPO：README的 job-to-be-done清楚，但 Reese fork沒有獨立 user或deployment evidence；產品建議 PAUSE，而非 INVEST。
- CTO／Staff Engineer：upstream 8 commits已有最小修正；若需要，fast-forward/rebase比另寫 subsystem更小。此稽核不執行同步。
- UX Lead／Research：local echo prediction是 README承認的感知品質瓶頸；沒有真人或 client runtime，不把它轉成 feature issue。
- Growth：沒有 fork-specific adoption、distribution或 switching證據。
- CFO：零證據支持 session recording、KMS/object store、enterprise RBAC或新 hosted服務。
- Security／Privacy：ambient-authority與admin credential邊界清楚；recording會新增高敏感資料與治理成本，不預設 ADD。
- QA：fork exact HEAD無 Actions；source與 upstream fix commit不能冒充 Reese fork runtime。
- SRE：current upstream/image是現成替代；維護 fork同步本身不是新平台需求。
- Accessibility：terminal client的 screen reader/mobile行為不在此 repo且未測；保留 UNKNOWN。
- Support：只能說 tracking fork落後 8 commits，不能說已發生安全事故或 production outage。
- 分歧：Security偏向立即同步 correctness fixes；CFO/CPO認為沒有 fork產品承諾。決策是 PAUSE + 若有實際部署再 NARROW，同步不由本 audit授權。

## 50 合成 Persona（30 regression baseline／20 exploration）

單一模型的情境推演，不是真人、票數、發生率、營收或優先級證據。完整 P01–P50 baseline沿用前輪；本表保留全部 ID並更新與 openab-pty相關的 journey。

| IDs | 背景／限制 | 目標／旅程 | 摩擦／結果 | 分級／建議／證據 |
|---|---|---|---|
| P01–P05 (R) | portfolio owner、auditor、dedupe、QA、SRE | inventory→HEAD→runtime | 44 heads不變；無新 regression | NO_NEW_EVIDENCE；connector snapshot |
| P06–P10 (R) | security、privacy、CFO、support、CEO | 守住 scope與通知門檻 | tracking fork不足以建立 product incident | PAUSE；source/repo facts |
| P11–P15 (R) | GovIntel/operator/public reader/rights reviewer | 追上輪 exact runtime | default SHA未變、無新 evidence | 保留前輪 VERIFIED_FIXED scope |
| P16–P20 (R) | academic/autodev/travel/novel reviewers | 等待 merged-default runtime | 本輪無 HEAD或 run前進 | CANNOT_VERIFY unchanged |
| P21–P25 (R) | memory/privacy/recovery/incident/maintainer | 追 broader writer/global deletion | 無產品變更 | PARTIAL unchanged |
| P26–P30 (R) | video/scheduler/doctor/flight/support reviewers | 防舊摘要復活大方案 | fingerprints無新狀態 | dedupe／no comments |
| P31–P35 (E) | k3s、ECS、tailnet、local binary、image operator | 建 sandbox PTY | fork指向 upstream images；無 fork deployment | use upstream / NEEDS_RUNTIME_EVIDENCE |
| P36–P40 (E) | terminal app、palette query、XTVERSION、non-UTF8 env、client author | 建 session並完成 terminal negotiation | 兩個 upstream-fixed edge cases存在於 fork source | NOT_ESTABLISHED/P3 candidate；SOURCE_CONFIRMED |
| P41–P45 (E) | Teleport、Tailscale、Boundary、ECS Exec、compliance buyer | 選 access/audit替代 | enterprise recording breadth遠超 scope | DO NOT COPY；official docs |
| P46–P50 (E) | mobile、screen reader、slow network、malicious shell、challenger | 測 attach/TTL/recovery/a11y | README/security有界限制；必要 runtime未跑 | evidence backlog；不開配額 Issue |

## Red Team

1. Upstream有 bugfix是否足以證明 Reese產品 P2？否；fork是祖先、沒有獨立部署或 supported-user evidence，且 upstream/current image是現成替代。
2. 非 UTF-8 env panic是否核心 failure？在可構造 native process環境成立；shipped K8s/ECS projection未證明可達，因此 impact/frequency不足。
3. OSC4/XTVERSION reply被剝除是否會使所有 terminal壞掉？否；只影響發送該 query且依賴 reply的 app，沒有執行重現或 completion-rate evidence。
4. fork current HEAD沒有 Actions是否自動 maintenance Issue？否；沒有 fork-specific delivery contract，缺證據只阻擋 verification。
5. README說 dogfooded是否等於 Reese實際部署？否；文件屬 upstream mirror內容，不能推定 owner runtime。
6. 應否新增 session recording以追競品？否；會引入高敏感 transcript、storage/KMS與權限治理，且需求未成立。
7. 13 branches是否要清理？否；branch存在不構成使用者失敗，且可能保留 upstream contribution工作。
8. 能否宣告 CLEAN？否；固定 A01–J05、兩輪、必要 runtime、公平輪巡與歷史 inventory continuity仍未完成。

## NOW / NEXT / LATER / DON'T

- NOW：公平游標移至 `police-essay-mcp`；保留 openab-pty PAUSE/tracking-fork分類。
- NEXT：若出現 owner部署證據，先重跑 non-UTF8 session create與 OSC4/XTVERSION negotiation，再決定同步／Issue；不先擴工程。
- LATER：真實 k3s/ECS、tailnet、client、a11y/mobile與 teardown runtime evidence。
- DON'T：不替 upstream開 PR／Issue、不在 Reese fork製造同步配額、不建 recording/KMS/RBAC平台、不修改產品/CI/config、不啟動 worker/GOAL。

## Decision Memo

- 服務誰：需要在 agent同一 workspace進行受限遠端 shell recovery的 operator；本輪沒有 Reese-specific users證據。
- 選擇／競爭：以小型 sandbox與同地 recovery對比 Teleport/Boundary/ECS Exec；不追 enterprise breadth。
- 差異化：ephemeral same-image PTY、no ambient authority、per-session short-lived token；必須由 owner runtime證明。
- 前三優先：(1) 完成 portfolio公平輪巡；(2) 保持 upstream/current-image替代明確；(3) 有部署時才驗證兩個 edge cases。
- 不做／刪除：不新增 recorder、object store、KMS、RBAC console或 sync service；不刪 security limits。
- 風險／實驗：最大風險是把 upstream文件／fix誤當 Reese runtime。最小實驗是 isolated exact-HEAD session create與 client negotiation，退出條件 BUILD/NARROW/REJECT。
- Portfolio recommendation：`openab-pty=PAUSE as tracking fork`；不是 ARCHIVE，因仍可作 contribution/reference；完整 ranking等待輪巡完成。
- 建議不是實作、merge、部署、付費或外部寫入授權。

## Findings、追蹤與 write ledger

| 類型 | 數量 | 結果 |
|---|---:|---|
| New actionable finding | 0 | 兩個 source edge cases未達 independent fork產品門檻 |
| New Issue | 0 | 無；不操作 upstream repository |
| Existing Issue update/reopen | 0 | 無狀態變更，不重複留言 |
| Deduplicated/rejected | 4 | upstream已有 fixes 2；known documented limits 2 |
| Verified fixed / regression | 0 | 無 default-branch product change |
| Product/CI/config write | 0 | 無 |
| Issue lease | 0 | 無 Issue mutation |
| Audit report | 1 | 本檔，existing audit-only Draft PR #154 branch |
| Write blocked | 0 | 無 |

## Runtime pending、游標與 CLEAN

- openab-pty：fork exact-head CI、image build、real terminal query、non-UTF8 native env、k3s/ECS/tailnet、client/mobile/a11y均未執行。
- Next fair active repository：`Reese-max/police-essay-mcp`。
- Portfolio ranking：未做；完整公平輪巡尚未完成。
- CLEAN：**NOT CLEAN / PARTIAL**。不停止 recurring audit。
