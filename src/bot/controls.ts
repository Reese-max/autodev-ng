import { join } from 'node:path'
import type { BotDeps, CmdResult } from './handlers.js'
import { ControlStore, formatControlLine, parseControlArg, type ControlMode } from '../engines/steering.js'

/** Issue #11：/steer、/enqueue、/controls——operator 對「正在跑的 exact execution」的控制面。
 * 與 /task 不同：不新增 backlog item，而是對既有 executionId 投遞有界指示；
 * 每個請求都有 immutable receipt（control_envelopes 表 + events.jsonl）。 */

const CONTROL_USAGE = '用法：execution:<id> [task:<id>] [engine:<tag>] text:<指示內容>'

function openStore(d: BotDeps): ControlStore {
  return new ControlStore(join(d.cfg.dataDir, 'run.db'), { events: d.events })
}

export async function doControl(d: BotDeps, arg: string, mode: ControlMode, issuer: string): Promise<CmdResult> {
  let store: ControlStore | undefined
  try {
    const parsed = parseControlArg(arg)
    if (!parsed.executionId || !parsed.text) return { ok: false, text: CONTROL_USAGE }
    store = openStore(d)
    const r = store.request({
      dataDir: d.cfg.dataDir, project: d.cfg.projectPath,
      executionId: parsed.executionId, taskId: parsed.taskId, expectedEngineTag: parsed.engineTag,
      mode, text: parsed.text, issuer, channel: 'discord',
    })
    return { ok: r.ok, text: r.reply }
  } catch {
    return { ok: false, text: '控制指令失敗，請稍後再試' }
  } finally {
    try { store?.close() } catch { /* fail-open */ }
  }
}

export async function doSteer(d: BotDeps, arg: string, issuer: string): Promise<CmdResult> {
  return doControl(d, arg, 'steer', issuer)
}

export async function doEnqueue(d: BotDeps, arg: string, issuer: string): Promise<CmdResult> {
  return doControl(d, arg, 'queue', issuer)
}

export async function doControls(d: BotDeps): Promise<CmdResult> {
  let store: ControlStore | undefined
  try {
    store = openStore(d)
    store.sweepExpired()
    store.sweepDeadTargets(d.cfg.dataDir)
    const list = store.list(d.cfg.projectPath, 20)
    if (!list.length) return { ok: true, text: '尚無控制訊息紀錄' }
    return { ok: true, text: ['adng 控制訊息（新→舊）', ...list.map(formatControlLine)].join('\n') }
  } catch {
    return { ok: false, text: '控制訊息查詢失敗，請稍後再試' }
  } finally {
    try { store?.close() } catch { /* fail-open */ }
  }
}
