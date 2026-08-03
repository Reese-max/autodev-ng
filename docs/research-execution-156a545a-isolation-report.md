# 研究執行 156a545a 隔離基線報告

狀態：`INCOMPLETE_EVIDENCE`／`unproven`

## 結論摘要

任務要求「為每次研究執行建立隔離的 Git worktree／基線快照，確保候選生成、評測、證據與報告均落
在同一可識別基線」。本次執行**無法建立隔離工作區**，依任務規則輸出 `INCOMPLETE_EVIDENCE`／
`unproven`，**不將既有工作樹（非隔離）內容納入任何候選選優**，也不宣稱任何「最佳版本」。

## 阻塞判定依據

- Task id：`156a545a`；隔離 worktree 路徑：`data/prompt-autoresearch/worktrees/156a545a`。
- 目前工作目錄內僅有 `data/prompt-autoresearch/worktrees/156a545a/.adng-worktree`，**沒有
  `.git`**；`git rev-parse --show-toplevel` 解析到外層的 `autodev-ng`（非本任務的 repo）。
- `git worktree list` **不含 `156a545a`**；`git branch --list 'adng/156a545a'` **無此分支**——
  即隔離 worktree／基線快照並未建立。
- `data/prompt-autoresearch/events.jsonl` 明確記錄（ts `2026-08-03T13:38:38Z` 起，三筆）：
  - `worktree-prepare-failed`：`prepareWorktree: 殘留 worktree 目錄無法移除…156a545a——成果
    分支 adng/156a545a 已保留,待進程退出後下次重試/人工介入`。
  - `infra-retry-cleanup-failed`：`reason=worktree-locked`。

依此判定：**隔離基線未能建立**，本次研究執行無法在「候選、評測、證據、報告同基線」的前題下產出
可歸因結論。

## 未驗證／未納入項目

以下項目因隔離基線未建立而**明列為不可交付／不得納入選優**：

1. 候選生成 — 未在隔離快照上執行（既有工作樹內容不可歸因）。
2. 評測量測 — 無隔離基線可比對。
3. 證據蒐集 — 缺可驗證之 HEAD／commit／diff 對應（無新 commit）。
4. 結論報告 — 未宣稱任何最佳版本。

## 解除鎖定後的重跑程序

待 `worktree-locked` 解除（殘留 worktree 目錄的進程退出、方括後）後重新派工本任務，即可由
scheduler 依 `src/worktree.ts::prepareWorktree` 建立獨立 `adng/156a545a` 分支 worktree 並跑隔離。

```sh
# 1) 確認沒有佔用進程再清理殘留 worktree
git -C "<projectPath>" worktree list
git -C "<projectPath>" worktree prune
# 2) 手動清除殘留目錄（確認該目錄確實為 adng 管理、內含 .adng-worktree marker 才刪）
# 3) 重跑本任務以建立隔離 worktree → 再執行候選生成/評測/證據/報告
```

重新執行後，驗證準則：

```sh
git -C "<worktreeRoot>" rev-parse --show-toplevel   # 等於 worktree 根，非外層 repo
git -C "<worktreeRoot>" rev-parse HEAD              # 可解析且屬本任務分支
git log -1 --oneline                                  # 產生新 commit 方可宣告完成
```

## 為何不宣稱完成

基線未建立＝候選生成／評測／證據／報告皆無可識別基線支撐，任何「完成」或「最佳」宣告恐造成偽陽性
（「np」）。依硬規則「完成要證據、無 commit 不以完成自居」，本次僅交付本報告，不將非隔離工作樹
內容納入選項。