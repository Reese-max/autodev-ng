# Product Board Audit — 2026-10-05T14:22:18Z

## 結論

- 狀態：**PARTIAL / NOT CLEAN**。本輪完成增量 default-branch 比對、兩個既有 regression fingerprint 的修正後核驗，以及公平游標 `octobroker` 的 README／manifest／source／tests／branches／Issues／PR／Actions 深讀；沒有把本輪描述成 44 個 active repositories 的重新全量深讀。
- **VERIFIED_FIXED**：`taichung-police-intel#141` 的 default-branch 發布 gate 回歸。修正 commit `edb7148c9565c7d59ac222689c35bff41376d1cb` 的自動 push run 37303622240 完成 build、Worker、Pages、匿名 public bytes/hash readback 與 publication outcome。
- **VERIFIED_FIXED（精確 synthetic fingerprint）/ PARTIALLY_FIXED（整體研究 Issue）**：`adng-memory#4` 的傳遞 tombstone lineage 洗白反例。default HEAD `ae7246dfc48056a2266cc3b00e6e054d42ac3596` 的 receipt 重播原四步為 `commit→tombstone→reject→reject`；外部 writer、origin-aware admission 與 global deletion 仍未驗證，因此 Issue 保持 open。
- 新 Issue 0；Issue 實質更新 2；重開 0；去重 2；已驗證修復 2；產品實作 0；報告寫入 1。
- 公平游標：已完成 `octobroker`；下一個 `openab`。

## 規則與 inventory

- Issue quality v2 blob：`8167e10798071d2276addaff6b201c6b0e904a2a`
- 本輪連線分頁列舉：45 total / 44 active / 1 archived（`obsidian-vault`）。前一份報告記 46 / 45；由於沒有保存可逐名比對的前一輪 raw page，無法可靠指出少掉的 repo 名稱，故標 **inventory continuity UNKNOWN**，不宣稱刪除或不可見等同不存在。
- 本輪 default branch 有實質產品前進者：
  - `adng-memory`：`28948ee… → ae7246d…`
  - `taichung-police-intel`：`ff093ea… → cade5a7…`（其中 `edb7148…` 是產品修正；`cade5a7…` 只多文件合併）
- 其餘已列舉 repo 沒有因缺 README、CI 或產品表面而被硬開缺陷。Portfolio CLEAN 被 inventory continuity、未完成的固定 A01–J05 兩輪與必要 runtime 證據阻擋。

## Fair cursor：octobroker

- repo：https://github.com/Reese-max/octobroker
- default HEAD：`b669101c0ef4a2c03c1ddcb2b99c014fd1947d29`
- parent/upstream：https://github.com/openabdev/octobroker
- upstream main HEAD 同為 `b669101c0ef4a2c03c1ddcb2b99c014fd1947d29`
- repository fact：fork=true、Issues disabled、所有狀態 Issues/PR 均 0、Actions runs 0；本 fork 未形成獨立 default-branch產品差異。
- 已讀：README、Cargo.toml/lock、config example、CI/E2E/release workflows、DESIGN/getting-started、Rust gateway/policy/audit/cache/token/git-credential source、CLI/source tests、recent commits、全部 branches。
- 適用判定：**mirror/upstream reference fork**。沒有 owner-specific roadmap、usage或 runtime 證據支持將它當 Reese-max 的獨立產品面；缺 fork-local Actions 也不自動是缺陷。Red Team 阻止「看到安全產品就另開 hardening 單」的過度擴張。
- 建議：`MAINTAIN AS FORK / PAUSE PRODUCT BOARD`；若未來 default branch 與 upstream 分叉或 owner 宣告獨立使用，再恢復產品級研究。

## 修正後回歸

### R-01 taichung-police-intel #141

