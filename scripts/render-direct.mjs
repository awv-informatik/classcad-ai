/**
 * render-direct.mjs — Direct renderer for ClassCAD session data.
 *
 * Renders PNGs from server graphic data (solids) and API queries (sketches/curves)
 * without any STL export intermediary.
 *
 * Three rendering paths, auto-detected from session structure:
 *   1. SOLIDS  — sendGraphic_Kernel mesh/edge/vertex data → isometric SVG → PNG
 *   2. SKETCHES — getGeometry + getPositions/getPoints → 2D SVG → PNG
 *   3. CURVES  — creation params from structure → 2D SVG → PNG
 *
 * Also exports a combined renderer that auto-detects and renders all content types.
 */

import sharp from 'sharp'

const IMG_W = 800
const IMG_H = 600

// ═══════════════════════════════════════════════════════════════════════════
// Projection & Transform
// ═══════════════════════════════════════════════════════════════════════════

function projectIso(x, y, z) {
  const a = Math.PI / 4
  const b = Math.asin(1 / Math.sqrt(3))
  const ca = Math.cos(a), sa = Math.sin(a)
  const cb = Math.cos(b), sb = Math.sin(b)
  const x1 = ca * x + sa * z
  const y1 = y
  const z1 = -sa * x + ca * z
  return [x1, cb * y1 - sb * z1, sb * y1 + cb * z1]
}

function bbox2d(pts) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const [x, y] of pts) {
    if (x < minX) minX = x; if (x > maxX) maxX = x
    if (y < minY) minY = y; if (y > maxY) maxY = y
  }
  return { minX, maxX, minY, maxY }
}

function viewTransform(pts2d, width, height, margin = 40) {
  const { minX, maxX, minY, maxY } = bbox2d(pts2d)
  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1
  const scale = Math.min((width - 2 * margin) / rangeX, (height - 2 * margin) / rangeY)
  const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2
  return (x, y) => [
    width / 2 + (x - midX) * scale,
    height / 2 - (y - midY) * scale
  ]
}

function tessellateCircle(cx, cy, r, n = 64) {
  const pts = []
  for (let i = 0; i <= n; i++) {
    const a = (2 * Math.PI * i) / n
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
  }
  return pts
}

function tessellateArc(start, end, center, n = 64, mid = null) {
  const r = Math.sqrt((start.x - center.x) ** 2 + (start.y - center.y) ** 2)
  let a0 = Math.atan2(start.y - center.y, start.x - center.x)
  let a1 = Math.atan2(end.y - center.y, end.x - center.x)
  if (mid) {
    let d1 = a1 - a0, dMid = Math.atan2(mid.y - center.y, mid.x - center.x) - a0
    while (d1 < 0) d1 += 2 * Math.PI
    while (dMid < 0) dMid += 2 * Math.PI
    a1 = dMid > d1 ? a0 + d1 - 2 * Math.PI : a0 + d1
  } else {
    if (a1 < a0) a1 += 2 * Math.PI
    if (a1 - a0 > Math.PI) a1 -= 2 * Math.PI
  }
  const pts = []
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * i / n
    pts.push([center.x + r * Math.cos(a), center.y + r * Math.sin(a)])
  }
  return pts
}

// ═══════════════════════════════════════════════════════════════════════════
// SOLID RENDERER — from graphic data
// ═══════════════════════════════════════════════════════════════════════════

