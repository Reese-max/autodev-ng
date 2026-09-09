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
  let userOutcomes = null
  if (values['repair-config']) {
    const repair = loadGithubConfig(resolve(values['repair-config']))
    if (!repair.repair || resolve(repair.sourceConfig) !== file) throw new Error('Repair config belongs to another source project')
    const issues = states(repair)
    userOutcomes = { humanAccepted: issues.filter(s => s.acceptance?.commit === s.commit && !!s.commit).length,
      interpretation: 'Only explicit operator acceptance is counted; learning outcomes are automated verification.' }
    for (const state of issues) {
      const dir = issueDir(repair, state.issue.number)
      files.push(join(dir, 'events.jsonl'))
      for (let round = 1; round <= (state.revision?.round ?? 0); round++) files.push(join(dir, 'revisions', String(round), 'events.jsonl'))
    }
  }
  const sources = []
  const events = files.map(path => {
    try { const text = readFileSync(path, 'utf8'); sources.push({ path, present: true }); return text }
    catch (error) { if (error.code !== 'ENOENT') throw error; sources.push({ path, present: false }); return '' }
  }).join('\n')
  const result = summarizeLearning(events)
  console.log(JSON.stringify({ ...result, sources, userOutcomes }, null, 2))
  process.exitCode = result.malformed || result.conflicts ? 1 : result.observed ? 0 : 2
} catch (error) { console.error(error.message); process.exitCode = 1 }
