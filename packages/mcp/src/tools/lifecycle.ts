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
      description: 'Serialize the current drawing. Returns base64-encoded content. Formats: STP (STEP), STL, JSON. (OFB export is not available in this release.)',
      inputSchema: {
        format: z.enum(['STP', 'STL', 'JSON']).describe('Output format.'),
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
      // NOTE: the engine's load parameter is `data` (a prior save's payload) —
      // `content` is silently ignored (error 1004 "Either data, file or url…").
      const r = await client.execute({
        'v1.common.load': [{ format, encoding: 'base64', data: content, doClear: 1 }],
      })
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ ok: r.maxLevel <= 31, maxLevel: r.maxLevel, messages: r.messages }),
        }],
      }
    },
  )

  // ── checkpoint / restore — cheap rollback (same semantics as buerli-ai) ─────
  // A failed multi-feature attempt leaves half-built features and consumed
  // bodies behind; recovering by delete-archaeology is error-prone. checkpoint
  // = in-memory OFB save held in THIS server process (never enters the model
  // context), restore = clear + reload. Keyed per reconnect generation — a
  // use_session switch invalidates checkpoints from the previous session.
  const MAX_CHECKPOINTS = 5
  const checkpoints = new Map<string, { data: string; createdAt: number }>()
  let checkpointGen = -1
  function bucket(): Map<string, { data: string; createdAt: number }> {
    if (checkpointGen !== client.generation) {
      checkpoints.clear()
      checkpointGen = client.generation
    }
    return checkpoints
  }

  server.registerTool(
    'checkpoint',
    {
      title: 'Checkpoint drawing',
      description:
        'Save the WHOLE drawing state under a label (in-memory, server-side — cheap and instant). ' +
        'Use BEFORE risky sequences (large booleans, trims, experiments): if the attempt goes wrong, ' +
        'restore({label}) brings the drawing back exactly instead of delete-archaeology. ' +
        'Re-using a label overwrites it; at most 5 checkpoints are kept (oldest dropped). ' +
        'Checkpoints die with the server process and with a use_session switch.',
      inputSchema: {
        label: z.string().optional().describe('Checkpoint name, e.g. "before-boolean". Default "checkpoint".'),
      },
    },
    async ({ label }) => {
      const name = (label || 'checkpoint').trim().slice(0, 60) || 'checkpoint'
      // The one OFB save this release makes: held in this process, never returned.
      const r = await client.execute<{ success: boolean; content: string }>({
        'v1.common.save': [{ format: 'OFB', encoding: 'base64' }],
      }, { internalOfb: true })
      if (!r.result?.content) {
        return { isError: true, content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Checkpoint failed: the engine returned no OFB data.', maxLevel: r.maxLevel }) }] }
      }
      const m = bucket()
      m.delete(name)
      m.set(name, { data: r.result.content, createdAt: Date.now() })
      while (m.size > MAX_CHECKPOINTS) {
        const oldest = m.keys().next().value as string
        m.delete(oldest)
      }
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            label: name,
            size: Math.floor((r.result.content.length * 3) / 4),
            stored: [...m.keys()],
            note: `Drawing state saved server-side. restore({ label: "${name}" }) brings it back exactly.`,
          }),
        }],
      }
    },
  )

  server.registerTool(
    'restore',
    {
      title: 'Restore checkpoint',
      description:
        'Replace the drawing with a previously checkpointed state (clear + reload). Without a label, ' +
        'the MOST RECENT checkpoint is restored. All ids from after the checkpoint are stale afterwards — ' +
        're-read them (tree/find) before further operations.',
      inputSchema: {
        label: z.string().optional().describe('Checkpoint name. Default: the most recently created one.'),
      },
    },
    async ({ label }) => {
      const m = bucket()
      if (m.size === 0) {
        return { isError: true, content: [{ type: 'text' as const, text: JSON.stringify({ error: 'No checkpoints exist for this session. Create one with checkpoint first.' }) }] }
      }
      const name =
        (label && label.trim()) ||
        [...m.entries()].sort((a, b) => b[1].createdAt - a[1].createdAt)[0][0]
      const snap = m.get(name)
      if (!snap) {
        return { isError: true, content: [{ type: 'text' as const, text: JSON.stringify({ error: `No checkpoint named "${name}".`, available: [...m.keys()] }) }] }
      }
      const r = await client.execute({ 'v1.common.load': [{ format: 'OFB', encoding: 'base64', data: snap.data, doClear: 1 }] })
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            restored: name,
            ok: r.maxLevel <= 31,
            maxLevel: r.maxLevel,
            note: 'Drawing replaced with the checkpointed state. All ids from after the checkpoint are stale — re-read them (tree/find) before further operations.',
          }),
        }],
      }
    },
  )
}
