/**
 * node.mjs — Node adapter: PNG encoding (sharp) + file output + the
 * harness-compatible renderSession(client, prefix, outDir, options) entry.
 *
 * Everything portable lives in core.mjs; this file only adds what needs
 * Node (sharp, filesystem).
 */

import sharp from 'sharp'
import { renderSessionData, renderSolidZBuffer, analyzeSession, setViewport } from './core.mjs'
import { parseSTL } from './stl.mjs'

export * from './core.mjs'
export * from './stl.mjs'

/** Encode an RGBA pixel buffer as PNG bytes. */
export async function pixelsToPng(pixels, width, height) {
  return sharp(pixels, { raw: { width, height, channels: 4 } }).png().toBuffer()
}

/** Save an RGBA pixel buffer as a PNG file. */
export async function savePNG(pixels, width, height, path) {
  await sharp(pixels, { raw: { width, height, channels: 4 } }).png().toFile(path)
}

/** Rasterize an SVG string to PNG bytes. */
export async function svgToPngBuffer(svg) {
  return sharp(Buffer.from(svg)).png().toBuffer()
}

/** Rasterize an SVG string to a PNG file. */
export async function svgToPng(svg, pngPath) {
  await sharp(Buffer.from(svg)).png().toFile(pngPath)
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
export async function fetchGraphic(client, { recalc = true } = {}) {
  const { execute, getLastGraphic } = client
  let graphic = null
  if (recalc) {
    try {
      const r = await execute({ 'v1.common.recalc': [{}] })
      if (r.graphic?.containers?.some(c => c.meshes?.length > 0 || c.edges?.length > 0)) {
        graphic = r.graphic
      }
    } catch (e) { /* fall back below */ }
  }
  if (!graphic?.containers?.some(c => c.meshes?.length > 0 || c.edges?.length > 0)) {
    graphic = getLastGraphic?.() ?? graphic
  }
  return graphic
}

/**
 * Render the STL EXPORT of the current session as a solid image. Used via
 * renderSession's `source: 'stl'` — an EXPLICIT alternative path for sessions
 * where the graphic pipeline yields nothing (graphics-disabled client), or to
 * verify the exported artifact independently of the live graphic.
 */
async function renderStlSource(client, options) {
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
 *   plus `colors: 'native' | 'distinct'` ('native' default: the model's own
 *   ClassCAD colors; 'distinct': one palette color per body — use to tell bodies
 *   apart in booleans/splits/patterns), `recalc` (default true; set false for
 *   EIF/direct-modeling sessions) and
 *   `source: 'graphic' | 'stl'` (default 'graphic'; 'stl' renders the STL export
 *   instead — explicit fallback for graphics-disabled clients, marked in the result)
 * @returns {Promise<{ type: string, file: string, source?: 'stl' }[]>}
 */
export async function renderSession(client, prefix, outDir, options = {}) {
  if (options.source === 'stl') {
    const zbuf = await renderStlSource(client, options)
    const file = `${prefix}-solid-stl.png`
    await savePNG(zbuf.pixels, zbuf.width, zbuf.height, `${outDir}/${file}`)
    // source: 'stl' marks this as the fallback/export-verification path — the
    // image shows the tessellated EXPORT, not the engine's brep graphic (no edges).
    return [{ type: 'solid', file, source: 'stl' }]
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
  const treeResult = await client.request('GetTree')
  const tree = treeResult.structure?.tree || {}
  const graphic = await fetchGraphic(client, { recalc: options.recalc !== false })

  // Explicit failure instead of a silent empty render: the tree says there is
  // renderable content, but no graphic containers arrived for it.
  const content = analyzeSession(tree)
  const hasSolidGraphic = graphic?.containers?.some(c => c.type === 1 && c.meshes?.length > 0)
  const hasCurveGraphic = graphic?.containers?.some(c => c.type === 2 && c.edges?.length > 0)
  if (content.solids.length > 0 && !hasSolidGraphic) {
    throw new Error(
      `No graphic data for ${content.solids.length} solid(s) in the session. ` +
      `Likely cause: the client is connected with graphics disabled (Configuration sendGraphic_Kernel=false), ` +
      `or the server did not push graphic containers. ` +
      `Fix: reconnect with graphics enabled — or render the STL export instead: ` +
      `renderSession(client, prefix, outDir, { source: 'stl' }) (marked as source "stl" in the result; no brep edges).`,
    )
  }
  if (content.solids.length === 0 && content.curves.length > 0 && !hasCurveGraphic) {
    throw new Error(
      `No graphic data for ${content.curves.length} curve shape(s) in the session. ` +
      `Likely cause: the client is connected with graphics disabled, or curve tessellation is off ` +
      `(setDatabaseSettings doCurveTessellation). There is no STL path for curves — reconnect with graphics enabled.`,
    )
  }

  const entries = await renderSessionData(
    { tree, graphic, execute: task => client.execute(task) },
    options,
  )

  const rendered = []
  for (const e of entries) {
    let file
    if (e.type === 'solid') file = `${prefix}-solid.png`
    else if (e.type === 'sketch') file = `${prefix}-sketch-${String(e.name).replace(/[^a-zA-Z0-9_-]/g, '_')}.png`
    else if (e.type === 'curves') file = `${prefix}-curves.png`
    else file = `${prefix}-${e.type}.png`

    if (e.kind === 'pixels') await savePNG(e.pixels, e.width, e.height, `${outDir}/${file}`)
    else await svgToPng(e.svg, `${outDir}/${file}`)

    const entry = { type: e.type, file }
    if (e.sketchId != null) { entry.sketchId = e.sketchId; entry.name = e.name }
    rendered.push(entry)
  }
  return rendered
}

// Re-exported under its historical harness name.
export { setViewport }
