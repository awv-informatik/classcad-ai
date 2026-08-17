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
 * Annotation layers (sketches only):
 *   - DIMENSIONS   — extracted from CC_SketchDimensionSet in the structure tree.
 *                    Renders linear, radial, diameter, and angular dimensions with
 *                    extension lines, arrowheads, and value labels.
 *   - CONSTRAINTS  — extracted from CC_2D*Constraint nodes in the structure tree.
 *                    Renders as colored pill badges (⊙ T H V ⊥ ∥ = etc.) near
 *                    constrained geometry. Auto-generated constraints (Auto_*) are
 *                    filtered out; only user-created constraints are shown.
 *   - LABEL PLACEMENT — all dimension labels and constraint badges are collected
 *                    into a shared pool and processed by a force-directed de-overlap
 *                    pass before rendering. The pass applies three forces per iteration:
 *                      (a) label–label repulsion (AABB overlap → push apart)
 *                      (b) label–geometry repulsion (push labels away from sketch
 *                          lines, circles, and arcs to keep annotations outside
 *                          the model boundary)
 *                      (c) outward bias (gentle push away from the geometry centroid,
 *                          encouraging labels to migrate to the perimeter)
 *                    A spring force pulls each label back toward its computed anchor
 *                    position to prevent runaway drift. Converges in ~20 iterations.
 *
 * Also exports a combined renderer that auto-detects and renders all content types.
 */


// Allocate a white RGBA pixel buffer — Buffer in Node, Uint8Array in browsers.
function allocPixels(byteLength) {
  return typeof Buffer !== 'undefined' ? Buffer.alloc(byteLength, 255) : new Uint8Array(byteLength).fill(255)
}

const IMG_W = 1600
const IMG_H = 1200

// ═══════════════════════════════════════════════════════════════════════════
// Projection & Transform
// ═══════════════════════════════════════════════════════════════════════════

// Default isometric projection (CAD-cube corner view).
// Rotates 45° around Y, then ~35.264° around X. Output: [screenX, screenY, depth]
// where larger depth = closer to camera.
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

// CAD view-cube projections. Each returns [screenX, screenY, depth].
// World is right-handed, +X right, +Y forward, +Z up.
//   top    = camera at +Z looking -Z (model viewed from above)
//   bottom = camera at -Z looking +Z
//   front  = camera at -Y looking +Y
//   back   = camera at +Y looking -Y
//   right  = camera at +X looking -X
//   left   = camera at -X looking +X
//   iso    = the default isometric corner view
const VIEWS = {
  iso:    projectIso,
  top:    (x, y, z) => [x, y, z],
  bottom: (x, y, z) => [x, -y, -z],
  front:  (x, y, z) => [x, z, -y],
  back:   (x, y, z) => [-x, z, y],
  right:  (x, y, z) => [-y, z, x],
  left:   (x, y, z) => [y, z, -x],
}

export const VIEW_NAMES = Object.keys(VIEWS)

// Module-level viewport state. Mutated by setViewport() at the start of each
// renderSession call. Rendering is sequential so this is safe.
let _project = projectIso
let _zoom = 1
let _lookAt = null
let _forcedFrame = null   // set via setViewport({ frame }) — overrides auto-fit
let _lastFrame = null     // frame actually used by the most recent viewTransform

function project(x, y, z) {
  return _project(x, y, z)
}

// ── Generalized orthographic camera ──
// Beyond the named view-cube views, `view` accepts an arbitrary camera:
//   { azimuth, elevation }        — turntable angles in DEGREES. azimuth 0 =
//     front (camera at -Y), 90 = camera at +X, CCW about +Z; elevation 0 =
//     horizon, 90 = straight down (top). World is Z-up.
//   { direction: [x,y,z], up? }   — explicit look direction (from camera toward
//     the scene), optional up hint (default [0,0,1]).
// Both build a standard right-handed photographic camera basis. Note: the
// NAMED views follow CAD drawing conventions and are kept byte-stable; a
// vector camera aimed like a named view may differ in handedness (e.g.
// 'right' vs { azimuth: 90 } are mirror images — drawing vs photo convention).
function projectionFromCamera(v) {
  let dir = null
  if (Array.isArray(v.direction) && v.direction.length === 3) {
    dir = v.direction
  } else if (typeof v.azimuth === 'number' || typeof v.elevation === 'number') {
    const az = ((v.azimuth ?? 0) * Math.PI) / 180
    const el = ((v.elevation ?? 0) * Math.PI) / 180
    // Camera sits at (sin az · cos el, -cos az · cos el, sin el) and looks at the origin.
    dir = [-Math.sin(az) * Math.cos(el), Math.cos(az) * Math.cos(el), -Math.sin(el)]
  }
  if (!dir) return null
  const flen = Math.hypot(dir[0], dir[1], dir[2])
  if (flen < 1e-12) return null
  const f = [dir[0] / flen, dir[1] / flen, dir[2] / flen]
  let up = Array.isArray(v.up) && v.up.length === 3 ? v.up : [0, 0, 1]
  // Degenerate up (parallel to the look direction) → fall back to +Y, which
  // reproduces the named top/bottom views exactly.
  if (Math.abs(f[0] * up[0] + f[1] * up[1] + f[2] * up[2]) > 0.999 * Math.hypot(up[0], up[1], up[2])) {
    up = [0, 1, 0]
  }
  const rx = f[1] * up[2] - f[2] * up[1]
  const ry = f[2] * up[0] - f[0] * up[2]
  const rz = f[0] * up[1] - f[1] * up[0]
  const rlen = Math.hypot(rx, ry, rz) || 1
  const r = [rx / rlen, ry / rlen, rz / rlen]
  const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]]
  // screen = [right, up, depth]; larger depth = closer to the camera.
  return (x, y, z) => [
    r[0] * x + r[1] * y + r[2] * z,
    u[0] * x + u[1] * y + u[2] * z,
    -(f[0] * x + f[1] * y + f[2] * z),
  ]
}

/**
 * Configure viewport for the next render. Called at the start of renderSession.
 * @param {object} opts
 * @param {string|object} [opts.view='iso'] — one of VIEW_NAMES, or a camera
 *   object: { azimuth, elevation } (degrees) or { direction: [x,y,z], up? }
 * @param {number} [opts.zoom=1] — multiplier on the auto-fit scale
 * @param {[number,number,number]|null} [opts.lookAt=null] — 3D point that lands at screen center
 * @param {{scale:number,midX:number,midY:number}|null} [opts.frame=null] — REUSE a
 *   frame returned by an earlier render (same view + image size): pins scale and
 *   center so renders of different model states are pixel-comparable. Overrides
 *   auto-fit, zoom and lookAt.
 */
export function setViewport(opts = {}) {
  const v = opts.view
  if (v && typeof v === 'object') {
    _project = projectionFromCamera(v) ?? projectIso
  } else {
    _project = VIEWS[v ?? 'iso'] ?? projectIso
  }
  _zoom = (typeof opts.zoom === 'number' && opts.zoom > 0) ? opts.zoom : 1
  _lookAt = Array.isArray(opts.lookAt) && opts.lookAt.length === 3 ? opts.lookAt : null
  _forcedFrame = opts.frame && typeof opts.frame.scale === 'number' ? { ...opts.frame } : null
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
  // A forced frame (setViewport({ frame })) wins over auto-fit, zoom and
  // lookAt — it pins scale AND center, making successive renders of a
  // CHANGING model pixel-comparable (the basis for diffImages).
  if (_forcedFrame) {
    const { scale, midX, midY } = _forcedFrame
    _lastFrame = { scale, midX, midY }
    return (x, y) => [
      width / 2 + (x - midX) * scale,
      height / 2 - (y - midY) * scale
    ]
  }
  const { minX, maxX, minY, maxY } = bbox2d(pts2d)
  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1
  const fitScale = Math.min((width - 2 * margin) / rangeX, (height - 2 * margin) / rangeY)
  const scale = fitScale * _zoom
  let midX, midY
  if (_lookAt) {
    const [lx, ly] = project(_lookAt[0], _lookAt[1], _lookAt[2])
    midX = lx; midY = ly
  } else {
    midX = (minX + maxX) / 2
    midY = (minY + maxY) / 2
  }
  _lastFrame = { scale, midX, midY }
  return (x, y) => [
    width / 2 + (x - midX) * scale,
    height / 2 - (y - midY) * scale
  ]
}

// ─── Assembly transforms ──────────────────────────────────────────────────
// Templates store geometry in their own local frame; CC_ProductReference and
// CC_ProductReferenceET nodes carry a `coordinateSystem` placing each instance
// in its parent's frame. Without composing these along the tree, every instance
// renders at the template origin — see extractAssemblyInstances + buildDrawList.

const IDENTITY4x4 = [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
]

function multiply4x4(a, b) {
  const r = new Array(16)
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      r[i*4+j] = a[i*4]*b[j] + a[i*4+1]*b[j+4] + a[i*4+2]*b[j+8] + a[i*4+3]*b[j+12]
    }
  }
  return r
}

function applyMatPoint(m, x, y, z) {
  return [
    m[0]*x + m[1]*y + m[2]*z + m[3],
    m[4]*x + m[5]*y + m[6]*z + m[7],
    m[8]*x + m[9]*y + m[10]*z + m[11],
  ]
}

function applyMatVec(m, x, y, z) {
  return [
    m[0]*x + m[1]*y + m[2]*z,
    m[4]*x + m[5]*y + m[6]*z,
    m[8]*x + m[9]*y + m[10]*z,
  ]
}

// coordinateSystem on instance nodes is observed as
// [origin, xAxis, yAxis, zAxis] (4×3) for STEP imports. The API also accepts
// the 3×3 form [origin, xDir, yDir] (zDir derived) and the 4×4 row form.
function csToMatrix(cs) {
  if (!Array.isArray(cs) || cs.length < 3) return IDENTITY4x4.slice()
  if (cs.length === 4 && Array.isArray(cs[0]) && cs[0].length === 4) {
    return [
      cs[0][0], cs[0][1], cs[0][2], cs[0][3],
      cs[1][0], cs[1][1], cs[1][2], cs[1][3],
      cs[2][0], cs[2][1], cs[2][2], cs[2][3],
      cs[3][0], cs[3][1], cs[3][2], cs[3][3],
    ]
  }
  const o = cs[0] || [0, 0, 0]
  const xa = cs[1] || [1, 0, 0]
  const ya = cs[2] || [0, 1, 0]
  const za = cs[3] || [
    xa[1]*ya[2] - xa[2]*ya[1],
    xa[2]*ya[0] - xa[0]*ya[2],
    xa[0]*ya[1] - xa[1]*ya[0],
  ]
  return [
    xa[0], ya[0], za[0], o[0],
    xa[1], ya[1], za[1], o[1],
    xa[2], ya[2], za[2], o[2],
    0, 0, 0, 1,
  ]
}

/**
 * Walk the assembly tree and produce one entry per leaf part instance with the
 * cumulative world transform. Returns null when the drawing has no
 * CC_AssemblyRoot (single-part drawing — caller renders templates flat).
 */
export function extractAssemblyInstances(tree) {
  let rootId = null
  for (const [id, obj] of Object.entries(tree)) {
    if (obj.class === 'CC_AssemblyRoot') { rootId = Number(id); break }
  }
  if (rootId == null) return null

  const solidByPart = new Map()
  for (const [id, obj] of Object.entries(tree)) {
    if (obj.class !== 'CC_Solid') continue
    let cur = obj.parent
    while (cur != null) {
      const p = tree[String(cur)]
      if (!p) break
      if (p.class === 'CC_Part') { solidByPart.set(Number(cur), Number(id)); break }
      cur = p.parent
    }
  }

  const instances = []
  function visit(node, parentMatrix) {
    const matrix = multiply4x4(parentMatrix, csToMatrix(node.coordinateSystem))
    const pid = node.members?.productId?.value
    if (pid != null) {
      const target = tree[String(pid)]
      if (target?.class === 'CC_Part') {
        const solidId = solidByPart.get(Number(pid))
        if (solidId != null) {
          instances.push({ ownerSolidId: solidId, partId: Number(pid), transform: matrix })
        }
        return
      }
    }
    for (const cid of (node.children || [])) {
      const child = tree[String(cid)]
      if (!child) continue
      if (child.class === 'CC_ProductReference' || child.class === 'CC_ProductReferenceET') {
        visit(child, matrix)
      }
    }
  }

  const root = tree[String(rootId)]
  for (const cid of (root?.children || [])) {
    const child = tree[String(cid)]
    if (!child) continue
    if (child.class === 'CC_ProductReference' || child.class === 'CC_ProductReferenceET') {
      visit(child, IDENTITY4x4.slice())
    }
  }
  return instances
}

