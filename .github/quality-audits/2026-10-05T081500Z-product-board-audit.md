# Product Board Audit — 2026-10-05T08:15:00Z

## 結論與範圍

- 狀態：**PARTIAL / NOT CLEAN**。已完整分頁列舉 Reese-max 自有 inventory（46；45 active，1 archived），並完成上輪後預設分支變更、精確 HEAD CI、合併 PR、Issue／review thread 與公平游標的增量核對；本輪沒有宣稱重新深讀 45 個 active repo 的全部產品面。
- 實質 finding：`Reese-max/adng-memory#4` 在 default HEAD `28948ee759427b9a6f2b3b8010df9848442a87e9` 仍可讓 tombstoned lineage 的傳遞後代重新 `ACTIVE`。已用 exact-current-source 隔離重播，原 Issue 已重開：https://github.com/Reese-max/adng-memory/issues/4
- 分級：`kind=VALIDATION_GAP`、`severity=P3`、`decision_priority=NOW`、`triage=NEEDS_REVIEW`、`auto_implementation=false`。目前只證明研究 oracle／驗收失真；README 明示沒有 writer implementation，故不升成 production BUG/P2。
- 寫入：新 Issue 0；更新/重開 1；重複 1（沿用 #4）；拒絕大型方案 4；產品實作 0。
- 公平游標：已消化 `ninax-line-hermes`（HEAD `f820dfad1d318222a03fe3ec5d198baad4a93d8c`，exact-head NINAX checks success run 37262080079）；下一個 `note-filler`。adng-memory 是 post-merge review 觸發的優先插隊，不取代公平輪巡。

## 依據與證據版本

- Issue quality v2 blob：`8167e10798071d2276addaff6b201c6b0e904a2a`
- autodev-ng default HEAD：`f86a36d5cde92e09c93038fa8d75f0d18f4007e7`；CI success run 37270541967。
- adng-memory default HEAD：`28948ee759427b9a6f2b3b8010df9848442a87e9`
- verifier blob：`bdabee9fdf43522b066a9259639a2c1ff0094933`
- fixture blob：`35172f764d6afb37a3d440f9633db944ea588811`
- evidence type：SOURCE_CONFIRMED + EXECUTED_REPRODUCTION。沒有 hosted Actions、正式 writer、provider、正式資料或跨 clone/backup purge 實測。

## Inventory 與增量 Discovery

Active 45：92-duty-scheduler, academic-mcp, adng-memory, ai-flight-radar, ai-novel-workstation, autodev-ng, avatar-vfo, cf-ai-router, cf-mcp-server, chatgpt-dual-pipeline, claude-mem, clinical-scribe-worker, cyber-prep-coach, exam-archive, flux-image-gen, google-maps-personal-mcp, herdr-skills, lobsterpulse, MaterialYouNewTab, minideck, neciken-summer-poem, ninax-line-hermes, note-filler, octobroker, openab, openab-pty, police-essay-mcp, police-exam-archive, police-exam-practice, polygraph-research-2026, ppt-studio, project-doctor-web, prompt-autoresearch, skill-foundry, soundbox-offline, spotify-playlist-organizer-mcp, studio, taichung-police-intel, taiwan-intel-dashboard, tick-stock-panel, travel-planning-app, travel-planning-mcp, UkePack, video-timeline-pipeline, voice-actress。

Archived/excluded：`obsidian-vault`（archived；內容庫，保留於 inventory，不作產品缺陷面）。沒有因空 repo／內容型 repo 缺少產品表面而硬開單。

上輪後 default HEAD 變更並核對的產品：
- `autodev-ng@f86a36d`：PR #58 merged；CI success。
- `taichung-police-intel@14541aca`：PR #138 merged；Verify PRs 與 refresh/deploy demo push runs success。
- `video-timeline-pipeline@46a117d9`：PR #15 merged；offline cost/timezone regression run success。
- `skill-foundry@17e90d85`、`voice-actress@a10c97ff`、`google-maps-personal-mcp@2f3c4520`、`project-doctor-web@d70c383f`、`travel-planning-mcp@3f422790`：各自 exact-head CI success。
- `tick-stock-panel@7b83f370` 與 `adng-memory@28948ee7`：沒有 GitHub Actions；綠燈不得推定。
- `academic-mcp@67304e67`：最近 exact-head run success。
- 其餘 inventory 本輪保留先前證據與公平游標，不將 audit-only commit 當產品回歸。

