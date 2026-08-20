// run_script — execute model-written JavaScript against the live session.
//
// Powered by @classcad/script: the same script medium as buerli-ai and the
// training harness. Scripts using the guaranteed surface (api.v1.*,
// api.tree(), api.graphic(), api.env) run unchanged in all of them.

import { z } from 'zod'
import { createRequire } from 'module'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { runScript, type MethodRegistry, type ScriptSession, type Task } from '@classcad/script'
import type { Client } from '../client.js'

// Runtime require — keeps the registry JSON out of tsc's type space (OOM risk).
const REGISTRY = createRequire(import.meta.url)('@classcad/skill/method-registry.json') as MethodRegistry

// The engine omits brep EDGE data from graphic payloads until the graphic
// database settings are enabled — same lazy ensure as the @classcad/script
// node session and the browser session (this adapter was the one graphic
// path WITHOUT it: api.graphic() returned meshes but 0 edges until the first
// snapshot happened to enable the settings). Keyed on the client's reconnect
// generation — a use_session reconnect lands in a NEW session that needs its
// own ensure.
const graphicsEnsured = new WeakMap<object, number>()
async function ensureGraphics(client: Client): Promise<void> {
  if (graphicsEnsured.get(client) === client.generation) return
  graphicsEnsured.set(client, client.generation)
  try {
    await client.execute({
      'v1.common.setDatabaseSettings': [
        { isGraphicEnabled: true, isCCGraphicEnabled: true, isSketchGraphicEnabled: true, doCurveTessellation: true },
      ],
    })
  } catch {
    /* older servers — proceed without edges */
  }
}

/** Adapt the MCP's WS client to the @classcad/script session contract. */
function sessionFor(client: Client): ScriptSession {
  return {
    env: 'node',
    execute: (task: Task) => client.execute(task) as ReturnType<ScriptSession['execute']>,
    getTree: async (o?: { refresh?: boolean }) => {
      if (o?.refresh || !client.getStructure()) await client.refreshTree()
      return (client.getStructure()?.tree ?? {}) as import('@classcad/script').Tree
    },
    getGraphic: async (o?: { recalc?: boolean }) => {
      await ensureGraphics(client)
      if (o?.recalc !== false) {
        try {
          const r = await client.execute({ 'v1.common.recalc': [{}] })
          const g = (r as { graphic?: import('@classcad/script').Graphic }).graphic
          if (g?.containers?.some((c) => (c.meshes?.length ?? 0) > 0 || (c.edges?.length ?? 0) > 0)) return g
        } catch {
          /* fall back to accumulated graphic */
        }
      }
      return client.getLastGraphic() as import('@classcad/script').Graphic | null
    },
  }
}

export function registerScriptTool(server: McpServer, client: Client): void {
  server.registerTool(
    'run_script',
    {
      title: 'Run script',
      description:
        'Execute JavaScript against the CAD session — THE tool for any build involving computation, ' +
        'repetition, or more than a handful of operations. The script runs as an async function body with:\n' +
        '• api.v1.<domain>.<method>(params) — ClassCAD calls, await-able, → { result, maxLevel, messages }. ' +
        'Typos throw immediately with suggestions.\n' +
        '• api.tree({ refresh? }) — the structure tree (id → node): find parts, features, sketches by class/name.\n' +
        '• api.graphic({ recalc? }) — the graphic payload (containers with face meshes, edges, vertices): ' +
        'find and FILTER GEOMETRY yourself — e.g. locate a bore wall by vertex radius, collect edge ids for a chamfer. ' +
        'Exact shapes + selection idioms: describe_method("DATA").\n' +
        '• Math, full JS (variables, loops, functions); console.log/log(...) captured and returned.\n' +
        '• return <small summary> — results are size-capped; keep big data in the drawing, not the return value.\n' +
        'Compute coordinates IN the script (trigonometry, loops) instead of inlining hand-evaluated numbers. ' +
        'Pass recalc:false to api.graphic() in solid.*/entity-injection sessions (recalc destroys injected bodies). ' +
        'No DOM/network/filesystem access; awaited work times out (default 60s). ' +
        'Prefer several small verified scripts over one huge one — STATE PERSISTS in the drawing between ' +
        'scripts: a follow-up script ATTACHES to the existing model (re-discover via api.tree(); tree ids ' +
        'are stable; NEVER part.create when a part already exists). Even a single operation is a run_script.',
      inputSchema: {
        script: z
          .string()
          .describe('JavaScript source. Executed as an async function body — use await directly, return a (small) summary value.'),
        label: z.string().optional().describe('Short label describing what this script does.'),
        timeoutMs: z.number().int().min(1000).max(300000).optional().describe('Timeout for awaited work in ms (default 60000).'),
      },
    },
    async ({ script, timeoutMs }) => {
      const res = await runScript(script, sessionFor(client), { registry: REGISTRY, timeoutMs })
      if (!res.ok) {
        const tail = res.logs.length ? `\nConsole output before the error:\n${res.logs.slice(-20).join('\n')}` : ''
        return { content: [{ type: 'text' as const, text: `${res.error}${tail}` }], isError: true }
      }
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ returned: res.returned, logs: res.logs }) }],
      }
    },
  )
}
