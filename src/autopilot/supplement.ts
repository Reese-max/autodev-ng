import type { Goal } from './goal.js'
import { callAgent, type LlmOpts } from './llm.js'
import { gatherEvidence } from './evaluator.js'

// M9.6 verify-and-supplement 階段：autopilot 回 achieved 後的對抗式獨立驗證＋補足。
// 獨立性三支柱：換模型（auditLlm 異於 judgeModel）＋對抗式 framing＋機械接地（跑 verifyCommand）。
// fail-open 為最高原則：本階段是加值，任一環節故障都保留已達成成果、絕不反殺。

export interface AuditResult { clean: boolean; gapTasks: string[] }

// 解析對抗式稽核回應：GAPS 段後每行一任務（可帶 - 前綴）；無 GAPS 或無任務 = clean（fail-open）。
export function parseAudit(out: string): AuditResult {
  const lines = out.split(/\r?\n/)
  const gapsIdx = lines.findIndex(l => /^\s*GAPS\b/i.test(l))
  if (gapsIdx < 0) return { clean: true, gapTasks: [] }
  const gapTasks = lines.slice(gapsIdx + 1).map(l => l.trim().replace(/^-\s*/, '')).filter(Boolean)
  return { clean: gapTasks.length === 0, gapTasks }
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
  runVerify?: (cmd: string, cwd: string) => { exitCode: number; passed: number; output?: string }
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
    // 機械接地：跑 verifyCommand，輸出併入稽核 prompt（fail-open：verify 崩不擋稽核）。
    let verifyOut = ''
    if (goal.verifyCommand && deps.runVerify) {
      try {
        const r = deps.runVerify(goal.verifyCommand, cwd)
        verifyOut = `exit=${r.exitCode} passed=${r.passed}\n${r.output ?? ''}`.trim()
      } catch { /* fail-open */ }
    }
    const evidence = gatherEvidence(goal.evidenceFiles, cwd, deps.readEvidence)
    // 對抗式稽核（fail-open：audit LLM 錯或亂格式 → 視為 clean，不憑空生任務、不反殺成果）。
    let audit: AuditResult
    try {
      const out = (await callAgent(deps.auditLlm, buildAuditPrompt(goal, evidence, verifyOut))).text.trim()
      audit = parseAudit(out)
    } catch { audit = { clean: true, gapTasks: [] } }
    if (audit.clean) return { clean: true, rounds, supplemented, residualGaps: [] }
    residualGaps = audit.gapTasks
    for (const t of audit.gapTasks) {
      if (!deps.isAlive()) break
      try { deps.appendTask(t); await deps.runOnceFn(); supplemented++ } catch { /* 補足失敗不崩，續下一條 */ }
    }
  }
  return { clean: false, rounds, supplemented, residualGaps }
}
