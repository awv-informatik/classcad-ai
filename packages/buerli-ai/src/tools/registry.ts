// ─── Method registry — static metadata for all ClassCAD v1 API methods ────────
//
// The registry maps "v1.<domain>.<method>" to { domain, method, summary, params }.
// It is supplied by the consumer at init time (setMethodRegistry / initAgent);
// lookups, search and the compact index run through the shared
// @classcad/skill/discovery module (same logic as the ClassCAD MCP).

import { configureDiscovery, currentRegistry, getDiscovery } from './discovery'
import type { MethodRegistry, RegistryEntry } from '@classcad/skill/discovery'

export type { MethodRegistry, RegistryEntry }

/** Set the method registry at runtime. Call this during app init. */
export function setMethodRegistry(r: MethodRegistry): void {
  configureDiscovery({ registry: r })
}

/** Get the current method registry (may be null if not loaded). */
export function getMethodRegistry(): MethodRegistry | null {
  return currentRegistry()
}

/**
 * A compact one-line-per-method index of every v1 method (`name: brief summary`),
 * memoized in the shared discovery module. Injected into the system prompt so
 * the model can map intent → method directly instead of searching (~4.6k tokens
 * for the 264-method ClassCAD surface). Returns '' when the registry isn't
 * loaded yet.
 */
export function getMethodIndex(): string {
  if (!currentRegistry()) return ''
  return getDiscovery().methodIndex()
}

/**
 * Load the registry from a JSON module.
 * Usage: `await loadMethodRegistry(import('./path/to/method-registry.json'))`
 */
export async function loadMethodRegistry(jsonModule: Promise<{ default: MethodRegistry }>): Promise<void> {
  const mod = await jsonModule
  setMethodRegistry(mod.default ?? (mod as unknown as MethodRegistry))
}
