import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { resolve, sep, join } from 'node:path'
import type { Config } from '../types.js'
import type { RankedProblem } from './discover.js'
import { parseGoal } from './goal.js'
import { runVerify } from '../verify.js'

export type { RankedProblem }

export const AUTO_GOAL_MARKER = '<!-- adng:auto-goal'

// 首個非空行含標記 → 判定此 GOAL.md 為外環自動立案產物（非人工手寫）。
export function isAutoGoal(md: string): boolean {
  const firstLine = md.split(/\r?\n/).find(l => l.trim())
  return !!firstLine && firstLine.includes(AUTO_GOAL_MARKER)
}

function buildPrompt(problem: RankedProblem, cfg: Config, fingerprint: string, northstar?: string): string {
  const lines = [
    `問題：${problem.title}（視角：${problem.lens}）`,
    `理由：${problem.rationale}`,
    ...(northstar ? [
      '先自檢北極星對齊（硬閘）：下方是本專案北極星價值判準全文。若此問題對不回任何一條判準',
      '——基建/測試/CI 類問題必須指出它「直接阻擋」哪一條使用者價值，指不出即對不回——',
      '不要輸出 OBJECTIVE，只輸出一行：REJECT: <一句理由>',
      `\n# 北極星價值判準\n${northstar}\n`
    ] : []),
    '請輸出三段：',
    'OBJECTIVE: <目標描述，含完成定義>',
    'VERIFY: <此案專屬驗收指令，單行>',
    `（由專案驗收工具鏈推導——現行全域驗收：${cfg.verifyCommand}——指向一個尚不存在的測試檔，` +
    `紅→綠；測試檔名須含「${fingerprint}」前綴避免撞名，例：tests/${fingerprint}-<slug>）`,
    'EVIDENCE:',
    '<每行一個佐證檔相對路徑，0~4 個，無則留空>'
  ]
  if (problem.lens === 'correctness') {
    // M10.2 §5.1 鉤子：先埋 prompt 措辭，M10.0 不啟用判讀邏輯。
    lines.push('第一步先寫 failing test 重現問題；若無法重現，回報 NOT-REPRODUCIBLE。')
  }
  return lines.join('\n')
}

// 佐證路徑圍欄：resolve 後必須落在 cfg.projectPath 內（鏡像 evaluator.ts gatherEvidence 的 prefix fence）＋ existsSync。
function isInProject(projectPath: string, rel: string): boolean {
  const base = resolve(projectPath)
  const abs = resolve(projectPath, rel)
  if (abs !== base && !abs.startsWith(base + sep)) return false
  return existsSync(abs)
}

export type RedCheckOutcome = 'red' | 'green' | 'broken'

export interface AuthorGateOpts {
  /** 紅燈檢查：執行候選驗收指令。red=非零退出（期望）、green=已綠（空洞）、broken=檢查故障。 */
  redCheck?: (command: string) => Promise<RedCheckOutcome>
  onEvent?: (type: string, data: Record<string, unknown>) => void
  /** 北極星價值判準全文（硬閘）：設定時 author 須先自檢對齊，對不回 → REJECT → 不立案。 */
  northstar?: string
}

// 預設紅燈檢查走 runVerify（沿用 verifyTimeoutMs；timeout/command-not-found 皆 skip → broken）。
async function defaultRedCheck(command: string, cfg: Config): Promise<RedCheckOutcome> {
  const o = await runVerify({ command, cwd: cfg.projectPath, timeoutMs: cfg.verifyTimeoutMs })
  return o.status === 'fail' ? 'red' : o.status === 'pass' ? 'green' : 'broken'
}

