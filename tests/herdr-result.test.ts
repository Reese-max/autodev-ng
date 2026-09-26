import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { expect, test } from 'vitest'
import {
  checkHerdrResultFile, clearHerdrResult, HERDR_RESULT_MAX_BYTES,
  herdrExpectedPath, herdrResultPath, parseHerdrResult, writeHerdrExpected,
  type HerdrExpectedBinding,
} from '../src/engines/herdr-result.js'

const dir = mkdtempSync(join(tmpdir(), 'adng-herdr-result-'))
const expected: HerdrExpectedBinding = {
  schemaVersion: 1,
  requestId: 'adng-a-b-c-aaa12345-exec-1',
  executionId: 'exec-1',
  repo: resolve(dir),
  taskId: 'a/b:c',
  baseCommit: 'aaa12345',
  session: 'herdr-autopilot',
  launcher: 'C:/herdr/Start-Herdr-Autopilot.ps1',
  issuedAt: '2026-09-17T00:00:00.000Z',
}
const validResult = {
  schemaVersion: 1, requestId: expected.requestId, executionId: expected.executionId,
  repo: dir, taskId: expected.taskId, baseCommit: expected.baseCommit,
  server: 'srv-9', session: 'herdr-autopilot', pane: 'p1', status: 'done',
}

test('parseHerdrResult：合法 done／failed 契約通過', () => {
  expect(parseHerdrResult(JSON.stringify(validResult))).toMatchObject({ ok: true, result: { status: 'done', pane: 'p1' } })
  expect(parseHerdrResult(JSON.stringify({ ...validResult, status: 'failed', detail: 'gate failed' })))
    .toMatchObject({ ok: true, result: { status: 'failed', detail: 'gate failed' } })
  // 契約內未知額外欄位可忽略（同版內向前相容）
  expect(parseHerdrResult(JSON.stringify({ ...validResult, extra: 'ignored' }))).toMatchObject({ ok: true })
})

test('parseHerdrResult：非物件、壞 JSON、缺欄位、錯型別一律拒收', () => {
  for (const raw of ['', 'not json', '[1,2]', 'null', '"done"', '{"schemaVersion":1,"requestId":"x"']) {
    expect(parseHerdrResult(raw), raw).toMatchObject({ ok: false, kind: 'invalid' })
  }
  for (const patch of [
    { requestId: '' }, { executionId: '' }, { repo: '' }, { taskId: '' }, { baseCommit: '' },
    { server: '' }, { session: '' }, { pane: '' }, { pane: 7 }, { status: 'maybe' }, { status: 'DONE' },
    { candidateCommit: 42 }, { detail: {} },
  ]) {
    expect(parseHerdrResult(JSON.stringify({ ...validResult, ...patch })), JSON.stringify(patch))
      .toMatchObject({ ok: false, kind: 'invalid' })
  }
})

test('parseHerdrResult：非 v1 契約版本明確 unsupported；缺 schemaVersion 是 invalid 而非 unsupported', () => {
  expect(parseHerdrResult(JSON.stringify({ ...validResult, schemaVersion: 2 }))).toMatchObject({ ok: false, kind: 'unsupported' })
  expect(parseHerdrResult(JSON.stringify({ ...validResult, schemaVersion: '1' }))).toMatchObject({ ok: false, kind: 'unsupported' })
  const { schemaVersion: _omit, ...noVersion } = validResult
  expect(parseHerdrResult(JSON.stringify(noVersion))).toMatchObject({ ok: false, kind: 'invalid' })
})

test('checkHerdrResultFile：正確綁定的結果通過全部欄位核對', () => {
  const path = herdrResultPath(dir, 'req-ok')
  writeFileSync(path, JSON.stringify({ ...validResult, requestId: 'req-ok' }))
  expect(checkHerdrResultFile(path, { ...expected, requestId: 'req-ok' })).toMatchObject({ ok: true })
})

test('checkHerdrResultFile：repo 比較做路徑正規化（尾斜線／相對寫法不誤殺）', () => {
  const path = herdrResultPath(dir, 'req-repo')
  writeFileSync(path, JSON.stringify({ ...validResult, requestId: 'req-repo', repo: `${dir}/` }))
  expect(checkHerdrResultFile(path, { ...expected, requestId: 'req-repo' })).toMatchObject({ ok: true })
})

test('checkHerdrResultFile：檔案不存在、空檔、超限各自明確拒收', () => {
  expect(checkHerdrResultFile(herdrResultPath(dir, 'req-none'), expected)).toMatchObject({ ok: false, kind: 'missing' })
  const empty = herdrResultPath(dir, 'req-empty')
  writeFileSync(empty, '')
  expect(checkHerdrResultFile(empty, { ...expected, requestId: 'req-empty' })).toMatchObject({ ok: false, kind: 'invalid' })
  const huge = herdrResultPath(dir, 'req-huge')
  writeFileSync(huge, ' '.repeat(HERDR_RESULT_MAX_BYTES + 1))
  expect(checkHerdrResultFile(huge, { ...expected, requestId: 'req-huge' })).toMatchObject({ ok: false, kind: 'invalid' })
})

test('checkHerdrResultFile：逐欄位綁定——任何不符都是 mismatch 且不洩內容', () => {
  const cases: Array<[string, Record<string, unknown>]> = [
    ['requestId', { requestId: 'adng-old-request' }],
    ['executionId', { executionId: 'exec-old' }],
    ['repo', { repo: '/tmp/other-repo' }],
    ['taskId', { taskId: 'other/task' }],
    ['baseCommit', { baseCommit: 'zzz99999' }],
    ['session', { session: 'other-session' }],
    ['candidateCommit', { candidateCommit: 'ccc11111' }],
  ]
  for (const [i, [field, patch]] of cases.entries()) {
    const requestId = `req-m${i}`
    const path = herdrResultPath(dir, requestId)
    writeFileSync(path, JSON.stringify({ ...validResult, requestId, secret: 'sk-never-echo-this', ...patch }))
    const check = checkHerdrResultFile(path, { ...expected, requestId })
    expect(check, field).toMatchObject({ ok: false, kind: 'mismatch' })
    if (!check.ok) {
      expect(check.reason).toContain(field)
      expect(check.reason).not.toContain('sk-never-echo-this')
    }
  }
})

test('writeHerdrExpected 原子保存送件前綁定；clearHerdrResult 清掉舊回執', () => {
  const path = writeHerdrExpected(dir, expected)
  expect(path).toBe(herdrExpectedPath(dir, expected.requestId))
  expect(JSON.stringify(expected)).toContain(expected.requestId)
  const resultPath = herdrResultPath(dir, expected.requestId)
  writeFileSync(resultPath, 'stale')
  clearHerdrResult(resultPath)
  expect(checkHerdrResultFile(resultPath, expected)).toMatchObject({ ok: false, kind: 'missing' })
  clearHerdrResult(resultPath) // 冪等
})