## Finding F-01 — 傳遞 tombstone lineage 復活

### 問題成立

受影響者是使用 #4 synthetic oracle 決定「research acceptance 是否完成」的 owner、reviewer 與未來 writer pilot。可達流程：

1. raw receipt commit；
2. tombstone(raw)；
3. x derived_from raw，正確被 reject；
4. y derived_from x，predecessor 仍指向 tombstone head；
5. verifier 只看 y 的直接父 x 是否 `TOMBSTONED`；x 是 `REJECTED`，所以 y 被 commit，current read 回 `ACTIVE`。

實際結果：`["commit","tombstone","reject","commit"]`、`active_head=rt-y`、`cannot_verify=false`、`current_read.status=ACTIVE`。這直接推翻 #4「0 個已 tombstoned 且已登記 lineage 的 derived item 仍被 current-reader 當 ACTIVE」成功條件。

fingerprint：`adng-memory + lifecycle verifier + tombstone(raw) + rejected direct descendant + descendant-of-rejected commit + direct-only lineage state lookup + current read returns ACTIVE`。

### 四道門檻

1. 問題成立：exact-current-source 隔離重播；不是競品缺口或主觀美化。
2. 分級合理：VALIDATION_GAP/P3；production impact NOT_ESTABLISHED。決策優先 NOW 是為了撤回錯誤 closure，不等同 P2 產品事故。
3. 最小範圍：同一 verifier 內傳遞 lineage 判斷或可重播 tombstone taint，加一個四步 fixture與一個正常多層 control；不增 DB、graph service、registry、跨 repo framework。
4. 研究/實作分離：NEEDS_REVIEW，auto_implementation=false；本稽核沒有啟動 worker。

### 最小驗收

- 四步反例的 `rt-y` 不得 `ACTIVE`，current read 保持 `CANNOT_VERIFY` 或 tombstone fail-closed。
- persisted receipt replay 與同一 process replay 同結果。
- 非 tombstoned 的正常多層 lineage 仍可依既有 contract 啟用。
- 既有 8 scenarios 與 focused tests 均通過。
- 文件仍明示這是 synthetic oracle，外部 writer 保持 NEEDS_RUNTIME_VERIFICATION。

### Red Team

- 反證 1：直接 tombstoned parent 已被阻擋。成立，但無法推翻傳遞後代反例。
- 反證 2：兩個其他 unresolved review（stale predecessor、unknown lineage）已由 current source 修正，故不另開單。
- 反證 3：repo 無 writer runtime，因此不是 production deletion incident。成立，據此降到 P3。
- 反證 4：可用 graph DB 解決。沒有證據證明需要；局部 DFS/taint 即可，拒絕大方案。
- 反證 5：原 fixture 8/8 通過。只證明現有案例，不覆蓋 reject→descendant 的傳遞路徑，無法維持 closure。

## 外部競品／替代工作流（查閱 2026-10-05）

