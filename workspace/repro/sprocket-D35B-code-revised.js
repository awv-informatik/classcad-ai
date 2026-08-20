// ═══════════════════════════════════════════════════════════════════
// D35B13SS — double-strand ANSI #35 sprocket, 13T, fully parametric
// Axis = X. Blank & tapers sketched on Top (local x = axial X,
// y = radial). Tooth cutter & bore/keyway on Right (local x→+Z,
// y→−Y, normal +X). Set screw on Top (radial = +Z, type UP).
// ═══════════════════════════════════════════════════════════════════
const t = await api.tree()
const nodes = Object.values(t)
const partId = nodes.find((n) => n.class === 'CC_Part').id
const topPl = nodes.find((n) => n.class === 'CC_WorkPlane' && n.name === 'Top').id
const rightPl = nodes.find((n) => n.class === 'CC_WorkPlane' && n.name === 'Right').id
const xAxis = nodes.find((n) => n.class === 'CC_WorkAxis' && n.name === 'XAxis').id

// ── 1. Expression graph ─────────────────────────────────────────────
await api.v1.part.expression({
  id: partId,
  toCreate: [
    // base (catalog, inches)
    { name: 'inchF', value: 25.4 },
    { name: 'teeth', value: 13 },
    { name: 'Pin', value: 0.375 },
    { name: 'Drin', value: 0.2 },
    { name: 't2in', value: 0.162 },
    { name: 'Kin', value: 0.399 },
    { name: 'boreIn', value: 0.625 },
    { name: 'hubProjIn', value: 0.5 },
    { name: 'hubDiaIn', value: 1.109375 },
    { name: 'reliefDiaIn', value: 1.109375 },
    { name: 'kwWin', value: 0.1875 },
    { name: 'kwDin', value: 0.09375 },
    { name: 'screwDin', value: 0.25 },
    { name: 'chamfIn', value: 0.03 },
    // derived (ASME B29.1 Type II tooth form + body)
    { name: 'pAng', value: 'C:PI/teeth' },
    { name: 'toothAngle', value: '2*C:PI/teeth' },
    { name: 'RpIn', value: 'Pin/(2*sin(pAng))' },
    { name: 'RseatIn', value: '0.5025*Drin+0.0015' },
    { name: 'Adeg', value: '35+60/teeth' },
    { name: 'Bdeg', value: '18-56/teeth' },
    { name: 'Arad', value: 'Adeg*C:PI/180' },
    { name: 'Brad', value: 'Bdeg*C:PI/180' },
    { name: 'MIn', value: '0.8*Drin*cos(Arad)' },
    { name: 'TIn', value: '0.8*Drin*sin(Arad)' },
    { name: 'EIn', value: '1.3025*Drin+0.0015' },
    { name: 'WIn', value: '1.4*Drin*cos(pAng)' },
    { name: 'VIn', value: '1.4*Drin*sin(pAng)' },
    { name: 'blankODIn', value: '2*RpIn+Pin/2' },
    { name: 'RcapIn', value: 'blankODIn/2+0.3*Pin' },
    { name: 'rootRIn', value: 'RpIn-Drin/2' },
    { name: 'gapIn', value: 'Kin-t2in' },
    { name: 'LTBin', value: '2*t2in+gapIn+hubProjIn' },
    { name: 'taperR0In', value: 'blankODIn/2-Pin/2' },
    { name: 'taperR1In', value: 'blankODIn/2+0.1' },
    { name: 'taperDzIn', value: '(taperR1In-taperR0In)/4' },
    { name: 'screwVin', value: '2*t2in+gapIn+hubProjIn/2' },
    // mm projections (each inch value × inchF exactly once)
    { name: 'RpMm', value: 'RpIn*inchF' },
    { name: 'RseatMm', value: 'RseatIn*inchF' },
    { name: 'Emm', value: 'EIn*inchF' },
    { name: 'Mmm', value: 'MIn*inchF' },
    { name: 'Tmm', value: 'TIn*inchF' },
    { name: 'Wmm', value: 'WIn*inchF' },
    { name: 'Vmm', value: 'VIn*inchF' },
    { name: 'capXmm', value: 'RcapIn*inchF*sin(pAng)' },
    { name: 'capYmm', value: 'RcapIn*inchF*cos(pAng)' },
    { name: 'rBlankMm', value: 'blankODIn/2*inchF' },
    { name: 'rReliefMm', value: 'reliefDiaIn/2*inchF' },
    { name: 'rHubMm', value: 'hubDiaIn/2*inchF' },
    { name: 't2Mm', value: 't2in*inchF' },
    { name: 'x2Mm', value: '(t2in+gapIn)*inchF' },
    { name: 'x3Mm', value: '(2*t2in+gapIn)*inchF' },
    { name: 'LTBmm', value: 'LTBin*inchF' },
    { name: 'cutExtMm', value: '2*LTBin*inchF' },
    { name: 'boreMm', value: 'boreIn*inchF' },
    { name: 'kwYtopMm', value: '(boreIn/2+kwDin)*inchF' },
    { name: 'kwYbotMm', value: 'boreIn/2*inchF-2' },
    { name: 'kwHalfWMm', value: 'kwWin/2*inchF' },
    { name: 'screwDMm', value: 'screwDin*inchF' },
    { name: 'screwVMm', value: 'screwVin*inchF' },
    { name: 'screwLenMm', value: 'hubDiaIn/2*inchF+2' },
    { name: 'chamfMm', value: 'chamfIn*inchF' },
    { name: 'taperR0Mm', value: 'taperR0In*inchF' },
    { name: 'taperR1Mm', value: 'taperR1In*inchF' },
    { name: 'taperDzMm', value: 'taperDzIn*inchF' },
    // tool-margin helpers
    { name: 'mrgMm', value: 1 },
    { name: 'tpA1', value: 'mrgMm' },
    { name: 'tpA2', value: 't2in*inchF+mrgMm' },
    { name: 'tpA3', value: '(t2in+gapIn)*inchF-mrgMm' },
    { name: 'tpA4', value: '(2*t2in+gapIn)*inchF+mrgMm' },
    { name: 'cutLim1', value: -2 },
    { name: 'boreLim2', value: 'LTBin*inchF+2' },
  ],
})

