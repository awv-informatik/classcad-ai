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
import { registerCallTool } from './tools/call.js'
import { registerDocsTools } from './tools/docs.js'
import { registerSnapshotTool } from './tools/snapshot.js'

const WS_URL = process.env.CLASSCAD_WS_URL ?? 'ws://0.0.0.0:9094/'
const VERSION = '0.1.0'

async function main(): Promise<void> {
  // Build the client without opening the WS. The first tool call that needs
  // the worker will open it — either use_session (with a named session) or
  // any geometry tool (with no session header). This keeps the MCP passive
  // at startup so it never creates a stray ephemeral session.
  const client = await connect(WS_URL, { graphics: true })

  const server = new McpServer({
    name: 'classcad',
    version: VERSION,
  })

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
      return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] }
    },
  )

  server.registerTool(
    'use_session',
    {
      title: 'Switch session',
      description:
        'Call this BEFORE any other classcad tool when the user names a session — the MCP opens its WebSocket lazily, so the first tool call decides which session is used. Attaches to a specific ClassCAD session (sent as the ClassCAD-Session-Id header), e.g. one Buerligons is already using, so model changes are shared. Pass sessionId="" or omit it to (re)connect with no session header (worker auto-creates a fresh session). Reconnecting clears cached structure/graphic state — the next tool call will repopulate it.',
      inputSchema: {
        sessionId: z.string().optional()
          .describe('Target session id. Empty string or omitted = no header (default worker-assigned session).'),
      },
    },
    async ({ sessionId }) => {
      const target = sessionId && sessionId.length > 0 ? sessionId : null
      try {
        await client.reconnect(target)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return {
          isError: true,
          content: [{ type: 'text', text: JSON.stringify({ ok: false, error: msg }, null, 2) }],
        }
      }
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ ok: true, sessionId: client.sessionId, wsUrl: client.url }, null, 2),
        }],
      }
    },
  )

  registerLifecycleTools(server, client)
  registerStateTools(server, client)
  registerCallTool(server, client)
  registerDocsTools(server)
  registerSnapshotTool(server, client)

  // Cleanly close the WS on shutdown.
  const shutdown = () => { try { client.close() } catch {} ; process.exit(0) }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch(err => {
  process.stderr.write(`[classcad-mcp] FATAL: ${err?.message ?? err}\n`)
  process.exit(1)
})
