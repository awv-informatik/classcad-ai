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

// Per-body color palettes: [r, g, b] base multipliers for distinct body identification
const BODY_PALETTES = [
  [0.55, 0.65, 1.0],   // blue
  [1.0,  0.55, 0.3],   // orange
  [0.4,  0.85, 0.5],   // green
  [0.9,  0.4,  0.65],  // pink
  [0.75, 0.7,  0.35],  // olive
  [0.5,  0.8,  0.85],  // teal
  [0.85, 0.55, 0.85],  // purple
  [0.9,  0.8,  0.4],   // gold
]

/**
 * Z-buffer rasterizer for solid rendering. Eliminates all Z-fighting artifacts.
 * Returns { pixels: Buffer (RGBA), width, height } or null if no geometry.
 */
function renderSolidZBuffer(graphic, width = IMG_W, height = IMG_H) {
  const allPts2d = []
  const tris = []  // { v0, v1, v2 (screen+depth), r, g, b }
  const edgeLines = []

  const containers = graphic.containers || []
  for (let ci = 0; ci < containers.length; ci++) {
    const container = containers[ci]
    const palette = BODY_PALETTES[ci % BODY_PALETTES.length]
    for (const mesh of (container.meshes || [])) {
      const verts = mesh.vertices, norms = mesh.normals, indices = mesh.indices
      for (let i = 0; i < indices.length; i += 3) {
        const tv = []
        for (let j = 0; j < 3; j++) {
          const idx = indices[i + j]
          const [px, py, pz] = projectIso(verts[idx*3], verts[idx*3+1], verts[idx*3+2])
          tv.push({ px, py, pz })
          allPts2d.push([px, py])
        }
        const [, , lz] = projectIso(norms[indices[i]*3], norms[indices[i]*3+1], norms[indices[i]*3+2])
        if (lz < 0) continue  // back-face cull
        const brightness = Math.max(0.25, Math.min(1, 0.3 + 0.7 * lz))
        const shade = 100 + 130 * brightness
        tris.push({
          v: tv,
          r: Math.round(shade * palette[0]),
          g: Math.round(shade * palette[1]),
          b: Math.round(shade * palette[2]),
        })
      }
    }
    for (const edge of (container.edges || [])) {
      const pts = edge.points
      const projPts = []
      for (let i = 0; i < pts.length; i += 3) {
        const [px, py, pz] = projectIso(pts[i], pts[i+1], pts[i+2])
        projPts.push({ px, py, pz })
        allPts2d.push([px, py])
      }
      edgeLines.push(projPts)
    }
  }

  if (allPts2d.length === 0) return null
  const xf = viewTransform(allPts2d, width, height)

  // Allocate pixel + depth buffers
  const pixels = Buffer.alloc(width * height * 4, 255) // white RGBA
  const zBuf = new Float64Array(width * height).fill(-Infinity)

  // Rasterize triangles
  for (const tri of tris) {
    const sv = tri.v.map(v => { const [sx, sy] = xf(v.px, v.py); return { sx, sy, sz: v.pz } })
    _rasterTri(pixels, zBuf, width, height, sv[0], sv[1], sv[2], tri.r, tri.g, tri.b)
  }

  // Draw edges on top (2px, dark color, with depth test)
  const edgeColor = { r: 26, g: 26, b: 58 }
  for (const epts of edgeLines) {
    const sv = epts.map(v => { const [sx, sy] = xf(v.px, v.py); return { sx, sy, sz: v.pz } })
    for (let i = 0; i < sv.length - 1; i++) {
      _rasterLine(pixels, zBuf, width, height, sv[i], sv[i+1], edgeColor, 0.5)
    }
  }

  return { pixels, width, height }
}