// ── JS mirror of the graph — SEED coordinates only (solver refines) ─
const IN = 25.4,
  N = 13,
  P = 0.375,
  Dr = 0.2
const t2 = 0.162 * IN,
  gap = (0.399 - 0.162) * IN,
  hub = 0.5 * IN
const x2 = t2 + gap,
  x3 = 2 * t2 + gap,
  LTB = x3 + hub
const pA = Math.PI / N
const Rp = (P / (2 * Math.sin(pA))) * IN
const rB = Rp + (P / 4) * IN,
  rRel = (1.109375 / 2) * IN,
  rHub = rRel
const Rseat = (0.5025 * Dr + 0.0015) * IN
const E = (1.3025 * Dr + 0.0015) * IN
const A = ((35 + 60 / N) * Math.PI) / 180
const M = 0.8 * Dr * Math.cos(A) * IN,
  T = 0.8 * Dr * Math.sin(A) * IN
const W = 1.4 * Dr * Math.cos(pA) * IN,
  V = 1.4 * Dr * Math.sin(pA) * IN
const Rcap = (P / (2 * Math.sin(pA)) + P / 4 + 0.3 * P) * IN
const a = [0, Rp]
const cR = [M, Rp + T],
  cL = [-M, Rp + T] // working-arc centers
const jR = [Rseat * Math.cos(A), Rp - Rseat * Math.sin(A)],
  jL = [-jR[0], jR[1]]
const bR = [W, Rp - V],
  bL = [-W, Rp - V] // topping-arc centers
const dcb = [bR[0] - cL[0], bR[1] - cL[1]],
  Lcb = Math.hypot(dcb[0], dcb[1])
