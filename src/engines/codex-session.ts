import { resolve } from 'node:path'
import type { Writable } from 'node:stream'
import { runProcess, type ProcResult } from './proc.js'
import { observeRun, type RunControl, type SteerPort } from './run-control.js'

/** Native stdio app-server; transport lifetime/cancellation remain owned by runProcess. */
export async function runCodexSession(opts: {
  command: string; args: string[]; cwd: string; prompt: string; env: Record<string, string>
  model?: string; effort?: string; timeoutMs: number; idleTimeoutMs?: number; control?: RunControl
}): Promise<ProcResult> {
  let stdin: Writable | undefined, serial = 0, buffer = '', normalized = '', diagnostic = ''
  let threadId = '', turnId = '', terminal = false, closed = false, busy = false, safeBoundary = false
  let usage: { input_tokens: number; cached_input_tokens: number; output_tokens: number } | undefined
  let claimed: ReturnType<NonNullable<SteerPort['claim']>>
  const critical = new Set<string>(), early: Record<string, any>[] = []
  const pending = new Map<number, { method: string; resolve(value: any): void; reject(error: Error): void }>()
  const controller = new AbortController()
  const signal = opts.control?.signal ? AbortSignal.any([opts.control.signal, controller.signal]) : controller.signal
  const send = (message: unknown) => { if (!closed && stdin && !stdin.writableEnded) stdin.write(JSON.stringify(message) + '\n') }
  const ready = (supported: boolean) => observeRun(opts.control, { type: 'steer-ready', supported })
  const emit = (event: Record<string, unknown>) => {
    const text = JSON.stringify(event) + '\n'
    if (normalized.length + text.length > 2_000_000) throw new Error('native output exceeds 2MB')
    normalized += text; observeRun(opts.control, { type: 'output', stream: 'stdout', text })
  }
  const fail = (error: unknown) => {
    diagnostic ||= String(error).slice(0, 300)
    for (const request of pending.values()) request.reject(new Error(diagnostic))
    pending.clear()
    if (!closed) controller.abort()
  }
  const request = (method: string, params: unknown) => new Promise<any>((resolve, reject) => {
    const id = ++serial
    pending.set(id, { method, resolve, reject }); send({ id, method, params })
  })
  const closeIfDone = () => { if (terminal && !pending.size && !busy) stdin?.end() }
  const notification = (message: Record<string, any>) => {
    const p = message.params
    if (!p || p.threadId !== threadId) return
    if (!turnId) { if (early.length >= 128) throw new Error('native pre-turn events exceed limit'); early.push(message); return }
    if ((p.turnId ?? p.turn?.id) !== turnId || terminal) return
    if (message.method === 'item/started' || message.method === 'item/completed') {
      const item = p.item
      if (!item || typeof item.id !== 'string' || typeof item.type !== 'string') throw new Error('invalid native item')
      if (message.method === 'item/completed') { critical.delete(item.id); safeBoundary = critical.size === 0 }
      else if (!['userMessage', 'agentMessage', 'reasoning', 'plan'].includes(item.type)) { critical.add(item.id); safeBoundary = false }
      const type = ({ agentMessage: 'agent_message', commandExecution: 'command_execution', fileChange: 'file_change', mcpToolCall: 'mcp_tool_call' } as Record<string, string>)[item.type] ?? item.type
      emit({ type: message.method.replace('/', '.'), item: { id: item.id, type, ...(typeof item.text === 'string' ? { text: item.text } : {}) } })
    } else if (message.method === 'thread/tokenUsage/updated') {
      const u = p.tokenUsage?.total
      if (u && [u.inputTokens, u.cachedInputTokens, u.outputTokens].every(n => Number.isSafeInteger(n) && n >= 0))
        usage = { input_tokens: u.inputTokens, cached_input_tokens: u.cachedInputTokens, output_tokens: u.outputTokens }
    } else if (message.method === 'turn/completed') {
      terminal = true; ready(false)
      emit({ type: p.turn.status === 'completed' ? 'turn.completed' : 'turn.failed', usage })
      closeIfDone()
    }
  }
  const accept = (message: Record<string, any>) => {
    if (message.method) {
      if (message.id !== undefined) {
        const result = ['item/commandExecution/requestApproval', 'item/fileChange/requestApproval'].includes(message.method) ? { decision: 'decline' }
          : message.method === 'item/permissions/requestApproval' ? { permissions: {}, scope: 'turn' }
          : message.method === 'item/tool/requestUserInput' ? { answers: {} } : undefined
        send(result ? { id: message.id, result } : { id: message.id, error: { code: -32601, message: 'Unsupported worker request' } })
      } else notification(message)
      return
    }
    const rpc = pending.get(message.id)
    if (!rpc) return
    pending.delete(message.id)
    if (message.error) { rpc.reject(new Error(`RPC ${rpc.method} rejected (${message.error.code})`)); return }
    if (rpc.method === 'turn/start') {
      if (typeof message.result?.turn?.id !== 'string') { rpc.reject(new Error('missing native turn ID')); return }
      turnId = message.result.turn.id
      emit({ type: 'turn.started' })
      for (const event of early.splice(0)) notification(event)
      if (!terminal) ready(true)
    }
    rpc.resolve(message.result)
  }
  const poll = async () => {
    if (busy || terminal || closed || signal.aborted || !safeBoundary || critical.size || !turnId) return
    claimed = opts.control?.steer?.claim?.()
    if (!claimed) return
    busy = true
    const delivery = claimed
    try {
      const ack = await request('turn/steer', { threadId, expectedTurnId: turnId, clientUserMessageId: delivery.id, input: [{ type: 'text', text: delivery.instruction }] })
      delivery.settle(ack?.turnId === turnId ? 'STEERED' : 'DELIVERY_UNKNOWN', `native ${threadId}/${turnId}: ${ack?.turnId === turnId ? 'acknowledged' : 'acknowledgement mismatch'}`)
    } catch (error) {
      delivery.settle(String(error).includes('RPC turn/steer rejected') ? 'NOT_DELIVERED' : 'DELIVERY_UNKNOWN', `native ${threadId}/${turnId}: ${String(error).slice(0, 200)}`)
    } finally { claimed = undefined; busy = false; closeIfDone() }
  }
  const timer = setInterval(() => { void poll().catch(fail) }, 50)
  try {
    const result = await runProcess({ ...opts, stdinText: '', replaceEnv: true,
      control: { ...opts.control, signal, onEvent(event) {
        try {
          if (event.type === 'output' && event.stream === 'stdout') {
            buffer += event.text
            if (buffer.length > 2_000_000) throw new Error('native frame exceeds 2MB')
            let end: number
            while ((end = buffer.indexOf('\n')) >= 0) {
              const line = buffer.slice(0, end); buffer = buffer.slice(end + 1)
              if (line.trim()) accept(JSON.parse(line))
            }
          } else {
            if (event.type === 'exit') { closed = true; for (const rpc of pending.values()) rpc.reject(new Error('native transport closed')); pending.clear() }
            observeRun(opts.control, event)
          }
        } catch (error) { fail(error) }
      } },
      stdin(stream) {
        stdin = stream
        void (async () => {
          await request('initialize', { clientInfo: { name: 'autodev-ng', version: '0.1.0' }, capabilities: { experimentalApi: true } })
          send({ method: 'initialized' })
          const started = await request('thread/start', { cwd: opts.cwd, ephemeral: true, model: opts.model,
            allowProviderModelFallback: false, approvalPolicy: 'never', permissions: 'workspace-only',
            dynamicTools: [] })
          const samePath = (a: string, b: string) => process.platform === 'win32' ? resolve(a).toLowerCase() === resolve(b).toLowerCase() : resolve(a) === resolve(b)
          const localRoots = (roots: unknown) => roots === undefined || Array.isArray(roots) && roots.every(root => typeof root === 'string' && samePath(root, opts.cwd))
          if (typeof started?.thread?.id !== 'string' || !started.thread.ephemeral || typeof started.thread.cwd !== 'string' || !samePath(started.thread.cwd, opts.cwd)
            || typeof started.cwd !== 'string' || !samePath(started.cwd, opts.cwd) || opts.model && started.model !== opts.model
            || started.approvalPolicy !== 'never' || started.activePermissionProfile?.id !== 'workspace-only'
            // Named profiles can have a readOnly legacy projection; never accept broader legacy grants.
            || !['readOnly', 'workspaceWrite'].includes(started.sandbox?.type) || started.sandbox.networkAccess === true
            || !localRoots(started.sandbox.writableRoots) || !localRoots(started.runtimeWorkspaceRoots))
            throw new Error('native thread identity or safety policy mismatch')
          threadId = started.thread.id
          emit({ type: 'thread.started', thread_id: threadId })
          await request('turn/start', { threadId, input: [{ type: 'text', text: opts.prompt }], ...(opts.effort ? { effort: opts.effort } : {}) })
          closeIfDone()
        })().catch(fail)
      },
    })
    return { ...result, stdout: normalized, stderr: `${result.stderr}${diagnostic ? '\n' + diagnostic : ''}`,
      exitCode: diagnostic && result.exitCode === 0 ? 1 : result.exitCode }
  } finally {
    clearInterval(timer); ready(false)
    if (claimed) claimed.settle('DELIVERY_UNKNOWN', `native ${threadId}/${turnId}: transport closed before acknowledgement`)
  }
}
