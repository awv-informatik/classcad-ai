// snapshot — render the current drawing and return inline PNG content blocks.
//
// The renderer (ported from scripts/render-direct.mjs) writes PNGs to disk;
// we run it against a temp directory, read back the PNGs as buffers, and
// stream them inline through MCP. The temp dir is cleaned up afterwards.

import { z } from 'zod'
import { mkdtempSync, readFileSync, rmSync, readdirSync } from 'fs'
import { join } from 'path'
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

export function registerSnapshotTool(server: McpServer, client: Client): void {
  server.registerTool(
    'snapshot',
    {
      title: 'Snapshot drawing',
      description:
        'Render the current drawing and return inline PNG image(s) the user can see. ' +
        'CALL THIS PROACTIVELY after every geometry change — features added, parameters ' +
        'updated, booleans, fillets, deletes. The user wants to watch the model build, ' +
        'not be asked. Treat snapshot as the natural next step after any mutating ' +
        'call_api, not as an optional debugging tool.' +
        '\n\n' +
        'The renderer auto-detects content (solids → isometric mesh, sketches → 2D ' +
        'plot, curves → edges) and may emit multiple PNGs per call (e.g. one for ' +
        'solids and one for work geometry). It auto-zooms to fit — uniform size ' +
        'changes look identical between snapshots, so for dimension verification ' +
        'pair the snapshot with tree/find/inspect for numeric proof.',
      inputSchema: {
        label: z.string().optional().describe('Short label for the snapshot (filename slug, also returned in metadata).'),
        width: z.number().int().min(64).max(4096).optional().describe('Image width in pixels (default 1600).'),
        height: z.number().int().min(64).max(4096).optional().describe('Image height in pixels (default 1200).'),
        view: z.enum(['iso', 'top', 'bottom', 'front', 'back', 'left', 'right']).optional()
          .describe('Camera direction. CAD view-cube standard. Default "iso" (corner view). ' +
                    'top = looking down -Z; front = looking +Y; right = looking -X; etc.'),
        zoom: z.number().min(0.05).max(50).optional()
          .describe('Multiplier on the auto-fit scale. 1 = fit-all (default), 2 = double the on-screen size, 0.5 = half. ' +
                    'Use values >1 to focus tighter on a region (combine with lookAt).'),
        lookAt: z.array(z.number()).length(3).optional()
          .describe('World-space [x, y, z] point that should land at screen center. Omit to use the model bounding-box center (the auto-fit default).'),
        layers: z.array(z.enum(['solid', 'sketch', 'curves', 'workgeo'])).optional()
          .describe('Restrict which content layers are rendered. Default = all layers (solid, sketch, curves, workgeo). ' +
                    'Pass e.g. ["solid"] to suppress the workgeo axes image when only the model matters.'),
      },
    },
    async ({ label, width, height, view, zoom, lookAt, layers }) => {
      const safeLabel = (label ?? 'snapshot').replace(/[^a-zA-Z0-9_-]/g, '_')
      const tmp = mkdtempSync(join(tmpdir(), 'classcad-snapshot-'))
      const prefix = safeLabel

      try {
        // Make sure graphics are enabled before rendering. The renderer reads
        // from the cached graphic payload — if graphics were ever disabled,
        // there'd be nothing to render.
        await client.execute({
          'v1.common.setDatabaseSettings': [{
            isGraphicEnabled: true,
            isCCGraphicEnabled: true,
            isSketchGraphicEnabled: true,
            doCurveTessellation: true,
          }],
        })

        const renders = await renderSession(client, prefix, tmp, {
          width: width ?? 1600,
          height: height ?? 1200,
          view,
          zoom,
          lookAt: lookAt as [number, number, number] | undefined,
          layers: layers as LayerName[] | undefined,
        })

        const blocks: Array<{ type: 'image' | 'text'; data?: string; mimeType?: string; text?: string }> = []
        const meta: Array<{ type: string; file: string; bytes: number }> = []

        if (renders.length === 0) {
          // Renderer returned nothing — fall back to whatever PNGs ended up in tmp.
          const pngs = readdirSync(tmp).filter(f => f.endsWith('.png'))
          for (const f of pngs) {
            const buf = readFileSync(join(tmp, f))
            blocks.push({ type: 'image', data: buf.toString('base64'), mimeType: 'image/png' })
            meta.push({ type: 'unknown', file: f, bytes: buf.length })
          }
          if (blocks.length === 0) {
            return {
              content: [{ type: 'text', text: 'No renderable content. Add geometry first (a part, sketch, or feature) and try again.' }],
            }
          }
        } else {
          for (const r of renders) {
            const path = join(tmp, r.file)
            try {
              const buf = readFileSync(path)
              blocks.push({ type: 'image', data: buf.toString('base64'), mimeType: 'image/png' })
              meta.push({ type: r.type, file: r.file, bytes: buf.length })
            } catch {
              // Skip files that didn't materialize
            }
          }
        }

        // Prepend a small text block describing what's being shown — helps
        // the LLM correlate multiple images (e.g. solid + workgeo).
        blocks.unshift({
          type: 'text',
          text: JSON.stringify({ label: safeLabel, count: blocks.length, images: meta }, null, 2),
        })

        return { content: blocks as any }
      } finally {
        try { rmSync(tmp, { recursive: true, force: true }) } catch {}
      }
    },
  )
}