- Issue：https://github.com/Reese-max/taichung-police-intel/issues/141
- fix PR：https://github.com/Reese-max/taichung-police-intel/pull/142
- fixed product SHA：`edb7148c9565c7d59ac222689c35bff41376d1cb`
- exact automatic run：https://github.com/Reese-max/taichung-police-intel/actions/runs/37303622240
- evidence：`build`、`worker/deploy`、`deploy`、`publication_outcome` 全部 success；部署 log 回傳 `PUBLIC_DATA_VERIFIED`，五個 public files hash 完整；query receipt 的 `code_sha` 等於修正 SHA，release/hash/query binding success。
- artifact：`publication-evidence-37303622240-1` digest `sha256:f1cb2a934dc3c7a8c5112df784f5b2273fdc3a5c30201f4297f7ecea90ee0793`
- 結論：**VERIFIED_FIXED / EXECUTED_REPRODUCTION**。同一 default-branch push route 及鄰近 rights-blocked/protected-query 行為通過。
- 限制：query receipt 的正式 evidence admission 仍是 `RIGHTS_BLOCKED/UNKNOWN`，不是 #141 根因，不納入修復宣稱。current HEAD `cade5a7…` 只多文件提交；其 run 37322381207 在查閱時仍執行中，audit-only 文件變更不使 `edb7148…` 的產品實測失效。

### R-02 adng-memory #4

- Issue：https://github.com/Reese-max/adng-memory/issues/4
- fix PR：https://github.com/Reese-max/adng-memory/pull/11
- default HEAD：`ae7246dfc48056a2266cc3b00e6e054d42ac3596`
- regression receipt：https://github.com/Reese-max/adng-memory/blob/ae7246dfc48056a2266cc3b00e6e054d42ac3596/fixtures/memory-lifecycle-transitive-regression-receipt.json
- exact before：`commit,tombstone,reject,commit`；`rt-y ACTIVE`
- exact after：`commit,tombstone,reject,reject`；active head `rt-tombstone`；current read `CANNOT_VERIFY/tombstoned`
- adjacent controls：正常三層 lineage 仍 `commit,commit,commit`；非關聯新 head 後嘗試復活既有 tombstone lineage 仍 reject。
- receipt：11 fixtures、21 focused tests PASS；hosted CI=`NOT_CONFIGURED`；external writer runtime=`NOT_RUN`。
- 結論：重開留言的精確 P3 validation fingerprint **VERIFIED_FIXED**；整體 #4 保持 **PARTIALLY_FIXED / NEEDS_EVIDENCE**，不宣稱 production writer、poisoning admission或 global purge 已解決。

## 競品／替代工作流 delta

查閱日 2026-10-05；沿用同日上一輪已讀官方來源，沒有因本輪修正狀態新增產品方向。

| 對象 | 官方訊號 | 本輪判斷 |
|---|---|---|
| GitHub App short-lived installation token | GitHub 官方文件說 installation token 可縮限 repositories/permissions 且一小時到期：https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app | 與 octobroker 上游定位一致；但 fork 無獨立需求證據，**DO NOT COPY/EXPAND locally** |
| Microsoft Agent Framework / Cosmos memory | authenticated identity、scope、TTL/backup/retention/deletion，且 memory 不應直接作 authorization：https://learn.microsoft.com/en-us/agent-framework/integrations/by-component/context-providers/azure-cosmos | **MUST MATCH principle**；adng 的 exact synthetic repair不等同 runtime governance |
| Neo4j Agent Memory | temporal fact validity與關聯 memory；Labs 無 SLA：https://neo4j.com/labs/agent-memory/ | **DO NOT COPY graph dependency**；局部 ancestor walk 已足以修原 fingerprint |
| Zep data deletion | episode/user deletion會移除關聯或 derived data：https://help.getzep.com/deleting-data-from-the-graph | **SHOULD BE BETTER in receipts**；外部宣稱不是本 repo global deletion效果證據 |
| GitHub Pages / Actions | exact workflow/deployment/public readback 是本次真實修復證據，不是競品 benchmark | **MUST MATCH reliability**；同 route成功才算 fixed |

沒有計算 synthetic preference share、ROI、發生率或市場票數。

## Product Board 多視角 delta

