import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { ROOT, command, revision, writeJson } from './host.mjs'

// Exact-commit local release gate. Failure never leaves a green receipt for this candidate.
const receipt = join(ROOT, 'data/host-release-gate.json')
try {
  if (command('git', ['status', '--porcelain'], ROOT)) throw new Error('Commit candidate before release validation')
  const gate = { commit: revision(ROOT), at: new Date().toISOString(), build: null, typecheck: null, tests: null }
  writeJson(receipt, gate)
  for (const [name, args] of [['build', ['run', 'build']], ['typecheck', ['run', 'typecheck']], ['tests', ['test']]]) {
    const result = process.platform === 'win32'
      ? spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `npm.cmd ${args.join(' ')}; exit $LASTEXITCODE`], { cwd: ROOT, windowsHide: true, stdio: 'inherit' })
      : spawnSync('npm', args, { cwd: ROOT, stdio: 'inherit' })
    gate[name] = result.status ?? 1; writeJson(receipt, gate)
    if (gate[name] !== 0) throw new Error(`${name} failed`)
  }
  if (revision(ROOT) !== gate.commit || command('git', ['status', '--porcelain'], ROOT)) throw new Error('Candidate changed during checks')
  gate.finishedAt = new Date().toISOString(); writeJson(receipt, gate)
  console.log('HOST_RELEASE_GATE_PASS')
} catch (error) {
  writeJson(receipt, { failed: true, error: error.message }); console.error('HOST_RELEASE_GATE_FAIL'); process.exitCode = 1
}
