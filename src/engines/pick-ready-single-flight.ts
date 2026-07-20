/** 同一份路由輸入只執行一個在途評估；完成後立即釋放，下一輪可重新計算。 */
const inFlight = new Map<string, Promise<string[]>>()

export function singleFlightPickRouting(
  key: string,
  evaluate: () => string[] | Promise<string[]>
): Promise<string[]> {
  const active = inFlight.get(key)
  if (active) return active

  const flight = Promise.resolve().then(evaluate)
  inFlight.set(key, flight)
  const cleanup = () => {
    if (inFlight.get(key) === flight) inFlight.delete(key)
  }
  void flight.then(cleanup, cleanup)
  return flight
}
