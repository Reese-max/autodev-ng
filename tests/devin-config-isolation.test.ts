import { expect, test } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ensureNoMcpImport } from '../src/engines/devin-config-isolation.js'

function tmp(): string { return mkdtempSync(join(tmpdir(), 'adng-dv-cfg-')) }

test('ensureNoMcpImport：於 cwd 寫入 .devin/config.local.json，read_config_from 三個來源全關', () => {
  const cwd = tmp()
  ensureNoMcpImport(cwd)
  const file = join(cwd, '.devin', 'config.local.json')
  expect(existsSync(file)).toBe(true)
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as { read_config_from: Record<string, boolean> }
  expect(parsed.read_config_from).toEqual({ claude: false, cursor: false, windsurf: false })
})

test('ensureNoMcpImport：冪等——內容已相同時不重寫檔案（mtime 不變）', () => {
  const cwd = tmp()
  ensureNoMcpImport(cwd)
  const file = join(cwd, '.devin', 'config.local.json')
  const mtimeBefore = statSync(file).mtimeMs
  ensureNoMcpImport(cwd)
  expect(statSync(file).mtimeMs).toBe(mtimeBefore)
})

test('ensureNoMcpImport：cwd 下已有別的 .devin/config.local.json 內容 → 覆寫成關 MCP 版本', () => {
  const cwd = tmp()
  mkdirSync(join(cwd, '.devin'), { recursive: true })
  const file = join(cwd, '.devin', 'config.local.json')
  writeFileSync(file, JSON.stringify({ permissions: { allow: ['Exec(ls)'] } }))
  ensureNoMcpImport(cwd)
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as { read_config_from: Record<string, boolean> }
  expect(parsed.read_config_from).toEqual({ claude: false, cursor: false, windsurf: false })
})
