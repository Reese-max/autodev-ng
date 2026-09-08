import { readdirSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { doPause, doResume } from '../bot/actions.js'
import { formatMonitor, loadMonitorConfig, readMonitor } from '../bot/monitor.js'
import { handleCommand } from '../bot/handlers.js'
import { withAssembled } from './assemble.js'
import { llmFromConfig } from '../autopilot/llm.js'

export async function controlCli(command: string, args: string[]): Promise<void> {
  const { values } = parseArgs({ args, options: {
    config: { type: 'string' }, 'configs-dir': { type: 'string' }, json: { type: 'boolean' }, check: { type: 'boolean' },
  } })
  const monitor = command === 'monitor' || command === 'status'
  if (!!values.config === !!values['configs-dir'] || (!monitor && (values['configs-dir'] || values.check))) {
    throw new Error('用法：adng monitor (--config <path> | --configs-dir <dir>) [--json] [--check]；控制指令需指定 --config')
  }
  const files = values.config ? [resolve(values.config)] : readdirSync(resolve(values['configs-dir']!))
    .filter(f => f.endsWith('.json') && !f.endsWith('.example.json')).sort().map(f => resolve(values['configs-dir']!, f))
  if (!files.length) throw new Error('找不到專案設定')
  const results: unknown[] = []
  for (const file of files) {
    try {
      // Monitoring and pause/resume need no provider secrets, database migration or worker.
      const cfg = loadMonitorConfig(file)
      if (monitor) {
        const result = readMonitor(cfg, file)
        results.push(result)
        if (!values.json) console.log(formatMonitor(result))
        if (values.check && process.exitCode !== 1 && (result.errors.length || !['observed', 'paused'].includes(result.health))) process.exitCode = 2
      } else {
        const result = command === 'pause' ? await doPause({ cfg }) : command === 'resume' ? await doResume({ cfg, cfgPath: file })
          : await withAssembled(file, async ({ cfg, deps }) => handleCommand(command, '', {
            cfg, cfgPath: file, store: deps.store, db: deps.db, events: deps.events, llm: llmFromConfig(cfg, cfg.judgeModel, cfg.judgeUrl),
          }))
        results.push(result)
        if (!values.json) console.log(result.text)
        if (!result.ok) process.exitCode = 1
      }
    } catch {
      const error = { project: basename(file, '.json'), error: '設定或操作失敗；請檢查格式與檔案權限' }
      results.push(error)
      if (!values.json) console.error(`${error.project}：${error.error}`)
      process.exitCode = 1
    }
  }
  if (values.json) console.log(JSON.stringify(values.config ? results[0] : results, null, 2))
}