| 對象 | 官方現況與日期 | 對本產品的可移植訊號 | 判定 |
|---|---|---|---|
| Microsoft Agent Framework / Azure Cosmos memory | 官方頁 2026-08-25 更新；要求 authenticated user/tenant/session scope、TTL、backup、retention、deletion，且 memory 不得直接授權 | MUST MATCH：scope、retention、deletion boundary；不需複製 Cosmos | CONFIRMED — https://learn.microsoft.com/en-us/agent-framework/integrations/by-component/context-providers/azure-cosmos |
| Neo4j Agent Memory 0.6.0 | 三層 memory、同一 graph、fact validity；Labs、無 SLA／相容性保證 | SHOULD BE BETTER：以 dependency-free receipt contract 提供可審計失敗；DO NOT COPY：只因有 graph 就導入 Neo4j | CONFIRMED — https://neo4j.com/labs/agent-memory/ |
| Zep Context Graph | temporal user graph；官方 migration docs說明 episode delete 會移除僅由該 episode 衍生資料，user delete 移除關聯資料 | MUST MATCH PRINCIPLE：derived deletion 可驗證；供應商宣稱不等於本 repo效果 | CONFIRMED — https://help.getzep.com/mem0-to-zep ; https://help.getzep.com/deleting-data-from-the-graph |
| Mem0 | hosted API提供 add/search/update/delete CRUD | ALTERNATIVE：易用 CRUD；DIFFERENTIATOR：本 repo聚焦 exact predecessor／receipt replay，而非 managed memory | CONFIRMED — https://docs.mem0.ai/platform/quickstart |
| Letta | core memory blocks可跨互動持久化、可 read-only；shared archival memory可供多 agent 共用 | SHOULD MATCH：authority/read-only boundary；DO NOT COPY：不把 shared memory 本身當授權或效果證據 | CONFIRMED — https://docs.letta.com/v1-sdk/memory/memory-blocks ; https://docs.letta.com/guides/agents/multi-agent-parallel-execution/ |

市場宣稱、效能數字、星數與 pricing 未用作收益、發生率或優先級證據。此 finding 由 repo重播成立，不由競品存在成立。

## Product Board 多視角推演

- CEO：只做三件事——讓 #4 closure 與證據一致、補一個最小傳遞回歸、把真 writer pilot留給另一次明確授權。不做 graph DB、共用平台、產品化 memory service。
- CPO：產品價值是「可驗證且誠實的 operational memory contract」，不是功能數；reopen 比新增 feature 更重要。
- CTO／Staff Engineer：局部 ancestor walk 或 persist taint 足夠；需評估 cycle/unknown lineage fail-closed，但不建通用圖引擎。
- UX Research：synthetic personas 只能暴露 journey摩擦，不能當真人偏好或發生率。
- Growth：此 finding沒有 acquisition 證據；不做行銷故事。
- CFO：沒有支持新基礎設施的 ROI；選擇小修。
- Security/Privacy：刪除 lineage 的 fail-closed 是必要原則，但 global purge仍未驗證。
- QA：新增四步回歸與正常多層 control；不能以原 8/8取代。
- SRE：無 hosted CI；本輪本機 exact source重播不得冒充部署或 provider證據。
- Accessibility：報告與 Issue 使用文字狀態，不依賴顏色。
- Support：對外只能說 research oracle仍可重現，不可說 production data 已受影響。
- 分歧：CPO偏向立即修 contract；Security希望先做 writer pilot；CTO判定先修 oracle、pilot後置，避免把研究缺口擴成跨 repo工程。

## 50 合成 Persona（30 回歸／20 探索）

這是模型多視角推演，不是 50 名真人、票數、發生率、收益或優先級證據。R=固定回歸，E=探索。

