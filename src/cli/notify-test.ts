import type { DiscordNotifier } from '../engines/notify.js'
import { withAssembled } from './assemble.js'

export async function runNotifyTest(notifier: DiscordNotifier, now: Date = new Date()): Promise<{ ok: boolean; text: string }> {
  const text = `adng 通道測試 ${now.toISOString()}`
  const ok = await notifier.send(text)
  return { ok, text }
}

export async function cmdNotifyTest(cfgPath: string): Promise<void> {
  await withAssembled(cfgPath, async ({ notifier }) => {
    const { ok, text } = await runNotifyTest(notifier)
    if (ok) {
      console.log(`送達成功：${text}`)
    } else {
      console.log(`送達失敗（已寫入 DLQ，detail 見 dataDir/notify-dlq.jsonl）：${text}`)
      process.exitCode = 1
    }
  })
}
