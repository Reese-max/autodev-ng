import { spawn } from 'node:child_process'
import { homedir } from 'node:os'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join } from 'node:path'
import type { Engine, Job, PreflightResult, RunResult } from '../types.js'
import type { PreflightCache } from '../preflight.js'
import { acquireLock, releaseLock } from '../lock.js'
import { defaultCommitHash } from './commit-hash.js'
import { releaseLockIfOwned } from './daemon-fence.js'
import { killTree } from './proc.js'
import { cancelledRun, observeRun, type RunControl } from './run-control.js'
import { WORKER_GUARDS } from './prompt-guard.js'

export interface FreebuffOpts {
  id?: string
  command?: string
  /** MCP server argv；測試用可換成 fake server。 */
  baseArgs?: string[]
  timeoutMs?: number
  pingTimeoutMs?: number
  cache: PreflightCache
  lockDir: string
  getCommitHash?: (cwd: string) => string | undefined
}

interface ToolCall { name: 'get_freebuff_route' | 'delegate_to_freebuff'; arguments: Record<string, unknown> }
interface RouteSnapshot { accessTier: 'full' | 'limited'; primaryModel: string; primaryReasoning: 'max' | 'native'; fallbackModel: string; fallbackReasoning: 'max' | 'native'; quota: { status: string; price: number | null; balance: number | null; resetAt: string | null } }
interface McpResult { ok: boolean; texts: string[]; stderr: string; durationMs: number; timedOut?: boolean; aborted?: boolean; recoveryRequired?: boolean; error?: string; route?: RouteSnapshot }

/** Freebuff adapter：只走本機 freebuff-mcp stdio；不呼叫互動式 Freebuff TUI。 */
export class FreebuffEngine implements Engine {
  readonly id: string
  private readonly command: string
  private readonly baseArgs: string[]
  private readonly timeoutMs: number
  private readonly pingTimeoutMs: number
  private readonly cache: PreflightCache
  private readonly lockDir: string
  private readonly getCommitHash: (cwd: string) => string | undefined

  constructor(opts: FreebuffOpts) {
    this.id = opts.id ?? 'freebuff'
    this.command = opts.command ?? (process.platform === 'win32' ? 'bun.exe' : 'bun')
    this.baseArgs = opts.baseArgs ?? [join(homedir(), 'freebuff-mcp', 'server.ts')]
    this.timeoutMs = opts.timeoutMs ?? 30 * 60_000
    if (!Number.isSafeInteger(this.timeoutMs) || this.timeoutMs <= 0) throw new Error('Freebuff requires a positive wall timeout')
    this.pingTimeoutMs = opts.pingTimeoutMs ?? 30_000
    this.cache = opts.cache
    this.lockDir = opts.lockDir
    this.getCommitHash = opts.getCommitHash ?? defaultCommitHash
  }

  async preflight(): Promise<PreflightResult> {
    const key = `${this.command}|${this.baseArgs.join('|')}`
    const cached = this.cache.get(key)
    if (cached) return cached
    const r = await this.mcp([{ name: 'get_freebuff_route', arguments: {} }], process.cwd(), this.pingTimeoutMs)
    const result: PreflightResult = r.ok && r.route
      ? { ok: true, detail: `Freebuff ${r.route.accessTier} ${r.route.primaryModel}/${r.route.primaryReasoning} fallback=${r.route.fallbackModel}/${r.route.fallbackReasoning}; quota=${r.route.quota.status} price=${r.route.quota.price ?? 'unknown'} balance=${r.route.quota.balance ?? 'unknown'} reset=${r.route.quota.resetAt ?? 'unknown'}; admission unverified; ${r.durationMs}ms` }
      : { ok: false, detail: r.timedOut ? 'Freebuff MCP route timeout' : tail(r.error ?? r.stderr) }
    this.cache.set(key, result)
    return result
  }

  invalidatePreflight(): void {
    this.cache.set(`${this.command}|${this.baseArgs.join('|')}`, { ok: false, detail: 'run-failed：下輪重探' }, 0)
  }

