import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { trustedFixtureDigest, type GithubConfig } from './config.js'
import { fingerprint, runDir, type IssueState } from './state.js'
import type { VerificationEvidence } from '../engines/evidence-chain.js'
import { ApprovedFixtureSchema, fixtureHash as sha256, type ApprovedFixture } from './fixture-profile.js'

/** Copy the trusted config before dispatch. Issue text never selects this profile. */
export function fixtureApproval(cfg: GithubConfig, state: IssueState): ApprovedFixture | undefined {
  if (!cfg.fixtureMaintenance || cfg.fixtureMaintenance.issue !== state.issue.number) return undefined
  trustedFixtureDigest(cfg)
  if (cfg.repair || cfg.regression || cfg.template) throw new Error('Fixture approval cannot be combined with repair, custom regression, or template mode')
  const profile = ApprovedFixtureSchema.parse(cfg.fixtureMaintenance)
  if (profile.repo.toLowerCase() !== cfg.repo.toLowerCase() || state.repo !== cfg.repo
    || profile.fingerprint !== state.fingerprint || profile.fingerprint !== fingerprint(state.issue)
    || state.revision) throw new Error('Fixture approval does not match the exact Issue snapshot; operator handoff required')
  return profile
}

function git(cwd: string, args: string[]): string {
  return execFileSync('git', ['-c', `safe.directory=${cwd.replace(/\\/g, '/')}`, ...args], {
    cwd, encoding: 'utf8', windowsHide: true, timeout: 120_000, maxBuffer: 8_000_000, stdio: ['ignore', 'pipe', 'pipe'],
  })
}
const occurrences = (source: string, text: string) => source.split(text).length - 1
// Explicit counterexamples only; this is not a semantic test-weakening detector.
const bypasses = (source: string) => [...source.matchAll(/\b(?:test|it|describe)\s*\.\s*(?:skip(?:If)?|todo|only|runIf)\b|\b(?:skip|todo|only)\s*:\s*true\b|continue-on-error\s*:\s*true\b/g)].map(match => match[0].replace(/\s/g, ''))

export function assertFixtureCandidate(cfg: GithubConfig, state: IssueState, cwd: string, commit: string,
  profile = fixtureApproval(cfg, state)): void {
  if (!profile) throw new Error('No external fixture approval; existing-test maintenance is unsupported')
  trustedFixtureDigest(cfg)
  if (JSON.stringify(profile) !== JSON.stringify(fixtureApproval(cfg, state))) throw new Error('Fixture profile is not the external operator approval')
  if (state.baseSha !== profile.baseCommit || git(cwd, ['rev-parse', 'HEAD']).trim() !== commit
    || commit === profile.baseCommit) throw new Error('Fixture candidate/base does not match approval')
  git(cwd, ['merge-base', '--is-ancestor', profile.baseCommit, commit])
  const paths = git(cwd, ['diff', '--name-only', '-z', profile.baseCommit, commit]).split('\0').filter(Boolean)
  if (paths.length !== 1 || paths[0] !== profile.file || git(cwd, ['status', '--porcelain=v1', '-uall']).trim())
    throw new Error('Fixture approval forbids other tracked/untracked paths or dirty candidate files')
  for (const ref of [profile.baseCommit, commit]) {
    if (!git(cwd, ['ls-tree', ref, '--', profile.file]).startsWith('100644 blob '))
      throw new Error('Fixture must remain an existing regular test file')
  }
  const base = git(cwd, ['show', `${profile.baseCommit}:${profile.file}`])
  const candidate = git(cwd, ['show', `${commit}:${profile.file}`])
  const entry = join(cwd, profile.file)
  if (!lstatSync(entry).isFile() || sha256(candidate) !== profile.approvedSha256
    || sha256(readFileSync(entry)) !== profile.approvedSha256 || candidate !== profile.approvedContent)
    throw new Error('Fixture bytes are not the externally approved replacement')
  for (const assertion of profile.protectedAssertions) {
    const count = occurrences(base, assertion)
    if (!count || occurrences(candidate, assertion) !== count) throw new Error('Protected fixture assertion changed')
  }
  const original = bypasses(base)
  for (const bypass of new Set(bypasses(candidate))) {
    if (bypasses(candidate).filter(token => token === bypass).length > original.filter(token => token === bypass).length)
      throw new Error('New fixture skip/todo/bypass is forbidden')
  }
}

const receiptFile = (cfg: GithubConfig, state: IssueState, commit: string) => join(runDir(cfg, state), `fixture-maintenance-${commit}.json`)
export function recordFixtureVerification(cfg: GithubConfig, state: IssueState, cwd: string, commit: string,
  profile: ApprovedFixture, evidence: VerificationEvidence | undefined): void {
  assertFixtureCandidate(cfg, state, cwd, commit, profile)
  if (evidence?.candidateCommit !== commit || evidence.ci.status !== 'pass' || evidence.ci.executed !== true
    || evidence.ci.exitCode !== 0 || evidence.ci.command !== profile.fullVerifyCommand || evidence.reviewer.status !== 'pass')
    throw new Error('Fixture requires original full CI and independent reviewer evidence for this commit')
  writeFileSync(receiptFile(cfg, state, commit), JSON.stringify({ version: 1, commit, approvalHash: trustedFixtureDigest(cfg), profileHash: sha256(JSON.stringify(profile)), evidence }, null, 2))
}
export function assertFixtureVerification(cfg: GithubConfig, state: IssueState, cwd: string): void {
  const profile = fixtureApproval(cfg, state)
  if (!profile || !state.commit) throw new Error('Fixture approval/candidate missing')
  assertFixtureCandidate(cfg, state, cwd, state.commit, profile)
  const receipt = JSON.parse(readFileSync(receiptFile(cfg, state, state.commit), 'utf8'))
  if (receipt.version !== 1 || receipt.commit !== state.commit || receipt.approvalHash !== trustedFixtureDigest(cfg) || receipt.profileHash !== sha256(JSON.stringify(profile))
    || receipt.evidence?.candidateCommit !== state.commit || receipt.evidence.ci?.status !== 'pass'
    || receipt.evidence.ci.executed !== true || receipt.evidence.ci.exitCode !== 0
    || receipt.evidence.ci.command !== profile.fullVerifyCommand || receipt.evidence.reviewer?.status !== 'pass')
    throw new Error('Missing exact approved-fixture verification evidence')
}
