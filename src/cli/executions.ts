import { parseArgs } from 'node:util'
import { loadMonitorConfig } from '../bot/monitor.js'
import { capabilityReport } from '../engines/capabilities.js'
import { readExecutions, requestExecutionCancel } from '../engines/execution-observation.js'

export function executionCli(args: string[]): void {
  const { values, positionals } = parseArgs({ args, allowPositionals: true, options: { config: { type: 'string' }, id: { type: 'string' } } })
  const action = positionals[0] ?? 'list'
  if (!values.config || positionals.length > 1 || !['list', 'capabilities', 'cancel'].includes(action) || (action === 'cancel') !== !!values.id)
    throw new Error('用法：adng execution list|capabilities --config <path>；adng execution cancel --config <path> --id <executionId>')
  const cfg = loadMonitorConfig(values.config)
  if (action === 'capabilities') { console.log(JSON.stringify(capabilityReport(cfg), null, 2)); return }
  if (action === 'cancel') {
    requestExecutionCancel(cfg.dataDir, values.id!)
    console.log(JSON.stringify({ executionId: values.id, cancellationRequested: true, backendStopConfirmed: false }))
    return
  }
  const inventory = readExecutions(cfg.dataDir)
  console.log(JSON.stringify(inventory, null, 2))
  if (inventory.errors.length) process.exitCode = 2
}
