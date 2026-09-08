import { execFileSync } from 'node:child_process'
import { afterEach, describe, expect, test } from 'vitest'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gateAuthoredGoal } from '../src/autopilot/goal-quality-gate.js'

const dirs: string[] = []
afterEach(() => { while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true }) })

function repo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'adng-goal-gate-'))
  dirs.push(dir)
  execFileSync('git', ['init', '-b', 'main'], { cwd: dir, stdio: 'ignore', windowsHide: true })
  execFileSync('git', ['config', 'user.email', 'adng-test@example.com'], { cwd: dir, stdio: 'ignore', windowsHide: true })
  execFileSync('git', ['config', 'user.name', 'adng-test'], { cwd: dir, stdio: 'ignore', windowsHide: true })
  writeFileSync(join(dir, 'README.md'), 'fixture\n')
  execFileSync('git', ['add', '.'], { cwd: dir, stdio: 'ignore', windowsHide: true })
  execFileSync('git', ['commit', '-m', 'chore: init'], { cwd: dir, stdio: 'ignore', windowsHide: true })
  return dir
}

function goal(command: string, fence = 'sh'): string {
  return `# GOAL\n\n驗證候選\n\n## 驗收\n\n\`\`\`${fence}\n${command}\n\`\`\`\n`
}

function gate(md: string, projectPath = repo()) {
  return gateAuthoredGoal(md, { projectPath, verifyTimeoutMs: 5_000 })
}

describe('auto-goal 寫檔前品質閘', () => {
  test('parseGoal 沒有 verifyCommand → 具體拒絕', async () => {
    await expect(gate('# GOAL\n\n驗證候選\n')).resolves.toEqual({ ok: false, reason: 'verify-command-missing' })
  })

  test('驗收不是 sh 圍欄 → 具體拒絕', async () => {
    await expect(gate(goal('node -e "process.exit(1)"', 'bash'))).resolves.toEqual({ ok: false, reason: 'verify-sh-fence-missing' })
  })

  test('驗收指令仍含反引號 → 執行前具體拒絕', async () => {
    await expect(gate(goal('`node -e "process.exit(1)"`'))).resolves.toEqual({ ok: false, reason: 'verify-command-contains-backtick' })
  })

  test('隔離 worktree 中 exit non-0 的紅燈驗收才通過，主工作區未被候選指令寫入', async () => {
    const projectPath = repo()
    const marker = join(projectPath, 'must-stay-absent.txt')
    const result = await gate(goal('node -e "require(\'node:fs\').writeFileSync(\'must-stay-absent.txt\', \'x\'); process.exit(1)"'), projectPath)
    expect(result).toEqual({ ok: true, verifyCommand: 'node -e "require(\'node:fs\').writeFileSync(\'must-stay-absent.txt\', \'x\'); process.exit(1)"' })
    expect(existsSync(marker)).toBe(false)
  })

  test('exit 0 的已綠驗收 → 具體拒絕', async () => {
    await expect(gate(goal('node -e "process.exit(0)"'))).resolves.toMatchObject({ ok: false, reason: expect.stringMatching(/^verify-green: /) })
  })

  test('無法執行的驗收 → 拒絕派工', async () => {
    await expect(gate(goal('adng-command-does-not-exist'))).resolves.toMatchObject({ ok: false, reason: expect.stringMatching(/^verify-unverifiable: /) })
  })
})
