/**
 * _sketchB.mjs — variant B: the ANSI tooth-space as a TRUE parametric sketch.
 * The whole derivation chain lives in the part's expression set (mm/radians);
 * every driving dimension is @expr-bound (live). Geometry is seeded ROUGH
 * (perturbed) — the solver must pull it onto the exact ANSI layout.
 *
 * Scheme (no SYMMETRY, both sides pinned by the SAME expressions — unsigned
 * HD/VD dims measure mirror-symmetrically; branches picked by seeds):
 *   root seating arc: center on axis construction line, VD ptO→a = Rp, R = Rseat
 *   working arcs: TANGENT to root (exact per ANSI), RADIUS = Ework, HD(a,c) = Mc
 *   y junctions: HD(a,y) = yH  (yH = E·cos(A−B) − 0.8·Dr·cos(A), sign-robust)
 *   topping arcs: center HD/VD (a,b) = Wb/Vb, radius FREE (emergent F_eff —
 *     the published F is ~1.4% inconsistent with tangency, see GROUNDWORK)
 *   PL/PR on construction blank-OD circle (DIAMETER = blankOD)
 *   radial closing lines through ptO, cap arc RADIUS = Rcap
 */
import { toothForm, inch } from './_model.mjs'

export const EXPRESSIONS = [
  { name: 'teeth', value: 21 },
  { name: 'pitchIn', value: 0.375 },
  { name: 'DrIn', value: 0.2 },
  { name: 'inchF', value: 25.4 },
  { name: 'P', value: 'pitchIn*inchF' },
  { name: 'Dr', value: 'DrIn*inchF' },
  { name: 'pAng', value: 'C:PI/teeth' },
  { name: 'Rp', value: 'P/(2*sin(pAng))' },
  { name: 'Rseat', value: '0.5025*Dr+0.0015*inchF' },
  { name: 'Aang', value: '(35+60/teeth)*C:PI/180' },
  { name: 'Bang', value: '(18-56/teeth)*C:PI/180' },
  { name: 'Ework', value: '1.3025*Dr+0.0015*inchF' },
  { name: 'Mc', value: '0.8*Dr*cos(Aang)' },
  { name: 'yH', value: 'Ework*cos(Aang-Bang)-0.8*Dr*cos(Aang)' },
  { name: 'Wb', value: '1.4*Dr*cos(pAng)' },
  { name: 'Vb', value: '1.4*Dr*sin(pAng)' },
  { name: 'blankOD', value: 'P/sin(pAng)+P/2' },
  { name: 'RcapE', value: 'blankOD/2+0.3*P' },
]

/** Analytic reference (mm) for a given tooth count — same math as the generator. */
export function analytic(N) {
  const P = 0.375, Dr = 0.2
  const tf = toothForm({ P, Dr, N, blankOD: P / Math.sin(Math.PI / N) + P / 2 })
  const mm = (pt) => [pt[0] * inch, pt[1] * inch]
  return { tf, mm }
}

/**
 * Build the constrained tooth-space sketch on `planeId`. Seeds = analytic(seedN)
 * PERTURBED. Returns handles { skId, ids, dims, junctions } for verification.
 */
