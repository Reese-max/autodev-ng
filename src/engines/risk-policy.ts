import type { Config, Task, TaskRisk } from '../types.js'

const RANK: Record<TaskRisk, number> = { low: 0, medium: 1, high: 2 }
const HIGH_RISK = /(?:^|[\\/])(?:\.github[\\/]workflows|\.gitlab-ci|migrations?|infra|deploy|release|security|auth|permissions?|secrets?|configs?)(?:[\\/]|\.|$)|\b(?:deploy|release|publish|migration|credential|secret|security|permission)\b|部署|發布|憑證|機密|權限|安全/i

export function classifyTaskRisk(cfg: Pick<Config, 'defaultRisk'>, task: Task, changedPaths = ''): TaskRisk {
  const declared = task.ownership?.risk
  let risk = declared ?? cfg.defaultRisk
  if (task.source === 'autopilot' && risk === 'low') risk = cfg.defaultRisk === 'high' ? 'high' : 'medium'
  if (HIGH_RISK.test(`${task.text}\n${changedPaths}`)) risk = 'high'
  return risk
}

export function riskAtLeast(risk: TaskRisk, minimum: TaskRisk): boolean {
  return RANK[risk] >= RANK[minimum]
}

export function verifyRequired(risk: TaskRisk): boolean { return riskAtLeast(risk, 'medium') }
export function reviewRequired(risk: TaskRisk): boolean { return riskAtLeast(risk, 'medium') }

export function releaseEvidenceRequired(task: Task): boolean {
  return /\b(?:deploy|release|publish)\b|部署|發布/i.test(task.text)
}
