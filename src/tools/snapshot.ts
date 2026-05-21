// snapshot — render the current drawing and return it as an inline PNG image
// block plus the on-disk path.
//
// The PNG is also persisted under
//   $CLASSCAD_SNAPSHOT_DIR (env override) — or
//   <os.tmpdir()>/classcad-snapshots/                — default
// so the user can open it later. Each filename embeds the label + an ISO
// timestamp so repeated calls don't collide. Files are NOT auto-cleaned.
//
// Returning the image inline is what actually surfaces the render to the user
// in MCP hosts that render image content (Claude Code, etc.). The path text is
// kept as a short trailing note for the model's own reference.

import { z } from 'zod'
import { mkdirSync, readFileSync } from 'fs'
import { join, resolve } from 'path'
import { tmpdir } from 'os'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Client } from '../client.js'
// @ts-expect-error — JS module ported from scripts/render-direct.mjs; types declared inline below.
import { renderSession as renderSessionRaw } from '../render.mjs'

type RenderResult = { type: string; file: string }
type ViewName = 'iso' | 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right'
type LayerName = 'solid' | 'sketch' | 'curves' | 'workgeo'
type RenderOptions = {
  width?: number
  height?: number
  view?: ViewName
  zoom?: number
  lookAt?: [number, number, number]
  layers?: LayerName[]
}
const renderSession: (
  client: Client,
  prefix: string,
  outDir: string,
  options?: RenderOptions,
) => Promise<RenderResult[]> = renderSessionRaw

function snapshotDir(): string {
  const envDir = process.env.CLASSCAD_SNAPSHOT_DIR
  const dir = envDir ? resolve(envDir) : join(tmpdir(), 'classcad-snapshots')
  mkdirSync(dir, { recursive: true })
  return dir
}

function timestamp(): string {
  // 2026-05-01T12-34-56Z — filesystem-safe ISO basic format
  return new Date().toISOString().replace(/[:.]/g, '-').replace(/-\d+Z$/, 'Z')
}

export function registerSnapshotTool(server: McpServer, client: Client): void {
  server.registerTool(
    'snapshot',
    {
      title: 'Snapshot drawing',
      description:
        'Render the current drawing as an inline PNG (also written to disk under $CLASSCAD_SNAPSHOT_DIR or <tmpdir>/classcad-snapshots). ' +
        'The host renders the image directly — no follow-up Read is needed. ' +
        'Call after a meaningful geometry change (a new part, a completed feature, a boolean), NOT after every parameter tweak or intermediate step. ' +
        'Default layers=["solid"]; other layers (sketch, curves, workgeo) are opt-in and merged into one PNG.',
      inputSchema: {
        label: z.string().optional().describe('Filename label. Default "snapshot".'),
        width: z.number().int().min(64).max(4096).optional().describe('Pixels (default 1200).'),
        height: z.number().int().min(64).max(4096).optional().describe('Pixels (default 900).'),
        view: z.enum(['iso', 'top', 'bottom', 'front', 'back', 'left', 'right']).optional()
          .describe('Camera. CAD view-cube convention. Default "iso".'),
        zoom: z.number().min(0.05).max(50).optional()
          .describe('Multiplier on auto-fit scale. 1=fit-all (default), >1 zooms in.'),
        lookAt: z.array(z.number()).length(3).optional()
          .describe('World-space [x,y,z] that lands at screen center. Omit for bbox center.'),
        layers: z.array(z.enum(['solid', 'sketch', 'curves', 'workgeo'])).optional()
          .describe('Content layers to render. Default ["solid"].'),
      },
    },
    async ({ label, width, height, view, zoom, lookAt, layers }) => {
      const safeLabel = (label ?? 'snapshot').replace(/[^a-zA-Z0-9_-]/g, '_')
      const dir = snapshotDir()
      const prefix = `${safeLabel}-${timestamp()}`

      await client.execute({
        'v1.common.setDatabaseSettings': [{
          isGraphicEnabled: true,
          isCCGraphicEnabled: true,
          isSketchGraphicEnabled: true,
          doCurveTessellation: true,
        }],
      })

      const effectiveLayers: LayerName[] = (layers as LayerName[] | undefined) ?? ['solid']

      const renders = await renderSession(client, prefix, dir, {
        width: width ?? 1200,
        height: height ?? 900,
        view,
        zoom,
        lookAt: lookAt as [number, number, number] | undefined,
        layers: effectiveLayers,
      })

      const imageBlocks: Array<{ type: 'image'; data: string; mimeType: string }> = []
      const paths: string[] = []
      for (const r of renders) {
        const fullPath = join(dir, r.file)
        try {
          const buf = readFileSync(fullPath)
          imageBlocks.push({ type: 'image', data: buf.toString('base64'), mimeType: 'image/png' })
          paths.push(fullPath)
        } catch {
          /* skip files that didn't materialize */
        }
      }

      if (imageBlocks.length === 0) {
        return {
          content: [{
            type: 'text',
            text: 'No renderable content. Add geometry first (a part, sketch, or feature) and try again.',
          }],
        }
      }

      // Inline image first (that's what the user sees), short path note last
      // for the model's own reference if it needs to mention the file location.
      const pathNote = paths.length === 1 ? `Saved: ${paths[0]}` : `Saved:\n${paths.join('\n')}`
      return {
        content: [
          ...imageBlocks,
          { type: 'text', text: pathNote },
        ] as any,
      }
    },
  )
}