export async function buildParametricToothSketch(api, partId, planeId, { seedN = 21, perturb = true } = {}) {
  const { tf } = analytic(seedN)
  const mm = (v) => v * inch
  // perturbation: shift centers, scale radii — rough but valid arc seeds
  const dC = perturb ? [0.4, -0.3] : [0, 0]
  const dR = perturb ? 1.03 : 1.0

  const skId = (await api.v1.sketch.create({ id: partId, planeId, name: 'ToothSpaceParam' })).result

  // seed helper: arc from (possibly perturbed) center/radius and the ORIGINAL
  // endpoint directions (unit vectors from true center) — keeps seeds valid
  const seedArc = (e) => {
    const c = [mm(e.center[0]) + dC[0], mm(e.center[1]) + dC[1]]
    const r = Math.hypot(mm(e.start[0]) - mm(e.center[0]), mm(e.start[1]) - mm(e.center[1])) * dR
    const u0 = Math.atan2(e.start[1] - e.center[1], e.start[0] - e.center[0])
    const u1 = Math.atan2(e.end[1] - e.center[1], e.end[0] - e.center[0])
    return {
      startPos: [c[0] + r * Math.cos(u0), c[1] + r * Math.sin(u0), 0],
      endPos: [c[0] + r * Math.cos(u1), c[1] + r * Math.sin(u1), 0],
      centerPos: [c[0], c[1], 0],
      isClockwise: e.cw,
    }
  }
  const E = Object.fromEntries(tf.entities.map((e) => [e.tag, e]))

  // construction skeleton
  const ptO = (await api.v1.sketch.point({ id: skId, pos: [0, 0, 0] })).result
  const axisCL = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [0.3, mm(tf.Rp) + 1, 0], isConstruction: true,
  })).result
  const blankC = (await api.v1.sketch.circle({
    id: skId, centerPos: [dC[0] * 0.5, dC[1] * 0.5, 0], radius: mm(tf.Ro) * dR, isConstruction: true,
  })).result

  // profile arcs/lines (rough seeds, autos OFF — fully explicit wiring)
  const g = await api.v1.sketch.geometry({
    id: skId,
    arcsByCenter: [seedArc(E.workL), seedArc(E.topL), seedArc(E.cap), seedArc(E.topR), seedArc(E.workR), seedArc(E.root)],
    lines: [
      { startPos: seedArc(E.topL).endPos, endPos: seedArc(E.cap).startPos },
      { startPos: seedArc(E.cap).endPos, endPos: seedArc(E.topR).startPos },
    ],
    genFixation: false, genIncidence: false, genTangency: false, genVertAndHoriz: false,
  })
  const [workL, topL, cap, topR, workR, root] = g.result.arcsByCenter
  const [outL, outR] = g.result.lines
  const ids = { ptO, axisCL, blankC, workL, topL, cap, topR, workR, root, outL, outR }

  // child points
  const pt = async (id) => (await api.v1.sketch.getPoints({ id })).result
  const pWorkL = await pt(workL), pTopL = await pt(topL), pCap = await pt(cap)
  const pTopR = await pt(topR), pWorkR = await pt(workR), pRoot = await pt(root)
  const pOutL = await pt(outL), pOutR = await pt(outR)
  const pBlank = await pt(blankC)

  // constraints: anchor → connect → relate
  const cons = [
    { id: skId, name: 'FixO', type: 'FIXATION', geomIds: [ptO] },
    { id: skId, name: 'AxisOnO', type: 'COINCIDENT', geomIds: [ptO, axisCL] },
    { id: skId, name: 'AxisV', type: 'VERTICAL', geomIds: [axisCL] },
    { id: skId, name: 'BlankCtr', type: 'COINCIDENT', geomIds: [pBlank.centerId, ptO] },
    { id: skId, name: 'RootOnAxis', type: 'COINCIDENT', geomIds: [pRoot.centerId, axisCL] },
    // profile chain (root: xR→xL, workL: xL→yL, topL: yL→PL, outL: PL→QL,
    // cap: QL→QR, outR: QR→PR, topR: PR→yR, workR: yR→xR)
    { id: skId, name: 'JxL', type: 'COINCIDENT', geomIds: [pRoot.endId, pWorkL.startId] },
    { id: skId, name: 'JyL', type: 'COINCIDENT', geomIds: [pWorkL.endId, pTopL.startId] },
    { id: skId, name: 'JpL', type: 'COINCIDENT', geomIds: [pTopL.endId, pOutL.startId] },
    { id: skId, name: 'JqL', type: 'COINCIDENT', geomIds: [pOutL.endId, pCap.startId] },
    { id: skId, name: 'JqR', type: 'COINCIDENT', geomIds: [pCap.endId, pOutR.startId] },
    { id: skId, name: 'JpR', type: 'COINCIDENT', geomIds: [pOutR.endId, pTopR.startId] },
    { id: skId, name: 'JyR', type: 'COINCIDENT', geomIds: [pTopR.endId, pWorkR.startId] },
    { id: skId, name: 'JxR', type: 'COINCIDENT', geomIds: [pWorkR.endId, pRoot.startId] },
    // ANSI relations
    { id: skId, name: 'TanL', type: 'TANGENT', geomIds: [root, workL] },
    { id: skId, name: 'TanR', type: 'TANGENT', geomIds: [root, workR] },
    { id: skId, name: 'RadialL', type: 'COINCIDENT', geomIds: [ptO, outL] },
    { id: skId, name: 'RadialR', type: 'COINCIDENT', geomIds: [ptO, outR] },
    { id: skId, name: 'PLonOD', type: 'COINCIDENT', geomIds: [pTopL.endId, blankC] },
    { id: skId, name: 'PRonOD', type: 'COINCIDENT', geomIds: [pTopR.startId, blankC] },
  ]
  const cR = await api.v1.sketch.constraint(cons)
  if (cR.maxLevel > 31) return { skId, ids, error: { stage: 'constraints', messages: cR.messages } }

  // dimensions — every driving value is a LIVE @expr binding
  const dimDefs = [
    { name: 'dRp', type: 'VERTICAL_DISTANCE', geomIds: [ptO, pRoot.centerId], value: '@expr.Rp' },
    { name: 'dAxisLen', type: 'OFFSET', geomIds: [axisCL], value: '@expr.Rp' },
    { name: 'dRseat', type: 'RADIUS', geomIds: [root], value: '@expr.Rseat' },
    { name: 'dEL', type: 'RADIUS', geomIds: [workL], value: '@expr.Ework' },
    { name: 'dER', type: 'RADIUS', geomIds: [workR], value: '@expr.Ework' },
    { name: 'dMcL', type: 'HORIZONTAL_DISTANCE', geomIds: [pRoot.centerId, pWorkL.centerId], value: '@expr.Mc' },
    { name: 'dMcR', type: 'HORIZONTAL_DISTANCE', geomIds: [pRoot.centerId, pWorkR.centerId], value: '@expr.Mc' },
    { name: 'dyHL', type: 'HORIZONTAL_DISTANCE', geomIds: [pRoot.centerId, pWorkL.endId], value: '@expr.yH' },
    { name: 'dyHR', type: 'HORIZONTAL_DISTANCE', geomIds: [pRoot.centerId, pWorkR.startId], value: '@expr.yH' },
    { name: 'dWbL', type: 'HORIZONTAL_DISTANCE', geomIds: [pRoot.centerId, pTopL.centerId], value: '@expr.Wb' },
    { name: 'dVbL', type: 'VERTICAL_DISTANCE', geomIds: [pRoot.centerId, pTopL.centerId], value: '@expr.Vb' },
    { name: 'dWbR', type: 'HORIZONTAL_DISTANCE', geomIds: [pRoot.centerId, pTopR.centerId], value: '@expr.Wb' },
    { name: 'dVbR', type: 'VERTICAL_DISTANCE', geomIds: [pRoot.centerId, pTopR.centerId], value: '@expr.Vb' },
    { name: 'dOD', type: 'DIAMETER', geomIds: [blankC], value: '@expr.blankOD' },
    { name: 'dRcap', type: 'RADIUS', geomIds: [cap], value: '@expr.RcapE' },
  ]
  const dR2 = await api.v1.sketch.dimension(dimDefs.map((d) => ({ id: skId, ...d })))
  const dims = Object.fromEntries(dimDefs.map((d, i) => [d.name, dR2.result?.[i]]))
  if (dR2.maxLevel > 31) return { skId, ids, dims, error: { stage: 'dimensions', messages: dR2.messages } }

  const junctions = {
    a: pRoot.centerId, xL: pWorkL.startId, yL: pWorkL.endId, PL: pTopL.endId,
    QL: pCap.startId, QR: pCap.endId, PR: pTopR.startId, yR: pTopR.endId,
    xR: pWorkR.endId, cL: pWorkL.centerId, cR2: pWorkR.centerId,
    bL: pTopL.centerId, bR: pTopR.centerId,
  }
  return { skId, ids, dims, junctions, profileRefs: [workL, topL, outL, cap, outR, topR, workR, root] }
}