const F = Lcb - E // emergent topping radius
const tR = [cL[0] + (E * dcb[0]) / Lcb, cL[1] + (E * dcb[1]) / Lcb],
  tL = [-tR[0], tR[1]]
const d = [Math.sin(pA), Math.cos(pA)]
const Bq = -2 * (d[0] * bR[0] + d[1] * bR[1]),
  Cq = bR[0] ** 2 + bR[1] ** 2 - F * F
const tRoot = (-Bq + Math.sqrt(Bq * Bq - 4 * Cq)) / 2
const eR = [tRoot * d[0], tRoot * d[1]],
  eL = [-eR[0], eR[1]]
const capR = [Rcap * d[0], Rcap * d[1]],
  capL = [-capR[0], capR[1]]

const off = { genFixation: false, genIncidence: false, genVertAndHoriz: false, genTangency: false }
const gp = async (id) => (await api.v1.sketch.getPoints({ id })).result

// ── 2. Blank as constrained revolve section (Top plane) ─────────────
const bsk1 = (await api.v1.sketch.create({ id: partId, planeId: topPl, name: 'BlankSection' })).result
const pts = [
  [0, 0],
  [0, rB],
  [t2, rB],
  [t2, rRel],
  [x2, rRel],
  [x2, rB],
  [x3, rB],
  [x3, rHub],
  [LTB, rHub],
  [LTB, 0],
]
const L = (await api.v1.sketch.line(pts.map((p, i) => ({ id: bsk1, startPos: [p[0], p[1], 0], endPos: [...pts[(i + 1) % 10], 0] })))).result
const p0 = await gp(L[0]),
  p2 = await gp(L[2]),
  p4 = await gp(L[4]),
  p6 = await gp(L[6]),
  p8 = await gp(L[8])
const anchor = p0.startId // auto-fixed at origin
await api.v1.sketch.dimension([
  { id: bsk1, name: 'd_rB1', type: 'VERTICAL_DISTANCE', geomIds: [anchor, p0.endId], value: '@expr.rBlankMm' },
  { id: bsk1, name: 'd_t2', type: 'HORIZONTAL_DISTANCE', geomIds: [anchor, p2.startId], value: '@expr.t2Mm' },
  { id: bsk1, name: 'd_rRel', type: 'VERTICAL_DISTANCE', geomIds: [anchor, p2.endId], value: '@expr.rReliefMm' },
  { id: bsk1, name: 'd_x2', type: 'HORIZONTAL_DISTANCE', geomIds: [anchor, p4.startId], value: '@expr.x2Mm' },
  { id: bsk1, name: 'd_rB2', type: 'VERTICAL_DISTANCE', geomIds: [anchor, p4.endId], value: '@expr.rBlankMm' },
  { id: bsk1, name: 'd_x3', type: 'HORIZONTAL_DISTANCE', geomIds: [anchor, p6.startId], value: '@expr.x3Mm' },
  { id: bsk1, name: 'd_rHub', type: 'VERTICAL_DISTANCE', geomIds: [anchor, p6.endId], value: '@expr.rHubMm' },
  { id: bsk1, name: 'd_LTB', type: 'HORIZONTAL_DISTANCE', geomIds: [anchor, p8.startId], value: '@expr.LTBmm' },
])
const blankRev = (await api.v1.part.revolve({ id: partId, name: 'Blank', references: L, axisIds: [xAxis] })).result

