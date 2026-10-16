import { createInterface } from 'node:readline'

const mode = process.env.ADNG_STEERING_CASE ?? 'ok'
const threadId = 'native-thread-11', turnId = 'native-turn-11'
const send = value => process.stdout.write(JSON.stringify(value) + '\n')
const notify = (method, params) => send({ method, params: { threadId, turnId, ...params } })
let toolActive = false
const complete = text => {
  notify('item/completed', { item: { type: 'agentMessage', id: 'message-11', text } })
  notify('thread/tokenUsage/updated', { tokenUsage: { total: { inputTokens: 12, cachedInputTokens: 3, outputTokens: 4 } } })
  notify('turn/completed', { turn: { id: turnId, status: ['failed', 'interrupted'].includes(mode) ? mode : 'completed' } })
}
createInterface({ input: process.stdin }).on('line', line => {
  const request = JSON.parse(line)
  const reply = result => send({ id: request.id, result })
  switch (request.method) {
    case 'initialize': reply({ capabilities: {} }); break
    case 'thread/start':
      if (request.params.environments !== undefined) {
        send({ id: request.id, error: { code: -32600, message: 'Environment access must use the default local environment' } })
        break
      }
      reply({ thread: { id: threadId, cwd: process.cwd(), ephemeral: true }, cwd: mode === 'wrong-cwd' ? '/different' : process.cwd(), model: 'fixture-model',
        approvalPolicy: 'never', activePermissionProfile: { id: 'workspace-only' },
        sandbox: { type: mode === 'unsafe-policy' ? 'dangerFullAccess' : 'workspaceWrite', networkAccess: mode === 'unsafe-network',
          writableRoots: mode === 'unsafe-roots' ? ['/outside-workspace'] : [] } })
      break
    case 'turn/start':
      reply({ turn: { id: turnId, status: 'inProgress' } })
      notify('turn/started', { turn: { id: turnId, status: 'inProgress' } })
      notify('turn/completed', { threadId: 'unrelated-thread', turn: { id: turnId, status: 'completed' } })
      toolActive = true
      notify('item/started', { item: { type: 'commandExecution', id: 'critical-tool' } })
      setTimeout(() => {
        toolActive = false
        notify('item/completed', { item: { type: 'commandExecution', id: 'critical-tool', exitCode: 0 } })
      }, 150)
      if (['no-control', 'failed', 'interrupted'].includes(mode)) setTimeout(() => complete('original task'), 250)
      break
    case 'turn/steer':
      if (request.params.threadId !== threadId || request.params.expectedTurnId !== turnId || toolActive) {
        send({ id: request.id, error: { code: -32600, message: 'unsafe or wrong target' } })
        complete('incorrect transport')
      } else if (mode === 'disconnect') process.exit(1)
      else if (mode === 'cancel') notify('item/completed', { item: { type: 'agentMessage', id: 'awaiting-native-ack', text: 'awaiting-native-ack' } })
      else if (mode === 'reject') {
        send({ id: request.id, error: { code: -32600, message: 'turn ended' } })
        complete('original task')
      } else {
        reply({ turnId: mode === 'wrong-ack' ? 'different-turn' : turnId })
        complete(`steered: ${request.params.input[0].text}`)
      }
      break
  }
}).on('close', () => process.exit(0))
