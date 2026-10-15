// Preserve the real locker output and observe only a complete, standalone
// readiness line. Error messages quoting the script are not lock evidence.
export function observeLockerStderr(write, onReady) {
  let line = ''
  let overLimit = false
  let ready = false
  return chunk => {
    write(chunk)
    for (const char of chunk) {
      if (char === '\n') {
        if (!overLimit && line.replace(/\r$/, '') === 'WORKTREE_LOCK_READY' && !ready) {
          ready = true
          onReady()
        }
        line = ''
        overLimit = false
      } else if (line.length < 4096) {
        line += char
      } else {
        overLimit = true
      }
    }
  }
}
