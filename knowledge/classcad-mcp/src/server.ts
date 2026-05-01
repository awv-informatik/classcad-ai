#!/usr/bin/env node
// server.ts — ClassCAD MCP server entry point.
//
// Speaks Model Context Protocol over stdio. Connects to a ClassCAD worker on
// startup (CLASSCAD_WS_URL, default ws://0.0.0.0:9094/) and stays connected
// for the life of the process.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { connect, type Client } from './client.js'
import { registerLifecycleTools } from './tools/lifecycle.js'
import { registerStateTools } from './tools/state.js'
import { registerCallTool } from './tools/call.js'
import { registerDocsTools } from './tools/docs.js'
import { registerSnapshotTool } from './tools/snapshot.js'

const WS_URL = process.env.CLASSCAD_WS_URL ?? 'ws://0.0.0.0:9094/'
const VERSION = '0.1.0'

async function main(): Promise<void> {
  // Connect to the worker before announcing the server. If the worker isn't
  // up, fail fast with a clear message — the host won't see ambiguous tool
  // errors mid-session.
  let client: Client
  try {
    client = await connect(WS_URL, { graphics: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    process.stderr.write(`[classcad-mcp] Failed to connect to ${WS_URL}: ${msg}\n`)
    process.stderr.write(`[classcad-mcp] Start the worker with: classcad-cli worker\n`)
    process.exit(1)
  }

  const server = new McpServer({
    name: 'classcad',
    version: VERSION,
  })

  server.registerTool(
    'session_info',
    {
      title: 'Session info',
      description: 'Return ClassCAD MCP session status: WS URL, connection state, package version.',
      inputSchema: {},
    },
    async () => {
      const connected = client.ws.readyState === client.ws.OPEN
      const info = { wsUrl: client.url, connected, version: VERSION }
      return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] }
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
