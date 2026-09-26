import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { loadMonitorConfig } from '../bot/monitor.js'
import { ControlStore, formatControlLine, type ControlDisposition, type ControlState } from '../engines/steering.js'

/** Issue #11：CLI 控制面。steer/enqueue 寫 control_envelopes（run.db）；
 * controls 列出 pending/delivered/stale。只需 monitor 級設定（無 provider 憑證）。 */
export async function steeringCli(command: string, args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      config: { type: 'string' }, execution: { type: 'string' }, task: { type: 'string' },
      engine: { type: 'string' }, text: { type: 'string' }, json: { type: 'boolean' },
    },
  })
  if (!values.config || (command !== 'controls' && (!values.execution || !values.text)))
    throw new Error('用法：adng steer|enqueue --config <path> --execution <id> [--task <id>] [--engine <tag>] --text <指示>；adng controls --config <path> [--json]')
  const cfg = loadMonitorConfig(values.config)
  const store = new ControlStore(join(cfg.dataDir, 'run.db'))
  try {
    if (command === 'controls') {
      store.sweepExpired()
      store.sweepDeadTargets(cfg.dataDir)
      const list = store.list(cfg.projectPath, 50)
      if (values.json) { console.log(JSON.stringify(list, null, 2)); return }
      if (!list.length) { console.log('尚無控制訊息紀錄'); return }
      console.log(['adng 控制訊息（新→舊）', ...list.map(formatControlLine)].join('\n'))
      return
    }
    const r = store.request({
      dataDir: cfg.dataDir, project: cfg.projectPath,
      executionId: values.execution!, taskId: values.task, expectedEngineTag: values.engine,
      mode: command === 'steer' ? 'steer' : 'queue', text: values.text!, issuer: 'cli', channel: 'cli',
    })
    if (values.json) console.log(JSON.stringify({ ok: r.ok, envelope: r.envelope }, null, 2))
    else console.log(r.reply)
    if (!r.ok) process.exitCode = 1
  } finally {
    store.close()
  }
}

export type { ControlDisposition, ControlState }
