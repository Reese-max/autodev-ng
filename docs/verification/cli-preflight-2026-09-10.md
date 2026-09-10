# CLI 錯誤、額度、串流與模型預檢

本機修正涵蓋九個 worker adapter，以及主控、審查、報告共用的 Codex JSON 呼叫。未變更已選模型、登入資料或共享設定。

| 項目 | 實作與界線 |
| --- | --- |
| 錯誤保存 | 共用擷取 JSON／JSON 陣列／NDJSON 錯誤，保留錯誤碼、訊息、重設欄位及 stdout／stderr 摘要；遮蔽憑證。沿用 2KB 診斷預算，不保存完整工作轉錄。 |
| Codex | 每次預檢先讀 account/rateLimits/read 與完整分頁 model/list，再查 PONG 快取。已知額度耗盡即攔截。 |
| Copilot | 原生 headless stdio 的 account.getQuota／models.list；額度耗盡或模型未列入即攔截，不自動改模型或啟用額外付費。明確 0x 模型可排除舊 premium-request 桶。 |
| Claude | 擷取 PONG 串流的 rate_limit_event，辨識 allowed／warning／rejected 與額外用量。這是探針當時的快照；API key／相容端點未回報時維持 unknown。 |
| Devin | 原生 models list --format json 核對 family、alias、variant；額度 unknown。 |
| Qwen／Grok／OpenCode／AGY | 不把用量或 PONG 換算成剩餘額度；額度 unknown。指定模型須通過該指令／端點／環境的 PONG。 |
| Herdr | 保留原有 launcher／server 就緒檢查；額度與模型均 unknown，未接管 session。 |
| 串流 | Claude／Qwen 預設 stream-json，Grok 預設 streaming-json。辨識包在 message.content 裡的工具結果與 Grok tool_call_update；進度檔只存中繼資料。保留既有 JSON 相容路徑。 |
| 成功條件 | PONG 必須搭配 exit 0、未逾時及對應終止證據。Grok 需 end_turn；中間訊息或部分輸出不算完成。worker 仍須通過原有 commit 與正式驗收。 |
| 快取 | key 綁定指令、模型／profile 引數、cwd、端點及認證環境雜湊，並讀取已知設定／憑證檔案的 metadata。原生 Codex／Copilot／Devin 清單查詢先於快取；PONG 沿用成功 6 小時／失敗 30 分鐘 TTL。 |

Codex app-server 不支援 exec 的 --ignore-user-config／profile 隔離方式。這種設定下，model/list 只作參考，模型狀態維持 unknown，仍須設定一致的 PONG。無法觀察的 OS keyring 或自訂設定來源變更，仍需使 PONG 快取失效。

原生查詢只使用 metadata 方法，沒有建立模型工作階段、送提示、變更登入或購買額度。沒有餘額資料就保留 unknown；unknown 可進入既有最小 PONG 探針，不代表免費、無上限或已通過任務驗收。

## 驗證

本機完成閘：`LOCAL_CLI_INTEGRATION_PASS`。18 個測試檔合計 216 項已有通過結果；這是完整組別與受影響檔案重跑的合併覆蓋，不是單次全綠執行。

| 驗證 | 結果 |
| --- | --- |
| 完整相關 Vitest 組別 | 215 通過、1 失敗，exit 1。失敗來自 registry 測試未隔離新增的原生預檢，實際 Copilot admission 阻擋了該測試預期的 mock PONG。 |
| 修正測試隔離後重跑 registry 與 admission | 2 個檔案、28 項全通過，exit 0；取代這兩個檔案的舊結果後，216 項全部有通過證據。產品程式未因這次重跑而變更。 |
| `npm run typecheck` | exit 0，Secret scan passed，TypeScript 無錯誤。 |
| `npm run build` | exit 0。 |
| `node --test tests/regressions/github-7.test.cjs` | 2 通過、0 失敗，exit 0。 |
| `git diff --check` | exit 0。 |
| 原生唯讀 metadata | `NATIVE_METADATA_READ_PASS`，exit 0；模型推理請求數 0。 |

測試命令（PowerShell）：

```powershell
$cliTests = 'agy','claude-cli','cli-admission','cli-llm','codex','copilot','devin','engine-registry-command','execution-observation','freebuff','github-reports','grok','herdr','kernel-relocation-report','kernel-slim','opencode','preflight','qwen' | ForEach-Object { "tests/$_.test.ts" }
node node_modules/vitest/vitest.mjs run @cliTests --maxWorkers=1 --reporter=dot --reporter=json --outputFile=data/maintenance/cli-integration-20260910/vitest-final.json
node node_modules/vitest/vitest.mjs run tests/engine-registry-command.test.ts tests/cli-admission.test.ts --maxWorkers=1 --reporter=dot --reporter=json --outputFile=data/maintenance/cli-integration-20260910/vitest-final-focused.json
npm run typecheck
npm run build
node --test tests/regressions/github-7.test.cjs
git diff --check
```

原生快照時間為 2026-09-10 03:48（台灣時間）。Codex 該回報窗口剩餘 78%，但隔離設定下的模型仍須 PONG；Copilot premium_interactions 為 0%，指定 gpt-5.4-mini 未在帳號清單，因此攔截；Devin swe-1.6 在清單內，額度 unknown。這些是當時的唯讀狀態，不是後續時間的餘額保證。

原始與合併收尾紀錄保存在 `data/maintenance/cli-integration-20260910/`：`vitest-final.json`、`vitest-final-focused.json`、`native-final.json`、`final-receipt.json`。本次沒有送出真實模型提示；串流與任務執行證據來自離線 fixture，實際模型任務端到端驗收仍未執行。未提交、推送或部署。

主要新增檢查為 tests/cli-admission.test.ts：

- 九個真 adapter 的 stdout-only 錯誤擷取與憑證遮蔽。
- 原生 metadata RPC 的分段 Unicode、逾時、不合法長度及子程序回收。
- 額度攔截先於 PONG 快取、模型分頁完整性、Devin alias／variant。
- Claude／Qwen／Grok 的真子程序串流：先收到工具進度，放行 fixture 後才產出最終回覆；進度檔不存工具內容。
- 共用 Codex JSON 路徑在 admission 阻擋時不呼叫模型，失敗時保存 turn.failed。

## 原生契約來源

- 本機 Codex 0.153.4 app-server generate-ts 產生的 rate limit／model schema。
- [GitHub Copilot SDK RPC schema](https://github.com/github/copilot-sdk/blob/cd8cf15dc3f9e762615790aaed0a771a0f392755/nodejs/src/generated/rpc.ts) 與同提交 client.ts。
- Anthropic 官方 npm 套件 @anthropic-ai/claude-agent-sdk 0.3.266 的 SDKRateLimitInfo。
- [Grok headless 文件](https://docs.x.ai/build/cli/headless-scripting) 與本機 Grok 1.0.24 內附完整 headless 契約。
- 本機 Devin 3000.4.16 models list --help 與同版本唯讀 JSON 清單。
