#!/usr/bin/env node
// Read-only delivery monitoring. No issue writes, checkout, model calls or deployment.
import { readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const SHA = /^[a-f0-9]{40}$/i;
const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const stamp = value => typeof value === 'string' ? Date.parse(value) : NaN;
const state = (status, reason) => ({ status, reason });
const fresh = (time, now, hours) => Number.isFinite(stamp(time)) &&
  stamp(time) <= now + 300_000 && now - stamp(time) <= hours * 3_600_000;

export function validateConfig(config) {
  if (config?.version !== 1 || !Array.isArray(config.repositories) ||
      !Array.isArray(config.schedules) || config.repositories.length === 0) throw new Error('Invalid configuration');
  const repos = new Set(), schedules = new Set();
  for (const row of config.repositories) {
    if (!REPO.test(row.repo) || row.repo.split('/').some(part => ['.', '..'].includes(part)) || repos.has(row.repo.toLowerCase()) ||
        !/^[A-Za-z0-9_.-]+\.ya?ml$/.test(row.workflow) ||
        typeof row.publish_details !== 'boolean') throw new Error('Invalid repository entry');
    repos.add(row.repo.toLowerCase());
  }
  for (const row of config.schedules) {
    if (!/^[a-z0-9-]+$/.test(row.id) || schedules.has(row.id) ||
        !Number.isFinite(row.interval_hours) || row.interval_hours <= 0 ||
        ![true, false, null].includes(row.enabled) ||
        ![null, 'string'].includes(row.external_id === null ? null : typeof row.external_id) ||
        typeof row.config_version !== 'string' || !row.config_version) throw new Error('Invalid schedule entry');
    schedules.add(row.id);
  }
  return config;
}

export function evaluateCI(sha, runs, workflow) {
  if (!SHA.test(sha ?? '') || !Array.isArray(runs)) return state('UNKNOWN', 'Missing current SHA or CI evidence');
  const matches = runs.filter(r => r.head_sha === sha && r.path === `.github/workflows/${workflow}`);
  matches.sort((a, b) => stamp(b.created_at) - stamp(a.created_at) || (b.run_attempt ?? 1) - (a.run_attempt ?? 1));
  const run = matches[0];
  if (!run) return state('UNKNOWN', 'No matching workflow run for the current SHA');
  if (!Number.isSafeInteger(run.id) || run.id <= 0 || !Number.isFinite(stamp(run.created_at))) return state('UNKNOWN', 'Malformed CI run evidence');
  const evidence = { run_id: run.id, sha, run_status: run.status, conclusion: run.conclusion };
  if (run.status !== 'completed') return { ...state('PENDING', 'CI has not completed'), ...evidence };
  if (run.conclusion === 'success') return { ...state('PASS', 'CI passed; runtime/deployment not evaluated'), ...evidence };
  return { ...state('BLOCKED', `CI conclusion: ${run.conclusion ?? 'unknown'}`), ...evidence };
}

export function evaluateAcceptance(receipt, sha, now = Date.now()) {
  if (!receipt || !SHA.test(sha ?? '')) return state('UNKNOWN', 'No acceptance receipt/current SHA');
  if (receipt.sha !== sha) return state('BLOCKED', 'Acceptance belongs to another SHA');
  if (!fresh(receipt.finished_at, now, 24)) return state('UNKNOWN', 'Acceptance receipt is stale or has an invalid timestamp');
  if (!Array.isArray(receipt.checks) || receipt.checks.length === 0) return state('UNKNOWN', 'No check evidence');
  if (receipt.checks.some(c => c?.status === 'FAIL')) return state('BLOCKED', 'An acceptance check failed');
  if (receipt.checks.some(c => c?.status !== 'PASS' || c.executed !== true || !c.evidence_ref))
    return state('UNKNOWN', 'Skipped, partial or unevidenced checks cannot pass');
  if (!receipt.writer_id || !receipt.reviewer_id || receipt.writer_id === receipt.reviewer_id)
    return state('UNKNOWN', 'Independent reviewer attribution is absent');
  return state('PASS', 'Receipt fields validated; producer authenticity and runtime are not independently attested');
}

export function evaluateSchedule(spec, receipt, now = Date.now()) {
  if (spec.enabled === false) return state('DISABLED', 'Configured as disabled; no runtime claim');
  if (spec.enabled !== true || !spec.external_id) return state('UNKNOWN', 'Actual scheduler identity/enabled state has not been read');
  if (!receipt || receipt.schedule_id !== spec.external_id || receipt.config_version !== spec.config_version)
    return state('UNKNOWN', 'Missing or mismatched scheduler receipt');
  if (!fresh(receipt.observed_at, now, spec.interval_hours * 2)) return state('UNKNOWN', 'Scheduler observation is stale');
  if (['FAIL', 'BLOCKED'].includes(receipt.status)) return state('BLOCKED', 'Scheduler reported failure/blockage');
  if (!fresh(receipt.last_success_at, now, spec.interval_hours * 2)) return state('BLOCKED', 'Successful heartbeat overdue or invalid');
  if (receipt.status !== 'PASS') return state('PENDING', 'Latest execution is not a completed success');
  return state('PASS', 'Recent scheduler receipt; not proof of product delivery');
}

export function makeReader({ token = '', fetchImpl = globalThis.fetch } = {}) {
  let coolingDown = false;
  return async path => {
    if (coolingDown) throw new Error('API cooldown; no further requests this run');
    if (!/^\/repos\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\/|$)/.test(path) || path.split('/').some(part => ['.', '..'].includes(part))) throw new Error('Disallowed API path');
    const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    if (token) headers.Authorization = `Bearer ${token}`;
    let response;
    try {
      response = await fetchImpl(`https://api.github.com${path}`, {
        method: 'GET', headers, redirect: 'error', signal: AbortSignal.timeout(10_000)
      });
    } catch { throw new Error('Network failure or timeout; no retry'); }
    if (response.status === 429 || (response.status === 403 &&
        (response.headers.get('retry-after') !== null || response.headers.get('x-ratelimit-remaining') === '0'))) coolingDown = true;
    if (!response.ok) throw new Error(`GitHub HTTP ${response.status}; no retry`);
    return response.json(); // Never persist response bodies from failed requests or tokens.
  };
}

