import { createHash, randomUUID } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { z } from 'zod'
import { command } from './client.js'
import type { GithubConfig } from './config.js'
import { runDir, type IssueState } from './state.js'
import { runProcess } from '../engines/proc.js'
import { runVerify } from '../verify.js'

export const regressionFile = (number: number, cfg?: GithubConfig, state?: IssueState) => cfg?.regression
  ? cfg.regression.file.replaceAll('{issue}', String(number)).replaceAll('{revision}', String(state?.revision?.round ?? 0))
  : `tests/regressions/github-${number}${state?.revision ? `-r${state.revision.round}` : ''}.test.cjs`
const git = (cwd: string, ...args: string[]) => command('git', ['-c', `safe.directory=${cwd.replace(/\\/g, '/')}`, ...args], cwd)
const hash = (text: string) => createHash('sha256').update(text).digest('hex')
const receiptFile = (cfg: GithubConfig, state: IssueState, commit: string) => join(runDir(cfg, state), `regression-${commit}.json`)
// node:test TAP reporter 的終態摘要——判決只認這個結構。stdout 其餘內容（測試檔可自行輸出，
// runner 會以 `# ` 前綴轉義）一律是不可信日誌，不得參與判決。
const TapSummary = z.object({
  tests: z.number().int().nonnegative(),
  pass: z.number().int().nonnegative(),
  fail: z.number().int().nonnegative(),
  cancelled: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  todo: z.number().int().nonnegative(),
  // 頂層 `ok` 測試點數——排除 SKIP/TODO 標記與「檔案本身算一點」的載入點（名稱 = file 引數）。
  // 沒有任何 test() 的檔案仍會被 node:test 記為一個通過點，光靠 pass 計數分不出來。
  realPasses: z.number().int().nonnegative(),
  // 真 `not ok` 診斷區塊內含 ERR_ASSERTION 的失敗數（紅端證據：assertion 而非環境故障）。
  assertionFailures: z.number().int().nonnegative()
})
type Tap = z.infer<typeof TapSummary>
const Outcome = z.object({
  exitCode: z.number().int().nullable(),
  timedOut: z.boolean(),
  stdout: z.string(),
  stderr: z.string(),
  tap: TapSummary.optional()
})
const Receipt = z.object({
  base: z.string(),
  commit: z.string(),
  testHash: z.string(),
  contract: z.string().optional(),
  runner: z.enum(['node:test-tap', 'custom']),
  runId: z.string(),
  issuedAt: z.string(),
  red: Outcome,
  green: Outcome
})

// 解析 node:test TAP 終態：串流必須恰含一個頂層 `1..N` 計畫行（單檔執行恆為一個；巢狀計畫
// 會縮排、app 輸出會被 runner 以 `# ` 轉義成 `# 1..1`，都碰不到 `^1\.\.` 錨點）。計畫後
// 緊接連續的 `# <counter> N` 摘要，且摘要之後不得再有非空內容——append 一段偽造 TAP 會
// 同時產生第二個計畫與尾端垃圾，兩道規則一起擋下。
// 殘餘假設：孫進程在 runner 存活期間經 `/proc/<pid>/fd` 等平台通道**中途**注入裸行仍可
// 偽造 `ok`/`not ok` 形狀（本層擋普通日誌與 append；完全封死需改用 node:test `run()`
// 事件流，fd 寫入碰不到 in-process 事件）。
function parseTapTerminal(stdout: string, file: string): Tap | undefined {
  const lines = stdout.split(/\r?\n/)
  let plan = -1, plans = 0
  for (let i = 0; i < lines.length; i++) if (/^1\.\.\d+$/.test(lines[i]!)) { plan = i; plans++ }
  if (plans !== 1) return undefined
  const counters: Record<string, number> = {}
  let end = plan + 1
  for (let i = plan + 1; i < lines.length; i++) {
    const m = /^# (tests|suites|pass|fail|cancelled|skipped|todo|duration_ms) ([\d.]+)$/.exec(lines[i]!)
    if (!m) break
    counters[m[1]!] = Number(m[2]); end = i + 1
  }
  if (lines.slice(end).some(line => line.trim() !== '')) return undefined
  let realPasses = 0
  const base = file.replace(/\\/g, '/').split('/').pop()!
  for (const line of lines.slice(0, plan)) {
    const ok = /^ok \d+ - (.+)$/.exec(line)
    // 名稱等於測試檔本身（TAP 名稱會轉義 `\`、Windows 用反斜線路徑）＝檔案載入點，不算真測試。
    if (ok && !/ # (SKIP|TODO)\b/i.test(ok[1]!)
      && ok[1]!.trim().replace(/\\\\/g, '/').replace(/\\/g, '/').split('/').pop() !== base) realPasses++
  }
  const summary = TapSummary.safeParse({ ...counters, realPasses, assertionFailures: assertionFailures(lines.slice(0, plan)) })
  return summary.success ? summary.data : undefined
}