/** Rasterize a single triangle with per-pixel depth test */
function _rasterTri(pixels, zBuf, w, h, v0, v1, v2, r, g, b) {
  // Bounding box
  let minX = Math.floor(Math.min(v0.sx, v1.sx, v2.sx))
  let maxX = Math.ceil(Math.max(v0.sx, v1.sx, v2.sx))
  let minY = Math.floor(Math.min(v0.sy, v1.sy, v2.sy))
  let maxY = Math.ceil(Math.max(v0.sy, v1.sy, v2.sy))
  minX = Math.max(0, minX); maxX = Math.min(w - 1, maxX)
  minY = Math.max(0, minY); maxY = Math.min(h - 1, maxY)

  const denom = (v1.sy - v2.sy) * (v0.sx - v2.sx) + (v2.sx - v1.sx) * (v0.sy - v2.sy)
  if (Math.abs(denom) < 1e-10) return  // degenerate

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const w0 = ((v1.sy - v2.sy) * (x - v2.sx) + (v2.sx - v1.sx) * (y - v2.sy)) / denom
      const w1 = ((v2.sy - v0.sy) * (x - v2.sx) + (v0.sx - v2.sx) * (y - v2.sy)) / denom
      const w2 = 1 - w0 - w1
      if (w0 < -0.001 || w1 < -0.001 || w2 < -0.001) continue  // outside
      const z = w0 * v0.sz + w1 * v1.sz + w2 * v2.sz
      const idx = y * w + x
      if (z >= zBuf[idx]) {  // larger z = closer to camera in isometric projection
        zBuf[idx] = z
        const pi = idx * 4
        pixels[pi] = r; pixels[pi+1] = g; pixels[pi+2] = b; pixels[pi+3] = 255
      }
    }
  }
}

/** Rasterize a line with per-pixel depth test (Bresenham + interpolated Z) */
function _rasterLine(pixels, zBuf, w, h, p0, p1, color, zBias = 0) {
  let x0 = Math.round(p0.sx), y0 = Math.round(p0.sy)
  let x1 = Math.round(p1.sx), y1 = Math.round(p1.sy)
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
  let err = dx - dy
  const steps = Math.max(dx, dy) || 1
  const totalDist = Math.sqrt((p1.sx-p0.sx)**2 + (p1.sy-p0.sy)**2) || 1
  for (let i = 0; i <= steps + 1; i++) {
    if (x0 >= 0 && x0 < w && y0 >= 0 && y0 < h) {
      const t = Math.sqrt((x0-p0.sx)**2 + (y0-p0.sy)**2) / totalDist
      const z = p0.sz + t * (p1.sz - p0.sz) + zBias
      const idx = y0 * w + x0
      if (z >= zBuf[idx] - 0.01) {  // small bias to draw edges on surfaces
        const pi = idx * 4
        pixels[pi] = color.r; pixels[pi+1] = color.g; pixels[pi+2] = color.b; pixels[pi+3] = 255
        // Also draw neighboring pixels for ~2px width
        for (const [ox, oy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const nx = x0+ox, ny = y0+oy
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const ni = ny * w + nx
            if (z >= zBuf[ni] - 0.01) {
              const npi = ni * 4
              pixels[npi] = color.r; pixels[npi+1] = color.g; pixels[npi+2] = color.b; pixels[npi+3] = 255
            }
          }
        }
      }
    }
    if (x0 === x1 && y0 === y1) break
    const e2 = 2 * err
    if (e2 > -dy) { err -= dy; x0 += sx }
    if (e2 < dx) { err += dx; y0 += sy }
  }
}

