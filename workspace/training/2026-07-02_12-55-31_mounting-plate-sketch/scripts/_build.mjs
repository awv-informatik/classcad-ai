// Shared builder for the mounting-plate sketch. Chain method per SKETCHING.md: rough seeds
// with bit-exact shared junctions (Auto_Coinc wires them), explicit TANGENT + endpoint-ON-
// circle at every full-circle junction, datum = fixed construction centerlines, and the
// drawing's 12 annotations as dimension entities (one driving dim per annotation, "2×"-style
// twins via EQUAL_RADIUS). Bolt holes: one dimensioned Ø6 hole + circularPattern ("6 отв.").
import {
  model, ROUGH, LINE_KEYS, ARC_KEYS, CIRCLE_KEYS, CONSTR_LINE_KEYS, CONSTR_CIRCLE_KEYS,
} from './_model.mjs'

const P3 = p => [p[0], p[1], 0]

export const DIM_NAMES = ['D60', 'D22', 'D42', 'D6', 'R100', 'R98', 'W6', 'R3', 'R3L', 'R33', 'D40', 'D20']

export async function buildMountingPlate(api, { params = ROUGH, eqIndividual = false, gen = {}, eqCross = false } = {}) {
  const M = model(params)

  const partR = await api.v1.part.create({ name: 'MountingPlate' })
  const partId = partR.result
  const wp = Object.values(partR.structure.tree).find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  if (!wp) throw new Error('Top work plane not found')
  const skId = (await api.v1.sketch.create({ id: partId, planeId: wp.id, name: 'MountingPlate' })).result

  // --- geometry, one batch; gen* auto-constraints ON except fixation (we place the datum) ---
  const isConstr = k => CONSTR_LINE_KEYS.includes(k) || CONSTR_CIRCLE_KEYS.includes(k)
  const g = await api.v1.sketch.geometry({
    id: skId,
    genFixation: false,
    ...gen,
    lines: LINE_KEYS.map(k => ({ startPos: P3(M[k].a), endPos: P3(M[k].b), isConstruction: isConstr(k) })),
    arcsByCenter: ARC_KEYS.map(k => ({
      startPos: P3(M[k].s), endPos: P3(M[k].e), centerPos: P3(M[k].c), isClockwise: M[k].cw,
    })),
    circles: CIRCLE_KEYS.map(k => ({ centerPos: P3(M[k].c), radius: M[k].r, isConstruction: isConstr(k) })),
  })
  const id = {}
  LINE_KEYS.forEach((k, i) => (id[k] = g.result.lines[i]))
  ARC_KEYS.forEach((k, i) => (id[k] = g.result.arcsByCenter[i]))
  CIRCLE_KEYS.forEach((k, i) => (id[k] = g.result.circles[i]))
  if (Object.values(id).some(v => v == null)) throw new Error('geometry creation failed')

  const pts = {}
  for (const k of Object.keys(id)) pts[k] = (await api.v1.sketch.getPoints({ id: id[k] })).result

  // --- 1) datum: fix the centerline ENDPOINTS (FIXATION on a line doesn't lock length) ---
  const rFix = await api.v1.sketch.constraint(
    [pts.clv.startId, pts.clv.endId, pts.clh.startId, pts.clh.endId].map(p => ({
      id: skId, type: 'FIXATION', geomIds: [p],
    })))

  // --- 2) relations ---
  const T = (a, b) => ({ id: skId, type: 'TANGENT', geomIds: [id[a], id[b]] })
  const ON = (ptId, k) => ({ id: skId, type: 'COINCIDENT', geomIds: [ptId, id[k]] })
  const PP = (p1, p2) => ({ id: skId, type: 'COINCIDENT', geomIds: [p1, p2] })
  const CC = (a, b) => ({ id: skId, type: 'CONCENTRIC', geomIds: [id[a], id[b]] })
  const rRel = await api.v1.sketch.constraint([
    // hub stack concentric at the datum crossing
    ON(pts.hub.centerId, 'clv'), ON(pts.hub.centerId, 'clh'),
    CC('bore', 'hub'), CC('bc42', 'hub'), CC('r98', 'hub'),
    // 12-o'clock bolt hole on the bolt circle + vertical CL
    ON(pts.hole6.centerId, 'clv'), ON(pts.hole6.centerId, 'bc42'),
    // boss axes: hub center → boss centers (the drawn 30° diagonals)
    PP(pts.axisR.startId, pts.hub.centerId), PP(pts.axisR.endId, pts.bossR.centerId),
    PP(pts.axisL.startId, pts.hub.centerId), PP(pts.axisL.endId, pts.bossL.centerId),
    // boss placement: right on the R98 circle, left mirrored
    ON(pts.bossR.centerId, 'r98'),
    { id: skId, type: 'SYMMETRY', geomIds: [id.clv, pts.bossR.centerId, pts.bossL.centerId] },
    // boss holes + width gauges concentric with their bosses
    CC('holeR', 'bossR'), CC('holeL', 'bossL'), CC('gaugeR', 'bossR'), CC('gaugeL', 'bossL'),
    // R100 blends: tangent to hub + boss, endpoints ON the full circles
    T('blendR', 'hub'), T('blendR', 'bossR'), ON(pts.blendR.startId, 'hub'), ON(pts.blendR.endId, 'bossR'),
    T('blendL', 'hub'), T('blendL', 'bossL'), ON(pts.blendL.startId, 'bossL'), ON(pts.blendL.endId, 'hub'),
    // R33 notch: tangent to both bosses, endpoints ON them, center on the vertical CL
    T('notch', 'bossR'), T('notch', 'bossL'), ON(pts.notch.startId, 'bossR'), ON(pts.notch.endId, 'bossL'),
    ON(pts.notch.centerId, 'clv'),
    // arms: edge tangent to hub (endpoint ON hub = smooth junction) + tangent to width gauge;
    // R3 fillet: tangent to edge (shared endpoint) + tangent to boss (endpoint ON boss)
    ...['RO', 'RI', 'LO', 'LI'].flatMap(s => {
      const e = `edge${s}`, f = `f3${s}`, boss = s[0] === 'R' ? 'bossR' : 'bossL', gauge = s[0] === 'R' ? 'gaugeR' : 'gaugeL'
      return [
        T(e, 'hub'), ON(pts[e].startId, 'hub'), T(e, gauge),
        PP(pts[e].endId, pts[f].startId), T(e, f),
        T(f, boss), ON(pts[f].endId, boss),
      ]
    }),
  ])

  // --- 3) "2×"-style twins: one driving dim + EQUAL_RADIUS (see MEMORY: updateDimension trap) ---
  const eqParams = [
    { id: skId, type: 'EQUAL_RADIUS', geomIds: [id.bossR, id.bossL] },
    { id: skId, type: 'EQUAL_RADIUS', geomIds: [id.holeR, id.holeL] },
    { id: skId, type: 'EQUAL_RADIUS', geomIds: [id.blendR, id.blendL] },
    { id: skId, type: 'EQUAL_RADIUS', geomIds: [id.gaugeL, id.gaugeR] },
    // fillet equalities: eqCross=true ties all four fillets to f3RO (one R3 dim, the
    // drawing-faithful encoding — verified fine in 06/10; the 04 cross-side failure was the
    // left-fillet mis-wiring confounder). Default keeps the same-side + twin-dim variant
    // used while diagnosing.
    ...(eqCross
      ? [
          { id: skId, type: 'EQUAL_RADIUS', geomIds: [id.f3RI, id.f3RO] },
          { id: skId, type: 'EQUAL_RADIUS', geomIds: [id.f3LO, id.f3RO] },
          { id: skId, type: 'EQUAL_RADIUS', geomIds: [id.f3LI, id.f3RO] },
        ]
      : [
          { id: skId, type: 'EQUAL_RADIUS', geomIds: [id.f3RI, id.f3RO] },
          { id: skId, type: 'EQUAL_RADIUS', geomIds: [id.f3LI, id.f3LO] },
        ]),
  ]
  let rEq
  if (eqIndividual) {
    const levels = []
    for (const p of eqParams) {
      const r = await api.v1.sketch.constraint(p)
      levels.push(r.maxLevel)
      if (r.maxLevel >= 51) console.log('   [eq] FAILED:', JSON.stringify(p.geomIds), r.messages?.find(m => m.level >= 51)?.message?.slice(0, 90))
    }
    rEq = { maxLevel: Math.max(...levels), messages: [{ level: 0, message: `individual eq levels: ${levels}` }] }
  } else {
    rEq = await api.v1.sketch.constraint(eqParams)
  }

  // --- 4) dimensions: the drawing's annotations drive the layout (order = DIM_NAMES) ---
  const dimParams = [
    { id: skId, name: 'D60', type: 'DIAMETER', geomIds: [id.hub], value: 60 },
    { id: skId, name: 'D22', type: 'DIAMETER', geomIds: [id.bore], value: 22 },
    { id: skId, name: 'D42', type: 'DIAMETER', geomIds: [id.bc42], value: 42 },
    { id: skId, name: 'D6', type: 'DIAMETER', geomIds: [id.hole6], value: 6 },
    { id: skId, name: 'R100', type: 'RADIUS', geomIds: [id.blendL], value: 100 }, // drawing dims the LEFT blend
    { id: skId, name: 'R98', type: 'RADIUS', geomIds: [id.r98], value: 98 },
    { id: skId, name: 'W6', type: 'DIAMETER', geomIds: [id.gaugeR], value: 6 }, // arm width "6"
    { id: skId, name: 'R3', type: 'RADIUS', geomIds: [id.f3RO], value: 3 },
    ...(eqCross ? [] : [{ id: skId, name: 'R3L', type: 'RADIUS', geomIds: [id.f3LO], value: 3 }]), // twin
    { id: skId, name: 'R33', type: 'RADIUS', geomIds: [id.notch], value: 33 },
    { id: skId, name: 'D40', type: 'DIAMETER', geomIds: [id.bossL], value: 40 },
    { id: skId, name: 'D20', type: 'DIAMETER', geomIds: [id.holeL], value: 20 },
  ]
  const rDim = await api.v1.sketch.dimension(dimParams)
  const dimId = {}
  dimParams.forEach((p, i) => (dimId[p.name] = Array.isArray(rDim.result) ? rDim.result[i] : null))

  // --- 5) the 30°: ANGLE between vertical CL and the right boss axis. Separate call —
  // dimPos here is the documented ANGLE sector selector (mid-direction of the wanted sector).
  const aAxis = Math.atan2(M.B[1], M.B[0])
  const mid = (aAxis + -Math.PI / 2) / 2
  const rAng = await api.v1.sketch.dimension({
    id: skId, name: 'A30', type: 'ANGLE', geomIds: [id.clv, id.axisR], value: '30deg',
    dimPos: [60 * Math.cos(mid), 60 * Math.sin(mid), 0],
  })
  dimId.A30 = rAng.result

  return {
    partId, skId, id, pts, dimId,
    maxLevels: { fix: rFix.maxLevel, rel: rRel.maxLevel, eq: rEq.maxLevel, dim: rDim.maxLevel, ang: rAng.maxLevel },
    msgs: { fix: rFix.messages, rel: rRel.messages, eq: rEq.messages, dim: rDim.messages, ang: rAng.messages },
    structure: rAng.structure,
  }
}