  async run(job: Job): Promise<RunResult> {
    if (job.control?.signal?.aborted) return cancelledRun()
    const before = this.getCommitHash(job.projectPath)
    if (!before || !isAbsolute(job.projectPath)) {
      return { ok: false, output: '', costUsd: 0, failureReason: 'freebuff-invalid-worktree' }
    }

    const staleMs = this.timeoutMs > 0 ? this.timeoutMs + 5 * 60_000 : Number.MAX_SAFE_INTEGER
    // ponytail: one per-user lease serializes all projects sharing a Freebuff session.
    mkdirSync(dirname(this.lockDir), { recursive: true })
    if (!acquireLock(this.lockDir, staleMs)) {
      return { ok: false, output: '', costUsd: 0, failureReason: 'freebuff-session-busy' }
    }

    let retainLock = true
    try {
      writeFileSync(join(this.lockDir, 'recovery-required.json'), JSON.stringify({
        taskId: job.task.id, executionId: job.executionId, projectPath: job.projectPath,
        startedAt: new Date().toISOString(), reason: 'backend terminal result not yet confirmed',
      }))
      const prompt = [
        '你是自動開發工人。完成以下這一項任務。',
        WORKER_GUARDS,
        '改動完成後必須自己執行 git add -A 與 git commit（conventional commit，zh-TW）；',
        '沒有 commit 的工作會被整輪作廢、視為失敗。',
        '嚴禁超出任務範圍、嚴禁動 BACKLOG.md、嚴禁自行新增任務。',
        '嚴禁推送、建立 PR、部署、對外發訊息、修改憑證或共用設定；宿主負責驗收及發布。',
        `任務：${job.directive ?? job.task.text}`,
      ].join('\n')
      const r = await this.mcp([
        { name: 'get_freebuff_route', arguments: {} },
        { name: 'delegate_to_freebuff', arguments: {
          prompt, cwd: job.projectPath, switch_model: false,
          max_agent_steps: 20, take_over_active_session: false,
        } },
      ], job.projectPath, this.timeoutMs, job.control)
      retainLock = !!(r.aborted || job.control?.signal?.aborted || r.timedOut || r.recoveryRequired)
      const text = r.texts.at(-1) ?? ''
      const output = text.length > 2000 ? `${text.split('\n')[0]}\n${tail(text)}` : text
      if (r.aborted || job.control?.signal?.aborted) return cancelledRun(`${output}\n${r.stderr}`)
      if (!r.ok) return { ok: false, output: tail(`${output}\n${r.error ?? ''}\n${r.stderr}`), costUsd: 0, costUnknown: true, recoveryRequired: retainLock || undefined, failureReason: r.timedOut ? 'timeout' : `freebuff-mcp: ${tail(r.error ?? 'tool failed', 200)}` }
      if (!output.trim()) return { ok: false, output: tail(r.stderr), costUsd: 0, failureReason: 'empty-output：MCP 成功但無文字' }
      const after = this.getCommitHash(job.projectPath)
      if (!after || after === before) return { ok: false, output, costUsd: 0, failureReason: 'no-commit(phantom completion?)' }
      return { ok: true, output, costUsd: 0, costUnknown: true, actualModel: /^\[Freebuff 路由：(Full|Limited) → ([^；]+)/.exec(text)?.[2]?.trim(), commitHash: after, baseCommitHash: before }
    } finally {
      if (!retainLock) releaseLockIfOwned(this.lockDir, process.pid, releaseLock)
    }
  }

  private mcp(calls: ToolCall[], cwd: string, timeoutMs: number, control?: RunControl): Promise<McpResult> {
    if (control?.signal?.aborted) return Promise.resolve({ ok: false, texts: [], stderr: '', durationMs: 0, aborted: true, error: 'cancel-requested' })
    return new Promise(resolve => {
      const started = Date.now()
      const child = spawn(this.command, this.baseArgs, {
        cwd, shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], env: safeMcpEnv(),
      })
      child.stdout.setEncoding('utf8')
      child.stderr.setEncoding('utf8')
      let buffer = '', stderr = '', outputChars = 0, callIndex = 0, currentId = 1, settled = false, delegated = false, route: RouteSnapshot | undefined
      let knownBeforeAgent = false, lastProgress = 0
      let wallTimer: ReturnType<typeof setTimeout> | undefined
      const texts: string[] = []

      const shutdown = async (): Promise<void> => {
        try { child.stdin.end() } catch { /* child 已離開 */ }
        if (child.exitCode === null) await new Promise(resolveWait => setTimeout(resolveWait, 250))
        if (child.exitCode === null) await killTree(child.pid, { command: this.command })
      }
      const finish = (result: Omit<McpResult, 'durationMs' | 'stderr'>): void => {
        if (settled) return
        settled = true
        if (wallTimer) clearTimeout(wallTimer)
        control?.signal?.removeEventListener('abort', cancel)
        void shutdown().finally(() => {
          observeRun(control, { type: 'exit', code: child.exitCode, reason: result.aborted ? 'cancelled' : result.timedOut ? 'wall' : 'exit' })
          resolve({ ...result, recoveryRequired: delegated && !result.ok && !knownBeforeAgent, stderr: tail(stderr), durationMs: Date.now() - started })
        })
      }
      const send = (message: Record<string, unknown>): void => {
        try { child.stdin.write(`${JSON.stringify(message)}\n`) } catch (err) { finish({ ok: false, texts, error: String(err) }) }
      }
      const cancel = (): void => {
        if (settled) return
        observeRun(control, { type: 'cancel-requested' })
        send({ jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId: currentId, reason: 'operator cancellation' } })
        finish({ ok: false, texts, aborted: true, error: 'cancel-requested' })
      }
      const sendTool = (): void => {
        currentId = callIndex + 2
        const call = calls[callIndex]!
        if (call.name === 'delegate_to_freebuff') delegated = true
        send({ jsonrpc: '2.0', id: currentId, method: 'tools/call', params: { name: call.name, arguments: call.arguments, ...(call.name === 'delegate_to_freebuff' ? { _meta: { progressToken: currentId } } : {}) } })
      }
      const acceptToolResult = (message: Record<string, unknown>): void => {
        const result = message.result as { isError?: boolean; content?: Array<{ type?: string; text?: unknown }>; structuredContent?: { failure?: { kind?: unknown; phase?: unknown; status?: unknown } } } | undefined
        const text = Array.isArray(result?.content) ? result.content.filter(item => item?.type === 'text' && typeof item.text === 'string').map(item => item.text as string).join('\n') : ''
        if (result?.isError) {
          const failure = result.structuredContent?.failure
          // Only an explicit refusal before the agent starts releases the lease.
          knownBeforeAgent = failure?.kind === 'freebuff-session-error' && (
            (failure.phase === 'preflight' && ['insufficient_freebucks', 'wallet_required', 'unknown', 'session_limit'].includes(String(failure.status))) ||
            (failure.phase === 'admission' && ['rate_limited', 'spend_limited', 'model_unavailable', 'model_locked', 'country_blocked', 'banned', 'ip_capped'].includes(String(failure.status)))
          )
          return finish({ ok: false, texts, error: text || 'MCP tool error' })
        }
        if (!text.trim()) return finish({ ok: false, texts, error: 'MCP tool empty output' })
        const call = calls[callIndex]!
        if (call.name === 'get_freebuff_route') {
          const parsed = parseRoute(text)
          if (parsed.error) return finish({ ok: false, texts, error: parsed.error })
          route = parsed.route
        } else {
          const delegateError = validateDelegate(text, route)
          if (delegateError) return finish({ ok: false, texts, error: delegateError })
        }
        texts.push(text)
        callIndex++
        if (callIndex >= calls.length) finish({ ok: true, texts, route })
        else sendTool()
      }
      const acceptLine = (line: string): void => {
        let message: Record<string, unknown>
        try { message = JSON.parse(line) as Record<string, unknown> }
        catch { return finish({ ok: false, texts, error: 'MCP stdout 不是合法 NDJSON' }) }
        if (!message || typeof message !== 'object' || Array.isArray(message)) return finish({ ok: false, texts, error: 'MCP response must be an object' })
        if (message.method && message.id === undefined) {
          if (message.method === 'notifications/progress' && calls[callIndex]?.name === 'delegate_to_freebuff') {
            const params = message.params as { progressToken?: unknown; progress?: unknown; message?: unknown } | undefined
            if (params?.progressToken === currentId && typeof params.progress === 'number' && Number.isSafeInteger(params.progress) && params.progress > lastProgress && typeof params.message === 'string') {
              const event = normalizedProgress(params.message, params.progress)
              if (event) {
                lastProgress = params.progress
                observeRun(control, { type: 'output', stream: 'stdout', text: `${JSON.stringify(event)}\n` })
              }
            }
          }
          return
        }
        if (message.error) {
          const error = message.error as { code?: unknown; message?: unknown }
          return finish({ ok: false, texts, error: `JSON-RPC ${String(error.code ?? '')}: ${String(error.message ?? 'error').slice(0, 200)}` })
        }
        if (message.id === 1 && currentId === 1) {
          const capabilities = (message.result as { capabilities?: { tools?: unknown } } | undefined)?.capabilities
          if (!capabilities?.tools) return finish({ ok: false, texts, error: 'MCP initialize 未宣告 tools capability' })
          send({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} })
          return sendTool()
        }
        if (message.id === currentId && currentId >= 2) return acceptToolResult(message)
        finish({ ok: false, texts, error: `MCP unexpected response id ${String(message.id)}` })
      }

      child.stdout.on('data', (chunk: string) => {
        observeRun(control, { type: 'output', stream: 'stdout', text: chunk })
        outputChars += chunk.length
        if (outputChars > 2_000_000) return finish({ ok: false, texts, error: 'MCP output exceeded 2MB' })
        buffer += chunk
        for (;;) {
          const newline = buffer.indexOf('\n')
          if (newline < 0) break
          const line = buffer.slice(0, newline).replace(/\r$/, '')
          buffer = buffer.slice(newline + 1)
          if (line.trim()) acceptLine(line)
          if (settled) break
        }
      })
      child.stderr.on('data', (chunk: string) => { observeRun(control, { type: 'output', stream: 'stderr', text: chunk }); stderr = tail(stderr + chunk, 20_000) })
      child.stdin.on('error', err => finish({ ok: false, texts, error: String(err), route }))
      child.on('error', err => finish({ ok: false, texts, error: String(err) }))
      child.on('close', code => { if (!settled) finish({ ok: false, texts, error: `MCP server early exit ${code ?? 'null'}` }) })
      child.on('spawn', () => {
        if (child.pid !== undefined) observeRun(control, { type: 'spawn', pid: child.pid, startedAt: Date.now() })
        if (!settled) send({
          jsonrpc: '2.0', id: 1, method: 'initialize', params: {
            protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'autodev-ng', version: '0.1.0' },
          },
        })
      })
      if (timeoutMs > 0) wallTimer = setTimeout(() => {
        send({ jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId: currentId, reason: 'timeout' } })
        finish({ ok: false, texts, timedOut: true, error: 'timeout' })
      }, timeoutMs)
      control?.signal?.addEventListener('abort', cancel, { once: true })
      if (control?.signal?.aborted) cancel()
    })
  }
}

