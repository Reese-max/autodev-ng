/** Test deadlines reject the caller; they do not cancel the owned pipeline. */
export class FixtureExecutionScope {
  private readonly pending = new Set<Promise<void>>()
  private unconfirmedDrain = false

  ensureIdle(): void {
    if (this.pending.size || this.unconfirmedDrain) throw new Error('A previous fixture execution is still active or its cleanup is unconfirmed; preserve its roots and mocks')
  }

  track<T>(operation: Promise<T>): Promise<T> {
    const settled = operation.then(() => undefined, () => undefined)
    this.pending.add(settled)
    void settled.then(() => this.pending.delete(settled))
    return operation // Preserve the original rejection and value for its caller.
  }

  async drain(timeoutMs: number): Promise<void> {
    if (!this.pending.size) { this.unconfirmedDrain = false; return }
    let timer: ReturnType<typeof setTimeout> | undefined
    const settled = async () => {
      while (this.pending.size) await Promise.all([...this.pending])
    }
    try {
      await Promise.race([
        settled(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error(`Fixture executions did not settle within ${timeoutMs}ms; preserve their roots and mocks`)), timeoutMs)
        }),
      ])
      this.unconfirmedDrain = false
    } catch (error) {
      this.unconfirmedDrain = true
      throw error
    } finally { if (timer) clearTimeout(timer) }
  }
}
