import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateConfig, evaluateCI, evaluateAcceptance, evaluateSchedule, makeReader, collect, report, markdown } from '../../scripts/delivery-health.mjs';

const sha = 'a'.repeat(40), other = 'b'.repeat(40);
const time = '2026-09-11T04:00:00Z', now = Date.parse(time);
const run = { id: 1, head_sha: sha, path: '.github/workflows/ci.yml', created_at: time, status: 'completed', conclusion: 'success' };
const acceptance = { sha, finished_at: time, writer_id: 'writer', reviewer_id: 'reviewer', checks: [{ status: 'PASS', executed: true, evidence_ref: 'isolated/test.log' }] };
const spec = { id: 'board', enabled: true, external_id: 'actual-task-1', config_version: 'v1', interval_hours: 6 };
const heartbeat = { schedule_id: 'actual-task-1', config_version: 'v1', observed_at: time, last_success_at: time, status: 'PASS' };
const config = () => ({ version: 1, repositories: [{ repo: 'owner/repo', workflow: 'ci.yml', publish_details: true }], schedules: [{ ...spec }] });
const snapshot = () => ({ repositories: { 'owner/repo': { private: false, sha, runs: [run], open_prs: [{ number: 18, head_sha: other }], pr_coverage: 'COMPLETE' } }, acceptances: { 'owner/repo': acceptance }, schedules: { board: heartbeat } });