| ID | 背景／限制 | 任務／旅程 | 摩擦／結果 | 分級／建議 | 證據 |
|---|---|---|---|---|---|
| P01 (R) | 單 repo 維護者；無 hosted CI | 確認 deletion fixture 可重播 | 直接 tombstone 後第一層被拒，但第二層復活 | P3／補傳遞 fixture | EXECUTED_REPRODUCTION |
| P02 (R) | 多 repo patrol owner；需可追溯 | 讀 current memory 後分派工作 | oracle 可能把刪除 lineage 當 ACTIVE | P3／先修 contract | EXECUTED_REPRODUCTION |
| P03 (R) | 隱私 reviewer；不得留敏感本文 | 驗證 derived purge | 傳遞後代逃過 tombstone | P3／fail closed | EXECUTED_REPRODUCTION |
| P04 (R) | SRE；只信 exact HEAD | 重播 restart receipts | 直接父檢查無法代表祖先 | P3／補 restart regression | SOURCE+EXECUTED |
| P05 (R) | QA；避免綠燈誤判 | 跑既有 8 cases | 現有 deletion case 只到直接後代 | P3／鄰近案例 | SOURCE_CONFIRMED |
| P06 (R) | 安全工程師；最小權限 | 判斷 memory 能否授權 action | repo 本身無 writer；不能外推 production | NOT_ESTABLISHED／保留 runtime 門 | README |
| P07 (R) | 研究 owner；防過度工程 | 判斷 #4 是否可關 | 成功條件被反例推翻 | P3／重開原單 | EXECUTED_REPRODUCTION |
| P08 (R) | Reviewer；追 review thread | 核對 PR #5 未解意見 | transitive thread 未解且 main 可重現 | P3／同根因去重 | PR_THREAD+EXECUTED |
| P09 (R) | 資料治理者；需 RTBF 邊界 | 追 raw→summary→derived | global backup/clone 未驗證 | NEEDS_RUNTIME_VERIFICATION | README+ISSUE |
| P10 (R) | 離線開發者；零外部服務 | 在本機驗證 lifecycle | dependency-free oracle 可跑但覆蓋不足 | P3／局部測試 | EXECUTED_REPRODUCTION |
| P11 (R) | Windows 操作者；PowerShell health | 跑 health 驗證 | 本輪未跑真 PowerShell/hosted CI | UNKNOWN／不宣稱 | EVIDENCE_LIMIT |
| P12 (R) | 事故調查者；需 exact receipt | 重建 action 當時 head | 傳遞 lineage 可改寫 current truth | P3／保留 incident path | STATIC_INFERENCE |
| P13 (R) | 合規 reviewer；需刪除證明 | 查 deletion receipt | 只證明 synthetic oracle，不證明外部 store | NEEDS_RUNTIME_VERIFICATION | README |
| P14 (R) | CLI 使用者；錯誤訊息有限 | 讀 CANNOT_VERIFY | 實際被錯誤清成 ACTIVE | P3／回歸斷言 | EXECUTED_REPRODUCTION |
| P15 (R) | 新貢獻者；只看 issue closure | 依 closed #4 判斷完成 | closure 會誤導後續規劃 | P3／重開並說明 | ISSUE_STATE |
| P16 (R) | Maintainer；避免 duplicate | 搜尋同 fingerprint | 原 #4 精確覆蓋 success criterion | 去重／重開 #4 | ISSUE+PR |
| P17 (R) | 產品 owner；控制 scope | 選擇最小修正 | 不需 graph DB 或新服務 | SIMPLIFY | RED_TEAM |
| P18 (R) | 平台工程師；跨 repo reuse | 評估共用 contract | 外部 writer 尚未接入 | NEXT／獨立 pilot | README |
| P19 (R) | 測試工程師；鄰近路徑 | 驗證正常多層 lineage | 目前缺同時保護正向鏈的案例 | P3／加入 control | SOURCE_CONFIRMED |
| P20 (R) | 安全測試者；惡意組合 | 組合 reject→child commit | 可繞過直接父 tombstone | P3／傳遞 taint | EXECUTED_REPRODUCTION |
| P21 (R) | 恢復工程師；partial restore | 缺 lineage 時 fail closed | unknown direct lineage 已 defer | 維持現狀 | SOURCE_CONFIRMED |
| P22 (R) | 狀態機 reviewer；predecessor | 驗證 stale activation | persisted predecessor 已檢查 | 不另開單 | SOURCE_CONFIRMED |
| P23 (R) | Schema reviewer；嚴格型別 | 檢查日期/版本 | 先前 review 已修正 | 不另開單 | SOURCE_CONFIRMED |
| P24 (R) | 成本敏感 maintainer | 評估修復成本 | 局部 DFS/taint + fixture 即可 | NOW／小修 | STATIC_INFERENCE |
| P25 (R) | API owner；無正式資料 | 隔離測試再決策 | 本輪未觸碰正式 writer | 安全可驗證 | EXECUTED_REPRODUCTION |
| P26 (R) | 支援人員；需清楚狀態 | 回答是否修好 | 只能標 STILL_REPRODUCIBLE | 保持 open | EXECUTED_REPRODUCTION |
| P27 (R) | 可及性 reviewer；讀表格 | 辨識決策與證據 | 需避免只用顏色表達 | 文件維持文字狀態 | AUDIT |
| P28 (R) | 財務 owner；反對新平台 | 評估導入 graph DB | 沒有規模/收益證據 | DON'T | RED_TEAM |
| P29 (R) | CEO；只做三件事 | 選定本輪前三項 | 修 oracle、補回歸、保留 pilot 邊界 | NOW/NEXT | BOARD_SIMULATION |
| P30 (R) | Portfolio auditor；CLEAN 門檻 | 判斷是否 portfolio clean | 仍有重開 finding、無兩輪 runtime | NOT CLEAN | AUDIT_RULE |
| P31 (E) | 雙 writer operator；競爭 candidate | 模擬同 scope 並發 | 原子 activation 未驗證 | NEXT／另授權 pilot | UNKNOWN |
| P32 (E) | 備份管理者；多 clone | 驗證刪除跨備份 | 本 repo 無法證明 global purge | DON'T CLAIM | README |
| P33 (E) | Mobile operator；手機查狀態 | 讀 current memory | 無 mobile path 證據 | UNKNOWN | EVIDENCE_LIMIT |
| P34 (E) | 低頻專案 owner；資料長期不變 | 避免 age=stale | 舊資料未必錯 | 維持語意 gate | RED_TEAM |
| P35 (E) | 內容庫 owner；非產品 repo | 評估是否套 lifecycle | 不是所有內容需 durable state contract | DEFERRED | RED_TEAM |
| P36 (E) | Graph DB 倡議者 | 提議導入 Neo4j | 競品能力不證明本 repo需要 | DON'T COPY | COMPETITOR |
| P37 (E) | Mem0 使用者；CRUD 心智 | 期望 update/delete | CRUD 不等於 lineage deletion proof | NEEDS_EVIDENCE | COMPETITOR |
| P38 (E) | Zep 使用者；temporal graph | 比較 episode delete | 官方文件顯示 derived-only 資料處理，但非本 repo效果證據 | RESEARCH_ONLY | COMPETITOR |
| P39 (E) | Letta 使用者；共享 block | 共享跨 agent memory | 共享提高 blast radius；需權限邊界 | NEEDS_REVIEW | COMPETITOR |
| P40 (E) | Azure architect；tenant isolation | 套用 authenticated scope | 方向相符但外部平台非必要 | SHOULD MATCH PRINCIPLE | COMPETITOR |
| P41 (E) | 供應商中立採購者 | 比較 hosted vs local | 本 repo主打可稽核合約非 managed service | DIFFERENTIATOR | BOARD_SIMULATION |
| P42 (E) | 資料最小化 advocate | 避免完整攻擊 payload | 只保存合成 fixture／hash | MAINTAIN | SECURITY_REVIEW |
| P43 (E) | 模型安全 reviewer | 測 memory poisoning | 本 finding 是 deletion lineage，不與 poisoning混單 | DEFERRED | DEDUP |
| P44 (E) | Support escalation | 收到『已刪仍出現』 | 需要先分辨 oracle、writer、backup 根因 | NEEDS_EVIDENCE | RED_TEAM |
| P45 (E) | Owner 決策者；拒絕大方案 | 審核最小變更 | 不建立 registry/ledger/framework | SIMPLIFY | BOARD_SIMULATION |
| P46 (E) | 審計員；需 blob SHA | 重現 exact evidence | source/fixture/rules SHA 均固定 | TRACEABLE | SOURCE_CONFIRMED |
| P47 (E) | CI 管理者；無 workflow | 期待 hosted run | repo 無 Actions；本機重播不能冒充 CI | NEEDS_RUNTIME_VERIFICATION | ACTIONS |
| P48 (E) | 開源使用者；看 semver | 假設 research contract 穩定 | 尚無 runtime guarantee | MAINTAIN DISCLAIMER | README |
| P49 (E) | 跨語言 writer；非 Python | 移植 contract | 先證明 Python oracle正確再 pilot | NEXT | STATIC_INFERENCE |
| P50 (E) | Red-team challenger | 嘗試推翻開單 | 直接父已修、production未證實，但 exact acceptance仍失敗 | KEEP REOPENED P3 | EXECUTED_REPRODUCTION |