// Build the list of drawcalls. With instances: one drawcall per instance,
// palette keyed by template (so all copies of the same part share a color).
// Without: one drawcall per container at identity (the part-only render path).
function buildDrawList(graphic, instances) {
  const containers = graphic.containers || []
  if (!instances || instances.length === 0) {
    return containers.map((c, i) => ({ container: c, transform: null, paletteIdx: i }))
  }
  const containerByOwner = new Map()
  for (const c of containers) {
    if (c.owner != null) containerByOwner.set(Number(c.owner), c)
  }
  const palByPart = new Map()
  let nextPal = 0
  const draws = []
  for (const inst of instances) {
    const c = containerByOwner.get(Number(inst.ownerSolidId))
    if (!c) continue
    let pal = palByPart.get(inst.partId)
    if (pal == null) { pal = nextPal++; palByPart.set(inst.partId, pal) }
    draws.push({ container: c, transform: inst.transform, paletteIdx: pal })
  }
  return draws
}

function tessellateCircle(cx, cy, r, n = 64) {
  const pts = []
  for (let i = 0; i <= n; i++) {
    const a = (2 * Math.PI * i) / n
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
  }
  return pts
}

function tessellateArc(start, end, center, n = 64, mid = null, bulge = null) {
  // Preferred path: the arc's signed bulge (= tan(includedAngle/4)) fully determines the sweep,
  // including major arcs (|bulge| > 1). Derive the center from (start, end, bulge) so we don't depend
  // on a possibly-stale center, then sweep by the exact signed angle. Without this, the fallback below
  // forces the minor (<=180deg) arc and mis-draws every major arc (verified: a 254deg union arc rendered
  // as its 106deg complement).
  if (bulge != null && Number.isFinite(bulge) && Math.abs(bulge) > 1e-9) {
    const theta = 4 * Math.atan(bulge)                 // signed included angle
    const L = Math.hypot(end.x - start.x, end.y - start.y)
    if (L > 1e-9 && Math.abs(Math.sin(theta / 2)) > 1e-9) {
      const ux = (end.x - start.x) / L, uy = (end.y - start.y) / L
      const R = L / (2 * Math.sin(theta / 2))          // signed radius
      const mx = (start.x + end.x) / 2, my = (start.y + end.y) / 2
      const apo = R * Math.cos(theta / 2)              // signed apothem along the left-normal (-uy, ux)
      const cx = mx - uy * apo, cy = my + ux * apo
      const rr = Math.abs(R)
      const a0b = Math.atan2(start.y - cy, start.x - cx)
      const pts = []
      for (let i = 0; i <= n; i++) { const a = a0b + (theta * i) / n; pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]) }
      return pts
    }
  }
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

// ── Color modes ──
// 'native' (DEFAULT): use the model's own ClassCAD colors — mesh-level material
//   first, then the container material (appearance settings, imported colors).
//   Bodies that share a color look identical; that is faithful to the model.
// 'distinct': ignore materials and give every body its own palette color —
//   choose this when you need to tell bodies apart (booleans, splits, patterns,
//   assemblies with identical parts).
// Fallback: native mode falls back to the palette when no material is present.
export const COLOR_MODES = ['native', 'distinct']

// Normalize a material color to [0..1] multipliers (engine sends 0–255 ints,
// synthetic/test data may already be 0..1).
function materialRgb(mat) {
  const c = mat?.color
  if (!Array.isArray(c) || c.length < 3 || c.some(v => typeof v !== 'number')) return null
  const m = Math.max(c[0], c[1], c[2])
  return m > 1 ? [c[0] / 255, c[1] / 255, c[2] / 255] : [c[0], c[1], c[2]]
}

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
 * When `instances` is provided (assemblies), each draw applies its world
 * transform before projection; the palette keys per template, so all copies
 * of the same part share a color.
 * Returns { pixels: Buffer (RGBA), width, height } or null if no geometry.
 */
// ── Section plane ──
// section: { origin: [x,y,z], normal: [x,y,z] } cuts the model: everything on
// the POSITIVE side of the plane (dot(p - origin, normal) > 0) is removed.
// Cut bodies are rendered UNCAPPED — interior walls become visible and are
// shaded darker (back faces are not culled while a section is active).
// The view keeps the UNSECTIONED model's framing, so a sectioned and an
// unsectioned render of the same state are directly comparable.
function normalizeSection(section) {
  if (!section || !Array.isArray(section.origin) || !Array.isArray(section.normal)) return null
  const [nx, ny, nz] = section.normal
  const len = Math.hypot(nx, ny, nz)
  if (!(len > 1e-12)) return null
  return { o: section.origin, n: [nx / len, ny / len, nz / len] }
}

const _planeDist = (p, s) => (p[0] - s.o[0]) * s.n[0] + (p[1] - s.o[1]) * s.n[1] + (p[2] - s.o[2]) * s.n[2]

// Sutherland-Hodgman: clip a world-space polygon to dot(p-o, n) <= 0.
function clipPolyToSection(pts, s) {
  const d = pts.map(p => _planeDist(p, s))
  const out = []
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length
    if (d[i] <= 0) out.push(pts[i])
    if ((d[i] < 0 && d[j] > 0) || (d[i] > 0 && d[j] < 0)) {
      const t = d[i] / (d[i] - d[j])
      out.push([
        pts[i][0] + t * (pts[j][0] - pts[i][0]),
        pts[i][1] + t * (pts[j][1] - pts[i][1]),
        pts[i][2] + t * (pts[j][2] - pts[i][2]),
      ])
    }
  }
  return out
}

/**
 * Z-buffer rasterizer for solid rendering. Eliminates all Z-fighting artifacts.
 * When `instances` is provided (assemblies), each draw applies its world
 * transform before projection; the palette keys per template, so all copies
 * of the same part share a color.
 *
 * The last parameter is either a color-mode string ('native' | 'distinct') or
 * an options object:
 *   colors    — 'native' | 'distinct' (see COLOR_MODES)
 *   section   — { origin, normal } clipping plane (see normalizeSection)
 *   highlight — array of ids to render in SIGNAL ORANGE. Ids match graphic
 *               containers (container.id), their owning solids (container.owner),
 *               individual faces (mesh.id) and edges (edge.id). Use it to make
 *               "which face/edge/body is id N?" visible.
 *   markers   — [{ position: [x,y,z], label?, color? }] probe markers drawn ON
 *               TOP of everything (no depth test): crosshair + optional label.
 *   xray      — true: render bodies translucent (painter's blend, fixed alpha
 *               ~0.42; xrayAlpha overrides). Hidden bodies and internal far
 *               walls shine through; edges stay fully opaque on top. Back
 *               faces remain culled, so images stay readable.
 *   annotate  — true: draw a measurement overlay — world-space bounding-box
 *               extents (X x Y x Z, model units, bottom right), an RGB axes
 *               triad oriented like the current view (bottom left), and a
 *               scale bar with a round model-unit length (bottom center).
 *   overlays  — [{ pts: [[x,y,z],…], color?, dashed? }] world-space polylines
 *               drawn on top (no depth test), e.g. sketch curves in 3D. Overlay
 *               points participate in auto-fit, and they alone are enough to
 *               produce a render (a sketch-only session renders on white).
 * Returns { pixels, width, height, frame } or null if no geometry.
 */
