import { expect, test } from 'vitest'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { routeTestMessage } from '../src/bot/cctest.js'
import { loadBotConfig } from '../src/bot/config.js'
import { loadMonitorConfig } from '../src/bot/monitor.js'
import { handleProject, type ProjectRuntime } from '../src/bot/route.js'

test('CCTEST permits only explicit read-only peer/channel/project and uses the production handler', async () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-cctest-')), cfgPath = join(root, 'test.json')
  const peer = { botId: '1494777289676685433', channelId: '1494779722314285179' }
  const config = { projectPath: root, dataDir: join(root, 'data'), backlogFile: join(root, 'BACKLOG.md'), engine: 'mock', botTestPeer: peer }
  writeFileSync(cfgPath, JSON.stringify(config))
  expect(loadBotConfig(cfgPath).testPeer).toEqual(peer)
  const rt: ProjectRuntime = { allowed: [], testPeer: peer, monitorOnly: { cfg: loadMonitorConfig(cfgPath), cfgPath } }
  const projects = new Map([['test', rt]])
  const self = '1511374524208381973', now = Date.now(), seen = new Set<string>()
  const message = { id: '1', content: `<@${self}> cctest monitor test CCTEST_case1`, author: { id: peer.botId, bot: true }, channelId: peer.channelId, webhookId: null, createdTimestamp: now } as Parameters<typeof routeTestMessage>[0]
  for (const patch of [
    { author: { ...message.author, bot: false } }, { author: { ...message.author, id: self } },
    { author: { ...message.author, id: '999' } }, { channelId: '999' }, { webhookId: '999' },
    { createdTimestamp: now - 60_001 }, { createdTimestamp: now + 5_001 },
    ...['pause', 'resume', 'goal', 'ask', 'task', 'status'].map(c => ({ content: message.content.replace('monitor', c) })),
    { content: message.content.replace('test CCTEST', 'tes CCTEST') },
    { content: message.content.replace(self, '999') }, { content: message.content + ' extra' },
  ]) expect(await routeTestMessage({ ...message, ...patch }, self, projects, seen, now)).toBeUndefined()
  expect(seen.size).toBe(0)
  expect(await routeTestMessage(message, self, new Map([['test', { ...rt, testPeer: undefined }]]), seen, now)).toBeUndefined()
  const monitor = await routeTestMessage(message, self, projects, seen, now)
  expect(monitor).toContain('CCTEST_case1 OK monitor test')
  expect(monitor).toContain((await handleProject('monitor', '', rt)).text.split('\n')[0])
  expect(await routeTestMessage(message, self, projects, seen, now)).toBeUndefined()
  const github = await routeTestMessage({ ...message, id: '2', content: message.content.replace('monitor', 'github') }, self, projects, seen, now)
  expect(github).toBe(`CCTEST_case1 OK github test\n${(await handleProject('github', '', rt)).text}`)
  for (const badPeer of [null, {}, { ...peer, botId: 1494777289676685433 }, { ...peer, channelId: '*' }]) {
    writeFileSync(cfgPath, JSON.stringify({ ...config, botTestPeer: badPeer }))
    expect(loadBotConfig(cfgPath).testPeer).toBeUndefined()
  }
})
