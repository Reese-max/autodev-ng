# 產品董事會增量稽核：ai-flight-radar 乾淨安裝啟動阻擋

- 稽核時間：2026-10-03T02:00:22Z
- 狀態：PARTIAL / NOT CLEAN
- 規則 blob：8167e10798071d2276addaff6b201c6b0e904a2a
- Portfolio inventory：Reese-max 45 repos；44 未封存、1 封存（obsidian-vault）。本輪未發現任何 default-branch 新 commit。
- Inspected default SHA：ai-flight-radar 6228138337f950cb6399088c4f814f27a518e29e
- Candidate SHA：PR #16 82e34e6ca9c60122daa4eadeb867cff1e8ac3e95；比較 PR #14 11cadbc2e19a0ac47a98fdcebc9c4edbfcc7d993

## 結論

確認一項可達的 P1 啟動回歸：default manifest 允許 sqlmodel>=0.0.22,<0.1，乾淨解析現為 0.0.47；現有 core/database.py 以 datetime.utcnow() 寫入 UTCDateTime 欄位。新型別契約拒絕 naive datetime，導致 init_db 在任何 HTTP ready 前中止。PR #16 的 exact-head Quality checks 同時在 pytest 與 container-smoke 重現；PR #14 於 2026-10-01 已重現相同 ValueError。這不是 PR #16 單獨造成，而是 default branch 的浮動相依解析與程式相容性共同根因。

- kind=BUG
- severity=P1
- decision_priority=NOW
- triage=NEEDS_REVIEW
- auto_implementation=false
- confidence=HIGH
- evidence=EXECUTED_REPRODUCTION + SOURCE_CONFIRMED
- runtime=部署中實際 image / volume 狀態仍 NEEDS_RUNTIME_VERIFICATION
- fingerprint=ai-flight-radar+clean dependency install or container restart+init_db migration insert+service never becomes ready+naive datetime rejected by SQLModel UTCDateTime

## 直接證據

1. Default requirements.txt 允許 sqlmodel 0.0.47；Dockerfile 每次由該 manifest 乾淨安裝。
2. core/database.py 的 RadarMigration.applied_at 與 Route.created_at 使用 datetime.utcnow()。
3. PR #16 Quality checks run 37086397158：tests job 在 pytest 失敗；container-smoke image build 成功，但公開模式啟動後連線重設並持續無法連線。
4. 容器 log：Startup or supervision failed，ValueError 指示 UTCDateTime 必須有 timezone information；SQL 為 INSERT INTO radar_migrations。
5. PR #14 run 36798530375 於 2026-10-01 已出現相同根因，證明不是單次 runner flake。
6. PR #16 的 Cloudflare Workers checks 與 lock drift gate 成功，不能替代 Python 產品啟動路徑。

來源：
- https://github.com/Reese-max/ai-flight-radar/actions/runs/37086397158
- https://github.com/Reese-max/ai-flight-radar/actions/runs/36798530375
- https://github.com/Reese-max/ai-flight-radar/blob/6228138337f950cb6399088c4f814f27a518e29e/requirements.txt
- https://github.com/Reese-max/ai-flight-radar/blob/6228138337f950cb6399088c4f814f27a518e29e/core/database.py
- https://github.com/Reese-max/ai-flight-radar/pull/16
- https://github.com/Reese-max/ai-flight-radar/pull/14

## 影響與最小有效範圍

受影響者：乾淨安裝、自架 Docker、重建或滾動更新的操作者，以及依賴該 API 的價格監控使用者。核心路徑在 DB 初始化即停止，首頁、health、公開 quotes、管理員掃描與通知皆不可達。

