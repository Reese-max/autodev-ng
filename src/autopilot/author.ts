import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { resolve, sep, join } from 'node:path'
import type { Config } from '../types.js'
import type { RankedProblem } from './discover.js'
import { parseGoal } from './goal.js'

export type { RankedProblem }

export const AUTO_GOAL_MARKER = '<!-- adng:auto-goal'

// 首個非空行含標記 → 判定此 GOAL.md 為外環自動立案產物（非人工手寫）。
export function isAutoGoal(md: string): boolean {
  const firstLine = md.split(/\r?\n/).find(l => l.trim())
  return !!firstLine && firstLine.includes(AUTO_GOAL_MARKER)
}

function buildPrompt(problem: RankedProblem): string {
  const lines = [
    `問題：${problem.title}（視角：${problem.lens}）`,
    `理由：${problem.rationale}`,
    '請輸出兩段：',
    'OBJECTIVE: <目標描述，含完成定義>',
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

export async function authorGoal(
  chat: (prompt: string) => Promise<string>,
  problem: RankedProblem, cfg: Config, fingerprint: string
): Promise<string | null> {
  if (!cfg.verifyCommand) return null // 無機械驗收不立案

  const raw = await chat(buildPrompt(problem))
  const objMatch = raw.match(/OBJECTIVE:\s*([\s\S]*?)(?=\r?\nEVIDENCE:|$)/i)
  const objective = objMatch?.[1]?.trim()
  if (!objective) return null

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
    cfg.verifyCommand,
    '```',
    '',
    '連續無進展上限：2'
  ]
  if (evidenceFiles.length) {
    parts.push('', '## 佐證檔案', ...evidenceFiles.map(f => `- ${f}`))
  }
  const md = parts.join('\n') + '\n'

  // 組裝後回讀自驗：objective 非空、verifyCommand 逐字＝cfg.verifyCommand，不符回 null。
  const g = parseGoal(md)
  if (!g.objective || g.verifyCommand !== cfg.verifyCommand) return null
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
