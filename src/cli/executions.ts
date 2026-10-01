import { parseArgs } from 'node:util'
import { basename } from 'node:path'
import { loadMonitorConfig } from '../bot/monitor.js'
import { capabilityReport } from '../engines/capabilities.js'
import { readExecutions, requestExecutionCancel } from '../engines/execution-observation.js'
import { ControlStore, formatControls } from '../engines/steering.js'

const USAGE = '用法：adng execution list|capabilities|controls --config <path>；adng execution cancel --config <path> --id <executionId>；adng execution steer|enqueue --config <path> --id <executionId> --text <指示>'

export function executionCli(args: string[]): void {
  const { values, positionals } = parseArgs({ args, allowPositionals: true, options: { config: { type: 'string' }, id: { type: 'string' }, text: { type: 'string' } } })
  const action = positionals[0] ?? 'list'
  const needsId = ['cancel', 'steer', 'enqueue'].includes(action)
  const needsText = ['steer', 'enqueue'].includes(action)
  // --text ""（空字串）交由 submit 走 REJECTED_INVALID 收據路徑，而非當成缺參數。
  if (!values.config || positionals.length > 1 || !['list', 'capabilities', 'cancel', 'steer', 'enqueue', 'controls'].includes(action)
    || needsId !== !!values.id || (needsText && values.text === undefined))
    throw new Error(USAGE)
  const cfg = loadMonitorConfig(values.config)
  if (action === 'capabilities') { console.log(JSON.stringify(capabilityReport(cfg), null, 2)); return }
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
