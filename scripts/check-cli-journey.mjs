// An offline CLI journey: real commands and persistent state; no model success is claimed.
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
const cli = resolve('dist/cli.js'), dir = mkdtempSync(join(tmpdir(), 'adng-cli-journey-'))
const root = join(dir, 'repo'), config = join(dir, 'config.json'), data = join(dir, 'data')
mkdirSync(root)
execFileSync('git', ['init', '-b', 'main', root], { windowsHide: true, stdio: 'pipe' })
writeFileSync(join(root, 'README.md'), '# Journey fixture\n')
execFileSync('git', ['-C', root, 'add', '.'], { windowsHide: true })
execFileSync('git', ['-C', root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'fixture'], { windowsHide: true })
writeFileSync(config, JSON.stringify({ projectPath: root, dataDir: data, backlogFile: join(data, 'BACKLOG.md'), engine: 'mock', stopFile: join(dir, 'pause') }))
function run(args, expected = 0) {
  const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', timeout: 20_000, windowsHide: true })
  assert.equal(result.status, expected, result.stderr + result.stdout)
  return result.stdout
}
assert.match(run(['--help']), /task add.*--config/s)
const text = 'Document this fixture with a verifiable example.'
const task = JSON.parse(run(['task', 'add', '--config', config, '--text', text]))
run(['task', 'add', '--config', config, '--text', text])
assert.equal(JSON.parse(run(['task', 'list', '--config', config])).tasks.length, 1)
assert.equal(JSON.parse(run(['task', 'list', '--config', config])).tasks[0].id, task.id)
assert.equal(task.task.source, 'user')
// A deliberate dirty checkout must block before the engine runs, then remain inspectable.
writeFileSync(join(root, 'README.md'), '# Dirty fixture, preserve me\n')
assert.match(run(['run-once', '--config', config], 1), /blocked/)
assert.equal(JSON.parse(run(['task', 'list', '--config', config])).tasks[0].status, 'blocked')
assert.match(readFileSync(join(root, 'README.md'), 'utf8'), /preserve me/)
assert.match(run(['status', '--config', config]), /blocked/)
writeFileSync(join(dir, 'pause'), 'Paused for fixture check\n')
assert.match(run(['run-once', '--config', config]), /stopped/)
console.log('CLI_JOURNEY_PASS create, deduplicate, inspect, block, preserve, stop; model completion and repair recovery require separate live evidence')
// Retain this bounded fixture for diagnosis. OS temporary-file cleanup owns its lifecycle.
