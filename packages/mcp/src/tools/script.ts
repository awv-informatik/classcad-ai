import { setDrawingBusy } from '../queue.js'
// run_script — execute model-written JavaScript against the live session.
//
// Powered by @classcad/script: the same script medium as buerli-ai and
// headless Node. Scripts using the guaranteed surface (api.v1.*,
// api.tree(), api.graphic(), api.env) run unchanged in all of them.

import { z } from 'zod'
import { createRequire } from 'module'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { runScript, isSessionBusy, type MethodRegistry, type ScriptSession, type Task } from '@classcad/script'
import type { Client } from '../client.js'

// Runtime require — keeps the registry JSON out of tsc's type space (OOM risk).
const REGISTRY = createRequire(import.meta.url)('@classcad/skill/method-registry.json') as MethodRegistry

/**
 * Adapt the MCP's WS client to the @classcad/script session contract. Tree and
 * graphic come from the client's cached, pull-on-demand accessors; the
 * emission config pair lets runScript suppress payloads for the duration of
 * the script (and restore the connection's previous flags afterwards), so a
 * 100-command script costs 100 small Results while the MCP's connection
 * otherwise keeps the engine defaults - important when it is docked into a
 * session shared with an interactive app.
 */
const sessions = new WeakMap<Client, ScriptSession>()
function sessionFor(client: Client): ScriptSession {
  const previous = sessions.get(client)
  if (previous) return previous
  const session: ScriptSession = {
    executionKey: client,
    env: 'node',
    execute: (task: Task) => client.execute(task) as ReturnType<ScriptSession['execute']>,
    getTree: (o?: { refresh?: boolean }) => client.getTree(o) as Promise<import('@classcad/script').Tree>,
    getGraphic: (o?: { recalc?: boolean }) => client.getGraphic(o) as Promise<import('@classcad/script').Graphic | null>,
    getEmissionConfig: () => client.getEmissionConfig(),
    setEmissionConfig: (partial: Record<string, unknown>) => client.setEmissionConfig(partial),
  }
  sessions.set(client, session)
  return session
}

export function registerScriptTool(server: McpServer, client: Client): void {
  setDrawingBusy(server, () => isSessionBusy(sessionFor(client)))
  server.registerTool(
    'run_script',
    {
      title: 'Run script',
      description:
        'Execute JavaScript against the CAD session — THE tool for any build involving computation, ' +
        'repetition, or more than a handful of operations. The script runs as an async function body with:\n' +
        '• api.v1.<domain>.<method>(params) — ClassCAD calls, await-able, → { result, maxLevel, messages }. ' +
        'Typos throw immediately with suggestions. Strict: a call that ends at maxLevel ≥ 51 THROWS (the message carries ' +
        'the engine error) — method docs describing "null/[] with maxLevel 51" are the non-script result; wrap intentional ' +
        'probes (e.g. getGeometryIds where a miss is expected) in try/catch.\n' +
        '• await api.tree({ refresh? }) — the structure tree (id → node): find parts, features, sketches by class/name. ' +
        'Returns a Promise: without await, Object.values(api.tree()) is silently [] (looks like an empty drawing).\n' +
        '• await api.graphic({ recalc? }) — the graphic payload (containers with face meshes, edges, vertices): ' +
        'find and FILTER GEOMETRY yourself — e.g. locate a bore wall by vertex radius, collect edge ids for a chamfer. ' +
        'Exact shapes + selection idioms: docs(["DATA"]).\n' +
        '• Math, full JS (variables, loops, functions); console.log/log(...) captured and returned.\n' +
        '• return <small summary> — results are size-capped; keep big data in the drawing, not the return value.\n' +
        'Compute coordinates IN the script (trigonometry, loops) instead of inlining hand-evaluated numbers. ' +
        'Pass recalc:false to api.graphic() in solid.*/entity-injection sessions (a recalc invalidates curve shape ids and can destroy injected bodies in complex cases). ' +
        'No DOM/network/filesystem access; awaited work times out (default 60s). ' +
        'Prefer several small verified scripts over one huge one — STATE PERSISTS in the drawing between ' +
        'scripts: a follow-up script ATTACHES to the existing model (re-discover via await api.tree(); tree ids ' +
        'are stable; NEVER part.create when a part already exists). Even a single operation is a run_script.',
      inputSchema: {
        script: z
          .string()
          .describe('JavaScript source. Executed as an async function body — use await directly, return a (small) summary value.'),
        label: z.string().optional().describe('Short label describing what this script does.'),
        timeoutMs: z.number().int().min(1000).max(300000).optional().describe('Timeout for awaited work in ms (default 60000).'),
      },
    },
    async ({ script, timeoutMs }, extra) => {
      let operationCount = 0
      const session = sessionFor(client)
      const res = await runScript(script, session, { registry: REGISTRY, timeoutMs, strict: true, signal: extra.signal,
        onOperation: event => {
          if (extra._meta?.progressToken !== undefined && event.phase === 'start') {
            void extra.sendNotification({ method: 'notifications/progress', params: {
              progressToken: extra._meta.progressToken, progress: ++operationCount,
              message: `${event.method}${event.name ? ': ' + event.name : ''}`,
            } }).catch(() => {})
          }
        },
      })
      // The script ran with payloads suppressed and the connection's flags
      // are restored again. One GetTree now: its Result carries the full
      // structure and graphic, refreshes our caches, and - broadcast by the
      // server - brings a shared session's other clients up to date with
      // everything the script changed while they received nothing.
      try {
        if (!isSessionBusy(session)) await client.pull()
      } catch {
        /* the tools pull again on demand */
      }
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
