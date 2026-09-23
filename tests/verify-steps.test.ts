import { afterEach, expect, test } from 'vitest'
import { mkdtempSync, rmSync, existsSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runVerify } from '../src/verify.js'
import { detectVerification } from '../src/github/job.js'

// Issue #48：複合驗收命令的程序邊界語意。
// 舊版把 `a && b` tokenize 成同一支程式的 argv——Linux 原生 spawn 下第二步
// 從未執行卻回 exit=0。新契約：&& 為受支援的序接鏈（逐步執行、失敗即停），
// 其他 shell 元字元在任何一步執行前明確拒絕；每步留下執行證據。

const NODE = process.execPath
const dirs: string[] = []
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })
const workdir = () => { const d = mkdtempSync(join(tmpdir(), 'adng-vsteps-')); dirs.push(d); return d }
const q = (s: string) => `"${s}"`

test('回歸：第一步 pass、第二步 exit=17 → 確實執行第二步且整組 fail', async () => {
  const cwd = workdir()
  const r = await runVerify({
    command: `${q(NODE)} -e "require('fs').writeFileSync('first-ran','1')" && ${q(NODE)} -e "require('fs').writeFileSync('second-ran','1');process.exit(17)"`,
    cwd, timeoutMs: 30_000,
  })
  expect(existsSync(join(cwd, 'first-ran'))).toBe(true)
  expect(existsSync(join(cwd, 'second-ran'))).toBe(true) // 第二步真的跑了
  expect(r.status).toBe('fail') // exit=17 不得被第一步的 0 吞掉
  expect(r.executed).toBe(true)
  expect(r.exitCode).toBe(17)
  expect(r.steps).toHaveLength(2)
  expect(r.steps![0]).toMatchObject({ step: 1, executed: true, exitCode: 0 })
  expect(r.steps![1]).toMatchObject({ step: 2, executed: true, exitCode: 17 })
})

test('多步全數通過 → pass，且每一步都有 executed/exitCode 證據', async () => {
  const cwd = workdir()
  const r = await runVerify({
    command: `${q(NODE)} -e "require('fs').writeFileSync('s1','1')" && ${q(NODE)} -e "require('fs').writeFileSync('s2','1')" && ${q(NODE)} -e "require('fs').writeFileSync('s3','1')"`,
    cwd, timeoutMs: 30_000,
  })
  expect(r.status).toBe('pass')
  expect(r.exitCode).toBe(0)
  expect(existsSync(join(cwd, 's3'))).toBe(true)
  expect(r.steps).toHaveLength(3)
  for (const [i, s] of r.steps!.entries()) expect(s).toMatchObject({ step: i + 1, executed: true, exitCode: 0 })
})

test('第一步失敗 → 後續步驟不執行、不冒充成功', async () => {
  const cwd = workdir()
  const r = await runVerify({
    command: `${q(NODE)} -e "process.exit(3)" && ${q(NODE)} -e "require('fs').writeFileSync('never-ran','1')"`,
    cwd, timeoutMs: 30_000,
  })
  expect(r.status).toBe('fail')
  expect(r.exitCode).toBe(3)
  expect(existsSync(join(cwd, 'never-ran'))).toBe(false)
  expect(r.steps).toHaveLength(2)
  expect(r.steps![1]).toMatchObject({ step: 2, executed: false })
})

test.each([
  ['||', 'process.exit(0)" || "unused'],  // 失敗才跑——fail-fast 模型無法承載
  [';', 'process.exit(0)"; "unused'],    // 無條件續跑——同上
  ['|', 'process.exit(0)" | "unused'],   // 管線
  ['>', 'process.exit(0)" > out.txt'],   // 重導向
  ['&', 'process.exit(0)" & "unused'],   // 單 & 背景執行——非 &&，必須拒絕
  ['$(', 'process.exit(0)" $(whoami)'],  // 命令代換
])('未支援的串接語法（%s）：在任何一步執行前明確拒絕', async (op, tail) => {
  const cwd = workdir()
  const r = await runVerify({
    command: `${q(NODE)} -e "require('fs').writeFileSync('first-ran','1');${tail}`,
    cwd, timeoutMs: 30_000,
  })
  expect(r.status).toBe('blocked')
  expect(r.executed).toBe(false) // 連第一步都不准跑
  expect(existsSync(join(cwd, 'first-ran'))).toBe(false)
})