未產生 Synthetic Preference Share；沒有用 persona「票數」替代四道門檻。

## NOW / NEXT / LATER / DON'T

- NOW：維持 #4 reopened；修正或明確縮回傳遞 tombstone acceptance；加最小回歸與 control。
- NEXT：修正進 default branch 後，重跑同一四步與鄰近正常多層 lineage，分類 VERIFIED_FIXED/PARTIALLY_FIXED/STILL_REPRODUCIBLE。
- NEXT（需另行授權）：挑一個 external writer 做隔離 restart/conflict/tombstone pilot。
- LATER：origin-aware admission／memory poisoning 只保留窄研究；不得綁住本次 deletion 修正。
- DON'T：不導入 Neo4j/Mem0/Zep/新 DB，不建通用 memory security平台，不啟動 worker/GOAL，不把 Issue/分數/董事會模擬當實作授權，不宣稱 global deletion或 production protection。

## Decision Memo

服務對象：跨 repo patrol/agent 的 owner、reviewer、SRE與 privacy reviewer；他們需要知道 current state 是否真有 authority、可否重播、何時應 CANNOT_VERIFY。

選擇與競爭理由：與 managed memory產品比，`adng-memory` 的合理差異不是更大 retrieval 或更多 integrations，而是小型、可審計、provider-neutral receipt contract。必須先把自身 oracle 的傳遞語意做對。

