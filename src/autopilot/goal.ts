export interface Goal {
  objective: string
  verifyCommand?: string
  engine?: string
  noProgressLimit: number
}

export function parseGoal(md: string): Goal {
  const lines = md.split(/\r?\n/)
  // objective：# GOAL 標題後到下一個 ## 之間的非空文字
  const objLines: string[] = []
  let inObjective = false
  for (const l of lines) {
    if (/^#\s+GOAL\b/i.test(l)) { inObjective = true; continue }
    if (/^##\s/.test(l)) inObjective = false
    if (inObjective && l.trim()) objLines.push(l.trim())
  }
  // verifyCommand：第一個 fenced code block 的內容（去空行後 join 成單指令串）
  let verifyCommand: string | undefined
  const fence = md.match(/```[a-z]*\n([\s\S]*?)```/i)
  if (fence) {
    const body = fence[1].split(/\r?\n/).map(s => s.trim()).filter(Boolean).join(' && ')
    if (body) verifyCommand = body
  }
  // engine：「引擎：xxx」
  const engineM = md.match(/引擎[：:]\s*([\w-]+)/)
  // noProgressLimit：「連續無進展上限：N」，預設 3
  const limM = md.match(/連續無進展上限[：:]\s*(\d+)/)
  return {
    objective: objLines.join(' '),
    verifyCommand,
    engine: engineM?.[1],
    noProgressLimit: limM ? Number(limM[1]) : 3
  }
}
