/** merge queue（併發基建 GOAL 2026-07-28）：mergeBack 進程內序列化。
 * 同 daemon 併發任務同時收尾時，合併必須一次一個——後到者等前者完成後才進入
 * mergeBack（其內建 rebase-before-merge 會把 worktree rebase 至前者剛推進的主線再 ff，
 * rebase 衝突 abort 走既有 merge-conflict blocked，不重試不硬合）。
 * 單 daemon 單進程：in-process promise chain 即足；跨進程互斥由 daemon.lock 保證。
 * 串行情境（concurrency=1）等價直接呼叫——鏈上永遠只有一個待辦。 */

let tail: Promise<unknown> = Promise.resolve()

export function enqueueMerge<T>(fn: () => T | Promise<T>): Promise<T> {
  const next = tail.then(fn, fn) // 前者失敗不堵後者（fn 於前者 settle 後執行）
  tail = next.then(() => undefined, () => undefined) // 吞鏈上錯誤防 unhandled；呼叫端自 next 取錯
  return next
}
