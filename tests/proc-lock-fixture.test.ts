import { expect, test } from 'vitest'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const fixtureUrl = new URL('./fixtures/fake-cli.mjs', import.meta.url).href

// This isolated Node harness controls the fixture's stderr chunks only. It does
// not run PowerShell or establish a real Windows file lock; that remains covered
// by the unchanged native lock/deletion assertions in proc.test.ts.
function fixtureStderr(chunks: string[]): string {
  const script = `
    import childProcess from 'node:child_process';
    import { syncBuiltinESMExports } from 'node:module';
    import { EventEmitter } from 'node:events';
    import { PassThrough } from 'node:stream';
    let captured = '';
    process.stderr.write = chunk => { captured += String(chunk); return true; };
    childProcess.spawn = () => {
      const locker = new EventEmitter();
      locker.pid = 123;
      locker.stderr = new PassThrough();
      queueMicrotask(() => {
        for (const chunk of ${JSON.stringify(chunks)}) locker.stderr.write(chunk);
        process.stdout.write(JSON.stringify({ stderr: captured }));
        process.exit(0);
      });
      return locker;
    };
    syncBuiltinESMExports();
    process.env.FAKE_MODE = 'hang-worktree-lock';
    process.env.FAKE_LOCK_FILE = 'inert-controlled-fixture';
    await import(${JSON.stringify(fixtureUrl)});
    process.stdin.emit('end');
  `
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    encoding: 'utf8', timeout: 5_000, windowsHide: true,
  })
  expect(result.error).toBeUndefined()
  expect(result.status).toBe(0)
  return (JSON.parse(result.stdout) as { stderr: string }).stderr
}

test('locker fixture preserves a READY line split across stderr chunks', () => {
  const output = fixtureStderr(['WORKTREE_LOCK_', 'READY\r', '\n'])
  expect(output.split(/\r?\n/)).toContain('WORKTREE_LOCK_READY')
})

test('locker fixture does not turn a quoted command/error into a READY line', () => {
  const output = fixtureStderr(['PowerShell error: WriteLine("WORKTREE_LOCK_READY") was not executed\n'])
  expect(output.split(/\r?\n/)).not.toContain('WORKTREE_LOCK_READY')
})

test('locker fixture preserves startup diagnostics instead of returning empty stderr', () => {
  const output = fixtureStderr(['LOCKER STARTUP FAILURE\n'])
  expect(output).toContain('LOCKER STARTUP FAILURE')
})

test('locker fixture emits exactly one observed readiness event for a complete line', () => {
  const output = fixtureStderr(['WORKTREE_LOCK_READY\n', 'WORKTREE_LOCK_READY\n'])
  expect(output.split(/\r?\n/).filter(line => line === 'WORKTREE_LOCK_READY_OBSERVED')).toHaveLength(1)
})