- CEO：只做三件事——接受 #141 已恢復、把 #4 精確 regression 從 NOW 移出、完成 inventory/A01–J05 證據缺口。不做新 gateway、graph DB 或 portfolio framework。
- CPO：修復品質來自同情境驗證，而非合併數；`octobroker` fork 沒有獨立 job-to-be-done，不列投資產品。
- CTO / Staff：#141 的最小 fixture correction有效；#4 的 ancestor propagation修正有效。保留兩者證據邊界。
- UX / Research：本輪沒有真人研究；persona只驗證已知 journey，不把修復轉成完成率宣稱。
- Growth：沒有新 acquisition signal；不把兩個修復包裝成新功能。
- CFO：零新基礎設施承諾；沿用既有 Actions、local Python receipt。
- Security / Privacy：query formal admission仍 rights-blocked；memory global deletion仍不明。這些限制不能被「fixed」字樣掩蓋。
- QA：同失敗路徑加鄰近路徑均有證據；合併本身未被用作證明。
- SRE：GovIntel 的 build→deploy→public readback全鏈通過；當前 docs-only run尚未完成不等同回歸。
- Accessibility：本輪沒有新 UI/a11y runtime；缺證據只阻擋 CLEAN。
- Support：可說 #141 已恢復、#4 的 synthetic defect已修；不可說所有 GovIntel admission或 production memory deletion已完成。
- 分歧：CPO想把兩項移出 NOW；Security仍要求 broader runtime evidence。決策是「關閉精確 defect、保留 broader gate」，避免復活大方案。

## 50 合成 Persona 維持／delta

這是單一模型的合成情境，不是 50 位真人。30 個回歸 baseline（P01–P30）與 20 個探索（P31–P50）沿用 08:15Z 與 11:03Z audit 的完整背景、限制、旅程與證據；本輪只更新因實際修正而改變的結果，未讓角色輪替刪除原案例。

| IDs | 背景／限制 | 目標／旅程 | 本輪摩擦與結果 | 分級／建議 | 證據 |
|---|---|---|---|---|---|
| P01–P05 | memory maintainer/privacy/SRE/QA；只信 exact receipt | raw→tombstone→reject→descendant | 原反例變 reject；current read CANNOT_VERIFY | fingerprint VERIFIED_FIXED | merged receipt |
| P06–P10 | security/research/reviewer/governance/offline | 判斷 #4 是否可完成 | synthetic defect修好；external writer/global purge仍空白 | PARTIALLY_FIXED / keep open | README + receipt |
| P11–P15 | cross-platform/incident/compliance/CLI/new maintainer | 重播與解釋 current authority | source receipt可讀；hosted CI、真 writer未跑 | NEEDS_RUNTIME_VERIFICATION | receipt limits |
| P16–P20 | dedupe/product/platform/test/red-team | 去重並守住正反例 | 同根因不另開；正常三層 control通過 | MAINTAIN narrow fix | issue/PR/receipt |
| P21–P25 | recovery/schema/cost/API owner | unknown/cycle/stale fail closed | 此輪沒有新 failure；不擴 scope | maintain evidence backlog | source review |
| P26–P30 | support/a11y/CFO/CEO/auditor | 回答狀態、決策、CLEAN | 可說精確 defect fixed；portfolio仍 NOT CLEAN | no closure of portfolio | audit rules |
| P31–P35 | multi-writer/backup/mobile/low-frequency/content repo | 探索 broader use | 真 writer、backup、mobile仍未知；octobroker是同 HEAD fork | DEFER / exclude fork | repo/runtime facts |
| P36–P40 | graph/Mem0/Zep/Letta/Azure users | 比較替代 | 外部能力不推導本產品缺陷 | DO NOT COPY; match principles only | official docs |
| P41–P45 | procurement/data-min/model security/support/owner | 控制 blast radius/scope | 無新需求；兩個 fix都不需平台化 | SIMPLIFY | board/red team |
| P46–P50 | auditor/CI/open-source/cross-language/challenger | 查 SHA、重播、推翻結論 | #141完整 runtime；#4 synthetic only；octobroker排除合理 | preserve limits | Actions + receipts |

Persona 個別狀態變更索引：
- P01/P03/P04/P05/P14/P19/P20/P26/P50：adng exact fingerprint從 STILL_REPRODUCIBLE → VERIFIED_FIXED。
- GovIntel release operator、public demo user、SRE、QA、support（11:03Z cohort中對應 M/SRE/QA 角色）：#141 從 blocked → VERIFIED_FIXED。
- P06/P09/P13/P31/P32/P47/P49：broader runtime/backup/hosted-CI限制不變。
- 其餘 persona：NO_NEW_EVIDENCE，不靠模擬票數改優先級。

