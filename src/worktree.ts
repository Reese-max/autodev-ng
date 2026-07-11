import { execFileSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export interface WorktreeHandle { cwd: string; branch: string; baseBranch: string; baseHead: string }
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

/** 殘留自癒：worktree remove --force + prune + rmSync 容忍失敗；branch -D 移到「確認目錄已消失」之後才執行——
 * 2a929ec9 產線事故：目錄被鎖(Windows,前次中斷進程未退)時舊順序先砍分支致成果懸空；仍在就上拋保留分支,待重試/人工介入。 */
function cleanStaleWorktree(projectPath: string, worktreePath: string, branch: string): void {
  gitTolerant(['worktree', 'remove', '--force', worktreePath], projectPath, ADD_REMOVE_TIMEOUT_MS)
  gitTolerant(['worktree', 'prune'], projectPath, QUICK_TIMEOUT_MS)
  try {
    rmSync(worktreePath, { recursive: true, force: true })
  } catch {
    // 容忍：清不掉交給下面 existsSync 判定是否真的殘留(被鎖)
  }
  // Task 2：掛 code='worktree-locked' 供 scheduler 分流（唯一判準，不用字串比對）。
  if (existsSync(worktreePath)) throw Object.assign(new Error(`prepareWorktree: 殘留 worktree 目錄無法移除(可能有前次中斷的進程仍佔用):${worktreePath}——成果分支 ${branch} 已保留,待進程退出後下次重試/人工介入`), { code: 'worktree-locked' })
  gitTolerant(['branch', '-D', branch], projectPath, QUICK_TIMEOUT_MS)
}

/** devin-serena-fix 保底：devin adapter 已用 `ensureNoMcpImport` 從源頭關掉 MCP 匯入，
 * 但萬一仍有殘留（未知匯入路徑／使用者另外手動 `devin mcp add`），這兩行確保 `.serena/`
 * （serena language server 索引側目錄）與 `.devin/config.local.json`（adapter 自己寫的隔離
 * 設定檔）不會被引擎的 `git add -A` 誤撈進 commit——同 WORKTREE_MARKER 的道理（M4 Task 6）。 */
const ADDITIONAL_IGNORED = ['.serena/', '.devin/config.local.json']

/**
 * 防止 `.adng-worktree` 旗標檔／上列殘留側檔被引擎的 `git add -A`/`git add .` 誤撈進
 * commit——一旦被 commit，會隨 ff-only mergeBack 一路合進使用者主分支，永久污染真專案
 * 歷史。寫進主 repo 共用的 `.git/info/exclude`（worktree 之間共用同一份，非個別 worktree
 * 私有——git 設計如此）：這是 git 原生、不進版控的忽略機制，不需要動使用者可能有的
 * .gitignore（那是版控檔案，鐵律 #5 不可動使用者共用檔案）。冪等（已存在的行不重複附加）；
 * 任何失敗（權限等）容忍吞掉——防呆機制本身故障不該擋下整個 worktree 準備（fail-open，
 * 鐵律 #4），但已知殘留風險記報告：寫入失敗時這些檔案仍有被引擎 add -A 誤撈進 commit 的機率。
 */
function ensureMarkerIgnored(projectPath: string): void {
  try {
    const excludeFile = join(projectPath, '.git', 'info', 'exclude')
    const existing = existsSync(excludeFile) ? readFileSync(excludeFile, 'utf8') : ''
    const have = existing.split(/\r?\n/)
    const missing = [WORKTREE_MARKER, ...ADDITIONAL_IGNORED].filter(l => !have.includes(l))
    if (missing.length === 0) return
    mkdirSync(dirname(excludeFile), { recursive: true })
    const sep = existing === '' || existing.endsWith('\n') ? '' : '\n'
    appendFileSync(excludeFile, `${sep}${missing.join('\n')}\n`)
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

  // M4 Task 6 ledger 縫（reset-backward）：記下開工當時的 HEAD，供 mergeBack 核對回退。
  const baseHead = git(['rev-parse', 'HEAD'], projectPath, QUICK_TIMEOUT_MS).trim()

  return { cwd: worktreePath, branch, baseBranch, baseHead }
}

/**
 * 在主 repo 把任務分支 ff-only 合回。HIGH 修復：merge 前核對主 repo「現在」是否仍在
 * prepareWorktree 當時記下的 expectedBaseBranch——ff-only 看不出快轉到的是不是原本那條
 * 分支，使用者中途切分支/detach HEAD 仍會「成功」但合錯地方（detached 時甚至隨後被
 * cleanupWorktree 的 branch -d 一併清掉、靜默遺失）。身分不符一律回
 * `{merged:false, reason:'branch-switched'}`，不執行 merge、不拋——呼叫端決定 blocked。
 */
export function mergeBack(projectPath: string, branch: string, expectedBaseBranch: string, expectedBaseHead: string): MergeBackResult {
  let nowBranch: string
  try {
    nowBranch = currentBranch(projectPath)
  } catch {
    return { merged: false, reason: 'branch-switched' } // detached HEAD
  }
  if (nowBranch !== expectedBaseBranch) return { merged: false, reason: 'branch-switched' }

  // reset-backward 縫（Task 6 ledger）：任務期間使用者對主分支 reset --hard 回退——分支名
  // 沒變、身分核對看不出來，而任務分支自 baseHead 分出（含被丟棄段），ff-only 會「成功」
  // 把使用者剛丟棄的 commit 整段復活。核對現 HEAD 與開工當時 baseHead：正常前進
  // （baseHead 仍是現 HEAD 祖先）放行，留給 ff-only 自行判定（no-op 快轉或 merge-conflict，
  // 既有語意不變）；非祖先（回退/歷史改寫）一律拒合，沿用 branch-switched 歸 blocked。
  const nowHead = git(['rev-parse', 'HEAD'], projectPath, QUICK_TIMEOUT_MS).trim()
  if (nowHead !== expectedBaseHead) {
    try {
      git(['merge-base', '--is-ancestor', expectedBaseHead, nowHead], projectPath, QUICK_TIMEOUT_MS)
    } catch {
      return { merged: false, reason: 'branch-switched' }
    }
  }

  try {
    git(['merge', '--ff-only', branch], projectPath, QUICK_TIMEOUT_MS)
  } catch {
    return { merged: false, reason: 'merge-conflict' }
  }
  const commitHash = git(['rev-parse', 'HEAD'], projectPath, QUICK_TIMEOUT_MS).trim()
  return { merged: true, commitHash }
}

/** M5 Task 2：rmSync 成功「之後」的 git 記錄清理（prune／branch -d）失敗專用錯誤型別。
 * 呼叫端（scheduler）據此分流事件：現場還在（rmSync 前失敗）→ worktree-kept；現場已不在、
 * 僅 git 記錄殘留 → worktree-cleanup-partial（誤記 kept 會誤導人工介入去找一個不存在的目錄）。 */
export class WorktreeCleanupPartialError extends Error {}

/** dirty porcelain 清單只帶前 10 行進錯誤訊息（M5 Task 2）：錯誤全文會落 events.jsonl 單筆，
 * engine 留下上千個未追蹤檔時不可讓單筆事件膨脹。 */
const DIRTY_LIST_MAX_LINES = 10

/**
 * 合回成功後呼叫：清掉 worktree 目錄 + 分支。保留原「安全版 `git worktree remove`（非 --force）」
 * 的安全網語意：若 worktree 內還有真正的未提交變更/未追蹤檔（例如引擎留下的除錯殘留、非預期產物；判準＝status --porcelain 非空），
 * 如實上拋，呼叫端 catch 後記 `worktree-kept` 事件並保留現場供 debug——不強行二次清除掩蓋問題（等價原「安全版 remove」拒刪語意）。
 * 但刪目錄改用 Node 原生 rmSync：實戰中 engine 在 worktree 內跑過 npm install 後，git remove
 * 要刪含 node_modules 的數百 MB 目錄會超過 execFileSync timeout（ETIMEDOUT → 殘留永久堆積，
 * done 任務無下輪自癒）；rmSync 無 timeout 問題（force:true 亦涵蓋 Windows 唯讀檔），刪完再
 * prune 掉 git 的 worktree 登記。
 * M5 Task 2（verify-then-delete，對齊 verifier 紅線 3 的 marker 守門精神）：任何刪除動作前
 * 先驗 `.adng-worktree` marker 存在且 taskId 與分支相符——讀不到或不符即上拋拒刪，絕不對
 * 來路不明的目錄 rmSync（防路徑算錯誤刪使用者目錄／別的任務現場）。時序修正（M4 審查
 * LOW#2）：dirty 檢查移到 marker 驗證之後、刪 marker 之前——dirty 上拋保留的現場必須帶著
 * marker，defaultRollback 才認得這是 adng 管理的 worktree。marker 本就是 kernel bookkeeping
 * （已寫進 .git/info/exclude），不以 untracked 身分擋安全網——exclude 寫入失敗（fail-open
 * 殘留）時由 porcelain 過濾兜底。
 */
export function cleanupWorktree(projectPath: string, worktreePath: string, branch: string): void {
  const markerPath = join(worktreePath, WORKTREE_MARKER)
  let markerTaskId: string | undefined
  try {
    markerTaskId = (JSON.parse(readFileSync(markerPath, 'utf8')) as { taskId?: string }).taskId
  } catch (err) {
    throw new Error(`cleanupWorktree: ${worktreePath} 讀不到 ${WORKTREE_MARKER} marker（非 adng 管理的 worktree？），拒絕刪除：${String(err)}`)
  }
  const expectedTaskId = branch.startsWith('adng/') ? branch.slice('adng/'.length) : branch
  if (markerTaskId !== expectedTaskId) {
    throw new Error(`cleanupWorktree: marker taskId(${String(markerTaskId)}) 與分支 ${branch} 不符，拒絕刪除 ${worktreePath}`)
  }

  const dirtyLines = git(['status', '--porcelain'], worktreePath, ADD_REMOVE_TIMEOUT_MS)
    .split('\n').map(l => l.trimEnd()).filter(l => l !== '' && l.slice(3) !== WORKTREE_MARKER)
  if (dirtyLines.length > 0) {
    const shown = dirtyLines.slice(0, DIRTY_LIST_MAX_LINES).join('\n')
    const more = dirtyLines.length > DIRTY_LIST_MAX_LINES ? `\n…（共 ${dirtyLines.length} 行，僅列前 ${DIRTY_LIST_MAX_LINES} 行）` : ''
    throw new Error(`cleanupWorktree: worktree 尚有未提交變更，保留現場 ${worktreePath}：\n${shown}${more}`)
  }

  try {
    rmSync(markerPath, { force: true })
  } catch {
    // 容忍：marker 清不掉就隨下面整個目錄的 rmSync 一起被帶走
  }
  rmSync(worktreePath, { recursive: true, force: true, maxRetries: 5 })
  try {
    git(['worktree', 'prune'], projectPath, QUICK_TIMEOUT_MS)
    git(['branch', '-d', branch], projectPath, QUICK_TIMEOUT_MS)
  } catch (err) {
    throw new WorktreeCleanupPartialError(`cleanupWorktree: 目錄已刪，僅 git 記錄清理失敗（prune/branch -d）：${String(err)}`)
  }
}
