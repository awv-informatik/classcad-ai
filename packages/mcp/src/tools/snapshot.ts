// snapshot — render the current drawing and return it as an inline PNG image
// block plus the on-disk path.
//
// Rendering comes from @classcad/renderer (the shared engine) — this tool
// exposes its full verification toolkit: named views AND arbitrary cameras,
// section planes, four-view sheets, native/distinct colors, highlight ids,
// probe markers, sketch overlay, annotations, x-ray, frame pinning, layers.
//
// The PNG is also persisted under
//   $CLASSCAD_SNAPSHOT_DIR (env override) — or
//   <os.tmpdir()>/classcad-snapshots/                — default
// so the user can open it later. Files are NOT auto-cleaned.

import { z } from 'zod'
import { mkdirSync, readFileSync } from 'fs'
import { isAbsolute, join, resolve } from 'path'
import { tmpdir } from 'os'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Client } from '../client.js'
import { renderSession } from '@classcad/renderer/node'

function snapshotDir(outDir?: string): string {
  const envDir = outDir ?? process.env.CLASSCAD_SNAPSHOT_DIR
  const dir = envDir ? resolve(envDir) : join(tmpdir(), 'classcad-snapshots')
  mkdirSync(dir, { recursive: true })
  return dir
}

function timestamp(): string {
  // 2026-05-01T12-34-56Z — filesystem-safe ISO basic format
  return new Date().toISOString().replace(/[:.]/g, '-').replace(/-\d+Z$/, 'Z')
}

const viewSchema = z.union([
  z.enum(['iso', 'top', 'bottom', 'front', 'back', 'left', 'right']),
  z.object({ azimuth: z.number().optional(), elevation: z.number().optional() })
    .describe('Turntable camera in DEGREES (Z-up): azimuth 0 = front, 90 = camera at +X; elevation 0 = horizon, 90 = top.'),
  z.object({ direction: z.array(z.number()).length(3), up: z.array(z.number()).length(3).optional() })
    .describe('Explicit orthographic look direction (from camera toward the scene).'),
])

