/**
 * node.mjs — Node adapter: PNG encoding (sharp) + file output + the
 * harness-compatible renderSession(client, prefix, outDir, options) entry.
 *
 * Everything portable lives in core.mjs; this file only adds what needs
 * Node (sharp, filesystem).
 */

import sharp from 'sharp'
import { renderSessionData, renderSolidZBuffer, analyzeSession, setViewport, applyAdaptiveFaceting } from './core.js'
import { parseSTL } from './stl.js'
import type { TextLabel } from './types.js'

export * from './core.js'
export * from './stl.js'

/** Encode an RGBA pixel buffer as PNG bytes. */
export async function pixelsToPng(pixels: any, width: any, height: any) {
  return sharp(pixels, { raw: { width, height, channels: 4 } }).withMetadata({ density: 72 }).png().toBuffer()
}

/** Save an RGBA pixel buffer as a PNG file; `labels` are drawn on top with a real font. */
export async function savePNG(pixels: any, width: any, height: any, path: any, labels?: TextLabel[]) {
  let img = sharp(pixels, { raw: { width, height, channels: 4 } })
  if (labels?.length) img = sharp(await img.composite([{ input: Buffer.from(labelsToSvg(labels, width, height)), top: 0, left: 0 }]).png().toBuffer())
  await img.withMetadata({ density: 72 }).png().toFile(path)
}

