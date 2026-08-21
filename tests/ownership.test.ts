import { expect, test } from 'vitest'
import { changedPaths, compatibleTasks, ownershipDrift, ownershipManifest } from '../src/engines/ownership.js'
import type { Task } from '../src/types.js'

function task(id: string, write?: string[], resources: string[] = []): Task {
  return { id, text: id, line: 0, status: 'open', ...(write ? { ownership: { write, resources, risk: 'medium' } } : {}) }
}

test('未宣告或不合法 ownership 安全降級為全 repo 獨佔', () => {
  expect(ownershipManifest(task('none'))).toMatchObject({ write: ['*'], global: true })
  expect(ownershipManifest(task('escape', ['../outside']))).toMatchObject({ write: ['*'], global: true })
})

test('目錄 prefix 依 segment 衝突；互不重疊任務可同輪 admission', () => {
  const a = task('a', ['src/a/'])
  const b = task('b', ['src/ab/'])
  const c = task('c', ['src/a/file.ts'])
  expect(compatibleTasks([a, b], 2).map(t => t.id)).toEqual(['a', 'b'])
  expect(compatibleTasks([a, c], 2).map(t => t.id)).toEqual(['a'])
  expect(compatibleTasks([task('global'), b], 2).map(t => t.id)).toEqual(['global'])
})

test('實際 rename／新增檔超出 write scope 時回報 ownership drift', () => {
  const t = task('scoped', ['src/', 'tests/owned.test.ts'])
  const status = 'M\tsrc/a.ts\nR100\tsrc/old.ts\tsrc/new.ts\nA\tdocs/out.md\nA\ttests/owned.test.ts'
  expect(changedPaths(status)).toEqual(['src/a.ts', 'src/old.ts', 'src/new.ts', 'docs/out.md', 'tests/owned.test.ts'])
  expect(ownershipDrift(t, status)).toEqual(['docs/out.md'])
})
