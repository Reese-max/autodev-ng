# CLI 自主開發

`llmTransport: "cli"` 讓規劃、研究、判官、審查、補強、學習及 Codex worker 使用既有 ChatGPT CLI 登入；不需要 HTTP 模型服務。其他專案預設保留原設定。Codex worker 沿用受限沙箱，唯讀模型沒有工具；失敗教訓需要不同模型依原始證據核可。

```sh
node dist/cli.js --help
node dist/cli.js task add --config configs/autodev-self.json --text "改善一項使用者任務；驗收：具體可執行的檢查"
node dist/cli.js task list --config configs/autodev-self.json
node dist/cli.js run-once --config configs/autodev-self.json
node dist/cli.js status --config configs/autodev-self.json
```

建立同文字任務會回傳既有 ID。`run-once` 在失敗或 blocked 時非零退出；`task list` 顯示任務狀態與證據位置。北極星和使用者原話位於設定中的 dataDir，研究與規劃優先引用這兩份資料。

```sh
node dist/cli.js github repair-doctor --config configs/integrations/github-repair.json
node dist/cli.js github repair-doctor --config configs/integrations/github-repair.json --live
node dist/cli.js github repair-resume --config configs/integrations/github-repair.json --issue 4 --reason "已完成沙箱設定並確認相同權限的探針通過"
node dist/cli.js github repair --config configs/integrations/github-repair.json
node dist/cli.js github repair-delivery --config configs/integrations/github-repair.json --issue 4
node dist/cli.js github repair-metrics --config configs/integrations/github-repair.json
```

doctor 預設只做版本及登入檢查；`--live` 才呼叫相同 worker 權限的 CLI。`repair-retry` 重排單案；暫停時改用 `repair-resume`，沙箱通過後將原暫停旗標改名保存。兩者都重新核對 Issue、設定、工作目錄與 PR，保留次數；超過上限、髒工作目錄或未核對的提交會保留並阻擋。已完成的提交只有在完整證據吻合時才能接回 ready。沒有自動重設計數、刪除成果、改寫 backlog 或強制推送。

`repair-delivery` 重新檢查指定 commit，輸出本機路徑、證據及可審查的 revert 命令，並不執行回退。`repair-metrics` 的完成率分母是有嘗試的 Issue，分子是目前仍通過證據檢查的成果；沒有樣本時為 null。恢復次數只計新版本留下的操作歷史；不是人工操作時間或真人接受率。

```sh
node dist/cli.js github proposal-status --config configs/integrations/github-reports.json
node dist/cli.js github proposal-review --config configs/integrations/github-reports.json
node dist/cli.js github proposal-feedback --config configs/integrations/github-reports.json --id <fingerprint> --outcome helpful --reason "實際使用後觀察到的具體結果"
```

自動採用只限 `proposalRepos` 中的專案，目前僅 autodev-ng。每輪最多驗證一案，使用管理者預先設定的 probe；模型不得提供待執行命令。缺少真實需求、明確檢查或獨立審查時延後。採用後寫入既有 backlog，崩潰重跑不重複新增；實際執行仍由既有單專案 CLI／daemon 及其安全閘負責。`helpful`／`not-helpful` 是操作者的明確回饋，不能由模擬 persona 代填。

Windows 排程分別使用 `scripts/install-github-issues-task.ps1 -Mode reports` 和 `-Mode repairs`，同樣指定報告設定。無排程器權限時使用 `scripts/watch-github-owner.ps1` 的相同模式。`report` 不等待修復；`repair-batch` 執行一個有界修復並檢查一個提案，既有 stop 與鎖繼續生效。
