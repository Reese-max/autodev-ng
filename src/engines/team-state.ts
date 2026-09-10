import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import Database from 'better-sqlite3'
import type { Task } from '../types.js'
import { ownershipConflicts, ownershipManifest, type OwnershipManifest } from './ownership.js'

export type ClaimFailure = 'ownership-conflict' | 'cost-reserved' | 'quarantined' | 'attempt-cap'
export type ClaimResult = { ok: true; token: string } | { ok: false; reason: ClaimFailure; detail: string }

interface ActiveClaim { execution_id: string; task_id: string; manifest_json: string }

/** Git common-dir 內的 repo 級協調帳本；SQLite BEGIN IMMEDIATE 保證跨進程 admission 與 merge captain 唯一。 */
export class TeamState {
  readonly path: string
  private readonly db: Database.Database

  constructor(private readonly projectPath: string) {
    const raw = execFileSync('git', ['rev-parse', '--git-common-dir'], { cwd: projectPath, encoding: 'utf8', timeout: 10_000, windowsHide: true }).trim()
    const common = isAbsolute(raw) ? raw : resolve(projectPath, raw)
    this.path = join(common, 'autodev-ng', 'team.db')
    mkdirSync(dirname(this.path), { recursive: true })
    this.db = new Database(this.path)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('busy_timeout = 5000')
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS team_claims(
        execution_id TEXT PRIMARY KEY, task_id TEXT NOT NULL, worker_id TEXT NOT NULL,
        lease_token TEXT NOT NULL, manifest_json TEXT NOT NULL, ownership_hash TEXT NOT NULL,
        reserved_cost_usd REAL NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1,
        state TEXT NOT NULL, lease_until INTEGER NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS one_active_execution_per_task ON team_claims(task_id) WHERE active=1;
      CREATE TABLE IF NOT EXISTS team_attempts(execution_id TEXT PRIMARY KEY, worker_id TEXT NOT NULL, day TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS merge_queue(
        seq INTEGER PRIMARY KEY AUTOINCREMENT, execution_id TEXT NOT NULL UNIQUE, task_id TEXT NOT NULL,
        candidate_head TEXT NOT NULL, branch TEXT NOT NULL, worktree_path TEXT NOT NULL,
        state TEXT NOT NULL, merged_head TEXT, ready_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS team_leases(
        name TEXT PRIMARY KEY, holder_execution_id TEXT NOT NULL, lease_token TEXT NOT NULL,
        lease_until INTEGER NOT NULL, updated_at TEXT NOT NULL
      );
    `)
  }

  claim(args: {
    executionId: string; task: Task; workerId: string; reservedCostUsd: number
    spentUsd: number; dailyHardUsd: number; leaseMs: number; dailyAttemptCap?: number; reviewOnly?: boolean
  }): ClaimResult {
    const manifest = ownershipManifest(args.task, this.projectPath)
    return this.db.transaction(() => {
      const day = new Date().toISOString().slice(0, 10)
      if (!args.reviewOnly && args.dailyAttemptCap !== undefined) {
        if (!Number.isSafeInteger(args.dailyAttemptCap) || args.dailyAttemptCap <= 0) throw new Error('Invalid dailyAttemptCap')
        const used = this.attemptsToday(args.workerId, day)
        if (used >= args.dailyAttemptCap) return { ok: false, reason: 'attempt-cap', detail: `UTC ${day}: ${args.workerId} admitted ${used}/${args.dailyAttemptCap}; wait for next day` } as const
      }
      this.reapExpired(Date.now())
      const quarantined = this.db.prepare("SELECT 1 FROM team_claims WHERE task_id=? AND state='QUARANTINED' UNION ALL SELECT 1 FROM merge_queue WHERE task_id=? AND state IN ('QUARANTINED','PAUSED_READY') LIMIT 1").get(args.task.id, args.task.id)
      if (quarantined) return { ok: false, reason: 'quarantined', detail: 'previous execution expired; worktree requires manual recovery' } as const
      const active = this.db.prepare("SELECT execution_id, task_id, manifest_json FROM team_claims WHERE active=1 OR state='QUARANTINED'").all() as ActiveClaim[]
      for (const row of active) {
        const other = JSON.parse(row.manifest_json) as OwnershipManifest
        if (ownershipConflicts(manifest, other)) return { ok: false, reason: 'ownership-conflict', detail: `conflicts with ${row.task_id}` } as const
      }
      const reserved = (this.db.prepare("SELECT COALESCE(SUM(reserved_cost_usd),0) AS n FROM team_claims WHERE active=1 OR state='QUARANTINED'").get() as { n: number }).n
      if (args.dailyHardUsd > 0 && args.spentUsd + reserved + args.reservedCostUsd > args.dailyHardUsd) {
        return { ok: false, reason: 'cost-reserved', detail: `spent ${args.spentUsd} + reserved ${reserved + args.reservedCostUsd} > hard ${args.dailyHardUsd}` } as const
      }
      const token = randomUUID(), now = new Date().toISOString()
      if (!args.reviewOnly) this.db.prepare('INSERT INTO team_attempts(execution_id,worker_id,day) VALUES (?,?,?)').run(args.executionId, args.workerId, day)
      this.db.prepare(`INSERT INTO team_claims(
        execution_id,task_id,worker_id,lease_token,manifest_json,ownership_hash,reserved_cost_usd,active,state,lease_until,updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
        args.executionId, args.task.id, args.workerId, token, JSON.stringify(manifest), manifest.hash,
        args.reservedCostUsd, 1, 'RUNNING', Date.now() + args.leaseMs, now,
      )
      return { ok: true, token } as const
    }).immediate()
  }

  attemptsToday(workerId: string, day = new Date().toISOString().slice(0, 10)): number {
    return (this.db.prepare('SELECT COUNT(*) n FROM team_attempts WHERE worker_id=? AND day=?').get(workerId, day) as { n: number }).n
  }

  heartbeat(executionId: string, token: string, leaseMs: number): boolean {
    return this.db.prepare("UPDATE team_claims SET lease_until=?,updated_at=? WHERE execution_id=? AND lease_token=? AND active=1").run(
      Date.now() + leaseMs, new Date().toISOString(), executionId, token,
    ).changes === 1
  }

  release(executionId: string, token: string): void {
    this.db.prepare("UPDATE team_claims SET active=0,state='RELEASED',updated_at=? WHERE execution_id=? AND lease_token=? AND active=1").run(new Date().toISOString(), executionId, token)
  }

  quarantine(executionId: string, token: string): void {
    this.db.prepare("UPDATE team_claims SET state='QUARANTINED',updated_at=? WHERE execution_id=? AND lease_token=? AND active=1").run(new Date().toISOString(), executionId, token)
  }

  enqueue(args: { executionId: string; token: string; taskId: string; candidateHead: string; branch: string; worktreePath: string }): void {
    this.db.transaction(() => {
      const claim = this.db.prepare('SELECT 1 FROM team_claims WHERE execution_id=? AND lease_token=? AND active=1').get(args.executionId, args.token)
      if (!claim) throw new Error('merge queue enqueue refused: inactive ownership lease')
      const prior = this.db.prepare('SELECT candidate_head FROM merge_queue WHERE execution_id=?').get(args.executionId) as { candidate_head: string } | undefined
      if (prior && prior.candidate_head !== args.candidateHead) throw new Error('merge queue enqueue refused: candidate changed')
      if (prior) return
      const now = new Date().toISOString()
      this.db.prepare('INSERT INTO merge_queue(execution_id,task_id,candidate_head,branch,worktree_path,state,ready_at,updated_at) VALUES (?,?,?,?,?,?,?,?)').run(
        args.executionId, args.taskId, args.candidateHead, args.branch, args.worktreePath, 'READY', now, now,
      )
    }).immediate()
  }

  pauseCandidate(args: { executionId: string; token: string; taskId: string; candidateHead: string; branch: string; worktreePath: string }): void {
    this.enqueue(args)
    this.db.prepare("UPDATE merge_queue SET state='PAUSED_READY',updated_at=? WHERE execution_id=?").run(new Date().toISOString(), args.executionId)
  }

  async withMergeTurn<T>(executionId: string, token: string, timeoutMs: number, fn: () => T | Promise<T>): Promise<T> {
    const leaseMs = Math.max(30_000, Math.min(timeoutMs, 5 * 60_000))
    const deadline = Date.now() + timeoutMs
    while (!this.acquireMergeCaptain(executionId, token, leaseMs)) {
      if (Date.now() >= deadline) throw new Error(`merge queue timeout ${timeoutMs}ms`)
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    const timer = setInterval(() => this.renewMergeCaptain(executionId, token, leaseMs), Math.max(1_000, Math.floor(leaseMs / 3)))
    timer.unref?.()
    try { return await fn() } finally {
      clearInterval(timer)
      this.db.prepare("DELETE FROM team_leases WHERE name='merge-captain' AND holder_execution_id=? AND lease_token=?").run(executionId, token)
    }
  }

  finishMerge(executionId: string, merged: boolean, mergedHead?: string, state?: 'PAUSED_READY'): void {
    this.db.prepare('UPDATE merge_queue SET state=?,merged_head=?,updated_at=? WHERE execution_id=?').run(
      state ?? (merged ? 'DONE' : 'BLOCKED'), mergedHead ?? null, new Date().toISOString(), executionId,
    )
  }

  snapshot(): { claims: Array<Record<string, unknown>>; queue: Array<Record<string, unknown>> } {
    return {
      claims: this.db.prepare('SELECT execution_id,task_id,active,state,ownership_hash FROM team_claims ORDER BY rowid').all() as Array<Record<string, unknown>>,
      queue: this.db.prepare('SELECT seq,execution_id,task_id,candidate_head,state,merged_head FROM merge_queue ORDER BY seq').all() as Array<Record<string, unknown>>,
    }
  }

  close(): void { this.db.close() }

  private acquireMergeCaptain(executionId: string, token: string, leaseMs: number): boolean {
    return this.db.transaction(() => {
      this.reapExpired(Date.now())
      const own = this.db.prepare("SELECT seq,state FROM merge_queue WHERE execution_id=? AND state IN ('READY','MERGING')").get(executionId) as { seq: number; state: string } | undefined
      const first = this.db.prepare("SELECT seq,execution_id FROM merge_queue WHERE state IN ('READY','MERGING') ORDER BY seq LIMIT 1").get() as { seq: number; execution_id: string } | undefined
      if (!own || first?.execution_id !== executionId) return false
      const claim = this.db.prepare('SELECT 1 FROM team_claims WHERE execution_id=? AND lease_token=? AND active=1').get(executionId, token)
      if (!claim) return false
      const captain = this.db.prepare("SELECT holder_execution_id FROM team_leases WHERE name='merge-captain'").get() as { holder_execution_id: string } | undefined
      if (captain && captain.holder_execution_id !== executionId) return false
      const now = new Date().toISOString()
      this.db.prepare("INSERT INTO team_leases(name,holder_execution_id,lease_token,lease_until,updated_at) VALUES ('merge-captain',?,?,?,?) ON CONFLICT(name) DO UPDATE SET holder_execution_id=excluded.holder_execution_id,lease_token=excluded.lease_token,lease_until=excluded.lease_until,updated_at=excluded.updated_at").run(executionId, token, Date.now() + leaseMs, now)
      this.db.prepare("UPDATE merge_queue SET state='MERGING',updated_at=? WHERE execution_id=?").run(now, executionId)
      return true
    }).immediate()
  }

  private renewMergeCaptain(executionId: string, token: string, leaseMs: number): void {
    try {
      this.db.prepare("UPDATE team_leases SET lease_until=?,updated_at=? WHERE name='merge-captain' AND holder_execution_id=? AND lease_token=?").run(Date.now() + leaseMs, new Date().toISOString(), executionId, token)
    } catch { /* 下一次 queue 操作會依 lease fail-closed */ }
  }

  private reapExpired(nowMs: number): void {
    const expired = this.db.prepare('SELECT execution_id FROM team_claims WHERE active=1 AND lease_until<?').all(nowMs) as { execution_id: string }[]
    for (const row of expired) {
      this.db.prepare("UPDATE team_claims SET active=0,state='QUARANTINED',updated_at=? WHERE execution_id=?").run(new Date().toISOString(), row.execution_id)
      this.db.prepare("UPDATE merge_queue SET state='QUARANTINED',updated_at=? WHERE execution_id=? AND state IN ('READY','MERGING')").run(new Date().toISOString(), row.execution_id)
    }
    const expiredCaptain = this.db.prepare("SELECT holder_execution_id FROM team_leases WHERE name='merge-captain' AND lease_until<?").get(nowMs) as { holder_execution_id: string } | undefined
    if (expiredCaptain) {
      this.db.prepare("UPDATE merge_queue SET state='READY',updated_at=? WHERE execution_id=? AND state='MERGING'").run(new Date().toISOString(), expiredCaptain.holder_execution_id)
      this.db.prepare("DELETE FROM team_leases WHERE name='merge-captain'").run()
    }
  }
}
