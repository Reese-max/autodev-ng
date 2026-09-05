# Reese-max 全專案 50-Persona 循環稽核

日期：2026-09-06

## 目的

對 Reese-max 本人擁有的 GitHub repositories 進行一致、可重複的「50 個模擬 persona × 專案核心任務」測試。每輪先形成報告，再把可重現、可行動的問題寫入各 repo 的 GitHub Issue；修正後用相同 persona 與相同成功條件回歸測試。

> 這是 LLM/persona 模擬，不是真人受試研究。沒有執行環境或部署證據的項目不得標成「已通過 runtime 測試」。

## 停止條件

單一 repo 只有在以下條件都成立時才能標記 `CLEAN`：

1. 所有 P0/P1/P2 Issue 已關閉或有明確 `not_planned` 理由。
2. 對最新 default-branch SHA 重新跑完整 50 persona。
3. 靜態可驗證項目沒有新的可重現問題。
4. 需要 runtime 的專案，至少完成核心 happy path、錯誤路徑、手機/窄螢幕或 CLI 非互動路徑（依專案類型而定）。
5. 連續兩輪沒有新增 P0/P1/P2 問題；避免只因單次模擬漏測而過早停止。

## 嚴重度

- **P0**：資料遺失、越權、明顯安全/隱私事故、核心功能完全不可用。
- **P1**：主要使用者無法完成核心任務，或錯誤結果可能造成重大後果。
- **P2**：高頻摩擦、可理解性/可回復性/無障礙/效能問題，會顯著降低完成率。
- **P3**：改善體驗、文件、維護性、低頻 edge case。

## 固定 50 Persona

每輪固定使用以下 10 組、每組 5 人；同一 persona ID 不變，以便跨版本比較。

### A. 青少年／學生 16–22
1. A01 高中生，新手，手機優先，首次使用。
2. A02 大學生，熟悉 Google Docs，但不熟 CLI。
3. A03 資工學生，會 Git/CLI，追求可自訂。
4. A04 考生，時間壓力高，只想最快完成核心任務。
5. A05 視覺型學習者，依賴清楚導覽與狀態提示。

### B. 初入職場 23–30
6. B01 行政人員，Excel 熟練、程式陌生。
7. B02 初階工程師，重視安裝與錯誤訊息。
8. B03 設計師，重視介面一致性與可逆操作。
9. B04 研究助理，重視資料來源與匯出。
10. B05 輪班工作者，手機、碎片時間使用。

### C. 專業工作者 31–40
11. C01 警政/公務使用者，重視正確性與稽核軌跡。
12. C02 教師，重視多人使用與低學習成本。
13. C03 醫療/高風險領域使用者，重視免責、來源與錯誤防護。
14. C04 內容創作者，重視長流程不中斷與版本恢復。
15. C05 DevOps/SRE，重視可觀測性、fail-closed 與回滾。

### D. 管理／決策 41–50
16. D01 單位主管，只看摘要與異常。
17. D02 專案經理，重視進度、責任與可追蹤性。
18. D03 IT 管理員，重視權限、備份、部署。
19. D04 採購/成本敏感使用者，重視成本預估與上限。
20. D05 法遵/稽核角色，重視資料保存、個資與操作證據。

### E. 中高齡 51–65
21. E01 一般辦公室使用者，較少使用新式 Web UI。
22. E02 教職/公務人員，偏桌面、大字體需求。
23. E03 低數位熟悉度使用者，怕按錯、需要確認與復原。
24. E04 熟悉 Excel、不熟雲端部署。
25. E05 長時間使用者，重視閱讀性與疲勞。

### F. 65+
26. F01 高齡初次使用者，需要大字、明確按鈕。
27. F02 視力較弱，依賴高對比與縮放。
28. F03 手部操作精度較低，需要較大觸控目標。
29. F04 記憶負荷敏感，需要一步一事與持久狀態。
30. F05 由家人/同事協助設定、之後自行日常操作。

