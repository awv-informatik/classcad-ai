// Shared-discovery singleton — the ONE place holding the skill data and the
// @classcad/skill/discovery instance built from it. registry.ts / skill.ts /
// executor.ts delegate here, so buerli-ai and the ClassCAD MCP run the SAME
// search, describe and doc-serving logic.

import { createDiscovery, type Discovery, type MethodRegistry } from '@classcad/skill/discovery'
import { docs as scriptDocs } from '@classcad/script/docs'

let registry: MethodRegistry | null = null
let bundle: Record<string, string> | null = null
let cached: Discovery | null = null

/** Update the underlying data (called by the init setters). */
export function configureDiscovery(opts: { registry?: MethodRegistry; bundle?: Record<string, string> }): void {
  if (opts.registry) registry = opts.registry
  if (opts.bundle) bundle = opts.bundle
  cached = null
}

/** The current registry (null until the host initializes it). */
export function currentRegistry(): MethodRegistry | null {
  return registry
}

/** The current skill bundle (null until the host initializes it). */
export function currentBundle(): Record<string, string> | null {
  return bundle
}

/**
 * The discovery instance over registry + bundle + the @classcad/script
 * data-contract docs (DATA/STRUCTURE/GRAPHICS — always available).
 */
export function getDiscovery(): Discovery {
  if (!cached) {
    cached = createDiscovery({ registry: registry ?? {}, bundle: bundle ?? {}, extraDocs: scriptDocs })
  }
  return cached
}
