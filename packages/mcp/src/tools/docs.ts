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
import { fileURLToPath } from 'url'
import { DEFAULT_DAEMON_PORT } from '../ports.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { RECIPES_POINTER, REFERENCE_IMAGE_POINTER } from '@classcad/skill/prompts'
import { createDiscovery, DOCS_MAX_KEYS, DOCS_TOOL, type MethodRegistry } from '@classcad/skill/discovery'
import { docs as scriptDocs } from '@classcad/script/docs'

// Loaded at runtime, NOT as static imports: tsc otherwise ingests the multi-MB
// bundle.json as a literal type — observed to OOM the compiler on some setups.
const requireJson = createRequire(import.meta.url)
const registry = requireJson('@classcad/skill/method-registry.json') as MethodRegistry
const bundle = requireJson('@classcad/skill/bundle.json') as Record<string, string>

// Live-doc override (development): resolve doc keys against a skill checkout.
function diskResolver(): ((key: string) => string | null) | undefined {
  const override = process.env.CLASSCAD_SKILL_PATH
  const root =
    override ??
    (() => {
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
    for (const c of [
      join(root, 'references', `${safe}.md`),
      join(root, `${safe}.md`),
      join(root, 'references', `${safe.toUpperCase()}.md`),
    ]) {
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

/** This install's CLI, so agents get a command that runs as written. */
const CLI = `node "${fileURLToPath(new URL('../server.js', import.meta.url))}"`

/**
 * Daemon lifecycle for agents. Shared by the instructions and session_info:
 * hosts may cut long instructions, a tool description always arrives.
 */
export const DAEMON_NOTE =
  `DAEMON: every tab of this MCP is a session in ONE shared daemon process per machine (127.0.0.1:${DEFAULT_DAEMON_PORT}); it exits a minute after its last session. ` +
  'Rebuilt MCP/renderer code only runs in a new daemon — an idle one is replaced automatically. Shell commands: ' +
  `\`${CLI} status\` (pid, build, sessions); ` +
  `\`${CLI} stop\` (stops it only when no session is active); ` +
  `\`${CLI} stop --force\` (terminates it NOW — every connected tab, this one included, loses its drawing: ask the user first. ` +
  'Tabs reconnect to a fresh daemon on their next tool call; tabs started before this MCP version need a host restart). Never kill daemon processes by hand.'

/**
 * Server instructions for the MCP initialize handshake — hosts put this into
 * the agent's context, so it knows the FULL method surface from turn one
 * (mirrors the method index buerli-ai injects into its system prompt).
 */
export function serverInstructions(): string {
  return [
    'ClassCAD MCP. run_script is the ONLY way to execute API calls (JavaScript against the live CAD session; ' +
      'state persists between scripts — follow-up scripts ATTACH via api.tree(), never part.create twice). ' +
      'A NEW, unrelated model in the same session: call `clear` first, then part.create — the drawing outlives a request, and without clear the new model lands inside the old one. ' +
      'PLAN FIRST, THEN FETCH ONCE: decide the whole build, pick every method you will need from the index below, ' +
      'then request ALL their docs in ONE docs([...]) call, recipes first — include "DATA" whenever a script reads api.tree()/api.graphic(). ' +
      'A docs response is size-capped: keys listed under "NOT included yet" at its top must be requested in a follow-up call before building. ' +
      RECIPES_POINTER +
      ' After that, build in a FEW substantial staged scripts — ' +
      'not one method per round. Verify with numbers (calculateMassProperties) and snapshot renders. ' +
      'REFERENCE IMAGES: ' +
      REFERENCE_IMAGE_POINTER,
    '',
    'ENGINES: the MCP runs on a ClassCAD worker (Drogon server) or on its OWN local WASM engine (no server, no browser); ' +
      'either way apps can dock into its session, and with an app\'s invite link it joins the session of that app. ' +
      'An invite link/URL decides by itself; otherwise use_session(engine="auto"|"drogon"|"wasm") — ' +
      'auto = worker if reachable else local WASM; a worker that comes up later takes over while the local drawing is still empty (a modeled session stays put). ' +
      '"use WASM / local / offline" → engine "wasm"; "my Drogon/ClassCAD server" → "drogon". ' +
      'session_info shows what is in use.',
    '',
    DAEMON_NOTE,
    '',
    'Method Index (v1) — every method, one line. Pick directly from here; use docs([...]) for exact parameters ' +
      'and trap notes, list_methods to filter. Never conclude an operation does not exist without checking this index:',
    '',
    discovery.methodIndex(),
    '',
    'Document Index — recipes (composed workflows) and guides (cross-cutting behavior), key — title. ' +
      'Fetch with docs([...]); list_methods({ search }) also ranks these by topic:',
    '',
    discovery.docIndex(),
  ].join('\n')
}

export function registerDocsTools(server: McpServer): void {
  server.registerTool(
    'list_methods',
    {
      title: 'List API methods',
      description:
        'Search/list the v1.<domain>.<method> surface. `search` as a string: one BM25-ranked list over method name + summary (whole words), ' +
        'CAD synonyms expanded (split→slice, hole→bore, round→fillet, …). `search` as an ARRAY with ONE CONCEPT PER ENTRY ' +
        '(e.g. ["expression", "box", "fastened constraint", "mass properties"]): one group per entry, each ranked on its own, ' +
        'so every concept gets its own top matches (a group note flags entries that are likely workflows, not methods). ' +
        'PLUS `docs`: the recipes/guides whose title, headings or text match (e.g. "shared parameters assembly" → ' +
        'recipes/assembly-parameters) — search by what you want to build, then fetch those docs. ' +
        'Without `search`: the full method listing plus `documents` (every recipe and guide, key — title). ' +
        'withSummaries=false returns bare names (token-cheap). ' +
        'A no-hit result does NOT mean the operation is missing — browse the domain instead.',
      inputSchema: {
        domain: z
          .enum(['assembly', 'common', 'curve', 'drawing2d', 'part', 'sketch', 'solid'])
          .optional()
          .describe('Restrict to one domain.'),
        search: z
          .union([z.string(), z.array(z.string())])
          .optional()
          .describe('Keyword(s) to rank against name + summary (case-insensitive, synonyms expanded). Array = one group per entry — put one concept in each.'),
        withSummaries: z.boolean().optional().describe('Include one-line summaries (default true).'),
        limit: z.number().int().min(1).max(300).optional().describe('Max ranked results: total for a string search (default 25), per group for an array (default 8).'),
      },
    },
    async ({ domain, search, withSummaries, limit }) => {
      const result = discovery.searchMethods({ domain, search, withSummaries, limit })
      const hasSearch = search != null && (Array.isArray(search) ? search.length > 0 : String(search).trim() !== '')
      const docs = hasSearch ? discovery.searchDocs({ search }) : null
      const payload = hasSearch
        ? docs && docs.count > 0
          ? { ...result, docs: docs.docs, docsNote: docs.note }
          : result
        : domain
          ? result
          : { ...result, documents: discovery.docIndex().split('\n') }
      return { content: [{ type: 'text' as const, text: JSON.stringify(payload) }] }
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
        keys: z
          .array(z.string())
          .min(1)
          .max(DOCS_MAX_KEYS)
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
        '"recipes/parametric-part"). Same size cap and paging as docs: a large document answers with page 1 and ' +
        'names the next page ("api/part#2").',
      inputSchema: {
        method: z
          .string()
          .describe(
            'Method name ("v1.part.box", "box"), topic doc ("DATA") or recipe ("recipes/constrained-sketching", "recipes/parametric-part").',
          ),
      },
    },
    async ({ method }) => {
      const res = await discovery.bulkDocs([method])
      if (res.found.length === 0) {
        return { isError: true, content: [{ type: 'text' as const, text: res.text }] }
      }
      return { content: [{ type: 'text' as const, text: res.text }] }
    },
  )
}
