# Product Board Audit — 2026-10-05T17:04:47Z

## 結論與範圍

- 狀態：**PARTIAL / NOT CLEAN**。本輪完成 45 個自有 repositories 的分頁 inventory（44 active、1 archived）、上輪後 default-branch 增量、相關 Issues／PR／workflow 證據、公平游標 openab，以及競品、董事會、50 合成 Persona 與 Red Team 更新；沒有把增量巡檢冒充 44 個 active repo 的全產品深讀。
- 本輪沒有新的 actionable finding，沒有新增／重開／更新 Issue，也沒有取得 Issue lease。五個 default branch 有產品前進，但四個仍缺 exact merged-default runtime；不以 PR 合併或 candidate 綠燈宣稱 VERIFIED_FIXED。
- `taichung-police-intel@bd0152b0585dc888e9576892166afaff766c1fec` 有 exact default-branch production workflow run 37339506331，全鏈成功；它是既有 owner-directed scope 的新 runtime 證據，不是新 finding。
- 公平游標 openab 已完成；下一個為 `openab-pty`。openab 是未分叉的上游追蹤 fork：fork main 無獨有 commit、比 upstream 少 7 commits，未形成 Reese-max 的獨立產品面。
- Portfolio CLEAN 仍被固定 A01–J05 兩輪、必要 runtime、較早 inventory continuity 差異與未完成公平輪巡阻擋。

## 規則、時間與證據語義

- Issue quality v2 blob：`8167e10798071d2276addaff6b201c6b0e904a2a`
- 查閱時間：2026-10-05 UTC（外部公開來源同日查閱）。
- 證據分類：SOURCE_CONFIRMED、STATIC_INFERENCE、EXECUTED_REPRODUCTION 分開記錄；README、test file、merged PR、單一綠燈不等於完整產品路徑。
- 回歸標記：只有 exact default-branch 且重跑同情境／鄰近路徑才用 VERIFIED_FIXED；缺 provider、deployment、browser 或正式權限路徑時保留 NEEDS_RUNTIME_VERIFICATION。

## Inventory snapshot

本輪數量與上一份 14:22Z 報告一致：45 total / 44 active / 1 archived。更早報告曾記 46 / 45，但缺原始逐頁快照，故歷史 continuity 仍 UNKNOWN；不把不可見或消失推定為刪除。

| Repository | Default HEAD | Repository | Default HEAD |
|---|---|---|---|
| exam-archive | `13519bbe` | police-exam-practice | `7a8eb987` |
| police-exam-archive | `a0b5dbb9` | 92-duty-scheduler | `127f5e78` |
| UkePack | `718d021f` | ppt-studio | `d5e47893` |
| voice-actress | `a10c97ff` | taiwan-intel-dashboard | `df7cee19` |
| autodev-ng | `69a20673` | flux-image-gen | `dfadcf30` |
| claude-mem | `3ed5439f` | lobsterpulse | `41e09eb9` |
| prompt-autoresearch | `6527919e` | neciken-summer-poem | `d54daa39` |
| note-filler | `7e298113` | adng-memory | `ae7246df` |
| cyber-prep-coach | `ffc7bbbb` | cf-ai-router | `74c52130` |
| avatar-vfo | `8c578feb` | project-doctor-web | `d70c383f` |
| minideck | `31f7131a` | chatgpt-dual-pipeline | `747fd8a5` |
| taichung-police-intel | `bd0152b0` | soundbox-offline | `d58d73ad` |
| skill-foundry | `17e90d85` | video-timeline-pipeline | `46a117d9` |
| ai-novel-workstation | `4ea76d73` | clinical-scribe-worker | `4b883036` |
| MaterialYouNewTab | `7d32f2f4` | cf-mcp-server | `fb1a248f` |
| tick-stock-panel | `39c8e20c` | herdr-skills | `e706aa28` |
| ninax-line-hermes | `f820dfad` | ai-flight-radar | `772deb8a` |
| academic-mcp | `99f66db6` | spotify-playlist-organizer-mcp | `47eed58f` |
| google-maps-personal-mcp | `2f3c4520` | travel-planning-mcp | `ec3054d6` |
| octobroker | `b669101c` | openab | `50424ed4` |
| police-essay-mcp | `2cf3da1c` | openab-pty | `9e146405` |
| travel-planning-app | `dd5081df` | studio | `0f1b62d3` |

