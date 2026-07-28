import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'
import { expect, test } from 'vitest'

const html = readFileSync(join(__dirname, '..', 'web', 'index.html'), 'utf8')
const script = html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1]

class Element {
  style: Record<string, string> = {}
  textContent = ''
  innerHTML = ''
  className = ''
  value = ''
  onclick: unknown
  addEventListener() {}
}

class Document {
  private readonly elements = new Map<string, Element>()

  getElementById(id: string): Element {
    let element = this.elements.get(id)
    if (!element) {
      element = new Element()
      this.elements.set(id, element)
    }
    return element
  }

  querySelectorAll(): Element[] { return [] }
  querySelector(): null { return null }
}

async function settle() {
  await new Promise<void>(resolve => setImmediate(resolve))
}

test('首頁艦隊卡片每 30 秒刷新資料，並顯示空狀態', async () => {
  expect(script).toBeDefined()
  expect(html).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))')

  const document = new Document()
  const timers: Array<{ callback: () => unknown; ms: number }> = []
  let projects: any[] = [
    { name: 'alpha', state: 'running', currentTask: '首輪資料', todayOk: 1, todayFail: 0, todayCostUsd: 0, backlogOpen: 1, backlogBlocked: 0, daemonAlive: true },
    { name: 'beta', state: 'idle', todayOk: 0, todayFail: 1, todayCostUsd: 0, backlogOpen: 2, backlogBlocked: 1, daemonAlive: false },
    { name: 'gamma', state: 'idle', todayOk: 2, todayFail: 0, todayCostUsd: 0, backlogOpen: 0, backlogBlocked: 0, daemonAlive: true },
  ]
  const context = {
    document,
    location: { search: '' },
    localStorage: { getItem: () => null, setItem: () => {} },
    URLSearchParams,
    fetch: async () => ({ ok: true, json: async () => ({ projects }) }),
    setInterval: (callback: () => unknown, ms: number) => { timers.push({ callback, ms }); return timers.length },
    setTimeout: () => 0,
  }
  runInNewContext(script!, context)
  await settle()

  const cards = document.getElementById('projectCards')
  expect(cards.innerHTML).toContain('alpha')
  expect(cards.innerHTML.match(/data-project=/g)).toHaveLength(3)

  const pollTimer = timers.find(timer => timer.ms === 30000)
  if (!pollTimer) throw new Error('首頁 30 秒輪詢未註冊')
  projects = [{ ...projects[0], currentTask: '已刷新資料' }]
  await pollTimer.callback()
  expect(cards.innerHTML).toContain('已刷新資料')
  expect(cards.innerHTML).not.toContain('首輪資料')

  projects = []
  await pollTimer.callback()
  expect(cards.innerHTML).toContain('目前沒有可顯示的專案')
})
