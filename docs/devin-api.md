# Devin API

Devin API 憑證連線與本機 `devin` CLI 引擎分開設定。此入口只執行官方
`GET https://api.devin.ai/v3/self`，核對身份與組織；不建立雲端 session。
`tierMode: free-only` 的派工與 reviewer 路由維持原有免費限制。

```powershell
npm run build
node dist/cli.js devin-api status
# 或指定獨立的 API 設定檔
node dist/cli.js devin-api status --config C:/private/devin-api.json
```

預設設定檔為 `~/.adng/devin-api.json`，格式如下；`orgId` 可省略。
`apiKey` 只接受 `{env:VAR}` 或 `{file:PATH}`，相對檔案路徑以設定檔所在目錄為準。

```json
{
  "apiKey": "{env:DEVIN_API_KEY}",
  "orgId": "your-org-id"
}
```

將 API key 存在 Git 之外並限制檔案讀取權限。CLI 只輸出連線結果、principal type
與組織 ID；不輸出憑證、使用者名稱或 API 錯誤本文。HTTP 錯誤、組織不符或格式
錯誤均以非零結束碼退出；請求逾時為 15 秒，不重試、不跟隨重新導向。

API 連線成功只證明身份查詢可用，未驗證雲端派工權限、帳戶額度或執行成本。
目前沒有雲端 worker 接頭；若日後加入，須另行處理費率、雲端成果取回與驗收。

官方依據：[Authentication](https://docs.devin.ai/api-reference/authentication)、
[Get Self](https://docs.devin.ai/api-reference/v3/self/self)。

## 本機驗證（2026-09-10）

- `npm run build`、`npm run typecheck`、`git diff --check`：exit 0。
- `node dist/cli.js devin-api status`：exit 0，HTTP 200、`service_user`，組織與設定一致。
- `npx vitest run tests/devin-api.test.ts tests/config-secrets.test.ts`：9/9 通過，exit 0。
- `npx vitest run tests/cli.test.ts tests/free-only-policy.test.ts`：57/58 通過，exit 1。
  未通過的是現役設定盤點：`configs/note-filler.json` 在 `free-only` 下仍指定
  `opencode/deepseek-v4-flash-free`，被要求明確 OpenRouter 免費路由的既有 guard 拒絕。
  該設定與 registry／OpenCode guard 均與 `HEAD` 相同，本次未修改。
- 憑證位於 Git 之外；檔案 ACL 關閉繼承，只允許目前使用者與 SYSTEM。
  未建立雲端 session、啟動 daemon 或推送 Git。
