/**
 * `adng run` — 可插拔長時程執行後端（issue #55）的 CLI 操作面。
 *
 * 第一個 backend 為 long-horizon（Manager→Executor→Auditor）。start/resume 需要
 * engines 組裝（executor/escalation 走引擎白名單）；status/interrupt/approve/
 * evidence/metrics 只碰落盤狀態，不解析引擎。
 */
import { parseArgs } from 'node:util'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadMonitorConfig } from '../bot/monitor.js'
import { withAssembled } from './assemble.js'
import { listRuns, makeExecutionBackend, summarizeRuns } from '../backends/long-horizon.js'
import { parseGoal } from '../autopilot/goal.js'
import { loadGithubConfig } from '../github/config.js'
import { issueTask } from '../github/job.js'
import { readState } from '../github/state.js'
import type { BackendGoal, InterruptInstruction, RunPhase } from '../backends/types.js'
import type { Config } from '../types.js'

const RUN_USAGE = [
  '用法：adng run start --config <path> (--goal TEXT | --goal-file <path> | --github-config <path> --issue N)',
  '            [--verify CMD] [--id RUN_ID] [--max-rounds N]',
  '      adng run resume --config <path> --id RUN_ID',
  '      adng run status --config <path> [--id RUN_ID]',
  '      adng run interrupt --config <path> --id RUN_ID --kind pause|abort [--note TEXT] [--by WHO]',
  '      adng run approve --config <path> --id RUN_ID [--by WHO] [--note TEXT]',
  '      adng run evidence --config <path> --id RUN_ID',
  '      adng run metrics --config <path>        彙總各 run 的 pilot 量測（A/B 比較用）',
].join('\n')

const PHASE_EXIT: Record<RunPhase, number> = {
  complete: 0,
  'needs-approval': 2,
  interrupted: 2,
  running: 2,
  blocked: 1,
  failed: 1,
  cancelled: 1,
}

function buildGoal(values: { goal?: string; goalFile?: string; githubConfig?: string; issue?: string; verify?: string }, cfg: Config): BackendGoal {
  const sources = [values.goal !== undefined, values.goalFile !== undefined, values.issue !== undefined].filter(Boolean).length
  if (sources !== 1) throw new Error(`start 需要且只能一個 goal 來源（--goal / --goal-file / --github-config+--issue）\n${RUN_USAGE}`)
  const verify = values.verify ?? cfg.verifyCommand
  if (values.goal !== undefined) {
    return { objective: values.goal, ...(verify ? { verifyCommand: verify } : {}) }
  }
  if (values.goalFile !== undefined) {
    const goal = parseGoal(readFileSync(resolve(values.goalFile), 'utf8'))
    return { objective: goal.objective, ...(verify ?? goal.verifyCommand ? { verifyCommand: verify ?? goal.verifyCommand } : {}) }
  }
  // --github-config + --issue：由已同步的 IssueState 產生 goal（與 github runner 同一 task 編碼）。
  if (!values.githubConfig) throw new Error(`--issue 需要搭配 --github-config\n${RUN_USAGE}`)
  const number = Number(values.issue)
  if (!Number.isInteger(number) || number <= 0) throw new Error('--issue 必須是正整數')
  const ghCfg = loadGithubConfig(values.githubConfig)
  const state = readState(ghCfg, number)
  if (!state) throw new Error(`issue #${number} 尚未同步到本機（先跑 adng github sync）`)
  const ghVerify = verify ?? ghCfg.verifyCommand
  return {
    objective: issueTask(state),
    ...(ghVerify ? { verifyCommand: ghVerify } : {}),
    issue: { repo: ghCfg.repo, number },
  }
}

export async function runCli(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      config: { type: 'string' },
      'github-config': { type: 'string' },
      issue: { type: 'string' },
      goal: { type: 'string' },
      'goal-file': { type: 'string' },
      verify: { type: 'string' },
      id: { type: 'string' },
      kind: { type: 'string' },
      by: { type: 'string' },
      note: { type: 'string' },
      'max-rounds': { type: 'string' },
    },
  })
  const action = positionals[0]
  if (!values.config || positionals.length > 1
    || !['start', 'resume', 'status', 'interrupt', 'approve', 'evidence', 'metrics'].includes(action ?? '')) {
    throw new Error(RUN_USAGE)
  }
  const idRequired = action !== 'status' && action !== 'metrics'
  if (idRequired && !values.id) {
    // start 可以不帶 --id（自動產生）；其餘必備。
    if (action !== 'start') throw new Error(`adng run ${action} 需要 --id\n${RUN_USAGE}`)
  }
  const maxRounds = values['max-rounds'] !== undefined ? Number(values['max-rounds']) : undefined
  if (maxRounds !== undefined && (!Number.isInteger(maxRounds) || maxRounds <= 0)) throw new Error('--max-rounds 必須是正整數')

  // 唯讀／狀態操作不組裝 engines（不解析 secrets、不碰 provider）。
  if (action === 'status' || action === 'evidence' || action === 'metrics' || action === 'interrupt' || action === 'approve') {
    const cfg = loadMonitorConfig(values.config)
    if (action === 'metrics') { console.log(JSON.stringify(summarizeRuns(cfg.dataDir), null, 2)); return }
    if (action === 'status' && !values.id) { console.log(JSON.stringify(listRuns(cfg.dataDir), null, 2)); return }
    const backend = makeExecutionBackend(cfg)
    if (action === 'status') {
      console.log(JSON.stringify(await backend.status(values.id!), null, 2))
      return
    }
    if (action === 'evidence') {
      console.log(JSON.stringify(await backend.collectEvidence(values.id!), null, 2))
      return
    }
    if (action === 'interrupt' && !['pause', 'abort'].includes(values.kind ?? '')) {
      throw new Error(`interrupt 需要 --kind pause|abort\n${RUN_USAGE}`)
    }
    const instruction: InterruptInstruction = action === 'approve'
      ? { kind: 'approve', ...(values.by ? { by: values.by } : {}), ...(values.note ? { note: values.note } : {}) }
      : { kind: values.kind as 'pause' | 'abort', ...(values.by ? { by: values.by } : {}), ...(values.note ? { note: values.note } : {}) }
    console.log(JSON.stringify(await backend.interrupt(values.id!, instruction), null, 2))
    return
  }

  // start / resume：需要引擎與 LLM 檔位，走完整 assemble。
  await withAssembled(values.config, async ({ deps, cfg }) => {
    const backend = makeExecutionBackend(cfg, deps.engines, { events: deps.events })
    const handle = action === 'start'
      ? await backend.start(buildGoal({
        goal: values.goal, goalFile: values['goal-file'], githubConfig: values['github-config'],
        issue: values.issue, verify: values.verify,
      }, cfg), {
        cwd: cfg.projectPath,
        ...(values.id ? { runId: values.id } : {}),
        ...(maxRounds !== undefined ? { maxRounds } : {}),
      })
      : await backend.resume(values.id!)
    const snap = await handle.done
    console.log(JSON.stringify(snap, null, 2))
    process.exitCode = PHASE_EXIT[snap.phase]
  })
}
