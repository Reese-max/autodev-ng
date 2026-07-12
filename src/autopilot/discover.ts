import type { Goal } from './goal.js'
import { callAgent, type LlmOpts } from './llm.js'
import { gatherEvidence } from './evaluator.js'

export interface Candidate { lens: string; title: string; detail: string }
export interface RankedProblem { title: string; lens: string; value: number; rationale: string }

// finder 回應：每行 <標題>｜<理由>（全形｜或半形|）；首個非空行 NONE → 空；無分隔→整行 title。
export function parseCandidates(lens: string, out: string): Candidate[] {
  const lines = out.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length === 0 || /^NONE\b/i.test(lines[0]!)) return []
  return lines.map(l => {
    const idx = l.search(/[｜|]/)
    if (idx < 0) return { lens, title: l, detail: '' }
    return { lens, title: l.slice(0, idx).trim(), detail: l.slice(idx + 1).trim() }
  }).filter(c => c.title)
}

// critic 回應：每行 VALUE:<n> | title | lens | rationale；夾 0~10；不符格式跳過。
export function parseRanked(out: string): RankedProblem[] {
  const ranked: RankedProblem[] = []
  for (const raw of out.split(/\r?\n/)) {
    const m = raw.match(/VALUE\s*[:：]\s*(\d+)\s*[|｜]\s*([^|｜]+?)\s*[|｜]\s*([^|｜]+?)\s*[|｜]\s*(.+)/i)
    if (!m) continue
    ranked.push({ value: Math.min(10, Math.max(0, Number(m[1]))), title: m[2]!.trim(), lens: m[3]!.trim(), rationale: m[4]!.trim() })
  }
  return ranked
}

export interface DiscoverDeps {
  finderLlm: LlmOpts
  criticLlm: LlmOpts
  runSurvey?: (cmd: string, cwd: string) => { output: string }
  readEvidence?: (absPath: string) => string
  lenses: string[]
}
export interface DiscoverResult { survey: string; ranked: RankedProblem[] }

function finderPrompt(lens: string, survey: string, evidence: string): string {
  return [
    `你是「${lens}」視角的問題發現者。只從「${lens}」角度，找出專案的具體問題（0~5 條，沒有回 NONE）。`,
    '每行一問題：<簡短標題>｜<一句證據/理由>',
    `\n# 勘查訊號\n${survey || '（無）'}`,
    `\n# 佐證檔案\n${evidence || '（無）'}`
  ].join('\n')
}
function criticPrompt(cands: Candidate[]): string {
  const body = cands.map(c => `[${c.lens}] ${c.title}｜${c.detail}`).join('\n')
  return [
    '你是對抗式問題評審。以下是多視角候選問題。去重、挑戰每個（真問題嗎？夠高價值嗎？漏了更重要的嗎？），按修復價值排序。',
    '嚴格照格式，每行一問題（高價值在前）：VALUE:<0~10> | <標題> | <lens> | <一句理由>',
    `\n候選：\n${body || '（無）'}`
  ].join('\n')
}

export async function discoverProblems(deps: DiscoverDeps, goal: Goal, cwd: string): Promise<DiscoverResult> {
  let survey = ''
  if (deps.runSurvey) { try { survey = deps.runSurvey('', cwd).output.slice(0, 8000) } catch { survey = '' } }
  const evidence = gatherEvidence(goal.evidenceFiles, cwd, deps.readEvidence)
  const found = await Promise.all(deps.lenses.map(async (lens) => {
    try { return parseCandidates(lens, (await callAgent(deps.finderLlm, finderPrompt(lens, survey, evidence))).text.trim()) }
    catch { return [] as Candidate[] }
  }))
  const candidates = found.flat()
  let ranked: RankedProblem[] = []
  try { ranked = parseRanked((await callAgent(deps.criticLlm, criticPrompt(candidates))).text.trim()) }
  catch { ranked = [] }
  return { survey, ranked }
}
