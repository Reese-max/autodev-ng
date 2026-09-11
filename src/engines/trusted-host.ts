import type { Config } from '../types.js'

const trustedHosts = new WeakMap<Config, true>()

/** Mark a runtime Config as executing in the host-trusted GitHub local-candidate
 * context. This cannot be set from config JSON, task text, or issue content. */
export function markTrustedHost(cfg: Config): void {
  trustedHosts.set(cfg, true)
}

/** Returns true only if this exact Config object was marked by the GitHub runner. */
export function isTrustedHost(cfg: Config): boolean {
  return trustedHosts.get(cfg) === true
}
