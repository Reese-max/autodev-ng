import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { devinApiCli, devinApiStatus } from '../src/cli/devin-api.js'
import { runCli } from '../src/cli/entry.js'

const dirs: string[] = []
const key = 'cog_synthetic_key'
function config(overrides = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'adng-devin-api-'))
  dirs.push(dir)
  writeFileSync(join(dir, 'key'), key)
  const file = join(dir, 'api.json')
  writeFileSync(file, JSON.stringify({ apiKey: '{file:key}', orgId: 'org-test', ...overrides }))
  return file
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })

describe('Devin API read-only connection', () => {
  it('uses a file reference and fixed GET endpoint through the real CLI dispatcher; filters output', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ principal_type: 'service_user', org_id: 'org-test', service_user_name: 'private', token: key })))
    vi.stubGlobal('fetch', fetcher)
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    await runCli(['devin-api', 'status', '--config', config()], 'unused')
    expect(fetcher).toHaveBeenCalledExactlyOnceWith('https://api.devin.ai/v3/self', expect.objectContaining({ method: 'GET', headers: { Authorization: `Bearer ${key}` }, redirect: 'error', signal: expect.any(AbortSignal) }))
    expect(JSON.parse(log.mock.calls[0]![0])).toEqual({ connected: true, httpStatus: 200, principalType: 'service_user', orgId: 'org-test', cloudExecutionEnabled: false })
    expect(log.mock.calls.flat().join('')).not.toContain(key)
    expect(log.mock.calls.flat().join('')).not.toContain('private')
  })

  it('rejects plaintext secrets, missing references and unsupported commands before any request', async () => {
    const fetcher = vi.fn()
    vi.stubGlobal('fetch', fetcher)
    await expect(devinApiStatus(config({ apiKey: key }))).rejects.toThrow('secret reference')
    await expect(devinApiStatus(config({ apiKey: '{file:missing}' }))).rejects.toThrow('missing or unreadable')
    vi.stubEnv('DEVIN_API_TEST_KEY', '')
    await expect(devinApiStatus(config({ apiKey: '{env:DEVIN_API_TEST_KEY}' }))).rejects.toThrow('missing or empty')
    vi.stubEnv('DEVIN_API_TEST_KEY', 'invalid-header\nvalue')
    await expect(devinApiStatus(config({ apiKey: '{env:DEVIN_API_TEST_KEY}' }))).rejects.toThrow('cog_ credential')
    await expect(devinApiCli(['create'])).rejects.toThrow('Usage:')
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('supports environment references and fails closed on HTTP, transport, schema and organization errors', async () => {
    vi.stubEnv('DEVIN_API_TEST_KEY', key)
    const file = config({ apiKey: '{env:DEVIN_API_TEST_KEY}' })
    const fetcher = vi.fn()
    vi.stubGlobal('fetch', fetcher)
    fetcher.mockResolvedValueOnce(new Response(key, { status: 401 }))
    await expect(devinApiStatus(file)).rejects.toThrow('HTTP 401')
    fetcher.mockRejectedValueOnce(new Error(key))
    await expect(devinApiStatus(file)).rejects.toThrow(/^Devin API connection failed or timed out$/)
    fetcher.mockResolvedValueOnce(new Response(key))
    await expect(devinApiStatus(file)).rejects.toThrow('invalid identity')
    fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ principal_type: 'service_user', org_id: 'org-other' })))
    await expect(devinApiStatus(file)).rejects.toThrow('does not match')
    fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ principal_type: 'service_user', org_id: 'org-test' })))
    expect(await devinApiStatus(file)).toMatchObject({ connected: true, cloudExecutionEnabled: false })
    expect(fetcher).toHaveBeenCalledTimes(5)
  })
})
