import type { Goal } from './goal.js'
import { callAgent, type LlmOpts } from './llm.js'
import { gatherEvidence, type GoalVerification } from './evaluator.js'

// M9.6 verify-and-supplement 階段：autopilot 回 achieved 後的對抗式獨立驗證＋補足。
// 獨立性三支柱：換模型（auditLlm 異於 judgeModel）＋對抗式 framing＋機械接地（跑 verifyCommand）。
// 審查故障保留程式與任務，但不得把未驗證成果標記為完成。

export interface AuditResult { clean: boolean; gapTasks: string[] }

// 只有完整 CLEAN 才通過；GAPS 後接任務，無法解析時不通過也不憑空生任務。
export function parseAudit(out: string): AuditResult {
  const lines = out.split(/\r?\n/)
  const firstIdx = lines.findIndex(l => l.trim())
  const first = firstIdx >= 0 ? lines[firstIdx]!.trim() : ''
  if (!/^GAPS[:：]?$/i.test(first)) return { clean: /^CLEAN$/i.test(out.trim()), gapTasks: [] }
  const gapTasks = lines.slice(firstIdx + 1).map(l => l.trim().replace(/^-\s*/, '')).filter(Boolean)
  return { clean: false, gapTasks: gapTasks.slice(0, 5) }
}

function buildAuditPrompt(goal: Goal, evidence: string, verifyOut: string): string {
  return [
    '你是對抗式驗證者。以下是目標、佐證檔內容、與驗收指令輸出。',
    '找出「相對目標仍缺少、造假、或錯誤」之處——預設一定找得到問題，除非真的完美。',
    '發現缺口→回 GAPS，其後每行一條補足該缺口的具體、可被工程引擎獨立執行的任務（1~5 條）。',
    '真的無可挑剔→只回一行 CLEAN。',
    `\n# 目標\n${goal.objective}`,
    `\n# 佐證檔案\n${evidence || '（無佐證檔）'}`,
    `\n# 驗收指令輸出\n${verifyOut || '（無驗收指令）'}`
  ].join('\n')
}

export interface SupplementDeps {
  auditLlm: LlmOpts
  runVerify?: (cmd: string, cwd: string) => GoalVerification | Promise<GoalVerification>
  readEvidence?: (absPath: string) => string
  runOnceFn: () => Promise<unknown>
  appendTask: (text: string) => void
  isAlive: () => boolean
  supplementLimit: number
}
export interface SupplementResult { clean: boolean; rounds: number; supplemented: number; residualGaps: string[] }

export async function verifyAndSupplement(deps: SupplementDeps, goal: Goal, cwd: string): Promise<SupplementResult> {
  let rounds = 0
  let supplemented = 0
  let residualGaps: string[] = []
  for (let i = 0; i < deps.supplementLimit; i++) {
    if (!deps.isAlive()) break
    rounds++
    // 機械驗收失敗或不可執行時，模型不能覆蓋失敗結果。
    let verifyOut = ''
    if (goal.verifyCommand) {
      try {
        if (!deps.runVerify) throw new Error('verification runner unavailable')
        const r = await deps.runVerify(goal.verifyCommand, cwd)
        verifyOut = `exit=${r.exitCode} passed=${r.passed}\n${r.output ?? ''}`.trim()
        if (r.exitCode !== 0) return { clean: false, rounds, supplemented, residualGaps: [verifyOut] }
      } catch (error) { return { clean: false, rounds, supplemented, residualGaps: [`verify error: ${String(error)}`] } }
    }
    const evidence = gatherEvidence(goal.evidenceFiles, cwd, deps.readEvidence)
    // 審查失敗與無法解析的回應不新增任務，也不簽發通過結果。
    let audit: AuditResult
    try {
      const reply = await callAgent(deps.auditLlm, buildAuditPrompt(goal, evidence, verifyOut))
      if (reply.error) throw new Error(reply.error)
      audit = parseAudit(reply.text)
    } catch (error) { return { clean: false, rounds, supplemented, residualGaps: [`audit error: ${String(error)}`] } }
    if (audit.clean) return { clean: true, rounds, supplemented, residualGaps: [] }
    if (!audit.gapTasks.length) return { clean: false, rounds, supplemented, residualGaps: ['audit response invalid or missing gap tasks'] }
    residualGaps = audit.gapTasks
    for (const t of audit.gapTasks) {
      if (!deps.isAlive()) break
      try { deps.appendTask(t); await deps.runOnceFn(); supplemented++ } catch { /* 補足失敗不崩，續下一條 */ }
    }
  }
  return { clean: false, rounds, supplemented, residualGaps }
}