function renderSolidSVG(graphic, width = IMG_W, height = IMG_H) {
  const allPts2d = []
  const triangles = []
  const edges = []

  for (const container of (graphic.containers || [])) {
    // Meshes → triangles
    for (const mesh of (container.meshes || [])) {
      const verts = mesh.vertices, norms = mesh.normals, indices = mesh.indices
      for (let i = 0; i < indices.length; i += 3) {
        const triVerts = [], triNorm = []
        for (let j = 0; j < 3; j++) {
          const idx = indices[i + j]
          const [px, py, pz] = projectIso(verts[idx*3], verts[idx*3+1], verts[idx*3+2])
          triVerts.push({ px, py, pz })
          allPts2d.push([px, py])
        }
        const [, , lz] = projectIso(norms[indices[i]*3], norms[indices[i]*3+1], norms[indices[i]*3+2])
        const brightness = Math.max(0.25, Math.min(1, 0.3 + 0.7 * Math.abs(lz)))
        const avgDepth = (triVerts[0].pz + triVerts[1].pz + triVerts[2].pz) / 3
        triangles.push({ verts: triVerts, brightness, avgDepth })
      }
    }
    // Edges
    for (const edge of (container.edges || [])) {
      const pts = edge.points
      const projPts = []
      for (let i = 0; i < pts.length; i += 3) {
        const [px, py] = projectIso(pts[i], pts[i+1], pts[i+2])
        projPts.push([px, py])
        allPts2d.push([px, py])
      }
      edges.push(projPts)
    }
  }

  if (allPts2d.length === 0) return null
  triangles.sort((a, b) => a.avgDepth - b.avgDepth)
  const xf = viewTransform(allPts2d, width, height)

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">\n`
  svg += `<rect width="100%" height="100%" fill="white"/>\n`
  for (const tri of triangles) {
    const pts = tri.verts.map(v => xf(v.px, v.py))
    const shade = Math.round(100 + 130 * tri.brightness)
    const r = Math.round(shade * 0.65), g = Math.round(shade * 0.75), b = shade
    svg += `<polygon points="${pts.map(p => p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}" fill="rgb(${r},${g},${b})" stroke="none"/>\n`
  }
  for (const edgePts of edges) {
    const pts = edgePts.map(p => xf(p[0], p[1]))
    if (pts.length >= 2) svg += `<polyline points="${pts.map(p => p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}" fill="none" stroke="#1a1a3a" stroke-width="1.5"/>\n`
  }
  svg += '</svg>'
  return svg
}


// ═══════════════════════════════════════════════════════════════════════════
// SKETCH RENDERER — from API queries
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch all sketch geometry with positions.
 * @param {Function} execute — execute({ 'v1.xxx': [params] })
 * @param {number} sketchId
 * @param {object} structureTree — for circle radius lookup
 */
export async function fetchSketchData(execute, sketchId, structureTree = {}) {
  const geom = (await execute({ 'v1.sketch.getGeometry': [{ id: sketchId }] })).result
  if (!geom) return null
  const items = []

  for (const lineId of (geom.lines || [])) {
    const pos = (await execute({ 'v1.sketch.getPositions': [{ id: lineId }] })).result
    if (pos) items.push({ type: 'line', startPos: pos.startPos, endPos: pos.endPos })
  }

  for (const circleId of (geom.circles || [])) {
    const pts = (await execute({ 'v1.sketch.getPoints': [{ id: circleId }] })).result
    if (!pts?.centerId) continue
    const centerPos = (await execute({ 'v1.sketch.getPositions': [{ id: pts.centerId }] })).result
    if (!centerPos?.pos) continue
    // Get radius from structure tree
    const obj = structureTree[String(circleId)]
    const radiusMember = obj?.members?.Radius || obj?.members?.radius
    const radius = radiusMember?.value ?? null
    items.push({ type: 'circle', center: centerPos.pos, radius })
  }

  for (const arcId of (geom.arcs || [])) {
    const pos = (await execute({ 'v1.sketch.getPositions': [{ id: arcId }] })).result
    if (pos) items.push({ type: 'arc', startPos: pos.startPos, endPos: pos.endPos, centerPos: pos.centerPos })
  }

  for (const ptId of (geom.points || [])) {
    const pos = (await execute({ 'v1.sketch.getPositions': [{ id: ptId }] })).result
    if (pos?.pos) items.push({ type: 'point', pos: pos.pos })
  }

  return items
}

