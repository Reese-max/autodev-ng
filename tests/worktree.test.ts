import { expect, test } from 'vitest'
import { execFileSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { cleanupWorktree, mergeBack, prepareWorktree, WorktreeCleanupPartialError } from '../src/worktree.js'

function initGitRepo(dir: string): void {
  execFileSync('git', ['init', '-b', 'main'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.email', 'adng-test@example.com'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.name', 'adng-test'], { cwd: dir, stdio: 'ignore' })
  // Windows 全域 core.autocrlf=true 會讓 checkout 內容 LF→CRLF 而被 git 視為 modified，
  // 干擾 `git worktree remove`（非 --force）；臨時 repo 內 local 覆寫避免依賴全域設定。
  execFileSync('git', ['config', 'core.autocrlf', 'false'], { cwd: dir, stdio: 'ignore' })
  writeFileSync(join(dir, 'README.md'), '# adng test repo\n')
  execFileSync('git', ['add', '.'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', 'chore: init'], { cwd: dir, stdio: 'ignore' })
}

function commitFile(cwd: string, name: string, content: string, message: string): void {
  writeFileSync(join(cwd, name), content)
  execFileSync('git', ['add', '.'], { cwd, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', message], { cwd, stdio: 'ignore' })
}

function headOf(cwd: string): string {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).trim()
}

function newRepo(): { repo: string; worktreesDir: string } {
  const repo = mkdtempSync(join(tmpdir(), 'adng-wt-'))
  initGitRepo(repo)
  return { repo, worktreesDir: join(repo, 'worktrees') }
}

const TASK_ID = 'abc12345'

test('prepareWorktree：建出 worktree 目錄 + 分支 + marker', () => {
  const { repo, worktreesDir } = newRepo()

  const wt = prepareWorktree(repo, worktreesDir, TASK_ID)

  expect(wt.branch).toBe(`adng/${TASK_ID}`)
  expect(wt.cwd).toBe(join(worktreesDir, TASK_ID))
  expect(wt.baseBranch).toBe('main')
  expect(existsSync(wt.cwd)).toBe(true)
  expect(existsSync(join(wt.cwd, '.adng-worktree'))).toBe(true)
  const marker = JSON.parse(readFileSync(join(wt.cwd, '.adng-worktree'), 'utf8')) as { taskId: string }
  expect(marker.taskId).toBe(TASK_ID)

  const branches = execFileSync('git', ['branch', '--list', wt.branch], { cwd: repo, encoding: 'utf8' })
  expect(branches).toContain(wt.branch)
})

test('prepareWorktree：主 repo .git/info/exclude 補上 marker + .serena/ + .devin/config.local.json（devin-serena-fix 保底，跨 worktree 共用同一份）', () => {
  const { repo, worktreesDir } = newRepo()
  prepareWorktree(repo, worktreesDir, TASK_ID)
  const exclude = readFileSync(join(repo, '.git', 'info', 'exclude'), 'utf8').split(/\r?\n/)
  expect(exclude).toContain('.adng-worktree')
  expect(exclude).toContain('.serena/')
  expect(exclude).toContain('.devin/config.local.json')
})

test('prepareWorktree：殘留（前次崩潰留下未清的 worktree 目錄+分支）重建成功', () => {
  const { repo, worktreesDir } = newRepo()

  const first = prepareWorktree(repo, worktreesDir, TASK_ID)
  commitFile(first.cwd, 'stale.txt', 'stale work\n', 'feat: stale')
  // 模擬崩潰殘留：不呼叫 cleanupWorktree，直接再次呼叫 prepareWorktree（同 taskId）

  const second = prepareWorktree(repo, worktreesDir, TASK_ID)

  expect(second.cwd).toBe(first.cwd)
  expect(existsSync(join(second.cwd, '.adng-worktree'))).toBe(true)
  expect(existsSync(join(second.cwd, 'stale.txt'))).toBe(false) // 殘留內容已被清掉重建
  const list = execFileSync('git', ['worktree', 'list'], { cwd: repo, encoding: 'utf8' })
  expect(list.split('\n').filter(l => l.includes(TASK_ID))).toHaveLength(1) // 沒有重複登記
  // 真 git worktree I/O，24/7 機器負載下 5s 不夠（非產品 bug）→ 針對性 timeout 20s
}, 20000)

test('mergeBack：worktree 內 commit 後 ff-only 成功、主 repo HEAD 前進；cleanupWorktree 清掉現場', () => {
  const { repo, worktreesDir } = newRepo()
  const before = headOf(repo)

  const wt = prepareWorktree(repo, worktreesDir, TASK_ID)
  commitFile(wt.cwd, 'feature.txt', 'done\n', 'feat: 完成任務')

  const result = mergeBack(repo, wt.branch, wt.baseBranch, wt.baseHead)
  expect(result.merged).toBe(true)
  const after = headOf(repo)
  expect(after).not.toBe(before)
  expect(result.commitHash).toBe(after)
  expect(readFileSync(join(repo, 'feature.txt'), 'utf8')).toBe('done\n')

  cleanupWorktree(repo, wt.cwd, wt.branch)
  expect(existsSync(wt.cwd)).toBe(false)
  const branches = execFileSync('git', ['branch', '--list', wt.branch], { cwd: repo, encoding: 'utf8' })
  expect(branches.trim()).toBe('')
})

test('mergeBack：主 repo 被第三方推進且與 worktree 分支分岔 → merged:false、分支保留給人工', () => {
  const { repo, worktreesDir } = newRepo()

  const wt = prepareWorktree(repo, worktreesDir, TASK_ID)
  commitFile(wt.cwd, 'feature.txt', 'from worktree\n', 'feat: worktree 端完成')
  // 第三方直接在主 repo commit，造成分岔（worktree 分支與 main 互不為對方祖先）
  commitFile(repo, 'thirdparty.txt', 'third party\n', 'chore: 第三方推進')

  const result = mergeBack(repo, wt.branch, wt.baseBranch, wt.baseHead)
  expect(result.merged).toBe(false)
  expect(result.reason).toBe('merge-conflict')
  expect(result.commitHash).toBeUndefined()

  const branches = execFileSync('git', ['branch', '--list', wt.branch], { cwd: repo, encoding: 'utf8' })
  expect(branches).toContain(wt.branch) // 分支保留，不硬 merge、不刪
  expect(existsSync(wt.cwd)).toBe(true) // worktree 也保留供人工介入
})

test('prepareWorktree：非 git 目錄上拋明確錯誤（呼叫端據此歸 blocked，不炸 daemon）', () => {
  const plain = mkdtempSync(join(tmpdir(), 'adng-nogit-'))
  expect(() => prepareWorktree(plain, join(plain, 'worktrees'), TASK_ID)).toThrow(/git/)
})

// ---------------------------------------------------------------------------
// HIGH 修復：mergeBack 分支身分核對（不驗主 repo 分支身分 → 成果可能悄悄合錯地方/遺失）
// ---------------------------------------------------------------------------

test('prepareWorktree：主 repo 處於 detached HEAD → 上拋明確錯誤，拒絕開工', () => {
  const { repo, worktreesDir } = newRepo()
  execFileSync('git', ['checkout', '--detach', headOf(repo)], { cwd: repo, stdio: 'ignore' })

  expect(() => prepareWorktree(repo, worktreesDir, TASK_ID)).toThrow(/detached HEAD/)
})

test('mergeBack：主 repo 於 prepareWorktree 後被切到新分支 → merged:false(branch-switched)，原分支與新分支都沒收到成果，任務分支保留', () => {
  const { repo, worktreesDir } = newRepo()
  const wt = prepareWorktree(repo, worktreesDir, TASK_ID)
  commitFile(wt.cwd, 'feature.txt', 'from worktree\n', 'feat: worktree 端完成')

  // 使用者在任務執行期間切到自己的新分支（非 detached，只是換了分支）
  execFileSync('git', ['checkout', '-b', 'user-side-branch'], { cwd: repo, stdio: 'ignore' })

  const result = mergeBack(repo, wt.branch, wt.baseBranch, wt.baseHead)
  expect(result.merged).toBe(false)
  expect(result.reason).toBe('branch-switched')

  execFileSync('git', ['checkout', 'main'], { cwd: repo, stdio: 'ignore' })
  expect(existsSync(join(repo, 'feature.txt'))).toBe(false) // 原分支沒收到成果
  execFileSync('git', ['checkout', 'user-side-branch'], { cwd: repo, stdio: 'ignore' })
  expect(existsSync(join(repo, 'feature.txt'))).toBe(false) // 使用者當下分支也沒收到成果

  const branches = execFileSync('git', ['branch', '--list', wt.branch], { cwd: repo, encoding: 'utf8' })
  expect(branches).toContain(wt.branch) // adng 任務分支保留，不硬 merge
})

test('mergeBack：任務期間主分支被 reset --hard 回退 → merged:false(branch-switched)，被丟棄的 commit 不因 ff-only 復活', () => {
  const { repo, worktreesDir } = newRepo()
  // 使用者事後反悔的 commit：任務自這個 HEAD 分出，之後被 reset 丟棄
  commitFile(repo, 'doomed.txt', 'to be discarded\n', 'feat: 之後會被 reset 丟棄')
  const doomedHead = headOf(repo)

  const wt = prepareWorktree(repo, worktreesDir, TASK_ID)
  expect(wt.baseHead).toBe(doomedHead) // prepareWorktree 當下記錄的 baseHead
  commitFile(wt.cwd, 'feature.txt', 'from worktree\n', 'feat: worktree 端完成')

  // 任務期間使用者對主分支 reset --hard 回退（分支名不變——舊版分支身分核對看不出來）
  execFileSync('git', ['reset', '--hard', 'HEAD~1'], { cwd: repo, stdio: 'ignore' })
  const resetHead = headOf(repo)

  const result = mergeBack(repo, wt.branch, wt.baseBranch, wt.baseHead)
  expect(result.merged).toBe(false)
  expect(result.reason).toBe('branch-switched')

  // 縫的本體：ff-only 會「成功」並把被丟棄的 doomed commit 連同任務 commit 一起復活——
  // 核對 baseHead 後不執行 merge，主分支停在使用者 reset 後的位置。
  expect(headOf(repo)).toBe(resetHead)
  expect(existsSync(join(repo, 'doomed.txt'))).toBe(false) // 被丟棄的內容沒有復活
  expect(existsSync(join(repo, 'feature.txt'))).toBe(false) // 任務成果也沒有硬合進去

  const branches = execFileSync('git', ['branch', '--list', wt.branch], { cwd: repo, encoding: 'utf8' })
  expect(branches).toContain(wt.branch) // 任務分支保留給人工介入
})

test('mergeBack：主分支僅正常前進（baseHead 為現 HEAD 祖先）→ 不誤擋，仍由 ff-only 自行判定', () => {
  const { repo, worktreesDir } = newRepo()
  const wt = prepareWorktree(repo, worktreesDir, TASK_ID)
  // 任務分支無新 commit，主分支正常前進一格：baseHead 是現 HEAD 的祖先——
  // 等值核對必須放行（非回退），ff-only 判「已是祖先」no-op 成功，不得誤判 branch-switched。
  commitFile(repo, 'advance.txt', 'forward\n', 'chore: 主分支正常前進')

  const result = mergeBack(repo, wt.branch, wt.baseBranch, wt.baseHead)
  expect(result.merged).toBe(true)
  expect(result.commitHash).toBe(headOf(repo))
})

test('mergeBack：主 repo 於 prepareWorktree 後 detach HEAD → merged:false(branch-switched)，任務分支保留', () => {
  const { repo, worktreesDir } = newRepo()
  const wt = prepareWorktree(repo, worktreesDir, TASK_ID)
  commitFile(wt.cwd, 'feature.txt', 'from worktree\n', 'feat: worktree 端完成')

  execFileSync('git', ['checkout', '--detach', headOf(repo)], { cwd: repo, stdio: 'ignore' })

  const result = mergeBack(repo, wt.branch, wt.baseBranch, wt.baseHead)
  expect(result.merged).toBe(false)
  expect(result.reason).toBe('branch-switched')
  expect(existsSync(join(repo, 'feature.txt'))).toBe(false)

  const branches = execFileSync('git', ['branch', '--list', wt.branch], { cwd: repo, encoding: 'utf8' })
  expect(branches).toContain(wt.branch) // 沒有具名引用被刪掉，成果沒有靜默遺失
})

// ---------------------------------------------------------------------------
// MEDIUM 修復：cleanupWorktree 大目錄（node_modules 樣態）超時——改 rmSync + prune，
// git worktree remove 不再是刪目錄的執行者（execFileSync timeout 打不到 Node 原生 rmSync）。
// ---------------------------------------------------------------------------

test('cleanupWorktree：含 node_modules 樣態（嵌套多層＋唯讀檔）的 worktree 完整清除，prune 後 worktree list 乾淨、分支已刪', () => {
  const { repo, worktreesDir } = newRepo()
  const wt = prepareWorktree(repo, worktreesDir, TASK_ID)
  // 模擬 engine 在 worktree 內跑過 npm install：node_modules 被 .gitignore 忽略（不算 dirty）
  commitFile(wt.cwd, '.gitignore', 'node_modules/\n', 'chore: ignore node_modules')
  for (const pkg of ['pkg-a', 'pkg-b']) {
    const deep = join(wt.cwd, 'node_modules', pkg, 'dist', 'lib')
    mkdirSync(deep, { recursive: true })
    writeFileSync(join(deep, 'index.js'), 'module.exports = {}\n')
    writeFileSync(join(deep, 'index.d.ts'), 'export {}\n')
  }
  const readonly = join(wt.cwd, 'node_modules', 'pkg-a', 'LICENSE')
  writeFileSync(readonly, 'MIT\n')
  chmodSync(readonly, 0o444) // Windows 唯讀屬性：rmSync force:true 必須清得掉

  const merge = mergeBack(repo, wt.branch, wt.baseBranch, wt.baseHead)
  expect(merge.merged).toBe(true)

  cleanupWorktree(repo, wt.cwd, wt.branch)
  expect(existsSync(wt.cwd)).toBe(false) // 目錄（含嵌套唯讀檔）完整清除
  const list = execFileSync('git', ['worktree', 'list'], { cwd: repo, encoding: 'utf8' })
  expect(list).not.toContain(TASK_ID) // prune 後 git 登記乾淨，無殘留供下輪堆積
  const branches = execFileSync('git', ['branch', '--list', wt.branch], { cwd: repo, encoding: 'utf8' })
  expect(branches.trim()).toBe('')
})

test('cleanupWorktree：worktree 內有真正未提交變更 → 上拋保留現場（安全網語意不因改 rmSync 而丟失），且 marker 仍在原地供 defaultRollback 識別', () => {
  const { repo, worktreesDir } = newRepo()
  const wt = prepareWorktree(repo, worktreesDir, TASK_ID)
  writeFileSync(join(wt.cwd, 'debug-leftover.txt'), 'engine 留下的殘留\n') // 未追蹤、未被 ignore

  expect(() => cleanupWorktree(repo, wt.cwd, wt.branch)).toThrow(/未提交變更/)
  expect(existsSync(join(wt.cwd, 'debug-leftover.txt'))).toBe(true) // 現場保留供 debug
  // M5 Task 2 時序修正（M4 審查 LOW#2）：dirty 上拋時 marker 不得已被刪——
  // 保留的現場要帶著 marker，defaultRollback 才認得這是 adng 管理的 worktree。
  expect(existsSync(join(wt.cwd, '.adng-worktree'))).toBe(true)
  const branches = execFileSync('git', ['branch', '--list', wt.branch], { cwd: repo, encoding: 'utf8' })
  expect(branches).toContain(wt.branch) // 分支也保留
})

// ---------------------------------------------------------------------------
// M5 Task 2：M4 移交安全修——verify-then-delete、dirty 清單截前 10 行、
// prune/branch -d 失敗改拋 WorktreeCleanupPartialError（現場已不在）。
// ---------------------------------------------------------------------------

test('cleanupWorktree：marker 缺失 → 上拋拒刪，絕不 rmSync（目錄與分支原封不動）', () => {
  const { repo, worktreesDir } = newRepo()
  const wt = prepareWorktree(repo, worktreesDir, TASK_ID)
  const merge = mergeBack(repo, wt.branch, wt.baseBranch, wt.baseHead)
  expect(merge.merged).toBe(true)
  rmSync(join(wt.cwd, '.adng-worktree')) // 模擬 marker 被外力清掉／路徑算錯指到非 adng 目錄

  expect(() => cleanupWorktree(repo, wt.cwd, wt.branch)).toThrow(/marker/)
  expect(existsSync(wt.cwd)).toBe(true) // 目錄原封不動——verify 不過就沒有任何刪除動作
  const branches = execFileSync('git', ['branch', '--list', wt.branch], { cwd: repo, encoding: 'utf8' })
  expect(branches).toContain(wt.branch)
})

test('cleanupWorktree：marker taskId 與分支不符 → 上拋拒刪（防路徑算錯誤刪別的任務現場）', () => {
  const { repo, worktreesDir } = newRepo()
  const wt = prepareWorktree(repo, worktreesDir, TASK_ID)
  writeFileSync(join(wt.cwd, '.adng-worktree'), JSON.stringify({ taskId: 'other999', createdAt: new Date().toISOString() }))

  expect(() => cleanupWorktree(repo, wt.cwd, wt.branch)).toThrow(/不符/)
  expect(existsSync(wt.cwd)).toBe(true)
})

test('cleanupWorktree：dirty porcelain 清單截前 10 行（防 events 單筆膨脹），並註明總行數', () => {
  const { repo, worktreesDir } = newRepo()
  const wt = prepareWorktree(repo, worktreesDir, TASK_ID)
  for (let i = 1; i <= 15; i++) writeFileSync(join(wt.cwd, `leftover-${String(i).padStart(2, '0')}.txt`), 'x\n')

  let message = ''
  try {
    cleanupWorktree(repo, wt.cwd, wt.branch)
    expect.unreachable('dirty worktree 必須上拋')
  } catch (err) {
    message = (err as Error).message
  }
  const fileLines = message.split('\n').filter(l => l.startsWith('??'))
  expect(fileLines).toHaveLength(10) // 只列前 10 行
  expect(message).toContain('15') // 註明總行數，人工介入時知道還有多少沒列出
  expect(existsSync(wt.cwd)).toBe(true) // 現場照樣保留
})

test('cleanupWorktree：rmSync 已成功、branch -d 失敗（未合併分支）→ 拋 WorktreeCleanupPartialError（呼叫端據此記 worktree-cleanup-partial 而非 worktree-kept）', () => {
  const { repo, worktreesDir } = newRepo()
  const wt = prepareWorktree(repo, worktreesDir, TASK_ID)
  // 分支有 commit 但「不」合回 main：目錄乾淨（可刪），但 branch -d 會因未合併而失敗
  commitFile(wt.cwd, 'feature.txt', 'unmerged\n', 'feat: 未合回的成果')

  let caught: unknown
  try {
    cleanupWorktree(repo, wt.cwd, wt.branch)
  } catch (err) {
    caught = err
  }
  expect(caught).toBeInstanceOf(WorktreeCleanupPartialError)
  expect(existsSync(wt.cwd)).toBe(false) // 目錄確實已刪（現場已不在，不能再叫 worktree-kept）
  const branches = execFileSync('git', ['branch', '--list', wt.branch], { cwd: repo, encoding: 'utf8' })
  expect(branches).toContain(wt.branch) // git 記錄殘留（branch -d 失敗的本體）
})
