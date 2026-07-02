// Shared builder for the robot-head sketch (v2 per ph review). Chain method per SKETCHING.md:
// rough seeds with bit-exact shared junctions (Auto_Coinc wires the chains), explicit TANGENT
// everywhere, FULL Ø5.6 eye circles with dome/fillet endpoints pinned ON them, datum = fixed
// construction centerlines, and the drawing's dimensions as the drivers — including the
// visible "3" (nose width), "3.5" (slot bottom → center mark), and "8" (eye center → jaw).
import { model, ROUGH, LINE_KEYS, ARC_KEYS, CIRCLE_KEYS } from './_model.mjs'

const P3 = p => [p[0], p[1], 0]

export const DIM_NAMES = [
  'D28L', 'D28R', 'D56L', 'D56R', 'R12', 'R2L', 'R2R', 'R1L', 'R1R',
  'RS_TR', 'RS_TL', 'RS_BL', 'RS_BR', 'HD6R', 'HD6L', 'VD8', 'VD2', 'W3', 'HD35R', 'HD35L', 'VD35',
]

export async function buildRobotHead(api, { params = ROUGH, onGeometry } = {}) {
  const M = model(params)

  const partR = await api.v1.part.create({ name: 'RobotHead' })
  const partId = partR.result
  const wp = Object.values(partR.structure.tree).find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  if (!wp) throw new Error('Top work plane not found')
  const skId = (await api.v1.sketch.create({ id: partId, planeId: wp.id, name: 'RobotHead' })).result

  // --- geometry, one batch call; gen* auto-constraints ON except fixation (we place the datum) ---
  const g = await api.v1.sketch.geometry({
    id: skId,
    genFixation: false,
    points: [{ pos: P3(M.slotCenter.p) }],
    lines: LINE_KEYS.map(k => ({
      startPos: P3(M[k].a), endPos: P3(M[k].b), isConstruction: k === 'clh' || k === 'clv',
    })),
    arcsByCenter: ARC_KEYS.map(k => ({
      startPos: P3(M[k].s), endPos: P3(M[k].e), centerPos: P3(M[k].c), isClockwise: M[k].cw,
    })),
    circles: CIRCLE_KEYS.map(k => ({ centerPos: P3(M[k].c), radius: M[k].r })),
  })
  const id = {}
  LINE_KEYS.forEach((k, i) => (id[k] = g.result.lines[i]))
  ARC_KEYS.forEach((k, i) => (id[k] = g.result.arcsByCenter[i]))
  CIRCLE_KEYS.forEach((k, i) => (id[k] = g.result.circles[i]))
  const slotCenterId = g.result.points[0]
  if (Object.values(id).some(v => v == null) || slotCenterId == null) throw new Error('geometry creation failed')
  if (onGeometry) await onGeometry({ skId, partId, id })

  // point ids (stable across solving — positions are read through them)
  const pts = {}
  for (const k of Object.keys(id)) pts[k] = (await api.v1.sketch.getPoints({ id: id[k] })).result

  // --- 1) datum: fix the construction axes' ENDPOINTS (FIXATION on a line doesn't lock length) ---
  const rFix = await api.v1.sketch.constraint(
    [pts.clh.startId, pts.clh.endId, pts.clv.startId, pts.clv.endId].map(p => ({
      id: skId, type: 'FIXATION', geomIds: [p],
    })))

  // --- 2) relations ---
  const T = (a, b) => ({ id: skId, type: 'TANGENT', geomIds: [id[a], id[b]] })
  const rRel = await api.v1.sketch.constraint([
    { id: skId, type: 'CONCENTRIC', geomIds: [id.bossR, id.holeR] },
    { id: skId, type: 'CONCENTRIC', geomIds: [id.bossL, id.holeL] },
    { id: skId, type: 'COINCIDENT', geomIds: [pts.holeR.centerId, id.clh] },
    { id: skId, type: 'COINCIDENT', geomIds: [pts.holeL.centerId, id.clh] },
    { id: skId, type: 'COINCIDENT', geomIds: [pts.dome.centerId, id.clv] },
    { id: skId, type: 'COINCIDENT', geomIds: [pts.slotTR.centerId, id.clh] },
    { id: skId, type: 'COINCIDENT', geomIds: [pts.slotTL.centerId, id.clh] },
    { id: skId, type: 'SYMMETRY', geomIds: [id.clv, pts.slotTL.centerId, pts.slotTR.centerId] },
    { id: skId, type: 'COINCIDENT', geomIds: [slotCenterId, id.clv] }, // center mark on the symmetry line
    // dome + R2 fillets: tangent to the FULL eye circles, endpoints pinned ON the circles
    T('dome', 'bossR'), T('dome', 'bossL'),
    { id: skId, type: 'COINCIDENT', geomIds: [pts.dome.startId, id.bossR] },
    { id: skId, type: 'COINCIDENT', geomIds: [pts.dome.endId, id.bossL] },
    T('f2R', 'bossR'), T('f2L', 'bossL'),
    { id: skId, type: 'COINCIDENT', geomIds: [pts.f2R.endId, id.bossR] },
    { id: skId, type: 'COINCIDENT', geomIds: [pts.f2L.startId, id.bossL] },
    // chin chain tangencies
    T('bottom', 'f1R'), T('bottom', 'f1L'),
    T('sideR', 'f1R'), T('sideL', 'f1L'),
    T('sideR', 'f2R'), T('sideL', 'f2L'),
    // slot corner tangencies
    T('slotRight', 'slotTR'), T('slotTop', 'slotTR'),
    T('slotTop', 'slotTL'), T('slotLeft', 'slotTL'),
    T('slotLeft', 'slotBL'), T('slotBottom', 'slotBL'),
    T('slotBottom', 'slotBR'), T('slotRight', 'slotBR'),
  ])

  // --- 3) dimensions: the drawing's values drive the layout (order matches DIM_NAMES) ---
  const rDim = await api.v1.sketch.dimension([
    { id: skId, name: 'D28L', type: 'DIAMETER', geomIds: [id.holeL], value: 2.8 },
    { id: skId, name: 'D28R', type: 'DIAMETER', geomIds: [id.holeR], value: 2.8 },
    { id: skId, name: 'D56L', type: 'DIAMETER', geomIds: [id.bossL], value: 5.6 },
    { id: skId, name: 'D56R', type: 'DIAMETER', geomIds: [id.bossR], value: 5.6 },
    { id: skId, name: 'R12', type: 'RADIUS', geomIds: [id.dome], value: 12 },
    { id: skId, name: 'R2L', type: 'RADIUS', geomIds: [id.f2L], value: 2 },
    { id: skId, name: 'R2R', type: 'RADIUS', geomIds: [id.f2R], value: 2 },
    { id: skId, name: 'R1L', type: 'RADIUS', geomIds: [id.f1L], value: 1 },
    { id: skId, name: 'R1R', type: 'RADIUS', geomIds: [id.f1R], value: 1 },
    { id: skId, name: 'RS_TR', type: 'RADIUS', geomIds: [id.slotTR], value: 1 },
    { id: skId, name: 'RS_TL', type: 'RADIUS', geomIds: [id.slotTL], value: 1 },
    { id: skId, name: 'RS_BL', type: 'RADIUS', geomIds: [id.slotBL], value: 1 },
    { id: skId, name: 'RS_BR', type: 'RADIUS', geomIds: [id.slotBR], value: 1 },
    { id: skId, name: 'HD6R', type: 'HORIZONTAL_DISTANCE', geomIds: [pts.clv.startId, pts.holeR.centerId], value: 6 },
    { id: skId, name: 'HD6L', type: 'HORIZONTAL_DISTANCE', geomIds: [pts.holeL.centerId, pts.clv.startId], value: 6 },
    // "8": eye center → jaw/bottom, anchored exactly as the drawing measures it
    { id: skId, name: 'VD8', type: 'VERTICAL_DISTANCE', geomIds: [pts.holeR.centerId, pts.bottom.startId], value: 8 },
    { id: skId, name: 'VD2', type: 'VERTICAL_DISTANCE', geomIds: [pts.slotBottom.startId, pts.bottom.startId], value: 2 },
    // "3": nose width across the slot top (point-to-point so the value renders like the drawing)
    { id: skId, name: 'W3', type: 'HORIZONTAL_DISTANCE', geomIds: [pts.slotLeft.startId, pts.slotRight.endId], value: 3 },
    { id: skId, name: 'HD35R', type: 'HORIZONTAL_DISTANCE', geomIds: [pts.clv.startId, pts.sideR.startId], value: 3.5 },
    { id: skId, name: 'HD35L', type: 'HORIZONTAL_DISTANCE', geomIds: [pts.sideL.endId, pts.clv.startId], value: 3.5 },
    // "3.5": slot bottom → slot center mark
    { id: skId, name: 'VD35', type: 'VERTICAL_DISTANCE', geomIds: [pts.slotBottom.startId, slotCenterId], value: 3.5 },
  ])
  const dimId = {}
  DIM_NAMES.forEach((n, i) => (dimId[n] = Array.isArray(rDim.result) ? rDim.result[i] : null))

  // place the drawing-critical dimension texts like the source drawing (post-creation API —
  // passing dimPos at CREATION poisons the batch: maxLevel 51, some dims returned VOID)
  const DIM_POS = { W3: [0, 3.2, 0], VD8: [9.3, -4, 0], VD2: [7.6, -7, 0], VD35: [2.9, -4.25, 0] }
  for (const [n, pos] of Object.entries(DIM_POS)) {
    if (dimId[n] != null) await api.v1.sketch.updateDimensionPosition({ id: dimId[n], pos })
  }

  return {
    partId, skId, id, pts, dimId, slotCenterId,
    maxLevels: { fix: rFix.maxLevel, rel: rRel.maxLevel, dim: rDim.maxLevel },
    relIds: rRel.result,
  }
}

