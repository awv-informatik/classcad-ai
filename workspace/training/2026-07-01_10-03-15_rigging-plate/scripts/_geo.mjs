// _geo.mjs — segment-classification toolkit for the trim workflow.
// The hard part of preTrim->trim->postTrim is deciding WHICH staged segments to remove.
// Strategy: define the original closed shapes, then for each staged segment probe its midpoint
// pushed +/- eps along the local normal and ask "is there material on each side?".
import { positions } from './_setup.mjs'

const V = o => [o.x, o.y, o.z] // {x,y,z} -> [x,y,z]

// ---- point-in-shape predicates (strict interior; tol keeps boundary points out) ----
export const inCircle = (P, c, r, tol = 1e-6) => Math.hypot(P[0] - c[0], P[1] - c[1]) < r - tol
export function inPolygon(P, pts, tol = 1e-9) {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j]
    const hit = (yi > P[1]) !== (yj > P[1]) && P[0] < ((xj - xi) * (P[1] - yi)) / (yj - yi) + xi
    if (hit) inside = !inside
  }
  return inside
}
export const rectPts = (a, b) => [[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [a[0], b[1]]]
// distance from P to segment a-b (2D); capsule/stadium = all points within r of the segment.
export function segDist(P, a, b) {
  const vx = b[0] - a[0], vy = b[1] - a[1]
  const wx = P[0] - a[0], wy = P[1] - a[1]
  const vv = vx * vx + vy * vy || 1
  let t = (wx * vx + wy * vy) / vv
  t = Math.max(0, Math.min(1, t))
  const cx = a[0] + t * vx, cy = a[1] + t * vy
  return Math.hypot(P[0] - cx, P[1] - cy)
}
export const inCapsule = (P, a, b, r, tol = 1e-6) => segDist(P, a, b) < r - tol
export const contains = (shape, P) =>
  shape.kind === 'circle' ? inCircle(P, shape.c, shape.r)
    : shape.kind === 'capsule' ? inCapsule(P, shape.a, shape.b, shape.r)
      : shape.kind === 'rect' ? inPolygon(P, rectPts(shape.a, shape.b))
        : inPolygon(P, shape.pts)
export const inAny = (shapes, P) => shapes.some(s => contains(s, P))
export const countIn = (shapes, P) => shapes.reduce((n, s) => n + (contains(s, P) ? 1 : 0), 0)

// ---- segment midpoint + outward normal ----
// Determined from the segment's OWN geometry (node class + bulge), NOT from an interval->angle assumption.
// This is robust for a circle/arc cut ANY number of times (the interval method only held for a 2-cut circle).
// arc: derive center+midpoint from (start, end, signed bulge = tan(includedAngle/4)) — same math as the renderer.
const norm2 = (x, y) => { const L = Math.hypot(x, y) || 1; return [x / L, y / L] }

export function arcFromBulge(s, e, bulge) {
  const theta = 4 * Math.atan(bulge)                 // signed included angle
  const L = Math.hypot(e[0] - s[0], e[1] - s[1])
  const ux = (e[0] - s[0]) / L, uy = (e[1] - s[1]) / L
  const R = L / (2 * Math.sin(theta / 2))            // signed radius
  const mx = (s[0] + e[0]) / 2, my = (s[1] + e[1]) / 2
  const apo = R * Math.cos(theta / 2)
  const cx = mx - uy * apo, cy = my + ux * apo       // center
  const rr = Math.abs(R)
  const a0 = Math.atan2(s[1] - cy, s[0] - cx)
  const amid = a0 + theta / 2
  const mid = [cx + rr * Math.cos(amid), cy + rr * Math.sin(amid)]
  const normal = [(mid[0] - cx) / rr, (mid[1] - cy) / rr] // radial, outward from center
  return { center: [cx, cy], mid, normal, radius: rr }
}

const nodeOf = (tree, id) => tree?.[id] || tree?.[String(id)]

export async function segGeom(api, seg, tree) {
  const node = nodeOf(tree, seg.id)
  const cls = node?.class
  const pr = await positions(api, seg.id)
  const s = pr.startPos, e = pr.endPos
  if (!s || !e) return { mid: null, normal: null, kind: cls === 'CC_Arc' ? 'arc' : 'line', unqueryable: true }
  if (cls === 'CC_Arc') {
    const bulge = node.members?.bulge?.value
    const a = arcFromBulge(s, e, bulge)
    return { mid: a.mid, normal: a.normal, kind: 'arc', bulge, start: s, end: e, queryable: pr.maxLevel <= 31 }
  }
  // line (CC_Line) — midpoint + perpendicular normal
  const mid = [(s[0] + e[0]) / 2, (s[1] + e[1]) / 2]
  const d = norm2(e[0] - s[0], e[1] - s[1])
  return { mid, normal: [-d[1], d[0]], kind: 'line', start: s, end: e, queryable: pr.maxLevel <= 31 }
}

// ---- the boundary test ----
// keepRule receives (in1,in2,cnt1,cnt2) where inK = point on side K is inside ANY shape,
// cntK = how many shapes contain it. Default = UNION OUTLINE: keep iff material on exactly one side.
export const UNION_OUTLINE = (in1, in2) => in1 !== in2                 // boundary of the union
export const INSIDE_ONLY = (in1, in2) => in1 && in2                    // segments interior to the union (holes-as-material)
export function boundaryDecision(mid, normal, shapes, keepRule, eps = 0.02) {
  const p1 = [mid[0] + eps * normal[0], mid[1] + eps * normal[1]]
  const p2 = [mid[0] - eps * normal[0], mid[1] - eps * normal[1]]
  const cnt1 = countIn(shapes, p1), cnt2 = countIn(shapes, p2)
  const in1 = cnt1 > 0, in2 = cnt2 > 0
  return { keep: keepRule(in1, in2, cnt1, cnt2), in1, in2, cnt1, cnt2, p1, p2 }
}

// ---- classify a whole preTrim result ----
// tree = structure.tree from the preTrim response (for node class + bulge). shapes = closed shapes for containment.
export async function classify(api, preResult, tree, shapes, { keepRule = UNION_OUTLINE, eps = 0.02 } = {}) {
  const rows = []
  for (const entry of preResult) {
    for (const seg of entry.splittedCurves) {
      const g = await segGeom(api, seg, tree)
      if (!g.mid) { rows.push({ id: seg.id, sourceId: entry.sourceId, kind: g.kind, unqueryable: true, keep: false }); continue }
      const d = boundaryDecision(g.mid, g.normal, shapes, keepRule, eps)
      rows.push({ id: seg.id, sourceId: entry.sourceId, kind: g.kind, interval: seg.interval, mid: g.mid, ...d })
    }
  }
  return { rows, keep: rows.filter(r => r.keep).map(r => r.id), trim: rows.filter(r => !r.keep).map(r => r.id) }
}

// naive baseline for comparison: trim a segment iff its midpoint lies inside ANY shape (the classic weak rule).
// It has no notion of "one side vs both", so it keeps dangling segments outside every shape and can trim boundary pieces.
export async function classifyNaive(api, preResult, tree, shapes) {
  const rows = []
  for (const entry of preResult) {
    for (const seg of entry.splittedCurves) {
      const g = await segGeom(api, seg, tree)
      const insideAny = inAny(shapes, g.mid)
      rows.push({ id: seg.id, sourceId: entry.sourceId, kind: g.kind, mid: g.mid, trim: insideAny })
    }
  }
  return { rows, keep: rows.filter(r => !r.trim).map(r => r.id), trim: rows.filter(r => r.trim).map(r => r.id) }
}

// ---- containment-depth keep rule (the inner-loop generalization) ----
// Keep a segment iff it lies on the boundary of the region "inside at least k shapes":
// (countIn(side1) >= k) XOR (countIn(side2) >= k).
//   k = 1 -> outer boundary of the union (last session's UNION_OUTLINE).
//   k = 2 -> boundary of "inside >= 2 shapes" (e.g. the lens where two shapes overlap).
//   k = N -> the deepest inner loop (the region inside ALL N shapes).
// This discards the OUTER curves and carves the requested INNER loop.
export const DEPTH_AT_LEAST = k => (in1, in2, c1, c2) => (c1 >= k) !== (c2 >= k)

// ---- general region classifier ----
// Keep a segment iff a caller-supplied region predicate differs across the +/-eps probe (i.e. the segment is on
// the boundary of that region). regionFn(P:[x,y]) -> bool. This subsumes DEPTH_AT_LEAST and lets you carve ANY
// inner loop, e.g. regionFn = P => inRect(P,cell) && !inCircle(P,c,r)  (a cell with a circular bite).
export async function classifyByRegion(api, preResult, tree, regionFn, { eps = 0.02 } = {}) {
  const rows = []
  for (const entry of preResult) {
    for (const seg of entry.splittedCurves) {
      const g = await segGeom(api, seg, tree)
      if (!g.mid) { rows.push({ id: seg.id, sourceId: entry.sourceId, kind: g.kind, unqueryable: true, keep: false }); continue }
      const p1 = [g.mid[0] + eps * g.normal[0], g.mid[1] + eps * g.normal[1]]
      const p2 = [g.mid[0] - eps * g.normal[0], g.mid[1] - eps * g.normal[1]]
      const keep = regionFn(p1) !== regionFn(p2)
      rows.push({ id: seg.id, sourceId: entry.sourceId, kind: g.kind, mid: g.mid, keep })
    }
  }
  return { rows, keep: rows.filter(r => r.keep).map(r => r.id), trim: rows.filter(r => !r.keep).map(r => r.id) }
}