export function renderSolidZBuffer(graphic, width = IMG_W, height = IMG_H, instances = null, optsOrColorMode = 'native') {
  const opts = typeof optsOrColorMode === 'string' ? { colors: optsOrColorMode } : (optsOrColorMode ?? {})
  const colorMode = opts.colors ?? 'native'
  const section = normalizeSection(opts.section)
  const highlightIds = Array.isArray(opts.highlight) && opts.highlight.length ? new Set(opts.highlight.map(Number)) : null
  const HIGHLIGHT_RGB = [1.0, 0.45, 0.05] // signal orange
  const overlays = Array.isArray(opts.overlays) ? opts.overlays.filter(o => Array.isArray(o?.pts) && o.pts.length >= 2) : []
  const annotate = !!opts.annotate
  const xray = !!opts.xray
  const xrayAlpha = typeof opts.xrayAlpha === 'number' && opts.xrayAlpha > 0 && opts.xrayAlpha < 1 ? opts.xrayAlpha : 0.42
  const wmin = [Infinity, Infinity, Infinity], wmax = [-Infinity, -Infinity, -Infinity]
  const growBBox = (x, y, z) => {
    if (x < wmin[0]) wmin[0] = x; if (x > wmax[0]) wmax[0] = x
    if (y < wmin[1]) wmin[1] = y; if (y > wmax[1]) wmax[1] = y
    if (z < wmin[2]) wmin[2] = z; if (z > wmax[2]) wmax[2] = z
  }

  const allPts2d = []
  const tris = []  // { v0, v1, v2 (screen+depth), r, g, b }
  const edgeLines = []

  const drawList = buildDrawList(graphic, instances)
  for (const draw of drawList) {
    const { container, transform, paletteIdx } = draw
    const fallback = BODY_PALETTES[paletteIdx % BODY_PALETTES.length]
    for (const mesh of (container.meshes || [])) {
      const meshHighlighted = highlightIds &&
        (highlightIds.has(Number(mesh.id)) || highlightIds.has(Number(container.id)) || highlightIds.has(Number(container.owner)))
      // native: model's own colors (mesh material > container material > palette)
      const palette = meshHighlighted
        ? HIGHLIGHT_RGB
        : colorMode === 'distinct'
          ? fallback
          : materialRgb(mesh.material) ?? materialRgb(container.properties?.material) ?? fallback
      const verts = mesh.vertices, norms = mesh.normals, indices = mesh.indices
      for (let i = 0; i < indices.length; i += 3) {
        // World-space triangle (instance transform applied). ALL original
        // vertices feed the auto-fit extent — including culled/clipped ones —
        // so framing stays stable across section/cull decisions.
        const wv = []
        for (let j = 0; j < 3; j++) {
          const idx = indices[i + j]
          let vx = verts[idx*3], vy = verts[idx*3+1], vz = verts[idx*3+2]
          if (transform) [vx, vy, vz] = applyMatPoint(transform, vx, vy, vz)
          wv.push([vx, vy, vz])
          if (annotate) growBBox(vx, vy, vz)
          const [px, py] = project(vx, vy, vz)
          allPts2d.push([px, py])
        }
        let nx = norms[indices[i]*3], ny = norms[indices[i]*3+1], nz = norms[indices[i]*3+2]
        if (transform) [nx, ny, nz] = applyMatVec(transform, nx, ny, nz)
        const [, , lz] = project(nx, ny, nz)

        // Back faces: culled normally — but with a section active they ARE the
        // interior walls the cut exposes, so shade them (darker) instead.
        let facing = 1
        if (lz < 0) {
          if (!section) continue
          facing = 0.72
        }

        // Section clip (world space) → 0..4-gon → fan triangulation.
        let polys = [wv]
        if (section) {
          const clipped = clipPolyToSection(wv, section)
          if (clipped.length < 3) continue
          polys = []
          for (let k = 1; k + 1 < clipped.length; k++) polys.push([clipped[0], clipped[k], clipped[k + 1]])
        }

        let brightness = Math.max(0.25, Math.min(1, 0.3 + 0.7 * Math.abs(lz))) * facing
        if (meshHighlighted) brightness = Math.max(0.62, brightness)
        const shade = 100 + 130 * brightness
        const r = Math.round(shade * palette[0])
        const g = Math.round(shade * palette[1])
        const b = Math.round(shade * palette[2])
        for (const poly of polys) {
          const tv = poly.map(([vx, vy, vz]) => {
            const [px, py, pz] = project(vx, vy, vz)
            return { px, py, pz }
          })
          tris.push({ v: tv, r, g, b })
        }
      }
    }
    for (const edge of (container.edges || [])) {
      const pts = edge.points
      // World-space polyline; original points always feed the extent.
      const world = []
      for (let i = 0; i < pts.length; i += 3) {
        let ex = pts[i], ey = pts[i+1], ez = pts[i+2]
        if (transform) [ex, ey, ez] = applyMatPoint(transform, ex, ey, ez)
        world.push([ex, ey, ez])
        const [px, py] = project(ex, ey, ez)
        allPts2d.push([px, py])
      }
      // Section: split the polyline at plane crossings, keep the ≤0 side.
      const pieces = []
      if (!section) {
        pieces.push(world)
      } else {
        let cur = []
        for (let i = 0; i < world.length; i++) {
          const di = _planeDist(world[i], section)
          if (i > 0) {
            const dp = _planeDist(world[i - 1], section)
            if ((dp < 0 && di > 0) || (dp > 0 && di < 0)) {
              const t = dp / (dp - di)
              const cut = [
                world[i-1][0] + t * (world[i][0] - world[i-1][0]),
                world[i-1][1] + t * (world[i][1] - world[i-1][1]),
                world[i-1][2] + t * (world[i][2] - world[i-1][2]),
              ]
              if (dp <= 0) { cur.push(cut); pieces.push(cur); cur = [] }
              else cur.push(cut)
            }
          }
          if (di <= 0) cur.push(world[i])
          else if (cur.length) { pieces.push(cur); cur = [] }
        }
        if (cur.length) pieces.push(cur)
      }
      const edgeHighlighted = highlightIds && highlightIds.has(Number(edge.id))
      for (const piece of pieces) {
        if (piece.length < 2) continue
        const proj = piece.map(([ex, ey, ez]) => {
          const [px, py, pz] = project(ex, ey, ez)
          return { px, py, pz }
        })
        proj.highlighted = edgeHighlighted
        edgeLines.push(proj)
      }
    }
  }

  // Overlay polylines participate in the fit (and can carry it alone).
  const overlayProj = overlays.map(o => ({
    color: Array.isArray(o.color) && o.color.length === 3 ? o.color : [0, 90, 220],
    dashed: !!o.dashed,
    pts: o.pts.map(([x, y, z]) => {
      const [px, py, pz] = project(x, y, z)
      allPts2d.push([px, py])
      return { px, py, pz }
    }),
  }))

  if (allPts2d.length === 0) return null
  const xf = viewTransform(allPts2d, width, height)

  // Allocate pixel + depth buffers
  const pixels = allocPixels(width * height * 4) // white RGBA
  const zBuf = new Float64Array(width * height).fill(-Infinity)

  // Rasterize triangles. X-ray: painter's algorithm back-to-front with fixed
  // alpha blending (no depth rejection) — hidden geometry shines through.
  if (xray) {
    const withDepth = tris.map(tri => ({
      tri,
      d: (tri.v[0].pz + tri.v[1].pz + tri.v[2].pz) / 3,
    }))
    withDepth.sort((a, b) => a.d - b.d) // far → near
    for (const { tri } of withDepth) {
      const sv = tri.v.map(v => { const [sx, sy] = xf(v.px, v.py); return { sx, sy, sz: v.pz } })
      _rasterTriBlend(pixels, width, height, sv[0], sv[1], sv[2], tri.r, tri.g, tri.b, xrayAlpha)
    }
  } else {
    for (const tri of tris) {
      const sv = tri.v.map(v => { const [sx, sy] = xf(v.px, v.py); return { sx, sy, sz: v.pz } })
      _rasterTri(pixels, zBuf, width, height, sv[0], sv[1], sv[2], tri.r, tri.g, tri.b)
    }
  }

  // Draw edges on top (2px, dark color, with depth test). Highlighted edges:
  // signal red, generous z-bias so they stay visible on their surface.
  const edgeColor = { r: 26, g: 26, b: 58 }
  const hlColor = { r: 230, g: 40, b: 30 }
  for (const epts of edgeLines) {
    const sv = epts.map(v => { const [sx, sy] = xf(v.px, v.py); return { sx, sy, sz: v.pz } })
    for (let i = 0; i < sv.length - 1; i++) {
      if (epts.highlighted) {
        _rasterLine(pixels, zBuf, width, height, sv[i], sv[i+1], hlColor, xray ? 1e9 : 2)
        _rasterLine(pixels, zBuf, width, height, { ...sv[i], sy: sv[i].sy + 1 }, { ...sv[i+1], sy: sv[i+1].sy + 1 }, hlColor, xray ? 1e9 : 2)
      } else {
        _rasterLine(pixels, zBuf, width, height, sv[i], sv[i+1], edgeColor, xray ? 1e9 : 0.5)
      }
    }
  }

  // Overlay polylines — always on top (huge z-bias defeats the depth test).
  for (const ov of overlayProj) {
    const col = { r: ov.color[0], g: ov.color[1], b: ov.color[2] }
    const sv = ov.pts.map(v => { const [sx, sy] = xf(v.px, v.py); return { sx, sy, sz: v.pz } })
    let dashAcc = 0
    for (let i = 0; i < sv.length - 1; i++) {
      if (ov.dashed) {
        // 6-on / 4-off screen-space dashing, phase carried along the polyline.
        const segLen = Math.hypot(sv[i+1].sx - sv[i].sx, sv[i+1].sy - sv[i].sy)
        let t = 0
        while (t < segLen) {
          const phase = (dashAcc + t) % 10
          const runLen = phase < 6 ? Math.min(6 - phase, segLen - t) : Math.min(10 - phase, segLen - t)
          if (phase < 6 && runLen > 0.2) {
            const t0 = t / segLen, t1 = (t + runLen) / segLen
            _rasterLine(pixels, zBuf, width, height,
              { sx: sv[i].sx + (sv[i+1].sx - sv[i].sx) * t0, sy: sv[i].sy + (sv[i+1].sy - sv[i].sy) * t0, sz: sv[i].sz },
              { sx: sv[i].sx + (sv[i+1].sx - sv[i].sx) * t1, sy: sv[i].sy + (sv[i+1].sy - sv[i].sy) * t1, sz: sv[i+1].sz },
              col, 1e9)
          }
          t += runLen
        }
        dashAcc = (dashAcc + segLen) % 10
      } else {
        _rasterLine(pixels, zBuf, width, height, sv[i], sv[i+1], col, 1e9)
      }
    }
  }

  // Probe markers — always on top (no depth test): crosshair + label.
  if (Array.isArray(opts.markers)) {
    for (const m of opts.markers) {
      if (!Array.isArray(m?.position) || m.position.length !== 3) continue
      const [px, py] = project(m.position[0], m.position[1], m.position[2])
      const [sx, sy] = xf(px, py)
      const cx = Math.round(sx), cy = Math.round(sy)
      const col = Array.isArray(m.color) && m.color.length === 3 ? m.color : [220, 30, 30]
      const put = (x, y) => {
        if (x < 0 || x >= width || y < 0 || y >= height) return
        const i = (y * width + x) * 4
        pixels[i] = col[0]; pixels[i+1] = col[1]; pixels[i+2] = col[2]; pixels[i+3] = 255
      }
      const R = 7
      for (let d = -R; d <= R; d++) { put(cx + d, cy); put(cx, cy + d) } // cross
      for (let a = 0; a < 32; a++) { // circle
        const x = Math.round(cx + (R - 2) * Math.cos((a * Math.PI) / 16))
        const y = Math.round(cy + (R - 2) * Math.sin((a * Math.PI) / 16))
        put(x, y)
      }
      if (m.label) drawText(pixels, width, height, cx + R + 4, cy - 6, m.label, col, 2)
    }
  }

  // Measurement overlay: extents, axes triad, scale bar.
  if (annotate && Number.isFinite(wmin[0])) {
    const ink = [60, 60, 60]
    const fmt = v => (Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1))
    // Extents (bottom right)
    const ext = `${fmt(wmax[0] - wmin[0])} X ${fmt(wmax[1] - wmin[1])} X ${fmt(wmax[2] - wmin[2])}`
    drawText(pixels, width, height, width - measureText(ext, 2) - 10, height - 24, ext, ink, 2)
    // Axes triad (bottom left) — directions follow the current view projection.
    const anchor = [34, height - 34]
    const axes = [
      { d: [1, 0, 0], color: [200, 40, 40], label: 'X' },
      { d: [0, 1, 0], color: [40, 150, 40], label: 'Y' },
      { d: [0, 0, 1], color: [40, 70, 200], label: 'Z' },
    ]
    for (const ax of axes) {
      const [dx, dy] = project(ax.d[0], ax.d[1], ax.d[2])
      const len = Math.hypot(dx, dy)
      if (len < 1e-6) continue // axis points into the screen in this view
      const ux = dx / len, uy = -dy / len // screen y grows downward
      const L = 26
      const tip = { sx: anchor[0] + ux * L, sy: anchor[1] + uy * L, sz: 1e12 }
      _rasterLine(pixels, zBuf, width, height, { sx: anchor[0], sy: anchor[1], sz: 1e12 }, tip, { r: ax.color[0], g: ax.color[1], b: ax.color[2] }, 1e12)
      drawText(pixels, width, height, tip.sx + ux * 4 - 2, tip.sy + uy * 4 - 3, ax.label, ax.color, 1)
    }
    // Scale bar (bottom center): round model-unit length mapping to 60–140 px.
    const scale = _lastFrame?.scale
    if (scale > 0) {
      let L = Math.pow(10, Math.floor(Math.log10(100 / scale)))
      for (const m of [1, 2, 5, 10]) { if (L * m * scale >= 60) { L = L * m; break } }
      const px = L * scale
      const y0 = height - 16
      const x0 = Math.round(width / 2 - px / 2)
      for (let x = 0; x <= px; x++) {
        const i = (y0 * width + Math.min(width - 1, x0 + x)) * 4
        pixels[i] = ink[0]; pixels[i+1] = ink[1]; pixels[i+2] = ink[2]; pixels[i+3] = 255
      }
      for (const xx of [x0, Math.round(x0 + px)]) {
        for (let dy = -4; dy <= 0; dy++) {
          const i = ((y0 + dy) * width + Math.min(width - 1, xx)) * 4
          pixels[i] = ink[0]; pixels[i+1] = ink[1]; pixels[i+2] = ink[2]; pixels[i+3] = 255
        }
      }
      const lbl = fmt(L)
      drawText(pixels, width, height, width / 2 - measureText(lbl, 1) / 2, y0 - 14, lbl, ink, 1)
    }
  }

  return { pixels, width, height, frame: _lastFrame ? { ..._lastFrame } : null }
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

