import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'
import { ConfigSchema } from '../src/types.js'

// 反轉守護方向（2026-07-30）：本檔原斷言「oc timeoutMs 必須為 0（無上限）」——該設計假設
// 在 zen 端點懸掛日造成 daemon 凍結 2.5 小時（無界等待＝艦隊停擺）。現改鎖安全恆等式：
// 三專案所有引擎的牆鐘限必須有界（>0 且 <=2 小時）。懸掛偵測正解是 idleTimeoutMs（插管中），
// 牆鐘只防跑飛；再想「明確停用 wall timeout」必須連同 idle 護欄一起設計，不得裸奔。
test.each(['note-filler', 'prompt-autoresearch', 'autodev-self', 'neciken', 'taiwan-intel', 'gooaye'])('%s 全引擎牆鐘限有界（>0 且 <=2h）', name => {
  const file = resolve(import.meta.dirname, '..', 'configs', `${name}.json`)
  const cfg = ConfigSchema.parse(JSON.parse(readFileSync(file, 'utf8')))

  for (const [tag, engine] of Object.entries(cfg.engines)) {
    expect(engine.timeoutMs, `${tag} 牆鐘限必須設定`).toBeDefined()
    expect(engine.timeoutMs!, `${tag} 牆鐘限必須 >0（0＝無界等待，2026-07-30 凍結事故根因）`).toBeGreaterThan(0)
    expect(engine.timeoutMs!, `${tag} 牆鐘限不得超過 2 小時`).toBeLessThanOrEqual(7_200_000)
  }
})
