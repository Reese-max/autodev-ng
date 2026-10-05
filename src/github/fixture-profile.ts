import { createHash } from 'node:crypto'
import { z } from 'zod'

export const fixtureHash = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex')
const hash = z.string().regex(/^[a-f0-9]{64}$/)
export const ApprovedFixtureSchema = z.object({
  kind: z.literal('approved-fixture-v1'),
  repo: z.string().min(1), issue: z.number().int().positive(), fingerprint: hash,
  baseCommit: z.string().regex(/^[a-f0-9]{40,64}$/),
  file: z.string().regex(/^tests\/[A-Za-z0-9_./-]+\.(?:test|spec)\.(?:cjs|mjs|js|ts)$/)
    .refine(file => file.split('/').every(part => part !== '.' && part !== '..' && part !== '')),
  approvedContent: z.string().min(1).max(200_000), approvedSha256: hash,
  protectedAssertions: z.array(z.string().min(8).max(2000)).min(1).max(50),
  fullVerifyCommand: z.string().trim().min(1),
}).strict().refine(profile => fixtureHash(profile.approvedContent) === profile.approvedSha256, 'Approved fixture bytes/hash mismatch')
export type ApprovedFixture = z.infer<typeof ApprovedFixtureSchema>
