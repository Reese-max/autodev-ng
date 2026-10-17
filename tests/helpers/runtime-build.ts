import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..', '..')

// globalSetup runs once before collection: refresh stale output too, and fail on build errors.
export default function buildRuntime(): void {
  execFileSync(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.build.json'], {
    cwd: root, stdio: 'inherit', windowsHide: true, timeout: 120_000,
  })
}

export const RUNTIME_BUILT = existsSync(join(root, 'dist/cli.js'))
