import assert from 'node:assert/strict';
import { backupRepo } from './backup-push.mjs';

function fakeGit(mode) {
  return (_repo, args) => {
    if (args[0] === 'symbolic-ref') return { status: 0, stdout: 'main\n', stderr: '' };
    if (args[0] === 'ls-remote') return { status: mode === 'pending' ? 2 : 0, stdout: '', stderr: '' };
    if (args[0] === 'push' && mode === 'fail') return { status: 1, stdout: '', stderr: 'fatal: test rejection' };
    return { status: 0, stdout: '', stderr: '' };
  };
}

assert.deepEqual(backupRepo('test', fakeGit('ok')), { status: 'ok' });
assert.deepEqual(backupRepo('test', fakeGit('fail')), { status: 'failed', detail: 'fatal: test rejection' });
assert.deepEqual(backupRepo('test', fakeGit('pending')), {
  status: 'pending-initial-push', detail: 'origin/main 尚不存在，等待明確授權',
});
console.log('backup-push self-check: 3 passed');
