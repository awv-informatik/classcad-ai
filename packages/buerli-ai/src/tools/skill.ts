// ─── Skill docs — read_doc / describe_method ──────────────────────────────────
//
// Thin ToolResult wrappers around the shared @classcad/skill/discovery module
// (the SAME logic as the ClassCAD MCP). The skill bundle (domain/method →
// markdown) is supplied at init time; the @classcad/script data-contract docs
// (DATA, STRUCTURE, GRAPHICS) are always available.

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
 * List the readable documents, grouped for discovery: topic docs (DATA,
 * SKETCHING, …), domain overviews (api/part, …) and recipes
 * (recipes/parametric-part, …) — the per-method docs are served through
 * describe_method instead.
 */
export function listDocs(): { topics: string[]; overviews: string[]; recipes: string[] } {
  return getDiscovery().listDocs()
}

/**
 * Read a whole document by key — topic docs ("DATA", "SKETCHING"), domain
 * overviews ("api/part"), recipes ("recipes/parametric-part"), and any
 * per-method doc ("part/circularPattern"). Case-insensitive, tolerates a
 * stray .md suffix.
 */
export function readDoc(name: string): ToolResult {
  const raw = (name || '').trim()
  if (!raw) {
    return { result: { available: listDocs() } }
  }
  const doc = getDiscovery().readDoc(raw)
  if (doc) return { result: doc.text }
  const docs = listDocs()
  return {
    error:
      `No document "${raw}". Topics: ${docs.topics.join(', ')}. Overviews: ${docs.overviews.join(', ')}. ` +
      `Recipes: ${docs.recipes.join(', ')}. (Per-method docs: use describe_method.)`,
  }
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
