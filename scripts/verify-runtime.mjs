import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

// Compiled CLI acceptance with real Git/filesystem, no provider, notification or remote writes.
const root = fileURLToPath(new URL('../', import.meta.url)), cli = join(root, 'dist/cli.js')
const parent = realpathSync(tmpdir()), temp = mkdtempSync(join(parent, 'adng-runtime-'))
const run = (command, args, cwd = temp) => execFileSync(command, args, { cwd, encoding: 'utf8', timeout: 60000, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
try {
  for (const mode of ['', 'status', 'run-once', 'task', 'github', 'github doctor', 'github resume', 'github delivery', 'github accept', 'github report', 'github repair', 'github proposal-review']) {
    const output = run(process.execPath, [cli, ...mode.split(' ').filter(Boolean), '--help', '--config', join(temp, 'missing.json')])
    assert.match(output, /用法|Usage/)
  }
  const reports = JSON.parse(readFileSync(join(root, 'configs/integrations/github-reports.json'), 'utf8'))
  const probes = reports.projects.find(p => p.repo === 'Reese-max/autodev-ng').probes
  for (const probe of probes) {
    assert.equal(probe.command, 'node'); assert.equal(probe.expectedExit, 0)
    const output = run(process.execPath, probe.args, root)
    if (probe.expectedText) assert.ok(output.includes(probe.expectedText), probe.id)
  }
  mkdirSync(join(temp, 'project'))
  writeFileSync(join(temp, 'project/BACKLOG.md'), '')
  writeFileSync(join(temp, 'config.json'), JSON.stringify({ projectPath: './project', backlogFile: './project/BACKLOG.md', dataDir: './data', engine: 'mock' }))
  run('git', ['init', '-q'], join(temp, 'project'))
  run('git', ['add', 'BACKLOG.md'], join(temp, 'project'))
  run('git', ['-c', 'user.name=Acceptance', '-c', 'user.email=acceptance@example.invalid', '-c', 'commit.gpgSign=false', 'commit', '-qm', 'Empty acceptance backlog'], join(temp, 'project'))
  run(process.execPath, [cli, 'status', '--config', join(temp, 'config.json')])
  assert.match(run(process.execPath, [cli, 'run-once', '--config', join(temp, 'config.json')]), /idle/)
  assert.equal(run('git', ['status', '--porcelain'], join(temp, 'project')).trim(), '')
  console.log(JSON.stringify({ gate: 'COMPILED_RUNTIME_GATE=PASS', helpCases: 12, operationalProbes: probes.length, git: 'real', provider: 'not called', project: 'synthetic', status: 'pass', runOnce: 'idle' }))
} finally {
  const target = realpathSync(temp)
  assert.ok(target.startsWith(parent + sep) && resolve(target) === resolve(temp), 'Cleanup must stay in the owned temporary directory')
  rmSync(target, { recursive: true, force: true })
}