// ── 3. Tooth-space cutter — constrained ASME Type II profile ────────
const tsk = (await api.v1.sketch.create({ id: partId, planeId: rightPl, name: 'ToothSpace' })).result
// construction skeleton
const clId = (await api.v1.sketch.line({ id: tsk, startPos: [0, 0, 0], endPos: [0, Rcap + 3, 0], isConstruction: true, ...off })).result
const pitchId = (
  await api.v1.sketch.circle({ id: tsk, centerPos: [0, 0, 0], radius: Rp, isConstruction: true, genFixation: false, genIncidence: false })
).result
// profile: seat arc, 2 working arcs, 2 topping arcs, 2 radial cap lines, cap arc
const seat = (
  await api.v1.sketch.arcByCenter({
    id: tsk,
    startPos: [jR[0], jR[1], 0],
    endPos: [jL[0], jL[1], 0],
    centerPos: [a[0], a[1], 0],
    isClockwise: true,
    genFixation: false,
    genIncidence: false,
  })
).result
const workR = (
  await api.v1.sketch.arcByCenter({
    id: tsk,
    startPos: [jR[0], jR[1], 0],
    endPos: [tR[0], tR[1], 0],
    centerPos: [cL[0], cL[1], 0],
    isClockwise: false,
    genFixation: false,
    genIncidence: false,
  })
).result
const workL = (
  await api.v1.sketch.arcByCenter({
    id: tsk,
    startPos: [jL[0], jL[1], 0],
    endPos: [tL[0], tL[1], 0],
    centerPos: [cR[0], cR[1], 0],
    isClockwise: true,
    genFixation: false,
    genIncidence: false,
  })
).result
const topR = (
  await api.v1.sketch.arcByCenter({
    id: tsk,
    startPos: [tR[0], tR[1], 0],
    endPos: [eR[0], eR[1], 0],
    centerPos: [bR[0], bR[1], 0],
    isClockwise: true,
    genFixation: false,
    genIncidence: false,
  })
).result
const topL = (
  await api.v1.sketch.arcByCenter({
    id: tsk,
    startPos: [tL[0], tL[1], 0],
    endPos: [eL[0], eL[1], 0],
    centerPos: [bL[0], bL[1], 0],
    isClockwise: false,
    genFixation: false,
    genIncidence: false,
  })
).result
const capLnR = (await api.v1.sketch.line({ id: tsk, startPos: [eR[0], eR[1], 0], endPos: [capR[0], capR[1], 0], ...off })).result
const capLnL = (await api.v1.sketch.line({ id: tsk, startPos: [eL[0], eL[1], 0], endPos: [capL[0], capL[1], 0], ...off })).result
const capArc = (
  await api.v1.sketch.arcByCenter({
    id: tsk,
    startPos: [capR[0], capR[1], 0],
    endPos: [capL[0], capL[1], 0],
    centerPos: [0, 0, 0],
    isClockwise: false,
    genFixation: false,
    genIncidence: false,
  })
).result

const clP = await gp(clId),
  pitchP = await gp(pitchId),
  seatP = await gp(seat)
const wRP = await gp(workR),
  wLP = await gp(workL),
  tRP = await gp(topR),
  tLP = await gp(topL)
const cRLn = await gp(capLnR),
  cLLn = await gp(capLnL),
  capP = await gp(capArc)