function renderSketchSVG(items, width = IMG_W, height = IMG_H) {
  const allPts2d = []
  const drawOps = []

  for (const item of items) {
    if (item.type === 'line') {
      const s = [item.startPos.x, item.startPos.y], e = [item.endPos.x, item.endPos.y]
      allPts2d.push(s, e)
      drawOps.push({ kind: 'line', pts: [s, e] })
    } else if (item.type === 'circle' && item.radius != null) {
      const pts = tessellateCircle(item.center.x, item.center.y, item.radius)
      allPts2d.push(...pts)
      drawOps.push({ kind: 'polyline', pts, color: '#0066cc' })
    } else if (item.type === 'circle') {
      // No radius — just mark center
      allPts2d.push([item.center.x, item.center.y])
      drawOps.push({ kind: 'point', pos: [item.center.x, item.center.y] })
    } else if (item.type === 'arc') {
      const pts = tessellateArc(item.startPos, item.endPos, item.centerPos)
      allPts2d.push(...pts)
      drawOps.push({ kind: 'polyline', pts, color: '#cc6600' })
    } else if (item.type === 'point') {
      allPts2d.push([item.pos.x, item.pos.y])
      drawOps.push({ kind: 'point', pos: [item.pos.x, item.pos.y] })
    }
  }

  if (allPts2d.length === 0) return null
  const xf = viewTransform(allPts2d, width, height)

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">\n`
  svg += `<rect width="100%" height="100%" fill="white"/>\n`
  // Light grid
  svg += `<g stroke="#eee" stroke-width="0.5">\n`
  for (let x = 0; x < width; x += 40) svg += `<line x1="${x}" y1="0" x2="${x}" y2="${height}"/>\n`
  for (let y = 0; y < height; y += 40) svg += `<line x1="0" y1="${y}" x2="${width}" y2="${y}"/>\n`
  svg += `</g>\n`

  for (const op of drawOps) {
    if (op.kind === 'line') {
      const [s, e] = op.pts.map(p => xf(p[0], p[1]))
      svg += `<line x1="${s[0].toFixed(1)}" y1="${s[1].toFixed(1)}" x2="${e[0].toFixed(1)}" y2="${e[1].toFixed(1)}" stroke="#0044aa" stroke-width="2"/>\n`
    } else if (op.kind === 'polyline') {
      const pts = op.pts.map(p => xf(p[0], p[1]))
      svg += `<polyline points="${pts.map(p => p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}" fill="none" stroke="${op.color||'#0044aa'}" stroke-width="2"/>\n`
    } else if (op.kind === 'point') {
      const [px, py] = xf(op.pos[0], op.pos[1])
      svg += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3" fill="#cc0000"/>\n`
    }
  }
  svg += '</svg>'
  return svg
}


// ═══════════════════════════════════════════════════════════════════════════
// CURVE RENDERER — from graphic edge data
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract curve geometry from graphic containers of type 2 (curve containers).
 * Renders edges that the server tessellated (lines, polylines).
 * For untessellated curves, falls back to bounding box or skips.
 */
function renderCurveSVG(graphic, width = IMG_W, height = IMG_H) {
  const allPts2d = []
  const drawOps = []

  for (const container of (graphic.containers || [])) {
    if (container.type !== 2) continue  // type 2 = curve container
    for (const edge of (container.edges || [])) {
      const pts = edge.points
      const pts2d = []
      for (let i = 0; i < pts.length; i += 3) {
        pts2d.push([pts[i], pts[i + 1]])
        allPts2d.push([pts[i], pts[i + 1]])
      }
      if (pts2d.length >= 2) {
        drawOps.push({ kind: 'polyline', pts: pts2d, color: '#006644' })
      }
    }
  }

  if (allPts2d.length === 0) return null
  const xf = viewTransform(allPts2d, width, height)

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">\n`
  svg += `<rect width="100%" height="100%" fill="white"/>\n`
  svg += `<g stroke="#eee" stroke-width="0.5">\n`
  for (let x = 0; x < width; x += 40) svg += `<line x1="${x}" y1="0" x2="${x}" y2="${height}"/>\n`
  for (let y = 0; y < height; y += 40) svg += `<line x1="0" y1="${y}" x2="${width}" y2="${y}"/>\n`
  svg += `</g>\n`

  for (const op of drawOps) {
    const pts = op.pts.map(p => xf(p[0], p[1]))
    svg += `<polyline points="${pts.map(p => p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}" fill="none" stroke="${op.color}" stroke-width="2.5"/>\n`
  }
  svg += '</svg>'
  return svg
}


// ═══════════════════════════════════════════════════════════════════════════
// SESSION ANALYZER — detect content types from structure tree
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Analyze structure tree and return content types present.
 * @param {object} tree — structure.tree from GetTree
 * @returns {{ solids: number[], sketches: number[], curves: number[], eifs: number[] }}
 */