export function registerSnapshotTool(server: McpServer, client: Client): void {
  server.registerTool(
    'snapshot',
    {
      title: 'Snapshot drawing',
      description:
        'Render the current drawing as an inline PNG (also written to disk: outDir, else $CLASSCAD_SNAPSHOT_DIR, else <tmpdir>/classcad-snapshots). ' +
        'The image is returned to the MODEL as an inline image block — no follow-up Read is needed to see it. ' +
        'The USER may not see tool results (Claude Code / desktop Code tab do not render them): ' +
        'send the saved PNG path through the host\'s file-sending tool (e.g. SendUserFile) if the user should see the render. ' +
        'Hosts preview only files inside the session\'s own folders (Claude Code: the scratchpad directory or the project) — anywhere else the user gets a grey placeholder card. ' +
        'So when you intend to send the render, pass outDir = your scratchpad directory (or a folder in the project). ' +
        'Call after a meaningful geometry change, NOT after every parameter tweak. ' +
        'Verification options: section (cut through internals), sheet (four labeled views, shared ortho scale), ' +
        'highlight (face/edge/body ids in signal color), markers (probe crosshairs at world points), ' +
        'sketchOverlay (sketch curves on their real plane), annotate (extents + axes triad + scale bar), ' +
        'xray (hidden geometry shines through), colors "distinct" (one color per body — booleans/splits/patterns), ' +
        'frame (pin an earlier snapshot\'s reported frame for pixel-comparable before/after).',
      inputSchema: {
        label: z.string().optional().describe('Filename label. Default "snapshot".'),
        outDir: z
          .string()
          .optional()
          .describe('Absolute directory for the PNG (created if missing). Pass your session scratchpad when the user should see the file — hosts preview only files in session folders.'),
        width: z.number().int().min(64).max(4096).optional().describe('Pixels (default 1200).'),
        height: z.number().int().min(64).max(4096).optional().describe('Pixels (default 900).'),
        view: viewSchema.optional().describe('Camera: named view (default "iso") or arbitrary orthographic camera.'),
        zoom: z.number().min(0.05).max(50).optional()
          .describe('Multiplier on auto-fit scale. 1=fit-all (default), >1 zooms in.'),
        lookAt: z.array(z.number()).length(3).optional()
          .describe('World-space [x,y,z] that lands at screen center. Omit for bbox center.'),
        layers: z.array(z.enum(['solid', 'sketch', 'curves', 'workgeo'])).optional()
          .describe('Content layers to render. Default ["solid"].'),
        colors: z.enum(['native', 'distinct']).optional()
          .describe('"native" (default): the model\'s own colors. "distinct": one palette color per body.'),
        section: z.object({
          origin: z.array(z.number()).length(3),
          normal: z.array(z.number()).length(3),
        }).optional().describe('Cut the solids at a plane; the positive side of the normal is removed (uncapped, interior shaded).'),
        sheet: z.union([z.boolean(), z.array(viewSchema).length(4), z.array(viewSchema).length(2)]).optional()
          .describe('Multi-view sheet in ONE image. true or 4 views = quadrants (default top/iso/front/right; ortho views share one scale). 2 views = side-by-side panels labeled A | B — use for the mirror check: [matched view, same view with negated azimuth] in a single render.'),
        highlight: z.array(z.number()).optional()
          .describe('Ids rendered in signal color: graphic container ids, owning solid ids, face mesh ids, edge ids. CAUTION: face/edge ids are only stable within one graphic payload (recalc reassigns them) — across tool calls use highlightAt.'),
        highlightAt: z.array(z.array(z.number()).length(3)).optional()
          .describe('World points [[x,y,z],…]: the closest FACE in the rendered payload is highlighted per point. Geometrically anchored — the robust way to highlight a face found via run_script (return a point on it, not its mesh id).'),
        markers: z.array(z.object({
          position: z.array(z.number()).length(3),
          label: z.string().optional(),
          color: z.array(z.number()).length(3).optional(),
        })).optional().describe('Probe markers (crosshair + label) at world coordinates, drawn on top.'),
        sketchOverlay: z.boolean().optional()
          .describe('Draw sketch curves in 3D on their actual plane over the solid render.'),
        annotate: z.boolean().optional()
          .describe('Measurement overlay: bbox extents, view-oriented axes triad, scale bar.'),
        xray: z.boolean().optional().describe('Translucent bodies — hidden geometry shines through.'),
        frame: z.object({ scale: z.number(), midX: z.number(), midY: z.number() }).optional()
          .describe('Pin the frame reported by an earlier snapshot (same view/size) for pixel-comparable before/after.'),
        recalc: z.boolean().optional()
          .describe('Default true. Set false for solid.*/entity-injection sessions — recalc destroys injected bodies.'),
        source: z.enum(['graphic', 'stl']).optional()
          .describe('"stl": render the tessellated STL export instead of the engine graphic (explicit fallback; no brep edges).'),
      },
    },
    async (input) => {
      const { label, outDir, ...options } = input as Record<string, any>
      const safeLabel = ((label as string) ?? 'snapshot').replace(/[^a-zA-Z0-9_-]/g, '_')
      if (outDir !== undefined && !isAbsolute(outDir)) {
        return { content: [{ type: 'text' as const, text: `outDir must be an absolute path (the daemon's working directory is not yours): ${outDir}` }], isError: true }
      }
      const dir = snapshotDir(outDir)
      const prefix = `${safeLabel}-${timestamp()}`

      let renders: Array<{ type: string; file: string; frame?: unknown }>
      try {
        renders = await renderSession(client, prefix, dir, {
          width: options.width ?? 1200,
          height: options.height ?? 900,
          ...options,
          layers: options.layers ?? ['solid'],
        })
      } catch (e) {
        // renderSession fails LOUDLY with cause + remedies (e.g. no graphic
        // data → suggests source: "stl"). Surface that verbatim to the model.
        return { content: [{ type: 'text' as const, text: e instanceof Error ? e.message : String(e) }] }
      }

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

      // Inline image first (what the MODEL sees), then the path note — with a reminder
      // that the user may not see tool-result images — and, when available, the
      // frame, so a later snapshot can pin it (before/after).
      const noteLines = [paths.length === 1 ? `Saved: ${paths[0]}` : `Saved:\n${paths.join('\n')}`]
      const framed = renders.find(r => (r as any).frame)
      if (framed && (framed as any).frame) noteLines.push(`frame: ${JSON.stringify((framed as any).frame)}`)
      noteLines.push(
        'Note: the user may not see this image in their transcript — send the saved file via the host\'s file-sending tool (e.g. SendUserFile) if they should see it.' +
          (outDir ? '' : ' Hosts preview only files in session folders: re-run with outDir = your scratchpad before sending, or the user sees a grey placeholder.'),
      )
      return {
        content: [
          ...imageBlocks,
          { type: 'text', text: noteLines.join('\n') },
        ] as any,
      }
    },
  )
}