## Red Team

1. #141 是否只是單元綠燈？否；exact push workflow完成 artifact、Pages、Worker、匿名 public hash readback與 outcome。
2. current HEAD 的 run仍 in progress，是否代表回歸？否；新增的是文件提交，且已驗證 product SHA仍有完整 receipt。
3. #4 是否可關單？否；精確 tombstone bug fixed，但 Issue還含 origin-aware admission、external writer、global deletion。
4. committed receipt會不會只是自述？它固定 source hashes、before/after、11 case outputs與測試結果；足以驗證 synthetic oracle，但沒有 hosted CI，故只限 synthetic scope。
5. octobroker是否因 Actions=0開 CI Issue？否；fork main與 upstream完全同 SHA、Issues disabled且無獨立產品決策，缺 fork-local run不成立為支持流程失敗。
6. 是否應導入 graph DB避免 lineage bug？否；局部修正已通過原反例與鄰近正向路徑，沒有證據支持大方案。
7. inventory 45 vs 前輪46是否表示 repo被刪？UNKNOWN；沒有 prior raw page可證明，不做因果猜測。
8. 能否宣告 CLEAN？不能；inventory continuity、A01–J05兩輪與必要 runtime未滿足。

## NOW / NEXT / LATER / DON'T

- NOW：保留 GovIntel rights-blocked/admission與 adng broader runtime 證據邊界；不再把已修 exact fingerprints列 NOW。
- NEXT：公平游標 `openab`；保存可逐名比對的 inventory snapshot；等待 current docs-only run自然完成但不忙輪詢。
- LATER（需 owner 明確授權）：adng 真 owning-writer isolated pilot；GovIntel formal evidence admission治理。
- DON'T：不重開 #141、不關閉整體 #4、不把 octobroker fork當獨立產品、不導入 graph DB/platform、不中斷或重跑 in-progress workflow、不啟動 worker/GOAL、不修改產品/CI/config/settings。

## Decision Memo

- 服務誰：依賴公開 GovIntel發布的使用者/SRE，以及依賴 adng synthetic lifecycle contract做研究決策的 owner/reviewer。
- 選擇／競爭理由：以可追溯的同路徑 evidence作差異，而不是功能數或外部供應商 breadth。
- 前三優先：(1) 保存修復後 runtime receipt；(2) broader gaps保持誠實、不誤關；(3)完成公平 inventory輪巡與CLEAN固定門檻。
- 不做／刪除：不新增服務、資料庫、agent平台；不刪 fail-closed gates。可從 NOW清單刪除兩個已驗證 exact defect。
- 風險／實驗：最大風險是把 scoped fixed外推成整體 readiness。任何 broader宣稱必須有 owning runtime或正式 admission證據。
- Portfolio：`taichung-police-intel=INVEST reliability, exact regression cleared`；`adng-memory=MAINTAIN + NARROW`；`octobroker=PAUSE as identical upstream fork`。完整 ranking仍需完成輪巡。
- 建議不是實作、merge、部署、付費或外部寫入授權。

## 寫入與追蹤 ledger

| 類型 | 數量 | 實際結果 |
|---|---:|---|
| New Issue | 0 | 無 |
| Existing Issue substantive update | 2 | taichung #141、adng #4 |
| Reopen | 0 | 無 |
| Verified fixed | 2 | #141 full regression；#4 exact synthetic fingerprint |
| Dedup/reject | 2 | 沿用原 Issues；octobroker無獨立缺陷 |
| Scope correction | 1 | #4 exact fixed，但 broader research仍 open |
| Product/CI/config write | 0 | 無 |
| Audit report | 1 | 本檔，audit-only Draft PR #154 |
| Write blocked / locked | 0 | 無 |

## Runtime pending

- `taichung-police-intel@cade5a7…` docs-only automatic run 37322381207：查閱時 in progress；不視為 failure。
- `adng-memory`：沒有 hosted CI；external writer/runtime、origin-aware admission、retrieval permission recheck、global deletion仍 pending。
- Portfolio CLEAN：未達兩輪完整 A01–J05與必要 runtime；**NOT CLEAN**。
