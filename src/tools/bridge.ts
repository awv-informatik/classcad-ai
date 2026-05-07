// Bridge tools: route requests to a CC app's bridge connection.
//
// All tools are scoped by the cc MCP's currently-attached sessionId
// (set via use_session). If no app has connected a bridge for that session,
// tools return a clean "no bridge connected" error and the user can keep
// using the rest of the cc MCP unaffected.

import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Client } from '../client.js'
import type { BridgeRegistry } from '../bridge/server.js'
import type {
  SelectionEntity,
  SelectionSetParams,
} from '../bridge/protocol.js'

function noBridgeError(sessionId: string | null) {
  return {
    isError: true,
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        ok: false,
        error: 'no bridge connected',
        sessionId,
        hint: sessionId
          ? `No CC app has registered a bridge for session "${sessionId}". Start your app with the bridge enabled (e.g. ?mcpBridge=ws://localhost:9096/bridge) and reload.`
          : 'No session is attached. Call use_session first, then try again.',
      }, null, 2),
    }],
  }
}

function pickConn(client: Client, registry: BridgeRegistry, clientId?: string) {
  const sid = client.sessionId
  if (!sid) return { conn: null, sid: null as string | null }
  return { conn: registry.pick(sid, clientId), sid }
}

export function registerBridgeTools(
  server: McpServer,
  client: Client,
  registry: BridgeRegistry,
): void {
  server.registerTool(
    'bridge.list_clients',
    {
      title: 'List bridge clients',
      description:
        'List CC apps that have opened a bridge connection for the currently-attached session (set via use_session). Returns connection metadata and capabilities. Empty list = no bridge available; the cc MCP still works for ClassCAD-only operations.',
      inputSchema: {},
    },
    async () => {
      const sid = client.sessionId
      const clients = registry.list(sid ?? undefined).map(c => ({
        clientId: c.clientId,
        sessionId: c.sessionId,
        drawingId: c.drawingId,
        app: c.app,
        appVersion: c.appVersion,
        capabilities: c.capabilities,
        protocolVersion: c.protocolVersion,
        announcedAt: c.announcedAt,
      }))
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ sessionId: sid, count: clients.length, clients, bridgeUrl: registry.url }, null, 2),
        }],
      }
    },
  )

  server.registerTool(
    'bridge.get_selection',
    {
      title: 'Get app selection',
      description:
        'Return the currently selected entities in the connected CC app. Each entity carries both a high-level kind/position/normal AND the raw {containerId, graphicId, prodRefId} triplet — pass `raw.graphicId` straight into ClassCAD APIs like v1.sketch.create({planeId: ...}).\n\n' +
        'STALENESS WARNING — the `raw.containerId` reflects the part\'s brep container at the time of the pick. Once any feature mutation (fillet, chamfer, boolean, extrusion, ...) creates a new solid, the part\'s active container id rotates (it tracks `inspect(partId).solids[0]`). Reusing an older containerId in bridge.set_selection round-trips fine but mis-renders: the viewer highlights the wrong graphic or nothing. After any mutation, re-fetch via `inspect(partId).solids[0]` instead of trusting an older raw triplet.',
      inputSchema: {
        clientId: z.string().optional()
          .describe('Specific bridge client id (from bridge.list_clients). Omit to use the most recently announced client for the session.'),
        cached: z.boolean().optional()
          .describe('If true, return the cached selection (updated by push events). If false (default), round-trip to the app.'),
      },
    },
    async ({ clientId, cached }) => {
      const { conn, sid } = pickConn(client, registry, clientId)
      if (!conn) return noBridgeError(sid)
      try {
        const items = cached && conn.cachedSelection
          ? conn.cachedSelection
          : await conn.request<SelectionEntity[]>('selection.get')
        return { content: [{ type: 'text', text: JSON.stringify({ ok: true, count: items.length, items }, null, 2) }] }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { isError: true, content: [{ type: 'text', text: JSON.stringify({ ok: false, error: msg }, null, 2) }] }
      }
    },
  )

  server.registerTool(
    'bridge.set_selection',
    {
      title: 'Set app selection',
      description:
        "Set the CC app's current selection. Each item is the raw {containerId, graphicId, prodRefId} triplet. The app highlights these entities in its UI.\n\n" +
        'CRITICAL — `containerId` must be the part\'s **current** brep container id, i.e. `inspect(partId).solids[0]` at call time. Each feature that creates a new solid (fillet, chamfer, boolean, extrusion, ...) rotates the part\'s `solids[0]` to a new id, and the bridge\'s canonical containerId rotates with it. Do NOT copy `containerId` from an earlier bridge.get_selection / bridge.pick if any feature has run since — old containerIds round-trip without error but mis-render in the viewer (the bridge accepts the triplet, but graphicIds created by later features do not exist in the old container, and the viewer either highlights the wrong graphic or nothing).\n\n' +
        'Construction recipe from API state alone:\n' +
        '  • containerId = `inspect(partId).solids[0]` (re-fetch every time, do not cache across mutations)\n' +
        '  • graphicId = brep element id (from `getBrepGeometryByIndex` / `getGeometryIds`)\n' +
        '  • prodRefId = the value echoed by a recent bridge.get_selection / bridge.pick on the same part (this differs from the part id when the part is instanced through an assembly — copy it from a pick rather than guessing).',
      inputSchema: {
        items: z.array(z.object({
          containerId: z.number(),
          graphicId: z.number(),
          prodRefId: z.number(),
        })).describe('Entities to select.'),
        replace: z.boolean().optional()
          .describe('If true (default), replace current selection. If false, add to it.'),
        clientId: z.string().optional(),
      },
    },
    async ({ items, replace, clientId }) => {
      const { conn, sid } = pickConn(client, registry, clientId)
      if (!conn) return noBridgeError(sid)
      try {
        const params: SelectionSetParams = { items, replace: replace !== false }
        await conn.request<void>('selection.set', params)
        return { content: [{ type: 'text', text: JSON.stringify({ ok: true, count: items.length }, null, 2) }] }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { isError: true, content: [{ type: 'text', text: JSON.stringify({ ok: false, error: msg }, null, 2) }] }
      }
    },
  )

}
