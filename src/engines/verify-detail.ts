import { stripVTControlCharacters } from 'node:util'

const MAX_VERIFY_FAILURE_DETAIL_LENGTH = 1000
const FAILURE_LINE_RE = /FAIL|✗|×|AssertionError|^\[flaky-regression\]/
const TEST_SUMMARY_RE = /^\s*(Test Files|Tests)\b/

/** 將 verify 紅燈輸出收斂為可讀、可回饋給下一輪的 detail。 */
export function formatVerifyFailureDetail(stderr: string, stdout: string): string {
  const text = stripVTControlCharacters(`${stderr}\n${stdout}`).replace(/\r\n?/g, '\n').trim()
  if (!text) return ''

  const lines = text.split('\n')
  const failures = lines.flatMap((line, index) => FAILURE_LINE_RE.test(line) ? [index] : [])
  if (failures.length === 0) return text.slice(-MAX_VERIFY_FAILURE_DETAIL_LENGTH)

  const summaryLines = new Set<number>()
  const lastSummary = new Map<string, number>()
  lines.forEach((line, index) => {
    const match = TEST_SUMMARY_RE.exec(line)
    if (match) {
      summaryLines.add(index)
      lastSummary.set(match[1]!, index)
    }
  })
  const summaries = [...lastSummary.values()].sort((a, b) => a - b)
  const context = new Set<number>()
  for (const index of failures) {
    for (let offset = -1; offset <= 1; offset++) {
      if (index + offset >= 0 && index + offset < lines.length) context.add(index + offset)
    }
  }
  const render = (indices: Iterable<number>) => [...indices].sort((a, b) => a - b).map(index => lines[index]!).join('\n')
  const summary = render(summaries)
  const compose = (indices: Iterable<number>) => [render([...indices].filter(index => !summaryLines.has(index))), summary].filter(Boolean).join('\n')
  const selected = new Set(failures.filter(index => !summaryLines.has(index)))
  const combined = compose(context)
  if (combined.length <= MAX_VERIFY_FAILURE_DETAIL_LENGTH) return combined

  for (const index of context) {
    if (selected.has(index) || summaryLines.has(index)) continue
    const candidate = new Set(selected).add(index)
    if (compose(candidate).length <= MAX_VERIFY_FAILURE_DETAIL_LENGTH) selected.add(index)
  }
  const required = compose(selected)
  if (required.length <= MAX_VERIFY_FAILURE_DETAIL_LENGTH) return required

  if (summary.length >= MAX_VERIFY_FAILURE_DETAIL_LENGTH) return summary.slice(-MAX_VERIFY_FAILURE_DETAIL_LENGTH)
  const available = MAX_VERIFY_FAILURE_DETAIL_LENGTH - summary.length - (summary ? 1 : 0)
  const failureLines = failures.filter(index => !summaryLines.has(index)).map(index => lines[index]!)
  const perLine = Math.max(0, Math.floor((available - failureLines.length + 1) / failureLines.length))
  const failure = perLine > 0 ? failureLines.map(line => line.slice(0, perLine)).join('\n') : ''
  return [failure, summary].filter(Boolean).join('\n')
}
