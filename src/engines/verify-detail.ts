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
  const summarySet = new Set(summaries)
  const context = new Set<number>()
  for (const index of failures) {
    for (let offset = -1; offset <= 1; offset++) {
      if (index + offset >= 0 && index + offset < lines.length) context.add(index + offset)
    }
  }
  const excerpt = [...context].sort((a, b) => a - b).filter(index => !summarySet.has(index)).map(index => lines[index]!).join('\n')
  const summary = summaries.map(index => lines[index]!).join('\n')
  const combined = [excerpt, summary].filter(Boolean).join('\n')
  if (combined.length <= MAX_VERIFY_FAILURE_DETAIL_LENGTH) return combined

  const separator = excerpt && summary ? '\n' : ''
  const available = MAX_VERIFY_FAILURE_DETAIL_LENGTH - summary.length - separator.length
  return available > 0
    ? excerpt.slice(0, available) + separator + summary
    : summary.slice(-MAX_VERIFY_FAILURE_DETAIL_LENGTH)
}
