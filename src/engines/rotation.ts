/** 引擎輪替路由（2026-07-18）：實測 c5675b8 部署後 20 次派工 100% 落在 defaultEngine（opencode，
 * 真金 $0.2/次），12 檔位陣容全閒置——planner 產的任務不帶 [engine:] tag，全數走預設。
 * 規則：顯式 tag 尊重不動；無 tag 且設 engineRotation → 以 task id（sha1 hex 前 8 碼）為起點
 * 均勻分散，每失敗一次前進一格（自動 failover 換引擎重試，配合 maxAttempts＝連續 N 個不同引擎
 * 都敗才 blocked）；未設 rotation → defaultEngine（向後相容硬線）。
 * 回傳＝依序嘗試的 tag 清單（preflight 掛掉時 pickReadyTask 逐一後退）。 */
export function candidateEngines(
  rotation: string[] | undefined,
  defaultEngine: string,
  task: { id: string; engineTag?: string },
  failCount: number,
  entrySlots?: readonly number[]
): string[] {
  if (task.engineTag) return [task.engineTag]
  if (!rotation || rotation.length === 0) return [defaultEngine]
  const h = parseInt(task.id, 16)
  const hh = Number.isFinite(h) ? h : 0
  // 免費起跑（2026-07-28）：entrySlots 有值＝hash 起點只落這些檔位（零邊際成本引擎），
  // 失敗前進仍走全清單——每敗一格自然走進尾端訂閱額度段，緩升級不變。空/未設＝原公式（fail-open）。
  const entry = entrySlots && entrySlots.length > 0 ? entrySlots[hh % entrySlots.length]! : hh % rotation.length
  const start = (entry + failCount) % rotation.length
  return rotation.slice(start).concat(rotation.slice(0, start))
}