/** "6 отв.": pattern the dimensioned hole 6× about the hub center. Call AFTER the solve. */
export async function patternBoltHoles(api, { skId, id, pts }) {
  const before = (await api.v1.sketch.getGeometry({ id: skId })).result.circles
  const r = await api.v1.sketch.circularPattern({
    id: skId, rigidSetId: id.hole6, centerId: pts.hub.centerId, angle: Math.PI / 3, count: 6,
  })
  const after = (await api.v1.sketch.getGeometry({ id: skId })).result.circles
  const copies = after.filter(c => !before.includes(c))
  return { maxLevel: r.maxLevel, pattern: r.result, copies }
}

/** Read solved positions of every element through its (stable) point ids. */
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
    if (g.r !== undefined) {
      chk(k, 'center', r.c, g.c)
    } else if (g.c) {
      chk(k, 'start', r.s, g.s); chk(k, 'end', r.e, g.e); chk(k, 'center', r.c, g.c)
      if (r.s && r.c) {
        const rGot = Math.hypot(r.s[0] - r.c[0], r.s[1] - r.c[1])
        const rWant = Math.hypot(g.s[0] - g.c[0], g.s[1] - g.c[1])
        const err = Math.abs(rGot - rWant)
        maxErr = Math.max(maxErr, err)
        rows.push({ key: k, what: 'radius', got: +rGot.toFixed(7), want: +rWant.toFixed(7), err: +err.toExponential(2) })
      }
    } else {
      chk(k, 'start', r.s, g.a); chk(k, 'end', r.e, g.b)
    }
  }
  return { rows, maxErr, pass: maxErr <= tol }
}