Archived/excluded：`obsidian-vault`。它是 archived content vault，保留 inventory，但不因沒有產品介面或 CI 開缺陷。

## 上輪後 default-branch delta

| Repo / merged PR | Current default SHA | 實際證據 | 回歸判定 |
|---|---|---|---|
| academic-mcp PR #31 | `99f66db6851d941d8964475364e9ec32257c8e8b` | source/PR：身份與計數 authority 不再被抽象 label 污染；candidate 有 focused regressions。merged SHA 未見 connector 可取得的 exact-default run/status | **CANNOT_VERIFY / NEEDS_RUNTIME_VERIFICATION** |
| autodev-ng PR #105 | `69a206738e37896cdc4341e52c2905869f648985` | source/PR：writer accounting、review recovery、bounded HTTP model routes；candidate Linux suite 與 corrected Windows run 37325193984 成功 | **CANNOT_VERIFY**；Real9Router 與 broader Issues #49/#51 仍未完成 |
| travel-planning-mcp PR #16 | `ec3054d693bd65283c14b7b8cf6f3b18bda14bc7` | server-derived read-only proposal review；local 258 tests/build/compiled replay；不能 approve/apply 且 redacts notes | **PARTIALLY_VERIFIED synthetic / NEEDS_RUNTIME_VERIFICATION**；沒有 provider/model/App browser/deployment/external Trip |
| ai-novel-workstation PR #25 | `4ea76d73b670400d3e9bcf6548f2978ce14c4346` | scoped story read/candidate proposal local tests；沒有成功 promotion、人類 review、provider/deployment | **CANNOT_VERIFY**；Issue #6 保持 open |
| taichung-police-intel PR #147 | `bd0152b0585dc888e9576892166afaff766c1fec` | exact default run 37339506331；build、Worker、Pages、publication_outcome 全 success，匿名 public bytes/hash readback 與 release binding 成功 | **VERIFIED_FIXED**：schema1 source-policy origin binding／manual slot date；formal admission 仍 RIGHTS_BLOCKED/UNKNOWN |

### taichung-police-intel exact runtime receipt

- Run：https://github.com/Reese-max/taichung-police-intel/actions/runs/37339506331
- Jobs：build 111862679408、worker/deploy 111869315624、deploy 111869476616、publication_outcome 111869736120，全部 success。
- Artifacts：production-query receipt digest `sha256:cc965fb288abb1f2474ded7d87bd2b9d4dd2eae9c76c623742ebe640b418ca8b`；publication evidence `sha256:2e96f5d105a81174582b19a24b15bd56aeb3c352847cc8590197af213a98b286`；publication health `sha256:dff036261666dc1d6b02c52258a6af9e074229041cc1bc1e227c53795516af01`；Pages `sha256:50c3411bc35af18e9665fc602bb516593498cf0f285dd3f6e65e72810fea796e`。
- Query receipt：`code_sha=bd0152…`、deployment_verified=true；capabilities/hash_binding/health/mcp/protected_query_refusal/query/release_binding 均 SUCCESS。
- 限制：evidence_locator=RIGHTS_BLOCKED、formal_query_admission=UNKNOWN、query_readiness=RIGHTS_BLOCKED、production_verified=false；S-004/S-006/S-007/S-009/S-029 因 APPROVED_GOVERNANCE_MISSING 阻擋。這些限制不被發布成功覆蓋。

## Fair cursor：openab

- Repo：https://github.com/Reese-max/openab
- Fork default HEAD：`50424ed461776fc4b817a85ee08052533f511d1e`
- Upstream：https://github.com/openabdev/openab ，main `99c11ec10e239c4054c304efee6b99204ac6440a`
- Compare：merge base 等於 fork HEAD；upstream 多 7 commits，fork 無獨有 divergence。
- README 與 package：明確指向 upstream branding/releases；Rust workspace（openab-core、openab-gateway、openab-mcp、openab-cp），version 0.10.0。
- Issues/PR：Reese-max fork 所有狀態均 0。Current HEAD 沒有可取得的 workflow run。
- Branches：完整分頁 637 branches；第一頁至最後一頁均已讀，最後 cursor 空。大量 docs/feat/fix/release 分支是 upstream mirror 形態，不能作 owner 独立 roadmap 證據。
- 判定：**mirror/upstream reference fork**。上游 7-commit lag 與 fork-local CI 不存在，不足以建立 supported flow failure；不開 Issue。
- 建議：`MAINTAIN AS FORK / PAUSE PRODUCT BOARD`。若 owner 之後形成 fork-only default commits、獨立 roadmap 或實際部署，再恢復產品級審查。

