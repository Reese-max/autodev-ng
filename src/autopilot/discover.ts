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
  }).filter(c => c.title).slice(0, 5) // prompt 規定每鏡頭 0~5 條，解析端也硬界，避免單鏡頭灌爆候選池
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
function northstarFromSurvey(survey: string): string {
  const header = '# 北極星價值判準：NORTHSTAR.md\n'
  const start = survey.indexOf(header)
  if (start < 0) return ''
  const contentStart = start + header.length
  const end = survey.indexOf('\n\n# 其他勘查訊號', contentStart)
  return survey.slice(contentStart, end < 0 ? undefined : end).trim()
}

function criticPrompt(cands: Candidate[], northstar: string): string {
  const body = cands.map(c => `[${c.lens}] ${c.title}｜${c.detail}`).join('\n')
  return [
    '你是對抗式問題評審。以下是多視角候選問題。去重、挑戰每個（真問題嗎？夠高價值嗎？漏了更重要的嗎？），按修復價值排序。',
    '候選問題必須依北極星價值判準排序；與北極星無關的候選降權。',
    '嚴格照格式，每行一問題（高價值在前）：VALUE:<0~10> | <標題> | <lens> | <一句理由>',
    '若逐一挑戰後認為沒有任何候選值得處理，只回一行 NONE。',
    `\n北極星價值判準：\n${northstar || '（無）'}`,
    `\n候選：\n${body || '（無）'}`
  ].join('\n')
}

export async function discoverProblems(deps: DiscoverDeps, goal: Goal, cwd: string): Promise<DiscoverResult> {
  let survey = ''
  // 取尾部（錯誤/摘要通常在輸出尾端）——與 run.ts 的 execSync 輸出截長方向一致，避免頭尾互斬的 no-op
  if (deps.runSurvey) { try { survey = deps.runSurvey('', cwd).output.slice(-8000) } catch { survey = '' } }
  const evidence = gatherEvidence(goal.evidenceFiles, cwd, deps.readEvidence)
  const found = await Promise.all(deps.lenses.map(async (lens) => {
    try { return parseCandidates(lens, (await callAgent(deps.finderLlm, finderPrompt(lens, survey, evidence))).text.trim()) }
    catch { return [] as Candidate[] }
  }))
  const candidates = found.flat()
  // critic 結果三分支（對稱 finder 的 NONE 慣例）：
  //   ① 首個非空行 NONE → 合法否決：ranked 空且不退回候選（尊重 critic 的否決權）
  //   ② parseRanked 有結果 → 正常採用
  //   ③ throw/空回應/亂格式（無 VALUE 行且非 NONE）→ 故障：候選非空時退回原始候選（value 5），單點故障不白費整輪 discovery
  let ranked: RankedProblem[] = []
  let vetoed = false
  try {
    const text = (await callAgent(deps.criticLlm, criticPrompt(candidates, northstarFromSurvey(survey)))).text.trim()
    const firstLine = text.split(/\r?\n/).map(l => l.trim()).find(Boolean) ?? ''
    if (/^NONE\b/i.test(firstLine)) vetoed = true
    else ranked = parseRanked(text)
  } catch { ranked = [] }
  if (!vetoed && ranked.length === 0 && candidates.length > 0) {
    ranked = candidates.map(c => ({ title: c.title, lens: c.lens, value: 5, rationale: 'critic 未評，原始候選' }))
  }
  return { survey, ranked }
}
