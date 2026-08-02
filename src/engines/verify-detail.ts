const MAX_VERIFY_FAILURE_DETAIL_LENGTH = 1000
const ANSI_CONTROL_RE = /\u001B(?:\][\s\S]*?(?:\u0007|\u001B\\)|[PX^_][\s\S]*?\u001B\\|\[[0-?]*[ -/]*[@-~]|[@-_])/g
const FAILURE_LINE_RE = /FAIL|✗|×|AssertionError/
const TEST_SUMMARY_RE = /^\s*(?:Test Files|Tests)\b/

/** 將 verify 紅燈輸出收斂為可讀、可回饋給下一輪的 detail。 */
export function formatVerifyFailureDetail(stderr: string, stdout: string): string {
  const text = `${stderr}\n${stdout}`.replace(ANSI_CONTROL_RE, '').replace(/\r\n?/g, '\n').trim()
  if (!text) return ''

  const lines = text.split('\n')
  const failures = lines.flatMap((line, index) => FAILURE_LINE_RE.test(line) ? [index] : [])
  if (failures.length === 0) return text.slice(-MAX_VERIFY_FAILURE_DETAIL_LENGTH)

  const summaries = lines.flatMap((line, index) => TEST_SUMMARY_RE.test(line) ? [index] : [])
  const context = new Set<number>()
  for (const index of failures) {
    for (let offset = -1; offset <= 1; offset++) {
      if (index + offset >= 0 && index + offset < lines.length) context.add(index + offset)
    }
  }
  const render = (indices: Iterable<number>) => [...indices].sort((a, b) => a - b).map(index => lines[index]!).join('\n')
  const selected = new Set([...failures, ...summaries])
  const combined = render(new Set([...context, ...summaries]))
  if (combined.length <= MAX_VERIFY_FAILURE_DETAIL_LENGTH) return combined

  for (const index of context) {
    if (selected.has(index)) continue
    const candidate = new Set(selected).add(index)
    if (render(candidate).length <= MAX_VERIFY_FAILURE_DETAIL_LENGTH) selected.add(index)
  }
  const required = render(selected)
  if (required.length <= MAX_VERIFY_FAILURE_DETAIL_LENGTH) return required

  const summary = summaries.map(index => lines[index]!).join('\n')
  const available = MAX_VERIFY_FAILURE_DETAIL_LENGTH - summary.length - (summary ? 1 : 0)
  const failureLines = failures.map(index => lines[index]!)
  const perLine = Math.max(0, Math.floor((available - failureLines.length + 1) / failureLines.length))
  const failure = perLine > 0 ? failureLines.map(line => line.slice(0, perLine)).join('\n') : ''
  return [failure, summary]
    .filter(Boolean).join('\n').slice(0, MAX_VERIFY_FAILURE_DETAIL_LENGTH)
}