await api.v1.sketch.constraint([
  { id: tsk, type: 'FIXATION', geomIds: [clP.startId] },
  { id: tsk, type: 'FIXATION', geomIds: [clP.endId] },
  { id: tsk, type: 'FIXATION', geomIds: [pitchP.centerId] },
])
await api.v1.sketch.constraint([
  { id: tsk, name: 'aOnPitch', type: 'COINCIDENT', geomIds: [seatP.centerId, pitchId] }, // seat center ON pitch circle
  { id: tsk, name: 'aOnCL', type: 'COINCIDENT', geomIds: [seatP.centerId, clId] }, // ... and ON centerline
  { id: tsk, name: 'jR', type: 'COINCIDENT', geomIds: [seatP.startId, wRP.startId] },
  { id: tsk, name: 'jL', type: 'COINCIDENT', geomIds: [seatP.endId, wLP.startId] },
  { id: tsk, name: 'tRj', type: 'COINCIDENT', geomIds: [wRP.endId, tRP.startId] },
  { id: tsk, name: 'tLj', type: 'COINCIDENT', geomIds: [wLP.endId, tLP.startId] },
  { id: tsk, name: 'eRj', type: 'COINCIDENT', geomIds: [tRP.endId, cRLn.startId] },
  { id: tsk, name: 'eLj', type: 'COINCIDENT', geomIds: [tLP.endId, cLLn.startId] },
  { id: tsk, name: 'capRj', type: 'COINCIDENT', geomIds: [cRLn.endId, capP.startId] },
  { id: tsk, name: 'capLj', type: 'COINCIDENT', geomIds: [cLLn.endId, capP.endId] },
  { id: tsk, name: 'capCtr', type: 'COINCIDENT', geomIds: [capP.centerId, clP.startId] },
  { id: tsk, name: 'radR', type: 'COINCIDENT', geomIds: [clP.startId, capLnR] }, // cap lines radial through origin
  { id: tsk, name: 'radL', type: 'COINCIDENT', geomIds: [clP.startId, capLnL] },
])
await api.v1.sketch.constraint([
  { id: tsk, name: 'tanSR', type: 'TANGENT', geomIds: [seat, workR] }, // seating↔working: TANGENT by construction
  { id: tsk, name: 'tanSL', type: 'TANGENT', geomIds: [seat, workL] },
  { id: tsk, name: 'tanWTR', type: 'TANGENT', geomIds: [workR, topR] }, // topping radius EMERGES from these
  { id: tsk, name: 'tanWTL', type: 'TANGENT', geomIds: [workL, topL] },
])
await api.v1.sketch.dimension([
  { id: tsk, name: 'dRp', type: 'RADIUS', geomIds: [pitchId], value: '@expr.RpMm' },
  { id: tsk, name: 'dRseat', type: 'RADIUS', geomIds: [seat], value: '@expr.RseatMm' },
  { id: tsk, name: 'dER', type: 'RADIUS', geomIds: [workR], value: '@expr.Emm' },
  { id: tsk, name: 'dEL', type: 'RADIUS', geomIds: [workL], value: '@expr.Emm' },
  { id: tsk, name: 'dMR', type: 'HORIZONTAL_DISTANCE', geomIds: [seatP.centerId, wRP.centerId], value: '@expr.Mmm' },
  { id: tsk, name: 'dTR', type: 'VERTICAL_DISTANCE', geomIds: [seatP.centerId, wRP.centerId], value: '@expr.Tmm' },
  { id: tsk, name: 'dML', type: 'HORIZONTAL_DISTANCE', geomIds: [seatP.centerId, wLP.centerId], value: '@expr.Mmm' },
  { id: tsk, name: 'dTL', type: 'VERTICAL_DISTANCE', geomIds: [seatP.centerId, wLP.centerId], value: '@expr.Tmm' },
  { id: tsk, name: 'dWR', type: 'HORIZONTAL_DISTANCE', geomIds: [seatP.centerId, tRP.centerId], value: '@expr.Wmm' },
  { id: tsk, name: 'dVR', type: 'VERTICAL_DISTANCE', geomIds: [seatP.centerId, tRP.centerId], value: '@expr.Vmm' },
  { id: tsk, name: 'dWL', type: 'HORIZONTAL_DISTANCE', geomIds: [seatP.centerId, tLP.centerId], value: '@expr.Wmm' },
  { id: tsk, name: 'dVL', type: 'VERTICAL_DISTANCE', geomIds: [seatP.centerId, tLP.centerId], value: '@expr.Vmm' },
  { id: tsk, name: 'dCapXR', type: 'HORIZONTAL_DISTANCE', geomIds: [clP.startId, cRLn.endId], value: '@expr.capXmm' },
  { id: tsk, name: 'dCapYR', type: 'VERTICAL_DISTANCE', geomIds: [clP.startId, cRLn.endId], value: '@expr.capYmm' },
  { id: tsk, name: 'dCapXL', type: 'HORIZONTAL_DISTANCE', geomIds: [clP.startId, cLLn.endId], value: '@expr.capXmm' },
  { id: tsk, name: 'dCapYL', type: 'VERTICAL_DISTANCE', geomIds: [clP.startId, cLLn.endId], value: '@expr.capYmm' },
])

