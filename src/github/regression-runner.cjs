'use strict'

// The trusted host forks this runner for each regression check. Test files run
// inside this isolated process so assertion errors keep their actual class.
// Keep the host result channel private while untrusted test code is loaded.
const { AssertionError } = require('node:assert')
const { run } = require('node:test')
const parentSend = typeof process.send === 'function' ? process.send.bind(process) : undefined
const parentDisconnect = typeof process.disconnect === 'function' ? process.disconnect.bind(process) : undefined
Object.defineProperty(process, 'send', { configurable: false, enumerable: false, value: undefined, writable: false })

const protocol = 'autodev.node-test-runner'
const protocolVersion = 1
const runId = process.argv[3] || ''
const file = process.argv[2] || ''
const outputLimit = 30_000
let stdout = ''
let stderr = ''
let summaryCount = 0
let framework
let assertionFailures = 0
let runnerError

function append(target, message) {
  const current = target === 'stdout' ? stdout : stderr
  const remaining = outputLimit - current.length
  if (remaining <= 0) return
  const value = String(message)
  const next = value.length > remaining
    ? current + value.slice(0, remaining) + '\n[adng: output truncated]'
    : current + value
  if (target === 'stdout') stdout = next
  else stderr = next
}

function isAssertionFailure(error) {
  const cause = error && error.cause
  return error?.code === 'ERR_TEST_FAILURE'
    && error?.failureType === 'testCodeFailure'
    && cause instanceof AssertionError
    && cause?.name === 'AssertionError'
    && cause?.code === 'ERR_ASSERTION'
    // Node serializes test-process errors across its worker boundary. Require
    // the assertion metadata too, so a generic Error with only a forged name
    // and code cannot satisfy the base-red contract.
    && typeof cause?.operator === 'string'
    && Object.prototype.hasOwnProperty.call(cause, 'actual')
    && Object.prototype.hasOwnProperty.call(cause, 'expected')
}

function send(result) {
  const message = {
    protocol,
    protocolVersion,
    runId,
    nodeVersion: process.version,
    stdout,
    stderr,
    ...(framework ? { framework: { ...framework, assertionFailures } } : {}),
    ...(runnerError ? { runnerError } : {}),
  }
  if (typeof parentSend !== 'function') {
    process.exitCode = 70
    return
  }
  parentSend(message, error => {
    if (error) process.exitCode = 70
    else process.exitCode = result
    parentDisconnect?.()
  })
}

if (!runId || !process.argv[2]) {
  runnerError = 'Missing run id or test file'
  send(70)
} else {
  try {
    const stream = run({
      files: [file],
      concurrency: 1,
      isolation: 'none',
      execArgv: [],
      // `setup` attaches listeners before any test file can finish. Attaching
      // after run() returns can miss fast per-file summaries in host runners.
      setup(testStream) {
        testStream.on('test:stdout', event => {
          append('stdout', event.message)
        })
        testStream.on('test:stderr', event => {
          append('stderr', event.message)
        })
        testStream.on('test:fail', event => {
          const error = event.details?.error
          if (isAssertionFailure(error)) assertionFailures++
        })
        testStream.on('test:summary', event => {
          // Exactly one test file was supplied. Ignore the final aggregate
          // event (its file is undefined), using the only per-file summary.
          if (!event.file) return
          summaryCount++
          const counts = event.counts
          const fields = ['tests', 'passed', 'cancelled', 'skipped', 'todo']
          if (summaryCount !== 1 || !counts || fields.some(key => !Number.isSafeInteger(counts[key]) || counts[key] < 0)) {
            framework = undefined
            runnerError = 'Invalid or duplicate per-file test summary'
            return
          }
          const failed = Number.isSafeInteger(counts.failed)
            ? counts.failed
            : counts.tests - counts.passed - counts.cancelled - counts.skipped - counts.todo
          if (failed < 0) {
            framework = undefined
            runnerError = 'Inconsistent per-file test counts'
            return
          }
          framework = {
            success: event.success,
            tests: counts.tests,
            passed: counts.passed,
            failed,
            cancelled: counts.cancelled,
            skipped: counts.skipped,
            todo: counts.todo,
          }
        })
        testStream.on('error', error => { runnerError = String(error) })
        testStream.on('end', () => {
          if (summaryCount !== 1 || !framework) runnerError = 'Missing per-file test summary'
          send(framework?.success ? 0 : framework ? 1 : 70)
        })
      },
    })
    stream.resume()
  } catch (error) {
    runnerError = String(error)
    send(70)
  }
}
