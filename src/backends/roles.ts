/**
 * ExecutionBackend 三角色＋升級的預設 adapter（issue #55）。
 *
 * - deterministicManager：零設定的最小 Manager，把原始目標當下一個 bounded step。
 * - llmManager：managerModel 設定時的 LLM Manager（回 JSON plan，解析失敗降級）。
 * - engineExecutor：Executor 走既有 Engine matrix（每輪 fresh bounded prompt）。
 * - mechanicalAuditor：Auditor = runVerify＋git HEAD，可選獨立 LLM 二審；不信 self-claim。
 * - engineEscalation：失敗指紋撞頂時的 escalation engine（例：herdr tag）。
 */
import { execFileSync } from 'node:child_process'
import { callAgent, type LlmOpts, type LlmResult } from '../autopilot/llm.js'
import { runVerify } from '../engines/run-verify.js'
import type { Engine, Task } from '../types.js'
import {
  BoundedStepSchema,
  type AuditorFn,
  type EscalateFn,
  type EscalationRequest,
  type EscalationResult,
  type ExecutorFn,
  type ManagerFn,
  type ManagerResult,
  type Usage,
} from './types.js'

export const defaultGitHead = (cwd: string): string | undefined => {
  try {
    const out = execFileSync('git', ['-c', `safe.directory=${cwd.replace(/\\/g, '/')}`, 'rev-parse', 'HEAD'],
      { cwd, timeout: 10_000, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    return out || undefined
  } catch { return undefined }
}

/** 無 LLM 設定的最小 Manager：把原始目標當作下一個 bounded step；完成與否完全交給 Auditor 的機械驗收。 */
export function deterministicManager(): ManagerFn {
  return async bundle => ({ plan: { kind: 'step', step: { text: bundle.goal.objective } } })
}

const ManagerReplySchema = {
  parse(text: string): ManagerResult['plan'] | undefined {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return undefined
    try {
      const value = JSON.parse(match[0]) as Record<string, unknown>
      if (value.kind === 'done') return { kind: 'done' }
      if (value.kind === 'blocked') return { kind: 'blocked', reason: String(value.reason ?? 'manager blocked').slice(0, 500) }
      if (value.kind === 'step') {
        const raw = value.step
        const step = typeof raw === 'string' ? { text: raw } : raw
        if (step && typeof step === 'object' && Object.prototype.hasOwnProperty.call(step, 'verifyCommand')) {
          return { kind: 'blocked', reason: 'manager step may not define verifyCommand' }
        }
        const parsed = BoundedStepSchema.safeParse(step)
        if (parsed.success) return { kind: 'step', step: parsed.data }
      }
      return undefined
    } catch { return undefined }
  },
}

/** LLM Manager（managerModel 設定時）：回 JSON {kind: step|done|blocked}；解析失敗降級為 deterministic step。 */
export function llmManager(llm: LlmOpts, callFn: (opts: LlmOpts, prompt: string) => Promise<LlmResult> = callAgent): ManagerFn {
  return async bundle => {
    const prompt = [
      '你是長時程執行的 Manager。根據目標與證據決定下一個 bounded step。',
      `目標：${bundle.goal.objective}`,
      `已驗證步驟：${bundle.verifiedSteps.length ? bundle.verifiedSteps.map(s => `round ${s.round}: ${s.step}`).join('；') : '無'}`,
      `失敗證據：${bundle.failures.length ? bundle.failures.map(f => `${f.fingerprint}×${f.count}`).join('；') : '無'}`,
      `升級指導：${bundle.directives.length ? bundle.directives.join('；') : '無'}`,
      '只回一個 JSON：{"kind":"step","step":{"text":"<bounded step>","risk":"low|high"}}、{"kind":"done"}（自認達成，仍須過機械驗收）或 {"kind":"blocked","reason":"<原因>"}。',
    ].join('\n')
    const reply = await callFn(llm, prompt)
    const usage: Usage = { tokensIn: reply.totalTokens }
    const plan = reply.error ? undefined : ManagerReplySchema.parse(reply.text)
    return { plan: plan ?? { kind: 'step', step: { text: bundle.goal.objective } }, usage }
  }
}

/** 預設 Executor：透過既有 Engine matrix 執行 bounded step；prompt 由後端逐輪新組。 */
export function engineExecutor(resolveEngine: () => Engine): ExecutorFn {
  return async req => {
    const engine = resolveEngine()
    const task: Task = {
      id: `lh-${req.runId.slice(0, 24)}-r${req.round}`,
      text: req.prompt,
      line: 0,
      status: 'open',
    }
    const res = await engine.run({
      task,
      projectPath: req.cwd,
      executionId: `${req.runId}-r${req.round}`,
      ...(req.control ? { control: req.control } : {}),
    })
    return {
      ok: res.ok, output: res.output, costUsd: res.costUsd,
      ...(res.costUnknown !== undefined ? { costUnknown: res.costUnknown } : {}),
      ...(res.tokensIn !== undefined ? { tokensIn: res.tokensIn } : {}),
      ...(res.tokensOut !== undefined ? { tokensOut: res.tokensOut } : {}),
      ...(res.tokensCached !== undefined ? { tokensCached: res.tokensCached } : {}),
      ...(res.commitHash ? { commitHash: res.commitHash } : {}),
      ...(res.failureReason ? { failureReason: res.failureReason } : {}),
      ...(res.cancelled !== undefined ? { cancelled: res.cancelled } : {}),
    }
  }
}

/**
 * 預設 Auditor：機械驗收（runVerify + git head），可選獨立 LLM 二審。
 * 不信 exec.ok／claim：verify pass 才算 verified；verify infra 失敗算 blocked（不當任務失敗）。
 */
export function mechanicalAuditor(opts: {
  runVerifyFn?: typeof runVerify
  gitHead?: (cwd: string) => string | undefined
  timeoutMs?: number
  llm?: LlmOpts
  callFn?: (opts: LlmOpts, prompt: string) => Promise<LlmResult>
}): AuditorFn {
  const verify = opts.runVerifyFn ?? runVerify
  const head = opts.gitHead ?? defaultGitHead
  return async req => {
    const gitSha = head(req.cwd)
    if (!req.claim && !req.exec.ok) {
      const detail = (req.exec.failureReason ?? req.exec.output).slice(0, 500) || 'executor failed without detail'
      return { outcome: 'rejected', detail: `executor 失敗：${detail}`, gitSha }
    }
    const cmd = req.goal.verifyCommand
    if (!cmd?.trim()) {
      return { outcome: 'rejected', detail: '未設定 verifyCommand；自我宣告不構成完成證據', gitSha }
    }
    const v = await verify({ command: cmd, cwd: req.cwd, timeoutMs: opts.timeoutMs ?? 600_000 })
    if (v.status === 'blocked') return { outcome: 'blocked', detail: v.detail, gitSha, verifyStatus: 'blocked' }
    if (v.status !== 'pass') return { outcome: 'rejected', detail: v.detail.slice(0, 1000), gitSha, verifyStatus: v.status }
    const goalAchieved = cmd === req.goal.verifyCommand
    if (!opts.llm) return { outcome: 'verified', detail: v.detail, gitSha, verifyStatus: 'pass', goalAchieved }
    const call = opts.callFn ?? callAgent
    const reply = await call(opts.llm, [
      '獨立稽核：機械驗收已通過，請以對抗角度判斷目標是否真正達成（只看證據，不信宣告）。',
      `目標：${req.goal.objective}`,
      `步驟：${req.step.text}`,
      `驗收輸出：${v.detail}`,
      '只回 PASS 或 REJECT <原因>。',
    ].join('\n'))
    const usage: Usage = { tokensIn: reply.totalTokens }
    if (reply.error) {
      return { outcome: 'blocked', detail: `llm-audit unavailable: ${reply.error.slice(0, 300)}`, gitSha, verifyStatus: 'pass', usage }
    }
    const decision = reply.text.trim()
    if (/^REJECT(?:\s|$)/i.test(decision)) {
      return { outcome: 'rejected', detail: `llm-audit reject: ${reply.text.slice(0, 300)}`, gitSha, verifyStatus: 'pass', usage }
    }
    if (!/^PASS$/i.test(decision)) {
      return { outcome: 'blocked', detail: 'llm-audit missing explicit PASS or REJECT decision', gitSha, verifyStatus: 'pass', usage }
    }
    return { outcome: 'verified', detail: v.detail, gitSha, verifyStatus: 'pass', goalAchieved, usage }
  }
}

/** 指紋撞頂時的升級路徑：把失敗證據交給 escalation engine（例如 herdr），成功則帶 directive 續跑。 */
export function engineEscalation(resolveEngine: () => Engine): EscalateFn {
  return async (req: EscalationRequest): Promise<EscalationResult> => {
    const task: Task = {
      id: `lh-esc-${req.runId.slice(0, 24)}`,
      text: [
        '長時程執行在同一失敗指紋上撞頂，需要外部 deliberation 找出 alternate path。',
        `目標：${req.goal.objective}`,
        `失敗指紋：${req.fingerprint}（連續 ${req.count} 次）`,
        `最近細節：${req.lastDetail}`,
        `其他失敗證據：${req.failures.map(f => `${f.fingerprint}×${f.count}`).join('；') || '無'}`,
        '回覆一段可直接執行的下一步指導（bounded directive）。',
      ].join('\n'),
      line: 0,
      status: 'open',
    }
    try {
      const res = await resolveEngine().run({ task, projectPath: req.cwd, executionId: `${req.runId}-esc-${req.count}` })
      const usage: Usage = {
        costUsd: res.costUsd,
        ...(res.tokensIn !== undefined ? { tokensIn: res.tokensIn } : {}),
        ...(res.tokensOut !== undefined ? { tokensOut: res.tokensOut } : {}),
      }
      return res.ok
        ? { action: 'resume', directive: res.output.slice(0, 2000) || 'escalation resolved without detail', usage }
        : { action: 'blocked', reason: (res.failureReason ?? 'escalation engine failed').slice(0, 500), usage }
    } catch (err) {
      return { action: 'blocked', reason: `escalation error: ${String(err).slice(0, 300)}` }
    }
  }
}
