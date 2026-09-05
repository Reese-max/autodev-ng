import { execFileSync } from 'node:child_process'
import { z } from 'zod'
import { IssueSchema, type GithubConfig, type Issue } from './config.js'

export function command(exe: string, args: string[], cwd?: string, input?: string): string {
  return execFileSync(exe, args, {
    cwd, input, encoding: 'utf8', windowsHide: true, timeout: 120_000,
    maxBuffer: 8_000_000, stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, GH_HOST: 'github.com', GH_PROMPT_DISABLED: '1', GIT_TERMINAL_PROMPT: '0' },
  }).trim()
}
export function api(endpoint: string, body?: unknown): unknown {
  return JSON.parse(command('gh', ['api', '--hostname', 'github.com', endpoint,
    ...(body === undefined ? ['--method', 'GET'] : ['--method', 'POST', '--input', '-'])], undefined,
  body === undefined ? undefined : JSON.stringify(body)))
}
const PrSchema = z.object({
  number: z.number().int().positive(), html_url: z.string().url(), state: z.enum(['open', 'closed']),
  head: z.object({ sha: z.string(), ref: z.string() }), base: z.object({ ref: z.string() }),
})
export type PullRequest = z.infer<typeof PrSchema>
export function githubClient(cfg: GithubConfig) {
  const root = `repos/${cfg.repo}`
  return {
    async list(): Promise<Issue[]> {
      const pages = JSON.parse(command('gh', ['api', '--hostname', 'github.com',
        `${root}/issues?state=open${cfg.label === null ? '' : `&labels=${encodeURIComponent(cfg.label)}`}&sort=created&direction=asc&per_page=100`,
        '--paginate', '--slurp'])) as unknown
      return z.array(z.array(z.unknown())).parse(pages).flat().filter(row =>
        typeof row === 'object' && row !== null && !('pull_request' in row)).map(row => IssueSchema.parse(row))
    },
    async issue(number: number): Promise<Issue> { return IssueSchema.parse(api(`${root}/issues/${number}`)) },
    async findLinkedPr(number: number): Promise<string | undefined> {
      const [owner, name] = cfg.repo.split('/')
      const result = api('graphql', {
        query: 'query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){issue(number:$number){closedByPullRequestsReferences(first:1,includeClosedPrs:true){nodes{url}}}}}',
        variables: { owner, name, number },
      })
      return z.object({ data: z.object({ repository: z.object({ issue: z.object({
        closedByPullRequestsReferences: z.object({ nodes: z.array(z.object({ url: z.string().url() })) }),
      }) }) }) }).parse(result).data.repository.issue.closedByPullRequestsReferences.nodes[0]?.url
    },
    async findPr(branch: string): Promise<PullRequest | undefined> {
      return z.array(PrSchema).parse(api(`${root}/pulls?state=all&head=${encodeURIComponent(`${cfg.repo.split('/')[0]}:${branch}`)}&per_page=100`))[0]
    },
    async createPr(branch: string, title: string, body: string): Promise<PullRequest> {
      return PrSchema.parse(api(`${root}/pulls`, { head: branch, base: cfg.base, title, body, draft: true }))
    },
  }
}
export type GithubClient = ReturnType<typeof githubClient>
