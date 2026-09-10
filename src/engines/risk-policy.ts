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
  const release = /\b(?:deploy|release|publish)\b|部署|發布/i
  const prohibition = /\b(?:do not|don't|never|must not|mustn't|should not|shouldn't|without|no need to)\s+|不要|請勿|不得|禁止|不需(?:要)?|無需|不必/i
  const action = /^(?:(?:access|modify|change|edit|touch|push|commit|deploy|release|publish|send)\b|(?:對外|直接|進行)?(?:存取|修改|變更|編輯|推送|提交|部署|發布|發送|傳送))/i
  // ponytail: recognize explicit prohibitions and evidence discussion; ambiguous intent still requires approval.
  return task.text.replace(/\btrust\s+in\s+release\s+evidence\b/gi, 'evidence').replace(/\\[rn]/g, '\n').split(/[.!?;\n。！？；]/).some(sentence => {
    if (!release.test(sentence)) return false
    if (/\b(?:if|unless|until|except)\b|如果|除非|直到|例外/i.test(sentence)) return true
    return sentence.split(/[,，]|\b(?:but|however|then)\b|但是|然而|然後/i).some(clause => {
      if (!release.test(clause)) return false
      const denied = prohibition.exec(clause)
      if (!denied || release.test(clause.slice(0, denied.index))) return true
      return clause.slice(denied.index + denied[0].length).split(/\b(?:and|or)\b|或|與|及|和|、/i)
        .some(part => !action.test(part.trim()))
    })
  })
}
