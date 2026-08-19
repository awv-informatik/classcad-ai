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
import { createDiscovery, DOCS_MAX_KEYS, DOCS_TOOL, type MethodRegistry } from '@classcad/skill/discovery'
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
    // Keys map to files: references/<domain>/<method>.md, or top-level dirs for
    // prefixed keys (recipes/<name>.md lives at the package root).
    for (const c of [join(root, 'references', `${safe}.md`), join(root, `${safe}.md`), join(root, 'references', `${safe.toUpperCase()}.md`)]) {
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
      'PLAN FIRST, THEN FETCH ONCE: decide the whole build, pick every method you will need from the index below, ' +
      'then fetch ALL their docs in ONE docs([...]) call (include "DATA" whenever a script reads api.tree()/api.graphic(), ' +
      '"recipes/constrained-sketching" before sketch work, the matching build recipe, and ALWAYS "recipes/verification" — every build ends in verification, and for input references its Part I (reference record) comes BEFORE building). After that, build in a FEW substantial staged scripts — ' +
      'not one method per round. Verify with numbers (calculateMassProperties) and snapshot renders. ' +
      'REFERENCE IMAGES: "recipes/verification" Part I governs from FIRST image exposure, before extracting ' +
      'dimensions or planning — fetch it and follow it to the letter: reference record first (handedness resolved ' +
      'by coincidence questions; one question per fresh reader when the harness offers subagents; undecidables ' +
      'ASKED of the user or, headless, DECLARED with the deciding channel; record frozen), then build, then the ' +
      'final gate — the A|B pair-sheet mirror check (snapshot sheet: [matched view, same view with negated ' +
      'azimuth]), UNCONDITIONAL for every image-referenced build and judged against the reference IMAGE, never ' +
      'against your own record. In-task handedness readings are measurably unreliable even when confident; the ' +
      'record, the readers and the gate exist because of that. Numbers prove the model matches your INTENT — ' +
      'probe each frozen fact numerically, and never explain a render-vs-reference difference with "viewing angle".',
    '',
    'Method Index (v1) — every method, one line. Pick directly from here; use docs([...]) for exact parameters ' +
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

  // Bulk documentation — the PRIMARY doc tool. Contract AND implementation are
  // the shared single source in @classcad/skill/discovery (DOCS_TOOL/bulkDocs);
  // buerli-ai registers the identical tool from the same source.
  server.registerTool(
    DOCS_TOOL.name,
    {
      title: 'Fetch documentation (bulk)',
      description: DOCS_TOOL.description,
      inputSchema: {
        keys: z.array(z.string()).min(1).max(DOCS_MAX_KEYS)
          .describe('Documentation keys, e.g. ["DATA", "v1.part.extrusion", "v1.part.chamfer", "recipes/parametric-part"].'),
      },
    },
    async ({ keys }) => {
      const res = await discovery.bulkDocs(keys)
      return { content: [{ type: 'text' as const, text: res.text }] }
    },
  )

  server.registerTool(
    'describe_method',
    {
      title: 'Describe API method',
      description:
        'Full documentation for ONE key — prefer docs([...]) to fetch everything you need in a single round; ' +
        'use this only for a single follow-up lookup. Accepts full ("v1.part.box") or bare ("box") names — ' +
        'ambiguous bare names list the candidates. Also serves whole documents ("DATA", "api/part", ' +
        '"recipes/parametric-part").',
      inputSchema: {
        method: z.string().describe('Method name ("v1.part.box", "box"), topic doc ("DATA") or recipe ("recipes/constrained-sketching", "recipes/parametric-part").'),
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
