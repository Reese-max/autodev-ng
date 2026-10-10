interface AssembledResources {
  deps: { db: { close(): void }; team?: { close(): void } }
}

function describeThrown(value: unknown): string {
  try {
    if (value instanceof Error) return String(value.message)
    if (value === null) return 'null'
    if (typeof value === 'object' || typeof value === 'function') return 'non-Error thrown value'
    return String(value)
  } catch { return 'unprintable thrown value' }
}

/** A failed synchronous cleanup must not be mistaken for an optional construction failure. */
export class ConstructionCleanupError extends AggregateError {
  constructor(primary: unknown, cleanup: unknown[]) {
    super([primary, ...cleanup],
      `Construction failed (${describeThrown(primary)}); cleanup failed (${cleanup.map(describeThrown).join('; ')})`,
      { cause: primary })
  }
}

/** An arbitrary thrown value must not make the optional fallback's type check throw. */
export function isConstructionCleanupError(error: unknown): error is ConstructionCleanupError {
  try { return error instanceof ConstructionCleanupError } catch { return false }
}

/** Close only known, synchronously closeable resources; preserve every original thrown value. */
export function closeAfterConstructionFailure(primary: unknown, resources: Array<{ close(): void }>): never {
  const cleanup: unknown[] = []
  for (const resource of resources) {
    try { resource.close() } catch (error) { cleanup.push(error) }
  }
  if (cleanup.length) throw new ConstructionCleanupError(primary, cleanup)
  throw primary
}

/** Own the successfully assembled resources before any further configuration. */
export async function withOwnedResources<A extends AssembledResources, T>(a: A, fn: (a: A) => Promise<T>): Promise<T> {
  let hasPrimary = false
  let primary: unknown
  let result: T | undefined
  try { result = await fn(a) }
  catch (error) { hasPrimary = true; primary = error }

  // Both resources get one close attempt, even if the first attempt fails.
  const cleanup: unknown[] = []
  try { a.deps.db.close() } catch (error) { cleanup.push(error) }
  try { a.deps.team?.close() } catch (error) { cleanup.push(error) }

  if (hasPrimary) {
    if (cleanup.length) throw new AggregateError([primary, ...cleanup],
      `Operation failed (${describeThrown(primary)}); cleanup failed (${cleanup.map(describeThrown).join('; ')})`, { cause: primary })
    throw primary
  }
  if (cleanup.length === 1) throw cleanup[0]
  if (cleanup.length > 1) throw new AggregateError(cleanup, `Resource cleanup failed: ${cleanup.map(describeThrown).join('; ')}`)
  return result as T
}
