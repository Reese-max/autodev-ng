import { afterEach, expect, test, vi } from 'vitest'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const terminalWrite = vi.hoisted(() => ({ run: undefined as (() => void) | undefined }))
vi.mock('../src/guardian/incident.js', async importOriginal => {
  const actual = await importOriginal<typeof import('../src/guardian/incident.js')>()
  return { ...actual, writeJsonAtomic(file: string, value: unknown) {
    actual.writeJsonAtomic(file, value)
    if (value && typeof value === 'object' && (value as { phase?: unknown }).phase === 'terminal') terminalWrite.run?.()
  } }
})

import { createExecutionObservation, executionFile, readExecution, readExecutions } from '../src/engines/execution-observation.js'

const roots: string[] = []
afterEach(() => { terminalWrite.run = undefined; for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })

test('terminal persist and archive stay locked against a reentrant inventory reader', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-terminal-lock-race-'))
  roots.push(root)
  const executionId = 'terminal-race'
  const observer = createExecutionObservation({ dataDir: root, adapter: 'codex', supervised: true,
    job: { executionId, projectPath: root, task: { id: 'terminal-race-task', text: 'finish safely', line: 0, status: 'open' } } })
  let interleaved: ReturnType<typeof readExecutions> | undefined
  terminalWrite.run = () => { interleaved = readExecutions(root) }
  observer.control.onEvent?.({ type: 'exit', code: 0, reason: 'exit' })

  observer.finish('completed')
  terminalWrite.run = undefined

  expect(interleaved).toMatchObject({ protected: true, errors: ['execution inventory unavailable'] })
  expect(existsSync(executionFile(root, executionId))).toBe(false)
  expect(readExecutions(root)).toMatchObject({ protected: false, records: [], errors: [], capacityExceeded: false })
  expect(readExecution(root, executionId)).toMatchObject({ phase: 'terminal', outcome: 'completed' })
})
