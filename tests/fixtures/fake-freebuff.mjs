import { createInterface } from 'node:readline'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'

const mode = process.argv[2] ?? 'ok'
const rl = createInterface({ input: process.stdin })
const send = value => process.stdout.write(`${JSON.stringify(value)}\n`)
const toolResult = (id, text, isError = false, failure) => send({ jsonrpc: '2.0', id, result: { ...(isError ? { isError: true } : {}), ...(failure ? { structuredContent: { failure } } : {}), content: [{ type: 'text', text }] } })

if (mode === 'early-exit') process.exit(7)

rl.on('line', line => {
  const message = JSON.parse(line)
  if (message.method === 'initialize') {
    if (mode === 'null-json') return process.stdout.write('null\n')
    if (mode === 'invalid-json') return process.stdout.write('not-json\n')
    send({ jsonrpc: '2.0', id: message.id, result: { protocolVersion: '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'fake-freebuff', version: '1' } } })
    return
  }
  if (message.method !== 'tools/call') return
  const { name, arguments: args, _meta } = message.params
  if (name === 'get_freebuff_route') {
    const route = mode === 'bad-route'
      ? { accessTier: 'limited', canDelegate: false, primaryModel: 'mimo/mimo-v2.5', primaryReasoning: 'native', fallbackModel: 'deepseek/deepseek-v4-flash', fallbackReasoning: 'max', sessionConsumed: false }
      : { accessTier: 'limited', canDelegate: true, primaryModel: 'mimo/mimo-v2.5', primaryReasoning: 'native', fallbackModel: 'deepseek/deepseek-v4-flash', fallbackReasoning: 'max', sessionConsumed: false }
    route.quota = { status: 'available', canStart: true, admissionVerified: false, price: 10, balance: 25, resetAt: '2026-09-10T07:00:00Z' }
    if (mode === 'glm') Object.assign(route, { primaryModel: 'z-ai/glm-5.3-flash', primaryReasoning: 'max', fallbackModel: 'mimo/mimo-v2.5', fallbackReasoning: 'native', quota: { ...route.quota, price: 5 } })
    if (mode === 'quota-blocked') Object.assign(route, { canDelegate: false, blockedReason: 'insufficient_freebucks: price=15 balance=5', quota: { ...route.quota, canStart: false, status: 'insufficient_freebucks', price: 15, balance: 5 } })
    if (mode === 'missing-quota') delete route.quota
    if (mode === 'malformed-quota') route.quota.balance = '25'
    if (mode === 'retired-model') Object.assign(route, { accessTier: 'full', primaryModel: 'deepseek/deepseek-v4-pro', primaryReasoning: 'max' })
    if (mode === 'consumed-route') route.sessionConsumed = true
    if (mode === 'bad-content') return send({ jsonrpc: '2.0', id: message.id, result: { content: {} } })
    if (mode === 'fragmented') {
      const out = JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { content: [{ type: 'text', text: JSON.stringify(route) }] } }) + '\n'
      process.stdout.write(out.slice(0, 17)); setTimeout(() => process.stdout.write(out.slice(17)), 5)
      return
    }
    toolResult(message.id, JSON.stringify(route))
    return
  }
  if (name === 'delegate_to_freebuff') {
    if (mode === 'admission-denied') return toolResult(message.id, '跨模型每日供應商成本上限\n{"status":"spend_limited","httpStatus":429,"model":"mimo/mimo-v2.5"}', true, { kind: 'freebuff-session-error', phase: 'admission', status: 'spend_limited' })
    if (mode === 'progress') {
      const progress = (sequence, event, progressToken = _meta?.progressToken) => send({ jsonrpc: '2.0', method: 'notifications/progress', params: { progressToken, progress: sequence, message: JSON.stringify({ type: 'freebuff_progress', event, sequence, toolName: 'run_terminal_command' }) } })
      progress(1, 'start')
      progress(2, 'tool_call')
      progress(3, 'tool_result')
      progress(3, 'tool_result')
      progress(4, 'tool_result', 'wrong-request')
    }
    if (mode === 'repair') {
      if (args.cwd !== process.cwd() || !existsSync('check.cjs') || !existsSync('add.cjs')) throw new Error('Invalid repair fixture cwd')
      writeFileSync('add.cjs', 'module.exports = (a, b) => a + b\n')
      mkdirSync('tests/regressions', { recursive: true })
      writeFileSync('tests/regressions/github-4.test.cjs', "require('node:test')('addition', () => require('node:assert/strict').equal(require('../../add.cjs')(2, 3), 5))\n")
      execFileSync('git', ['add', '.'], { windowsHide: true })
      execFileSync('git', ['commit', '-qm', 'fix: addition'], { windowsHide: true })
    }
    if (mode === 'hang') return
    if (mode === 'tool-error') return toolResult(message.id, 'session limit reached', true)
    if (mode === 'empty') return toolResult(message.id, '')
    if (mode === 'stderr-noise') process.stderr.write('diagnostic only\n')
    const header = mode === 'glm' ? '[Freebuff 路由：Limited → z-ai/glm-5.3-flash；推理：max]' : mode === 'bad-delegate' ? '[Freebuff 路由：Limited → paid/model；推理：native]' : mode === 'wrong-tier' ? '[Freebuff 路由：Full → openai/gpt-5.6-luna；推理：max]' : mode === 'bad-reasoning' ? '[Freebuff 路由：Limited → mimo/mimo-v2.5；推理：max]' : '[Freebuff 路由：Limited → mimo/mimo-v2.5；推理：native]'
    toolResult(message.id, `${header}\n\ndone ARGS=${JSON.stringify(args)}${mode === 'long-output' ? 'x'.repeat(4000) : ''}`)
  }
})