export function analyzeSession(tree) {
  const result = { solids: [], sketches: [], curves: [], eifs: [] }
  for (const [id, obj] of Object.entries(tree)) {
    const nid = Number(id)
    if (obj.class === 'CC_Solid') result.solids.push(nid)
    if (obj.class === 'CC_Sketch') result.sketches.push(nid)
    if (obj.class === 'CC_CurveEntity') result.curves.push(nid)
    if (obj.class === 'CC_EntityInjection') result.eifs.push(nid)
  }
  return result
}


// ═══════════════════════════════════════════════════════════════════════════
// MAIN ENTRY — auto-detect and render all content
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Render all visible content in the current session.
 *
 * @param {{ execute: Function, request: Function }} client — must be graphics-enabled
 * @param {string} prefix — file prefix for output
 * @param {string} outDir — output directory
 * @param {object} [options]
 * @param {number} [options.width=800]
 * @param {number} [options.height=600]
 * @returns {Promise<{ type: string, file: string }[]>} — list of rendered files
 */
export async function renderSession(client, prefix, outDir, options = {}) {
  const { execute, request, getLastGraphic } = client
  const width = options.width || IMG_W
  const height = options.height || IMG_H
  const rendered = []

  // Get structure tree
  const treeResult = await request('GetTree')
  const tree = treeResult.structure?.tree || {}
  const content = analyzeSession(tree)

  // ── SOLIDS ──
  if (content.solids.length > 0) {
    // Try: 1) last cached graphic, 2) recalc, 3) skip
    let solidGraphic = getLastGraphic?.()
    if (!solidGraphic || !solidGraphic.containers?.some(c => c.meshes?.length > 0)) {
      try {
        const recalcResult = await execute({ 'v1.common.recalc': [{}] })
        if (recalcResult.graphic?.containers?.some(c => c.meshes?.length > 0)) {
          solidGraphic = recalcResult.graphic
        }
      } catch (e) { /* skip */ }
    }
    // Filter to solid containers (type 1) only
    if (solidGraphic?.containers?.some(c => c.type === 1 && c.meshes?.length > 0)) {
      const solidOnly = { ...solidGraphic, containers: solidGraphic.containers.filter(c => c.type === 1 && c.meshes?.length > 0) }
      const svg = renderSolidSVG(solidOnly, width, height)
      if (svg) {
        const file = `${prefix}-solid.png`
        await svgToPng(svg, `${outDir}/${file}`)
        rendered.push({ type: 'solid', file })
      }
    }
  }

  // ── SKETCHES ──
  for (const sketchId of content.sketches) {
    try {
      const items = await fetchSketchData(
        (task) => execute(task),
        sketchId,
        tree
      )
      if (items && items.length > 0) {
        const svg = renderSketchSVG(items, width, height)
        if (svg) {
          const sketchName = tree[String(sketchId)]?.name || `sketch-${sketchId}`
          const safeName = sketchName.replace(/[^a-zA-Z0-9_-]/g, '_')
          const file = `${prefix}-sketch-${safeName}.png`
          await svgToPng(svg, `${outDir}/${file}`)
          rendered.push({ type: 'sketch', file, sketchId, name: sketchName })
        }
      }
    } catch (e) {
      // sketch might be empty or inaccessible
    }
  }

  // ── CURVES ──
  if (content.curves.length > 0) {
    // Try last graphic first, then recalc
    let curveGraphic = getLastGraphic?.()
    if (!curveGraphic?.containers?.some(c => c.type === 2 && c.edges?.length > 0)) {
      try {
        const r = await execute({ 'v1.common.recalc': [{}] })
        if (r.graphic?.containers?.some(c => c.type === 2)) curveGraphic = r.graphic
      } catch (e) { /* skip */ }
    }
    if (curveGraphic) {
      const svg = renderCurveSVG(curveGraphic, width, height)
      if (svg) {
        const file = `${prefix}-curves.png`
        await svgToPng(svg, `${outDir}/${file}`)
        rendered.push({ type: 'curves', file })
      }
    }
  }

  return rendered
}


// ═══════════════════════════════════════════════════════════════════════════
// SVG → PNG
// ═══════════════════════════════════════════════════════════════════════════

async function svgToPng(svg, pngPath) {
  await sharp(Buffer.from(svg)).png().toFile(pngPath)
}

/**
 * Backwards-compatible: render isometric from STL triangles (legacy path).
 * Kept so old scripts still work during migration.
 */
export { renderSolidSVG, renderSketchSVG, renderCurveSVG, svgToPng, analyzeSession as detectContent }
