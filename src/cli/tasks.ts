import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { BacklogStore, taskId } from '../backlog.js'
import { ConfigSchema } from '../types.js'
import { expandConfigPaths } from './assemble.js'

export async function taskCli(argv: string[]): Promise<void> {
  const [mode, ...args] = argv
  const { values } = parseArgs({ args, options: { config: { type: 'string' }, text: { type: 'string' } } })
  if (!values.config || !['add', 'list'].includes(mode ?? '')) throw new Error('Usage: adng task <add|list> --config <path> [--text "task and acceptance"]')
  const file = resolve(values.config), cfg = expandConfigPaths(dirname(file), ConfigSchema.parse(JSON.parse(readFileSync(file, 'utf8'))))
  const store = new BacklogStore(cfg.backlogFile)
  if (mode === 'add') {
    const text = values.text?.trim()
    if (!text || text.length > 20_000 || /[\r\n]|<!--|\[engine:/i.test(text)) throw new Error('Task must be one line without control markers (1–20000 characters)')
    mkdirSync(dirname(cfg.backlogFile), { recursive: true })
    if (!existsSync(cfg.backlogFile)) writeFileSync(cfg.backlogFile, '', { flag: 'wx' })
    store.append(text, { goalId: 'cli-user-request', round: 1, unique: true, source: 'user' })
    console.log(JSON.stringify({ id: taskId(text), task: store.read().find(t => t.id === taskId(text)), backlog: cfg.backlogFile }))
  } else console.log(JSON.stringify({ tasks: existsSync(cfg.backlogFile) ? store.read() : [],
    evidence: join(cfg.dataDir, 'evidence'), attempts: join(cfg.dataDir, 'run.db') }, null, 2))
}
