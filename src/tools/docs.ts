// Discovery tools: list_methods, describe_method.
//
// Backed by:
//   - src/method-registry.json (built from @classcad/api-js .d.ts at compile time)
//   - classcad-skill markdown docs (loaded at runtime if present)
//
// describe_method composes both: the JSDoc summary + parameter list, plus the
// rich LLM doc from references/<domain>/<method>.md when one exists.

import { z } from 'zod'
import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import registry from '../method-registry.json' with { type: 'json' }

type RegistryEntry = { domain: string; method: string; summary: string; params: { name: string; text: string }[] }
const REGISTRY = registry as Record<string, RegistryEntry>

// Resolve the path to a checked-out classcad-skill (sibling submodule). When
// running as a published npm package, this folder won't exist — describe_method
// gracefully degrades to JSDoc-only output.
const here = dirname(fileURLToPath(import.meta.url))
// Preference: explicit env override → bundled submodule → dev sibling.
const SKILL_PATHS = [
  process.env.CLASSCAD_SKILL_PATH,
  join(here, '..', '..', 'classcad-skill'),       // bundled submodule (mcp-root/classcad-skill)
  join(here, '..', '..', '..', 'classcad-skill'), // dev sibling (knowledge/classcad-skill)
].filter(Boolean) as string[]

function findSkillPath(): string | null {
  for (const p of SKILL_PATHS) {
    if (existsSync(join(p, 'references'))) return p
  }
  return null
}

function loadLLMDoc(domain: string, method: string): string | null {
  const skill = findSkillPath()
  if (!skill) return null
  const candidates = [
    join(skill, 'references', domain, `${method}.md`),
    join(skill, 'references', domain, 'generic.md'),
  ]
  for (const c of candidates) {
    if (existsSync(c)) return readFileSync(c, 'utf8')
  }
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
        'List available v1.<domain>.<method> endpoints. Returns slim records (method, summary). ' +
        'Filter by domain for focus.',
      inputSchema: {
        domain: z.enum(['assembly', 'common', 'curve', 'drawing2d', 'part', 'sketch', 'solid'])
          .optional().describe('Restrict to one domain.'),
        search: z.string().optional().describe('Substring match against method name (case-insensitive).'),
      },
    },
    async ({ domain, search }) => {
      const needle = search?.toLowerCase()
      const out: { method: string; summary: string }[] = []
      for (const [key, entry] of Object.entries(REGISTRY)) {
        if (domain && entry.domain !== domain) continue
        if (needle && !entry.method.toLowerCase().includes(needle) && !key.toLowerCase().includes(needle)) continue
        out.push({ method: key, summary: entry.summary })
      }
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ count: out.length, methods: out }, null, 2),
        }],
      }
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
