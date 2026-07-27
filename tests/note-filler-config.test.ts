import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'
import { ConfigSchema } from '../src/types.js'

test('note-filler 明確停用 OpenCode wall timeout', () => {
  const file = resolve(import.meta.dirname, '..', 'configs', 'note-filler.json')
  const cfg = ConfigSchema.parse(JSON.parse(readFileSync(file, 'utf8')))

  for (const [tag, engine] of Object.entries(cfg.engines)) {
    if (engine.adapter !== 'opencode') continue
    expect(engine.timeoutMs, `${tag} 應以 0 明確表示無上限`).toBe(0)
  }
})
