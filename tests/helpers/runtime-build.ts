import { existsSync } from 'node:fs'
import { join } from 'node:path'

export const RUNTIME_BUILT = existsSync(join(import.meta.dirname, '..', '..', 'dist', 'cli.js'))
