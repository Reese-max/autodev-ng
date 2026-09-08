import { Events, type Client, type Message } from 'discord.js'
import { handleProject, type ProjectRuntime } from './route.js'
import { buildReplyPayload } from './reply.js'

// Only explicit bot + channel + exact project opt-ins; never grants slash/operator permissions.
export async function routeTestMessage(
  message: Pick<Message, 'id' | 'content' | 'channelId' | 'webhookId' | 'createdTimestamp'> & { author: { id: string; bot: boolean } },
  selfId: string,
  projects: Map<string, ProjectRuntime>,
  seen: Set<string>,
  now = Date.now(),
): Promise<string | undefined> {
  if (!message.author.bot || message.webhookId || message.author.id === selfId || seen.has(message.id)) return
  if (now - message.createdTimestamp > 60_000 || message.createdTimestamp > now + 5_000) return
  const match = /^<@!?(\d+)> cctest (monitor|github) ([\w-]+) (CCTEST_[A-Za-z0-9_]{1,64})$/.exec(message.content)
  if (!match || match[1] !== selfId) return
  const [, , command, project, marker] = match
  const rt = projects.get(project!)
  if (!rt?.testPeer || rt.testPeer.botId !== message.author.id || rt.testPeer.channelId !== message.channelId) return
  seen.add(message.id)
  // ponytail: retain 100 recent read-only requests; persistent receipts only if replay becomes material.
  if (seen.size > 100) seen.delete(seen.values().next().value!)
  try {
    const result = await handleProject(command!, '', rt)
    return `${marker} ${result.ok ? 'OK' : 'ERROR'} ${command} ${project}\n${result.text}`
  } catch { return `${marker} ERROR 查詢失敗` }
}

export function attachTestPeer(client: Client, projects: Map<string, ProjectRuntime>): void {
  if (![...projects.values()].some(p => p.testPeer)) return
  const seen = new Set<string>()
  client.on(Events.MessageCreate, async message => {
    try {
      if (!client.user) return
      const text = await routeTestMessage(message, client.user.id, projects, seen)
      if (!text) return
      const { content, files, allowedMentions } = buildReplyPayload(text)
      await message.reply({ content, files, allowedMentions: { ...allowedMentions, repliedUser: false } })
    } catch { console.error('CCTEST 回覆失敗') }
  })
}
