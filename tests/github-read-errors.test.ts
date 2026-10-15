import { expect, test, vi } from 'vitest'
import { execFileSync } from 'node:child_process'
import { api, GithubReadError, transientGithubRead } from '../src/github/client.js'
vi.mock('node:child_process', () => ({ execFileSync: vi.fn() }))
test('successful read parses included headers; writes keep original request semantics', () => {
  const run = vi.mocked(execFileSync)
  run.mockReturnValueOnce('HTTP/2.0 200 OK\r\ncontent-type: application/json\r\n\r\n{"number":7}')
  expect(api('repos/owner/project/issues/7')).toEqual({ number: 7 })
  expect(run.mock.lastCall?.[1]).toContain('--include')
  run.mockReturnValueOnce('{"number":8}')
  expect(api('repos/owner/project/pulls', { draft: true })).toEqual({ number: 8 })
  expect(run.mock.lastCall?.[1]).not.toContain('--include')
})
test('only structured transient reads classify; response content stays out of diagnostics', () => {
  const run = vi.mocked(execFileSync), now = Date.now()
  run.mockImplementationOnce(() => { throw { stdout: 'HTTP/2.0 429 Too Many Requests\nretry-after: 300\nx-ratelimit-remaining: 0\nx-ratelimit-reset: ' + Math.floor((now + 600_000) / 1000) + '\n\n{"message":"synthetic sensitive response"}' } })
  let error: unknown
  try { api('repos/owner/project/issues/7') } catch (caught) { error = caught }
  expect(error).toBeInstanceOf(GithubReadError)
  expect(transientGithubRead(error)).toMatchObject({ statusCode: 429, rateLimited: true })
  expect((error as GithubReadError).retryAt).toBeGreaterThanOrEqual(now + 599_000)
  expect(String(error)).not.toContain('synthetic sensitive response')
  expect(transientGithubRead(new Error('HTTP 503'))).toBeUndefined()
  expect(transientGithubRead(new GithubReadError(403))).toBeUndefined()
  expect(transientGithubRead(new GithubReadError(403, undefined, true))).toBeDefined()
})
test('POST failure is never classified for replay from a transient HTTP code', () => {
  const original = { stdout: 'HTTP/2.0 503 Service Unavailable\n\n{}' }
  vi.mocked(execFileSync).mockImplementationOnce(() => { throw original })
  let caught: unknown
  try { api('repos/owner/project/pulls', {}) } catch (error) { caught = error }
  expect(caught).toBe(original); expect(transientGithubRead(caught)).toBeUndefined()
})

test('explicit read-only GraphQL POST can classify transient failures', () => {
  vi.mocked(execFileSync).mockImplementationOnce(() => { throw { stdout: 'HTTP/2.0 503 Unavailable\n\n{}' } })
  let error: unknown
  try { api('graphql', { query: 'query{viewer{login}}' }, true) } catch (caught) { error = caught }
  expect(transientGithubRead(error)).toMatchObject({ statusCode: 503 })
})
