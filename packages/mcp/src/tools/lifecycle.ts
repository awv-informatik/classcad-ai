// Lifecycle tools: clear, save, load.

import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Client } from '../client.js'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute } from 'node:path'
import { buildScene, sceneToGlb } from '../viewer/scene.js'
import { exportAllowed } from '../engine/key.js'

export function registerLifecycleTools(server: McpServer, client: Client): void {
  server.registerTool(
    'clear',
    {
      title: 'Clear drawing',
      description: 'Empty the drawing (v1.common.clear). Call it BEFORE starting a new, unrelated model in a session that already holds one: the drawing persists between requests, part.create refuses a second root, and anything built on the old part would carry its geometry along. Not needed for changes to the current model. The graphic and renders are empty afterwards too — no reconnect needed.',
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
      description:
        'Write the current drawing to a file, or return it as base64. Formats: STP (STEP, exact geometry), STL (triangles), GLB (binary glTF: triangles with colours, for 3D viewers and the web), OFB (ClassCAD\'s own format: the model with its features, to open again in ClassCAD or Buerligons), JSON. ' +
        'With `path` the file is written to disk and only its path and size come back — the way to hand the user a model (give them the path); without it the content is returned base64-encoded, which is large. ' +
        'The user can also save the model themselves from what `view` opens.',
      inputSchema: {
        format: z.enum(['STP', 'STL', 'GLB', 'OFB', 'JSON']).describe('Output format.'),
        path: z.string().optional()
          .describe('Absolute file path to write, e.g. /Users/me/Desktop/flange.stp (folders are created). Omit to get the content back as base64.'),
        analytic: z.boolean().optional()
          .describe('STP only: write planes, cylinders, cones, spheres and tori as such instead of as B-spline surfaces. Other CAD systems read such a file faster and recognise its holes and flats.'),
      },
    },
    async ({ format, path, analytic }) => {
      const allowed = exportAllowed(format)
      if (!allowed.ok) return { isError: true, content: [{ type: 'text' as const, text: JSON.stringify({ format, success: false, error: allowed.message }) }] }
      let data: Buffer | null = null
      let maxLevel = 0
      if (format === 'GLB') {
        // The engine has no glTF: packed here from the same graphic the 3D view draws.
        const scene = buildScene((await client.getTree()) as Record<string, any>, (await client.getGraphic()) as { containers?: any[] } | null)
        if (scene.bodies.length) data = sceneToGlb(scene)
      } else {
        const args: Record<string, unknown> = { format, encoding: 'base64' }
        if (format === 'STP') args.stp = analytic === undefined ? { version: 2 } : { version: 2, analytic: analytic ? 1 : 0 }
        if (format === 'STL') args.stl = { binary: true, facetingTol: 0.1, angleTol: 6 }
        const r = await client.execute<{ success: boolean; content: string }>({ 'v1.common.save': [args] })
        maxLevel = r.maxLevel
        if (r.result?.content) data = Buffer.from(r.result.content, 'base64')
      }
      if (!data) {
        return { isError: true, content: [{ type: 'text' as const, text: JSON.stringify({ format, success: false, error: 'Nothing to save: the drawing has no geometry in this format.', maxLevel }) }] }
      }
      if (path) {
        if (!isAbsolute(path)) return { isError: true, content: [{ type: 'text' as const, text: JSON.stringify({ format, success: false, error: `path must be absolute: ${path}` }) }] }
        mkdirSync(dirname(path), { recursive: true })
        writeFileSync(path, data)
        return { content: [{ type: 'text' as const, text: JSON.stringify({ format, success: true, path, bytes: data.length, maxLevel }) }] }
      }
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ format, success: true, bytes: data.length, content: data.toString('base64'), maxLevel }),
        }],
      }
    },
  )

  server.registerTool(
    'load',
    {
      title: 'Load drawing',
      description:
        'Load a drawing, replacing the current one: from a file on disk (`path`) or from base64-encoded content. Formats: STP (STEP), STL, OFB, JSON. ' +
        'Prefer `path`: the file is read here and never passes through the conversation, which is the only practical way for a model file of real size. ' +
        'Give exactly one of `path` and `content`.',
      inputSchema: {
        format: z.enum(['OFB', 'STP', 'STL', 'JSON']).describe('Input format.'),
        path: z.string().optional()
          .describe('Absolute path of the file to load, e.g. /Users/me/parts/bracket.step.'),
        content: z.string().optional().describe('Base64-encoded payload, when there is no file.'),
      },
    },
    async ({ format, path, content }) => {
      const fail = (error: string) => ({ isError: true, content: [{ type: 'text' as const, text: JSON.stringify({ format, ok: false, error }) }] })
      if ((path === undefined) === (content === undefined)) return fail('Give exactly one of path and content.')
      let data = content as string
      let bytes: number | undefined
      if (path !== undefined) {
        if (!isAbsolute(path)) return fail(`path must be absolute: ${path}`)
        try {
          const file = readFileSync(path)
          bytes = file.length
          data = file.toString('base64')
        } catch (e) {
          return fail(`Cannot read ${path}: ${(e as Error).message}`)
        }
      }
      // NOTE: the engine's load parameter is `data` (a prior save's payload) —
      // `content` is silently ignored (error 1004 "Either data, file or url…").
      const r = await client.execute({
        'v1.common.load': [{ format, encoding: 'base64', data, doClear: 1 }],
      })
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ ok: r.maxLevel <= 31, ...(path !== undefined ? { path, bytes } : {}), maxLevel: r.maxLevel, messages: r.messages }),
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
      // An OFB save, held in this process.
      const r = await client.execute<{ success: boolean; content: string }>({
        'v1.common.save': [{ format: 'OFB', encoding: 'base64' }],
      })
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
