// ─── Convenience initializer — loads bundled skill + registry ─────────────────
//
// Call this once at app startup to load the bundled classcad-skill documentation
// and method registry so the describe_method and list_methods tools work.

import { setMethodRegistry } from './tools/registry'
import { setSkillBundle } from './tools/skill'
import type { MethodRegistry } from './tools/registry'
import type { SkillBundle } from './tools/skill'

/**
 * Initialize the AI agent with a skill bundle and method registry.
 *
 * Both ship in the `@classcad/skill` dependency; pass them explicitly when you
 * can't use dynamic imports (e.g. pure-Node ESM, where JSON imports need attributes):
 * ```ts
 * import { initAgent } from '@buerli.io/ai'
 * import skillBundle from '@classcad/skill/bundle.json' with { type: 'json' }
 * import methodRegistry from '@classcad/skill/method-registry.json' with { type: 'json' }
 *
 * initAgent({ skillBundle, methodRegistry })
 * ```
 *
 * Or with dynamic imports:
 * ```ts
 * await initAgentAsync()
 * ```
 */
export function initAgent(opts: { skillBundle?: SkillBundle; methodRegistry?: MethodRegistry }): void {
  if (opts.methodRegistry) setMethodRegistry(opts.methodRegistry)
  if (opts.skillBundle) setSkillBundle(opts.skillBundle)
}

/**
 * Async version that dynamically imports the JSON data from the `@classcad/skill`
 * dependency. Works with bundlers that support JSON imports (vite, webpack, etc.).
 */
export async function initAgentAsync(): Promise<void> {
  try {
    const [skillMod, registryMod] = await Promise.all([
      import('@classcad/skill/bundle.json'),
      import('@classcad/skill/method-registry.json'),
    ])
    setSkillBundle((skillMod.default ?? skillMod) as SkillBundle)
    setMethodRegistry((registryMod.default ?? registryMod) as MethodRegistry)
  } catch (e) {
    console.warn('[shared-ai-agent] Could not load skill/registry from @classcad/skill:', e)
  }
}
