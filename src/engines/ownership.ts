import { createHash } from 'node:crypto'
import { isAbsolute } from 'node:path'
import { execFileSync } from 'node:child_process'
import type { Task } from '../types.js'

export interface OwnershipManifest { write: string[]; resources: string[]; global: boolean; hash: string }

export function ownershipManifest(task: Task): OwnershipManifest {
  const declared = task.ownership
  const write = declared?.write.map(normalizePath).filter((p): p is string => p !== undefined) ?? []
  const resources = declared?.resources.map(r => r.trim().toLowerCase()).filter(r => /^[a-z0-9][a-z0-9._:-]{0,127}$/i.test(r)) ?? []
  const invalid = !declared || write.length !== declared.write.length || resources.length !== declared.resources.length || write.length + resources.length === 0
  const canonical = invalid ? { write: ['*'], resources: [] as string[], global: true } : { write: [...new Set(write)].sort(), resources: [...new Set(resources)].sort(), global: false }
  return { ...canonical, hash: createHash('sha256').update(JSON.stringify(canonical)).digest('hex') }
}

export function ownershipConflicts(a: OwnershipManifest, b: OwnershipManifest): boolean {
  if (a.global || b.global) return true
  if (a.resources.some(r => b.resources.includes(r))) return true
  return a.write.some(x => b.write.some(y => overlaps(x, y)))
}

export function changedPaths(nameStatus: string): string[] {
  const out: string[] = []
  for (const line of nameStatus.split(/\r?\n/).filter(Boolean)) {
    const [, ...paths] = line.split('\t')
    for (const path of paths) {
      const normalized = normalizePath(path)
      if (normalized) out.push(normalized.replace(/\/$/, ''))
    }
  }
  return [...new Set(out)]
}

export function ownershipDrift(task: Task, nameStatus: string): string[] {
  const manifest = ownershipManifest(task)
  if (manifest.global) return []
  return changedPaths(nameStatus).filter(path => !manifest.write.some(scope => covers(scope, path)))
}

export function checkOwnership(cwd: string, task: Task, baseCommit?: string, candidateCommit?: string): { ok: true } | { ok: false; detail: string } {
  const manifest = ownershipManifest(task)
  if (manifest.global) return { ok: true }
  if (!baseCommit || !candidateCommit) return { ok: false, detail: 'ownership evidence missing base/candidate commit' }
  try {
    const status = execFileSync('git', ['-C', cwd, 'diff', '--name-status', `${baseCommit}..${candidateCommit}`], {
      encoding: 'utf8', timeout: 30_000, maxBuffer: 64 * 1024 * 1024, windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const drift = ownershipDrift(task, status)
    return drift.length ? { ok: false, detail: `ownership drift: ${drift.join(', ')}` } : { ok: true }
  } catch (err) {
    return { ok: false, detail: `ownership evidence unavailable: ${String(err).slice(0, 200)}` }
  }
}

export function compatibleTasks(tasks: Task[], limit: number): Task[] {
  const selected: Task[] = []
  const manifests: OwnershipManifest[] = []
  for (const task of tasks) {
    const manifest = ownershipManifest(task)
    if (manifests.every(active => !ownershipConflicts(active, manifest))) {
      selected.push(task)
      manifests.push(manifest)
      if (selected.length === limit) break
    }
  }
  return selected
}

function normalizePath(raw: string): string | undefined {
  const directory = /[\\/]$/.test(raw.trim())
  let path = raw.trim().replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+/g, '/')
  if (directory) path = path.slice(0, -1)
  if (!path || path.includes('\0') || isAbsolute(path) || /^[a-z]:/i.test(path)) return undefined
  const parts = path.split('/')
  if (parts.some(part => !part || part === '..' || part === '.')) return undefined
  path = parts.join('/')
  if (process.platform === 'win32') path = path.toLowerCase()
  return directory ? `${path}/` : path
}

function covers(scope: string, path: string): boolean { return scope === path || (scope.endsWith('/') && path.startsWith(scope)) }
function overlaps(a: string, b: string): boolean { return covers(a, b.replace(/\/$/, '')) || covers(b, a.replace(/\/$/, '')) }