/** Rasterize a triangle with ALPHA BLENDING and no depth test (x-ray mode). */
function _rasterTriBlend(pixels, w, h, v0, v1, v2, r, g, b, alpha) {
  let minX = Math.max(0, Math.floor(Math.min(v0.sx, v1.sx, v2.sx)))
  let maxX = Math.min(w - 1, Math.ceil(Math.max(v0.sx, v1.sx, v2.sx)))
  let minY = Math.max(0, Math.floor(Math.min(v0.sy, v1.sy, v2.sy)))
  let maxY = Math.min(h - 1, Math.ceil(Math.max(v0.sy, v1.sy, v2.sy)))
  const denom = (v1.sy - v2.sy) * (v0.sx - v2.sx) + (v2.sx - v1.sx) * (v0.sy - v2.sy)
  if (Math.abs(denom) < 1e-10) return
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const w0 = ((v1.sy - v2.sy) * (x - v2.sx) + (v2.sx - v1.sx) * (y - v2.sy)) / denom
      const w1 = ((v2.sy - v0.sy) * (x - v2.sx) + (v0.sx - v2.sx) * (y - v2.sy)) / denom
      const w2 = 1 - w0 - w1
      if (w0 < -0.001 || w1 < -0.001 || w2 < -0.001) continue
      const i = (y * w + x) * 4
      pixels[i] = Math.round(pixels[i] * (1 - alpha) + r * alpha)
      pixels[i+1] = Math.round(pixels[i+1] * (1 - alpha) + g * alpha)
      pixels[i+2] = Math.round(pixels[i+2] * (1 - alpha) + b * alpha)
      pixels[i+3] = 255
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
export function renderSolidSVG(graphic, width = IMG_W, height = IMG_H, instances = null, colorMode = 'native') {
  const allPts2d = []
  const triangles = []
  const edges = []

  const drawList = buildDrawList(graphic, instances)
  for (const draw of drawList) {
    const { container, transform, paletteIdx } = draw
    const fallback = BODY_PALETTES[paletteIdx % BODY_PALETTES.length]
    for (const mesh of (container.meshes || [])) {
      const palette = colorMode === 'distinct'
        ? fallback
        : materialRgb(mesh.material) ?? materialRgb(container.properties?.material) ?? fallback
      const verts = mesh.vertices, norms = mesh.normals, indices = mesh.indices
      for (let i = 0; i < indices.length; i += 3) {
        const triVerts = []
        for (let j = 0; j < 3; j++) {
          const idx = indices[i + j]
          let vx = verts[idx*3], vy = verts[idx*3+1], vz = verts[idx*3+2]
          if (transform) [vx, vy, vz] = applyMatPoint(transform, vx, vy, vz)
          const [px, py, pz] = project(vx, vy, vz)
          triVerts.push({ px, py, pz })
          allPts2d.push([px, py])
        }
        let nx = norms[indices[i]*3], ny = norms[indices[i]*3+1], nz = norms[indices[i]*3+2]
        if (transform) [nx, ny, nz] = applyMatVec(transform, nx, ny, nz)
        const [, , lz] = project(nx, ny, nz)
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
        let ex = pts[i], ey = pts[i+1], ez = pts[i+2]
        if (transform) [ex, ey, ez] = applyMatPoint(transform, ex, ey, ez)
        const [px, py] = project(ex, ey, ez)
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
// DIMENSION EXTRACTION — from structure tree
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract dimension data from the structure tree for a given sketch.
 * Walks the tree looking for CC_SketchDimensionSet with owner === sketchId,
 * then collects all CC_*FeatureDimension children.
 */
export function extractDimensions(tree, sketchId) {
  const dims = []

  // Find the CC_SketchDimensionSet that owns this sketch
  let dimSetId = null
  for (const [id, obj] of Object.entries(tree)) {
    if (obj.class === 'CC_SketchDimensionSet' && obj.members?.owner?.value === sketchId) {
      dimSetId = Number(id)
      break
    }
  }
  if (dimSetId == null) return dims

  const dimSet = tree[String(dimSetId)]
  for (const childId of (dimSet.children || [])) {
    const obj = tree[String(childId)]
    if (!obj) continue
    const m = obj.members || {}

    if (obj.class === 'CC_LinearFeatureDimension') {
      const startPt = m.startPt?.value
      const endPt = m.endPt?.value
      const angle = m.angle?.value ?? 0
      const orientationType = m.orientationType?.value ?? 2
      const dimPt = m.dimPt?.value
      // Compute value from geometry
      if (startPt && endPt) {
        const dx = endPt.x - startPt.x, dy = endPt.y - startPt.y
        const value = Math.abs(dx * Math.cos(angle) + dy * Math.sin(angle))
        dims.push({ kind: 'linear', startPt, endPt, angle, orientationType, dimPt, value })
      }
    } else if (obj.class === 'CC_RadialFeatureDimension') {
      const center = m.center?.value
      const radius = m.radius?.value ?? m.value?.value
      const dimPt = m.dimPt?.value
      if (center != null && radius != null) {
        dims.push({ kind: 'radial', center, radius, value: radius, dimPt })
      }
    } else if (obj.class === 'CC_DiameterFeatureDimension') {
      const center = m.center?.value
      const radius = m.radius?.value
      const dimPt = m.dimPt?.value
      if (center != null && radius != null) {
        dims.push({ kind: 'diameter', center, radius, value: 2 * radius, dimPt })
      }
    } else if (obj.class === 'CC_AngularFeatureDimension') {
      const startPt = m.startPt?.value
      const endPt = m.endPt?.value
      const cornerPt = m.cornerPt?.value
      const ccw = m.ccw?.value ?? 1
      const dimPt = m.dimPt?.value
      if (startPt && endPt && cornerPt) {
        const a0 = Math.atan2(startPt.y - cornerPt.y, startPt.x - cornerPt.x)
        const a1 = Math.atan2(endPt.y - cornerPt.y, endPt.x - cornerPt.x)
        let angle = a1 - a0
        if (ccw && angle < 0) angle += 2 * Math.PI
        if (!ccw && angle > 0) angle -= 2 * Math.PI
        dims.push({ kind: 'angular', startPt, endPt, cornerPt, ccw, value: Math.abs(angle) * 180 / Math.PI, dimPt })
      }
    }
  }
  return dims
}

/**
 * Render dimension annotations as SVG elements.
 * @param {Array} dims — from extractDimensions()
 * @param {Function} xf — viewTransform function (world → screen)
 * @returns {string} SVG elements string
 */
function renderDimensionsSVG(dims, xf) {
  let svg = ''
  const DIM_COLOR = '#555'
  const EXT_COLOR = '#999'
  const ARROW_LEN = 10
  const EXT_GAP = 5
  const EXT_OVERSHOOT = 6

  for (const dim of dims) {
    if (dim.kind === 'linear') {
      svg += _renderLinearDim(dim, xf, DIM_COLOR, EXT_COLOR, ARROW_LEN, EXT_GAP, EXT_OVERSHOOT)
    } else if (dim.kind === 'radial') {
      svg += _renderRadialDim(dim, xf, DIM_COLOR, ARROW_LEN, 'R')
    } else if (dim.kind === 'diameter') {
      svg += _renderRadialDim(dim, xf, DIM_COLOR, ARROW_LEN, '⌀')
    } else if (dim.kind === 'angular') {
      svg += _renderAngularDim(dim, xf, DIM_COLOR)
    }
  }
  return svg
}

function _renderLinearDim(dim, xf, color, extColor, arrowLen, extGap, extOver) {
  const { startPt, endPt, angle, dimPt, value } = dim

  // Transform measurement points to screen
  const [sx1, sy1] = xf(startPt.x, startPt.y)
  const [sx2, sy2] = xf(endPt.x, endPt.y)

  // Dimension direction (along measurement) and perpendicular
  const dirX = Math.cos(angle), dirY = Math.sin(angle)
  // In screen space, Y is flipped
  const perpX = -dirY, perpY = dirX  // perpendicular in world space

  // Determine dimension line offset from geometry
  // Use dimPt if available, otherwise auto-offset
  let dimLineY  // offset distance in screen coords along perpendicular
  if (dimPt) {
    const [dx, dy] = xf(dimPt.x, dimPt.y)
    // Project dimPt onto the perpendicular direction from the midpoint
    const midSx = (sx1 + sx2) / 2, midSy = (sy1 + sy2) / 2
    // Use dimPt directly as the label position
    const [dimSx, dimSy] = [dx, dy]

    // Compute the dimension line endpoints — project measurement points along perpendicular to dimPt level
    // For H_DIST (orientationType=1): dimension line is horizontal at dimPt.y
    // For V_DIST (orientationType=0): dimension line is vertical at dimPt.x
    // For OFFSET (orientationType=2): dimension line is parallel to measured line at dimPt offset

    let d1, d2, labelPos
    if (dim.orientationType === 1) {
      // HORIZONTAL_DISTANCE — horizontal dim line at dimPt.y
      d1 = xf(startPt.x, dimPt.y)
      d2 = xf(endPt.x, dimPt.y)
      labelPos = [dx, dy]
    } else if (dim.orientationType === 0) {
      // VERTICAL_DISTANCE — vertical dim line at dimPt.x
      d1 = xf(dimPt.x, startPt.y)
      d2 = xf(dimPt.x, endPt.y)
      labelPos = [dx, dy]
    } else {
      // OFFSET — parallel to measurement direction at dimPt offset
      d1 = xf(startPt.x + (dimPt.y - startPt.y) * perpX / (perpY || 1) * 0,
              dimPt.y)
      // Simpler: project start/end onto a line through dimPt perpendicular to angle
      const offsetDist = (dimPt.x - startPt.x) * (-dirY) + (dimPt.y - startPt.y) * dirX
      d1 = xf(startPt.x + offsetDist * (-dirY), startPt.y + offsetDist * dirX)
      d2 = xf(endPt.x + offsetDist * (-dirY), endPt.y + offsetDist * dirX)
      labelPos = [dx, dy]
    }

    const svg = _drawLinearDimSVG(sx1, sy1, sx2, sy2, d1, d2, labelPos, value, color, extColor, arrowLen, extGap, extOver)
    return svg
  }

  // Fallback: auto-offset 20px perpendicular to the line
  const offset = 20
  const psx = perpX * offset, psy = -perpY * offset
  const d1 = [sx1 + psx, sy1 + psy]
  const d2 = [sx2 + psx, sy2 + psy]
  const labelPos = [(d1[0] + d2[0]) / 2, (d1[1] + d2[1]) / 2]
  return _drawLinearDimSVG(sx1, sy1, sx2, sy2, d1, d2, labelPos, value, color, extColor, arrowLen, extGap, extOver)
}

function _drawLinearDimSVG(sx1, sy1, sx2, sy2, d1, d2, labelPos, value, color, extColor, arrowLen, extGap, extOver) {
  let svg = ''

  // Extension lines
  const ext1Dir = [d1[0] - sx1, d1[1] - sy1]
  const ext1Len = Math.sqrt(ext1Dir[0] ** 2 + ext1Dir[1] ** 2)
  if (ext1Len > 1) {
    const nx = ext1Dir[0] / ext1Len, ny = ext1Dir[1] / ext1Len
    svg += `<line x1="${(sx1 + nx * extGap).toFixed(1)}" y1="${(sy1 + ny * extGap).toFixed(1)}" x2="${(d1[0] + nx * extOver).toFixed(1)}" y2="${(d1[1] + ny * extOver).toFixed(1)}" stroke="${extColor}" stroke-width="0.5"/>\n`
  }
  const ext2Dir = [d2[0] - sx2, d2[1] - sy2]
  const ext2Len = Math.sqrt(ext2Dir[0] ** 2 + ext2Dir[1] ** 2)
  if (ext2Len > 1) {
    const nx = ext2Dir[0] / ext2Len, ny = ext2Dir[1] / ext2Len
    svg += `<line x1="${(sx2 + nx * extGap).toFixed(1)}" y1="${(sy2 + ny * extGap).toFixed(1)}" x2="${(d2[0] + nx * extOver).toFixed(1)}" y2="${(d2[1] + ny * extOver).toFixed(1)}" stroke="${extColor}" stroke-width="0.5"/>\n`
  }

  // Dimension line with arrowheads
  svg += `<line x1="${d1[0].toFixed(1)}" y1="${d1[1].toFixed(1)}" x2="${d2[0].toFixed(1)}" y2="${d2[1].toFixed(1)}" stroke="${color}" stroke-width="1"/>\n`

  const dx = d2[0] - d1[0], dy = d2[1] - d1[1]
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len > 2 * arrowLen) {
    const ux = dx / len, uy = dy / len
    const px = -uy, py = ux
    svg += `<polygon points="${d1[0].toFixed(1)},${d1[1].toFixed(1)} ${(d1[0] + ux * arrowLen + px * 2.5).toFixed(1)},${(d1[1] + uy * arrowLen + py * 2.5).toFixed(1)} ${(d1[0] + ux * arrowLen - px * 2.5).toFixed(1)},${(d1[1] + uy * arrowLen - py * 2.5).toFixed(1)}" fill="${color}"/>\n`
    svg += `<polygon points="${d2[0].toFixed(1)},${d2[1].toFixed(1)} ${(d2[0] - ux * arrowLen + px * 2.5).toFixed(1)},${(d2[1] - uy * arrowLen + py * 2.5).toFixed(1)} ${(d2[0] - ux * arrowLen - px * 2.5).toFixed(1)},${(d2[1] - uy * arrowLen - py * 2.5).toFixed(1)}" fill="${color}"/>\n`
  }

  // Value text with white background
  const text = _formatValue(value)
  const textWidth = text.length * 10.5 + 6
  svg += `<rect x="${(labelPos[0] - textWidth / 2).toFixed(1)}" y="${(labelPos[1] - 11).toFixed(1)}" width="${textWidth.toFixed(1)}" height="22" fill="white" rx="3"/>\n`
  svg += `<text x="${labelPos[0].toFixed(1)}" y="${(labelPos[1] + 6).toFixed(1)}" text-anchor="middle" fill="${color}" font-family="sans-serif" font-size="18" font-weight="bold">${text}</text>\n`

  return svg
}

function _renderRadialDim(dim, xf, color, arrowLen, prefix) {
  const { center, radius, value, dimPt } = dim
  let svg = ''

  const [cx, cy] = xf(center.x, center.y)

  let angle = Math.PI / 4
  if (dimPt) {
    const [dx, dy] = xf(dimPt.x, dimPt.y)
    angle = Math.atan2(cy - dy, dx - cx)
  }

  const circumPt = xf(center.x + radius * Math.cos(angle), center.y + radius * Math.sin(angle))

  const leaderLen = 30
  const ux = Math.cos(angle), uy = -Math.sin(angle)
  const leaderEnd = [circumPt[0] + ux * leaderLen, circumPt[1] + uy * leaderLen]

  svg += `<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${leaderEnd[0].toFixed(1)}" y2="${leaderEnd[1].toFixed(1)}" stroke="${color}" stroke-width="1"/>\n`

  const px = -uy, py = ux
  svg += `<polygon points="${circumPt[0].toFixed(1)},${circumPt[1].toFixed(1)} ${(circumPt[0] + ux * arrowLen + px * 2.5).toFixed(1)},${(circumPt[1] + uy * arrowLen + py * 2.5).toFixed(1)} ${(circumPt[0] + ux * arrowLen - px * 2.5).toFixed(1)},${(circumPt[1] + uy * arrowLen - py * 2.5).toFixed(1)}" fill="${color}"/>\n`

  const text = `${prefix}${_formatValue(value)}`
  const textWidth = text.length * 10.5 + 6
  const textX = leaderEnd[0] + (ux > 0 ? textWidth / 2 + 2 : -textWidth / 2 - 2)
  svg += `<rect x="${(textX - textWidth / 2).toFixed(1)}" y="${(leaderEnd[1] - 11).toFixed(1)}" width="${textWidth.toFixed(1)}" height="22" fill="white" rx="3"/>\n`
  svg += `<text x="${textX.toFixed(1)}" y="${(leaderEnd[1] + 6).toFixed(1)}" text-anchor="middle" fill="${color}" font-family="sans-serif" font-size="18" font-weight="bold">${text}</text>\n`

  return svg
}

function _renderAngularDim(dim, xf, color) {
  const { startPt, endPt, cornerPt, value, dimPt } = dim
  let svg = ''

  const [cx, cy] = xf(cornerPt.x, cornerPt.y)
  const [sx, sy] = xf(startPt.x, startPt.y)
  const [ex, ey] = xf(endPt.x, endPt.y)

  const arcRadius = 25
  const a0 = Math.atan2(-(sy - cy), sx - cx)
  const a1 = Math.atan2(-(ey - cy), ex - cx)

  let sweep = a1 - a0
  if (sweep < 0) sweep += 2 * Math.PI
  if (sweep > Math.PI) sweep = sweep - 2 * Math.PI

  const pts = []
  const n = 32
  for (let i = 0; i <= n; i++) {
    const a = a0 + sweep * i / n
    pts.push([cx + arcRadius * Math.cos(a), cy - arcRadius * Math.sin(a)])
  }

  svg += `<polyline points="${pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" fill="none" stroke="${color}" stroke-width="1"/>\n`

  const midA = a0 + sweep / 2
  const textR = arcRadius + 12
  const textX = cx + textR * Math.cos(midA)
  const textY = cy - textR * Math.sin(midA)
  const text = `${_formatValue(value)}°`
  const textWidth = text.length * 10.5 + 6
  svg += `<rect x="${(textX - textWidth / 2).toFixed(1)}" y="${(textY - 11).toFixed(1)}" width="${textWidth.toFixed(1)}" height="22" fill="white" rx="3"/>\n`
  svg += `<text x="${textX.toFixed(1)}" y="${(textY + 6).toFixed(1)}" text-anchor="middle" fill="${color}" font-family="sans-serif" font-size="18" font-weight="bold">${text}</text>\n`

  return svg
}

/**
 * Pre-adjust dimension dimPt positions to push entire dimensions outward from geometry.
 * Modifies each dim's dimPt in place. Extension lines stretch; lines + arrows + label move as a unit.
 * Uses geometry centroid to determine "outward" direction.
 */
function _adjustDimPositions(dims, xf, geoSegments, geoCircles) {
  if (dims.length === 0) return

  // Geometry centroid (screen-space)
  let cx = 0, cy = 0, count = 0
  for (const s of geoSegments) { cx += (s.x1 + s.x2) / 2; cy += (s.y1 + s.y2) / 2; count++ }
  for (const c of geoCircles) { cx += c.cx; cy += c.cy; count++ }
  if (count > 0) { cx /= count; cy /= count }

  // Build label proxies for each dimension (screen-space position + size)
  const proxies = []
  for (const dim of dims) {
    if (!dim.dimPt) continue

    const [dx, dy] = xf(dim.dimPt.x, dim.dimPt.y)
    const text = dim.kind === 'angular' ? `${_formatValue(dim.value)}°`
              : dim.kind === 'radial' ? `R${_formatValue(dim.value)}`
              : dim.kind === 'diameter' ? `⌀${_formatValue(dim.value)}`
              : _formatValue(dim.value)
    const w = text.length * 10.5 + 6
    const h = 22

    proxies.push({ dim, x: dx, y: dy, anchorX: dx, anchorY: dy, w, h })
  }

  if (proxies.length === 0) return

  // Run de-overlap with geometry awareness on dimension positions
  deOverlapLabels(proxies, geoSegments, geoCircles, {
    iterations: 25, padding: 6, geoClearance: 14, outwardStrength: 3.0
  })

  // Write adjusted positions back to dim.dimPt (inverse transform)
  // We need the inverse of xf. Approximate by using two known points to derive the inverse.
  // xf maps world→screen. We need screen→world.
  const [ox, oy] = xf(0, 0)
  const [ux, uy] = xf(1, 0)
  const [vx, vy] = xf(0, 1)
  // xf is affine: screen = [ox,oy] + world.x*[ux-ox, uy-oy] + world.y*[vx-ox, vy-oy]
  const ax = ux - ox, ay = uy - oy  // screen delta per world x
  const bx = vx - ox, by = vy - oy  // screen delta per world y
  const det = ax * by - ay * bx
  if (Math.abs(det) < 1e-10) return  // degenerate transform

  for (const p of proxies) {
    const sdx = p.x - ox, sdy = p.y - oy
    const wx = (sdx * by - sdy * bx) / det
    const wy = (ax * sdy - ay * sdx) / det
    p.dim.dimPt = { x: wx, y: wy, z: 0 }
  }
}

function _formatValue(v) {
  if (v == null) return '?'
  // Show integer if close to one, otherwise 1 decimal
  return Math.abs(v - Math.round(v)) < 0.01 ? String(Math.round(v)) : v.toFixed(1)
}

// ═══════════════════════════════════════════════════════════════════════════
// LABEL DE-OVERLAP — force-directed with geometry avoidance + outward bias
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Adjusts label positions to reduce overlaps and avoid geometry.
 * Each label: { x, y, w, h, anchorX, anchorY, text, color, bg, ... }
 * Modifies x, y in place.
 *
 * @param {Array} labels - label objects with position and size
 * @param {Array} geoSegments - screen-space geometry: [{ x1,y1, x2,y2 }, ...] (line segments)
 * @param {Array} geoCircles - screen-space circles: [{ cx, cy, r }, ...]
 * @param {object} opts - { iterations, padding, geoClearance, outwardStrength }
 */
function deOverlapLabels(labels, geoSegments = [], geoCircles = [], opts = {}) {
  if (labels.length === 0) return
  const { iterations = 30, padding = 4, geoClearance = 12, outwardStrength = 2.5 } = opts

  // Compute geometry centroid for outward bias
  let cx = 0, cy = 0, count = 0
  for (const s of geoSegments) {
    cx += (s.x1 + s.x2) / 2; cy += (s.y1 + s.y2) / 2; count++
  }
  for (const c of geoCircles) {
    cx += c.cx; cy += c.cy; count++
  }
  if (count > 0) { cx /= count; cy /= count }

  for (let iter = 0; iter < iterations; iter++) {
    let totalOverlap = 0

    for (let i = 0; i < labels.length; i++) {
      const a = labels[i]
      let fx = 0, fy = 0  // accumulated force

      // (a) Label–label repulsion
      for (let j = 0; j < labels.length; j++) {
        if (i === j) continue
        const b = labels[j]
        const ox = Math.min(a.x + a.w / 2 + padding, b.x + b.w / 2 + padding) -
                   Math.max(a.x - a.w / 2 - padding, b.x - b.w / 2 - padding)
        const oy = Math.min(a.y + a.h / 2 + padding, b.y + b.h / 2 + padding) -
                   Math.max(a.y - a.h / 2 - padding, b.y - b.h / 2 - padding)

        if (ox > 0 && oy > 0) {
          totalOverlap += ox * oy
          let dx = a.x - b.x, dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const push = Math.min(ox, oy) * 0.4
          fx += (dx / dist) * push
          fy += (dy / dist) * push
        }
      }

      // (b) Label–geometry repulsion (push away from nearby geometry)
      const hw = a.w / 2 + geoClearance, hh = a.h / 2 + geoClearance

      // Repel from line segments
      for (const seg of geoSegments) {
        // Closest point on segment to label center
        const sdx = seg.x2 - seg.x1, sdy = seg.y2 - seg.y1
        const segLen2 = sdx * sdx + sdy * sdy
        if (segLen2 < 1) continue
        let t = ((a.x - seg.x1) * sdx + (a.y - seg.y1) * sdy) / segLen2
        t = Math.max(0, Math.min(1, t))
        const nearX = seg.x1 + t * sdx, nearY = seg.y1 + t * sdy
        const dx = a.x - nearX, dy = a.y - nearY
        const dist = Math.sqrt(dx * dx + dy * dy) || 1

        // Repel if within clearance zone (approximate with max of hw, hh)
        const threshold = Math.max(hw, hh)
        if (dist < threshold) {
          const strength = (threshold - dist) / threshold * 4.0
          fx += (dx / dist) * strength
          fy += (dy / dist) * strength
        }
      }

      // Repel from circles
      for (const circ of geoCircles) {
        const dx = a.x - circ.cx, dy = a.y - circ.cy
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const edgeDist = Math.abs(dist - circ.r)  // distance to the circle's edge
        const threshold = Math.max(hw, hh)

        if (edgeDist < threshold) {
          // Push radially outward from circle center
          const strength = (threshold - edgeDist) / threshold * 3.0
          fx += (dx / dist) * strength
          fy += (dy / dist) * strength
        }
      }

      // (c) Outward bias — push away from geometry centroid
      if (count > 0) {
        const dx = a.x - cx, dy = a.y - cy
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        fx += (dx / dist) * outwardStrength
        fy += (dy / dist) * outwardStrength
      }

      // Apply accumulated forces
      a.x += fx
      a.y += fy

      // Spring back toward anchor (weak — allows outward migration)
      a.x += (a.anchorX - a.x) * 0.03
      a.y += (a.anchorY - a.y) * 0.03
    }

    if (totalOverlap < 1 && iter > 5) break  // converged
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// CONSTRAINT EXTRACTION — from structure tree
// ═══════════════════════════════════════════════════════════════════════════

const CONSTRAINT_SYMBOLS = {
  Horizontal: 'H',
  Vertical: 'V',
  Perpendicular: '⊥',
  Parallel: '∥',
  EqualLength: '=',
  EqualRadius: '=',
  Tangent: 'T',
  Concentric: '⊙',
  Coincident: '•',
  Fixation: '⚓',
  Midpoint: 'M',
  Symmetry: 'S',
  Colinear: '⫽',
}

/**
 * Extract constraint data from the structure tree for a given sketch.
 * Skips auto-generated constraints (name starts with "Auto_").
 */
export function extractConstraints(tree, sketchId) {
  const constraints = []

  for (const [id, obj] of Object.entries(tree)) {
    if (obj.parent !== sketchId) continue
    if (!obj.class?.startsWith('CC_2D') || !obj.class?.endsWith('Constraint')) continue
    // Skip auto-generated constraints (from genFixation, genIncidence, genTangency, genVertAndHoriz)
    // and fillet-generated constraints. Only show user-created constraints.
    if (obj.name?.startsWith('Auto_')) continue

    // Extract type from class: CC_2D{Type}Constraint → Type
    const typeMatch = obj.class.match(/^CC_2D(.+)Constraint$/)
    if (!typeMatch) continue
    const type = typeMatch[1]

    // Extract entity IDs
    const entities = (obj.members?.entities?.members || [])
      .map(m => m.value)
      .filter(v => v != null)

    const symbol = CONSTRAINT_SYMBOLS[type] || type.charAt(0)
    constraints.push({ type, symbol, entities, name: obj.name, id: Number(id) })
  }

  return constraints
}

/**
 * Render constraint badges as SVG elements.
 * Places small labeled pills near the midpoint of constrained geometry.
 */
function renderConstraintsSVG(constraints, xf, posMap, labelCollector = []) {
  if (!constraints.length) return ''
  let svg = ''

  const BADGE_COLOR = '#448844'
  const BADGE_BG = 'rgba(68, 136, 68, 0.15)'
  const FONT_SIZE = 14

  const byEntity = {}
  for (const c of constraints) {
    const primaryEntity = c.entities[0]
    if (primaryEntity == null) continue
    if (!byEntity[primaryEntity]) byEntity[primaryEntity] = []
    byEntity[primaryEntity].push(c)
  }

  for (const [entityId, cList] of Object.entries(byEntity)) {
    const pos = posMap[entityId]
    if (!pos?.midpoint) continue

    const [sx, sy] = xf(pos.midpoint.x, pos.midpoint.y)

    for (let i = 0; i < cList.length; i++) {
      const c = cList[i]
      const bx = sx + 8
      const by = sy - 10 - i * 20

      const text = c.symbol
      const textWidth = Math.max(text.length * 10, 16) + 8

      // Badge → collector (rendered after de-overlap)
      labelCollector.push({
        x: bx, y: by, anchorX: bx, anchorY: by,
        w: textWidth, h: 20, text, color: BADGE_COLOR,
        bg: BADGE_BG, fontSize: FONT_SIZE, rx: 10, stroke: BADGE_COLOR,
      })
    }
  }

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
  const posMap = {}  // geomId → { midpoint: {x, y} } for constraint rendering

  for (const lineId of (geom.lines || [])) {
    const pos = (await execute({ 'v1.sketch.getPositions': [{ id: lineId }] })).result
    if (pos) {
      const lObj = structureTree[String(lineId)]
      const isConstruction = lObj?.members?.isConstruction?.value === 1
      items.push({ type: 'line', startPos: pos.startPos, endPos: pos.endPos, isConstruction })
      posMap[lineId] = { midpoint: { x: (pos.startPos.x + pos.endPos.x) / 2, y: (pos.startPos.y + pos.endPos.y) / 2 } }
      // Also map endpoint IDs if available via getPoints
      const pts = (await execute({ 'v1.sketch.getPoints': [{ id: lineId }] })).result
      if (pts) {
        posMap[pts.startId] = { midpoint: pos.startPos }
        posMap[pts.endId] = { midpoint: pos.endPos }
      }
    }
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
    const isConstruction = obj?.members?.isConstruction?.value === 1
    items.push({ type: 'circle', center: centerPos.pos, radius, isConstruction })
    posMap[circleId] = { midpoint: centerPos.pos }
    posMap[pts.centerId] = { midpoint: centerPos.pos }
  }

  for (const arcId of (geom.arcs || [])) {
    const pos = (await execute({ 'v1.sketch.getPositions': [{ id: arcId }] })).result
    if (pos) {
      const arcObj = structureTree[String(arcId)]
      const bulge = arcObj?.members?.bulge?.value ?? null   // signed tan(includedAngle/4); disambiguates major arcs
      const isConstruction = arcObj?.members?.isConstruction?.value === 1
      items.push({ type: 'arc', startPos: pos.startPos, endPos: pos.endPos, centerPos: pos.centerPos, bulge, isConstruction })
      posMap[arcId] = { midpoint: { x: (pos.startPos.x + pos.endPos.x) / 2, y: (pos.startPos.y + pos.endPos.y) / 2 } }
      const pts = (await execute({ 'v1.sketch.getPoints': [{ id: arcId }] })).result
      if (pts) {
        if (pts.startId) posMap[pts.startId] = { midpoint: pos.startPos }
        if (pts.endId) posMap[pts.endId] = { midpoint: pos.endPos }
        if (pts.centerId) posMap[pts.centerId] = { midpoint: pos.centerPos }
      }
    }
  }

  for (const ptId of (geom.points || [])) {
    const pos = (await execute({ 'v1.sketch.getPositions': [{ id: ptId }] })).result
    if (pos?.pos) {
      items.push({ type: 'point', pos: pos.pos })
      posMap[ptId] = { midpoint: pos.pos }
    }
  }

  return { items, posMap }
}

export function renderSketchSVG(items, width = IMG_W, height = IMG_H, dimensions = [], constraints = [], posMap = {}) {
  const allPts2d = []
  const drawOps = []

  for (const item of items) {
    if (item.type === 'line') {
      const s = [item.startPos.x, item.startPos.y], e = [item.endPos.x, item.endPos.y]
      allPts2d.push(s, e)
      drawOps.push({ kind: 'line', pts: [s, e], construction: item.isConstruction })
    } else if (item.type === 'circle' && item.radius != null) {
      const pts = tessellateCircle(item.center.x, item.center.y, item.radius)
      allPts2d.push(...pts)
      drawOps.push({ kind: 'polyline', pts, color: '#0066cc', construction: item.isConstruction, _circle: { cx: item.center.x, cy: item.center.y, r: item.radius } })
    } else if (item.type === 'circle') {
      // No radius — just mark center
      allPts2d.push([item.center.x, item.center.y])
      drawOps.push({ kind: 'point', pos: [item.center.x, item.center.y] })
    } else if (item.type === 'arc') {
      const pts = tessellateArc(item.startPos, item.endPos, item.centerPos, 64, null, item.bulge)
      allPts2d.push(...pts)
      drawOps.push({ kind: 'polyline', pts, color: '#cc6600', construction: item.isConstruction })
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
      // construction geometry: dashed, thin, distinct violet — reference-only, not part of the profile
      const style = op.construction ? `stroke="#a64dff" stroke-width="1.5" stroke-dasharray="6,4"` : `stroke="#0044aa" stroke-width="3"`
      svg += `<line x1="${s[0].toFixed(1)}" y1="${s[1].toFixed(1)}" x2="${e[0].toFixed(1)}" y2="${e[1].toFixed(1)}" ${style}/>\n`
    } else if (op.kind === 'polyline') {
      const pts = op.pts.map(p => xf(p[0], p[1]))
      const stroke = op.construction ? '#a64dff' : (op.color || '#0044aa')
      const extra = op.construction ? ` stroke-width="1.5" stroke-dasharray="6,4"` : ` stroke-width="3"`
      svg += `<polyline points="${pts.map(p => p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}" fill="none" stroke="${stroke}"${extra}/>\n`
    } else if (op.kind === 'point') {
      const [px, py] = xf(op.pos[0], op.pos[1])
      svg += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5" fill="#cc0000"/>\n`
    }
  }

  // Collect screen-space geometry for annotation placement
  const geoSegments = [], geoCircles = []
  for (const op of drawOps) {
    if (op.kind === 'line') {
      const [s, e] = op.pts.map(p => xf(p[0], p[1]))
      geoSegments.push({ x1: s[0], y1: s[1], x2: e[0], y2: e[1] })
    } else if (op.kind === 'polyline' && op.pts.length > 1) {
      const txPts = op.pts.map(p => xf(p[0], p[1]))
      for (let k = 0; k < txPts.length - 1; k++) {
        geoSegments.push({ x1: txPts[k][0], y1: txPts[k][1], x2: txPts[k + 1][0], y2: txPts[k + 1][1] })
      }
      if (op._circle) {
        const [ccx, ccy] = xf(op._circle.cx, op._circle.cy)
        const edgePt = xf(op._circle.cx + op._circle.r, op._circle.cy)
        geoCircles.push({ cx: ccx, cy: ccy, r: Math.abs(edgePt[0] - ccx) })
      }
    }
  }

  // DIMENSION ANNOTATIONS — whole-dimension de-overlap
  // Adjust dimPt positions BEFORE rendering so dim lines + arrows + labels move together.
  // Extension lines stretch naturally since the renderer computes them from geometry to dimPt.
  if (dimensions.length > 0) {
    _adjustDimPositions(dimensions, xf, geoSegments, geoCircles)
    svg += renderDimensionsSVG(dimensions, xf)
  }

  // CONSTRAINT BADGES — free-floating, use label collector + de-overlap
  const badgeCollector = []
  if (constraints.length > 0) {
    svg += renderConstraintsSVG(constraints, xf, posMap, badgeCollector)
  }
  if (badgeCollector.length > 0) {
    deOverlapLabels(badgeCollector, geoSegments, geoCircles)
    for (const lb of badgeCollector) {
      svg += `<rect x="${(lb.x - lb.w / 2).toFixed(1)}" y="${(lb.y - lb.h / 2).toFixed(1)}" width="${lb.w.toFixed(1)}" height="${lb.h.toFixed(1)}" fill="${lb.bg || 'white'}" ${lb.rx ? `rx="${lb.rx}"` : 'rx="3"'} ${lb.stroke ? `stroke="${lb.stroke}" stroke-width="0.8"` : ''}/>\n`
      svg += `<text x="${lb.x.toFixed(1)}" y="${(lb.y + lb.fontSize * 0.33).toFixed(1)}" text-anchor="middle" fill="${lb.color}" font-family="sans-serif" font-size="${lb.fontSize}" font-weight="bold">${lb.text}</text>\n`
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
export function renderCurveSVG(graphic, width = IMG_W, height = IMG_H) {
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
export function extractWorkGeometry(tree) {
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
export function renderWorkGeoSVG(workGeo, width = IMG_W, height = IMG_H, extraPts2d = []) {
  const { planes, axes, points, csyses } = workGeo
  if (!planes.length && !axes.length && !points.length && !csyses.length) return null

  // Collect all 3D points for view fitting
  const allPts2d = [...extraPts2d]

  // Pre-project all geometry
  const projPlanes = planes.map(p => {
    const corners = workPlaneCorners(p.pos, p.normal, p.size, p.offset)
    const proj = corners.map(([x,y,z]) => {
      const [px, py] = project(x, y, z)
      allPts2d.push([px, py])
      return [px, py]
    })
    // Center for label
    const center = project(
      p.pos.x + p.normal.x * p.offset,
      p.pos.y + p.normal.y * p.offset,
      p.pos.z + p.normal.z * p.offset
    )
    return { ...p, proj, center: [center[0], center[1]] }
  })

  const projAxes = axes.map(a => {
    const start = [a.pos.x, a.pos.y, a.pos.z]
    const end = [a.pos.x + a.dir.x * a.length, a.pos.y + a.dir.y * a.length, a.pos.z + a.dir.z * a.length]
    const ps = project(...start)
    const pe = project(...end)
    allPts2d.push([ps[0], ps[1]], [pe[0], pe[1]])
    return { ...a, start: [ps[0], ps[1]], end: [pe[0], pe[1]] }
  })

  const projPoints = points.map(p => {
    const [px, py] = project(p.pos.x, p.pos.y, p.pos.z)
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
    const po = project(...o)
    const px = project(...xEnd)
    const py = project(...yEnd)
    const pz = project(...zEnd)
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
// RASTER TEXT — minimal 5×7 bitmap font for labels (sheet titles, markers,
// annotations). Deterministic, dependency-free.
// ═══════════════════════════════════════════════════════════════════════════

const FONT5X7 = {
  A: ['.XX.','X..X','X..X','XXXX','X..X','X..X','X..X'],
  B: ['XXX.','X..X','X..X','XXX.','X..X','X..X','XXX.'],
  C: ['.XX.','X..X','X...','X...','X...','X..X','.XX.'],
  D: ['XXX.','X..X','X..X','X..X','X..X','X..X','XXX.'],
  E: ['XXXX','X...','X...','XXX.','X...','X...','XXXX'],
  F: ['XXXX','X...','X...','XXX.','X...','X...','X...'],
  G: ['.XX.','X..X','X...','X.XX','X..X','X..X','.XXX'],
  H: ['X..X','X..X','X..X','XXXX','X..X','X..X','X..X'],
  I: ['XXX','.X.','.X.','.X.','.X.','.X.','XXX'],
  J: ['..XX','...X','...X','...X','...X','X..X','.XX.'],
  K: ['X..X','X.X.','XX..','X...','XX..','X.X.','X..X'],
  L: ['X...','X...','X...','X...','X...','X...','XXXX'],
  M: ['X...X','XX.XX','X.X.X','X.X.X','X...X','X...X','X...X'],
  N: ['X..X','XX.X','XX.X','X.XX','X.XX','X..X','X..X'],
  O: ['.XX.','X..X','X..X','X..X','X..X','X..X','.XX.'],
  P: ['XXX.','X..X','X..X','XXX.','X...','X...','X...'],
  Q: ['.XX.','X..X','X..X','X..X','X.XX','X..X','.XXX'],
  R: ['XXX.','X..X','X..X','XXX.','XX..','X.X.','X..X'],
  S: ['.XXX','X...','X...','.XX.','...X','...X','XXX.'],
  T: ['XXXXX','..X..','..X..','..X..','..X..','..X..','..X..'],
  U: ['X..X','X..X','X..X','X..X','X..X','X..X','.XX.'],
  V: ['X...X','X...X','X...X','.X.X.','.X.X.','.X.X.','..X..'],
  W: ['X...X','X...X','X...X','X.X.X','X.X.X','XX.XX','X...X'],
  X: ['X...X','.X.X.','..X..','..X..','..X..','.X.X.','X...X'],
  Y: ['X...X','.X.X.','..X..','..X..','..X..','..X..','..X..'],
  Z: ['XXXX','...X','..X.','.X..','X...','X...','XXXX'],
  '0': ['.XX.','X..X','X.XX','XX.X','X..X','X..X','.XX.'],
  '1': ['.X.','XX.','.X.','.X.','.X.','.X.','XXX'],
  '2': ['.XX.','X..X','...X','..X.','.X..','X...','XXXX'],
  '3': ['XXX.','...X','...X','.XX.','...X','...X','XXX.'],
  '4': ['..X.','.XX.','X.X.','XXXX','..X.','..X.','..X.'],
  '5': ['XXXX','X...','XXX.','...X','...X','X..X','.XX.'],
  '6': ['.XX.','X...','XXX.','X..X','X..X','X..X','.XX.'],
  '7': ['XXXX','...X','..X.','..X.','.X..','.X..','.X..'],
  '8': ['.XX.','X..X','X..X','.XX.','X..X','X..X','.XX.'],
  '9': ['.XX.','X..X','X..X','.XXX','...X','...X','.XX.'],
  '.': ['...','...','...','...','...','.X.','.X.'],
  '-': ['....','....','....','XXXX','....','....','....'],
  ':': ['...','.X.','.X.','...','.X.','.X.','...'],
  '/': ['...X','...X','..X.','..X.','.X..','.X..','X...'],
  ' ': ['...','...','...','...','...','...','...'],
}

/**
 * Draw text into an RGBA buffer with the built-in 5×7 font. Uppercases input;
 * unknown characters render as space. Returns the pixel width drawn.
 */
export function drawText(pixels, width, height, x, y, text, color = [40, 40, 40], scale = 1) {
  let cx = Math.round(x)
  const cy = Math.round(y)
  for (const ch of String(text).toUpperCase()) {
    const glyph = FONT5X7[ch] ?? FONT5X7[' ']
    const gw = glyph[0].length
    for (let row = 0; row < glyph.length; row++) {
      for (let col = 0; col < gw; col++) {
        if (glyph[row][col] !== 'X') continue
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const px = cx + col * scale + sx
            const py = cy + row * scale + sy
            if (px < 0 || px >= width || py < 0 || py >= height) continue
            const i = (py * width + px) * 4
            pixels[i] = color[0]; pixels[i+1] = color[1]; pixels[i+2] = color[2]; pixels[i+3] = 255
          }
        }
      }
    }
    cx += (gw + 1) * scale
  }
  return cx - Math.round(x)
}

/** Measure text width in pixels for the built-in font. */
export function measureText(text, scale = 1) {
  let w = 0
  for (const ch of String(text).toUpperCase()) w += ((FONT5X7[ch] ?? FONT5X7[' '])[0].length + 1) * scale
  return w
}

// ═══════════════════════════════════════════════════════════════════════════
// MULTI-VIEW SHEET — four views in one image (technical-drawing style)
// ═══════════════════════════════════════════════════════════════════════════

const ORTHO_VIEWS = new Set(['top', 'bottom', 'front', 'back', 'left', 'right'])

/**
 * Render four views of the solids into ONE image (quadrants TL, TR, BL, BR).
 * Default layout: top / iso / front / right — third-angle-ish (top above
 * front, right beside front, iso in the free corner). All ORTHO views share a
 * COMMON scale (like a technical drawing), the iso quadrant auto-fits itself.
 * Labels use the built-in font.
 *
 * @param {object} graphic — graphic payload (containers)
 * @param {number} width/height — sheet size
 * @param {Array|null} instances — assembly instances (see renderSolidZBuffer)
 * @param {object} [opts] — { views: [tl,tr,bl,br], colors, section }
 * @returns {{pixels,width,height}|null}
 */
export function renderSolidSheet(graphic, width = IMG_W, height = IMG_H, instances = null, opts = {}) {
  const views = Array.isArray(opts.views) && opts.views.length === 4 ? opts.views : ['top', 'iso', 'front', 'right']
  const qw = Math.floor(width / 2)
  const qh = Math.floor(height / 2)
  const solidOpts = { colors: opts.colors, section: opts.section, highlight: opts.highlight, markers: opts.markers, xray: opts.xray, annotate: opts.annotate }

  // Pass 1: auto-fit render per view to learn each frame.
  const firstPass = views.map(view => {
    setViewport({ view })
    return renderSolidZBuffer(graphic, qw, qh, instances, solidOpts)
  })
  if (firstPass.every(r => r == null)) return null

  // Common scale across the ortho views (a drawing shares one scale).
  const orthoScales = views
    .map((v, i) => (typeof v === 'string' && ORTHO_VIEWS.has(v) && firstPass[i]?.frame ? firstPass[i].frame.scale : null))
    .filter(s => s != null)
  const commonScale = orthoScales.length ? Math.min(...orthoScales) : null

  // Pass 2: re-render ortho views pinned to the common scale (own centers).
  const quads = views.map((view, i) => {
    const fp = firstPass[i]
    if (!fp) return null
    if (typeof view === 'string' && ORTHO_VIEWS.has(view) && commonScale != null && fp.frame && fp.frame.scale !== commonScale) {
      setViewport({ view, frame: { scale: commonScale, midX: fp.frame.midX, midY: fp.frame.midY } })
      return renderSolidZBuffer(graphic, qw, qh, instances, solidOpts)
    }
    return fp
  })

  // Composite.
  const pixels = allocPixels(width * height * 4)
  const offsets = [[0, 0], [qw, 0], [0, qh], [qw, qh]]
  for (let q = 0; q < 4; q++) {
    const quad = quads[q]
    if (!quad) continue
    const [ox, oy] = offsets[q]
    for (let y = 0; y < qh; y++) {
      const srcRow = y * qw * 4
      const dstRow = ((y + oy) * width + ox) * 4
      quad.pixels.copy
        ? quad.pixels.copy(pixels, dstRow, srcRow, srcRow + qw * 4)
        : pixels.set(quad.pixels.subarray(srcRow, srcRow + qw * 4), dstRow)
    }
  }
  // Divider lines.
  const grey = [190, 190, 190]
  for (let x = 0; x < width; x++) {
    const i = (qh * width + x) * 4
    pixels[i] = grey[0]; pixels[i+1] = grey[1]; pixels[i+2] = grey[2]
  }
  for (let y = 0; y < height; y++) {
    const i = (y * width + qw) * 4
    pixels[i] = grey[0]; pixels[i+1] = grey[1]; pixels[i+2] = grey[2]
  }
  // Labels (top-left of each quadrant).
  for (let q = 0; q < 4; q++) {
    const [ox, oy] = offsets[q]
    const name = typeof views[q] === 'string' ? views[q] : 'custom'
    drawText(pixels, width, height, ox + 8, oy + 8, name, [70, 70, 70], 2)
  }
  return { pixels, width, height }
}

// ═══════════════════════════════════════════════════════════════════════════
// SKETCH → 3D OVERLAY — sketch curves as world-space polylines on the solid
// ═══════════════════════════════════════════════════════════════════════════

function _rodrigues(v, n, theta) {
  const c = Math.cos(theta), s = Math.sin(theta)
  const dot = n[0]*v[0] + n[1]*v[1] + n[2]*v[2]
  const cx = [n[1]*v[2] - n[2]*v[1], n[2]*v[0] - n[0]*v[2], n[0]*v[1] - n[1]*v[0]]
  return [
    v[0]*c + cx[0]*s + n[0]*dot*(1-c),
    v[1]*c + cx[1]*s + n[1]*dot*(1-c),
    v[2]*c + cx[2]*s + n[2]*dot*(1-c),
  ]
}

const _unit = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0]/l, v[1]/l, v[2]/l] }
const _p3 = p => [p?.x ?? 0, p?.y ?? 0, p?.z ?? 0]

/**
 * Turn one sketch's geometry (fetchSketchData items — WORLD coordinates) into
 * 3D overlay polylines for renderSolidZBuffer. Circles/arcs are tessellated in
 * the sketch plane, taken from the sketch node's coordinateSystem
 * ([origin, xDir, yDir, zDir]); arcs sweep by their signed bulge about the
 * plane normal. Construction geometry renders dashed violet.
 */
export function sketchToOverlays(items, sketchNode) {
  const cs = Array.isArray(sketchNode?.coordinateSystem) && sketchNode.coordinateSystem.length >= 4
    ? sketchNode.coordinateSystem
    : [[0,0,0],[1,0,0],[0,1,0],[0,0,1]]
  // Plane basis. The sketch node's coordinateSystem is NOT reliable for
  // plane-referenced sketches (it can stay identity), so derive the plane
  // NORMAL from the geometry itself: the cross product of two independent
  // in-plane direction vectors (line directions, arc radius vectors). Fall
  // back to the node cs when the sketch has no such directions (circle-only).
  const dirs = []
  for (const it of (items || [])) {
    if (it.type === 'line') {
      const s = _p3(it.startPos), e = _p3(it.endPos)
      dirs.push([e[0]-s[0], e[1]-s[1], e[2]-s[2]])
    } else if (it.type === 'arc') {
      const c = _p3(it.centerPos)
      for (const p of [it.startPos, it.endPos]) {
        const w = _p3(p)
        dirs.push([w[0]-c[0], w[1]-c[1], w[2]-c[2]])
      }
    }
  }
  let derived = null
  let best = 1e-9
  for (let i = 0; i < dirs.length; i++) {
    for (let j = i + 1; j < dirs.length; j++) {
      const a = dirs[i], b = dirs[j]
      const cx = [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]
      const norm = Math.hypot(cx[0], cx[1], cx[2])
      if (norm > best) { best = norm; derived = cx }
    }
  }
  const n = derived ? _unit(derived) : _unit(cs[3])
  // Any orthonormal in-plane pair works for circles (rotation-symmetric).
  let ref = Math.abs(n[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0]
  const u = _unit([n[1]*ref[2]-n[2]*ref[1], n[2]*ref[0]-n[0]*ref[2], n[0]*ref[1]-n[1]*ref[0]])
  const v = [n[1]*u[2]-n[2]*u[1], n[2]*u[0]-n[0]*u[2], n[0]*u[1]-n[1]*u[0]]
  const N = 48
  const overlays = []
  const colorFor = it => it.isConstruction ? [166, 77, 255] : [0, 90, 220]

  for (const it of (items || [])) {
    if (it.type === 'line') {
      overlays.push({ pts: [_p3(it.startPos), _p3(it.endPos)], color: colorFor(it), dashed: !!it.isConstruction })
    } else if (it.type === 'circle' && it.radius != null) {
      const c = _p3(it.center)
      const pts = []
      for (let i = 0; i <= N; i++) {
        const a = (2 * Math.PI * i) / N
        pts.push([
          c[0] + it.radius * (Math.cos(a) * u[0] + Math.sin(a) * v[0]),
          c[1] + it.radius * (Math.cos(a) * u[1] + Math.sin(a) * v[1]),
          c[2] + it.radius * (Math.cos(a) * u[2] + Math.sin(a) * v[2]),
        ])
      }
      overlays.push({ pts, color: colorFor(it), dashed: !!it.isConstruction })
    } else if (it.type === 'arc') {
      const c = _p3(it.centerPos), s = _p3(it.startPos), e = _p3(it.endPos)
      const v0 = [s[0]-c[0], s[1]-c[1], s[2]-c[2]]
      let theta
      if (it.bulge != null && Number.isFinite(it.bulge) && Math.abs(it.bulge) > 1e-9) {
        theta = 4 * Math.atan(it.bulge) // signed sweep about +n
      } else {
        // Fallback: minor arc via plane angles.
        const ve = [e[0]-c[0], e[1]-c[1], e[2]-c[2]]
        const a0 = Math.atan2(v0[0]*v[0]+v0[1]*v[1]+v0[2]*v[2], v0[0]*u[0]+v0[1]*u[1]+v0[2]*u[2])
        const a1 = Math.atan2(ve[0]*v[0]+ve[1]*v[1]+ve[2]*v[2], ve[0]*u[0]+ve[1]*u[1]+ve[2]*u[2])
        theta = a1 - a0
        if (theta > Math.PI) theta -= 2 * Math.PI
        if (theta < -Math.PI) theta += 2 * Math.PI
      }
      const pts = []
      for (let i = 0; i <= N; i++) {
        const r = _rodrigues(v0, n, (theta * i) / N)
        pts.push([c[0] + r[0], c[1] + r[1], c[2] + r[2]])
      }
      overlays.push({ pts, color: colorFor(it), dashed: !!it.isConstruction })
    }
  }
  return overlays
}

// ═══════════════════════════════════════════════════════════════════════════
// IMAGE DIFF — for before/after verification with a pinned frame
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compare two same-size RGBA renders. Meaningful ONLY when both were rendered
 * with the same view/size and a PINNED frame (options.frame) — auto-fit
 * reframes when geometry changes, which would make every pixel "differ".
 *
 * @param {{pixels:Uint8Array|Buffer,width:number,height:number}} a — before
 * @param {{pixels:Uint8Array|Buffer,width:number,height:number}} b — after
 * @param {object} [opts]
 * @param {number} [opts.tolerance=0] — per-channel absolute tolerance
 * @returns {{changed:number,total:number,fraction:number,
 *            bbox:{minX:number,minY:number,maxX:number,maxY:number}|null,
 *            pixels:Uint8Array|Buffer,width:number,height:number}}
 *   `pixels` visualizes the diff: unchanged content faded, changed pixels red.
 */
export function diffImages(a, b, opts = {}) {
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error(`diffImages: size mismatch (${a.width}x${a.height} vs ${b.width}x${b.height})`)
  }
  const tol = opts.tolerance ?? 0
  const { width, height } = a
  const out = allocPixels(width * height * 4)
  let changed = 0
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const differs =
        Math.abs(a.pixels[i] - b.pixels[i]) > tol ||
        Math.abs(a.pixels[i+1] - b.pixels[i+1]) > tol ||
        Math.abs(a.pixels[i+2] - b.pixels[i+2]) > tol
      if (differs) {
        changed++
        out[i] = 220; out[i+1] = 30; out[i+2] = 30; out[i+3] = 255
        if (x < minX) minX = x; if (x > maxX) maxX = x
        if (y < minY) minY = y; if (y > maxY) maxY = y
      } else {
        // Faded grayscale of the AFTER image as context.
        const lum = Math.round(0.299 * b.pixels[i] + 0.587 * b.pixels[i+1] + 0.114 * b.pixels[i+2])
        const v = 255 - Math.round((255 - lum) * 0.25)
        out[i] = v; out[i+1] = v; out[i+2] = v; out[i+3] = 255
      }
    }
  }
  return {
    changed,
    total: width * height,
    fraction: changed / (width * height),
    bbox: changed ? { minX, minY, maxX, maxY } : null,
    pixels: out,
    width,
    height,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA-LEVEL ORCHESTRATOR — pure: no file IO, no PNG encoding, no client
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Render every visible content type from session DATA. This is the portable
 * heart of the renderer: it needs only the structure tree, a graphic payload,
 * and (for sketches) an execute function — no filesystem, no PNG encoder, no
 * WebSocket client. Adapters (node.mjs, browser.mjs) wrap it with encoding/IO.
 *
 * @param {object} source
 * @param {object} source.tree — structure tree (GetTree → structure.tree)
 * @param {object|null} [source.graphic] — graphic payload with containers
 *   (from a recalc response or the client's accumulated last graphic)
 * @param {Function} [source.execute] — async task => response; enables sketch
 *   rendering (getGeometry/getPositions/getPoints queries). Omit to skip sketches.
 * @param {object} [options]
 * @param {number} [options.width=1600]
 * @param {number} [options.height=1200]
 * @param {string} [options.view='iso'] — one of VIEW_NAMES
 * @param {number} [options.zoom=1]
 * @param {[number,number,number]} [options.lookAt]
 * @param {boolean} [options.xray] — translucent bodies (fixed-alpha painter's
 *   blend): hidden bodies and internal far walls shine through, edges stay
 *   opaque. Quick internal check without choosing a section plane.
 * @param {boolean} [options.annotate] — measurement overlay on the solid render:
 *   bounding-box extents (model units), RGB axes triad for the current view,
 *   and a scale bar. A snapshot that answers "how big is this?" by itself.
 * @param {boolean} [options.sketchOverlay] — draw every sketch's curves in 3D
 *   (world space, on the sketch plane) ON TOP of the solid render — verifies a
 *   sketch sits on the intended plane at the intended place. Construction
 *   geometry dashes violet. Needs `execute`. Without solid geometry the
 *   overlay renders standalone.
 * @param {number[]} [options.highlight] — ids rendered in SIGNAL ORANGE/RED:
 *   graphic container ids, owning solid ids (container.owner), face mesh ids,
 *   edge ids. Makes "which face/edge/body is id N?" visible.
 * @param {Array<{position:number[],label?:string,color?:number[]}>} [options.markers]
 *   — probe markers (crosshair + label) drawn on top of the solid render, e.g.
 *   the probe points of a numeric verification.
 * @param {Array<'solid'|'sketch'|'curves'|'workgeo'>} [options.layers] — content
 *   types to render. Default: all detected. Skipped layers cost nothing (their
 *   queries don't run).
 * @param {boolean|string[]} [options.sheet] — render the solids as a FOUR-VIEW
 *   SHEET (one image, quadrants TL/TR/BL/BR; default top/iso/front/right; the
 *   ortho views share one scale like a technical drawing). Pass an array of 4
 *   view names to pick the quadrants. Entry type becomes 'sheet'.
 * @param {{scale:number,midX:number,midY:number}} [options.frame] — pin the view
 *   frame to one returned by an earlier solid render (same view/size) so
 *   before/after images are pixel-comparable; feed both to diffImages.
 * @param {{origin:number[],normal:number[]}} [options.section] — cut the solids
 *   at a plane: everything on the positive side of `normal` is removed, interior
 *   walls are shown shaded (uncapped). Framing stays that of the uncut model.
 * @param {'native'|'distinct'} [options.colors='native'] — 'native' renders the
 *   model's OWN ClassCAD colors (mesh/container materials); 'distinct' gives
 *   every body its own palette color — use it to tell bodies apart (booleans,
 *   splits, patterns, repeated parts).
 * @returns {Promise<Array>} entries:
 *   { type: 'solid',   kind: 'pixels', pixels, width, height }
 *   { type: 'sketch',  kind: 'svg', svg, sketchId, name }
 *   { type: 'curves',  kind: 'svg', svg }
 *   { type: 'workgeo', kind: 'svg', svg }
 */
export async function renderSessionData(source, options = {}) {
  const { tree = {}, graphic = null, execute = null } = source
  const width = options.width || IMG_W
  const height = options.height || IMG_H
  const out = []

  setViewport({ view: options.view, zoom: options.zoom, lookAt: options.lookAt, frame: options.frame })
  const content = analyzeSession(tree)
  const layerOn = (name) => !Array.isArray(options.layers) || options.layers.includes(name)

  // ── SKETCH OVERLAYS (3D) ── collect before solids so they render INTO the
  // solid image; with no solid geometry they render standalone on white.
  let sketchOverlays = null
  if (options.sketchOverlay && execute && layerOn('solid')) {
    sketchOverlays = []
    for (const sketchId of content.sketches) {
      try {
        const data = await fetchSketchData(task => execute(task), sketchId, tree)
        if (data?.items?.length) sketchOverlays.push(...sketchToOverlays(data.items, tree[String(sketchId)]))
      } catch (e) { /* skip empty/inaccessible sketch */ }
    }
    if (!sketchOverlays.length) sketchOverlays = null
  }

  // ── SOLIDS ── (type-1 containers with meshes; assemblies get per-instance transforms)
  if (layerOn('solid') && content.solids.length > 0 && graphic?.containers?.some(c => c.type === 1 && c.meshes?.length > 0)) {
    const solidOnly = { ...graphic, containers: graphic.containers.filter(c => c.type === 1 && c.meshes?.length > 0) }
    const instances = extractAssemblyInstances(tree)
    if (options.sheet) {
      // Four views in one image; options.sheet may be an array of 4 views.
      const sheet = renderSolidSheet(solidOnly, width, height, instances, {
        views: Array.isArray(options.sheet) ? options.sheet : undefined,
        colors: options.colors ?? 'native',
        section: options.section,
        highlight: options.highlight,
        markers: options.markers,
      })
      if (sheet) out.push({ type: 'sheet', kind: 'pixels', ...sheet })
    } else {
      const zbuf = renderSolidZBuffer(solidOnly, width, height, instances, { colors: options.colors ?? 'native', section: options.section, highlight: options.highlight, markers: options.markers, overlays: sketchOverlays ?? undefined, annotate: options.annotate, xray: options.xray, xrayAlpha: options.xrayAlpha })
      if (zbuf) out.push({ type: 'solid', kind: 'pixels', ...zbuf })
    }
  }

  // Sketch overlay without solid geometry → standalone 3D sketch view.
  if (sketchOverlays && !(layerOn('solid') && content.solids.length > 0 && graphic?.containers?.some(c => c.type === 1 && c.meshes?.length > 0))) {
    const zbuf = renderSolidZBuffer({ containers: [] }, width, height, null, { overlays: sketchOverlays, markers: options.markers })
    if (zbuf) out.push({ type: 'solid', kind: 'pixels', ...zbuf })
  }

  // ── SKETCHES ──
  if (execute && layerOn('sketch')) {
    for (const sketchId of content.sketches) {
      try {
        const sketchData = await fetchSketchData(task => execute(task), sketchId, tree)
        const items = sketchData?.items
        const posMap = sketchData?.posMap || {}
        if (items && items.length > 0) {
          const dimensions = extractDimensions(tree, sketchId)
          const constraints = extractConstraints(tree, sketchId)
          const svg = renderSketchSVG(items, width, height, dimensions, constraints, posMap)
          if (svg) {
            const name = tree[String(sketchId)]?.name || `sketch-${sketchId}`
            out.push({ type: 'sketch', kind: 'svg', svg, sketchId, name })
          }
        }
      } catch (e) { /* sketch empty or inaccessible — skip */ }
    }
  }

  // ── CURVES ── (type-2 containers; server pushes only the first curve per shape)
  if (layerOn('curves') && content.curves.length > 0 && graphic?.containers?.some(c => c.type === 2 && c.edges?.length > 0)) {
    const svg = renderCurveSVG(graphic, width, height)
    if (svg) out.push({ type: 'curves', kind: 'svg', svg })
  }

  // ── WORK GEOMETRY ──
  if (layerOn('workgeo') && content.workGeo.length > 0) {
    const workGeo = extractWorkGeometry(tree)
    const svg = renderWorkGeoSVG(workGeo, width, height)
    if (svg) out.push({ type: 'workgeo', kind: 'svg', svg })
  }

  return out
}