## 外部競品／替代工作流

查閱 2026-10-05 UTC；只用官方來源。沒有日期的持續性文件以查閱日記錄，不推測發布日。

| 對象 | 官方證據與日期 | 對 openab 類產品的訊號 | 分類 |
|---|---|---|---|
| Slack Agent sessions | https://docs.slack.dev/ai/agent-sessions/；持續文件，查閱 2026-10-05 | 原生 agent thread/session、工具與平台 UX；MUST MATCH platform-native session/auth boundary | CONFIRMED |
| Slack agent updates | https://docs.slack.dev/changelog/2026/08/20/agent-updates/；2026-08-20 | multi-agent stacking、native stop、agent_session_stopped；SHOULD MATCH bounded stop/recovery | CONFIRMED |
| Discord Application Commands | https://docs.discord.com/developers/docs/interactions/slash-commands；查閱 2026-10-05 | interaction token、command surface；MUST MATCH platform-native auth/permission | CONFIRMED |
| Microsoft Teams SDK | https://learn.microsoft.com/en-us/microsoftteams/platform/teams-sdk/；查閱 2026-10-05 | agent/app integration 與 Teams distribution；ALTERNATIVE，非 fork 缺陷 | CONFIRMED |
| Mattermost Agents | https://docs.mattermost.com/administration-guide/configure/agents-admin-guide；查閱 2026-10-05 | self-hosted agent administration；ALTERNATIVE／enterprise control-plane signal | CONFIRMED |

- MUST MATCH：平台原生身分、session/stop、最小權限、可審計工具批准。
- SHOULD BE BETTER：跨渠道 portability、薄 ACP/agent 邊界、失敗可恢復性。
- DIFFERENTIATOR：只有在 owner 實際運行並有 fork-specific evidence 時，才可主張 upstream/open standard 的可攜性。
- DO NOT COPY：Slack/Teams/Mattermost 的 enterprise suite breadth、控制台、付費分發；競品有功能不等於 Reese-max fork 有缺陷。
- 外部功能頁不是效果、收益、完成率或優先級證據。

## Product Board 多視角推演

- CEO：只做三件事——完成公平輪巡、保存 exact runtime receipts、讓已合併但未驗證的 scope 保持 CANNOT_VERIFY。不做 fork 產品化、跨 repo agent platform、enterprise suite。
- CPO：五個產品前進值得追證據，但只有 GovIntel 有 exact default runtime；openab 沒有獨立 job-to-be-done。
- CTO / Staff Engineer：先重用現有 platform/session primitives；openab 落後 7 commits 最小動作是等待／同步 upstream 決策，不是另造 fork machinery。
- UX Lead / Research：proposal review 的不可 apply 與 redaction 是正向安全 UX；沒有真人可用性、手機、a11y、slow-provider evidence。
- Growth：沒有 acquisition 或 switching 實證；不把合併數、stars 或 synthetic preference 當市場 traction。
- CFO：沒有支持新服務、資料庫、hosted control plane 或付費 vendor 的證據。
- Security / Privacy：platform-native auth、approval、stop 是門檻；GovIntel rights/admission 與 proposal external data 仍需 fail-closed。
- QA：四個 merged-default 仍需 exact scenario rerun；候選 branch 綠燈不能取代。
- SRE：GovIntel full chain 是本輪最強證據；其他 repo 的 run absence 只阻擋 VERIFIED_FIXED，不自動建立 BUG。
- Accessibility：本輪無新的 browser/screen-reader/mobile runtime；保持 evidence backlog，不硬開 P2。
- Support：只能說 GovIntel 特定 source-policy regression 已修；其餘只可說 merged、尚待 runtime。
- 分歧：CPO想把 proposal review列 NEXT；Security要求先證明外部資料與 approval separation；CEO決定只保留窄 runtime verification，不批准擴充功能。