最小方案：
1. 將 migration receipt 與預設 Route 的寫入改為 timezone-aware UTC（例如 datetime.now(timezone.utc)），不改 schema、不清資料。
2. 加入直接覆蓋 init_db 與既有 SQLite volume restart 的回歸；保留 public auth 401、非 root 與資產 smoke。
3. 在相同 locked graph 重跑 pytest、container startup、restart、health/config/quotes；確認既有資料 row count 與檔案 hash 不因修正被重建。
4. 再決定鎖定相容版本；只下修 SQLModel 可作暫時回復，但不能取代相容修正與回歸。

非目標：不重寫資料層、不新增 provider、不變更通知、不部署、不觸碰正式資料。

## 互斥與去重

Issue 全量搜尋未找到 UTCDateTime / datetime.utcnow / sqlmodel startup 同 fingerprint。Issue #2 是可重現建置；PR #14、#16 均正在修改相依鎖與 CI，且三個 issue-2 branches 活躍。依互斥規則標記 SKIPPED_LOCKED_ACTIVE_PR：不在產品 repo 搶鎖、不留言、不另開 Issue、不改 PR scope。此中央報告只保留獨立證據；待 owner/現有實作者整合。

## 外部競品與替代工作流（2026-10-03 查閱）

| 對象 | 官方證據 | 對本產品的含義 | 判定 |
| --- | --- | --- | --- |
| Google Flights | https://support.google.com/travel/answer/6235879 | 價格追蹤與通知是替代流程；基本可用性是前置條件 | MUST MATCH：能可靠啟動；不把競品功能當缺陷證據 |
| Skyscanner | https://help.skyscanner.net/hc/zh-tw | 搜尋後轉向供應商完成預訂 | DIFFERENTIATOR：自架、可審查監控；不複製完整 OTA |
| KAYAK | https://www.tw.kayak.com/ | 官方頁面說明保存搜尋、價格提示與推播 | SHOULD BE BETTER：來源與通知收據透明；不複製未驗證預測宣稱 |
| 手動試算表＋航空公司官網 | 無單一供應商依賴 | 最小替代可運作但需人工反覆查價 | 現有 workaround；不因競品存在而擴大工程 |

外部產品宣稱不是本次 P1 的證據；P1 只由 repo 與 exact-head runtime 收據支持。

## 產品董事會多視角推演

- CEO：若只做三件事，先恢復乾淨啟動、固定相容解析、重跑容器／既有 volume；不做新 provider、預測模型或 UI 擴張。
- CPO：首次成功在服務啟動前失敗，任何新功能排序都應讓位。
- CTO：修 aware UTC 的根因，再以 locked graph 驗證；避免只 pin 舊版掩蓋相容問題。
- Staff/Principal Engineer：兩個直接 utcnow 寫入點與 init_db 回歸是最小邊界；不建立新 migration framework。
- UX Lead/Researcher：錯誤不是文案摩擦；沒有可到達 UI，優先恢復路徑。
- Growth：不可用服務無法支撐啟用；不以合成人格比例宣稱轉換改善。
- CFO：失敗重啟可能浪費運算，但沒有成本量測，不填 ROI。
- Security/Privacy：修正不得繞過 API key、非 root 或清除資料；目前無新外洩證據。
- QA：兩次 hosted run 的同根因足以排除單次 flake；需 landed-head 重跑才 VERIFIED_FIXED。
- SRE：build 成功不等於 ready；保留 startup/restart/health 三段收據。
- Accessibility：後端不可用使所有輔助功能不可達；不另開 UI 美化單。
- Support：把 connection reset 對應到明確 UTCDateTime log，避免誤判網路。

分歧：CTO 可接受短期 pin 已知可用 SQLModel 以恢復，但 Staff/QA 認為若沒有 aware UTC 修正與防回歸，下一次更新會重現。董事會建議 NARROW：局部修正＋鎖檔＋啟動驗證，拒絕資料層重寫。

## 50 合成 Persona（純模型推演，不是真人票數）

30 個回歸基線、20 個探索；與固定 A01–J05 CLEAN audit 分開。所有 P1 結論均來自相同可達根因，不以人數作為優先級證據。