export async function collect(config, read) {
  const snapshot = { repositories: {}, schedules: {}, acceptances: {} };
  for (const row of config.repositories) {
    const item = snapshot.repositories[row.repo] = {};
    const base = `/repos/${row.repo}`;
    try {
      const meta = await read(base);
      item.private = meta.private !== false;
      item.default_branch = meta.default_branch;
      if (!meta.default_branch) throw new Error('Default branch unavailable');
      const branch = await read(`${base}/branches/${encodeURIComponent(meta.default_branch)}`);
      item.sha = branch.commit?.sha;
      const runs = await read(`${base}/actions/workflows/${encodeURIComponent(row.workflow)}/runs?branch=${encodeURIComponent(meta.default_branch)}&per_page=20`);
      if (!Array.isArray(runs.workflow_runs)) throw new Error('Invalid workflow response');
      item.runs = runs.workflow_runs;
      const pulls = await read(`${base}/pulls?state=open&per_page=100`);
      if (!Array.isArray(pulls)) throw new Error('Invalid pull-request response');
      item.open_prs = pulls.map(p => ({ number: p.number, head_sha: p.head?.sha }));
      item.pr_coverage = pulls.length === 100 ? 'PARTIAL' : 'COMPLETE';
    } catch (error) { item.error = error.message; }
  }
  return snapshot;
}

