// snapshot — render the current drawing and return inline PNG content blocks
// AND persist the same files to disk so hosts that don't render inline MCP
// image content (some Claude Code versions) can still surface the image via
// the Read tool, or the user can open the path manually.
//
// The renderer (ported from scripts/render-direct.mjs) writes PNGs to a
// directory we control. Files are NOT cleaned up — they live in
//   $CLASSCAD_SNAPSHOT_DIR (env override) — or
//   <os.tmpdir()>/classcad-snapshots/                — default
// Each filename embeds the label + an ISO timestamp + the layer type, so
// repeated calls don't collide.

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
        'Render the current drawing. Returns ONE inline PNG image block AND its ' +
        'absolute file path on disk (in $CLASSCAD_SNAPSHOT_DIR or <tmpdir>/classcad-snapshots).' +
        '\n\n' +
        'CALL THIS PROACTIVELY after every geometry change — features added, parameters ' +
        'updated, booleans, fillets, deletes. The user wants to watch the model build, ' +
        'not be asked.' +
        '\n\n' +
        'IF THE USER SAYS THEY CANNOT SEE THE IMAGE: the inline PNG block may not be ' +
        'rendered by their host. Read the absolute path from the metadata block and ' +
        'either share it as-is, or use the Read tool on it so the image surfaces inline. ' +
        'Do not call snapshot again — the file is already on disk.' +
        '\n\n' +
        'Default = solid only — one image of the 3D model in the requested camera view. ' +
        'Other layers (sketches, curves, work geometry / axis triad) are OPT-IN via the ' +
        '`layers` argument. When multiple layers are requested they are MERGED into the ' +
        'same PNG: 3D layers (solid, curves, workgeo) share a camera and are alpha-' +
        'composited; sketches sit beneath the 3D view as a row of 2D panels. Auto-zooms ' +
        'to fit; for dimension verification pair the snapshot with tree/find/inspect.',
      inputSchema: {
        label: z.string().optional().describe('Short label for the snapshot — used in the filename. Default "snapshot".'),
        width: z.number().int().min(64).max(4096).optional().describe('Image width in pixels (default 1600).'),
        height: z.number().int().min(64).max(4096).optional().describe('Image height in pixels (default 1200).'),
        view: z.enum(['iso', 'top', 'bottom', 'front', 'back', 'left', 'right']).optional()
          .describe('Camera direction. CAD view-cube standard. Default "iso" (corner view). ' +
                    'top = looking down -Z; front = looking +Y; right = looking -X; etc.'),
        zoom: z.number().min(0.05).max(50).optional()
          .describe('Multiplier on the auto-fit scale. 1 = fit-all (default), 2 = double the on-screen size, 0.5 = half. ' +
                    'Use values >1 to focus tighter on a region (combine with lookAt).'),
        lookAt: z.array(z.number()).length(3).optional()
          .describe('World-space [x, y, z] point that should land at screen center. Omit to use the model bounding-box center.'),
        layers: z.array(z.enum(['solid', 'sketch', 'curves', 'workgeo'])).optional()
          .describe('Which content layers to render. Default = ["solid"] — only the 3D model. ' +
                    'Other layers are opt-in: pass e.g. ["solid", "workgeo"] to see the model with ' +
                    'the axis triad overlay, or ["sketch"] for sketches alone. Multiple layers are ' +
                    'MERGED into one PNG (3D layers alpha-composited; sketches stacked as 2D panels ' +
                    'below the 3D view).'),
      },
    },
    async ({ label, width, height, view, zoom, lookAt, layers }) => {
      const safeLabel = (label ?? 'snapshot').replace(/[^a-zA-Z0-9_-]/g, '_')
      const dir = snapshotDir()
      const prefix = `${safeLabel}-${timestamp()}`

      // Ensure graphics are enabled — renderer reads cached payload.
      await client.execute({
        'v1.common.setDatabaseSettings': [{
          isGraphicEnabled: true,
          isCCGraphicEnabled: true,
          isSketchGraphicEnabled: true,
          doCurveTessellation: true,
        }],
      })

      // Default = solid only. Other layers (sketches, curves, workgeo) are opt-in via
      // explicit `layers` and get merged into a single PNG.
      const effectiveLayers: LayerName[] = (layers as LayerName[] | undefined) ?? ['solid']

      const renders = await renderSession(client, prefix, dir, {
        width: width ?? 1600,
        height: height ?? 1200,
        view,
        zoom,
        lookAt: lookAt as [number, number, number] | undefined,
        layers: effectiveLayers,
      })

      const imageBlocks: Array<{ type: 'image'; data: string; mimeType: string }> = []
      const meta: Array<{ type: string; path: string; bytes: number }> = []

      for (const r of renders) {
        const fullPath = join(dir, r.file)
        try {
          const buf = readFileSync(fullPath)
          imageBlocks.push({ type: 'image', data: buf.toString('base64'), mimeType: 'image/png' })
          meta.push({ type: r.type, path: fullPath, bytes: buf.length })
        } catch {
          // Skip files that didn't materialize
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

      // Compose the response: one text block with a clear paths summary,
      // then the inline image blocks. The text block is the discoverable
      // fallback for hosts that don't render inline images.
      const pathsList = meta.map(m => `${m.type}: ${m.path} (${m.bytes} bytes)`).join('\n')
      const summary =
        `Rendered ${imageBlocks.length} image(s) for "${safeLabel}".\n` +
        `Paths (read these with the Read tool if the inline images aren't visible):\n` +
        pathsList

      return {
        content: [
          { type: 'text', text: summary },
          ...imageBlocks,
        ] as any,
      }
    },
  )
}