test('only the exact SHA/workflow passes; wrong workflow and stale SHA are unknown', () => {
  assert.equal(evaluateCI(sha, [run], 'ci.yml').status, 'PASS');
  assert.equal(evaluateCI(other, [run], 'ci.yml').status, 'UNKNOWN');
  assert.equal(evaluateCI(sha, [run], 'other.yml').status, 'UNKNOWN');
});
test('CI failure, cancellation, skipped and neutral never pass', () => {
  for (const conclusion of ['failure', 'cancelled', 'skipped', 'neutral', 'timed_out', null])
    assert.equal(evaluateCI(sha, [{ ...run, conclusion }], 'ci.yml').status, 'BLOCKED');
});
test('a rerun supersedes the earlier successful attempt', () => {
  assert.equal(evaluateCI(sha, [run, { ...run, run_attempt: 2, status: 'in_progress', conclusion: null }], 'ci.yml').status, 'PENDING');
});
test('malformed CI receipt is not success', () => {
  assert.equal(evaluateCI(sha, [{ ...run, id: null }], 'ci.yml').status, 'UNKNOWN');
  assert.equal(evaluateCI(sha, [{ ...run, created_at: 'invalid' }], 'ci.yml').status, 'UNKNOWN');
});
test('acceptance requires exact SHA and evidence', () => {
  assert.equal(evaluateAcceptance(acceptance, sha, now).status, 'PASS');
  assert.equal(evaluateAcceptance(acceptance, other, now).status, 'BLOCKED');
  assert.equal(evaluateAcceptance(null, sha, now).status, 'UNKNOWN');
});
test('partial, skipped, unexecuted and evidence-free checks cannot pass', () => {
  for (const check of [{ status: 'PARTIAL' }, { status: 'SKIP' }, { status: 'PASS', executed: false }, { status: 'PASS', executed: true }])
    assert.equal(evaluateAcceptance({ ...acceptance, checks: [check] }, sha, now).status, 'UNKNOWN');
  assert.equal(evaluateAcceptance({ ...acceptance, checks: [] }, sha, now).status, 'UNKNOWN');
  assert.equal(evaluateAcceptance({ ...acceptance, checks: [{ status: 'FAIL' }] }, sha, now).status, 'BLOCKED');
});
test('acceptance rejects stale/future/invalid timestamps', () => {
  for (const finished_at of ['2026-09-09T04:00:00Z', '2026-09-12T04:00:00Z', 'invalid', null])
    assert.equal(evaluateAcceptance({ ...acceptance, finished_at }, sha, now).status, 'UNKNOWN');
});
test('same author/reviewer is not independent verification', () => {
  assert.equal(evaluateAcceptance({ ...acceptance, reviewer_id: 'writer' }, sha, now).status, 'UNKNOWN');
});
test('schedule needs actual identity, enabled status and matching configuration', () => {
  assert.equal(evaluateSchedule(spec, heartbeat, now).status, 'PASS');
  assert.equal(evaluateSchedule({ ...spec, external_id: null }, heartbeat, now).status, 'UNKNOWN');
  assert.equal(evaluateSchedule({ ...spec, enabled: null }, heartbeat, now).status, 'UNKNOWN');
  assert.equal(evaluateSchedule(spec, { ...heartbeat, config_version: 'old' }, now).status, 'UNKNOWN');
  assert.equal(evaluateSchedule(spec, { ...heartbeat, schedule_id: 'other' }, now).status, 'UNKNOWN');
});
test('late heartbeat blocked, stale observation unknown, configured disable distinct', () => {
  assert.equal(evaluateSchedule(spec, { ...heartbeat, last_success_at: '2026-09-09T04:00:00Z' }, now).status, 'BLOCKED');
  assert.equal(evaluateSchedule(spec, { ...heartbeat, observed_at: 'invalid' }, now).status, 'UNKNOWN');
  assert.equal(evaluateSchedule({ ...spec, enabled: false }, null, now).status, 'DISABLED');
  assert.equal(evaluateSchedule(spec, { ...heartbeat, status: 'RUNNING' }, now).status, 'PENDING');
  assert.equal(evaluateSchedule(spec, { ...heartbeat, status: 'FAIL' }, now).status, 'BLOCKED');
});
test('configuration disallows empty scope, duplicate IDs and injected paths', () => {
  assert.equal(validateConfig(config()).version, 1);
  for (const modify of [c => c.repositories = [], c => c.repositories.push(c.repositories[0]), c => c.schedules.push(c.schedules[0]), c => c.repositories[0].repo = '../bad', c => c.repositories[0].workflow = '../ci.yml', c => c.schedules[0].interval_hours = 0]) {
    const c = config(); modify(c); assert.throws(() => validateConfig(c));
  }
});
test('duplicate runtime scheduler identities are blocked', () => {
  const c = config(); c.schedules.push({ ...spec, id: 'second-board' });
  assert.equal(report(c, snapshot(), now).schedules[0].status, 'BLOCKED');
});
test('report distinguishes CI/acceptance/scheduler evidence and never authorizes deployment', () => {
  const r = report(config(), snapshot(), now);
  assert.equal(r.status, 'PASS'); assert.equal(r.deployment_authorized, false);
  assert.equal(r.repositories[0].deployment, 'NOT_EVALUATED');
  assert.match(r.repositories[0].next_action, /Continue existing PRs/);
  const missing = snapshot(); delete missing.acceptances;
  assert.equal(report(config(), missing, now).status, 'INCOMPLETE');
});
test('partial PR coverage blocks a complete-health claim', () => {
  const s = snapshot(); s.repositories['owner/repo'].pr_coverage = 'PARTIAL';
  assert.equal(report(config(), s, now).status, 'INCOMPLETE');
});
test('private or unavailable repository details are never published', () => {
  const s = snapshot(); s.repositories['owner/repo'].private = true;
  const output = JSON.stringify(report(config(), s, now));
  assert.ok(!output.includes('owner/repo')); assert.ok(!output.includes(sha)); assert.ok(!output.includes(other));
});
test('markdown does not turn external descriptions into markup or commands', () => {
  const r = report(config(), snapshot(), now); r.schedules[0].reason = '<script> | `command`\n';
  const text = markdown(r); assert.ok(!text.includes('<script>')); assert.ok(!text.includes('`command`'));
});
test('API is fixed-origin GET-only, redirects denied, tokens stay out of data', async () => {
  let options, url;
  const read = makeReader({ token: 'test-secret', fetchImpl: async (u, o) => { url = u; options = o; return new Response('{}'); } });
  await read('/repos/owner/repo');
  assert.equal(url, 'https://api.github.com/repos/owner/repo'); assert.equal(options.method, 'GET');
  assert.equal(options.redirect, 'error'); assert.equal(options.headers.Authorization, 'Bearer test-secret');
  await assert.rejects(read('https://evil.invalid/'), /Disallowed/);
  await assert.rejects(read('/user'), /Disallowed/);
});
test('429 triggers one-call cooldown and no retry', async () => {
  let calls = 0;
  const read = makeReader({ fetchImpl: async () => { calls++; return new Response('secret response', { status: 429 }); } });
  await assert.rejects(read('/repos/o/r'), /HTTP 429/);
  await assert.rejects(read('/repos/o/r/branches/main'), /cooldown/);
  assert.equal(calls, 1);
});
test('rate-limited 403 triggers cooldown; ordinary 404 stays explicit', async () => {
  const read = makeReader({ fetchImpl: async () => new Response('', { status: 403, headers: { 'x-ratelimit-remaining': '0' } }) });
  await assert.rejects(read('/repos/o/r'), /HTTP 403/); await assert.rejects(read('/repos/o/r'), /cooldown/);
  const notFound = makeReader({ fetchImpl: async () => new Response('private token text', { status: 404 }) });
  await assert.rejects(notFound('/repos/o/r'), { message: 'GitHub HTTP 404; no retry' });
});
test('timeout/network errors never leak credentials or retry', async () => {
  let calls = 0;
  const read = makeReader({ fetchImpl: async () => { calls++; throw new Error('secret-token'); } });
  await assert.rejects(read('/repos/o/r'), { message: 'Network failure or timeout; no retry' }); assert.equal(calls, 1);
});
test('collection executes only four bounded reads and preserves active PRs', async () => {
  const paths = [], responses = [{ private: false, default_branch: 'main' }, { commit: { sha } }, { workflow_runs: [run] }, [{ number: 18, head: { sha: other } }]];
  const result = await collect(config(), async path => { paths.push(path); return responses.shift(); });
  assert.equal(paths.length, 4); assert.equal(result.repositories['owner/repo'].open_prs[0].number, 18);
  assert.equal(result.repositories['owner/repo'].pr_coverage, 'COMPLETE');
});
test('collection errors do not invent repository absence or CI success', async () => {
  const result = await collect(config(), async () => { throw new Error('GitHub HTTP 404; no retry'); });
  assert.equal(report(config(), result, now).repositories[0].ci.status, 'UNKNOWN');
});
test('CLI offline report and strict incomplete exit code are reproducible', () => {
  const dir = mkdtempSync(join(tmpdir(), 'delivery-health-'));
  try {
    const c = config(); c.schedules[0].enabled = null;
    writeFileSync(join(dir, 'config.json'), JSON.stringify(c)); writeFileSync(join(dir, 'snapshot.json'), JSON.stringify(snapshot()));
    const result = spawnSync(process.execPath, ['scripts/delivery-health.mjs', '--config', join(dir, 'config.json'), '--snapshot', join(dir, 'snapshot.json'), '--out', join(dir, 'report.json'), '--strict'], { encoding: 'utf8' });
    assert.equal(result.status, 2, result.stderr);
    assert.equal(JSON.parse(readFileSync(join(dir, 'report.json'))).deployment_authorized, false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
