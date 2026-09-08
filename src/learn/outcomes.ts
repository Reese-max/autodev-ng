import { createHash } from 'node:crypto'
import { quiet, type EventLog } from '../events.js'

const hash = (text: string) => createHash('sha256').update(text).digest('hex')
export function lessonFingerprints(text: string): string[] {
  return [...new Set(text.split(/\r?\n/).filter(line => line.startsWith('- ')).map(line =>
    hash(line.replace(/^- (?:L\d+ \[[^\]]+\]|\[全局\])\s*/, '').replace(/\s+/g, ' ').trim())))].sort()
}

/** Evidence describes observed outcomes, never a causal improvement claim. */
export function observeLearning(events: Pick<EventLog, 'append'>, input: {
  executionId: string; taskId: string; model: string; baseCommit: string; lessonsText: string
}): (result: { accepted: boolean; commit?: string; failure?: string }) => void {
  const started = Date.now(), { lessonsText, ...identity } = input
  const context = { ...identity, lessons: lessonFingerprints(lessonsText), startedAt: new Date(started).toISOString() }
  quiet(() => events.append('learning-started', context))
  return result => quiet(() => events.append('learning-outcome', {
    ...context, accepted: result.accepted && !!result.commit, commit: result.commit ?? null,
    durationMs: Date.now() - started, failure: result.failure ? hash(result.failure.replace(/\s+/g, ' ').trim()) : null
  }))
}

interface Observation {
  executionId: string; taskId: string; model: string; baseCommit: string; lessons: string[]
  accepted: boolean; commit: string | null; durationMs: number; failure: string | null
}

/** ponytail: compare the retained event window; archive logs before long-term evaluation. */
export function summarizeLearning(events: string) {
  const completed = new Map<string, Observation>(), started = new Set<string>()
  let malformed = 0, conflicts = 0
  for (const line of events.split(/\r?\n/).filter(Boolean)) {
    try {
      const e = JSON.parse(line)
      if (e.type === 'learning-started' && typeof e.executionId === 'string') started.add(e.executionId)
      if (e.type !== 'learning-outcome') continue
      if (typeof e.executionId !== 'string' || typeof e.taskId !== 'string' || typeof e.model !== 'string'
        || typeof e.baseCommit !== 'string' || typeof e.accepted !== 'boolean' || !Number.isFinite(e.durationMs) || e.durationMs < 0
        || !Array.isArray(e.lessons) || e.lessons.some((id: unknown) => typeof id !== 'string' || !/^[a-f0-9]{64}$/.test(id))
        || (e.accepted && (typeof e.commit !== 'string' || !/^[a-f0-9]{40,64}$/.test(e.commit)))) throw new Error('Invalid outcome')
      const old = completed.get(e.executionId)
      if (old && JSON.stringify(old) !== JSON.stringify(e)) { conflicts++; continue }
      completed.set(e.executionId, e)
    } catch { malformed++ }
  }
  const groups = new Map<string, { taskId: string; model: string; baseCommit: string; lessons: string[]; attempts: number; accepted: number; durationMs: number; repeatedFailures: number; failures: Set<string> }>()
  for (const e of completed.values()) {
    const lessons = [...new Set(e.lessons)].sort(), key = JSON.stringify([e.taskId, e.model, e.baseCommit, lessons])
    const g = groups.get(key) ?? { taskId: e.taskId, model: e.model, baseCommit: e.baseCommit, lessons, attempts: 0, accepted: 0, durationMs: 0, repeatedFailures: 0, failures: new Set() }
    g.attempts++; g.accepted += Number(e.accepted); g.durationMs += e.durationMs
    if (!e.accepted && e.failure) { if (g.failures.has(e.failure)) g.repeatedFailures++; g.failures.add(e.failure) }
    groups.set(key, g)
  }
  const rows = [...groups.values()].map(({ failures: _failures, durationMs, ...g }) => ({ ...g, acceptanceRate: g.accepted / g.attempts, meanDurationMs: durationMs / g.attempts }))
  const comparisons = rows.filter(row => row.lessons.length > 0).map(row => {
    const baseline = rows.find(b => b.taskId === row.taskId && b.model === row.model && b.baseCommit === row.baseCommit && b.lessons.length === 0)
    const sufficient = !!baseline && baseline.attempts >= 3 && row.attempts >= 3
    return { taskId: row.taskId, model: row.model, baseCommit: row.baseCommit, lessons: row.lessons,
      status: sufficient ? 'observed-comparison' : 'insufficient-matched-observations',
      acceptanceRateDelta: sufficient ? row.acceptanceRate - baseline!.acceptanceRate : null,
      meanDurationMsDelta: sufficient ? row.meanDurationMs - baseline!.meanDurationMs : null }
  })
  return { observed: completed.size, pendingOrInterrupted: [...started].filter(id => !completed.has(id)).length,
    malformed, conflicts, rows, comparisons, causalImprovement: null,
    interpretation: 'Only matched task, model and base commit are compared; observation is not proof of causation or user acceptance.' }
}
