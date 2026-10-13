import { parseArgs } from 'node:util'
import { loadMonitorConfig } from '../bot/monitor.js'
import { capabilityReport } from '../engines/capabilities.js'
import { readExecution, readExecutions, requestExecutionCancel } from '../engines/execution-observation.js'
import { inspectHerdrCompletion } from '../engines/herdr-inspection.js'

export function executionCli(args: string[]): void {
  const { values, positionals } = parseArgs({ args, allowPositionals: true, options: { config: { type: 'string' }, id: { type: 'string' }, 'request-id': { type: 'string' } } })
  const action = positionals[0] ?? 'list'
  const needsId = action === 'cancel' || action === 'get' || action === 'inspect-herdr'
  if (!values.config || positionals.length > 1 || !['list', 'get', 'capabilities', 'cancel', 'inspect-herdr'].includes(action) || needsId !== !!values.id
    || (values['request-id'] !== undefined && action !== 'inspect-herdr'))
    throw new Error(action === 'inspect-herdr'
      ? '用法：adng execution inspect-herdr --config <path> --id <executionId> [--request-id <requestId>]'
      : '用法：adng execution list|capabilities --config <path>；adng execution get|cancel --config <path> --id <executionId>')
  const cfg = loadMonitorConfig(values.config)
  if (action === 'inspect-herdr') {
    const observation = inspectHerdrCompletion(cfg.dataDir, { executionId: values.id!, ...(values['request-id'] === undefined ? {} : { requestId: values['request-id'] }) })
    console.log(JSON.stringify(observation, null, 2))
    // Exit0 means a correlated observation (even a failed terminal), never accepted delivery.
    process.exitCode = observation.status === 'correlated-v1-done' || observation.status === 'correlated-v1-failed' ? 0 : 2
    return
  }
  if (action === 'capabilities') { console.log(JSON.stringify(capabilityReport(cfg), null, 2)); return }
  if (action === 'get') {
    const record = readExecution(cfg.dataDir, values.id!)
    if (!record) throw new Error('Execution not found')
    console.log(JSON.stringify(record, null, 2))
    return
  }
  if (action === 'cancel') {
    requestExecutionCancel(cfg.dataDir, values.id!)
    console.log(JSON.stringify({ executionId: values.id, cancellationRequested: true, backendStopConfirmed: false }))
    return
  }
  const inventory = readExecutions(cfg.dataDir)
  console.log(JSON.stringify(inventory, null, 2))
  if (inventory.errors.length) process.exitCode = 2
}