// 只算真 `not ok` 後所屬 YAML 診斷區塊（`<pad>---` … `<pad>...`）內同時出現
// `failureType: 'testCodeFailure'`、`code: 'ERR_ASSERTION'`、`name: 'AssertionError'` 者；
// 縮排隨巢狀層級加深。診斷區塊內部（含 `|-` scalar 裡的偽 `not ok` 形狀）不當測試點。
// 殘餘假設：刻意 `e.code='ERR_ASSERTION'; e.name='AssertionError'` 的非 assert.throw 仍過——
// 已超出「印出文字偽造」範圍，屬刻意構造，記錄為接受上限。
function assertionFailures(lines: string[]) {
  const interior = new Array<boolean>(lines.length).fill(false)
  for (let i = 0; i < lines.length; i++) {
    const open = /^(\s*)---$/.exec(lines[i]!)
    if (!open) continue
    for (let j = i; j < lines.length; j++) { interior[j] = true; if (j > i && lines[j] === `${open[1]}...`) break }
  }
  let count = 0
  for (let i = 0; i < lines.length; i++) {
    if (interior[i]) continue
    const m = /^(\s*)not ok \d+/.exec(lines[i]!)
    if (!m) continue
    const pad = m[1]
    let j = i + 1, codeFailure = false, assertion = false, named = false
    while (j < lines.length && lines[j] !== `${pad}  ---` && (lines[j]!.startsWith(pad + '  ') || lines[j]!.trimStart().startsWith('#'))) j++
    if (lines[j] === `${pad}  ---`) for (j++; j < lines.length && lines[j] !== `${pad}  ...`; j++) {
      if (lines[j] === `${pad}  failureType: 'testCodeFailure'`) codeFailure = true
      if (lines[j] === `${pad}  code: 'ERR_ASSERTION'`) assertion = true
      if (lines[j] === `${pad}  name: 'AssertionError'`) named = true
    }
    if (codeFailure && assertion && named) count++
  }
  return count
}

function greenOk(r: z.infer<typeof Outcome>, cfg: GithubConfig, file: string) {
  if (cfg.regression) return !r.timedOut && r.exitCode === 0 && new RegExp(cfg.regression.passPattern).test(r.stdout + r.stderr)
  const tap = r.tap ?? parseTapTerminal(r.stdout, file)
  return !r.timedOut && r.exitCode === 0 && !!tap && tap.tests >= 1 && tap.realPasses >= 1
    && tap.fail === 0 && tap.cancelled === 0 && tap.skipped === 0 && tap.todo === 0
}
function redOk(r: z.infer<typeof Outcome>, cfg: GithubConfig, file: string) {
  if (cfg.regression) return !r.timedOut && r.exitCode === 1 && new RegExp(cfg.regression.failPattern).test(r.stdout + r.stderr)
  const tap = r.tap ?? parseTapTerminal(r.stdout, file)
  return !r.timedOut && r.exitCode === 1 && !!tap && tap.fail >= 1 && tap.assertionFailures >= 1
}
// 回執的 tap 必須能從留存的 stdout 原樣重算——防止事後竄改輸出或摘要。
const consistent = (r: z.infer<typeof Outcome>, file: string) =>
  !!r.tap && JSON.stringify(parseTapTerminal(r.stdout, file)) === JSON.stringify(r.tap)
