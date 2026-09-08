import { runProcess } from '../engines/proc.js'
import { readFileSync } from 'node:fs'
import { resolve, sep } from 'node:path'
import type { Goal } from './goal.js'
import { callAgent, type LlmOpts } from './llm.js'

export interface ProgressSnapshot { achieved: boolean; score: number; detail: string }
export interface GoalVerification { exitCode: number; passed: number; output?: string }
export interface EvalDeps {
  llm: LlmOpts
  verifyTimeoutMs?: number
  runVerify?: (cmd: string, cwd: string) => GoalVerification | Promise<GoalVerification>
  // 品質類目標（無 verifyCommand）用：讀佐證檔內容餵判定 LLM。可注入以利測試，預設 readFileSync。
  readEvidence?: (absPath: string) => string
}

// 預設 verify 執行：非零 exit 不 throw；passed = 從輸出數 "pass"/"passing" 的粗略計數（沙盒足夠）
export async function runGoalVerify(cmd: string, cwd: string, timeoutMs = 15 * 60_000): Promise<GoalVerification> {
  const windows = process.platform === 'win32'
  // cmd at stdin EOF returns zero; explicitly preserve the command's errorlevel.
  const r = await runProcess({ command: windows ? 'cmd.exe' : '/bin/sh', args: windows ? ['/d', '/q'] : [], cwd,
    stdinText: cmd + (windows ? '\r\nexit %errorlevel%\r\n' : '\n'), timeoutMs })
  const exitCode = r.timedOut ? 1 : r.exitCode ?? 1, m = r.stdout.match(/(\d+)\s+pass/i)
  return { exitCode, passed: m ? Number(m[1]) : exitCode === 0 ? 1 : 0,
    output: (r.timedOut ? `verification timed out after ${timeoutMs}ms` : r.stdout + r.stderr).slice(-2000) }
}

export async function evaluate(deps: EvalDeps, goal: Goal, cwd: string): Promise<ProgressSnapshot> {
  if (goal.verifyCommand) {
    const run = deps.runVerify ?? ((cmd, wd) => runGoalVerify(cmd, wd, deps.verifyTimeoutMs))
    try {
      const { exitCode, passed } = await run(goal.verifyCommand, cwd)
      return { achieved: exitCode === 0, score: passed, detail: `verify exit=${exitCode} passed=${passed}` }
    } catch (err) {
      return { achieved: false, score: 0, detail: `verify error: ${String(err).slice(0, 120)}` }
    }
  }
  // 無可量測條件的 LLM 判定。無佐證檔＝沿用原簡易判定（向後相容：行為與本功能前逐字一致，
  // 舊式品質目標不受新 SCORE 格式影響，score 仍為 achieved?1:0）。
  if (!goal.evidenceFiles?.length) {
    const out = (await callAgent(deps.llm,
      `目標：${goal.objective}\n判斷是否已達成，達成回 ACHIEVED，否則回 NOT-YET 並簡述缺口。`)).text.trim()
    const achieved = /^ACHIEVED\b/i.test(out) && !/\bNOT[\s-]*(?:YET|ACHIEVED)\b/i.test(out)
    return { achieved, score: achieved ? 1 : 0, detail: out.slice(0, 200) || 'agent 無回應' }
  }
  // informed 判定（有佐證檔）：讀檔內容餵 judge，回 0~10 品質分 + 達成與否
  // （fail-open：讀不到/越界的檔跳過、亂格式或空回應 = 未達成 score 0）。
  const evidence = gatherEvidence(goal.evidenceFiles, cwd, deps.readEvidence)
  const prompt = [
    `目標：${goal.objective}`,
    `\n以下是佐證檔案內容，據此判斷目標達成程度：\n${evidence}`,
    '\n嚴格照格式回答：',
    'SCORE: <0~10 整數，達成品質分>',
    '<ACHIEVED 或 NOT-YET>',
    '<一句話說明缺口或已達成理由>'
  ].join('\n')
  const out = (await callAgent(deps.llm, prompt)).text.trim()
  const scoreM = out.match(/SCORE[：:]\s*(\d+)/i)
  const score = scoreM ? Math.min(10, Math.max(0, Number(scoreM[1]))) : 0
  // 保守判達成：出現 ACHIEVED 且無任何否定式（NOT-YET / NOT YET / NOT ACHIEVED …）。
  const achieved = !!scoreM && /^ACHIEVED\s*$/im.test(out) && !/\bNOT[\s-]*(?:YET|ACHIEVED)\b/i.test(out)
  return { achieved, score, detail: out.slice(0, 200) || 'agent 無回應' }
}

// 讀佐證檔給判定 LLM：每檔上限 8000 字元、總上限 24000 字元（硬上限，累加後夾裁），
// 讀不到或路徑逃出 cwd 的檔一律跳過並註記（fail-open，防路徑穿越外洩）。
// export 供 supplement.ts 的對抗式稽核複用同一套讀檔+路徑圍欄。
export function gatherEvidence(files: string[] | undefined, cwd: string,
  read: ((p: string) => string) | undefined): string {
  if (!files?.length) return ''
  const reader = read ?? ((p: string) => readFileSync(p, 'utf8'))
  const base = resolve(cwd)
  const parts: string[] = []
  let total = 0
  for (const f of files) {
    if (total >= 24_000) { parts.push('（其餘佐證檔略過：總量已達上限）'); break }
    try {
      const abs = resolve(cwd, f)
      if (abs !== base && !abs.startsWith(base + sep)) throw new Error('path escapes cwd')
      let body = reader(abs)
      const cap = Math.min(8_000, 24_000 - total)
      if (body.length > cap) body = body.slice(0, cap) + '\n…（截斷）'
      total += body.length
      parts.push(`--- ${f} ---\n${body}`)
    } catch {
      parts.push(`--- ${f} ---\n（讀取失敗或路徑越界，略過）`)
    }
  }
  return parts.join('\n\n')
}
