import { createHash, randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { isAbsolute, join, relative } from 'node:path'
import type { Engine, Job, RunResult } from '../types.js'
import { WORKER_GUARDS } from '../engines/prompt-guard.js'
import { inspectGitWorkspace } from '../autopilot/git-workspace.js'
import { parseTaskEnvelope, serializeTaskEnvelope, workerTaskId, TaskEnvelopeSchema, type TaskEnvelope } from './envelope.js'
import { TaskLedger, type ConductorTaskStatus } from './ledger.js'
import { readCheckpoint, writeCheckpoint, type CheckpointState } from './state.js'
import { dirtyDeltaPaths, pathMatches, snapshotDirty, verifyAttempt, type DirtySnapshot, type VerifyAttemptOpts } from './verify.js'

export type { ConductorTaskStatus } from './ledger.js'

/** Issue #52 Conductor：單 Conductor → 單 Worker 協議主迴路。
 * 角色切分：Conductor 立案（decomposeSpec）→ 派工（Engine 介面，agy/herdr 皆可）
 * → 驗證閘（verifyAttempt，只看 repo 證據）→ PASS 記帳/checkpoint，FAIL 回饋重試，
 * 達 max_retries 預設 2 次即 escalate，絕不無限重試。 */

export interface ConductorDeps {
  projectPath: string
  /** Conductor 狀態目錄；預設 <projectPath>/.autodev。 */
  stateDir?: string
  /** worker tag → Engine。接進 registry（agy/herdr/codex…）或測試注入。 */
  resolveWorker: (tag: string) => Engine
  /** Trusted host adapter: stop this exact execution and join every writer descendant.
   * A worker report or AbortSignal is not a termination receipt. */
  cancelWorker?: (engine: Engine, job: Job) => Promise<{ executionId: string; terminated: boolean }>
  /** Bounded host cancellation wait (1..10,000ms, default 1,000ms). */
  terminationTimeoutMs?: number
  getCommitHash?: (cwd: string) => string | undefined
  /** ref → 完整 commit sha（短 sha/分支皆可）；預設 git rev-parse --verify。 */
  resolveCommit?: (cwd: string, ref: string) => string | undefined
  /** 髒檔快照（path→內容雜湊）；預設 snapshotDirty。extraDirs 遞補被 gitignore 排除的目錄（.autodev）。 */
  snapshotDirty?: (cwd: string, extraDirs?: string[]) => DirtySnapshot
  runTest?: VerifyAttemptOpts['runTest']
  isAlive?: () => boolean
  events?: { append(type: string, data?: Record<string, unknown>): void }
  now?: () => string
}

export interface ConductorResult {
  status: ConductorTaskStatus
  taskId: string
  /** 本 epoch 實際派工次數。 */
  attempts: number
  commit?: string
  reason?: string
  runDir: string
  stateDir: string
  ledgerFile: string
}

function getCommitHash(cwd: string): string | undefined {
  try {
    return execFileSync('git', ['rev-parse', '--verify', 'HEAD'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || undefined
  } catch { return undefined }
}

function resolveCommit(cwd: string, ref: string): string | undefined {
  try {
    return execFileSync('git', ['rev-parse', '--verify', `${ref}^{commit}`], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || undefined
  } catch { return undefined }
}

function msg(e: unknown): string { return e instanceof Error ? e.message : String(e) }

function classifyFailure(reason: string): string {
  const r = reason.toLowerCase()
  if (/timeout|逾時|timed? ?out/.test(r)) return 'timeout'
  if (/429|quota|rate.?limit|額度/.test(r)) return 'quota'
  if (/cancel|abort/.test(r)) return 'cancelled'
  if (/preflight/.test(r)) return 'preflight'
  if (/crash|exploded|exit code|exited/.test(r)) return 'worker-crash'
  return 'worker-fail'
}

function fpOf(failureClass: string, reason: string): string {
  return createHash('sha1').update(`${failureClass}:${reason}`).digest('hex').slice(0, 12)
}

/** 把 conductor 狀態目錄寫進 <git-common-dir>/info/exclude——
 * 防 worker `git add -A` 把 .autodev 掃進 commit（git 層級擋住，不靠口頭）。
 * 注意：exclude 後 porcelain 看不到 .autodev 髒檔——視窗竄改偵測靠 snapshotDirty 的目錄遞補走。 */
function ensureStateExcluded(projectPath: string, stateRel: string | undefined): void {
  if (!stateRel) return
  let common: string
  try {
    common = execFileSync('git', ['rev-parse', '--git-common-dir'], { cwd: projectPath, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch { return }
  if (!common) return
  const infoDir = join(isAbsolute(common) ? common : join(projectPath, common), 'info')
  try {
    mkdirSync(infoDir, { recursive: true })
    const file = join(infoDir, 'exclude')
    const line = `/${stateRel.replace(/\\/g, '/').replace(/\/+$/, '')}/`
    const cur = existsSync(file) ? readFileSync(file, 'utf8') : ''
    if (!cur.split('\n').some(l => l.trim() === line)) {
      appendFileSync(file, (cur && !cur.endsWith('\n') ? '\n' : '') + line + '\n', 'utf8')
    }
  } catch { /* exclude 失敗不擋流程——committed diff 檢查仍能抓被 add -f 的狀態檔 */ }
}

/** Worker directive：完整契約文本。WORKER_GUARDS 全程帶上（cwd 防線 + 分析落檔）。 */
export function buildWorkerDirective(envelope: TaskEnvelope, attempt: number, feedback?: string): string {
  const lines: string[] = [
    `任務 ID：${envelope.task_id}（attempt ${attempt}，phase：${envelope.phase}）`,
    '',
    WORKER_GUARDS,
    '',
    `## 目標`, envelope.goal,
    `## 範圍`, envelope.scope,
    `## 可修改檔案（僅限以下路徑；其餘一率視為越界）`,
    ...(envelope.files_allowed_to_change.length ? envelope.files_allowed_to_change.map(f => `- ${f}`) : ['（無——唯讀任務）']),
  ]
  if (envelope.do_not_touch.length) lines.push('## 禁止觸碰', ...envelope.do_not_touch.map(f => `- ${f}`))
  if (envelope.files_to_read.length) lines.push('## 建議閱讀', ...envelope.files_to_read.map(f => `- ${f}`))
  lines.push('## 驗收條件', ...envelope.acceptance_criteria.map(a => `- ${a}`))
  if (envelope.tests.length) lines.push('## Conductor 驗證將執行的指令（務必可自行通過）', ...envelope.tests.map(t => `- ${t}`))
  if (envelope.stop_conditions.length) lines.push('## 停止條件（命中即回報，勿硬做）', ...envelope.stop_conditions.map(s => `- ${s}`))
  if (feedback) lines.push('## 前一輪失敗回饋', feedback, '請根據回饋修正後再交付。')
  if (envelope.final_report_required) lines.push('## 完工報告', '完成後回報：實際修改的檔案清單、跑過的驗證、已知疑點。')
  return lines.join('\n')
}

function buildCheckpoint(
  stateDir: string, envelope: TaskEnvelope, ledger: TaskLedger,
  current: CheckpointState['current_task'], verification: string, nextAction: string,
  prev?: CheckpointState, extraIssues: string[] = [],
): CheckpointState {
  const finished = ledger.readAll()
    .filter((r): r is Extract<typeof r, { type: 'task-finished' }> => r.type === 'task-finished')
  const completed = [...new Map(
    finished.filter(r => r.status === 'done').map(r => [r.task_id, { task_id: r.task_id, commit: r.commit ?? '' }]),
  ).values()]
  const blocked = [...new Map(
    finished.filter(r => r.status === 'blocked' || r.status === 'escalated' || r.status === 'unverified')
      .map(r => [r.task_id, { task_id: r.task_id, reason: `${r.status}${r.reason ? `：${r.reason}` : ''}` }]),
  ).values()]
  const knownIssues = [...new Set([...(prev?.known_issues ?? []), ...extraIssues])]
  return {
    schema_version: 1,
    updated_at: new Date().toISOString(),
    current_phase: envelope.phase,
    completed_tasks: completed,
    current_task: current,
    last_known_good_commit: completed.at(-1)?.commit || envelope.parent_commit || null,
    verification: { tests: verification, build: 'n/a', ci: 'n/a', runtime: verification },
    known_issues: knownIssues,
    blocked_items: blocked,
    next_action: nextAction,
  }
}

export async function runConductorTask(input: unknown, deps: ConductorDeps): Promise<ConductorResult> {
  const now = deps.now ?? (() => new Date().toISOString())
  const isAlive = deps.isAlive ?? (() => true)
  const getHead = deps.getCommitHash ?? getCommitHash
  const resolve = deps.resolveCommit ?? resolveCommit
  const snapshot = deps.snapshotDirty ?? snapshotDirty
  const stateDir = deps.stateDir ?? join(deps.projectPath, '.autodev')
  const stateRelRaw = relative(deps.projectPath, stateDir).replace(/\\/g, '/')
  const stateRel = stateRelRaw && !stateRelRaw.startsWith('..') ? stateRelRaw : undefined
  const snapNow = (): DirtySnapshot => snapshot(deps.projectPath, stateRel ? [stateRel] : [])
  const ledger = new TaskLedger(stateDir)
  const state = { attempts: 0 }
  const projectionFile = join(stateDir, 'worker-quarantine.json')
  const terminationTimeout = deps.terminationTimeoutMs ?? 1_000
  if (!Number.isInteger(terminationTimeout) || terminationTimeout < 1 || terminationTimeout > 10_000) {
    throw new Error('terminationTimeoutMs must be an integer between 1 and 10000')
  }

  let envelope: TaskEnvelope = typeof input === 'string' ? parseTaskEnvelope(input) : TaskEnvelopeSchema.parse(input)
  const taskId = envelope.task_id
  const taskRunDir = join(stateDir, 'runs', taskId)
  mkdirSync(taskRunDir, { recursive: true })

  const result = (status: ConductorTaskStatus, opts: { commit?: string; reason?: string } = {}): ConductorResult =>
    ({ status, taskId, attempts: state.attempts, runDir: taskRunDir, stateDir, ledgerFile: ledger.file, ...opts })

  const finish = (status: Exclude<ConductorTaskStatus, 'stopped'>, reason: string, commit?: string): ConductorResult => {
    ledger.append({ type: 'task-finished', task_id: taskId, status, commit, reason, attempts: state.attempts, ts: now() })
    writeCheckpoint(stateDir, buildCheckpoint(stateDir, envelope, ledger, null, 'n/a', `task ${taskId} ${status}`, readCheckpoint(stateDir)))
    deps.events?.append('conductor-task-finished', { task_id: taskId, status, reason, attempts: state.attempts })
    return result(status, { commit, reason })
  }

  const ws = inspectGitWorkspace(deps.projectPath)
  if (!ws.ok) return finish('blocked', `workspace 不可用：${ws.reason}（${ws.detail}）`)
  // Git host metadata survives git clean and changing the caller's stateDir.
  // The stateDir file is an operator projection, never the sole authority.
  const fenceFile = join(ws.gitDir, 'adng-conductor-worker-quarantine.json')
  if (existsSync(fenceFile) || existsSync(projectionFile)) return result('blocked', { reason: 'worker-termination-unconfirmed：worker quarantine exists; reconcile the exact execution before dispatch' })
  const unresolved = new Map<string, { taskId: string; attempt: number }>()
  for (const record of ledger.readAll()) {
    if (record.type === 'attempt') unresolved.set(JSON.stringify([record.task_id, record.attempt]), { taskId: record.task_id, attempt: record.attempt })
    else if (record.type === 'attempt-result') {
      if (record.termination_confirmed === true || (!record.recovery_required && record.failure_class !== 'task-timeout' && record.failure_class !== 'interrupted' && record.failure_class !== 'worker-crash')) unresolved.delete(JSON.stringify([record.task_id, record.attempt]))
    }
  }
  if (unresolved.size) {
    const old = unresolved.values().next().value!
    try { writeFileSync(fenceFile, JSON.stringify({ schemaVersion: 1, taskId: old.taskId, attempt: old.attempt, executionId: null, hostPid: null, timestamp: now(), status: 'legacy-unresolved' }) + '\n', { encoding: 'utf8', flag: 'wx' }) }
    catch { /* fail closed even if the recovery marker cannot be written */ }
    return result('blocked', { reason: 'worker-termination-unconfirmed：legacy attempt has no terminal receipt; reconcile before dispatch' })
  }

  // 冪等：已 done 不重派
  const lastFinish = ledger.lastFinish(taskId)
  if (lastFinish?.status === 'done') {
    return result('done', { commit: lastFinish.commit, reason: `task ${taskId} 已完成（ledger idempotent）` })
  }

  // ---- epoch / resume ----
  state.attempts = ledger.attemptsSinceFinish(taskId)
  if (state.attempts > 0) {
    // 續 epoch：契約以磁碟上的 task.yaml 定本為準（不接 call site 可能失憶/竄改的 envelope）
    const stored = join(taskRunDir, 'task.yaml')
    if (!existsSync(stored)) {
      return finish('blocked', `task.yaml 遺失：epoch 已有 ${state.attempts} 次 attempt 但契約檔不在——不信 call site 重建`)
    }
    try {
      const persisted = parseTaskEnvelope(readFileSync(stored, 'utf8'))
      if (persisted.task_id !== taskId) {
        return finish('blocked', `envelope-mismatch：輸入 task_id=${taskId} 與存檔 ${persisted.task_id} 不符`)
      }
      envelope = persisted
    } catch (e) {
      return finish('blocked', `task.yaml 損毀無法回讀：${msg(e)}`)
    }
  }
  // stateDir 永遠是隱含禁區（ledger/checkpoint 不可被 worker 寫）——即使 envelope 白名單誤放行也擋住
  if (stateRel && !envelope.do_not_touch.some(p => pathMatches(stateRel, p))) {
    envelope = { ...envelope, do_not_touch: [...envelope.do_not_touch, stateRel] }
  }
  writeFileSync(join(taskRunDir, 'task.yaml'), serializeTaskEnvelope(envelope), 'utf8')

  ensureStateExcluded(deps.projectPath, stateRel)
  let headNow = getHead(deps.projectPath)
  if (!headNow) return finish('blocked', 'not a git repository or HEAD unreadable')

  let expectedHead: string | undefined
  if (state.attempts === 0) {
    if (envelope.parent_commit) {
      const resolved = resolve(deps.projectPath, envelope.parent_commit)
      if (!resolved || resolved !== headNow) {
        return finish('blocked', `stale parent_commit：envelope 記錄 ${envelope.parent_commit} 但 HEAD=${headNow}——規格基準已過期，退回 Conductor 重立案`)
      }
      envelope.parent_commit = resolved
      writeFileSync(join(taskRunDir, 'task.yaml'), serializeTaskEnvelope(envelope), 'utf8')
    } else {
      envelope.parent_commit = headNow
      writeFileSync(join(taskRunDir, 'task.yaml'), serializeTaskEnvelope(envelope), 'utf8')
    }
    ledger.append({ type: 'envelope', task_id: taskId, worker: envelope.worker, parent_commit: envelope.parent_commit ?? null, ts: now() })
    expectedHead = headNow
  } else {
    const open = ledger.openAttempt(taskId)
    if (open) {
      // Legacy interrupted attempts have no execution fence/termination evidence.
      try {
        writeFileSync(fenceFile, JSON.stringify({ schemaVersion: 1, taskId, attempt: open.attempt, executionId: null, hostPid: null, timestamp: now(), status: 'legacy-interrupted' }) + '\n', { encoding: 'utf8', flag: 'wx' })
      } catch { /* an existing or unwritable quarantine still forbids dispatch */ }
      return result('blocked', { reason: 'worker-termination-unconfirmed：interrupted attempt has no terminal receipt; reconcile before resume' })
    } else {
      expectedHead = ledger.lastAttemptResult(taskId)?.commit ?? envelope.parent_commit
      if (expectedHead && headNow !== expectedHead) {
        return finish('blocked', `stale-head：預期 HEAD=${expectedHead} 實際=${headNow}——嘗試間外部改動，需人工裁定`)
      }
    }
  }

  const maxAttempts = 1 + envelope.max_retries
  let feedback: string | undefined
  let lastReason = 'unknown'
  let prevFingerprint: string | undefined

  while (state.attempts < maxAttempts) {
    if (!isAlive()) {
      writeCheckpoint(stateDir, buildCheckpoint(stateDir, envelope, ledger, { task_id: taskId, attempt: state.attempts, status: 'stopped' }, 'n/a', `resume task ${taskId}（剩餘 budget ${maxAttempts - state.attempts}）`, readCheckpoint(stateDir)))
      deps.events?.append('conductor-task-stopped', { task_id: taskId, attempts: state.attempts })
      return result('stopped', { reason: 'isAlive=false：conductor 被叫停，checkpoint 已寫' })
    }

    const headBefore = getHead(deps.projectPath)
    if (expectedHead && headBefore !== expectedHead) {
      return finish('blocked', `stale-head：預期 HEAD=${expectedHead} 實際=${headBefore ?? 'unreadable'}——嘗試間外部改動，需人工裁定`)
    }
    if (!headBefore) {
      return finish('blocked', 'HEAD 讀取失敗（attempt 間 git 異常）')
    }

    let engine: Engine
    try {
      engine = deps.resolveWorker(envelope.worker)
    } catch (e) {
      return finish('blocked', `engine-unavailable：${msg(e)}`)
    }

    const attemptNo = ledger.totalAttempts(taskId) + 1
    state.attempts += 1
    const preDispatchDirty = [...snapNow().keys()].filter(p => !(stateRel && pathMatches(p, stateRel))).length
    ledger.append({ type: 'attempt', task_id: taskId, attempt: attemptNo, worker: envelope.worker, preexisting_dirty: preDispatchDirty, ts: now() })
    writeCheckpoint(stateDir, buildCheckpoint(stateDir, envelope, ledger, { task_id: taskId, attempt: attemptNo, status: 'dispatched' }, 'in-progress', `worker ${envelope.worker} attempt ${attemptNo}`, readCheckpoint(stateDir)))

    // 派工視窗前緣快照：conductor 寫入已結束、worker 尚未啟動——視窗內任何變動都算 worker 的
    let baseline = snapNow()
    const timeout = envelope.budget.timeout_ms
    const controller = new AbortController()
    const signal = timeout ? controller.signal : undefined
    const job: Job = {
      task: { id: workerTaskId(taskId), text: `${envelope.goal}\n\n${envelope.scope}`, line: 0, status: 'open' },
      projectPath: deps.projectPath,
      directive: buildWorkerDirective(envelope, attemptNo, feedback),
      executionId: randomUUID(),
      writerIdentity: `conductor/${envelope.worker}`,
      control: signal ? { signal } : undefined,
    }

    let res: RunResult
    let preflightFailed = false
    let timedOut = false
    let terminationConfirmed = false
    let fence: string | undefined
    try {
      const pf = await engine.preflight()
      if (!pf.ok) {
        preflightFailed = true
        res = { ok: false, output: pf.detail, costUsd: 0, costUnknown: true, failureReason: `preflight-failed：${pf.detail}` }
      } else {
        fence = JSON.stringify({ schemaVersion: 1, taskId, attempt: attemptNo, executionId: job.executionId, hostPid: process.pid, timestamp: now() }) + '\n'
        try { writeFileSync(fenceFile, fence, { encoding: 'utf8', flag: 'wx' }) }
        catch { return result('blocked', { reason: 'worker-termination-unconfirmed：unable to acquire worker quarantine; no worker dispatched' }) }
        writeFileSync(projectionFile, fence, 'utf8')
        baseline = snapNow()
        // Always consume late rejection. Promise.race alone cannot cancel a writer.
        const running = Promise.resolve().then(() => engine.run(job)).catch((e): RunResult =>
          ({ ok: false, output: '', costUsd: 0, costUnknown: true, recoveryRequired: true, failureReason: `worker-crash: ${msg(e)}` }))
        let timer: ReturnType<typeof setTimeout> | undefined
        const timeoutResult = timeout ? new Promise<RunResult>(resolve => {
          timer = setTimeout(() => {
            timedOut = true
            controller.abort()
            resolve({ ok: false, output: '', costUsd: 0, costUnknown: true, failureReason: `task-timeout：逾時 ${timeout}ms` })
          }, timeout)
        }) : undefined
        try { res = timeoutResult ? await Promise.race([running, timeoutResult]) : await running }
        finally { if (timer) clearTimeout(timer) }
        if (timedOut) {
          let stopTimer: ReturnType<typeof setTimeout> | undefined
          try {
            const receipt = await Promise.race([
              Promise.all([deps.cancelWorker?.(engine, job), running]).then(([receipt]) => receipt),
              new Promise<undefined>(resolve => { stopTimer = setTimeout(() => resolve(undefined), terminationTimeout) }),
            ])
            terminationConfirmed = receipt?.terminated === true && receipt.executionId === job.executionId
          } catch { /* unavailable/failed termination stays quarantined */ }
          finally { if (stopTimer) clearTimeout(stopTimer) }
        }
      }
    } catch (e) {
      res = { ok: false, output: '', costUsd: 0, costUnknown: true, failureReason: `worker-crash: ${msg(e)}` }
    }

    // 派工視窗後緣快照（在 conductor 產物寫入之前抓，視窗內 delta 全屬 worker）
    const headAfter = getHead(deps.projectPath)
    const after = snapNow()
    const delta = dirtyDeltaPaths(baseline, after)
    const committed = Boolean(headAfter && headAfter !== headBefore)
    const releaseFence = (): boolean => {
      if (!fence) return true
      try {
        if (readFileSync(fenceFile, 'utf8') !== fence) return false
        if (readFileSync(projectionFile, 'utf8') !== fence) return false
        rmSync(projectionFile)
        rmSync(fenceFile)
        return true
      } catch { return false }
    }

    const writeArtifacts = (name: 'worker-report' | 'verification', body: string[]): void => {
      const text = body.join('\n')
      mkdirSync(taskRunDir, { recursive: true })
      writeFileSync(join(taskRunDir, `${name}.md`), text, 'utf8')
      writeFileSync(join(taskRunDir, `attempt-${attemptNo}-${name}.md`), text, 'utf8')
    }
    writeArtifacts('worker-report', [
      `# worker-report`, ``,
      `task: ${taskId}`, `attempt: ${attemptNo}`, `worker: ${envelope.worker}`,
      `model: ${res.actualModel ?? 'unknown'}`, `ok: ${res.ok}`, `cost_usd: ${res.costUsd ?? 'unknown'}`, `commit: ${headAfter ?? 'n/a'}`, ``,
      `## output`, '````', (res.output ?? '').trim(), '````', ``,
      `## failure`, res.failureReason ?? '（無）', ``,
    ])

    let failureClass: string | undefined
    let failureReason: string | undefined
    if (timedOut) {
      failureClass = 'task-timeout'
      failureReason = res.failureReason ?? `task-timeout：逾時 ${timeout}ms（不信遲到的完工宣稱）`
    } else if (preflightFailed || !res.ok) {
      failureReason = res.failureReason ?? 'worker failed without reason'
      failureClass = preflightFailed ? 'preflight' : classifyFailure(failureReason)
    } else if (envelope.budget.max_cost_usd !== undefined && res.costUsd > envelope.budget.max_cost_usd) {
      failureClass = 'over-budget'
      failureReason = `over-budget：cost ${res.costUsd} > ${envelope.budget.max_cost_usd}`
    } else if (!committed && delta.length === 0) {
      failureClass = 'phantom-completion'
      failureReason = '無改動證據：worker 宣稱完成但無 commit 也無檔案變動'
    }
    const fingerprint = failureReason ? fpOf(failureClass!, failureReason) : undefined

    ledger.append({
      type: 'attempt-result', task_id: taskId, attempt: attemptNo, worker: envelope.worker,
      ok: !failureReason, model: res.actualModel, cost_usd: res.costUnknown ? undefined : res.costUsd,
      failure_reason: failureReason, failure_class: failureClass, fingerprint,
      termination_confirmed: timedOut ? terminationConfirmed : !res.recoveryRequired, recovery_required: res.recoveryRequired,
      base_commit: headBefore, commit: headAfter ?? undefined, ts: now(),
    })
    expectedHead = headAfter ?? expectedHead

    if (res.recoveryRequired || (timedOut && !terminationConfirmed)) {
      return finish('escalated', `worker-termination-unconfirmed：${failureClass ?? 'recovery'} requires independent stop and execution reconciliation; quarantine retained, no retry`, headAfter)
    }
    // The snapshot above is taken after both run settlement and the host stop
    // receipt. A late mutation cannot become the next attempt's normal baseline.
    if (timedOut && (committed || delta.length > 0)) {
      return finish('blocked', 'task-timeout-late-mutation：repo changed before confirmed termination; quarantine retained, review before retry', headAfter)
    }
    if (!releaseFence()) {
      return finish('blocked', 'worker-quarantine-changed：execution fence changed; no retry or verification', headAfter)
    }

    if (failureReason) {
      feedback = failureReason
      lastReason = `${failureClass}：${failureReason}`
      if (fingerprint && fingerprint === prevFingerprint) {
        return finish('escalated', `identical-failure-fingerprint ${fingerprint}：同一失敗重複出現，停止燒額度——${lastReason}`)
      }
      prevFingerprint = fingerprint
      continue
    }

    // ---- 驗證閘：不信 worker 宣稱，只看 repo 證據（累計 diff vs parent_commit） ----
    const vr = await verifyAttempt(envelope, {
      cwd: deps.projectPath,
      baseCommit: envelope.parent_commit ?? headBefore,
      baselineDirty: baseline,
      afterDirty: after,
      runTest: deps.runTest,
    })
    writeArtifacts('verification', [
      `# verification`, ``,
      `task: ${taskId}`, `attempt: ${attemptNo}`, `verdict: ${vr.verdict}`, ``,
      `## changed files`, ...(vr.changedFiles.length ? vr.changedFiles.map(f => `- ${f}`) : ['（無）']),
      `## violations`, ...(vr.violations.length ? vr.violations.map(f => `- ${f}`) : ['（無）']),
      `## tests`, ...(vr.tests.length ? vr.tests.map(t => `- [${t.status}] exit=${String(t.exitCode)} ${t.command} — ${t.detail}`) : ['（無）']),
      ``, `## detail`, vr.detail, ``,
    ])
    ledger.append({ type: 'verification', task_id: taskId, attempt: attemptNo, verdict: vr.verdict, detail: vr.detail, violations: vr.violations, tests: vr.tests, ts: now() })
    deps.events?.append('conductor-verification', { task_id: taskId, attempt: attemptNo, verdict: vr.verdict })

    if (vr.verdict === 'pass') {
      return finish('done', vr.detail, headAfter)
    }
    if (vr.verdict === 'unverified') {
      return finish('unverified', vr.detail, headAfter ?? undefined)
    }
    feedback = `驗證失敗：${vr.detail}`
    lastReason = `verify-fail：${vr.detail}`
    const vfp = fpOf('verify-fail', vr.detail)
    if (vfp === prevFingerprint) {
      return finish('escalated', `identical-failure-fingerprint ${vfp}：同一驗證失敗重複，停止燒額度——${lastReason}`)
    }
    prevFingerprint = vfp
  }

  return finish('escalated', `已達重試上限（${maxAttempts} 次 attempt / max_retries=${envelope.max_retries}）：${lastReason}`)
}
