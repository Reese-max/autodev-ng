import { resolve } from 'node:path'

/** 同一主 repo 共用一條 promise chain；不同 repo 不互相阻塞。 */
const tails = new Map<string, Promise<void>>()

/** daemon 進程內 FIFO merge queue；前者失敗仍會把併入權交給下一個。 */
export function enqueueMerge<T>(projectPath: string, fn: () => T | Promise<T>): Promise<T> {
  const key = resolve(projectPath)
  const next = (tails.get(key) ?? Promise.resolve()).then(fn)
  const tail = next.then(() => undefined, () => undefined)
  tails.set(key, tail)
  void tail.then(() => {
    if (tails.get(key) === tail) tails.delete(key)
  })
  return next
}
