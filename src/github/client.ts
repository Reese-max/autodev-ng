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
function makeGithubClient(cfg: GithubConfig) {
  const root = `repos/${cfg.repo}`
  return {
    async inspectPr(number: number) {
      return PrSchema.extend({ merged: z.boolean(), merge_commit_sha: z.string().regex(/^[a-f0-9]{40,64}$/).nullable() })
        .parse(api(`${root}/pulls/${number}`))
    },
    async feedback(branch: string) {
      const result = JSON.parse(command('gh', ['pr', 'view', branch, '--repo', cfg.repo, '--json', 'number,url,state,headRefOid,baseRefName,statusCheckRollup']))
      const data = z.object({ number: z.number().int().positive(), url: z.string().url(), state: z.enum(['OPEN', 'CLOSED', 'MERGED']), headRefOid: z.string().regex(/^[a-f0-9]{40,64}$/), baseRefName: z.string(),
        statusCheckRollup: z.array(z.object({ status: z.string().optional(), conclusion: z.string().optional(), state: z.string().optional(), name: z.string().optional(), context: z.string().optional() })).nullable(),
      }).parse(result)
      const reviewRows = z.array(z.object({ user: z.object({ login: z.string() }).nullable(), state: z.string(), body: z.string().nullable(), commit_id: z.string() })).parse(api(`${root}/pulls/${data.number}/reviews?per_page=100`))
      const comments = z.array(z.object({ user: z.object({ login: z.string() }).nullable(), body: z.string(), commit_id: z.string(), path: z.string(), line: z.number().nullable() })).parse(api(`${root}/pulls/${data.number}/comments?per_page=100`))
      if (reviewRows.length === 100 || comments.length === 100) throw new Error('PR feedback exceeds bounded review window; manual triage required')
      const latest = new Map<string, typeof reviewRows[number]>()
      for (const review of reviewRows) if (review.user && ['APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'].includes(review.state)) latest.set(review.user.login.toLowerCase(), review)
      const allowed = (login?: string) => cfg.authors.some(a => a.toLowerCase() === login?.toLowerCase())
      const reviews = [...latest.values()].filter(r => r.state === 'CHANGES_REQUESTED' && r.commit_id === data.headRefOid && allowed(r.user?.login))
      const checks = data.statusCheckRollup ?? []
      const failed = checks.filter(c => ['FAILURE', 'ERROR', 'TIMED_OUT', 'ACTION_REQUIRED'].includes(c.conclusion ?? c.state ?? ''))
      const pending = checks.some(c => c.status ? c.status !== 'COMPLETED' : ['PENDING', 'EXPECTED'].includes(c.state ?? ''))
      const feedback = [...reviews.map(r => r.body), ...comments.filter(c => c.commit_id === data.headRefOid && c.line !== null && reviews.some(r => r.user?.login === c.user?.login)).map(c => `${c.path}:${c.line}\n${c.body}`), ...failed.map(c => `GitHub check failed: ${c.name ?? c.context ?? 'unnamed'}`)].join('\n')
      if (feedback.length > 20000) throw new Error('PR feedback exceeds bounded input; split the review before retry')
      return { number: data.number, url: data.url, head: data.headRefOid, base: data.baseRefName, state: data.state.toLowerCase() as 'open' | 'closed' | 'merged',
        checks: pending ? 'pending' as const : failed.length ? 'fail' as const : checks.length && checks.every(c => ['SUCCESS', 'NEUTRAL', 'SKIPPED'].includes(c.conclusion ?? c.state ?? '')) ? 'pass' as const : 'unknown' as const,
        feedback }
    },
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
export type GithubClient = Omit<ReturnType<typeof makeGithubClient>, 'feedback' | 'inspectPr'> & Partial<Pick<ReturnType<typeof makeGithubClient>, 'feedback' | 'inspectPr'>>
export function githubClient(cfg: GithubConfig): GithubClient { return makeGithubClient(cfg) }