## 50 合成 Persona（30 回歸 baseline／20 探索）

這是單一模型的 50 個合成情境，不是真人、票數、發生率、收入或優先級證據；固定 baseline 不因角色輪替遺失。

| IDs | 背景／限制 | 目標／期待 | 任務／旅程 | 摩擦／結果 | 分級／建議／證據 |
|---|---|---|---|---|---|
| P01–P05 (R) | GovIntel operator、SRE、public reader、QA、rights reviewer | 發布內容與 code/source 綁定 | push→build→Worker/Pages→public readback | exact run 全 success；formal admission仍 blocked | VERIFIED_FIXED scoped；保留治理 gate；EXECUTED_REPRODUCTION |
| P06–P10 (R) | academic researcher、identity reviewer、count auditor、API user、maintainer | label 不改寫 identity/count authority | abstract→normalize→count/retrieve | candidate tests存在；merged SHA runtime缺失 | CANNOT_VERIFY；重跑 exact default；SOURCE_CONFIRMED |
| P11–P15 (R) | autodev owner、Windows runner、reviewer、model-route operator、incident responder | writer accounting與 review recovery可信 | scan/review/model route→receipt | candidate Linux/Windows成功；Real9Router 未驗 | PARTIAL／NEEDS_RUNTIME_VERIFICATION |
| P16–P20 (R) | travel planner、approval owner、privacy reviewer、App user、provider operator | 看 proposal 且不能偷偷套用 | authenticated GET→redaction→review | server-derived/read-only成立；無 browser/provider/external Trip | P3 evidence gap only；不開新單；SOURCE_CONFIRMED |
| P21–P25 (R) | novel writer、editor、story owner、provider operator、support | candidate 不覆寫故事 | read story→generate candidate→review | local tests；無成功 promotion、人類/provider runtime | CANNOT_VERIFY；Issue #6保持 open |
| P26–P30 (R) | portfolio owner、dedupe reviewer、security、CFO、auditor | 只追真根因與最小修正 | inventory→delta→issue fingerprint | 零新問題通過四門；不為配額開單 | MAINTAIN strict triage；AUDIT EVIDENCE |
| P31–P35 (E) | Discord/Slack/Teams/Mattermost operator、self-host admin | 跨平台 agent session且可停止 | command/session→tool approval→stop | fork未形成獨立 runtime | RESEARCH only if owner declares use；official docs |
| P36–P40 (E) | upstream maintainer、fork maintainer、release consumer、branch curator、OSS contributor | 判斷 openab fork是否獨立 | compare SHA→branches→Issues/PR/runs | upstream多7 commits、fork無獨有 divergence、637 branches | PAUSE PRODUCT BOARD；SOURCE_CONFIRMED |
| P41–P45 (E) | mobile user、screen-reader user、slow-network user、Windows user、low-frequency maintainer | 核心流程可恢復且可及 | browser/mobile/cross-platform/timeout | 本輪無必要 runtime | NEEDS_EVIDENCE；缺證據不升 severity |
| P46–P50 (E) | adversarial auditor、procurement、privacy challenger、support challenger、CEO | 推翻過度宣稱與大方案 | 查 exact SHA、rights、cost、scope | 只有 GovIntel可 scoped VERIFIED_FIXED；外部 breadth無 ROI | SIMPLIFY / DO NOT COPY；RED TEAM |

## Red Team