function testSource(cwd: string, base: string, commit: string, file: string) {
  const entry = git(cwd, 'ls-tree', commit, '--', file)
  if (!/^100644 blob /.test(entry) || git(cwd, 'ls-tree', base, '--', file)) throw new Error(`Add a new regular regression test: ${file}`)
  // ponytail: additive tests only; existing test changes require human review rather than automatic publication.
  const changed = git(cwd, 'diff', '--name-only', '--diff-filter=DMRT', base, commit).split(/\r?\n/)
  if (changed.some(p => /(^|\/)(tests?|__tests__)(\/|\.)|\.(test|spec)\./i.test(p))) throw new Error('Existing tests must not be modified, removed or renamed by automatic repairs')
  return git(cwd, 'show', `${commit}:${file}`)
}

export async function verifyRegression(cfg: GithubConfig, state: IssueState, cwd: string, commit: string, timeoutMs: number): Promise<void> {
  if (!state.baseSha || git(cwd, 'rev-parse', 'HEAD') !== commit) throw new Error('Regression candidate/base missing or changed')
  const file = regressionFile(state.issue.number, cfg, state), source = testSource(cwd, state.baseSha, commit, file)
  const run = async (root: string) => {
    const r = await runProcess({ command: cfg.regression?.command ?? process.execPath,
      args: cfg.regression ? cfg.regression.args.map(arg => arg.replaceAll('{file}', file)) : ['--test', '--test-reporter=tap', file], cwd: root, stdinText: '', timeoutMs, maxOutputChars: 30_000 })
    // 判決證據在執行當下從 stdout 算出並綁進回執；自訂 contract 路徑維持既有樣式契約。
    return { exitCode: r.exitCode, timedOut: r.timedOut, stdout: r.stdout, stderr: r.stderr,
      ...(cfg.regression ? {} : { tap: parseTapTerminal(r.stdout, file) }) }
  }
  const green = await run(cwd)
  if (!greenOk(green, cfg, file)) throw new Error(`Regression must pass with active assertions: ${green.stdout.slice(-1500)} ${green.stderr.slice(-500)}`)
  const replay = join(runDir(cfg, state), `regression-base-${randomUUID()}`)
  git(cwd, 'clone', '--shared', '--no-checkout', '--', cwd, replay)
  git(replay, 'checkout', '--detach', state.baseSha)
  const prep = cfg.regressionPrepareCommand ?? cfg.repair?.prepareCommand
  if (prep) {
    const setup = await runVerify({ command: prep, cwd: replay, timeoutMs })
    if (setup.status !== 'pass') throw new Error(`Regression baseline setup failed: ${setup.detail}`)
  }
  for (const dir of ['tests', 'tests/regressions']) {
    const path = join(replay, dir)
    if (existsSync(path) && (!lstatSync(path).isDirectory() || lstatSync(path).isSymbolicLink())) throw new Error('Regression path is not a regular directory')
  }
  mkdirSync(dirname(join(replay, file)), { recursive: true }); writeFileSync(join(replay, file), source)
  const red = await run(replay)
  if (!redOk(red, cfg, file)) throw new Error(`Regression must fail an assertion on the original code: ${red.stdout.slice(-1500)} ${red.stderr.slice(-500)}`)
  // 控制組：candidate commit 放進同形狀的 `regression-base-*` clone 再跑一次。
  // 紅與控制組的可觀測差異只剩 git HEAD——測試若靠目錄形狀或環境分流（例如
  // `__dirname.includes('regression-base')` 就硬 fail），控制組會露餡 → 拒絕。
  const control = join(runDir(cfg, state), `regression-base-${randomUUID()}`)
  git(cwd, 'clone', '--shared', '--no-checkout', '--', cwd, control)
  git(control, 'checkout', '--detach', commit)
  if (prep) {
    const setup = await runVerify({ command: prep, cwd: control, timeoutMs })
    if (setup.status !== 'pass') throw new Error(`Regression control setup failed: ${setup.detail}`)
  }
  for (const dir of ['tests', 'tests/regressions']) {
    const path = join(control, dir)
    if (existsSync(path) && (!lstatSync(path).isDirectory() || lstatSync(path).isSymbolicLink())) throw new Error('Regression path is not a regular directory')
  }
  mkdirSync(dirname(join(control, file)), { recursive: true }); writeFileSync(join(control, file), source)
  const ctrl = await run(control)
  if (!greenOk(ctrl, cfg, file)) throw new Error(`Regression control run must pass on the candidate: ${ctrl.stdout.slice(-1500)}`)
  // 測試檔本身在控制組是被覆寫成 source 的已知差異（command() 會 trim 掉 blob 尾端），
  // 其完整性由 control-source 單獨核對；status 檢查其餘檔案即可。
  const dirty = (dir: string, exclude?: string) =>
    // command() 會 trim 整段輸出，單行 ` M <path>` 的前導空格會被吃掉——用結尾比對檔名。
    git(dir, 'status', '--porcelain', '--untracked-files=no').split(/\r?\n/)
      .some(l => l.trim() !== '' && !(exclude && l.endsWith(` ${exclude}`)))
  const integrity: [string, boolean][] = [
    ['cwd-head', git(cwd, 'rev-parse', 'HEAD') !== commit],
    ['replay-head', git(replay, 'rev-parse', 'HEAD') !== state.baseSha],
    ['control-head', git(control, 'rev-parse', 'HEAD') !== commit],
    ['cwd-dirty', dirty(cwd)],
    ['replay-dirty', dirty(replay)],
    ['control-dirty', dirty(control, file)],
    ['source-hash', git(cwd, 'hash-object', `--path=${file}`, file) !== git(cwd, 'rev-parse', `${commit}:${file}`)],
    ['replay-source', readFileSync(join(replay, file), 'utf8') !== source],
    ['control-source', readFileSync(join(control, file), 'utf8') !== source],
  ]
  const bad = integrity.filter(([, failed]) => failed).map(([name]) => name)
  if (bad.length) throw new Error(`Regression execution changed the tested source or commit (${bad.join(',')})`)
  writeFileSync(receiptFile(cfg, state, commit), JSON.stringify({ base: state.baseSha, commit, testHash: hash(source),
    runner: cfg.regression ? 'custom' : 'node:test-tap', runId: randomUUID(), issuedAt: new Date().toISOString(),
    ...(cfg.regression ? { contract: JSON.stringify(cfg.regression) } : {}), red, green }, null, 2))
}

export function assertRegression(cfg: GithubConfig, state: IssueState, cwd: string): void {
  if (!state.baseSha || !state.commit) throw new Error('Regression commit missing')
  const file = regressionFile(state.issue.number, cfg, state)
  const source = testSource(cwd, state.baseSha, state.commit, file)
  // 舊格式回執（缺 runner/runId/tap）在此 parse 失敗 → 必須重新跑 verifyRegression 取新證據。
  const receipt = Receipt.parse(JSON.parse(readFileSync(receiptFile(cfg, state, state.commit), 'utf8')))
  if (receipt.base !== state.baseSha || receipt.commit !== state.commit || receipt.testHash !== hash(source)
    || receipt.runner !== (cfg.regression ? 'custom' : 'node:test-tap')
    || receipt.contract !== (cfg.regression ? JSON.stringify(cfg.regression) : undefined)
    || (receipt.runner === 'node:test-tap' && (!consistent(receipt.green, file) || !consistent(receipt.red, file)))
    || !greenOk(receipt.green, cfg, file) || !redOk(receipt.red, cfg, file)) throw new Error('Missing exact regression red/green evidence')
}
