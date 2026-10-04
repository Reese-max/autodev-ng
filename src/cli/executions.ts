import { parseArgs } from 'node:util'
import { loadMonitorConfig } from '../bot/monitor.js'
import { capabilityReport } from '../engines/capabilities.js'
import { readExecutions, requestExecutionCancel } from '../engines/execution-observation.js'
import { isExecutionLive, listActiveExecutions } from '../engines/active-execution.js'

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
  // Issue #11：bounded 模式的 execution 不在 executions/*.json——operator 需要從
  // active registry 看到可控制的 exact target（含 hostPid 活性判定）。
  const active = listActiveExecutions(cfg.dataDir).map(r => ({ ...r, live: isExecutionLive(r) }))
  console.log(JSON.stringify({ ...inventory, active }, null, 2))
  if (inventory.errors.length) process.exitCode = 2
}
