import { describe, expect, test } from 'vitest'
import {
  discoverProblems,
} from '../src/autopilot/discover.js'
import {
  MAX_SURVEY_LENGTH, SURVEY_OUTPUT_TRUNCATED_EVENT,
} from '../src/autopilot/survey-sources.js'

const goal = { objective: '測試 survey', noProgressLimit: 2, evidenceFiles: [] }

function llm(response: string, prompts: string[]) {
  return {
    url: 'http://x/v1', model: 'm', apiKey: 'k',
    fetchFn: (async (_url: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      const body = JSON.parse(String(init?.body)) as { messages: Array<{ content: string }> }
      prompts.push(body.messages[0]!.content)
      return {
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: response } }] }),
      }
    }) as unknown as typeof fetch,
  }
}

function surveyFromFinderPrompt(prompt: string): string {
  const start = prompt.indexOf('\n# 勘查訊號\n') + '\n# 勘查訊號\n'.length
  const end = prompt.indexOf('\n\n# 佐證檔案\n', start)
  return prompt.slice(start, end)
}

describe('discovery survey prompt 邊界', () => {
  test('超長輸出只保留尾端、勘查段落不超過上限，且送出截斷事件', async () => {
    const prompts: string[] = []
    const events: Array<{ type: string; data: Record<string, unknown> }> = []
    const output = `${'前段\n'.repeat(4_000)}survey-tail-marker`

    await discoverProblems({
      finderLlm: llm('NONE', prompts),
      criticLlm: llm('NONE', prompts),
      runSurvey: () => ({ output }),
      readEvidence: () => '',
      onEvent: (type, data) => events.push({ type, data }),
      lenses: ['tests'],
    }, goal, process.cwd())

    const injected = surveyFromFinderPrompt(prompts[0]!)
    expect(injected.length).toBeLessThanOrEqual(MAX_SURVEY_LENGTH)
    expect(injected).toContain('survey stdout 已截斷')
    expect(injected).toContain('survey-tail-marker')
    expect(events).toEqual([{
      type: SURVEY_OUTPUT_TRUNCATED_EVENT,
      data: expect.objectContaining({
        originalLength: output.length,
        retainedLength: injected.length,
        maxLength: MAX_SURVEY_LENGTH,
      }),
    }])
  })

  test('未超長輸出在 prompt 內逐字不變，且不送截斷事件', async () => {
    const prompts: string[] = []
    const events: Array<{ type: string; data: Record<string, unknown> }> = []
    const output = '短 survey\r\n保留原始換行與尾端'

    await discoverProblems({
      finderLlm: llm('NONE', prompts),
      criticLlm: llm('NONE', prompts),
      runSurvey: () => ({ output }),
      readEvidence: () => '',
      onEvent: (type, data) => events.push({ type, data }),
      lenses: ['tests'],
    }, goal, process.cwd())

    expect(surveyFromFinderPrompt(prompts[0]!)).toBe(output)
    expect(events).toEqual([])
  })
})
