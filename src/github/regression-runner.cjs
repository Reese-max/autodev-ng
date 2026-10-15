'use strict'

// The trusted host forks this runner for each regression check. Test files run
// inside this isolated process so assertion errors keep their actual class.
// Keep the host result channel private while untrusted test code is loaded.
const { AssertionError } = require('node:assert')
const { run } = require('node:test')
const { resolve } = require('node:path')
const parentSend = typeof process.send === 'function' ? process.send.bind(process) : undefined
const parentDisconnect = typeof process.disconnect === 'function' ? process.disconnect.bind(process) : undefined
Object.defineProperty(process, 'send', { configurable: false, enumerable: false, value: undefined, writable: false })

const protocol = 'autodev.node-test-runner'
const protocolVersion = 1
const runId = process.argv[3] || ''
const file = process.argv[2] || ''
const testFile = file ? resolve(file) : ''
let summaryCount = 0
let framework
let assertionFailures = 0
let realTests = 0
let runnerError

function isFileLoadPoint(event) {
  // With isolation disabled, Node reports a file as one passing test when it
  // registers no node:test cases. That synthetic event has the source file as
  // its name and no source call site (line 1, column 1). Use that event shape
  // rather than the basename, which can also be a legitimate test name.
  const fileOrigin = event?.line === 1 && event?.column === 1
  const missingSourceLocation = event?.line === undefined && event?.column === undefined
  return (fileOrigin || missingSourceLocation)
    && (typeof event?.file !== 'string' || resolve(event.file) === testFile)
    && typeof event?.name === 'string' && resolve(event.name) === testFile
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
    stdout: '',
    stderr: '',
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
        testStream.on('test:pass', event => {
          if (!isFileLoadPoint(event) && event.details?.type === 'test') realTests++
        })
        testStream.on('test:fail', event => {
          if (!isFileLoadPoint(event) && event.details?.type === 'test') realTests++
          const error = event.details?.error
          if (isAssertionFailure(error)) assertionFailures++
        })
        testStream.on('test:summary', event => {
          // Exactly one test file was supplied and this runner executes it
          // in-process, so the single aggregate summary is the trusted result.
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
            realTests,
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
