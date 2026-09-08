// Local browser acceptance: real HTTP routes and DOM, fixture data, no worker or GitHub writes.
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { createServer } from '../web/server.mjs'
import { GithubConfigSchema } from '../dist/github/config.js'
import { saveState, fingerprint } from '../dist/github/state.js'

const root = mkdtempSync(join(tmpdir(), 'adng-console-browser-'))
const out = resolve('data/verification/github-console'); mkdirSync(out, { recursive: true })
mkdirSync(join(root, 'integrations'))
const source = join(root, 'source.json')
writeFileSync(source, JSON.stringify({ projectPath: root, backlogFile: 'BACKLOG.md', dataDir: root }))
const cfg = GithubConfigSchema.parse({ repo: 'fixture/project', authors: ['fixture'], sourceConfig: source, dataDir: root, engine: 'unused', enabled: true })
writeFileSync(join(root, 'integrations/github.json'), JSON.stringify(cfg))
const issue = { number: 9, title: '修復加法 <img src=x onerror=alert(1)>', body: 'Fixture only', state: 'open', user: { login: 'fixture' }, labels: [{ name: 'autodev' }] }
saveState(cfg, { repo: cfg.repo, base: cfg.base, issue, fingerprint: fingerprint(issue), status: 'blocked', runs: 1, nextRunAt: 0, detail: '測試未通過，等待操作員確認環境。' })
const server = createServer({ cfgPath: source, token: 'fixture-token', indexHtml: readFileSync('web/index.html', 'utf8'),
  cfg: { dataDir: root, engines: {}, dailySoftUsd: 0, dailyHardUsd: 0, stopFile: join(root, 'stop'), backlogFile: join(root, 'BACKLOG.md') },
  store: { read: () => [] }, db: { costForLocalDay: () => 0 }, dbPath: join(root, 'absent.db'), localDayFn: () => '2026-09-08',
  handleCommand: async () => ({ ok: true, text: '瀏覽器驗收資料' }), botDeps: {} })
await new Promise(done => server.listen(0, '127.0.0.1', done))
const chrome = spawn(process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${join(root, 'chrome')}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' })
let socket
try {
  const portFile = join(root, 'chrome/DevToolsActivePort')
  for (let i = 0; i < 100 && !existsSync(portFile); i++) await delay(100)
  const port = readFileSync(portFile, 'utf8').split('\n')[0]
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  socket = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((done, reject) => { socket.onopen = done; socket.onerror = reject })
  let id = 0; const pending = new Map()
  socket.onmessage = event => { const r = JSON.parse(event.data); if (r.id) { const p = pending.get(r.id); pending.delete(r.id); r.error ? p?.reject(r.error) : p?.resolve(r.result) } }
  const call = (method, params = {}) => new Promise((resolve, reject) => { const key = ++id; pending.set(key, { resolve, reject }); socket.send(JSON.stringify({ id: key, method, params })) })
  const evaluate = async expression => { const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails)); return r.result.value }
  await call('Page.enable')
  await call('Emulation.setDeviceMetricsOverride', { width: 1365, height: 1000, deviceScaleFactor: 1, mobile: false })
  await call('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/?token=fixture-token` })
  for (let i = 0; i < 100 && !await evaluate("!!document.querySelector('#githubPanel summary')"); i++) await delay(100)
  assert.equal(await evaluate("document.querySelectorAll('#githubPanel img').length"), 0)
  assert.ok(await evaluate("document.querySelector('#githubPanel').textContent.includes('修復加法 <img')"))
  await evaluate("document.querySelector('#githubPanel summary').focus()")
  await call('Page.bringToFront')
  await call('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 })
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 })
  for (let i = 0; i < 20 && !await evaluate("document.querySelector('#githubPanel details').open"); i++) await delay(50)
  assert.equal(await evaluate("document.querySelector('#githubPanel details').open"), true)
  await evaluate("[...document.querySelectorAll('#githubPanel button')].find(b => b.textContent === '檢查並重排').click()")
  for (let i = 0; i < 50 && !await evaluate("document.querySelector('#githubPanel [role=status]').textContent.includes('required')"); i++) await delay(100)
  assert.ok(await evaluate("document.querySelector('#githubPanel [role=status]').textContent.includes('required')"))
  await evaluate("document.querySelector('#githubPanel').scrollIntoView()")
  writeFileSync(join(out, 'desktop.png'), Buffer.from((await call('Page.captureScreenshot')).data, 'base64'))
  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await evaluate("document.querySelector('#githubPanel').scrollIntoView()")
  const layout = await evaluate("({viewport:innerWidth,page:document.documentElement.scrollWidth,width:document.querySelector('#githubPanel').clientWidth,scroll:document.querySelector('#githubPanel').scrollWidth,buttonHeights:[...document.querySelectorAll('#githubPanel button')].map(b=>b.getBoundingClientRect().height)})")
  assert.ok(layout.scroll <= layout.width + 1, JSON.stringify(layout)); assert.ok(layout.page <= 391, JSON.stringify(layout)); assert.ok(layout.buttonHeights.every(h => h >= 44))
  writeFileSync(join(out, 'mobile.png'), Buffer.from((await call('Page.captureScreenshot')).data, 'base64'))
  writeFileSync(join(out, 'receipt.json'), JSON.stringify({ at: new Date().toISOString(), gate: 'PASS', keyboard: true, escapedIssueContent: true, recoveryValidation: true, mobile: layout, fixtureRoot: root }, null, 2))
  console.log('GITHUB_CONSOLE_BROWSER_GATE=PASS')
  await call('Browser.close')
} finally {
  socket?.close(); chrome.kill(); await new Promise(done => server.close(done))
  // Preserve the bounded fixture and screenshots as acceptance evidence; no profile deletion needed.
}