1. 五個 merged PR 是否都算修好？否。四個缺 exact merged-default runtime，維持 CANNOT_VERIFY／PARTIAL。
2. workflow endpoint回傳零 run是否證明 CI 壞了？否。connector 能見度與 event/page 範圍有限；只標 evidence unavailable。
3. openab 落後 upstream 7 commits是否是 P2 maintenance？否。沒有 owner-specific supported flow、部署或 divergence；最小選項是不開單。
4. 637 branches 是否代表需要 branch cleanup？否。鏡像 fork 的上游 branch history不是本輪可證明的使用者失敗；大量清理也超出授權。
5. proposal review既然安全，是否應立即擴建 approval UI？否。現有 scope明確 read-only；缺真人需求與 runtime，不把研究假設包成工程。
6. GovIntel完整發布是否等於 production verified？否。receipt明示 formal admission UNKNOWN、rights/query readiness blocked，故只驗證特定 regression。
7. Slack/Teams/Mattermost都有 agent功能，是否表示 openab 缺 enterprise features？否。競品能力不是 fork 缺陷；產品規模與 owner方向不足。
8. 能否宣告 portfolio CLEAN？否。固定 A01–J05、兩輪、必要 runtime、公平輪巡與歷史 inventory continuity 均未完成。

## NOW / NEXT / LATER / DON'T

- NOW：保存 GovIntel exact receipt；對 academic/autodev/travel/novel 四個 merged-default 只做窄 runtime verification；繼續公平游標 `openab-pty`。
- NEXT：若 owner 現有 Issues 的成功條件要求，補 exact default provider/browser/cross-platform evidence；不擴 scope。
- LATER：只有 owner 宣告獨立 fork roadmap 或真實平台需求時，才研究 openab sync/ACP/channel差異化。
- DON'T：不新增 agent platform、graph/registry、enterprise console、approval UI、跨 repo framework；不因 branch多、run不可見或競品功能硬開 Issue；不啟動 worker/GOAL、不改產品/CI/config/settings。

## Decision Memo

- 服務誰：目前已證實的是 GovIntel公開發布使用者、四個既有 Issue/PR 的 owner/reviewer，以及需要可信證據邊界的 portfolio maintainer；openab fork沒有獨立 user evidence。
- 選擇／競爭：以 exact receipt、fail-closed、不可偷偷套用與權限邊界競爭；不追 enterprise breadth。
- 差異化：若未來成立，應是跨平台、薄協定、可攜且可審計；本輪不把 upstream能力冒充 Reese-max產品成果。
- 前三優先：(1) exact default runtime truth；(2) 完成公平輪巡與固定 persona gates；(3) 保持 rights/approval/source authority 的 fail-closed 邊界。
- 不做／刪除：不新建平台、DB、狀態機或付費承諾；從產品投資面暫停 openab fork，保留 reference用途。
- 風險／實驗：最大風險是把 merged/local tests外推成 deployed outcome。實驗只需最小現有成功條件 replay，結果用 BUILD/NARROW/REJECT，不用 persona票數。
- Portfolio：`taichung-police-intel=INVEST reliability, scoped regression cleared`；四個 merged repos=`MAINTAIN + VERIFY`；`openab=PAUSE as tracking fork`。完整 ranking等待輪巡完成。
- 建議不是實作、merge、部署、付費或外部寫入授權。

## Finding / Issue / write ledger

| 類型 | 數量 | 結果 |
|---|---:|---|
| New actionable finding | 0 | 無候選同時通過問題成立、分級、最小範圍、研究/實作分離 |
| New Issue | 0 | 無 |
| Existing Issue comment/update/reopen | 0 | 無新狀態需要重複留言；既有 broader Issues保留 |
| Deduplicated / rejected | 5 | 四個 merged scope沿用既有 Issues；openab fork沒有可成立缺陷 |
| Verified fixed | 1 | GovIntel PR #147 exact default production path |
| CANNOT_VERIFY / runtime pending | 4 | academic-mcp、autodev-ng、travel-planning-mcp、ai-novel-workstation |
| Product / CI / config write | 0 | 無 |
| Issue lease | 0 | 沒有 Issue mutation，無需取得鎖 |
| Audit report | 1 | 本檔，existing audit-only Draft PR #154 branch |
| Write blocked | 0 | 無 |

## 下一游標與未完成項

- Next fair active repository：`Reese-max/openab-pty`。
- Portfolio ranking：未做；完整輪巡尚未完成，避免熱門 repo偏誤。
- Runtime pending：academic exact merged-default identity/count；autodev Real9Router與 broader #49/#51；travel provider/App browser/deployment/external Trip；novel successful promotion/human/provider/deployment；GovIntel formal rights/admission。
- CLEAN：**NOT CLEAN / PARTIAL**。不停止 recurring audit。
