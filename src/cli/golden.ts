/**
 * CLI 搬移前後 golden / 快照比對（stdout、stderr、exit code 逐位元）。
 * 純函式：可直接餵 capture，不依賴 process / fs。
 */

/** 公開 CLI 子指令白名單（與 entry 分派一致）。 */
export const PUBLIC_CLI_COMMANDS = [
  'status',
  'run-once',
  'daemon',
  'notify-test',
  'supervise',
] as const

export type PublicCliCommand = (typeof PUBLIC_CLI_COMMANDS)[number]

/** 一次 CLI 呼叫的可序列化快照。 */
export interface CliGoldenCapture {
  stdout: string
  stderr: string
  exitCode: number
}

/** 逐位元比對結果。 */
export interface CliGoldenDiff {
  equal: boolean
  field: 'stdout' | 'stderr' | 'exitCode' | null
  expected: string | number
  actual: string | number
}

const ISO_RE = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g

/** console.log / error 的輸出合成為 CLI 實際位元組（每次呼叫尾端皆有 \n）。 */
export function joinCapturedLines(lines: readonly string[]): string {
  return lines.map(line => `${line}\n`).join('')
}

/** 由 captureCli 的 lines + exitCode 組成 golden capture。 */
export function toCliCapture(
  stdoutLines: readonly string[],
  stderrLines: readonly string[],
  exitCode: number,
): CliGoldenCapture {
  return {
    stdout: joinCapturedLines(stdoutLines),
    stderr: joinCapturedLines(stderrLines),
    exitCode,
  }
}

/** UTF-8 逐位元相等（含空字串、多位元組中文）。 */
export function bytesEqual(a: string, b: string): boolean {
  return Buffer.from(a, 'utf8').equals(Buffer.from(b, 'utf8'))
}

/**
 * 逐位元比對 stdout、stderr、exitCode。
 * 任一塊不同即 equal=false，並標出第一個不符欄位。
 */
export function diffCliCaptures(actual: CliGoldenCapture, expected: CliGoldenCapture): CliGoldenDiff {
  if (!bytesEqual(actual.stdout, expected.stdout)) {
    return { equal: false, field: 'stdout', expected: expected.stdout, actual: actual.stdout }
  }
  if (!bytesEqual(actual.stderr, expected.stderr)) {
    return { equal: false, field: 'stderr', expected: expected.stderr, actual: actual.stderr }
  }
  if (actual.exitCode !== expected.exitCode) {
    return { equal: false, field: 'exitCode', expected: expected.exitCode, actual: actual.exitCode }
  }
  return { equal: true, field: null, expected: '', actual: '' }
}

/** 不相等時丟錯，訊息含欄位與 expected/actual。 */
export function assertCliCapturesEqual(actual: CliGoldenCapture, expected: CliGoldenCapture): void {
  const d = diffCliCaptures(actual, expected)
  if (d.equal) return
  throw new Error(
    `CLI golden 不符 field=${d.field}\nexpected: ${JSON.stringify(d.expected)}\nactual:   ${JSON.stringify(d.actual)}`,
  )
}

/**
 * 穩定化 volatile 片段，使可重跑的 golden 仍可逐位元比對：
 * - ISO-8601 時刻 → `<ISO>`
 * - 指定路徑根（含 / 與 \\ 變體）→ `<ROOT>`
 */
export function stabilizeCliCapture(
  capture: CliGoldenCapture,
  pathRoots: readonly string[] = [],
): CliGoldenCapture {
  let stdout = capture.stdout.replace(ISO_RE, '<ISO>')
  let stderr = capture.stderr.replace(ISO_RE, '<ISO>')
  for (const root of pathRoots) {
    if (!root) continue
    const variants = uniquePathVariants(root)
    for (const v of variants) {
      stdout = stdout.split(v).join('<ROOT>')
      stderr = stderr.split(v).join('<ROOT>')
    }
  }
  return { stdout, stderr, exitCode: capture.exitCode }
}

function uniquePathVariants(root: string): string[] {
  const out: string[] = []
  const push = (s: string) => {
    if (s && !out.includes(s)) out.push(s)
  }
  push(root)
  push(root.replace(/\\/g, '/'))
  push(root.replace(/\//g, '\\'))
  // Windows resolve 可能給出不同大小寫磁碟代號
  if (/^[a-zA-Z]:/.test(root)) {
    push(root[0]!.toUpperCase() + root.slice(1))
    push(root[0]!.toLowerCase() + root.slice(1))
    push((root[0]!.toUpperCase() + root.slice(1)).replace(/\\/g, '/'))
    push((root[0]!.toLowerCase() + root.slice(1)).replace(/\\/g, '/'))
  }
  // 長路徑先替換，避免短前綴誤傷：依長度降序
  return out.sort((a, b) => b.length - a.length)
}

/** 序列化為可落盤的 canonical JSON（鍵序固定）。 */
export function serializeCliCapture(capture: CliGoldenCapture): string {
  return JSON.stringify(
    { exitCode: capture.exitCode, stdout: capture.stdout, stderr: capture.stderr },
    null,
    2,
  ) + '\n'
}

/** 解析 serializeCliCapture 產物。 */
export function parseCliCapture(raw: string): CliGoldenCapture {
  const parsed: unknown = JSON.parse(raw)
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('CLI golden JSON 必須是物件')
  }
  const o = parsed as Record<string, unknown>
  if (typeof o.stdout !== 'string' || typeof o.stderr !== 'string' || typeof o.exitCode !== 'number') {
    throw new Error('CLI golden JSON 缺 stdout/stderr/exitCode 或型別錯誤')
  }
  if (!Number.isInteger(o.exitCode)) {
    throw new Error('CLI golden exitCode 必須為整數')
  }
  return { stdout: o.stdout, stderr: o.stderr, exitCode: o.exitCode }
}

/** 判定字串是否為公開子指令名稱。 */
export function isPublicCliCommand(cmd: string): cmd is PublicCliCommand {
  return (PUBLIC_CLI_COMMANDS as readonly string[]).includes(cmd)
}
