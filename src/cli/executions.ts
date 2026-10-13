import { parseArgs } from 'node:util'
import { basename } from 'node:path'
import { loadMonitorConfig } from '../bot/monitor.js'
import { capabilityReport } from '../engines/capabilities.js'
import { readExecution, readExecutions, requestExecutionCancel } from '../engines/execution-observation.js'
import { inspectHerdrCompletion } from '../engines/herdr-inspection.js'
import { ControlStore, formatControls } from '../engines/steering.js'

const USAGE = '用法：adng execution list|capabilities|controls --config <path>；adng execution get|cancel --config <path> --id <executionId>；adng execution steer|enqueue --config <path> --id <executionId> --text <指示>'

export function executionCli(args: string[]): void {
  const { values, positionals } = parseArgs({ args, allowPositionals: true, options: { config: { type: 'string' }, id: { type: 'string' }, text: { type: 'string' }, 'request-id': { type: 'string' } } })
  const action = positionals[0] ?? 'list'
  const needsId = ['get', 'cancel', 'inspect-herdr', 'steer', 'enqueue'].includes(action)
  const needsText = ['steer', 'enqueue'].includes(action)
  // Empty steering text goes through the rejection-receipt path.
  if (!values.config || positionals.length > 1 || !['list', 'get', 'capabilities', 'cancel', 'inspect-herdr', 'steer', 'enqueue', 'controls'].includes(action)
    || needsId !== !!values.id || (needsText && values.text === undefined)
    || (values['request-id'] !== undefined && action !== 'inspect-herdr'))
    throw new Error(action === 'inspect-herdr'
      ? '用法：adng execution inspect-herdr --config <path> --id <executionId> [--request-id <requestId>]'
      : USAGE)
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
  // Issue #11：控制信封只需 dataDir（loadMonitorConfig 不碰憑證），與 cancel 同級的唯讀設定路徑。
  if (action === 'steer' || action === 'enqueue') {
    const reply = new ControlStore(cfg.dataDir).submit({
      project: basename(values.config, '.json'), executionId: values.id!,
      mode: action === 'steer' ? 'STEER' : 'QUEUE',
      instruction: values.text!, issuer: 'cli', channel: 'cli',
    })
    console.log(JSON.stringify({
      ok: reply.ok, envelopeId: reply.envelope.id, disposition: reply.envelope.disposition,
      detail: reply.envelope.detail ?? null, text: reply.text,
    }))
    if (!reply.ok) process.exitCode = 1
    return
  }
  if (action === 'controls') {
    const list = new ControlStore(cfg.dataDir).list()
    console.log(formatControls(list))
    if (list.errors.length) process.exitCode = 2
    return
  }
  const inventory = readExecutions(cfg.dataDir)
  console.log(JSON.stringify(inventory, null, 2))
  if (inventory.errors.length) process.exitCode = 2
}
