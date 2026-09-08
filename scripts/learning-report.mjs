import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { summarizeLearning } from '../dist/learn/outcomes.js'

try {
  const { values } = parseArgs({ options: { config: { type: 'string' } } })
  if (!values.config) throw new Error('Usage: node scripts/learning-report.mjs --config <project.json>')
  const file = resolve(values.config), cfg = JSON.parse(readFileSync(file, 'utf8'))
  if (typeof cfg.dataDir !== 'string' || !cfg.dataDir.trim()) throw new Error('Missing dataDir')
  let events = ''
  try { events = readFileSync(join(resolve(dirname(file), cfg.dataDir), 'events.jsonl'), 'utf8') }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  const result = summarizeLearning(events)
  console.log(JSON.stringify(result, null, 2))
  process.exitCode = result.malformed || result.conflicts ? 1 : result.observed ? 0 : 2
} catch (error) { console.error(error.message); process.exitCode = 1 }
