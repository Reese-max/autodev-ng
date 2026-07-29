import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { AUTO_GOAL_MARKER } from '../src/autopilot/author.js'
import { parseGoal } from '../src/autopilot/goal.js'
import { gateAuthoredGoal } from '../src/autopilot/goal-quality-gate.js'
import { problemFingerprint } from '../src/autopilot/ledger.js'
import { runPerpetualCycle, type PerpetualHooks } from '../src/autopilot/perpetual.js'
import { EventLog } from '../src/events.js'
import { fleetStatusFromLockPid } from '../src/engines/fleet-status.js'
import { ConfigSchema } from '../src/types.js'

let workspace: string

beforeEach(() => {
  workspace = mkdtempSync(join(tmpdir(), 'adng-manual-goal-gate-'))
})

afterEach(() => {
  try { rmSync(workspace, { recursive: true, force: true, maxRetries: 3 }) } catch { /* Windows handle lag */ }
})

function initRepo(): void {
  execFileSync('git', ['init', '-b', 'main'], { cwd: workspace, stdio: 'ignore', windowsHide: true })
  execFileSync('git', ['config', 'user.email', 'adng-test@example.com'], { cwd: workspace, stdio: 'ignore', windowsHide: true })
  execFileSync('git', ['config', 'user.name', 'adng-test'], { cwd: workspace, stdio: 'ignore', windowsHide: true })
  writeFileSync(join(workspace, 'README.md'), 'fixture\n')
  execFileSync('git', ['add', '.'], { cwd: workspace, stdio: 'ignore', windowsHide: true })
  execFileSync('git', ['commit', '-m', 'chore: init'], { cwd: workspace, stdio: 'ignore', windowsHide: true })
}

function goal(command: string, fence = 'sh'): string {
  return `# GOAL\n\n修復紅位驗收\n\n## 驗收\n\n\`\`\`${fence}\n${command}\n\`\`\`\n`
}

describe('手動 goal authoring gate 驗收', () => {
  test('合格可解析且含 sh 圍欄的紅位驗收通過', async () => {
    initRepo()
    const command = `"${process.execPath}" -e "process.exit(1)"`
    const md = goal(command)

    expect(parseGoal(md)).toMatchObject({ objective: '修復紅位驗收', verifyCommand: command })
    await expect(gateAuthoredGoal(md, { projectPath: workspace, verifyTimeoutMs: 5_000 }))
      .resolves.toEqual({ ok: true, verifyCommand: command })
  })

  test('缺 sh 圍欄打回', async () => {
    const md = goal(`"${process.execPath}" -e "process.exit(1)"`, 'bash')

    await expect(gateAuthoredGoal(md, { projectPath: workspace, verifyTimeoutMs: 5_000 }))
      .resolves.toEqual({ ok: false, reason: 'verify-sh-fence-missing' })
  })

  test('已綠驗收打回', async () => {
    initRepo()
    const md = goal(`"${process.execPath}" -e "process.exit(0)"`)

    await expect(gateAuthoredGoal(md, { projectPath: workspace, verifyTimeoutMs: 5_000 }))
      .resolves.toMatchObject({ ok: false, reason: expect.stringMatching(/^verify-green: /) })
  })

  test('兩次重寫後落拒絕事件且不寫 goalFile', async () => {
    const fingerprint = problemFingerprint('驗收仍已綠')
    const goalFile = join(workspace, 'GOAL.md')
    const cfg = ConfigSchema.parse({
      projectPath: workspace,
      backlogFile: join(workspace, 'BACKLOG.md'),
      dataDir: workspace,
      goalFile,
      stopFile: join(workspace, '.adng.stop'),
      engine: 'mock',
      verifyCommand: 'npm test',
      dailyHardUsd: 100,
      perpetual: true
    })
    const reasons = ['verify-green: first', 'verify-green: second', 'verify-green: final']
    let attempt = 0
    const author = vi.fn(async () => `${AUTO_GOAL_MARKER} problem:${fingerprint} -->\n${goal('npm test')}`)
    const gate = vi.fn(async () => ({ ok: false as const, reason: reasons[attempt++]! }))
    const runSession = vi.fn(async () => 'no-goal' as const)
    const hooks: PerpetualHooks = {
      now: () => new Date('2026-07-29T00:00:00.000Z'),
      discover: async () => ({ survey: '', ranked: [{ title: '驗收仍已綠', lens: 'tests', value: 8, rationale: '紅位缺失' }] }),
      author,
      gateAuthoredGoal: gate,
      runSession,
      billedToday: () => 0
    }

    await expect(runPerpetualCycle(cfg, workspace, new EventLog(workspace), async () => true, hooks)).resolves.toBe(false)
    expect(author).toHaveBeenCalledTimes(3)
    expect(gate).toHaveBeenCalledTimes(3)
    expect(runSession).not.toHaveBeenCalled()
    expect(existsSync(goalFile)).toBe(false)
    const events = readFileSync(join(workspace, 'events.jsonl'), 'utf8').trim().split(/\r?\n/).map(line => JSON.parse(line))
    expect(events).toContainEqual(expect.objectContaining({
      type: 'goal-authoring-rejected', fingerprint, reason: reasons[2], attempts: 3
    }))
  })

  test('fleet-status 正確區分存活與死亡 lock PID', () => {
    const lockPid = 4321

    expect(existsSync(workspace)).toBe(true)
    expect(fleetStatusFromLockPid(lockPid, pid => pid === lockPid)).toBe('ALIVE')
    expect(fleetStatusFromLockPid(lockPid, pid => pid !== lockPid)).toBe('DEAD')
  })
})
