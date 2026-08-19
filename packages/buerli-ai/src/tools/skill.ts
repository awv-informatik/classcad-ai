// ─── Skill docs — bundle wiring + describeMethod ──────────────────────────────
//
// Thin ToolResult wrappers around the shared @classcad/skill/discovery module
// (the SAME logic as the ClassCAD MCP). The skill bundle (domain/method →
// markdown) is supplied at init time; the @classcad/script data-contract docs
// (DATA, STRUCTURE, GRAPHICS) are always available. Whole-document serving goes
// through the bulk `docs` tool (executor → discovery.bulkDocs).

import { configureDiscovery, currentBundle, getDiscovery } from './discovery'
import type { ToolResult } from '../types'

export type SkillBundle = Record<string, string>

/** Set the skill bundle at runtime. */
export function setSkillBundle(bundle: SkillBundle): void {
  configureDiscovery({ bundle })
}

/** Load the skill bundle from a JSON module. */
export async function loadSkillBundle(jsonModule: Promise<{ default: SkillBundle }>): Promise<void> {
  const mod = await jsonModule
  setSkillBundle(mod.default ?? (mod as unknown as SkillBundle))
}

/** True once a bundle has been supplied (the script docs are available regardless). */
export function hasSkillBundle(): boolean {
  return currentBundle() !== null
}

/**
 * Describe a method — JSDoc summary + parameters + the trained trap/example
 * notes. Accepts full ("v1.part.box") or bare ("box") names; ambiguous bare
 * names list the candidates. Also serves whole documents ("DATA",
 * "recipes/…") so either tool works.
 */
export function describeMethod(method: string): ToolResult {
  const res = getDiscovery().describeMethod(method)
  if (res.kind === 'error') return { error: res.text }
  return { result: res.text }
}