const escapeXml = (t: string) => t.replace(/[<>&"']/g, c => `&#${c.charCodeAt(0)};`)

/**
 * Labels as an SVG overlay of the image size. A monospace font keeps the bitmap
 * font's metrics: cap height ≈ 0.72 em and advance ≈ 0.6 em ≈ 6 px per 7 px of
 * cap height, so text widths match the layout the renderer measured.
 */
export function labelsToSvg(labels: TextLabel[], width: number, height: number): string {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`
  for (const l of labels) {
    const size = Math.max(11, l.capHeight / 0.72)
    svg +=
      `<text x="${l.x.toFixed(1)}" y="${l.y.toFixed(1)}" text-anchor="${l.anchor}" font-family="Menlo, 'SF Mono', Monaco, Consolas, 'DejaVu Sans Mono', 'Liberation Mono', monospace" ` +
      `font-size="${size.toFixed(1)}" font-weight="600" fill="rgb(${l.color.join(',')})">${escapeXml(l.text)}</text>`
  }
  return svg + '</svg>'
}

/** Rasterize an SVG string to PNG bytes. */
export async function svgToPngBuffer(svg: any) {
  return sharp(Buffer.from(svg)).withMetadata({ density: 72 }).png().toBuffer()
}

/** Rasterize an SVG string to a PNG file. */
export async function svgToPng(svg: any, pngPath: any) {
  await sharp(Buffer.from(svg)).withMetadata({ density: 72 }).png().toFile(pngPath)
}

/**
 * Fetch the freshest graphic payload from a live harness client: recalc first
 * (cached graphic may be stale/intermediate), fall back to the client's
 * accumulated last graphic.
 *
 * CAVEAT: `common.recalc` DESTROYS entity-injection (EIF/direct-modeling)
 * bodies. Pass `recalc: false` when the session used solid.* / entityInjection
 * flows — the accumulated graphic is used as-is then.
 */
export async function fetchGraphic(client: any, { recalc = false }: { recalc?: boolean } = {}) {
  // A failed refresh is an error, never permission to show cached geometry.
  if (typeof client.getGraphic === 'function') return client.getGraphic({ recalc })
  if (recalc) {
    const result = await client.execute({ 'v1.common.recalc': [{}] })
    if ((result.maxLevel ?? 0) >= 51) throw new Error('Snapshot regeneration failed')
  }
  const result = await client.request('GetTree')
  if ((result.maxLevel ?? 0) >= 51) throw new Error('Snapshot graphics refresh failed')
  return result.graphic ?? null
}

/**
 * Render the STL EXPORT of the current session as a solid image. Used via
 * renderSession's `source: 'stl'` — an EXPLICIT alternative path for sessions
 * where the graphic pipeline yields nothing (graphics-disabled client), or to
 * verify the exported artifact independently of the live graphic.
 */
async function renderStlSource(client: any, options: any) {
  const { width = 1600, height = 1200 } = options
  const stlR = await client.execute({
    'v1.common.save': [{ format: 'STL', encoding: 'base64', stl: { binary: true, facetingTol: options.facetingTol ?? 0.1, angleTol: options.angleTol ?? 6 } }],
  })
  if (!stlR.result?.success || !stlR.result?.content) {
    throw new Error('source "stl": v1.common.save returned no STL data — the session has no solid geometry to export.')
  }
  const triangles = parseSTL(Buffer.from(stlR.result.content, 'base64'))
  if (!triangles.length) throw new Error('source "stl": the exported STL contains no triangles.')

  // Feed the triangles through the SAME z-buffer renderer as graphic data, so
  // view/zoom/lookAt and shading behave identically (one synthetic container).
  const vertices = [], normals = [], indices = []
  let vi = 0
  for (const t of triangles) {
    for (const [x, y, z] of t.vertices) {
      vertices.push(x, y, z)
      normals.push(t.normal[0], t.normal[1], t.normal[2])
    }
    indices.push(vi, vi + 1, vi + 2)
    vi += 3
  }
  const graphic = { containers: [{ id: 0, owner: 0, type: 1, properties: {}, meshes: [{ id: 0, vertices, normals, indices }], edges: [] }] }
  setViewport({ view: options.view, zoom: options.zoom, lookAt: options.lookAt })
  const zbuf = renderSolidZBuffer(graphic, width, height)
  if (!zbuf) throw new Error('source "stl": STL triangles produced no renderable geometry.')
  return zbuf
}

/**
 * Render all visible content of a live session to PNG files — the drop-in
 * equivalent of the classcad-agent harness renderer.
 *
 * FAILS LOUDLY: if the session contains solids/curves but no graphic data
 * arrived (e.g. the client connected with graphics disabled), this THROWS with
 * the cause and the remedies — it never silently returns an empty render.
 *
 * @param {{ execute: Function, request: Function, getLastGraphic?: Function }} client
 * @param {string} prefix — output file prefix
 * @param {string} outDir — output directory
 * @param {object} [options] — width/height/view/zoom/lookAt (see core.renderSessionData)
 *   plus `graphic` (render this pre-fetched payload instead of fetching —
 *   keeps ids stable for highlights), `colors: 'native' | 'distinct'` ('native' default: the model's own
 *   ClassCAD colors; 'distinct': one palette color per body — use to tell bodies
 *   apart in booleans/splits/patterns), `recalc` (default false; keep false for
 *   EIF/direct-modeling sessions) and
 *   `source: 'graphic' | 'stl'` (default 'graphic'; 'stl' renders the STL export
 *   instead — explicit fallback for graphics-disabled clients, marked in the result),
 *   `quality: 'fine' | 'fast'` (default 'fine': adaptive chord tolerance scaled to
 *   the model bbox before the render fetch, previous worker params restored after;
 *   'fast' keeps the session's current tessellation)
 * @returns {Promise<{ type: string, file: string, source?: 'stl' }[]>}
 */
export async function renderSession(client: any, prefix: any, outDir: any, options: any = {}) {
  if (options.source === 'stl') {
    const zbuf = await renderStlSource(client, options)
    const file = `${prefix}-solid-stl.png`
    await savePNG(zbuf.pixels, zbuf.width, zbuf.height, `${outDir}/${file}`)
    // source: 'stl' marks this as the fallback/export-verification path — the
    // image shows the tessellated EXPORT, not the engine's brep graphic (no edges).
    return [{ type: 'solid', file, source: 'stl', metadata: { source: 'stl', regenerated: false, revision: client.version ?? null, facetingTol: options.facetingTol ?? 0.1, angleTol: options.angleTol ?? 6 } }]
  }
  // Without these database settings the server omits brep EDGE data from the
  // graphic containers — solids then render without their edge overlay. The
  // classcad-agent harness sets this before every snapshot; do the same here
  // so package consumers get the full render by default. (ensureGraphics:
  // false skips it, e.g. when the app manages settings itself.)
  if (options.ensureGraphics !== false) {
    try {
      await client.execute({
        'v1.common.setDatabaseSettings': [
          { isGraphicEnabled: true, isCCGraphicEnabled: true, isSketchGraphicEnabled: true, doCurveTessellation: true },
        ],
      })
    } catch (e) { /* older servers may not support it — render without edges */ }
  }
  // Structure tree: prefer the session's cached, pull-on-demand getTree()
  // (@classcad/script NodeSession, the MCP client) — one round trip at most,
  // and immune to whatever emission flags the connection currently has. A
  // raw GetTree stays the fallback for bare clients; on engines with the
  // per-connection config model it always carries the structure, on older
  // per-request setups it may come back without one (the session's own
  // suppression flags ride along) — then the render would see no solids.
  let tree: any = null
  // options.graphic: render a PRE-FETCHED payload instead of fetching fresh.
  // Use when ids (highlight targets from a script's api.graphic()) must match
  // the rendered graphic exactly — a fresh recalc can rotate container/mesh ids.
  let graphic = options.graphic ?? await fetchGraphic(client, { recalc: options.recalc === true })

  // Adaptive fine tessellation for the render (see applyAdaptiveFaceting).
  // Skipped when: quality 'fast' requested, a pre-fetched payload must keep its
  // ids stable, or recalc is forbidden (EIF/solid.* — re-tessellation needs it).
  if (options.quality === 'fine' && !options.graphic && options.recalc === true) {
    const restore = await applyAdaptiveFaceting(client, graphic)
    if (restore) {
      try {
        graphic = await fetchGraphic(client, { recalc: true }) ?? graphic
      } finally {
        // restore worker-global params; the fine tessellation itself survives
        // until the next recalc, which is exactly what we want
        try { await client.execute({ 'v1.common.setFacetingParameters': [restore] }) } catch { /* leave as-is */ }
      }
    }
  }

  const revision = client.version ?? null
  tree = options.tree ?? (typeof client.getTree === 'function'
    ? await client.getTree()
    : (await client.request('GetTree')).structure?.tree ?? {})
  if (revision !== null && client.version !== revision) throw new Error('Model changed during snapshot capture; retry when idle')
  const metadata = { source: 'graphic', revision, capturedAt: new Date().toISOString(),
    regenerated: options.recalc === true, quality: options.recalc === true ? (options.quality ?? 'current') : 'current',
    warnings: revision === null ? ['Model revision unavailable; capture consistency cannot be verified.'] : [] }

  // Explicit failure instead of a silent empty render: the tree says there is
  // renderable content, but no graphic containers arrived for it.
  const content = analyzeSession(tree)
  const hasSolidGraphic = graphic?.containers?.some((c: any) => c.type === 1 && c.meshes?.length > 0)
  const hasCurveGraphic = graphic?.containers?.some((c: any) => c.type === 2 && c.edges?.length > 0)
  if (content.solids.length > 0 && !hasSolidGraphic) {
    throw new Error(
      `No graphic data for ${content.solids.length} solid(s) in the session. ` +
      `Likely cause: the connection's emission config has graphics disabled (setEmissionConfig sendGraphic_Kernel=false ` +
      `and the client's pull did not switch it on), or the server did not push graphic containers. ` +
      `Fix: pull with graphics enabled (client.getGraphic()) — or render the STL export instead: ` +
      `renderSession(client, prefix, outDir, { source: 'stl' }) (marked as source "stl" in the result; no brep edges).`,
    )
  }
  if (content.solids.length === 0 && content.curves.length > 0 && !hasCurveGraphic) {
    throw new Error(
      `No graphic data for ${content.curves.length} curve shape(s) in the session. ` +
      `Likely cause: the connection's emission config has graphics disabled (setEmissionConfig), or curve tessellation is off ` +
      `(setDatabaseSettings doCurveTessellation). There is no STL path for curves — pull with graphics enabled.`,
    )
  }

  const entries = await renderSessionData(
    { tree, graphic, execute: (task: any) => client.execute(task) },
    options,
  )

  const rendered = []
  for (const e of entries as any[]) {
    let file
    if (e.type === 'solid') file = `${prefix}-solid.png`
    else if (e.type === 'sketch') file = `${prefix}-sketch-${String(e.name).replace(/[^a-zA-Z0-9_-]/g, '_')}.png`
    else if (e.type === 'curves') file = `${prefix}-curves.png`
    else file = `${prefix}-${e.type}.png`

    if (e.kind === 'pixels') await savePNG(e.pixels, e.width, e.height, `${outDir}/${file}`, e.labels)
    else await svgToPng(e.svg, `${outDir}/${file}`)

    const entry: any = { type: e.type, file, metadata }
    if (e.sketchId != null) { entry.sketchId = e.sketchId; entry.name = e.name }
    if (e.frame) entry.frame = e.frame   // reusable via options.frame for before/after
    rendered.push(entry)
  }
  return rendered
}

// Re-exported under its historical harness name.
export { setViewport }
