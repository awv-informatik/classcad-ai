// Discovery tools: list_methods, describe_method.
//
// Backed by:
//   - src/method-registry.json (built from @classcad/api-js .d.ts at compile time)
//   - classcad-skill markdown docs (loaded at runtime if present)
//
// describe_method composes both: the JSDoc summary + parameter list, plus the
// rich LLM doc from references/<domain>/<method>.md when one exists.
//
// Skill path resolution and per-method markdown content are memoized — the
// classcad-skill checkout doesn't change during a session, so we hit disk at
// most once per method instead of on every describe_method call.

import { z } from 'zod'
import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import registry from '../method-registry.json' with { type: 'json' }

type RegistryEntry = { domain: string; method: string; summary: string; params: { name: string; text: string }[] }
const REGISTRY = registry as Record<string, RegistryEntry>

const here = dirname(fileURLToPath(import.meta.url))
const SKILL_PATHS = [
  process.env.CLASSCAD_SKILL_PATH,
  join(here, '..', '..', 'classcad-skill'),
  join(here, '..', '..', '..', 'classcad-skill'),
].filter(Boolean) as string[]

let skillPathCache: string | null | undefined = undefined
function findSkillPath(): string | null {
  if (skillPathCache !== undefined) return skillPathCache
  for (const p of SKILL_PATHS) {
    if (existsSync(join(p, 'references'))) {
      skillPathCache = p
      return p
    }
  }
  skillPathCache = null
  return null
}

const llmDocCache = new Map<string, string | null>()
function loadLLMDoc(domain: string, method: string): string | null {
  const key = `${domain}/${method}`
  const cached = llmDocCache.get(key)
  if (cached !== undefined) return cached
  const skill = findSkillPath()
  if (!skill) {
    llmDocCache.set(key, null)
    return null
  }
  const candidates = [
    join(skill, 'references', domain, `${method}.md`),
    join(skill, 'references', domain, 'generic.md'),
  ]
  for (const c of candidates) {
    if (existsSync(c)) {
      const text = readFileSync(c, 'utf8')
      llmDocCache.set(key, text)
      return text
    }
  }
  llmDocCache.set(key, null)
  return null
}

function formatEntry(entry: RegistryEntry): string {
  const lines: string[] = []
  lines.push(`# v1.${entry.domain}.${entry.method}`)
  lines.push('')
  if (entry.summary) lines.push(entry.summary)
  if (entry.params.length) {
    lines.push('')
    lines.push('## Parameters')
    for (const p of entry.params) lines.push(`- **${p.name}** — ${p.text}`)
  }
  return lines.join('\n')
}

export function registerDocsTools(server: McpServer): void {
  server.registerTool(
    'list_methods',
    {
      title: 'List API methods',
      description:
        'List available v1.<domain>.<method> endpoints. Returns method names only by default — pass withSummaries=true for one-line summaries (much larger). Filter by domain or substring(s) to narrow the set. `search` accepts either a single string or an array of strings (OR semantics) — e.g. ["delete", "remove"] returns methods matching either term in one call.',
      inputSchema: {
        domain: z.enum(['assembly', 'common', 'curve', 'drawing2d', 'part', 'sketch', 'solid'])
          .optional().describe('Restrict to one domain.'),
        search: z.union([z.string(), z.array(z.string())]).optional()
          .describe('Substring(s) to match against the method name (case-insensitive). Pass an array for OR semantics, e.g. ["delete", "remove"].'),
        withSummaries: z.boolean().optional().describe('Include JSDoc summaries (default false — names only).'),
      },
    },
    async ({ domain, search, withSummaries }) => {
      const needles = (Array.isArray(search) ? search : search ? [search] : [])
        .map(s => s.toLowerCase())
        .filter(s => s.length > 0)
      const names: string[] = []
      const detailed: { method: string; summary: string }[] = []
      for (const [key, entry] of Object.entries(REGISTRY)) {
        if (domain && entry.domain !== domain) continue
        if (needles.length > 0) {
          const method = entry.method.toLowerCase()
          const k = key.toLowerCase()
          if (!needles.some(n => method.includes(n) || k.includes(n))) continue
        }
        if (withSummaries) detailed.push({ method: key, summary: entry.summary })
        else names.push(key)
      }
      const payload = withSummaries
        ? { count: detailed.length, methods: detailed }
        : { count: names.length, methods: names }
      return { content: [{ type: 'text', text: JSON.stringify(payload) }] }
    },
  )

  server.registerTool(
    'describe_method',
    {
      title: 'Describe API method',
      description:
        'Return full documentation for one method: source JSDoc summary + parameters, ' +
        'plus the LLM-oriented gotchas/examples doc from classcad-skill if present.',
      inputSchema: {
        method: z.string().describe('Fully qualified method name, e.g. "v1.part.box".'),
      },
    },
    async ({ method }) => {
      const entry = REGISTRY[method]
      if (!entry) {
        return { isError: true, content: [{ type: 'text', text: `Unknown method "${method}". Use list_methods.` }] }
      }
      const sections = [formatEntry(entry)]
      const llmDoc = loadLLMDoc(entry.domain, entry.method)
      if (llmDoc) {
        sections.push('---')
        sections.push('# LLM doc (classcad-skill)')
        sections.push('')
        sections.push(llmDoc)
      } else {
        sections.push('---')
        sections.push('_No LLM doc yet for this method. Source JSDoc only._')
      }
      return { content: [{ type: 'text', text: sections.join('\n\n') }] }
    },
  )
}
