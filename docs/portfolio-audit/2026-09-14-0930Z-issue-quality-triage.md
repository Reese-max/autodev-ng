# Issue Quality v2 — 首批落地紀錄

日期：2026-09-14。Issue 分流 run：`2026-09-14T09:30:04Z`。

這是使用者要求的排程／Issue 品質優化，**不是新一輪 50-Persona 稽核、程式修復或 runtime 驗證**。

## 已保存的共用規則

[Issue Quality v2](2026-09-14-issue-quality-v2.md) 已建立，commit `4aa5c0469994b6dc008614d967e32f5b1e1c93fd`，並讀回確認 blob `8167e10798071d2276addaff6b201c6b0e904a2a`。

三個既有排程的完整提示詞已實際更新成功：產品董事會、固定 Persona Audit、外部競品靈感雷達。只更新 prompt，沒有新建重複任務、改寫頻率或啟停其他任務。更新回傳的頻率分別為董事會每 3 小時、Persona 每 3 小時、雷達每 2 小時；這是本次回傳快照，不宣稱日後不會再被變更。

新增重點：分開缺陷／驗證缺口／維護／研究／機會，嚴重度由影響證據支持，先比較較小方案，簡單 Issue 使用直接驗收而非完整董事會報告，允許零新單，研究不可因有編號或高分就自動實作。原固定 A01–J05、兩個完整合格輪次及必要執行路徑的 CLEAN 條件保留。

## 本次實際更新

| 追蹤項目 | 更新內容 | 狀態 |
|---|---|---|
| [音樂專案 #5](https://github.com/Reese-max/spotify-playlist-organizer-mcp/issues/5) | P1 → P3／VALIDATION_GAP；最小 CI 重用現有測試，移除大矩陣及無關修復的必要依賴。 | OPEN / NEEDS_REVIEW / auto_implementation=false |
| [音樂專案 #4](https://github.com/Reese-max/spotify-playlist-organizer-mcp/issues/4) | 保留 P2；聚焦已確認 playlist/video ID、完成步驟、unknown-after-write、安全重試。移除完整帳本、quota 統計及 #2 大型研究 blocker。 | OPEN / NEEDS_REVIEW / auto_implementation=false |
| [音樂專案 #2](https://github.com/Reese-max/spotify-playlist-organizer-mcp/issues/2) | 完整 ledger 提案縮為 exact-ID／文件／最小選擇綁定的研究比較；原 P1 缺少重大影響支持，不沿用。保留程式行為與未解核心驗證，退出為 BUILD／NARROW／REJECT。 | OPEN / NEEDS_EVIDENCE / auto_implementation=false |
| 另一個既有 CI 工單 | 修訂本機產品測試與自動 CI 觸發的證據界線，保留原等級及 open；私有 repo 的原始證據與詳細修订保留於該 Issue，不在此複製。 | 已確認更新成功，未執行修復 |
| [音樂專案 umbrella #7](https://github.com/Reese-max/spotify-playlist-organizer-mcp/issues/7) | 同步現行分流，明確區分歷史報告與當前工單，避免後續依旧報告恢復膨脹範圍。 | NOT CLEAN，0/2 不變 |

本批共 **4 張工作工單 + 1 張 umbrella** 更新；新增產品 Issue 0、關閉／重開 Issue 0、產品程式／CI／部署修改 0。

本次不是全部 portfolio Issues 的全面整理。未重新驗證的安全／可靠性項目沒有降級；不把降低工單嚴重度或縮小研究範圍視為已修復。原始完整 audit 保留，沒有覆寫。

## 本次查證範圍

音樂專案 HEAD 為 `4a7fd58d35f7e34492f59dc1e8332301eb81801f`，相對產品 SHA `28589712445e2229d79a1644b360425467ab7404` 只增加兩份 audit。重新讀取相關 handler 與 package.json，確認 exact-ID／自由文字 resolve、兩步寫入與現有測試入口；Actions main 查詢回傳 `total_count: 0`，`.github` 沒有 workflows。這些是來源／平台紀錄，不是測試執行。

其他被整理的 CI Issue 僅校準驗收，原歷史執行紀錄明確標為歷史，不冒充本次取得的最新執行結果。有效本機／隔離測試可支持真正覆蓋的產品路徑，不能代替 CI 自動觸發修復的證明。

## 協作與驗證

修改前讀取 Issues、完整 comments、相關可見分支／PR 及可用中央稽核狀態；已存在的 product-board lease 有 matching release。各更新先以 `worker=issue-quality` 加鎖並讀回驗證，再寫入；更新回傳確認 repo／Issue／body，完成後追加 release，未刪歷史 marker。未見的本機／外部 daemon 狀態不宣稱已驗證；沒有介入其他活躍 PR 的程式範圍。

## 限制與接續

- 沒有執行應用、provider、部署、UI 或新的完整 50 人回歸；沒有增加 CLEAN streak。
- `auto_implementation=false`、triage 與新排程提示詞屬產生端／追蹤規則，**不是本機或外部 worker 已部署的程式級攔截器**。本次沒有修改其執行程式或啟停它們。
- 後續既有排程須先讀現行 Issue 與 v2，再讀歷史 audit。更多舊工單只在具體證據與協作狀態允許時漸進校準，不大批關閉、不為減少數字掩蓋缺陷。
- 維持原公平輪巡游標；本次分流不是 portfolio 完整稽核，不能將未訪問 repo 記為已完成。
