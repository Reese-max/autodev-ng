# 全功能 Devin CLI 路由

設定 `tierMode: "free-only"`、`llmTransport: "devin-cli"`。使用既有 Devin CLI 登入，不需要 OpenRouter、OpenAI 或 Devin Cloud API key。

非互動執行要求 Devin CLI **3000.10.21 以上**；舊版在推論前停止。此版本新增 `disabled_tools` 並修正 `web_search` 權限判定，執行器會停用提問、網頁與交接工具，修復所需資料由宿主先提供。[官方版本紀錄](https://docs.devin.ai/cli/changelog/stable)

2026-09-10 原生 CLI 3000.4.16 清單與實際匯出紀錄確認：

| 功能 | 模型 UID | 顯示名稱 |
| --- | --- | --- |
| 規劃、worker、語意核對、目標評估、教訓草稿、研究草稿、Guardian | `swe-1-7` | SWE-1.7 Max |
| 獨立 code review、補足稽核、問題評審、教訓審查、研究審查 | `glm-5-2` | GLM-5.2 High |

六份專案設定、Devin 專用模式與 GitHub repair/research 設定已使用以上路由。原有 GOAL、驗收指令、任務紀錄與暫停旗標繼續生效；切換模型不代表恢復暫停中的案件或取得發布授權。Bot 的模型問答也共用此 transport。

`configs/modes/autodev-self.devin-only.json` 沿用既有模式範本契約：先複製至 `configs/autodev-self.json` 再使用，其相對路徑以 `configs/` 為基準。

每次推論前，宿主執行 `devin models list --format json`，只接受精確 UID 當時標為 `Free` 的變體。無標示、非 Free、別名或模型不可用均停止；不切其他供應商。每次匯出中所有 agent generation model 都必須吻合，發現不符會隔離路由。SWE-1.7 Lightning Max 與 GLM-5.2 Max 並非此次選用的免費變體。

純文字角色從原生 export 取得回答，沿用各角色的文字協定；研究、修復審查與 Guardian 另驗證 JSON schema。純文字角色禁用工具；worker 保留本機讀寫、執行及提交能力。共用執行器停用 MCP 匯入、subagents、cloud handoff，移除其他供應商的環境金鑰。Windows 上這些是 CLI 權限與宿主驗證，並非作業系統沙箱。

`dataDir/devin-calls/<id>/telemetry.json` 記錄當次清單、指定與實際模型、tokens 及處理結果。Worker 收據位於 `dataDir/devin-profile/devin-calls/`。`costUsd: null` 表示 CLI 未提供美元帳單，不能當作帳單零元或無限額度證明。不會變更自動加值設定。官方計費仍以 [Devin 訂閱說明](https://docs.devin.ai/admin/billing/self-serve) 為準。

有總時限的 worker 在 `--print` 模式下只回報靜默事件，保留總時限與取消控制，避免因沒有持續 stdout 而提早終止。`timeout:idle`、`timeout:wall`、`tool-rejected:<tool>`、`missing-final-answer` 分別保留實際失敗原因；不將這些執行失敗宣稱為免費配額耗盡。缺少有效最終回答或新提交仍不能通過驗收。

若審查不可用，保留候選提交與 pending-review，恢復時只做審查，不重派 worker。每日免費模型清單在此模式使用 Devin CLI；舊 OpenRouter 快照不會阻止同日切換供應來源。

可重現的合成流程（只修改新的測試 repo）：

```powershell
npm run build
node scripts/free-only-canary.mjs --run --transport devin-cli --command devin.exe --model swe-1-7 --reviewer glm-5-2
```

驗收要求：規劃有具體任務、原測試由紅轉綠、worker 產生提交、獨立審查通過、宿主證據鏈接受且沒有修改測試或推送。單次 PONG、exit 0 或僅有 HTTP 200 都不算完成。
