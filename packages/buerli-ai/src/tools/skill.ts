// ─── Classcad-skill integration — describe_method tool ────────────────────────
//
// The skill bundle is a JSON map of domain/method → markdown documentation.
// It's loaded at init time from a pre-built JSON file (see scripts/bundle-skill.mjs).

import { docs as scriptDocs } from '@classcad/script/docs'
import { getMethodRegistry } from './registry'
import type { ToolResult } from '../types'

export type SkillBundle = Record<string, string>

let skillBundle: SkillBundle | null = null

/**
 * Everything readable: the data-contract docs shipped with @classcad/script
 * (DATA, STRUCTURE, GRAPHICS — always available) merged with the skill bundle.
 */
function allDocs(): Record<string, string> {
  return { ...scriptDocs, ...(skillBundle ?? {}) }
}

/** Set the skill bundle at runtime. */
export function setSkillBundle(bundle: SkillBundle): void {
  skillBundle = bundle
}

/** Load the skill bundle from a JSON module. */
export async function loadSkillBundle(jsonModule: Promise<{ default: SkillBundle }>): Promise<void> {
  const mod = await jsonModule
  skillBundle = mod.default ?? (mod as any)
}

/**
 * List the readable documents in the skill bundle, grouped for discovery.
 * Topic docs (SKETCHING, …), domain overviews (api/part, …) and recipes
 * (recipes/parametric-part, …) are whole-workflow documents — the per-method
 * docs are served through describe_method instead.
 */
export function listDocs(): { topics: string[]; overviews: string[]; recipes: string[] } {
  const keys = Object.keys(allDocs())
  return {
    topics: keys.filter(k => !k.includes('/')).sort(),
    overviews: keys.filter(k => k.startsWith('api/')).sort(),
    recipes: keys.filter(k => k.startsWith('recipes/')).sort(),
  }
}

/**
 * Read a whole document from the skill bundle by key — topic docs ("SKETCHING"),
 * domain overviews ("api/part"), recipes ("recipes/parametric-part"), and also
 * any per-method doc ("part/circularPattern"). Lookup is case-insensitive and
 * tolerates a stray .md suffix.
 */
export function readDoc(name: string): ToolResult {
  const bundle = allDocs()
  const raw = (name || '').trim().replace(/\.md$/i, '')
  if (!raw) {
    const docs = listDocs()
    return { result: { available: docs } }
  }
  const doc =
    bundle[raw] ??
    (() => {
      const lower = raw.toLowerCase()
      const key = Object.keys(bundle).find(k => k.toLowerCase() === lower)
      return key ? bundle[key] : null
    })()
  if (doc) return { result: doc }
  const docs = listDocs()
  return {
    error:
      `No document "${raw}". Topics: ${docs.topics.join(', ')}. Overviews: ${docs.overviews.join(', ')}. ` +
      `Recipes: ${docs.recipes.join(', ')}. (Per-method docs: use describe_method.)`,
  }
}

/**
 * Describe a method — combines registry metadata with skill markdown docs.
 */
export function describeMethod(method: string): ToolResult {
  const registry = getMethodRegistry()

  // Normalize: accept "v1.part.box" or just "box"
  let fullName = method
  let entry = registry?.[method] ?? null

  if (!entry && registry) {
    // Search across domains
    const match = Object.entries(registry).find(
      ([k, v]) => k.endsWith(`.${method}`) || (v as any).method === method,
    )
    if (match) {
      fullName = match[0]
      entry = match[1] as any
    }
  }

  // Not a method, but a whole document (topic doc, overview, recipe)? Serve it —
  // "DATA" or "recipes/parametric-part" should work from either tool.
  if (!entry) {
    const direct = readDoc(method)
    if (direct.result && typeof direct.result === 'string') return direct
    if (!registry && !skillBundle) {
      return { error: `Method "${method}" not found. No registry or skill data loaded.` }
    }
  }

  const parts: string[] = []

  // Registry info (JSDoc-level)
  if (entry) {
    parts.push(`# ${fullName}\n`)
    parts.push(`**Summary**: ${entry.summary}\n`)
    if (entry.params?.length) {
      parts.push(`**Parameters**:\n`)
      for (const p of entry.params) {
        parts.push(`- \`${p.name}\`: ${p.text}`)
      }
    }
  }

  // Skill docs (rich LLM-oriented markdown)
  if (skillBundle) {
    const domain = entry?.domain ?? fullName.split('.')[1]
    const methodName = entry?.method ?? fullName.split('.')[2] ?? method

    // Try exact match first, then domain/method
    const doc =
      skillBundle[`${domain}/${methodName}`] ??
      skillBundle[`api/${domain}`] ??
      null

    if (doc) {
      parts.push(`\n---\n## Detailed Documentation\n`)
      parts.push(doc)
    }
  }

  if (parts.length === 0) {
    return { error: `No documentation found for "${method}".` }
  }

  return { result: parts.join('\n') }
}