// extrude through both plates + merged pattern (count/angle stay live)
const toothExt = (
  await api.v1.part.extrusion({
    id: partId,
    name: 'ToothCut',
    references: [seat, workR, workL, topR, topL, capLnR, capLnL, capArc],
    type: 'SYMMETRIC',
    limit2: '@expr.cutExtMm',
  })
).result
const pattern = (
  await api.v1.part.circularPattern({
    id: partId,
    name: 'ToothPattern',
    targets: [toothExt],
    references: [xAxis],
    count: '@expr.teeth',
    angle: '@expr.toothAngle',
    merged: 1,
  })
).result

// ── 4. Tip-taper revolve tool (4 constrained quads on Top plane) ────
const r0 = rB - (P / 2) * IN,
  r1 = rB + 0.1 * IN,
  dz = (r1 - r0) / 4,
  m = 1
const tpsk = (await api.v1.sketch.create({ id: partId, planeId: topPl, name: 'TipTapers' })).result
const tanchor = (await api.v1.sketch.point({ id: tpsk, pos: [0, 0, 0], genFixation: true, genIncidence: false })).result
await api.v1.sketch.constraint({ id: tpsk, type: 'FIXATION', geomIds: [tanchor] })
const faces = [
  [0, 1, 'tpA1', null],
  [t2, -1, 'tpA2', 't2Mm'],
  [x2, 1, 'tpA3', 'x2Mm'],
  [x3, -1, 'tpA4', 'x3Mm'],
]
const taperLines = []
for (let qi = 0; qi < 4; qi++) {
  const [f, s, exA, exB] = faces[qi]
  const Pa = [f - s * m, r0],
    Pb = [f, r0],
    Pc = [f + s * dz, r1],
    Pd = [f - s * m, r1]
  const ls = (
    await api.v1.sketch.line([
      { id: tpsk, startPos: [Pa[0], Pa[1], 0], endPos: [Pb[0], Pb[1], 0], ...off },
      { id: tpsk, startPos: [Pb[0], Pb[1], 0], endPos: [Pc[0], Pc[1], 0], ...off },
      { id: tpsk, startPos: [Pc[0], Pc[1], 0], endPos: [Pd[0], Pd[1], 0], ...off },
      { id: tpsk, startPos: [Pd[0], Pd[1], 0], endPos: [Pa[0], Pa[1], 0], ...off },
    ])
  ).result
  const [lb, lc, lt, ll] = ls
  const pb = await gp(lb),
    pc = await gp(lc),
    pt = await gp(lt),
    pl = await gp(ll)
  await api.v1.sketch.constraint([
    { id: tpsk, type: 'COINCIDENT', geomIds: [pb.endId, pc.startId] },
    { id: tpsk, type: 'COINCIDENT', geomIds: [pc.endId, pt.startId] },
    { id: tpsk, type: 'COINCIDENT', geomIds: [pt.endId, pl.startId] },
    { id: tpsk, type: 'COINCIDENT', geomIds: [pl.endId, pb.startId] },
    { id: tpsk, type: 'HORIZONTAL', geomIds: [lb] },
    { id: tpsk, type: 'HORIZONTAL', geomIds: [lt] },
    { id: tpsk, type: 'VERTICAL', geomIds: [ll] },
  ])
  const dims = [
    { id: tpsk, name: 'q' + qi + 'r0', type: 'VERTICAL_DISTANCE', geomIds: [tanchor, pb.startId], value: '@expr.taperR0Mm' },
    { id: tpsk, name: 'q' + qi + 'r1', type: 'VERTICAL_DISTANCE', geomIds: [tanchor, pt.startId], value: '@expr.taperR1Mm' },
    { id: tpsk, name: 'q' + qi + 'a', type: 'HORIZONTAL_DISTANCE', geomIds: [tanchor, pb.startId], value: '@expr.' + exA },
    { id: tpsk, name: 'q' + qi + 'dz', type: 'HORIZONTAL_DISTANCE', geomIds: [pb.endId, pc.endId], value: '@expr.taperDzMm' },
  ]
  if (exB) dims.push({ id: tpsk, name: 'q' + qi + 'b', type: 'HORIZONTAL_DISTANCE', geomIds: [tanchor, pb.endId], value: '@expr.' + exB })
  await api.v1.sketch.dimension(dims)
  if (!exB) await api.v1.sketch.constraint({ id: tpsk, type: 'VERTICAL', geomIds: [tanchor, pb.endId] }) // face at x=0
  taperLines.push(...ls)
}
const taperRev = (await api.v1.part.revolve({ id: partId, name: 'TaperTool', references: taperLines, axisIds: [xAxis] })).result

