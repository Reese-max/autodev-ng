import { spawn } from 'node:child_process'
import { killTree, resolveSpawnTarget } from './proc.js'

/** Native metadata RPC only: no thread/session creation, prompts, login or credential requests. */
export async function withCliRpc<T>(opts: {
  command: string; args: string[]; env?: NodeJS.ProcessEnv; replaceEnv?: boolean; framed: boolean; timeoutMs?: number
}, read: (request: (method: string, params?: unknown) => Promise<unknown>, notify: (method: string) => void) => Promise<T>): Promise<T> {
  const env = opts.replaceEnv ? opts.env ?? {} : { ...process.env, ...opts.env }
  const target = resolveSpawnTarget(opts.command, opts.args, process.cwd(), env)
  const child = spawn(target.cmd, target.args, { env, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] })
  const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>()
  let serial = 0, buffer = Buffer.alloc(0), stderr = '', failure: Error | undefined, closed = false
  const fail = (error: Error) => { failure = error; for (const p of pending.values()) p.reject(error); pending.clear() }
  const send = (value: unknown) => {
    const body = JSON.stringify(value)
    child.stdin.write(opts.framed ? 'Content-Length: ' + Buffer.byteLength(body) + '\r\n\r\n' + body : body + '\n')
  }
  const accept = (body: string) => {
    let message: { id?: number; method?: string; result?: unknown; error?: { code?: number; message?: string } }
    try { message = JSON.parse(body) } catch { return }
    if (!message || typeof message !== 'object') return
    if (message.method) {
      if (message.id !== undefined) send({ jsonrpc: '2.0', id: message.id, error: { code: -32601, message: 'Metadata reader does not handle server requests' } })
      return
    }
    const p = pending.get(message.id!)
    if (!p) return
    pending.delete(message.id!)
    if (message.error) p.reject(new Error('RPC ' + message.error.code + ': ' + message.error.message))
    else p.resolve(message.result)
  }
  child.stdout.on('data', (chunk: Buffer) => {
    buffer = Buffer.concat([buffer, chunk])
    if (buffer.length > 2_000_000) { buffer = Buffer.alloc(0); child.stdout.pause(); fail(new Error('metadata response exceeds 2MB')); return }
    while (buffer.length) {
      if (!opts.framed) {
        const end = buffer.indexOf(10); if (end < 0) break
        accept(buffer.subarray(0, end).toString('utf8')); buffer = buffer.subarray(end + 1)
      } else {
        const end = buffer.indexOf('\r\n\r\n'); if (end < 0) break
        const length = Number(/Content-Length:\s*(\d+)/i.exec(buffer.subarray(0, end).toString('ascii'))?.[1])
        if (!Number.isSafeInteger(length) || length < 0 || length > 2_000_000) { child.stdout.pause(); fail(new Error('invalid metadata frame')); return }
        if (buffer.length < end + 4 + length) break
        accept(buffer.subarray(end + 4, end + 4 + length).toString('utf8')); buffer = buffer.subarray(end + 4 + length)
      }
    }
  })
  child.stderr.setEncoding('utf8'); child.stderr.on('data', (s: string) => { stderr = (stderr + s).slice(-2000) })
  child.on('error', fail); child.stdin.on('error', fail)
  const close = new Promise<void>(resolve => child.once('close', code => {
    closed = true; fail(new Error('metadata process exited ' + code + ': ' + stderr)); resolve()
  }))
  const timer = setTimeout(() => fail(new Error('metadata timeout')), opts.timeoutMs && opts.timeoutMs > 0 ? opts.timeoutMs : 30_000)
  const request = (method: string, params: unknown = {}) => new Promise<unknown>((resolve, reject) => {
    if (failure) { reject(failure); return }
    const id = ++serial; pending.set(id, { resolve, reject }); send({ jsonrpc: '2.0', id, method, params })
  })
  try { return await read(request, method => send({ jsonrpc: '2.0', method })) } finally {
    clearTimeout(timer); child.stdin.end()
    await Promise.race([close, new Promise(resolve => setTimeout(resolve, 200))])
    if (!closed) await killTree(child.pid, { command: opts.command })
    child.stdout.destroy(); child.stderr.destroy()
  }
}
