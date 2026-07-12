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
