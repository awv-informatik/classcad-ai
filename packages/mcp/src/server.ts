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
import { serializeTools } from './queue.js'

const WS_URL = process.env.CLASSCAD_WS_URL ?? 'ws://0.0.0.0:9094/'
const BRIDGE_LISTEN = process.env.CLASSCAD_BRIDGE_LISTEN ?? 'ws://localhost:9096/bridge'
const VERSION = '0.1.0'

async function main(): Promise<void> {
  // Optional in-app bridge listener, started FIRST so the client can attach
  // to in-app engines through it (use_session with a ?bridge= share link). CC
  // apps connect outbound to this WS to expose their client-side state
  // (selection) or, for WASM engines, to serve the engine itself. If the port
  // is busy or listening fails, the rest of the MCP still starts — the bridge
  // tools just report "no bridge connected" until the listener succeeds.
  let bridgeRegistry: BridgeRegistry | null = null
  try {
    bridgeRegistry = await startBridgeServer({ listen: BRIDGE_LISTEN })
  } catch (err) {
    process.stderr.write(`[classcad-mcp] bridge listener failed (${BRIDGE_LISTEN}): ${err instanceof Error ? err.message : err}\n`)
  }

  // Build the client without opening the WS. The first tool call that needs
  // the worker will open it — either use_session (with a named session) or
  // any geometry tool (with no session header). This keeps the MCP passive
  // at startup so it never creates a stray ephemeral session.
  const client = await connect(WS_URL, { graphics: true, bridge: () => bridgeRegistry })

  const server = new McpServer(
    {
      name: 'classcad',
      version: VERSION,
    },
    // The initialize-handshake instructions carry the full v1 method index —
    // hosts surface them to the agent, so it knows every method from turn one.
    { instructions: serverInstructions() },
  )

  // One tool call at a time: every tool below shares this client's single
  // engine connection and drawing (see queue.ts for the reasoning, incl.
  // subagents). Must run before the first registerTool.
  serializeTools(server)

  server.registerTool(
    'session_info',
    {
      title: 'Session info',
      description: 'Return ClassCAD MCP session status: transport (ws worker or in-app bridge), WS URL, current session id (null = worker-assigned default), share token, connection state, package version.',
      inputSchema: {},
    },
    async () => {
      const info = {
        transport: client.transport,
        wsUrl: client.transport === 'ws' ? client.url : null,
        sessionId: client.sessionId,
        shareToken: client.shareToken,
        connected: client.connected,
        version: VERSION,
      }
      return { content: [{ type: 'text', text: JSON.stringify(info) }] }
    },
  )

  server.registerTool(
    'use_session',
    {
      title: 'Switch session',
      description:
        'Call this BEFORE any other classcad tool when the user names a session or hands you a session/token URL — the MCP opens its engine link lazily, so the first tool call decides which session is used. Modes: (1) sessionId — attaches to a named ClassCAD session (ClassCAD-Session-Id header) on the configured worker; empty/omitted = fresh worker-assigned session. (2) url — a ws(s):// URL from a multi-client server, typically carrying an invite token (wss://host/?invite=…); connected VERBATIM. (3) an http(s):// APP SHARE LINK from a buerli app\'s Session Management: with ?invite=… the token is applied to the configured worker URL (the app runs against a ClassCAD server); with ?bridge=… the app runs the engine IN-PAGE (WASM) and the MCP attaches to it through the bridge listener — every command then runs inside that app, and the app must stay open. Without either, the MCP runs its own session. Reconnecting clears cached structure/graphic state — the next tool call repopulates it.',
      inputSchema: {
        sessionId: z.string().optional()
          .describe('Target session id (named-session model). Empty string or omitted = no header (worker-assigned session).'),
        url: z.string().optional()
          .describe('ws(s):// URL to connect to VERBATIM — e.g. a multi-client token/invite URL (wss://host/?invite=…). An http(s):// app share link with ?invite= is accepted too: the invite token is extracted and applied to the configured worker URL. Takes precedence over sessionId.'),
      },
    },
    async ({ sessionId, url }) => {
      const target = sessionId && sessionId.length > 0 ? sessionId : null
      try {
        let wsUrl = url && url.length > 0 ? url : null
        // App share links (http/https) point at the WEB APP, not the CAD
        // server — carry over only the invite token onto the worker base URL.
        if (wsUrl && /^https?:\/\//i.test(wsUrl)) {
          const params = new URL(wsUrl).searchParams
          const bridge = params.get('bridge')
          if (bridge) {
            // In-app engine: attach through the bridge, no worker involved.
            await client.reconnectBridge(bridge)
            return {
              content: [{ type: 'text', text: JSON.stringify({ ok: true, transport: 'bridge', shareToken: bridge }) }],
            }
          }
          const invite = params.get('invite')
          if (!invite) {
            throw new Error(
              `"${wsUrl}" is an http(s) app link without an ?invite= or ?bridge= token. ` +
              'Pass the ws(s):// URL of the ClassCAD server (optionally with ?invite=…), or an app share link that carries ?invite= / ?bridge=.',
            )
          }
          const base = client.baseUrl.replace(/\/+$/, '')
          wsUrl = `${base}/?invite=${encodeURIComponent(invite)}`
        }
        if (wsUrl) await client.reconnectUrl(wsUrl)
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

  // Bridge tools (app-state read/write) — only when the listener is up.
  if (bridgeRegistry) registerBridgeTools(server, client, bridgeRegistry)

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
