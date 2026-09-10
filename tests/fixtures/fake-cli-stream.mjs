import { existsSync } from 'node:fs'
const [provider, release] = process.argv.slice(2)
const emit = value => process.stdout.write(JSON.stringify(value) + '\n')
process.stdin.resume()
process.stdin.on('end', () => {
  if (provider === 'grok') {
    emit({ type: 'tool_call', toolCallId: 'tool-one', status: 'in_progress' })
    emit({ type: 'tool_call_update', toolCallId: 'tool-one', status: 'completed', rawOutput: 'private-tool-content' })
  } else {
    emit({ type: 'assistant', message: { content: [{ type: 'tool_use', id: 'tool-one', name: 'read_file' }] } })
    emit({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'tool-one', content: 'private-tool-content' }] } })
  }
  const timer = setInterval(() => {
    if (!existsSync(release)) return
    clearInterval(timer)
    if (provider === 'grok') { emit({ type: 'text', data: 'done' }); emit({ type: 'end', stopReason: 'end_turn' }) }
    else { emit({ type: 'result', subtype: 'success', result: 'done', is_error: false, total_cost_usd: 0.01 }); emit({ type: 'system', subtype: 'trailing-status' }) }
    process.exitCode = 0
  }, 15)
})