const TIER_MODELS = {
  full: new Set(['openai/gpt-5.6-luna', 'z-ai/glm-5.3-flash', 'deepseek/deepseek-v4-flash', 'mimo/mimo-v2.5']),
  limited: new Set(['z-ai/glm-5.3-flash', 'deepseek/deepseek-v4-flash', 'mimo/mimo-v2.5']),
}

function normalizedProgress(message: string, sequence: number): Record<string, unknown> | undefined {
  if (message.length > 2048) return
  try {
    const raw = JSON.parse(message) as Record<string, unknown>
    if (!raw || raw.type !== 'freebuff_progress' || raw.sequence !== sequence || typeof raw.event !== 'string') return
    const types: Record<string, string> = { start: 'turn.started', finish: 'turn.completed', tool_call: 'tool_execution_start', tool_result: 'tool_result', subagent_start: 'assistant.turn_start', subagent_finish: 'assistant.turn_end' }
    const type = types[raw.event]
    if (!type) return
    return { type, source: 'freebuff', sequence, ...(typeof raw.toolName === 'string' && /^[\w.-]{1,100}$/.test(raw.toolName) ? { toolName: raw.toolName } : {}) }
  } catch { return }
}

function parseRoute(text: string): { route?: RouteSnapshot; error?: string } {
  try {
    const raw = JSON.parse(text) as Record<string, unknown>
    if (raw.accessTier !== 'full' && raw.accessTier !== 'limited') return { error: 'Freebuff route 缺少可驗證 accessTier' }
    if (raw.canDelegate !== true) return { error: `Freebuff route canDelegate=false: ${typeof raw.blockedReason === 'string' ? raw.blockedReason.slice(0, 300) : 'preflight refused'}` }
    if (raw.sessionConsumed !== false) return { error: 'Freebuff route probe 消耗或無法證明 sessionConsumed=false' }
    const quota = raw.quota as Record<string, unknown> | undefined
    if (!quota || quota.canStart !== true || quota.admissionVerified !== false || typeof quota.status !== 'string') return { error: 'Freebuff route 缺少額度預檢；需要新版 freebuff-mcp' }
    if (![quota.price, quota.balance].every(value => value === null || typeof value === 'number' && Number.isFinite(value) && value >= 0) || !(quota.resetAt === null || typeof quota.resetAt === 'string')) return { error: 'Freebuff route 額度資料格式無效' }
    const allowed = TIER_MODELS[raw.accessTier]
    if (typeof raw.primaryModel !== 'string' || !allowed.has(raw.primaryModel)) return { error: `Freebuff ${raw.accessTier} primaryModel 不在允許路由` }
    if (typeof raw.fallbackModel !== 'string' || !allowed.has(raw.fallbackModel) || raw.fallbackModel === raw.primaryModel) return { error: `Freebuff ${raw.accessTier} fallbackModel 不在允許路由` }
    const reasoning = (model: string): 'max' | 'native' => model === 'mimo/mimo-v2.5' ? 'native' : 'max'
    if (raw.primaryReasoning !== reasoning(raw.primaryModel) || raw.fallbackReasoning !== reasoning(raw.fallbackModel)) return { error: 'Freebuff route reasoning 不符合模型契約' }
    return { route: { accessTier: raw.accessTier, primaryModel: raw.primaryModel, primaryReasoning: raw.primaryReasoning as 'max' | 'native', fallbackModel: raw.fallbackModel, fallbackReasoning: raw.fallbackReasoning as 'max' | 'native', quota: { status: quota.status, price: quota.price as number | null, balance: quota.balance as number | null, resetAt: quota.resetAt as string | null } } }
  } catch { return { error: 'Freebuff route 不是合法 JSON' } }
}

