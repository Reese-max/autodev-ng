import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { summarizeLearning } from '../dist/learn/outcomes.js'
import { loadGithubConfig } from '../dist/github/config.js'
import { issueDir, states } from '../dist/github/state.js'

try {
  const { values } = parseArgs({ options: { config: { type: 'string' }, 'repair-config': { type: 'string' } } })
  if (!values.config) throw new Error('Usage: node scripts/learning-report.mjs --config <project.json>')
  const file = resolve(values.config), cfg = JSON.parse(readFileSync(file, 'utf8'))
  if (typeof cfg.dataDir !== 'string' || !cfg.dataDir.trim()) throw new Error('Missing dataDir')
  const files = [join(resolve(dirname(file), cfg.dataDir), 'events.jsonl')]
  if (values['repair-config']) {
    const repair = loadGithubConfig(resolve(values['repair-config']))
    if (!repair.repair || resolve(repair.sourceConfig) !== file) throw new Error('Repair config belongs to another source project')
    for (const state of states(repair)) {
      const dir = issueDir(repair, state.issue.number)
      files.push(join(dir, 'events.jsonl'))
      for (let round = 1; round <= (state.revision?.round ?? 0); round++) files.push(join(dir, 'revisions', String(round), 'events.jsonl'))
    }
  }
  const events = files.map(path => {
    try { return readFileSync(path, 'utf8') } catch (error) { if (error.code !== 'ENOENT') throw error; return '' }
  }).join('\n')
  const result = summarizeLearning(events)
  console.log(JSON.stringify(result, null, 2))
  process.exitCode = result.malformed || result.conflicts ? 1 : result.observed ? 0 : 2
} catch (error) { console.error(error.message); process.exitCode = 1 }
