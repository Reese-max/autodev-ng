import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { GithubConfigSchema } from '../src/github/config.js'
import { runtimeConfig } from '../src/github/job.js'
import type { IssueState } from '../src/github/state.js'

function git(cwd: string, args: string[]): void {
  execFileSync('git', args, { cwd, stdio: 'ignore', windowsHide: true })
}

function fixture(herdrOptIn?: boolean) {
  const root = mkdtempSync(join(tmpdir(), 'adng-github-herdr-'))
  const project = join(root, 'project')
  mkdirSync(project)
  git(project, ['init', '-q'])
  git(project, ['remote', 'add', 'origin', 'https://github.com/owner/project.git'])
  const sourceConfig = join(root, 'source.json')
  writeFileSync(sourceConfig, JSON.stringify({
    projectPath: project,
    dataDir: join(root, 'source-data'),
    backlogFile: join(root, 'source-data', 'BACKLOG.md'),
    verifyCommand: 'node -e "process.exit(0)"',
    auditModel: 'fixture-reviewer',
    defaultEngine: 'herdr',
    engineRotation: ['herdr'],
    engines: {
      herdr: { adapter: 'herdr', command: join(root, 'Start-Herdr-Autopilot.ps1'), provider: 'Codex', timeoutMs: 60_000, costPerRunUsd: 0 },
    },
  }))
  const cfg = GithubConfigSchema.parse({
    repo: 'owner/project', authors: ['owner'], sourceConfig, dataDir: join(root, 'github-data'), engine: 'herdr',
    ...(herdrOptIn === undefined ? {} : { herdrOptIn }),
  })
  const state: IssueState = {
    repo: cfg.repo, base: cfg.base, status: 'queued', runs: 0, nextRunAt: 0, fingerprint: 'a'.repeat(64),
    issue: { number: 7, title: 'Fix addition', body: 'Make addition work', state: 'open', user: { login: 'owner' }, labels: [{ name: 'autodev' }] },
  }
  return { root, cfg, state }
}

test('GitHub Herdr intake is opt-in and defaults to disabled', () => {
  const f = fixture()
  try {
    expect(f.cfg.herdrOptIn).toBe(false)
    expect(() => runtimeConfig(f.cfg, f.state)).toThrow('explicit Herdr opt-in')
  } finally {
    rmSync(f.root, { recursive: true, force: true })
  }
})

test('explicit Herdr opt-in keeps the bounded Codex route in the Issue runtime', () => {
  const f = fixture(true)
  try {
    const runtime = runtimeConfig(f.cfg, f.state)
    expect(runtime.defaultEngine).toBe('herdr')
    expect(runtime.engines.herdr).toMatchObject({ adapter: 'herdr', provider: 'Codex', timeoutMs: 60_000 })
  } finally {
    rmSync(f.root, { recursive: true, force: true })
  }
})