function validateDelegate(text: string, route: RouteSnapshot | undefined): string | undefined {
  if (!route) return 'Freebuff delegate 缺少先前 route 證據'
  const m = /^\[Freebuff 路由：(Full|Limited) → ([^；\]\r\n]+)；推理：(max|native)(?:；([^；\]\r\n]+) 暫時不可用後切換)?\]/.exec(text)
  if (!m) return 'Freebuff delegate 缺少 tier/model/reasoning 證據'
  const tier = m[1]!.toLowerCase(), model = m[2]!.trim(), reasoning = m[3]!, fallbackFrom = m[4]?.trim()
  if (tier !== route.accessTier) return 'Freebuff delegate tier 與 route 不一致'
  const allowed = TIER_MODELS[route.accessTier]
  if (!allowed.has(model)) return 'Freebuff delegate model 不在 tier 允許路由'
  if (model !== route.primaryModel && (model !== route.fallbackModel || fallbackFrom !== route.primaryModel)) return 'Freebuff delegate model 與實際預檢路由不一致'
  if (model === route.primaryModel && fallbackFrom) return 'Freebuff delegate 回報不合理的 fallback'
  if (reasoning !== (model === 'mimo/mimo-v2.5' ? 'native' : 'max')) return 'Freebuff delegate reasoning 與模型不一致'
  if (fallbackFrom && (!allowed.has(fallbackFrom) || fallbackFrom === model)) return 'Freebuff delegate fallback 不在 tier 允許路由'
  return undefined
}

function safeMcpEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {}
  for (const key of ['HOME', 'APPDATA', 'COMSPEC', 'HOMEDRIVE', 'HOMEPATH', 'LOCALAPPDATA', 'PATH', 'PATHEXT', 'PROGRAMFILES', 'SYSTEMDRIVE', 'SYSTEMROOT', 'TEMP', 'TMP', 'USERNAME', 'USERPROFILE', 'WINDIR']) {
    if (process.env[key] !== undefined) env[key] = process.env[key]
  }
  return env
}

function tail(s: string, n = 2000): string { return s.length > n ? s.slice(-n) : s }
