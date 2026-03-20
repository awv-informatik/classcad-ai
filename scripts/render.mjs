/**
 * render.mjs — Isometric PNG renderer for STL triangles.
 * Extracted from classcad-box-snapshot.mjs.
 */

import sharp from 'sharp'

/**
 * Project a 3D point to isometric 2D + depth.
 * Standard isometric: rotate 45deg around Y, then ~35.264deg around X.
 */
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

/**
 * Render an array of STL triangles into an RGBA pixel buffer.
 *
 * @param {{ normal: number[], vertices: number[][] }[]} triangles
 * @param {number} width
 * @param {number} height
 * @returns {Buffer} RGBA pixel buffer
 */
export function renderIsometric(triangles, width, height) {
  // Project all vertices for bounding box
  const allPts = []
  for (const tri of triangles) {
    for (const [x, y, z] of tri.vertices) {
      allPts.push(projectIso(x, y, z))
    }
  }
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const [px, py] of allPts) {
    if (px < minX) minX = px; if (px > maxX) maxX = px
    if (py < minY) minY = py; if (py > maxY) maxY = py
  }

  const margin = 40
  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1
  const scale = Math.min((width - 2 * margin) / rangeX, (height - 2 * margin) / rangeY)
  const cx = width / 2, cy = height / 2
  const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2

  // Sort triangles back-to-front (painter's algorithm)
  const projected = triangles.map(tri => {
    const pts = tri.vertices.map(([x, y, z]) => {
      const [px, py, pz] = projectIso(x, y, z)
      return { sx: cx + (px - midX) * scale, sy: cy - (py - midY) * scale, depth: pz }
    })
    const avgDepth = (pts[0].depth + pts[1].depth + pts[2].depth) / 3
    const [nx, ny, nz] = tri.normal
    const [, , lz] = projectIso(nx, ny, nz)
    const brightness = Math.max(0.25, Math.min(1, 0.3 + 0.7 * Math.abs(lz)))
    return { pts, avgDepth, brightness }
  })
  projected.sort((a, b) => a.avgDepth - b.avgDepth)

  // Rasterise into RGBA buffer (white background)
  const buf = Buffer.alloc(width * height * 4, 255)
  for (let i = 3; i < buf.length; i += 4) buf[i] = 255

  function setPixel(x, y, r, g, b) {
    const ix = Math.round(x), iy = Math.round(y)
    if (ix < 0 || ix >= width || iy < 0 || iy >= height) return
    const off = (iy * width + ix) * 4
    buf[off] = r; buf[off + 1] = g; buf[off + 2] = b; buf[off + 3] = 255
  }

  function drawLine(x0, y0, x1, y1, r, g, b) {
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
    let err = dx - dy
    const steps = Math.max(dx, dy) * 2
    for (let i = 0; i <= steps; i++) {
      setPixel(x0, y0, r, g, b)
      if (Math.abs(x0 - x1) < 0.5 && Math.abs(y0 - y1) < 0.5) break
      const e2 = 2 * err
      if (e2 > -dy) { err -= dy; x0 += sx * 0.5 }
      if (e2 < dx) { err += dx; y0 += sy * 0.5 }
    }
  }

  function fillTriangle(p0, p1, p2, r, g, b) {
    const pts = [p0, p1, p2].sort((a, b) => a.sy - b.sy)
    const [top, mid, bot] = pts
    const totalH = bot.sy - top.sy
    if (totalH < 1) return
    for (let y = Math.max(0, Math.ceil(top.sy)); y <= Math.min(height - 1, Math.floor(bot.sy)); y++) {
      const t1 = (y - top.sy) / totalH
      let xA = top.sx + t1 * (bot.sx - top.sx)
      let xB
      if (y < mid.sy) {
        const segH = mid.sy - top.sy
        xB = segH < 1 ? top.sx : top.sx + ((y - top.sy) / segH) * (mid.sx - top.sx)
      } else {
        const segH = bot.sy - mid.sy
        xB = segH < 1 ? mid.sx : mid.sx + ((y - mid.sy) / segH) * (bot.sx - mid.sx)
      }
      const left = Math.max(0, Math.ceil(Math.min(xA, xB)))
      const right = Math.min(width - 1, Math.floor(Math.max(xA, xB)))
      for (let x = left; x <= right; x++) setPixel(x, y, r, g, b)
    }
  }

  // Fill then edges
  for (const { pts, brightness } of projected) {
    const shade = Math.round(100 + 130 * brightness)
    fillTriangle(pts[0], pts[1], pts[2],
      Math.round(shade * 0.75), Math.round(shade * 0.85), shade)
  }
  for (const { pts } of projected) {
    for (let i = 0; i < 3; i++) {
      const a = pts[i], b = pts[(i + 1) % 3]
      drawLine(a.sx, a.sy, b.sx, b.sy, 40, 40, 60)
    }
  }
  return buf
}

/**
 * Save an RGBA pixel buffer as a PNG file.
 */
export async function savePNG(pixels, width, height, path) {
  await sharp(pixels, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(path)
}
