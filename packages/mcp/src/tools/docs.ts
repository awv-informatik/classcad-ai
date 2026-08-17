// Discovery tools: list_methods, describe_method — thin MCP wrappers around the
// shared @classcad/skill/discovery module (the SAME search/describe logic as
// buerli-ai): CAD-synonym-expanded ranked search, fuzzy method resolution, and
// whole-document serving (skill bundle + @classcad/script data-contract docs).
//
// Dev override: with CLASSCAD_SKILL_PATH set, docs are read live from that
// skill checkout instead of the built bundle — edits show up without a rebuild.

import { z } from 'zod'
import { existsSync, readFileSync } from 'fs'
import { createRequire } from 'module'
import { dirname, join } from 'path'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import registry from '@classcad/skill/method-registry.json' with { type: 'json' }
import bundle from '@classcad/skill/bundle.json' with { type: 'json' }
import { createDiscovery, type MethodRegistry } from '@classcad/skill/discovery'
import { docs as scriptDocs } from '@classcad/script/docs'

// Live-doc override (development): resolve doc keys against a skill checkout.
function diskResolver(): ((key: string) => string | null) | undefined {
  const override = process.env.CLASSCAD_SKILL_PATH
  const root = override ?? (() => {
    try {
      return dirname(createRequire(import.meta.url).resolve('@classcad/skill/package.json'))
    } catch {
      return undefined
    }
  })()
  if (!override || !root) return undefined // no override → serve the built bundle
  return (key: string) => {
    const safe = key.replace(/[^a-zA-Z0-9/_-]/g, '')
    for (const c of [join(root, 'references', `${safe}.md`), join(root, 'references', `${safe.toUpperCase()}.md`)]) {
      if (existsSync(c)) return readFileSync(c, 'utf8')
    }
    return null
  }
}

const discovery = createDiscovery({
  registry: registry as MethodRegistry,
  bundle: bundle as Record<string, string>,
  extraDocs: scriptDocs,
  resolveDoc: diskResolver(),
})

/**
 * Server instructions for the MCP initialize handshake — hosts put this into
 * the agent's context, so it knows the FULL method surface from turn one
 * (mirrors the method index buerli-ai injects into its system prompt).
 */
export function serverInstructions(): string {
  return [
    'ClassCAD MCP. run_script is the ONLY way to execute API calls (JavaScript against the live CAD session; ' +
      'state persists between scripts — follow-up scripts ATTACH via api.tree(), never part.create twice). ' +
      'Before scripts that select geometry via api.tree()/api.graphic(), read describe_method("DATA") — the data contract. ' +
      'Before sketch work: describe_method("SKETCHING"). Verify with numbers (calculateMassProperties) and snapshot renders.',
    '',
    'Method Index (v1) — every method, one line. Pick directly from here; use describe_method for exact parameters ' +
      'and trap notes, list_methods to filter. Never conclude an operation does not exist without checking this index:',
    '',
    discovery.methodIndex(),
  ].join('\n')
}

export function registerDocsTools(server: McpServer): void {
  server.registerTool(
    'list_methods',
    {
      title: 'List API methods',
      description:
        'Search/list the v1.<domain>.<method> surface. With `search` (string or array, OR semantics): ' +
        'ranked matches over method name + summary, CAD synonyms expanded (split→slice, hole→bore, round→fillet, …). ' +
        'Without `search`: the full listing. withSummaries=false returns bare names (token-cheap). ' +
        'A no-hit result does NOT mean the operation is missing — browse the domain instead.',
      inputSchema: {
        domain: z.enum(['assembly', 'common', 'curve', 'drawing2d', 'part', 'sketch', 'solid'])
          .optional().describe('Restrict to one domain.'),
        search: z.union([z.string(), z.array(z.string())]).optional()
          .describe('Keyword(s) to rank against name + summary (case-insensitive, synonyms expanded). Array = OR.'),
        withSummaries: z.boolean().optional().describe('Include one-line summaries (default true).'),
        limit: z.number().int().min(1).max(300).optional().describe('Max ranked results (default 25).'),
      },
    },
    async ({ domain, search, withSummaries, limit }) => {
      const result = discovery.searchMethods({ domain, search, withSummaries, limit })
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'describe_method',
    {
      title: 'Describe API method',
      description:
        'Full documentation for one method: JSDoc summary + parameters, plus the trained trap/example notes ' +
        'when present. Accepts full ("v1.part.box") or bare ("box") names — ambiguous bare names list the candidates. ' +
        'Also serves WHOLE documents: "DATA" (the tree/graphic contract for run_script), "STRUCTURE", "GRAPHICS", ' +
        '"SKETCHING", domain overviews ("api/part") and recipes ("recipes/parametric-part").',
      inputSchema: {
        method: z.string().describe('Method name ("v1.part.box", "box"), topic doc ("DATA", "SKETCHING") or recipe ("recipes/parametric-part").'),
      },
    },
    async ({ method }) => {
      const res = discovery.describeMethod(method)
      if (res.kind === 'error') {
        return { isError: true, content: [{ type: 'text' as const, text: res.text }] }
      }
      return { content: [{ type: 'text' as const, text: res.text }] }
    },
  )
}
