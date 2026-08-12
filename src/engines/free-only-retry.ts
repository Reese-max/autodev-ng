import type { RunDb } from '../db.js'
import type { Config, Task } from '../types.js'
import { isShadowFreeTierEngine } from './shadow-price.js'

export const FREE_ONLY_MAX_ATTEMPTS = 5

export function attemptedEngineTags(db: Pick<RunDb, 'attemptedEngineTags'>, taskId: string, sinceIso?: string): Set<string> {
  try { return new Set(db.attemptedEngineTags(taskId, sinceIso)) } catch { return new Set() }
}

export function freeOnlyRetryCandidates(
  tags: readonly string[], tierMode: Config['tierMode'], attempted: ReadonlySet<string> = new Set(),
): string[] {
  if (tierMode !== 'free-only') return [...tags]
  const seen = new Set<string>()
  return tags.filter(tag => isShadowFreeTierEngine(tag) && !attempted.has(tag) && !seen.has(tag) && seen.add(tag))
}

export function freeOnlyEngineTags(
  cfg: Pick<Config, 'tierMode' | 'engineRotation' | 'defaultEngine'>,
  task: Pick<Task, 'engineTag'>,
  subscriptionTags: readonly string[],
): string[] {
  if (cfg.tierMode !== 'free-only') return []
  if (task.engineTag) return isShadowFreeTierEngine(task.engineTag) ? [task.engineTag] : []
  const base = cfg.engineRotation && cfg.engineRotation.length > 0 ? cfg.engineRotation : [cfg.defaultEngine]
  return [...new Set([...base, ...subscriptionTags].filter(isShadowFreeTierEngine))]
}

export function freeOnlyAttemptLimit(
  cfg: Pick<Config, 'tierMode' | 'maxAttempts'>,
): number {
  if (cfg.tierMode !== 'free-only') return cfg.maxAttempts
  return FREE_ONLY_MAX_ATTEMPTS
}

export function freeOnlyListExhausted(
  cfg: Pick<Config, 'tierMode' | 'engineRotation' | 'defaultEngine'>,
  task: Pick<Task, 'engineTag'>,
  subscriptionTags: readonly string[],
  attempted: ReadonlySet<string>,
): boolean {
  const freeTags = freeOnlyEngineTags(cfg, task, subscriptionTags)
  return freeTags.length > 0 && freeTags.every(tag => attempted.has(tag))
}