export function report(config, snapshot, now = Date.now()) {
  validateConfig(config);
  const repositories = config.repositories.map((row, index) => {
    const data = snapshot.repositories?.[row.repo] ?? {};
    const visible = row.publish_details && data.private === false;
    const ci = data.error ? state('UNKNOWN', 'Collection failed; inspect access/service separately') : evaluateCI(data.sha, data.runs, row.workflow);
    return { repo: visible ? row.repo : `restricted-${index + 1}`, sha: visible ? data.sha ?? null : null,
      ci: visible ? ci : { status: ci.status, reason: 'Details withheld' },
      acceptance: evaluateAcceptance(snapshot.acceptances?.[row.repo], data.sha, now),
      open_prs: visible ? data.open_prs ?? [] : [], pr_coverage: data.pr_coverage ?? 'UNKNOWN',
      next_action: data.open_prs?.length ? 'Continue existing PRs before claiming new work' : 'Check existing work and locks before claiming',
      deployment: 'NOT_EVALUATED' };
  });
  const identities = config.schedules.filter(s => s.enabled !== false && s.external_id).map(s => s.external_id);
  const schedules = config.schedules.map(spec => ({ id: spec.id,
    ...(spec.external_id && identities.filter(id => id === spec.external_id).length > 1 ?
      state('BLOCKED', 'Duplicate scheduler identity') : evaluateSchedule(spec, snapshot.schedules?.[spec.id], now)) }));
  const statuses = [...repositories.flatMap(r => [r.ci.status, r.acceptance.status, r.pr_coverage === 'COMPLETE' ? 'PASS' : 'UNKNOWN']), ...schedules.map(s => s.status)];
  const status = statuses.includes('BLOCKED') ? 'BLOCKED' : statuses.some(s => !['PASS', 'DISABLED'].includes(s)) ? 'INCOMPLETE' : 'PASS';
  return { version: 1, observed_at: new Date(now).toISOString(), status, repositories, schedules, deployment_authorized: false };
}

export function markdown(result) {
  const safe = value => String(value ?? '').replace(/[|<>`\r\n]/g, ' ');
  const lines = ['# Delivery health', '', `Observed: ${result.observed_at}`, `Status: **${result.status}**`,
    '', 'Report generation/CI success is not production deployment verification.', '', '| Repository | CI | Acceptance | Open PRs |', '|---|---|---|---|'];
  for (const r of result.repositories) lines.push(`| ${safe(r.repo)} | ${r.ci.status} | ${r.acceptance.status} | ${r.open_prs.map(p => `#${p.number}`).join(', ') || 'none / unavailable'} |`);
  lines.push('', '| Schedule | State | Reason |', '|---|---|---|');
  for (const s of result.schedules) lines.push(`| ${safe(s.id)} | ${s.status} | ${safe(s.reason)} |`);
  lines.push('', 'No merge, deployment, task creation, permission change or credential mutation was performed.', '');
  return lines.join('\n');
}

async function main() {
  const { values } = parseArgs({ options: { config: { type: 'string' }, snapshot: { type: 'string' },
    out: { type: 'string' }, strict: { type: 'boolean', default: false } } });
  const load = path => JSON.parse(readFileSync(path, 'utf8'));
  const config = validateConfig(load(values.config ?? fileURLToPath(new URL('../configs/integrations/delivery-health.json', import.meta.url))));
  const snapshot = values.snapshot ? load(values.snapshot) : await collect(config, makeReader({ token: process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN ?? '' }));
  const result = report(config, snapshot);
  if (values.out) { mkdirSync(dirname(resolve(values.out)), { recursive: true }); writeFileSync(values.out, JSON.stringify(result, null, 2) + '\n', { mode: 0o600 }); }
  console.log(markdown(result));
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown(result));
  if (values.strict) process.exitCode = result.status === 'PASS' ? 0 : result.status === 'BLOCKED' ? 1 : 2;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(() => { console.error('Delivery health could not complete; result UNKNOWN. No deployment authorized.'); process.exitCode = 2; });
}