| ID | 背景／限制 | 目標／旅程 | 摩擦／結果 | 分級／建議 | 證據 |
| --- | --- | --- | --- | --- | --- |
| R01 | 學生／手機、有限網路 | 建立台北-日本低價監控 | 乾淨啟動失敗，無法進首頁 | P1；先修 UTC 寫入 | EXECUTED_REPRODUCTION |
| R02 | 上班族／只能晚間操作 | 新增航線並保存 | API 容器無健康回應 | P1；阻止壞鎖進版 | EXECUTED_REPRODUCTION |
| R03 | 家庭規劃者／多人日期 | 比較不同日期 | DB init 在 migration 前中止 | P1；同根因 | EXECUTED_REPRODUCTION |
| R04 | 常旅客／多航線 | 讀取已存監控 | 重啟仍在 INSERT bind 失敗 | P1；需 landed-head 重跑 | SOURCE_CONFIRMED |
| R05 | 低預算旅客／通知優先 | 設定價格提醒 | 服務未啟動，通知流程不可達 | P1；維持通知非目標 | 靜態因果 |
| R06 | 自架用戶／Docker | 首次 docker run | container-smoke 連線被重設 | P1；修 migration 時區 | EXECUTED_REPRODUCTION |
| R07 | 自架用戶／既有 volume | 容器重啟 | init_db 每次都執行帶 naive datetime 的 insert | P1；既有資料也需驗 | SOURCE_CONFIRMED |
| R08 | 維運者／CI gate | 驗證發行候選 | pytest 56 pass、32 setup errors | P1；不要以部分 pass 放行 | EXECUTED_REPRODUCTION |
| R09 | 維運者／無本機快取 | 乾淨 pip install | 允許範圍解析 sqlmodel 0.0.47 | P1；修程式後再鎖 | EXECUTED_REPRODUCTION |
| R10 | 維運者／回滾需求 | 重建上一環境 | default manifest 未保存可用解析圖 | P2；Issue #2 已追蹤 | SOURCE_CONFIRMED |
| R11 | API 使用者／腳本 | 呼叫 health/config | 程序先於 HTTP ready 失敗 | P1；核心任務不可達 | EXECUTED_REPRODUCTION |
| R12 | 無障礙使用者／鍵盤 | 進入查價頁 | 頁面根本無法載入 | P1；不是 UI 美化題 | 靜態因果 |
| R13 | 繁中使用者／時區敏感 | 查看歷史價格 | UTC 型別拒絕 naive datetime | P1；明確 UTC aware | EXECUTED_REPRODUCTION |
| R14 | 通知訂閱者／Telegram 關閉 | 本機無外部通知啟動 | 即使通知關閉仍 DB init 失敗 | P1；與通知 provider 無關 | EXECUTED_REPRODUCTION |
| R15 | 公開模式訪客／唯讀 | 讀公開 quotes | 容器無法啟動 | P1；維持 fail-closed auth | EXECUTED_REPRODUCTION |
| R16 | 管理者／API key | 觸發掃描 | 401 smoke 前即失敗 | P1；不要削弱 auth 測試 | EXECUTED_REPRODUCTION |
| R17 | 資料維護者／SQLite | 執行 schema seed | RadarMigration.applied_at 無 tz | P1；根因明確 | SOURCE_CONFIRMED |
| R18 | 資料維護者／預設航線 | seed_default_routes | Route.created_at 亦用 utcnow | P1；鄰近路徑一起修 | SOURCE_CONFIRMED |
| R19 | 測試者／Python 3.12 | 跑 integration suite | fixture init_db 全面 setup error | P1；加入相容性回歸 | EXECUTED_REPRODUCTION |
| R20 | 發佈者／Cloud Run 類容器 | 部署新 image | image build 成功但 runtime 崩潰 | P1；build 不等於 runnable | EXECUTED_REPRODUCTION |
| R21 | 開發者／Windows 本機 | 沿用舊 venv | 可能因舊 sqlmodel 暫時綠 | P2；環境差異須顯式 | LIKELY |
| R22 | 開發者／Linux runner | 重現 production install | 精確 head 已失敗 | P1；以 hosted 收據為準 | EXECUTED_REPRODUCTION |
| R23 | 審核者／只看 lock drift | 確認可重現性 | lock gate 綠但產品 gate 紅 | P1；雙閘不可互相替代 | EXECUTED_REPRODUCTION |
| R24 | 審核者／只看 PR body | 判斷可合併 | PR 宣稱 86 tests 但 hosted quality 失敗 | P1；以 exact-head CI 為準 | EXECUTED_REPRODUCTION |
| R25 | 復原操作者／不改資料 | 啟動唯讀檢查 | migration insert 仍先發生 | P1；提供無破壞驗證 | SOURCE_CONFIRMED |
| R26 | 小型團隊／低維運成本 | 自動更新依賴 | 相容性破壞未被上游預警攔住 | P2；持續相容檢查 | SOURCE_CONFIRMED |
| R27 | 隱私敏感使用者 | 確認不外洩 | 此次錯誤未顯示資料外洩 | 無新增隱私 finding | Red Team |
| R28 | 成本敏感使用者 | 避免重複 provider | 服務未進掃描階段 | 不把成本風險升級 | Red Team |
| R29 | 既有 production 用戶 | 持續使用舊 image | 現況部署 SHA 未取得 | NEEDS_RUNTIME_VERIFICATION | UNKNOWN |
| R30 | owner／決策者 | 選最小修正 | 修兩處 aware UTC + 回歸後再鎖 | NOW；不重寫 DB | SOURCE_CONFIRMED |
| E01 | 平台工程師／依賴更新 | 模擬下一版 SQLModel | 缺相容契約測試 | P2；保留 upper-bound 評估 | SOURCE_CONFIRMED |
| E02 | SRE／冷啟動 | 量測第一次 ready | 目前永不 ready | P1；ready smoke 為驗收 | EXECUTED_REPRODUCTION |
| E03 | SRE／滾動更新 | 重啟既有 volume | 仍需真實 volume 驗證 | P1；隔離副本測試 | NEEDS_RUNTIME_VERIFICATION |
| E04 | 資料工程師／UTC | 寫入 migration receipt | naive datetime 被拒 | P1；timezone.utc | EXECUTED_REPRODUCTION |
| E05 | 安全工程師／權限 | 確認修正不放寬 auth | auth 尚未進入 | 非目標；保留 401 smoke | Red Team |
| E06 | QA／突變測試 | 把 aware 改回 naive | 應使回歸測試轉紅 | P2；最小 mutation | 建議 |
| E07 | QA／多版本矩陣 | 舊版與 0.0.47 | 未證明最低支援版 | P2；窄矩陣而非平台矩陣 | UNKNOWN |
| E08 | 產品經理／首次成功 | 從 README 到首個提醒 | 第一步啟動失敗 | P1；可靠性優先於新功能 | SOURCE_CONFIRMED |
| E09 | 客服／故障排查 | 解釋 connection reset | 容器 log 有明確 ValueError | P2；文件化症狀 | EXECUTED_REPRODUCTION |
| E10 | 開源貢獻者／最小 PR | 修 datetime | 兩個直接呼叫點可局部修 | P1；避免服務重構 | SOURCE_CONFIRMED |
| E11 | 部署自動化／鎖檔 | 以 locked graph 建 image | 可建、不可跑 | P1；加入 startup gate | EXECUTED_REPRODUCTION |
| E12 | 部署自動化／回滾 | 回到已知好 image | 未提供 deployed SHA | P2；先記證據，不猜 | UNKNOWN |
| E13 | 分析使用者／歷史資料 | 保留既有 SQLite | 修正不得清資料 | 安全例外；驗收 hash/row count | 建議 |
| E14 | 行動使用者／推播 | 等待價格通知 | 後端不可用 | P1；先恢復服務 | 靜態因果 |
| E15 | 國際使用者／時區 | 跨區日期 | UTC aware 可降低歧義 | P2；不擴張日期重構 | LIKELY |
| E16 | 財務／雲端成本 | 失敗容器重啟 | 可能造成無效運算但未量測 | NOT_ESTABLISHED；不報 ROI | UNKNOWN |
| E17 | Accessibility／低視力 | 錯誤回復 | 目前沒有可操作 UI | P1；恢復核心路徑先 | 靜態因果 |
| E18 | 法遵／資料保存 | migration receipt | 錯誤未證明資料遺失 | 不升級資料損毀 | Red Team |
| E19 | 競品轉換者 | 期待價格追蹤 | 可靠啟動是 MUST MATCH | P1；不複製預測宣稱 | 官方競品 |
| E20 | owner／三件事 | 修啟動、鎖相容版本、重跑容器 | 不做新 provider/重寫/部署 | NOW | 董事會 |

