import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Task, TaskRisk } from '../types.js'
import { releaseEvidenceRequired } from './risk-policy.js'

export type GateStatus = 'pass' | 'fail' | 'blocked' | 'skip' | 'not-run' | 'not-applicable'
export interface GateEvidence {
  status: GateStatus
  identity?: string
  executionId?: string
  command?: string
  executed?: boolean
  exitCode?: number | null
  detail: string
}
export interface VerificationEvidence {
  candidateCommit: string
  ci: GateEvidence
  reviewer: GateEvidence
}
export interface EvidenceBundle {
  schemaVersion: 1
  executionId: string
  taskId: string
  taskText: string
  risk: TaskRisk
  candidateCommit: string
  writer: { identity: string }
  gates: { ci: GateEvidence; reviewer: GateEvidence; release: GateEvidence }
  verdict: 'ready' | 'blocked'
  recordedAt: string
}

export interface EvidenceReceipt { path: string; bundleHash: string; releaseBlocked?: string }

export class EvidenceStore {
  constructor(private readonly dataDir: string) {}

  /** A checked backlog row alone is not a delivery receipt. */
  verifiedTaskCommit(taskId: string, taskText: string): string | undefined {
    const dir = join(this.dataDir, 'evidence')
    if (!existsSync(dir)) return undefined
    const bundles = readdirSync(dir).filter(name => name.endsWith('.json')).map(name => {
      const { bundleHash, ...body } = JSON.parse(readFileSync(join(dir, name), 'utf8'))
      if (bundleHash !== createHash('sha256').update(JSON.stringify(body)).digest('hex')) throw new Error('Delivery evidence checksum mismatch')
      return { ...body, bundleHash }
    })
    return bundles.filter(b => b.taskId === taskId && b.taskText === taskText && b.verdict === 'ready'
      && /^[a-f0-9]{40,64}$/.test(b.candidateCommit ?? '') && b.gates?.ci?.status === 'pass'
      && b.gates.ci.executed === true && b.gates.ci.exitCode === 0 && b.gates?.reviewer?.status === 'pass'
      && bundles.some(m => m.taskId === taskId && m.executionId === b.executionId && m.mergedCommit === b.candidateCommit && m.gateBundleHash === b.bundleHash))
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0]?.candidateCommit
  }

  record(args: {
    executionId: string
    task: Task
    risk: TaskRisk
    writerIdentity: string
    verification: VerificationEvidence
    releaseApprovalFile?: string
  }): EvidenceReceipt {
    const release = releaseGate(args.task, args.verification.candidateCommit, args.releaseApprovalFile)
    const gates = { ci: args.verification.ci, reviewer: args.verification.reviewer, release }
    const bundle: EvidenceBundle = {
      schemaVersion: 1,
      executionId: args.executionId,
      taskId: args.task.id,
      taskText: args.task.text,
      risk: args.risk,
      candidateCommit: args.verification.candidateCommit,
      writer: { identity: args.writerIdentity },
      gates,
      verdict: [gates.ci, gates.reviewer, gates.release].some(g => ['fail', 'blocked', 'not-run'].includes(g.status)) ? 'blocked' : 'ready',
      recordedAt: new Date().toISOString(),
    }
    const canonical = JSON.stringify(bundle)
    const bundleHash = createHash('sha256').update(canonical).digest('hex')
    const dir = join(this.dataDir, 'evidence')
    mkdirSync(dir, { recursive: true })
    const safeCommit = args.verification.candidateCommit.replace(/[^a-f0-9]/gi, '').slice(0, 16) || 'unknown'
    const safeExecution = args.executionId.replace(/[^a-z0-9]/gi, '').slice(0, 12) || 'execution'
    const path = join(dir, `${args.task.id}-${safeCommit}-${safeExecution}.json`)
    const tmp = `${path}.${process.pid}.${randomUUID()}.tmp`
    writeFileSync(tmp, `${JSON.stringify({ ...bundle, bundleHash }, null, 2)}\n`)
    renameSync(tmp, path)
    return { path, bundleHash, ...(release.status === 'blocked' ? { releaseBlocked: release.detail } : {}) }
  }

  recordMerge(args: { executionId: string; taskId: string; mergedCommit: string }): EvidenceReceipt {
    const dir = join(this.dataDir, 'evidence')
    const safeExecution = args.executionId.replace(/[^a-z0-9]/gi, '').slice(0, 12) || 'execution'
    const gate = readdirSync(dir)
      .filter(name => name.startsWith(`${args.taskId}-`) && name.endsWith(`-${safeExecution}.json`))
      .map(name => ({ name, body: JSON.parse(readFileSync(join(dir, name), 'utf8')) as Record<string, unknown> }))
      .find(item => item.body.candidateCommit === args.mergedCommit && item.body.verdict === 'ready' && typeof item.body.bundleHash === 'string')
    if (!gate) throw new Error('no ready gate bundle matches merged commit')
    const receipt = {
      schemaVersion: 1, executionId: args.executionId, taskId: args.taskId,
      candidateCommit: args.mergedCommit, mergedCommit: args.mergedCommit,
      gateBundleHash: gate.body.bundleHash, recordedAt: new Date().toISOString(),
    }
    const canonical = JSON.stringify(receipt), bundleHash = createHash('sha256').update(canonical).digest('hex')
    const path = join(dir, `${args.taskId}-${args.mergedCommit.slice(0, 16)}-${safeExecution}-merge.json`)
    const tmp = `${path}.${process.pid}.${randomUUID()}.tmp`
    writeFileSync(tmp, `${JSON.stringify({ ...receipt, bundleHash }, null, 2)}\n`)
    renameSync(tmp, path)
    return { path, bundleHash }
  }
}

export function newExecutionId(): string { return randomUUID() }

function releaseGate(task: Task, candidateCommit: string, approvalFile?: string): GateEvidence {
  if (!releaseEvidenceRequired(task)) return { status: 'not-applicable', detail: 'task has no release intent' }
  if (!approvalFile || !existsSync(approvalFile)) return { status: 'blocked', detail: 'release approval missing' }
  try {
    const approval = JSON.parse(readFileSync(approvalFile, 'utf8')) as Record<string, unknown>
    if (approval.status !== 'approved' || approval.candidateCommit !== candidateCommit || typeof approval.approvedBy !== 'string' || !approval.approvedBy.trim()) {
      return { status: 'blocked', detail: 'release approval does not match candidate commit' }
    }
    return { status: 'pass', identity: approval.approvedBy, detail: 'human release approval matches candidate commit' }
  } catch {
    return { status: 'blocked', detail: 'release approval is invalid JSON' }
  }
}