/** Read solved positions of every profile element through its (stable) point ids. */
export async function readback(api, { id, pts }) {
  const pos = async pid => {
    const r = (await api.v1.sketch.getPositions({ id: pid })).result
    return r?.pos ? [r.pos.x, r.pos.y] : null
  }
  const out = {}
  for (const k of Object.keys(id)) {
    const p = pts[k]
    out[k] = {}
    if (p.startId) out[k].s = await pos(p.startId)
    if (p.endId) out[k].e = await pos(p.endId)
    if (p.centerId) out[k].c = await pos(p.centerId)
  }
  return out
}

/** Compare a readback against model targets. Lines: a/b vs s/e. Arcs: s/e/c + radius. Circles: c. */
export function compare(rb, M, keys, tol = 1e-6) {
  const rows = []
  let maxErr = 0
  const chk = (key, what, got, want) => {
    if (!got) { rows.push({ key, what, got: null, want, err: Infinity }); maxErr = Infinity; return }
    const err = Math.hypot(got[0] - want[0], got[1] - want[1])
    maxErr = Math.max(maxErr, err)
    rows.push({ key, what, got: got.map(v => +v.toFixed(7)), want: want.map(v => +v.toFixed(7)), err: +err.toExponential(2) })
  }
  for (const k of keys) {
    const g = M[k], r = rb[k]
    if (g.r !== undefined) { // circle
      chk(k, 'center', r.c, g.c)
    } else if (g.c) { // arc
      chk(k, 'start', r.s, g.s); chk(k, 'end', r.e, g.e); chk(k, 'center', r.c, g.c)
      if (r.s && r.c) {
        const rGot = Math.hypot(r.s[0] - r.c[0], r.s[1] - r.c[1])
        const rWant = Math.hypot(g.s[0] - g.c[0], g.s[1] - g.c[1])
        const err = Math.abs(rGot - rWant)
        maxErr = Math.max(maxErr, err)
        rows.push({ key: k, what: 'radius', got: +rGot.toFixed(7), want: +rWant.toFixed(7), err: +err.toExponential(2) })
      }
    } else { // line
      chk(k, 'start', r.s, g.a); chk(k, 'end', r.e, g.b)
    }
  }
  return { rows, maxErr, pass: maxErr <= tol }
}