前三優先：
1. 關閉傳遞 tombstone false positive。
2. 把 exact-current-source 反例固化為 regression fixture，並保護正常多層 lineage。
3. 保留 production runtime gate，另案才做 external writer pilot。

刪除／不做：刪除「PR #5 已證明全部 deletion acceptance」的結論；不做 graph DB、跨 repo state平台、poisoning classifier、正式資料失敗注入。

風險與實驗：ancestor walk需防 cycle/unknown nodes；最小實驗是合成四步反例 + 正向 control + receipt restart replay。BUILD/NARROW/REJECT：本輪 **NARROW**（局部 contract/test）；writer pilot未授權；大型方案 REJECT。

Portfolio 建議：`adng-memory=SIMPLIFY/MAINTAIN`；其他產品維持既有策略，不因本輪單一 research oracle finding 做 MERGE/PAUSE/ARCHIVE。完整 portfolio ranking等待公平輪巡完成，不以本 PARTIAL輪次下結論。

## 回歸與 runtime pending

- #4：STILL_REPRODUCIBLE at `28948ee7`；修正後才能重驗。
- `neciken-summer-poem#1`：前輪 VERIFIED_FIXED at `d54daa39`，run 37253264588（Ruff通過、pytest 633 passed/4 skipped/43 subtests）。
- 其餘本輪成功 CI只證明各 workflow覆蓋，不等於 provider、手機、正式授權或 deployment全路徑。
- Portfolio CLEAN：否。固定 A01–J05 全停止條件、兩個完整合格輪次與必要 runtime證據均未完成。

## 寫入帳

- 新 Issue：0
- 更新/重開：1（adng-memory#4）
- 去重：1（未另開同根因）
- 新研究單：0
- 分級校正：P2-style review signal → product severity P3 / decision NOW
- 已驗證修復：0（本 finding）
- 寫入阻塞：0
- 未完成：45 active repo 的下一輪公平深讀；next cursor `note-filler`
