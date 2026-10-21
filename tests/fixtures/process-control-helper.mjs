// Inert local fixture: no filesystem writes, providers, descendants, or inherited-state output.
const [mode, token] = process.argv.slice(2)
if (!['complete', 'hang'].includes(mode) || !/^[a-f0-9]{32}$/.test(token ?? '')) {
  process.exitCode = 2
} else {
  const ready = () => {
    process.stdout.write(`PROCESS_CONTROL_READY ${JSON.stringify({ pid: process.pid, token })}\n`)
    process.stderr.write(`raw controlled stderr ${token}: 中文\n`)
  }
  ready()
  if (mode === 'hang') {
    // Keep the kernel process alive even after the owning CLI destroys its pipes.
    process.stdout.on('error', () => {})
    process.stderr.on('error', () => {})
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', input => { if (input.trim() === 'REPLAY_READY') ready() })
    setInterval(() => {}, 1_000)
  }
}
