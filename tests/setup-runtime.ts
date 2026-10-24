import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export default function setup(): void {
  execSync('npm run build', {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    windowsHide: true,
    stdio: 'inherit',
  })
}