### G. 無障礙／限制情境
31. G01 鍵盤-only。
32. G02 螢幕閱讀器使用者。
33. G03 色覺辨識限制，不可只靠顏色傳遞狀態。
34. G04 200% 縮放/窄視窗。
35. G05 慢網路/高延遲環境。

### H. 技術／維運
36. H01 Windows 開發者。
37. H02 macOS 開發者。
38. H03 Linux/CI 非互動環境。
39. H04 自架/Cloudflare 部署者。
40. H05 第三方維護者，第一次接手 repo。

### I. 壓力／失敗模式
41. I01 重複點擊/重送。
42. I02 中途關閉頁面/程序後恢復。
43. I03 錯誤檔案/錯誤輸入。
44. I04 API timeout/429/5xx。
45. I05 部分成功、部分失敗後重試。

### J. 進階／邊界
46. J01 大量資料/大型專案。
47. J02 多使用者/並行操作。
48. J03 長時間連跑/資源耗盡。
49. J04 安全/隱私敏感使用者。
50. J05 專家使用者，嘗試最短路徑、自動化與客製。

## 每個 Repo 的測試維度

1. 首次理解：README / 首頁能否在 60 秒內說清楚「做什麼、怎麼開始、風險」。
2. 核心任務：主要 happy path 是否可完成。
3. 錯誤恢復：輸入錯誤、中斷、重試、undo/rollback。
4. 資料安全：秘密、個資、權限、資料保留、匯出/刪除。
5. 可觀測性：狀態、進度、錯誤原因、下一步。
6. 無障礙/裝置：鍵盤、螢幕閱讀器、縮放、手機、觸控。
7. 效能/成本：大型輸入、長任務、API 成本與上限。
8. 維護性：單一真相來源、測試、CI、文件與交接。
9. 失敗注入：timeout、429、部分完成、重複提交、並行。
10. 信任：危險操作確認、免責、來源、人工覆核邊界。

## 目前擁有的 39 個 Repo

| Repo | 類型/目前可判斷用途 | Round 0 狀態 |
|---|---|---|
| 92-duty-scheduler | 排班 Web App + Cloudflare/D1 | 已讀 README，進入深度 persona round |
| adng-memory | 自動化記憶/巡檢狀態庫 | 無 README；已確認資訊架構缺口 |
| ai-novel-workstation | 本機優先 AI 小說創作工作站 | 已讀 README，進入深度 persona round |
| autodev-ng | 24/7 多引擎自動開發協調器 | 已讀 README；本檔作為全專案稽核中樞 |
| avatar-vfo | 待讀取內容確認 | Discovery pending |
| book5-windows-server-2022 | 待讀取內容確認 | Discovery pending |
| cf-ai-router | 待讀取內容確認 | Discovery pending |
| cf-mcp-server | 待讀取內容確認 | Discovery pending |
| chatgpt-dual-pipeline | 待讀取內容確認 | Discovery pending |
| claude-mem | 待讀取內容確認 | Discovery pending |
| clinical-scribe-worker | 待讀取內容確認 | Discovery pending |
| cyber-prep-coach | 待讀取內容確認 | Discovery pending |
| exam-archive | 待讀取內容確認 | Discovery pending |
| flux-image-gen | 待讀取內容確認 | Discovery pending |
| gemini-deidentifier | 待讀取內容確認 | Discovery pending |
| gooaye | 空 repo（GitHub size=0） | P1/P2：無可測產品表面；需定義用途或封存 |
| herdr-skills | 待讀取內容確認 | Discovery pending |
| internship-notes-sites-mirror | 待讀取內容確認 | Discovery pending |
| lobsterpulse | 待讀取內容確認 | Discovery pending |
| lplrs-judicial-sync | 待讀取內容確認 | Discovery pending |
| MaterialYouNewTab | 待讀取內容確認 | Discovery pending |
| minideck | 待讀取內容確認 | Discovery pending |
| neciken-summer-poem | 待讀取內容確認 | Discovery pending |
| note-filler | 待讀取內容確認 | Discovery pending |
| obsidian-vault | 個人知識庫/內容庫（依 repo 名稱，待內容確認） | Discovery pending |
| openab | 待讀取內容確認 | Discovery pending |
| police-exam-archive | 待讀取內容確認 | Discovery pending |
| police-exam-practice | 待讀取內容確認 | Discovery pending |
| ppt-studio | 待讀取內容確認 | Discovery pending |
| project-doctor-web | 醫療教學/研究用問診與 SOAP Web App | 已讀 README，進入高風險領域深度 round |
| prompt-autoresearch | 待讀取內容確認 | Discovery pending |
| skill-foundry | 待讀取內容確認 | Discovery pending |
| soundbox-offline | 待讀取內容確認 | Discovery pending |
| taichung-police-intel | 待讀取內容確認 | Discovery pending |
| taiwan-intel-dashboard | 待讀取內容確認 | Discovery pending |
| tick-stock-panel | 待讀取內容確認 | Discovery pending |
| UkePack | 待讀取內容確認 | Discovery pending |
| video-timeline-pipeline | 待讀取內容確認 | Discovery pending |
| voice-actress | 待讀取內容確認 | Discovery pending |

