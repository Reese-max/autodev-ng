import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test, expect } from 'vitest'

const workflowPath = resolve(__dirname, '..', '.github', 'workflows', 'ci.yml')
const workflowContent = readFileSync(workflowPath, 'utf8')

test('CI workflow uses Node 24 compatible action versions', () => {
  // Should NOT use Node 20 runtime actions (v4)
  expect(workflowContent).not.toContain('actions/checkout@v4')
  expect(workflowContent).not.toContain('actions/setup-node@v4')

  // Should use Node 24 compatible action versions (v5+)
  expect(workflowContent).toContain('actions/checkout@v5')
  expect(workflowContent).toContain('actions/setup-node@v5')
})

test('CI workflow still installs Node 22 for product tests', () => {
  expect(workflowContent).toContain("node-version: '22'")
})