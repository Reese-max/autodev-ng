import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { expect, test } from 'vitest'
import { expandConfigPaths } from '../src/cli/assemble.js'
import { ConfigSchema } from '../src/types.js'

test('專案設定搬到另一個 workspace 後，仍依設定目錄解析專案、backlog 與 worktree', () => {
  const moved = resolve('relocated workspace', 'autodev-ng')
  const projects = { 'autodev-self': 'autodev-ng', gooaye: 'gooaye', neciken: 'neciken-summer-poem', 'note-filler': 'note-filler', 'prompt-autoresearch': 'prompt-autoresearch', 'taiwan-intel': 'taiwan-intel-dashboard' }
  for (const [name, project] of Object.entries(projects)) {
    const cfg = ConfigSchema.parse(JSON.parse(readFileSync(join(import.meta.dirname, '..', 'configs', `${name}.json`), 'utf8')))
    const expanded = expandConfigPaths(join(moved, 'configs'), cfg)
    expect(expanded.projectPath, name).toBe(resolve(moved, '..', project))
    expect(expanded.worktreesDir, name).toBe(join(moved, 'data', name, 'worktrees'))
    expect(expanded.backlogFile, name).toBe(['neciken', 'taiwan-intel'].includes(name)
      ? resolve(moved, '..', project, 'BACKLOG-adng.md') : join(moved, 'data', name, 'BACKLOG.md'))
  }
  // Mode files are copied into configs/autodev-self.json before use.
  const mode = ConfigSchema.parse(JSON.parse(readFileSync(join(import.meta.dirname, '..', 'configs/modes/autodev-self.devin-only.json'), 'utf8')))
  expect(expandConfigPaths(join(moved, 'configs'), mode).projectPath).toBe(moved)
})