// ── 5. Bore + keyway (Right plane; local +z = world +X) ─────────────
const boreR = (0.625 / 2) * IN,
  kwHW = (0.1875 / 2) * IN,
  kwTop = boreR + 0.09375 * IN,
  kwBot = boreR - 2
const bksk = (await api.v1.sketch.create({ id: partId, planeId: rightPl, name: 'BoreKeyway' })).result
const banchor = (await api.v1.sketch.point({ id: bksk, pos: [0, 0, 0], genFixation: true, genIncidence: false })).result
await api.v1.sketch.constraint({ id: bksk, type: 'FIXATION', geomIds: [banchor] })
const boreC = (await api.v1.sketch.circle({ id: bksk, centerPos: [0, 0, 0], radius: boreR, genFixation: false, genIncidence: false }))
  .result
const boreCp = await gp(boreC)
await api.v1.sketch.constraint({ id: bksk, type: 'COINCIDENT', geomIds: [boreCp.centerId, banchor] })
await api.v1.sketch.dimension({ id: bksk, name: 'dBore', type: 'DIAMETER', geomIds: [boreC], value: '@expr.boreMm' })
const kls = (
  await api.v1.sketch.line([
    { id: bksk, startPos: [-kwHW, kwBot, 0], endPos: [kwHW, kwBot, 0], ...off },
    { id: bksk, startPos: [kwHW, kwBot, 0], endPos: [kwHW, kwTop, 0], ...off },
    { id: bksk, startPos: [kwHW, kwTop, 0], endPos: [-kwHW, kwTop, 0], ...off },
    { id: bksk, startPos: [-kwHW, kwTop, 0], endPos: [-kwHW, kwBot, 0], ...off },
  ])
).result
const [kb, kr, kt, kl] = kls
const kbp = await gp(kb),
  krp = await gp(kr),
  ktp = await gp(kt),
  klp = await gp(kl)
await api.v1.sketch.constraint([
  { id: bksk, type: 'COINCIDENT', geomIds: [kbp.endId, krp.startId] },
  { id: bksk, type: 'COINCIDENT', geomIds: [krp.endId, ktp.startId] },
  { id: bksk, type: 'COINCIDENT', geomIds: [ktp.endId, klp.startId] },
  { id: bksk, type: 'COINCIDENT', geomIds: [klp.endId, kbp.startId] },
  { id: bksk, type: 'HORIZONTAL', geomIds: [kb] },
  { id: bksk, type: 'HORIZONTAL', geomIds: [kt] },
  { id: bksk, type: 'VERTICAL', geomIds: [kr] },
  { id: bksk, type: 'VERTICAL', geomIds: [kl] },
])
await api.v1.sketch.dimension([
  { id: bksk, name: 'kwTop', type: 'VERTICAL_DISTANCE', geomIds: [banchor, ktp.startId], value: '@expr.kwYtopMm' },
  { id: bksk, name: 'kwBot', type: 'VERTICAL_DISTANCE', geomIds: [banchor, kbp.startId], value: '@expr.kwYbotMm' },
  { id: bksk, name: 'kwL', type: 'HORIZONTAL_DISTANCE', geomIds: [banchor, ktp.endId], value: '@expr.kwHalfWMm' },
  { id: bksk, name: 'kwR', type: 'HORIZONTAL_DISTANCE', geomIds: [banchor, ktp.startId], value: '@expr.kwHalfWMm' },
])
// NOTE: CUSTOM direction is SKETCH-LOCAL — [0,0,1] on the Right plane = world +X
const boreExt = (
  await api.v1.part.extrusion({
    id: partId,
    name: 'BoreTool',
    references: [boreC],
    type: 'CUSTOM',
    direction: [0, 0, 1],
    limit1: '@expr.cutLim1',
    limit2: '@expr.boreLim2',
  })
).result
const kwExt = (
  await api.v1.part.extrusion({
    id: partId,
    name: 'KeywayTool',
    references: kls,
    type: 'CUSTOM',
    direction: [0, 0, 1],
    limit1: '@expr.cutLim1',
    limit2: '@expr.boreLim2',
  })
).result

