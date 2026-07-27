import type { Goal } from './goal.js'
import { callAgent, type LlmOpts } from './llm.js'
import { gatherEvidence } from './evaluator.js'
import { NORTHSTAR_HEADING } from './survey-sources.js'

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
  readRoiSummary?: () => string
  /** ledger 已處理清單（in-progress/fixed/deferred/rejected 的 title）：餵 critic 做語意去重。 */
  readHandledTitles?: () => string[]
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
/** 自 survey 抽出 NORTHSTAR 段落（置於「北極星價值判準」標頭與「其他勘查訊號」之間）。 */
export function northstarFromSurvey(survey: string): string {
  const header = `# ${NORTHSTAR_HEADING}\n`
  const start = survey.indexOf(header)
  if (start < 0) return ''
  const contentStart = start + header.length
  const end = survey.indexOf('\n\n# 其他勘查訊號', contentStart)
  return survey.slice(contentStart, end < 0 ? undefined : end).trim()
}

/**
 * critic 評審 prompt：排序主軸是 NORTHSTAR 價值判準（硬約束）；
 * 對齊者優先，與北極星無關的候選必須降權（不得排在高對齊候選之前）。
 */
export function criticPrompt(cands: Candidate[], northstar: string, roiSummary = '', handledTitles: readonly string[] = []): string {
  const body = cands.map(c => `[${c.lens}] ${c.title}｜${c.detail}`).join('\n')
  const roi = typeof roiSummary === 'string' ? roiSummary.trim() : ''
  const handled = handledTitles.filter(t => t && t.trim())
  return [
    '你是對抗式問題評審。以下是多視角候選問題。去重、挑戰每個（真問題嗎？夠高價值嗎？漏了更重要的嗎？）。',
    '【硬約束】排序主軸是北極星（NORTHSTAR）價值判準：候選問題必須依北極星價值判準排序（高對齊在前）。',
    '【硬約束】與北極星無關的候選降權：VALUE 應明顯偏低，且不得排在高對齊候選之前；理由需點明是否對回北極星。',
    '不得僅因語意相近或技術熱點把無關候選排在前面；對不回北極星價值判準者一律降權。',
    ...(roi ? [
      '【硬約束】依近期 ROI 史實調整候選排序：高成本低成果的 lens 降權，低成本且成果穩定的 lens 優先；理由需引用相關史實。',
      `\n# 近期已完成 goal ROI\n${roi}`
    ] : []),
    ...(handled.length ? [
      '【硬約束】下列問題近期已處理過或已卡住（ledger 記憶）：候選中與其語意等同者（含換句話說、換角度重述）一律 VALUE:0，理由標明 DUP 與對應舊案。',
      `\n# 已處理過或已卡住的問題\n${handled.map(t => `- ${t}`).join('\n')}`
    ] : []),
    '嚴格照格式，每行一問題（高價值在前）：VALUE:<0~10> | <標題> | <lens> | <一句理由>',
    '若逐一挑戰後認為沒有任何候選值得處理，只回一行 NONE。',
    `\n北極星價值判準：\n${northstar || '（無）'}`,
    `\n候選：\n${body || '（無）'}`
  ].join('\n')
}

export async function discoverProblems(deps: DiscoverDeps, goal: Goal, cwd: string): Promise<DiscoverResult> {
  let survey = ''
  if (deps.runSurvey) { try { survey = deps.runSurvey('', cwd).output } catch { survey = '' } }
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
    let roiSummary = ''
    try { roiSummary = deps.readRoiSummary?.() ?? '' } catch { /* fail-open */ }
    let handledTitles: string[] = []
    try { handledTitles = deps.readHandledTitles?.() ?? [] } catch { /* fail-open：失憶不擋 discovery */ }
    const text = (await callAgent(deps.criticLlm, criticPrompt(candidates, northstarFromSurvey(survey), roiSummary, handledTitles))).text.trim()
    const firstLine = text.split(/\r?\n/).map(l => l.trim()).find(Boolean) ?? ''
    if (/^NONE\b/i.test(firstLine)) vetoed = true
    else ranked = parseRanked(text)
  } catch { ranked = [] }
  if (!vetoed && ranked.length === 0 && candidates.length > 0) {
    ranked = candidates.map(c => ({ title: c.title, lens: c.lens, value: 5, rationale: 'critic 未評，原始候選' }))
  }
  return { survey, ranked }
}
