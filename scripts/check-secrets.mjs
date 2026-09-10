#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SECRET_PATTERNS = [
  /sk-proxypilot-[a-zA-Z0-9]+/i,
  /sk-[a-zA-Z0-9]{20,}/,
  /cog_[a-zA-Z0-9_-]{20,}/,
  /bot[0-9]{8,10}:[a-zA-Z0-9_-]{35}/,
]

const EXCLUDED_DIRS = new Set(['node_modules', '.git', 'dist', 'coverage'])

function scanDir(dir, errors = []) {
  const entries = readdirSync(dir)
  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry)) continue
    const fullPath = join(dir, entry)
    const st = statSync(fullPath)
    if (st.isDirectory()) {
      scanDir(fullPath, errors)
    } else if (entry.endsWith('.json') || entry.endsWith('.ts') || entry.endsWith('.mjs')) {
      // Ignore test files that intentionally test secret redaction strings
      if (entry.includes('test') || fullPath.includes('tests/')) continue
      const content = readFileSync(fullPath, 'utf8')
      for (const pattern of SECRET_PATTERNS) {
        if (pattern.test(content)) {
          errors.push(`[SECRETS DETECTED] File: ${fullPath} matches pattern ${pattern}`)
        }
      }
    }
  }
  return errors
}

const errors = scanDir(process.cwd())
if (errors.length > 0) {
  console.error('Secret scan failed:')
  for (const err of errors) {
    console.error(err)
  }
  process.exit(1)
} else {
  console.log('✔ Secret scan passed: no raw credentials detected.')
}
