import { randomUUID } from 'node:crypto'
import { closeSync, fstatSync, mkdirSync, openSync, readSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

/**
 * Herdr launcher 結果契約 v1（issue #32）：完成回執由受信任 launcher 寫入 -ResultFile
 * 指定的 JSON 檔，宿主讀回並逐欄位綁定本次 request——不再把 stdout 字串當成功。
 * 此為關聯與重放防護，不建立加密身分；舊 launcher 無契約時由呼叫端明確報 unsupported。
 */
export const HERDR_RESULT_SCHEMA_VERSION = 1
/** 結果檔讀取上限：機器終態與人讀日誌分離，buffer 維持有界。 */
export const HERDR_RESULT_MAX_BYTES = 64_000

/** 送件前由宿主保存的預期綁定；結果回傳時逐欄位核對。 */
export interface HerdrExpectedBinding {
  schemaVersion: 1
  requestId: string
  executionId: string
  repo: string
  taskId: string
  baseCommit: string
  session: string
  launcher: string
  issuedAt: string
}

export interface HerdrResultContract {
  schemaVersion: 1
  requestId: string
  executionId: string
  repo: string
  taskId: string
  baseCommit: string
  server: string
  session: string
  pane: string
  status: 'done' | 'failed'
  /** 候選成果 commit；no-commit 政策下若提供必須等於 baseCommit。 */
  candidateCommit?: string
  detail?: string
}

export type HerdrResultFailureKind = 'missing' | 'invalid' | 'unsupported' | 'mismatch'
export type HerdrResultCheck =
  | { ok: true; result: HerdrResultContract }
  | { ok: false; kind: HerdrResultFailureKind; reason: string }

const bad = (kind: HerdrResultFailureKind, reason: string): HerdrResultCheck => ({ ok: false, kind, reason })

export function herdrResultPath(dir: string, requestId: string): string {
  return join(dir, `${requestId}.result.json`)
}

export function herdrExpectedPath(dir: string, requestId: string): string {
  return join(dir, `${requestId}.expected.json`)
}

/** 送件前原子保存預期綁定（tmp+rename，沿用 evidence-chain 寫法）。 */
export function writeHerdrExpected(dir: string, expected: HerdrExpectedBinding): string {
  mkdirSync(dir, { recursive: true })
  const path = herdrExpectedPath(dir, expected.requestId)
  const tmp = `${path}.${process.pid}.${randomUUID()}.tmp`
  writeFileSync(tmp, `${JSON.stringify(expected, null, 2)}\n`)
  renameSync(tmp, path)
  return path
}

/** 送件前清掉同 request 的殘留檔——舊回執不得被當成本次結果。 */
export function clearHerdrResult(path: string): void {
  rmSync(path, { force: true })
}

/** 嚴格解析 v1 結果契約：整檔必須是單一 JSON 物件，缺欄位／錯型別／未知 status 皆拒收。 */
export function parseHerdrResult(raw: string): HerdrResultCheck {
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return bad('invalid', '結果檔不是合法 JSON（截斷或混入非契約內容）')
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return bad('invalid', '結果檔不是 JSON 物件')
  const v = value as Record<string, unknown>
  if (v.schemaVersion === undefined) return bad('invalid', '結果缺少或型別錯誤：schemaVersion')
  if (v.schemaVersion !== HERDR_RESULT_SCHEMA_VERSION) {
    return bad('unsupported', `結果契約版本不受支援：${String(v.schemaVersion).slice(0, 20)}`)
  }
  for (const field of ['requestId', 'executionId', 'repo', 'taskId', 'baseCommit', 'server', 'session', 'pane'] as const) {
    if (typeof v[field] !== 'string' || !(v[field] as string).trim()) return bad('invalid', `結果缺少或型別錯誤：${field}`)
  }
  if (v.status !== 'done' && v.status !== 'failed') return bad('invalid', `結果 status 非契約值：${String(v.status).slice(0, 20)}`)
  if (v.candidateCommit !== undefined && (typeof v.candidateCommit !== 'string' || !v.candidateCommit.trim())) return bad('invalid', 'candidateCommit 型別錯誤')
  if (v.detail !== undefined && typeof v.detail !== 'string') return bad('invalid', 'detail 型別錯誤')
  return { ok: true, result: v as unknown as HerdrResultContract }
}

/** 讀回結果檔並逐欄位綁定本次 request；reason 只帶欄位名，不回洩檔案內容。
 * 同一 fd 上 fstat＋限量 read：檔案被換／長大也無法繞過大小上限。 */
export function checkHerdrResultFile(path: string, expected: HerdrExpectedBinding): HerdrResultCheck {
  let fd: number
  try {
    fd = openSync(path, 'r')
  } catch {
    return bad('missing', 'launcher 未寫入結果契約檔')
  }
  let raw: string
  try {
    const stat = fstatSync(fd)
    if (!stat.isFile() || stat.size <= 0) return bad('invalid', `結果檔大小異常：${stat.size} bytes`)
    const buf = Buffer.alloc(HERDR_RESULT_MAX_BYTES + 1)
    const n = readSync(fd, buf, 0, buf.length, 0)
    if (n > HERDR_RESULT_MAX_BYTES) return bad('invalid', `結果檔大小異常：超過 ${HERDR_RESULT_MAX_BYTES} bytes`)
    raw = buf.toString('utf8', 0, n)
  } finally {
    closeSync(fd)
  }
  const parsed = parseHerdrResult(raw)
  if (!parsed.ok) return parsed
  const r = parsed.result
  if (r.requestId !== expected.requestId) return bad('mismatch', 'requestId 與本次 request 不符')
  if (r.executionId !== expected.executionId) return bad('mismatch', 'executionId 與本次 request 不符')
  if (normalizeRepoPath(r.repo) !== normalizeRepoPath(expected.repo)) return bad('mismatch', 'repo 與本次 request 不符')
  if (r.taskId !== expected.taskId) return bad('mismatch', 'taskId 與本次 request 不符')
  if (r.baseCommit !== expected.baseCommit) return bad('mismatch', 'baseCommit 與本次 request 不符')
  if (r.session !== expected.session) return bad('mismatch', 'session 與本次 request 不符')
  if (r.candidateCommit !== undefined && r.candidateCommit !== expected.baseCommit) return bad('mismatch', 'candidateCommit 與本次 request 不符')
  return { ok: true, result: r }
}

function normalizeRepoPath(path: string): string {
  const normalized = resolve(path).replace(/\\/g, '/').replace(/\/+$/, '')
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized
}