## Red Team

- 反證 1：可能只是 PR 鎖檔造成。否定：default manifest 本來就允許 0.0.47；PR #14 與 #16 在不同候選均同錯。
- 反證 2：只影響測試。否定：container image 可建但實際程序在 init_db 崩潰，health 80 秒內從未 ready。
- 反證 3：既有 DB 已套 migration 就不會失敗。否定：INSERT 的 bind processing 發生在 ON CONFLICT 決策前；仍需隔離 existing-volume runtime 收據確認。
- 反證 4：直接 pin 舊版即可。部分成立，可作止血；但不處理浮動 default manifest、鄰近 Route.created_at 與未來升級。
- 反證 5：屬 P0。拒絕：未證明資料損毀、權限或正式生產全面中斷；部署 SHA 未知，因此維持 P1。
- 反證 6：建立新資料庫／migration framework。拒絕：兩個 aware UTC 修正與窄回歸足夠。

## NOW / NEXT / LATER / DON'T

- NOW：由現有 PR owner 整合 aware UTC 最小修正；精確 locked graph 重跑 tests + container startup/restart。
- NEXT：取得實際 deployed SHA 與非破壞 health；若產品變更進 main，以 landed SHA 重跑。
- LATER：建立窄版 dependency compatibility lane，僅覆蓋支援 Python/SQLModel 邊界。
- DON'T：不清正式 DB、不建立新服務、不為競品功能開大型工程、不把 lock drift 綠燈當產品修復。

