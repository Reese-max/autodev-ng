import { afterEach, expect, test, vi } from 'vitest'
import { callAgent, llmFromConfig } from '../src/autopilot/llm.js'
import * as cli from '../src/engines/cli-json.js'
import { judgeCommit } from '../src/engines/semantic-judge.js'
import { reviewDiff, parseReviewVerdict } from '../src/engines/review-gate.js'
import { reflectOnFailure } from '../src/learn/reflect.js'
import { ConfigSchema } from '../src/types.js'

afterEach(() => vi.restoreAllMocks())
test('CLI planning, judge, reviewer and evidence-reviewed lessons never fall back to HTTP', async () => {
  const cfg = ConfigSchema.parse({ engine: 'mock', projectPath: '.', backlogFile: 'BACKLOG.md', dataDir: 'data/test', llmTransport: 'cli', judgeModel: 'writer', auditModel: 'reviewer' })
  const opts = llmFromConfig(cfg), http = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('HTTP forbidden'))
  const reply = vi.spyOn(cli, 'codexJson').mockImplementation(async (cfg, schema) => { cfg.onUsage?.(12); return schema.parse({ text: 'plan' }) })
  expect(await callAgent(opts, 'Plan this task')).toMatchObject({ text: 'plan', totalTokens: 12 })
  reply.mockResolvedValue({ text: 'MATCH' }); expect((await judgeCommit(opts, 'claim', 'diff')).verdict).toBe('MATCH')
  reply.mockResolvedValue({ text: 'REVIEW: PASS' }); expect(parseReviewVerdict(await reviewDiff(opts, 'diff', 'task')).kind).toBe('pass')
  const add = vi.fn(() => true)
  const deps = { llm: opts, reviewLlm: llmFromConfig(cfg, 'reviewer'), lessons: { add }, db: { lastFailureFor: () => null }, backlog: {} } as unknown as Parameters<typeof reflectOnFailure>[0]
  const failure = { kind: 'blocked', taskId: 'id', taskText: 'Fix task', reason: 'infra:worktree-timeout' } as const
  reply.mockResolvedValueOnce({ text: 'Verify the sandbox before retrying.' }).mockResolvedValueOnce({ text: 'REJECT' })
  await reflectOnFailure(deps, failure); expect(add).not.toHaveBeenCalled()
  reply.mockResolvedValueOnce({ text: 'Verify the sandbox before retrying.' }).mockResolvedValueOnce({ text: 'APPROVE' })
  await reflectOnFailure(deps, failure); expect(add).toHaveBeenCalledTimes(1)
  reply.mockRejectedValue(new Error('sandbox unavailable'))
  expect((await callAgent(opts, 'retry')).error).toContain('sandbox unavailable')
  expect((await judgeCommit(opts, 'claim', 'diff')).verdict).toBe('SKIP')
  expect(parseReviewVerdict(await reviewDiff(opts, 'diff', 'task')).kind).toBe('skip')
  expect(http).not.toHaveBeenCalled()
})
