import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { z } from 'zod'
import { runProcess } from '../engines/proc.js'

const QualityNameSchema = z.enum(['unit', 'coverage', 'crap', 'mutation'])
const QualityCommandSchema = z.object({ command: z.string().trim().min(1), args: z.array(z.string()) }).strict()

export const QualityConfigSchema = z.object({
  unit: QualityCommandSchema.optional(),
  coverage: QualityCommandSchema.optional(),
  crap: QualityCommandSchema.optional(),
  mutation: QualityCommandSchema.optional(),
  required: z.array(QualityNameSchema).min(1).max(4).default(['unit']),
}).strict().superRefine((value, ctx) => {
  if (new Set(value.required).size !== value.required.length) ctx.addIssue({ code: 'custom', path: ['required'], message: 'quality.required cannot contain duplicates' })
})

export type QualityConfig = z.infer<typeof QualityConfigSchema>
export type QualityName = z.infer<typeof QualityNameSchema>
type QualityStatus = 'passed' | 'failed' | 'not-configured' | 'skipped'

type QualityReceipt = {
  schema: 'github-quality/v1'
  commit: string
  contractHash: string
  status: 'passed' | 'failed' | 'unverified'
  checks: Array<{
    name: QualityName
    required: boolean
    status: QualityStatus
    exitCode: number | null
    timedOut: boolean
    durationMs: number
    outputHash: string
  }>
}

const NAMES: QualityName[] = ['unit', 'coverage', 'crap', 'mutation']
const hash = (value: string): string => createHash('sha256').update(value).digest('hex')
const contractHash = (quality: QualityConfig): string => hash(JSON.stringify(quality))

export async function verifyQuality(
  quality: QualityConfig | undefined,
  cwd: string,
  commit: string,
  receiptPath: string,
  timeoutMs: number,
): Promise<QualityReceipt | undefined> {
  if (!quality) return undefined

  const checks: QualityReceipt['checks'] = []
  let failed = false
  for (const name of NAMES) {
    const required = quality.required.includes(name)
    const command = quality[name]
    if (!command) {
      checks.push({ name, required, status: 'not-configured', exitCode: null, timedOut: false, durationMs: 0, outputHash: hash('') })
      continue
    }
    if (failed) {
      checks.push({ name, required, status: 'skipped', exitCode: null, timedOut: false, durationMs: 0, outputHash: hash('') })
      continue
    }

    let result: Awaited<ReturnType<typeof runProcess>>
    try {
      result = await runProcess({ ...command, cwd, timeoutMs, stdinText: '', maxOutputChars: 16_000 })
    } catch {
      result = { exitCode: null, stdout: '', stderr: '', timedOut: false, durationMs: 0 }
    }
    const passed = !result.timedOut && result.exitCode === 0
    checks.push({
      name,
      required,
      status: passed ? 'passed' : 'failed',
      exitCode: result.exitCode,
      timedOut: result.timedOut,
      durationMs: result.durationMs,
      outputHash: hash(result.stdout + result.stderr),
    })
    if (!passed) failed = true
  }

  const status: QualityReceipt['status'] = failed
    ? 'failed'
    : checks.some(check => check.required && check.status === 'not-configured')
      ? 'unverified'
      : 'passed'
  const receipt: QualityReceipt = { schema: 'github-quality/v1', commit, contractHash: contractHash(quality), status, checks }
  writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n')
  if (status !== 'passed') throw new Error(`Quality gate ${status}`)
  return receipt
}

export function assertQuality(quality: QualityConfig | undefined, receiptPath: string, commit: string): void {
  if (!quality) return
  const receipt = JSON.parse(readFileSync(receiptPath, 'utf8')) as QualityReceipt
  if (receipt.schema !== 'github-quality/v1' || receipt.commit !== commit || receipt.contractHash !== contractHash(quality)) {
    throw new Error('Missing exact quality evidence')
  }
  if (receipt.status !== 'passed') throw new Error(`Quality gate ${receipt.status}`)
  for (const name of quality.required) {
    const check = receipt.checks.find(item => item.name === name)
    if (!check || check.status !== 'passed') throw new Error(`Quality gate ${name} is unverified`)
  }
}