## Round 0 已確認的跨專案問題

### R0-01：缺少可理解入口（P2）
`adng-memory` 根目錄沒有 README，只有 patrol alerts/log、heartbeat 與多個專案目錄。對 H05（新維護者）、D05（稽核）、I02（事故後恢復）而言，無法可靠判斷真相來源、保留策略、恢復流程與哪些檔案可刪除。

**Issue 建議**：補 `README.md`，至少包含用途、資料分類、寫入者、讀取者、保留/輪替策略、恢復步驟、敏感資料規則。

### R0-02：複雜系統的「新手最短成功路徑」需獨立驗證（P2）
`ai-novel-workstation` 與 `autodev-ng` 的 README 很完整，但能力與命令面很大。A01/A02/B01/E03/H05 persona 容易被大量選項壓垮；應把「第一次成功」與「進階控制」分離測試，並驗證 doctor/dry-run 是否真的能在零成本或低風險下先取得可理解結果。

### R0-03：高風險領域需要更強的信任邊界驗證（P1）
`project-doctor-web` 已有研究/教學免責與 API 限流，但它處理病患背景、PE/Lab/影像資料注入。下一輪必須特別驗證：資料是否持久化、日誌是否洩漏、prompt injection/錯誤資料是否會被當成醫囑、模型失敗是否 fail-safe、使用者能否清楚區分教育性輸出與專業診斷。

### R0-04：排班系統的正確性與可回復性優先於純 UI 美化（P1/P2）
`92-duty-scheduler` 已宣稱 200+ 測試、undo、跨週歷史與 7 道限制閘。下一輪 persona 測試優先攻擊：重複提交、跨勤務交換、鎖定格、性別限制、放假、多人/並行、D1/網路失敗、Excel 異常格式，以及匯出結果與畫面狀態不一致。

## Issue 寫入規則

- 每 repo 先建立一個 umbrella issue：`[50-persona audit] Continuous usability/reliability loop`。
- 每輪把報告摘要、受影響 persona、重現步驟、預期/實際、嚴重度、驗收條件寫入 umbrella issue。
- P0/P1 若需要獨立修復工作，再拆成單獨 issue；避免一次建立數十個低品質 issue。
- 修復後不得只看 diff；必須對最新 SHA 用同一 persona/情境回歸。

## 下一輪優先順序

1. 先完成 39 repo 的 README/root/測試/CI discovery。
2. 對高風險或高使用頻率 repo 深度跑 50 persona：92-duty-scheduler、project-doctor-web、autodev-ng、ai-novel-workstation、警政/情報/考試相關系統。
3. 把可重現 P0/P1/P2 寫入各 repo issue。
4. 修復後回歸；連續兩輪沒有新增 P0/P1/P2 才標記 CLEAN。
