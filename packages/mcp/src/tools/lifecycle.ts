// Lifecycle tools: clear, save, load.

import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Client } from '../client.js'

export function registerLifecycleTools(server: McpServer, client: Client): void {
  server.registerTool(
    'clear',
    {
      title: 'Clear drawing',
      description: 'Delete all objects in the current drawing. Wraps v1.common.clear.',
      inputSchema: {
        keepIds: z.array(z.union([z.string(), z.number()])).optional()
          .describe('Object IDs to preserve. Omit to wipe everything.'),
      },
    },
    async ({ keepIds }) => {
      const arg = keepIds ? { keepIds } : {}
      const r = await client.execute({ 'v1.common.clear': [arg] })
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ ok: r.maxLevel <= 31, maxLevel: r.maxLevel, messages: r.messages }),
        }],
      }
    },
  )

  server.registerTool(
    'save',
    {
      title: 'Save drawing',
      description: 'Serialize the current drawing. Returns base64-encoded content. Formats: OFB (native), STP (STEP), STL, JSON.',
      inputSchema: {
        format: z.enum(['OFB', 'STP', 'STL', 'JSON']).describe('Output format.'),
      },
    },
    async ({ format }) => {
      const args: Record<string, unknown> = { format, encoding: 'base64' }
      if (format === 'STP') args.stp = { version: 2 }
      if (format === 'STL') args.stl = { binary: true, facetingTol: 0.1, angleTol: 6 }
      const r = await client.execute<{ success: boolean; content: string }>({
        'v1.common.save': [args],
      })
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            format,
            success: r.result?.success ?? false,
            bytes: r.result?.content ? Buffer.from(r.result.content, 'base64').length : 0,
            content: r.result?.content ?? null,
            maxLevel: r.maxLevel,
          }),
        }],
      }
    },
  )

  server.registerTool(
    'load',
    {
      title: 'Load drawing',
      description: 'Load a previously saved drawing from base64-encoded content. Format must match what save produced.',
      inputSchema: {
        format: z.enum(['OFB', 'STP', 'STL', 'JSON']).describe('Input format.'),
        content: z.string().describe('Base64-encoded payload.'),
      },
    },
    async ({ format, content }) => {
      const r = await client.execute({
        'v1.common.load': [{ format, encoding: 'base64', content }],
      })
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ ok: r.maxLevel <= 31, maxLevel: r.maxLevel, messages: r.messages }),
        }],
      }
    },
  )
}