// Legacy SVG renderer (kept for sketch/curve paths)
function renderSolidSVG(graphic, width = IMG_W, height = IMG_H) {
  const allPts2d = []
  const triangles = []
  const edges = []

  const containers = graphic.containers || []
  for (let ci = 0; ci < containers.length; ci++) {
    const container = containers[ci]
    const palette = BODY_PALETTES[ci % BODY_PALETTES.length]
    for (const mesh of (container.meshes || [])) {
      const verts = mesh.vertices, norms = mesh.normals, indices = mesh.indices
      for (let i = 0; i < indices.length; i += 3) {
        const triVerts = []
        for (let j = 0; j < 3; j++) {
          const idx = indices[i + j]
          const [px, py, pz] = projectIso(verts[idx*3], verts[idx*3+1], verts[idx*3+2])
          triVerts.push({ px, py, pz })
          allPts2d.push([px, py])
        }
        const [, , lz] = projectIso(norms[indices[i]*3], norms[indices[i]*3+1], norms[indices[i]*3+2])
        if (lz < 0) continue
        const brightness = Math.max(0.25, Math.min(1, 0.3 + 0.7 * lz))
        const avgDepth = (triVerts[0].pz + triVerts[1].pz + triVerts[2].pz) / 3
        triangles.push({ verts: triVerts, brightness, avgDepth, palette })
      }
    }
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
    const [pr, pg, pb] = tri.palette
    const r = Math.round(shade * pr), g = Math.round(shade * pg), b = Math.round(shade * pb)
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
// WORK GEOMETRY RENDERER — from structure tree members
// ═══════════════════════════════════════════════════════════════════════════

// Colors for work geometry types
const WG_COLORS = {
  plane:  { fill: 'rgba(0,120,255,0.12)', stroke: '#0078ff', label: '#0060cc' },
  axis:   { stroke: '#cc4400', label: '#cc4400' },
  point:  { fill: '#cc0044', stroke: '#cc0044', label: '#cc0044' },
  csys:   { x: '#cc0000', y: '#00aa00', z: '#0044cc' },
}

/**
 * Extract work geometry definitions from the structure tree.
 * Returns arrays of { id, name, ...params } for each type.
 */
function extractWorkGeometry(tree) {
  const planes = [], axes = [], points = [], csyses = []

  // Default/built-in work geometry names to skip (they clutter the view)
  const builtins = new Set(['Origin', 'XAxis', 'YAxis', 'ZAxis', 'Top', 'Front', 'Right'])

  for (const [id, obj] of Object.entries(tree)) {
    // Skip built-in work geometry
    if (builtins.has(obj.name)) continue
    const m = obj.members || {}

    if (obj.class === 'CC_WorkPlane') {
      const pos = m.curPosition?.value || m.Position?.value || { x: 0, y: 0, z: 0 }
      const normal = m.Normal?.value || { x: 0, y: 0, z: 1 }
      const size = m.Size?.value ?? 200
      const offset = m.Offset?.value ?? 0
      planes.push({ id: Number(id), name: obj.name, pos, normal, size, offset })
    }
    if (obj.class === 'CC_WorkAxis') {
      const pos = m.Position?.value || { x: 0, y: 0, z: 0 }
      const dir = m.Direction?.value || { x: 0, y: 0, z: 1 }
      const length = m.Length?.value ?? 50
      axes.push({ id: Number(id), name: obj.name, pos, dir, length })
    }
    if (obj.class === 'CC_WorkPoint') {
      const pos = m.Position?.value || { x: 0, y: 0, z: 0 }
      points.push({ id: Number(id), name: obj.name, pos })
    }
    if (obj.class === 'CC_WorkCSys') {
      const cs = obj.coordinateSystem || [[0,0,0],[1,0,0],[0,1,0],[0,0,1]]
      const origin = { x: cs[0][0], y: cs[0][1], z: cs[0][2] }
      const xDir = { x: cs[1][0], y: cs[1][1], z: cs[1][2] }
      const yDir = { x: cs[2][0], y: cs[2][1], z: cs[2][2] }
      const zDir = { x: cs[3][0], y: cs[3][1], z: cs[3][2] }
      const off = m.offset?.value || { x: 0, y: 0, z: 0 }
      csyses.push({ id: Number(id), name: obj.name, origin, xDir, yDir, zDir, offset: off })
    }
  }
  return { planes, axes, points, csyses }
}

/**
 * Compute the four corners of a work plane quad in 3D.
 * Given center position, normal, and size, returns [c0, c1, c2, c3].
 */
function workPlaneCorners(pos, normal, size, offset) {
  const n = { x: normal.x, y: normal.y, z: normal.z }
  const len = Math.sqrt(n.x*n.x + n.y*n.y + n.z*n.z) || 1
  n.x /= len; n.y /= len; n.z /= len

  // Apply offset along normal
  const cx = pos.x + n.x * offset
  const cy = pos.y + n.y * offset
  const cz = pos.z + n.z * offset

  // Build two tangent vectors perpendicular to normal
  let up = { x: 0, y: 0, z: 1 }
  if (Math.abs(n.x * up.x + n.y * up.y + n.z * up.z) > 0.9) {
    up = { x: 0, y: 1, z: 0 }
  }
  // u = normalize(cross(normal, up))
  const ux = n.y * up.z - n.z * up.y
  const uy = n.z * up.x - n.x * up.z
  const uz = n.x * up.y - n.y * up.x
  const uLen = Math.sqrt(ux*ux + uy*uy + uz*uz) || 1
  const u = { x: ux/uLen, y: uy/uLen, z: uz/uLen }
  // v = cross(normal, u)
  const v = { x: n.y * u.z - n.z * u.y, y: n.z * u.x - n.x * u.z, z: n.x * u.y - n.y * u.x }

  const half = size / 2
  return [
    [cx - u.x*half - v.x*half, cy - u.y*half - v.y*half, cz - u.z*half - v.z*half],
    [cx + u.x*half - v.x*half, cy + u.y*half - v.y*half, cz + u.z*half - v.z*half],
    [cx + u.x*half + v.x*half, cy + u.y*half + v.y*half, cz + u.z*half + v.z*half],
    [cx - u.x*half + v.x*half, cy - u.y*half + v.y*half, cz - u.z*half + v.z*half],
  ]
}

/**
 * Render work geometry as isometric SVG overlay.
 * @param {object} workGeo — from extractWorkGeometry()
 * @param {number} width
 * @param {number} height
 * @param {Array} [extraPts2d] — additional 2D points for fitting the view (from solid rendering)
 * @returns {string|null} SVG string, or null if nothing to render
 */
function renderWorkGeoSVG(workGeo, width = IMG_W, height = IMG_H, extraPts2d = []) {
  const { planes, axes, points, csyses } = workGeo
  if (!planes.length && !axes.length && !points.length && !csyses.length) return null

  // Collect all 3D points for view fitting
  const allPts2d = [...extraPts2d]

  // Pre-project all geometry
  const projPlanes = planes.map(p => {
    const corners = workPlaneCorners(p.pos, p.normal, p.size, p.offset)
    const proj = corners.map(([x,y,z]) => {
      const [px, py] = projectIso(x, y, z)
      allPts2d.push([px, py])
      return [px, py]
    })
    // Center for label
    const center = projectIso(
      p.pos.x + p.normal.x * p.offset,
      p.pos.y + p.normal.y * p.offset,
      p.pos.z + p.normal.z * p.offset
    )
    return { ...p, proj, center: [center[0], center[1]] }
  })

  const projAxes = axes.map(a => {
    const start = [a.pos.x, a.pos.y, a.pos.z]
    const end = [a.pos.x + a.dir.x * a.length, a.pos.y + a.dir.y * a.length, a.pos.z + a.dir.z * a.length]
    const ps = projectIso(...start)
    const pe = projectIso(...end)
    allPts2d.push([ps[0], ps[1]], [pe[0], pe[1]])
    return { ...a, start: [ps[0], ps[1]], end: [pe[0], pe[1]] }
  })

  const projPoints = points.map(p => {
    const [px, py] = projectIso(p.pos.x, p.pos.y, p.pos.z)
    allPts2d.push([px, py])
    return { ...p, proj: [px, py] }
  })

  const csysArmLen = 30  // screen-space arm length will be scaled
  const projCsyses = csyses.map(cs => {
    const o = [cs.origin.x + cs.offset.x, cs.origin.y + cs.offset.y, cs.origin.z + cs.offset.z]
    const armLen = 25  // world units
    const xEnd = [o[0] + cs.xDir.x * armLen, o[1] + cs.xDir.y * armLen, o[2] + cs.xDir.z * armLen]
    const yEnd = [o[0] + cs.yDir.x * armLen, o[1] + cs.yDir.y * armLen, o[2] + cs.yDir.z * armLen]
    const zEnd = [o[0] + cs.zDir.x * armLen, o[1] + cs.zDir.y * armLen, o[2] + cs.zDir.z * armLen]
    const po = projectIso(...o)
    const px = projectIso(...xEnd)
    const py = projectIso(...yEnd)
    const pz = projectIso(...zEnd)
    for (const p of [po, px, py, pz]) allPts2d.push([p[0], p[1]])
    return { ...cs, origin: [po[0], po[1]], xEnd: [px[0], px[1]], yEnd: [py[0], py[1]], zEnd: [pz[0], pz[1]] }
  })

  if (allPts2d.length === 0) return null
  const xf = viewTransform(allPts2d, width, height)
  const f = (x, y) => { const [sx, sy] = xf(x, y); return `${sx.toFixed(1)},${sy.toFixed(1)}` }

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">\n`
  svg += `<rect width="100%" height="100%" fill="white"/>\n`
  svg += `<style>text { font: 11px sans-serif; }</style>\n`

  // Draw planes (semi-transparent quads with dashed border)
  for (const p of projPlanes) {
    const pts = p.proj.map(([x,y]) => f(x, y)).join(' ')
    svg += `<polygon points="${pts}" fill="${WG_COLORS.plane.fill}" stroke="${WG_COLORS.plane.stroke}" stroke-width="1.5" stroke-dasharray="6,3"/>\n`
    // Label
    const [lx, ly] = xf(p.center[0], p.center[1])
    svg += `<text x="${lx.toFixed(1)}" y="${(ly - 6).toFixed(1)}" text-anchor="middle" fill="${WG_COLORS.plane.label}" font-weight="bold">${p.name}</text>\n`
  }

  // Draw axes (colored lines with arrow)
  for (const a of projAxes) {
    const [sx, sy] = xf(a.start[0], a.start[1])
    const [ex, ey] = xf(a.end[0], a.end[1])
    svg += `<line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="${WG_COLORS.axis.stroke}" stroke-width="2" stroke-dasharray="8,4"/>\n`
    // Arrowhead
    const dx = ex - sx, dy = ey - sy
    const alen = Math.sqrt(dx*dx + dy*dy) || 1
    const ux = dx/alen, uy = dy/alen
    const arrowSize = 8
    svg += `<polygon points="${ex.toFixed(1)},${ey.toFixed(1)} ${(ex - arrowSize*ux + arrowSize*0.4*uy).toFixed(1)},${(ey - arrowSize*uy - arrowSize*0.4*ux).toFixed(1)} ${(ex - arrowSize*ux - arrowSize*0.4*uy).toFixed(1)},${(ey - arrowSize*uy + arrowSize*0.4*ux).toFixed(1)}" fill="${WG_COLORS.axis.stroke}"/>\n`
    // Label
    const mx = (sx + ex) / 2, my = (sy + ey) / 2
    svg += `<text x="${(mx + 8).toFixed(1)}" y="${(my - 4).toFixed(1)}" fill="${WG_COLORS.axis.label}" font-weight="bold">${a.name}</text>\n`
  }

  // Draw points (diamond markers)
  for (const p of projPoints) {
    const [cx, cy] = xf(p.proj[0], p.proj[1])
    const s = 5
    svg += `<polygon points="${cx.toFixed(1)},${(cy-s).toFixed(1)} ${(cx+s).toFixed(1)},${cy.toFixed(1)} ${cx.toFixed(1)},${(cy+s).toFixed(1)} ${(cx-s).toFixed(1)},${cy.toFixed(1)}" fill="${WG_COLORS.point.fill}" stroke="${WG_COLORS.point.stroke}" stroke-width="1.5"/>\n`
    svg += `<text x="${(cx + 8).toFixed(1)}" y="${(cy - 4).toFixed(1)}" fill="${WG_COLORS.point.label}" font-weight="bold">${p.name}</text>\n`
  }

  // Draw coordinate systems (RGB axis triads)
  for (const cs of projCsyses) {
    const [ox, oy] = xf(cs.origin[0], cs.origin[1])
    const arms = [
      { end: cs.xEnd, color: WG_COLORS.csys.x, label: 'X' },
      { end: cs.yEnd, color: WG_COLORS.csys.y, label: 'Y' },
      { end: cs.zEnd, color: WG_COLORS.csys.z, label: 'Z' },
    ]
    for (const arm of arms) {
      const [ex, ey] = xf(arm.end[0], arm.end[1])
      svg += `<line x1="${ox.toFixed(1)}" y1="${oy.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="${arm.color}" stroke-width="2.5"/>\n`
      // Small arrowhead
      const dx = ex - ox, dy = ey - oy
      const alen = Math.sqrt(dx*dx + dy*dy) || 1
      const ux = dx/alen, uy = dy/alen
      const as = 6
      svg += `<polygon points="${ex.toFixed(1)},${ey.toFixed(1)} ${(ex - as*ux + as*0.35*uy).toFixed(1)},${(ey - as*uy - as*0.35*ux).toFixed(1)} ${(ex - as*ux - as*0.35*uy).toFixed(1)},${(ey - as*uy + as*0.35*ux).toFixed(1)}" fill="${arm.color}"/>\n`
      svg += `<text x="${(ex + 4*ux).toFixed(1)}" y="${(ey + 4*uy).toFixed(1)}" fill="${arm.color}" font-size="10" font-weight="bold">${arm.label}</text>\n`
    }
    // Origin dot
    svg += `<circle cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="3" fill="#333"/>\n`
    svg += `<text x="${(ox + 8).toFixed(1)}" y="${(oy - 6).toFixed(1)}" fill="#333" font-weight="bold">${cs.name}</text>\n`
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
  const builtinNames = new Set(['Origin', 'XAxis', 'YAxis', 'ZAxis', 'Top', 'Front', 'Right'])
  const result = { solids: [], sketches: [], curves: [], eifs: [], workGeo: [] }
  for (const [id, obj] of Object.entries(tree)) {
    const nid = Number(id)
    if (obj.class === 'CC_Solid') result.solids.push(nid)
    if (obj.class === 'CC_Sketch') result.sketches.push(nid)
    if (obj.class === 'CC_CurveEntity') result.curves.push(nid)
    if (obj.class === 'CC_EntityInjection') result.eifs.push(nid)
    if ((obj.class === 'CC_WorkPlane' || obj.class === 'CC_WorkAxis' || obj.class === 'CC_WorkPoint' || obj.class === 'CC_WorkCSys') && !builtinNames.has(obj.name)) {
      result.workGeo.push(nid)
    }
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
    // Always recalc to get accurate container state (cached graphic may be stale/intermediate)
    let solidGraphic = null
    try {
      const recalcResult = await execute({ 'v1.common.recalc': [{}] })
      if (recalcResult.graphic?.containers?.some(c => c.meshes?.length > 0)) {
        solidGraphic = recalcResult.graphic
      }
    } catch (e) { /* skip */ }
    // Fallback to cached graphic if recalc failed
    if (!solidGraphic || !solidGraphic.containers?.some(c => c.meshes?.length > 0)) {
      solidGraphic = getLastGraphic?.()
    }
    // Filter to solid containers (type 1) only
    if (solidGraphic?.containers?.some(c => c.type === 1 && c.meshes?.length > 0)) {
      const solidOnly = { ...solidGraphic, containers: solidGraphic.containers.filter(c => c.type === 1 && c.meshes?.length > 0) }
      const zbuf = renderSolidZBuffer(solidOnly, width, height)
      if (zbuf) {
        const file = `${prefix}-solid.png`
        await sharp(zbuf.pixels, { raw: { width: zbuf.width, height: zbuf.height, channels: 4 } }).png().toFile(`${outDir}/${file}`)
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
    // Reuse the recalc graphic from solids path if available, else recalc
    let curveGraphic = null
    try {
      const r = await execute({ 'v1.common.recalc': [{}] })
      if (r.graphic?.containers?.some(c => c.type === 2)) curveGraphic = r.graphic
    } catch (e) { /* skip */ }
    if (!curveGraphic?.containers?.some(c => c.type === 2 && c.edges?.length > 0)) {
      curveGraphic = getLastGraphic?.()
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

  // ── WORK GEOMETRY ──
  if (content.workGeo.length > 0) {
    const workGeo = extractWorkGeometry(tree)
    // Collect 2D points from solid geometry (if any) so view fits both together
    const extraPts = []
    // If we already rendered solids, we want the work geo to use a compatible view.
    // For now, render work geo standalone with its own fitting.
    const svg = renderWorkGeoSVG(workGeo, width, height, extraPts)
    if (svg) {
      const file = `${prefix}-workgeo.png`
      await svgToPng(svg, `${outDir}/${file}`)
      rendered.push({ type: 'workgeo', file })
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
