// State tools: tree, find, inspect.
//
// Read-only access to the cached structure tree. The cache is updated as a
// side effect of any API call (server sends a full snapshot on every Result
// frame), so these tools never trigger a server round-trip unless `refresh`
// is requested.

import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Client } from '../client.js'
import type { StructureNode } from '../types.js'

type SlimNode = { id: unknown; class: string; name: string; parent?: unknown }

function slim(n: StructureNode): SlimNode {
  const out: SlimNode = { id: n.id, class: n.class, name: n.name }
  if (n.parent != null) out.parent = n.parent
  return out
}

export function registerStateTools(server: McpServer, client: Client): void {
  server.registerTool(
    'tree',
    {
      title: 'Structure tree',
      description: 'Return the cached drawing structure tree. Pass refresh=true to force a fresh server fetch first.',
      inputSchema: {
        refresh: z.boolean().optional().describe('Force a server round-trip before reading the cache.'),
      },
    },
    async ({ refresh }) => {
      if (refresh) await client.refreshTree()
      const t = client.getStructure()
      if (!t) {
        return { content: [{ type: 'text', text: JSON.stringify({ tree: null, hint: 'No structure cached yet — make any API call first, or pass refresh=true.' }) }] }
      }
      const nodes = Object.values(t.tree)
      const summary = {
        root: t.root,
        currentProduct: t.currentProduct,
        currentInstance: t.currentInstance,
        nodeCount: nodes.length,
        nodes: nodes.map(slim),
      }
      return { content: [{ type: 'text', text: JSON.stringify(summary) }] }
    },
  )

  server.registerTool(
    'find',
    {
      title: 'Find nodes',
      description: 'Search the cached structure tree by class and/or name substring. Returns slim records (id, class, name, parent).',
      inputSchema: {
        type: z.string().optional().describe('Match nodes whose class === type (e.g. "CC_Part", "CC_Box").'),
        name: z.string().optional().describe('Match nodes whose name contains this substring (case-insensitive).'),
        refresh: z.boolean().optional(),
      },
    },
    async ({ type, name, refresh }) => {
      if (refresh) await client.refreshTree()
      const t = client.getStructure()
      if (!t) return { content: [{ type: 'text', text: '[]' }] }
      const needle = name?.toLowerCase()
      const hits = Object.values(t.tree).filter(n => {
        if (type && n.class !== type) return false
        if (needle && !String(n.name ?? '').toLowerCase().includes(needle)) return false
        return true
      })
      return { content: [{ type: 'text', text: JSON.stringify({ count: hits.length, nodes: hits.map(slim) }) }] }
    },
  )

  server.registerTool(
    'inspect',
    {
      title: 'Inspect node',
      description: 'Return the full record for a single tree node by ID, including members and children.',
      inputSchema: {
        id: z.union([z.string(), z.number()]).describe('Node ID.'),
        refresh: z.boolean().optional(),
      },
    },
    async ({ id, refresh }) => {
      if (refresh) await client.refreshTree()
      const t = client.getStructure()
      const node = t?.tree[String(id)] ?? null
      if (!node) {
        return { content: [{ type: 'text', text: JSON.stringify({ id, found: false }) }] }
      }
      // Include parent chain for orientation.
      const chain: Array<{ id: unknown; class: string; name: string }> = []
      let cur: StructureNode | null = node
      while (cur && cur.parent != null) {
        const p: StructureNode | undefined = t!.tree[String(cur.parent)]
        if (!p) break
        chain.push({ id: p.id, class: p.class, name: p.name })
        cur = p
      }
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ found: true, node, parentChain: chain }),
        }],
      }
    },
  )
}
