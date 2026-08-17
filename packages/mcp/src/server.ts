#!/usr/bin/env node
// server.ts — ClassCAD MCP server entry point.
//
// Speaks Model Context Protocol over stdio. The WebSocket to the ClassCAD
// worker (CLASSCAD_WS_URL, default ws://0.0.0.0:9094/) is opened lazily on
// the first tool call — either use_session (named session) or any geometry
// tool (anonymous session).

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { connect } from './client.js'
import { registerLifecycleTools } from './tools/lifecycle.js'
import { registerStateTools } from './tools/state.js'
import { registerDocsTools, serverInstructions } from './tools/docs.js'
import { registerSnapshotTool } from './tools/snapshot.js'
import { registerScriptTool } from './tools/script.js'
import { registerBridgeTools } from './tools/bridge.js'
import { startBridgeServer, type BridgeRegistry } from './bridge/server.js'

const WS_URL = process.env.CLASSCAD_WS_URL ?? 'ws://0.0.0.0:9094/'
const BRIDGE_LISTEN = process.env.CLASSCAD_BRIDGE_LISTEN ?? 'ws://localhost:9096/bridge'
const VERSION = '0.1.0'

async function main(): Promise<void> {
  // Build the client without opening the WS. The first tool call that needs
  // the worker will open it — either use_session (with a named session) or
  // any geometry tool (with no session header). This keeps the MCP passive
  // at startup so it never creates a stray ephemeral session.
  const client = await connect(WS_URL, { graphics: true })

  const server = new McpServer(
    {
      name: 'classcad',
      version: VERSION,
    },
    // The initialize-handshake instructions carry the full v1 method index —
    // hosts surface them to the agent, so it knows every method from turn one.
    { instructions: serverInstructions() },
  )

  server.registerTool(
    'session_info',
    {
      title: 'Session info',
      description: 'Return ClassCAD MCP session status: WS URL, current session id (null = worker-assigned default), connection state, package version.',
      inputSchema: {},
    },
    async () => {
      const ws = client.ws
      const connected = ws ? ws.readyState === ws.OPEN : false
      const info = { wsUrl: client.url, sessionId: client.sessionId, connected, version: VERSION }
      return { content: [{ type: 'text', text: JSON.stringify(info) }] }
    },
  )

  server.registerTool(
    'use_session',
    {
      title: 'Switch session',
      description:
        'Call this BEFORE any other classcad tool when the user names a session or hands you a session/token URL — the MCP opens its WebSocket lazily, so the first tool call decides which session is used. Two modes: (1) sessionId — attaches to a named ClassCAD session (ClassCAD-Session-Id header) on the configured worker, e.g. one Buerligons is already using; empty/omitted = fresh worker-assigned session. (2) url — a full ws(s):// URL from a multi-client server, typically carrying an invite token (e.g. wss://host/?invite=…); the MCP connects with it VERBATIM and joins that shared session. Without either, the MCP runs its own session as before. Reconnecting clears cached structure/graphic state — the next tool call repopulates it.',
      inputSchema: {
        sessionId: z.string().optional()
          .describe('Target session id (named-session model). Empty string or omitted = no header (worker-assigned session).'),
        url: z.string().optional()
          .describe('Full ws(s):// URL to connect to VERBATIM — e.g. a multi-client token/invite URL (wss://host/?invite=…). Takes precedence over sessionId.'),
      },
    },
    async ({ sessionId, url }) => {
      const target = sessionId && sessionId.length > 0 ? sessionId : null
      try {
        if (url && url.length > 0) await client.reconnectUrl(url)
        else await client.reconnect(target)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return {
          isError: true,
          content: [{ type: 'text', text: JSON.stringify({ ok: false, error: msg }) }],
        }
      }
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ ok: true, sessionId: client.sessionId, wsUrl: client.url }),
        }],
      }
    },
  )

  registerLifecycleTools(server, client)
  registerStateTools(server, client)
  registerDocsTools(server)
  registerSnapshotTool(server, client)
  registerScriptTool(server, client)

  // Optional in-app bridge listener. CC apps connect outbound to this WS to
  // expose their client-side state (selection, etc.). If the port is busy or
  // listening fails, the rest of the MCP still starts — the bridge tools just
  // report "no bridge connected" until the listener succeeds.
  let bridgeRegistry: BridgeRegistry | null = null
  try {
    bridgeRegistry = await startBridgeServer({ listen: BRIDGE_LISTEN })
    registerBridgeTools(server, client, bridgeRegistry)
  } catch (err) {
    process.stderr.write(`[classcad-mcp] bridge listener failed (${BRIDGE_LISTEN}): ${err instanceof Error ? err.message : err}\n`)
  }

  // Cleanly close the WS on shutdown.
  const shutdown = () => {
    try { client.close() } catch {}
    if (bridgeRegistry) { bridgeRegistry.close().catch(() => {}) }
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch(err => {
  process.stderr.write(`[classcad-mcp] FATAL: ${err?.message ?? err}\n`)
  process.exit(1)
})