// ── 6. Set screw (Top plane, radial = +Z via type UP) ───────────────
const scrV = x3 + hub / 2,
  scrR = (0.25 / 2) * IN
const ssk = (await api.v1.sketch.create({ id: partId, planeId: topPl, name: 'SetScrew' })).result
const sanchor = (await api.v1.sketch.point({ id: ssk, pos: [0, 0, 0], genFixation: true, genIncidence: false })).result
await api.v1.sketch.constraint({ id: ssk, type: 'FIXATION', geomIds: [sanchor] })
const scrC = (await api.v1.sketch.circle({ id: ssk, centerPos: [scrV, 0, 0], radius: scrR, genFixation: false, genIncidence: false }))
  .result
const scrCp = await gp(scrC)
await api.v1.sketch.constraint({ id: ssk, type: 'HORIZONTAL', geomIds: [sanchor, scrCp.centerId] })
await api.v1.sketch.dimension([
  { id: ssk, name: 'scrD', type: 'DIAMETER', geomIds: [scrC], value: '@expr.screwDMm' },
  { id: ssk, name: 'scrV', type: 'HORIZONTAL_DISTANCE', geomIds: [sanchor, scrCp.centerId], value: '@expr.screwVMm' },
])
const scrExt = (
  await api.v1.part.extrusion({
    id: partId,
    name: 'ScrewTool',
    references: [scrC],
    type: 'UP',
    limit2: '@expr.screwLenMm',
  })
).result

// ── 7. ONE subtraction of all tools ─────────────────────────────────
await api.v1.part.boolean({
  id: partId,
  name: 'CutAll',
  type: 'SUBTRACTION',
  target: blankRev, // singular 'target'!
  tools: [pattern, taperRev, boreExt, kwExt, scrExt], // pattern only — original ToothCut is consumed by it
})

// ── 8. Bore-rim chamfer (collect ALL rim arcs by radius+position) ───
const g = await api.graphic()
const rimIds = []
for (const e of g.containers.flatMap((c) => c.edges ?? [])) {
  if (e.id < 0) continue // skip payload artifacts
  let atFront = true,
    atHub = true,
    atBoreR = true
  for (let i = 0; i < e.points.length; i += 3) {
    const x = e.points[i],
      rad = Math.hypot(e.points[i + 1], e.points[i + 2])
    if (Math.abs(rad - boreR) > 0.05) atBoreR = false
    if (Math.abs(x) > 1e-6) atFront = false
    if (Math.abs(x - LTB) > 1e-6) atHub = false
  }
  if (atBoreR && (atFront || atHub)) rimIds.push(e.id)
}
const chamferId = (
  await api.v1.part.chamfer({
    id: partId,
    name: 'BoreChamfer',
    references: rimIds,
    chamferType: 'EQUAL_DISTANCE',
    distance1: '@expr.chamfMm',
    distance2: '@expr.chamfMm',
  })
).result

// ── 9. Name + stainless appearance ──────────────────────────────────
const solid = Object.values(await api.tree({ refresh: true })).find((n) => n.class === 'CC_Solid' && n.members?.consumed?.value === 0)
await api.v1.common.setObjectName({ id: solid.id, name: 'D35B13SS' })
await api.v1.common.setAppearance({ target: chamferId, appearance: { color: [203, 207, 212], metalness: 0.85, roughness: 0.3 } })

return { partId, blankRev, toothExt, pattern, taperRev, boreExt, kwExt, scrExt, chamferId }
