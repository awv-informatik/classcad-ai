// ─── Classcad-skill integration — describe_method tool ────────────────────────
//
// The skill bundle is a JSON map of domain/method → markdown documentation.
// It's loaded at init time from a pre-built JSON file (see scripts/bundle-skill.mjs).

import { getMethodRegistry } from './registry'
import type { ToolResult } from '../types'

export type SkillBundle = Record<string, string>

let skillBundle: SkillBundle | null = null

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

  if (!entry && !skillBundle) {
    return { error: `Method "${method}" not found. No registry or skill data loaded.` }
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