test('引號內的 && 是普通參數，不切步、不誤判為串接', async () => {
  const cwd = workdir()
  const r = await runVerify({
    command: `${q(NODE)} -e "require('fs').writeFileSync('single','a&&b')"`,
    cwd, timeoutMs: 30_000,
  })
  expect(r.status).toBe('pass')
  expect(r.steps).toHaveLength(1)
})

test.each(['', ' ', '&&', `x &&`, `&& y`, `x && && y`])('空步驟或殘缺鏈 %j → blocked，不執行', async (cmd) => {
  const cwd = workdir()
  const inner = cmd === '' ? '' : cmd.replace('x', `${q(NODE)} -e "process.exit(0)"`).replace('y', `${q(NODE)} -e "process.exit(0)"`)
  const r = await runVerify({ command: inner, cwd, timeoutMs: 30_000 })
  expect(['skip', 'blocked']).toContain(r.status) // 空字串=skip（既有語意）；殘缺鏈=blocked
  if (cmd.trim() !== '') expect(r.status).toBe('blocked')
})

test('整體時間上限跨步共享：第一步逾時 → 第二步不再啟動', async () => {
  const cwd = workdir()
  const r = await runVerify({
    command: `${q(NODE)} -e "setInterval(()=>{},1e3)" && ${q(NODE)} -e "require('fs').writeFileSync('never-ran','1')"`,
    cwd, timeoutMs: 1500,
  })
  expect(r.status).toBe('blocked')
  expect(r.steps?.[0]?.timedOut).toBe(true)
  expect(r.steps![1]).toMatchObject({ step: 2, executed: false })
  expect(existsSync(join(cwd, 'never-ran'))).toBe(false)
})

test('步驟清單（陣列）形式：逐步執行、證據同字串 && 路徑', async () => {
  const cwd = workdir()
  const r = await runVerify({
    command: [`${q(NODE)} -e "require('fs').writeFileSync('a','1')"`, `${q(NODE)} -e "require('fs').writeFileSync('b','1');process.exit(9)"`],
    cwd, timeoutMs: 30_000,
  })
  expect(r.status).toBe('fail')
  expect(r.exitCode).toBe(9)
  expect(existsSync(join(cwd, 'a'))).toBe(true)
  expect(existsSync(join(cwd, 'b'))).toBe(true)
})

test('陣列步驟內出現 shell 元字元同樣在執行前拒絕', async () => {
  const cwd = workdir()
  const r = await runVerify({
    command: [`${q(NODE)} -e "require('fs').writeFileSync('first-ran','1')"`, `${q(NODE)} -e "x" > out`],
    cwd, timeoutMs: 30_000,
  })
  expect(r.status).toBe('blocked')
  expect(r.executed).toBe(false)
  expect(existsSync(join(cwd, 'first-ran'))).toBe(false)
})

test('產生端契約：detectVerification 回傳步驟清單、無串接語法', () => {
  const cwd = workdir()
  writeFileSync(join(cwd, 'package-lock.json'), '{}')
  writeFileSync(join(cwd, 'package.json'), JSON.stringify({ scripts: { test: 'node t.cjs', build: 'node b.cjs' } }))
  const steps = detectVerification(cwd)
  expect(Array.isArray(steps)).toBe(true)
  expect(steps.length).toBeGreaterThanOrEqual(2) // ci + test（+build）
  for (const step of steps) expect(step).not.toMatch(/&&|\|\||[;|>`]/) // 產生端不再輸出串接語法
})

test('產生端契約：無 build script 時為兩步', () => {
  const cwd = workdir()
  writeFileSync(join(cwd, 'package-lock.json'), '{}')
  writeFileSync(join(cwd, 'package.json'), JSON.stringify({ scripts: { test: 'node t.cjs' } }))
  expect(detectVerification(cwd)).toEqual(['npm ci --no-audit --no-fund', 'npm test'])
})