## Decision Memo

服務對象是想自架、可審查地追蹤航班價格並接收提醒的人。相較大型航旅搜尋，差異化應是透明來源、可控掃描與自有部署；這個差異化的最低前提是乾淨安裝和重啟可靠。前三優先：可啟動、可重現、可驗證回復。不做新預測、預訂整合或額外 provider。建議：MAINTAIN 產品方向、SIMPLIFY 修正範圍、PAUSE 目前兩個鎖檔候選的合併，直到產品 gate 綠。此建議不是合併或實作授權。

## 回歸與 CLEAN

- 當前分類：REGRESSION（upstream-compatible resolution path） / NEEDS_RUNTIME_VERIFICATION（實際部署）。
- 修正尚未進 default branch，故不得標 VERIFIED_FIXED。
- 本輪沒有 default-branch product commit；沒有產品實作、合併、部署或正式資料操作。
- Portfolio 不是 CLEAN：沒有完成固定 A01–J05 兩個完整合格輪次，且多項 runtime 證據仍缺。

## 寫入統計

- 新 Issue：0
- 更新／重開 Issue：0
- 中央報告：1
- 去重：Issue #2、PR #14、PR #16
- 鎖定跳過：1（SKIPPED_LOCKED_ACTIVE_PR）
- 已驗證修復：0
- 未完成：existing-volume runtime、deployed SHA、landed-head regression