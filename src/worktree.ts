import { execFileSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export interface WorktreeHandle { cwd: string; branch: string; baseBranch: string }
export type MergeBackFailReason = 'branch-switched' | 'merge-conflict'
export interface MergeBackResult { merged: boolean; commitHash?: string; reason?: MergeBackFailReason }

/** worktree 根目錄的旗標檔：verifier 的 defaultRollback 守門用它辨識「這是 adng 管理的
 * worktree」才允許 `git reset --hard`，防止誤傷使用者一般專案目錄裡未提交的工作。 */
const WORKTREE_MARKER = '.adng-worktree'
const ADD_REMOVE_TIMEOUT_MS = 30_000
const QUICK_TIMEOUT_MS = 10_000

function branchNameFor(taskId: string): string {
  return `adng/${taskId}`
}

/** stdio 明確設 stdin:ignore + stdout/stderr:pipe（而非 execFileSync 預設把 stderr inherit
 * 給父行程）——git 對很多正常操作（如 worktree add 的 "Preparing worktree" 進度訊息、
 * merge --ff-only 分岔時的 hint/fatal）都會印 stderr，inherit 會讓這些噪音直接灌進呼叫端
 * 的 console／daemon log；改為 pipe 後仍完整保留在拋出的 Error 內（.stderr／訊息字串),
 * 只是不再無條件洗版。 */
function git(args: string[], cwd: string, timeoutMs: number): string {
  return execFileSync('git', args, { cwd, timeout: timeoutMs, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

/** 容錯版 git 呼叫：任何失敗（含逾時）一律吞掉——供殘留自癒使用，呼叫端本來就預期
 * 這裡可能沒有殘留可清（第一次呼叫、或上次已正常清乾淨）。 */
function gitTolerant(args: string[], cwd: string, timeoutMs: number): void {
  try {
    execFileSync('git', args, { cwd, timeout: timeoutMs, encoding: 'utf8', stdio: ['ignore', 'ignore', 'ignore'] })
  } catch {
    // 容忍：見上方註解
  }
}

/** 主 repo 目前所在分支名稱（`git symbolic-ref --short HEAD`）。detached HEAD 時這條指令
 * 本身就會失敗上拋——呼叫端依語境決定：prepareWorktree 直接拒絕開工；mergeBack 判定
 * branch-switched（HIGH 修復：ff-only 本身看不出「快轉到的是不是原本那條分支」）。 */
function currentBranch(projectPath: string): string {
  return git(['symbolic-ref', '--short', 'HEAD'], projectPath, QUICK_TIMEOUT_MS).trim()
}

/** 非 git 專案探測：`git rev-parse --git-dir` 失敗 → 上拋明確錯誤，呼叫端（scheduler）
 * 歸類 blocked+告警，不炸 daemon（鐵律 #4 fail-open）。 */
function assertGitRepo(projectPath: string): void {
  try {
    git(['rev-parse', '--git-dir'], projectPath, QUICK_TIMEOUT_MS)
  } catch (err) {
    throw new Error(`prepareWorktree: ${projectPath} 不是 git 專案（git rev-parse --git-dir 失敗）：${String(err)}`)
  }
}

/** 殘留自癒（前次崩潰留下的 worktree 目錄/分支未清）：worktree remove --force + prune +
 * branch -D + 目錄殘骸 rmSync，全部容忍失敗——目的只是讓後面的 `git worktree add` 乾淨
 * 重來；真正清不掉的殘留讓 add 自然報錯上拋（這裡不吞真正的問題，只吞「本來就沒有殘留」）。 */
function cleanStaleWorktree(projectPath: string, worktreePath: string, branch: string): void {
  gitTolerant(['worktree', 'remove', '--force', worktreePath], projectPath, ADD_REMOVE_TIMEOUT_MS)
  gitTolerant(['worktree', 'prune'], projectPath, QUICK_TIMEOUT_MS)
  gitTolerant(['branch', '-D', branch], projectPath, QUICK_TIMEOUT_MS)
  try {
    rmSync(worktreePath, { recursive: true, force: true })
  } catch {
    // 容忍：目錄殘骸清不掉就讓後面 git worktree add 自然報錯上拋（不是這裡吞真正的問題）
  }
}

/**
 * 防止 `.adng-worktree` 旗標檔被引擎的 `git add -A`/`git add .` 誤撈進 commit——一旦被
 * commit，會隨 ff-only mergeBack 一路合進使用者主分支，永久污染真專案歷史。寫進主 repo
 * 共用的 `.git/info/exclude`（worktree 之間共用同一份，非個別 worktree 私有——git 設計
 * 如此）：這是 git 原生、不進版控的忽略機制，不需要動使用者可能有的 .gitignore（那是
 * 版控檔案，鐵律 #5 不可動使用者共用檔案）。冪等（已存在該行就不重複附加）；任何失敗
 * （權限等）容忍吞掉——防呆機制本身故障不該擋下整個 worktree 準備（fail-open，鐵律 #4），
 * 但已知殘留風險記報告：寫入失敗時該任務的 marker 檔仍有被引擎 add -A 誤撈進 commit 的
 * 機率。
 */
function ensureMarkerIgnored(projectPath: string): void {
  try {
    const excludeFile = join(projectPath, '.git', 'info', 'exclude')
    const existing = existsSync(excludeFile) ? readFileSync(excludeFile, 'utf8') : ''
    if (existing.split(/\r?\n/).includes(WORKTREE_MARKER)) return
    mkdirSync(dirname(excludeFile), { recursive: true })
    const sep = existing === '' || existing.endsWith('\n') ? '' : '\n'
    appendFileSync(excludeFile, `${sep}${WORKTREE_MARKER}\n`)
  } catch {
    // 容忍：見上方註解
  }
}

/**
 * 任務級隔離執行環境：每個任務在獨立 worktree + 獨立分支（`adng/<taskId>`）跑，
 * 髒狀態不互相污染、rollback（見 verifier.ts）不會誤傷主工作目錄。
 * 前次崩潰留下的殘留（目錄/分支）先自癒清掉再重建；清乾淨後 `git worktree add` 仍失敗
 * 才真正上拋——呼叫端（scheduler）依錯誤內容歸 blocked+告警，不炸 daemon（鐵律 #4）。
 */
export function prepareWorktree(projectPath: string, worktreesDir: string, taskId: string): WorktreeHandle {
  assertGitRepo(projectPath)

  // HIGH 修復：engine+verify 耗時可達數十分鐘，期間主 repo 若被切走分支，mergeBack 需要
  // 「當時身分」核對；detached HEAD 無具名分支可記，當下拒絕開工上拋（scheduler 歸 blocked）。
  let baseBranch: string
  try {
    baseBranch = currentBranch(projectPath)
  } catch (err) {
    throw new Error(`prepareWorktree: 主 repo 處於 detached HEAD，拒絕開工：${String(err)}`)
  }

  const branch = branchNameFor(taskId)
  const worktreePath = join(worktreesDir, taskId)

  mkdirSync(worktreesDir, { recursive: true })
  cleanStaleWorktree(projectPath, worktreePath, branch)

  git(['worktree', 'add', '-b', branch, worktreePath, 'HEAD'], projectPath, ADD_REMOVE_TIMEOUT_MS)

  ensureMarkerIgnored(projectPath)
  writeFileSync(join(worktreePath, WORKTREE_MARKER), JSON.stringify({ taskId, createdAt: new Date().toISOString() }))

  return { cwd: worktreePath, branch, baseBranch }
}

/**
 * 在主 repo 把任務分支 ff-only 合回。HIGH 修復：merge 前核對主 repo「現在」是否仍在
 * prepareWorktree 當時記下的 expectedBaseBranch——ff-only 看不出快轉到的是不是原本那條
 * 分支，使用者中途切分支/detach HEAD 仍會「成功」但合錯地方（detached 時甚至隨後被
 * cleanupWorktree 的 branch -d 一併清掉、靜默遺失）。身分不符一律回
 * `{merged:false, reason:'branch-switched'}`，不執行 merge、不拋——呼叫端決定 blocked。
 */
export function mergeBack(projectPath: string, branch: string, expectedBaseBranch: string): MergeBackResult {
  let nowBranch: string
  try {
    nowBranch = currentBranch(projectPath)
  } catch {
    return { merged: false, reason: 'branch-switched' } // detached HEAD
  }
  if (nowBranch !== expectedBaseBranch) return { merged: false, reason: 'branch-switched' }

  try {
    git(['merge', '--ff-only', branch], projectPath, QUICK_TIMEOUT_MS)
  } catch {
    return { merged: false, reason: 'merge-conflict' }
  }
  const commitHash = git(['rev-parse', 'HEAD'], projectPath, QUICK_TIMEOUT_MS).trim()
  return { merged: true, commitHash }
}

/**
 * 合回成功後呼叫：清掉 worktree 目錄 + 分支。刻意用「安全版」`git worktree remove`（非
 * --force）：若 worktree 內還有真正的未提交變更（例如引擎留下的除錯殘留、非預期產物），
 * remove 會如實失敗，呼叫端 catch 後記 `worktree-kept` 事件並保留現場供 debug——不強行
 * 二次清除掩蓋問題。但我們自己寫的 `.adng-worktree` 旗標檔本來就不受 git 追蹤，它的存在
 * 純粹是 kernel 自己的 bookkeeping，不該以「untracked file」的身分擋下這個安全網，所以
 * 先把它刪掉（容忍失敗——清不掉就讓後面的 remove 自然報錯，不吞真正的問題）。
 */
export function cleanupWorktree(projectPath: string, worktreePath: string, branch: string): void {
  try {
    rmSync(join(worktreePath, WORKTREE_MARKER), { force: true })
  } catch {
    // 容忍：見上方註解
  }
  git(['worktree', 'remove', worktreePath], projectPath, ADD_REMOVE_TIMEOUT_MS)
  git(['branch', '-d', branch], projectPath, QUICK_TIMEOUT_MS)
}