export async function authorGoal(
  chat: (prompt: string) => Promise<string>,
  problem: RankedProblem, cfg: Config, fingerprint: string,
  opts: AuthorGateOpts = {}
): Promise<string | null> {
  if (!cfg.verifyCommand) return null // 無機械驗收不立案
  // 觀測面故障不擋立案主流程
  const emit = (type: string, data: Record<string, unknown>): void => {
    try { opts.onEvent?.(type, data) } catch { /* ignore */ }
  }

  const raw = await chat(buildPrompt(problem, cfg, fingerprint, opts.northstar))
  // 北極星硬閘：首個非空行 REJECT → 不立案（回 null 走既有 per-candidate fail-open 通道）
  const firstLine = raw.split(/\r?\n/).map(l => l.trim()).find(Boolean) ?? ''
  if (opts.northstar && /^REJECT\b/i.test(firstLine)) {
    emit('author-northstar-reject', { fingerprint, title: problem.title, reason: firstLine.slice(0, 120) })
    return null
  }
  const objMatch = raw.match(/OBJECTIVE:\s*([\s\S]*?)(?=\r?\nVERIFY:|\r?\nEVIDENCE:|$)/i)
  let objective = objMatch?.[1]?.trim()
  if (!objective) return null

  // 專屬驗收 + 紅燈檢查。任何不合格/故障一律 fail-open 沿用全域 verifyCommand（現行為）。
  let verifyCommand = cfg.verifyCommand
  const candidate = raw.match(/^VERIFY:\s*(.+)$/im)?.[1]?.trim()
  if (candidate && candidate.includes(fingerprint)) {
    let outcome: RedCheckOutcome
    try {
      outcome = await (opts.redCheck ? opts.redCheck(candidate) : defaultRedCheck(candidate, cfg))
    } catch { outcome = 'broken' }
    emit('author-red-check', { fingerprint, outcome, command: candidate })
    if (outcome === 'red') {
      verifyCommand = candidate
    } else if (outcome === 'green') {
      // 候選驗收立案當下已綠＝空洞：改走 failing-test-first 協議
      verifyCommand = candidate
      objective = `首任務：先寫可重現問題的 failing test（紅燈），再實作轉綠。\n${objective}`
    }
  }

  const evMatch = raw.match(/EVIDENCE:\s*([\s\S]*)$/i)
  const evidenceFiles = (evMatch?.[1]?.split(/\r?\n/) ?? [])
    .map(l => l.trim())
    .filter(Boolean)
    .filter(f => isInProject(cfg.projectPath, f))

  const parts = [
    `${AUTO_GOAL_MARKER} problem:${fingerprint} -->`,
    '# GOAL',
    '',
    objective,
    '',
    '## 驗收',
    '',
    '```sh',
    verifyCommand,
    '```',
    '',
    '連續無進展上限：2'
  ]
  if (evidenceFiles.length) {
    parts.push('', '## 佐證檔案', ...evidenceFiles.map(f => `- ${f}`))
  }
  const md = parts.join('\n') + '\n'

  // 組裝後回讀自驗：全欄位 round-trip 比對模板原意，任一不符即代表 objective 夾帶注入內容，回 null。
  // （防注入：惡意 objective 文字裡塞「連續無進展上限：999」「引擎：xxx」或自帶「## 佐證檔案」段落，
  // parseGoal 對全文做首個符合正則抽取，會被覆蓋掉模板真正寫入的值）
  const expectedEvidence = evidenceFiles.length ? evidenceFiles : undefined
  const g = parseGoal(md)
  const lintReason =
    !g.objective ? 'objective-empty'
    : g.verifyCommand !== verifyCommand ? 'verify-command'
    : g.noProgressLimit !== 2 ? 'no-progress-limit'
    : g.engine !== undefined ? 'engine-injected'
    : JSON.stringify(g.evidenceFiles) !== JSON.stringify(expectedEvidence) ? 'evidence-files'
    : null
  if (lintReason) {
    emit('author-lint-reject', { fingerprint, reason: lintReason })
    return null
  }
  return md
}

export interface PerpetualState {
  lastSessionTs: string
  consecutiveEmpty: number
  currentCooldownMs: number
  manualGoalDone: string
}

function statePath(dataDir: string): string {
  return join(dataDir, 'perpetual-state.json')
}

// 檔缺失/損壞 → 預設值（fail-open）。
export function loadPerpetualState(dataDir: string, defaultCooldownMs: number): PerpetualState {
  const defaults: PerpetualState = { lastSessionTs: '', consecutiveEmpty: 0, currentCooldownMs: defaultCooldownMs, manualGoalDone: '' }
  try {
    const parsed = JSON.parse(readFileSync(statePath(dataDir), 'utf8')) as Partial<PerpetualState>
    return {
      lastSessionTs: parsed.lastSessionTs ?? defaults.lastSessionTs,
      consecutiveEmpty: parsed.consecutiveEmpty ?? defaults.consecutiveEmpty,
      currentCooldownMs: parsed.currentCooldownMs ?? defaults.currentCooldownMs,
      manualGoalDone: parsed.manualGoalDone ?? defaults.manualGoalDone
    }
  } catch {
    return defaults
  }
}

// tmp+rename 原子寫（同 digest.ts markDigestSent 慣例）。
export function savePerpetualState(dataDir: string, s: PerpetualState): void {
  const file = statePath(dataDir)
  const tmp = `${file}.tmp`
  writeFileSync(tmp, JSON.stringify(s))
  renameSync(tmp, file)
}