/** Read solved junction positions and compare to analytic(N). Returns report. */
export async function verifyAgainstAnalytic(api, junctions, N, label) {
  const { tf } = analytic(N)
  const exp = {
    a: tf.a, xL: tf.x, yL: tf.y, PL: tf.end,
    QL: tf.Q, QR: [-tf.Q[0], tf.Q[1]], PR: [-tf.end[0], tf.end[1]],
    yR: [-tf.y[0], tf.y[1]], xR: [-tf.x[0], tf.x[1]],
    cL: tf.c, cR2: [-tf.c[0], tf.c[1]], bL: tf.b, bR: [-tf.b[0], tf.b[1]],
  }
  let worst = 0
  const detail = {}
  for (const [k, ptId] of Object.entries(junctions)) {
    const p = (await api.v1.sketch.getPositions({ id: ptId })).result?.pos
    if (!p) { detail[k] = 'NO POS'; worst = Infinity; continue }
    // getPositions returns WORLD coords (discovered here — on the Right plane
    // local (lx,ly) → world (0,−ly,lx); Top-plane training never saw the diff)
    const lx = p.z, ly = -p.y
    const e = exp[k]
    const err = Math.hypot(lx - e[0] * inch, ly - e[1] * inch)
    detail[k] = +(err).toFixed(9)
    worst = Math.max(worst, err)
  }
  console.log(`[verify ${label}] worst junction error: ${worst.toExponential(3)} mm`, JSON.stringify(detail))
  return { worst, detail }
}
