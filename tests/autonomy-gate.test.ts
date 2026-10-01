import { expect, test } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { GithubConfigSchema } from '../src/github/config.js'
import { saveState } from '../src/github/state.js'
import { ensureRuntimeBuilt } from './helpers/runtime-build.js'

// scripts/*.mjs 與 web/server.mjs 都以 dist/ 為單一事實來源；npm test 不保證先建置，
// 缺產物就地建置（只寫 gitignored 的 dist/），斷言不減。
ensureRuntimeBuilt()

test('autonomy gate refuses obsolete Issues and ambiguous completed candidates without a hardcoded Issue number', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-autonomy-gate-'))
  try {
    const cfg = GithubConfigSchema.parse({ repo: 'fixture/project', sourceConfig: join(dir, 'unused.json'), dataDir: dir, authors: ['fixture'], engine: 'writer' })
    const file = join(dir, 'config.json'); writeFileSync(file, JSON.stringify(cfg))
    const state = { repo: cfg.repo, base: cfg.base, fingerprint: 'a'.repeat(64), status: 'cancelled' as const, runs: 1, nextRunAt: 0,
      issue: { number: 4, title: 'Obsolete', body: '', state: 'open' as const, user: { login: 'fixture' }, labels: [] } }
    saveState(cfg, state)
    const run = () => spawnSync(process.execPath, [resolve('scripts/verify-autonomy.mjs'), '--config', file], { encoding: 'utf8', windowsHide: true })
    expect(run()).toMatchObject({ status: 1, stderr: expect.stringContaining('No completed real repair candidate') })
    for (const number of [6, 7]) saveState(cfg, { ...state, status: 'ready', issue: { ...state.issue, number } })
    expect(run()).toMatchObject({ status: 1, stderr: expect.stringContaining('Multiple repair candidates') })
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
