/**
 * ExecutionBackend run 的落盤存取層（<dataDir>/runs/<runId>/）。
 * state.json 走 zod 驗證＋atomic 寫；attempts.jsonl append-only；checkpoints/evidence
 * 各自一檔。所有讀取 fail-closed（schema parse），寫入失敗會上拋——run 狀態是真相來源。
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { writeJsonAtomic } from '../guardian/incident.js'
import {
  AttemptSchema,
  CheckpointSchema,
  InterruptSchema,
  RUN_ID_RE,
  RunStateSchema,
  type Attempt,
  type Checkpoint,
  type InterruptInstruction,
  type RunState,
} from './types.js'

export function runsRoot(dataDir: string): string {
  return join(dataDir, 'runs')
}

export function runDir(dataDir: string, runId: string): string {
  // RUN_ID_RE 只允許 [A-Za-z0-9_-]：不含 / . .. —— 不可能逃逸 runsRoot。
  if (!RUN_ID_RE.test(runId)) throw new Error(`Invalid run id: ${runId}`)
  return join(runsRoot(dataDir), runId)
}

export function initRunDir(dataDir: string, runId: string): string {
  const dir = runDir(dataDir, runId)
  if (existsSync(dir)) throw new Error(`run 已存在：${runId}`)
  mkdirSync(join(dir, 'checkpoints'), { recursive: true })
  mkdirSync(join(dir, 'evidence'), { recursive: true })
  return dir
}

export function saveState(dir: string, state: RunState, nowMs: number): void {
  state.updatedAt = new Date(nowMs).toISOString()
  const start = Date.parse(state.metrics.startedAt)
  const end = state.metrics.parkedAt ? Date.parse(state.metrics.parkedAt) : nowMs
  if (Number.isFinite(start) && Number.isFinite(end)) {
    state.metrics.activeMs = Math.max(0, end - start - state.metrics.blockedMs)
  }
  writeJsonAtomic(join(dir, 'state.json'), RunStateSchema.parse(state))
  const parkedMs = state.metrics.parkedAt ? Math.max(0, nowMs - Date.parse(state.metrics.parkedAt)) : 0
  writeJsonAtomic(join(dir, 'metrics.json'), {
    ...state.metrics, phase: state.phase, completed: state.phase === 'complete', parkedMs,
  })
}

export function readRunState(dataDir: string, runId: string): RunState {
  const dir = runDir(dataDir, runId)
  const file = join(dir, 'state.json')
  if (!existsSync(file)) throw new Error(`run 不存在：${runId}`)
  return RunStateSchema.parse(JSON.parse(readFileSync(file, 'utf8')))
}

export function appendAttempt(dir: string, attempt: Attempt): void {
  appendFileSync(join(dir, 'attempts.jsonl'), JSON.stringify(AttemptSchema.parse(attempt)) + '\n')
}

export function writeCheckpoint(dir: string, checkpoint: Checkpoint): void {
  writeJsonAtomic(join(dir, 'checkpoints', `${String(checkpoint.seq).padStart(4, '0')}.json`), CheckpointSchema.parse(checkpoint))
}

export function writeAttemptEvidence(dir: string, attempt: Attempt, execOutput: string, auditDetail: string): void {
  writeJsonAtomic(join(dir, 'evidence', `attempt-${String(attempt.round).padStart(4, '0')}-${attempt.outcome}.json`), {
    attempt,
    executorOutput: execOutput.slice(-4000),
    auditDetail: auditDetail.slice(0, 4000),
  })
}

export function writeInterrupt(dir: string, instruction: InterruptInstruction, at: string): void {
  writeJsonAtomic(join(dir, 'interrupt.json'), { ...instruction, at })
}

export function readAttempts(dir: string): Attempt[] {
  const file = join(dir, 'attempts.jsonl')
  if (!existsSync(file)) return []
  return readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).flatMap(line => {
    try { return [AttemptSchema.parse(JSON.parse(line))] } catch { return [] }
  })
}

export function readCheckpoints(dir: string): Checkpoint[] {
  const folder = join(dir, 'checkpoints')
  if (!existsSync(folder)) return []
  return readdirSync(folder).filter(name => name.endsWith('.json')).sort().flatMap(name => {
    try { return [CheckpointSchema.parse(JSON.parse(readFileSync(join(folder, name), 'utf8')))] } catch { return [] }
  })
}

/** 讀取並刪除 interrupt.json 哨兵；解析失敗視為保守的 pause（操作員意圖是「停下來」）。 */
export function takeInterrupt(dir: string): InterruptInstruction | undefined {
  const file = join(dir, 'interrupt.json')
  if (!existsSync(file)) return undefined
  try {
    return InterruptSchema.parse(JSON.parse(readFileSync(file, 'utf8')))
  } catch {
    return { kind: 'pause', note: 'unparseable interrupt.json' }
  } finally {
    try { rmSync(file, { force: true }) } catch { /* 移除失敗最多多看一次同一指令 */ }
  }
}

export function runStateDirs(dataDir: string): string[] {
  const root = runsRoot(dataDir)
  if (!existsSync(root)) return []
  return readdirSync(root).filter(name => RUN_ID_RE.test(name) && existsSync(join(root, name, 'state.json')))
}
