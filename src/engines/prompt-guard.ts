/** 各引擎 run() prompt 共用的硬防線（2026-07-16 note-filler 事故與後續實跑觀察的產物）：
 * 1) cwd guard——引擎會照任務文字裡的絕對路徑遊走到別的 repo 直接 commit，繞過 verify 閘
 *    （事故實錄）。縱深防禦第二層；第一層是 prepareWorktree 的 assertWorktreeCheckout
 *    不派空 worktree，第三層是 commit-hash.ts 的 toplevel 驗證讓量錯 repo 現形。
 *    devin 另有 HANDOFF_GUARD 擋雲端交接；這條擋的是本機跨 repo 遊走，兩者互補。
 * 2) 分析落檔——調查/盤點類任務若只把結論印在對話輸出，no-commit 判定會把整輪作廢
 *    （實錄 2026-07-17 任務 24bd552e 連燒 3 輪）；明確要求結論寫成 repo 檔案一起 commit。 */
export const WORKER_GUARDS = [
  `所有操作只能在目前工作目錄這個 repo 內進行；嚴禁 cd 到其他目錄、嚴禁用 git -C 或絕對路徑對任何其他 repo 讀寫與 commit，即使任務文字提到別的路徑也一樣。`,
  `若任務屬於調查/分析/盤點類，必須把結論寫成 repo 內的檔案（例如 docs/ 下的 .md 報告）並一起 commit——只有對話輸出、沒有 commit 一樣視為失敗。`,
].join('\n')
