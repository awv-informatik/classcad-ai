// ══════ run_script: Stage 1: expression graph + constrained blank revolve ══════
const t = await api.tree()
const nodes = Object.values(t.nodes ? t.nodes : t)
const partId = nodes.find((n) => n.class === 'CC_Part').id
const topPl = nodes.find((n) => n.class === 'CC_WorkPlane' && n.name === 'Top').id
const xAxis = nodes.find((n) => n.class === 'CC_WorkAxis' && n.name === 'XAxis').id

// ---------- expressions ----------
const base = [
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
]
const derived = [
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
]
const mm = [
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
  { name: 'boreCutLenMm', value: 'LTBin*inchF+4' },
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
]
const rExpr = await api.v1.part.expression({ id: partId, toCreate: [...base, ...derived, ...mm] })
if (rExpr.result !== 1) throw new Error('expression creation failed: ' + JSON.stringify(rExpr.messages))

// readback vs independent JS math
const IN = 25.4,
  N = 13,
  P = 0.375,
  Dr = 0.2,
  t2 = 0.162,
  K = 0.399,
  gap = K - t2,
  hubProj = 0.5
const pAng = Math.PI / N,
  Rp = P / (2 * Math.sin(pAng))
const exp_check = {
  RpMm: Rp * IN,
  rBlankMm: (Rp + P / 4) * IN,
  x3Mm: (2 * t2 + gap) * IN,
  LTBmm: (2 * t2 + gap + hubProj) * IN,
  Mmm: 0.8 * Dr * Math.cos(((35 + 60 / N) * Math.PI) / 180) * IN,
  capXmm: (Rp + P / 4 + 0.3 * P) * IN * Math.sin(pAng),
  screwVMm: (2 * t2 + gap + hubProj / 2) * IN,
}
const diffs = {}
for (const k of Object.keys(exp_check)) {
  const g = (await api.v1.part.getExpression({ id: partId, name: k })).result
  diffs[k] = [g.value, exp_check[k], Math.abs(g.value - exp_check[k])]
}

// ---------- blank revolve sketch on Top plane ----------
const rB = (Rp + P / 4) * IN,
  rRel = (1.109375 / 2) * IN,
  rHub = rRel
const t2m = t2 * IN,
  x2 = (t2 + gap) * IN,
  x3 = (2 * t2 + gap) * IN,
  LTB = (2 * t2 + gap + hubProj) * IN
const sk = (await api.v1.sketch.create({ id: partId, planeId: topPl, name: 'BlankSection' })).result
// verify plane resolved
const skNode = (await api.tree({ refresh: true }))[sk] || Object.values(await api.tree()).find((n) => n.id === sk)
const pts = [
  [0, 0],
  [0, rB],
  [t2m, rB],
  [t2m, rRel],
  [x2, rRel],
  [x2, rB],
  [x3, rB],
  [x3, rHub],
  [LTB, rHub],
  [LTB, 0],
]
const lineParams = []
for (let i = 0; i < 10; i++) {
  const a = pts[i],
    b = pts[(i + 1) % 10]
  lineParams.push({ id: sk, startPos: [a[0], a[1], 0], endPos: [b[0], b[1], 0] })
}
const L = (await api.v1.sketch.line(lineParams)).result
if (!Array.isArray(L) || L.some((x) => typeof x !== 'number')) throw new Error('blank lines failed ' + JSON.stringify(L))
const gp = async (id) => (await api.v1.sketch.getPoints({ id })).result
const p0 = await gp(L[0]),
  p2 = await gp(L[2]),
  p4 = await gp(L[4]),
  p6 = await gp(L[6]),
  p8 = await gp(L[8])
const anchor = p0.startId
const dims = [
  { id: sk, name: 'd_rB1', type: 'VERTICAL_DISTANCE', geomIds: [anchor, p0.endId], value: '@expr.rBlankMm' },
  { id: sk, name: 'd_t2', type: 'HORIZONTAL_DISTANCE', geomIds: [anchor, p2.startId], value: '@expr.t2Mm' },
  { id: sk, name: 'd_rRel', type: 'VERTICAL_DISTANCE', geomIds: [anchor, p2.endId], value: '@expr.rReliefMm' },
  { id: sk, name: 'd_x2', type: 'HORIZONTAL_DISTANCE', geomIds: [anchor, p4.startId], value: '@expr.x2Mm' },
  { id: sk, name: 'd_rB2', type: 'VERTICAL_DISTANCE', geomIds: [anchor, p4.endId], value: '@expr.rBlankMm' },
  { id: sk, name: 'd_x3', type: 'HORIZONTAL_DISTANCE', geomIds: [anchor, p6.startId], value: '@expr.x3Mm' },
  { id: sk, name: 'd_rHub', type: 'VERTICAL_DISTANCE', geomIds: [anchor, p6.endId], value: '@expr.rHubMm' },
  { id: sk, name: 'd_LTB', type: 'HORIZONTAL_DISTANCE', geomIds: [anchor, p8.startId], value: '@expr.LTBmm' },
]
const rd = await api.v1.sketch.dimension(dims)
if (rd.maxLevel >= 51) throw new Error('blank dims failed: ' + JSON.stringify(rd.messages))

// revolve about X axis
const rev = await api.v1.part.revolve({ id: partId, name: 'Blank', references: L, axisIds: [xAxis] })
if (rev.maxLevel >= 51) throw new Error('revolve failed: ' + JSON.stringify(rev.messages))
const blankRev = rev.result

// verify: solved corner positions (world = local on Top plane) + volume
const chk = []
for (const [li, which, exp] of [
  [2, 'startPos', [t2m, rB]],
  [4, 'startPos', [x2, rRel]],
  [6, 'startPos', [x3, rB]],
  [8, 'startPos', [LTB, rHub]],
]) {
  const ps = (await api.v1.sketch.getPositions({ id: L[li] })).result
  chk.push([which, li, [ps[which].x, ps[which].y], exp])
}
const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
const volExp = Math.PI * (rB * rB * 2 * t2m + rRel * rRel * (gap * IN) + rHub * rHub * (hubProj * IN))
return { partId, sk, blankRev, lines: L, exprDiffs: diffs, cornerChecks: chk, volume: mp.volume, volExpected: volExp }

// ══════ run_script: Stage 2: constrained ASME tooth-space cutter sketch + extrusion + merged pattern ══════
const t = await api.tree({ refresh: true })
const nodes = Object.values(t)
const partId = 4
const rightPl = nodes.find((n) => n.class === 'CC_WorkPlane' && n.name === 'Right').id
const xAxis = nodes.find((n) => n.class === 'CC_WorkAxis' && n.name === 'XAxis').id

// ---- exact seed math (JS mirror of the expression graph) ----
const IN = 25.4,
  N = 13,
  P = 0.375,
  Dr = 0.2
const pA = Math.PI / N
const Rp = (P / (2 * Math.sin(pA))) * IN
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
  cL = [-M, Rp + T] // working centers (cL drives RIGHT flank)
const jR = [Rseat * Math.cos(A), Rp - Rseat * Math.sin(A)],
  jL = [-jR[0], jR[1]]
const bR = [W, Rp - V],
  bL = [-W, Rp - V] // topping centers
// tangency working->topping (external): tR on segment cL->bR at distance E
const dcb = [bR[0] - cL[0], bR[1] - cL[1]]
const Lcb = Math.hypot(dcb[0], dcb[1])
const F = Lcb - E
const tR = [cL[0] + (E * dcb[0]) / Lcb, cL[1] + (E * dcb[1]) / Lcb],
  tL = [-tR[0], tR[1]]
// topping end on cap ray d=(sin pA, cos pA): |t*d - bR| = F, larger root
const d = [Math.sin(pA), Math.cos(pA)]
{
  var Bq = -2 * (d[0] * bR[0] + d[1] * bR[1]),
    Cq = bR[0] * bR[0] + bR[1] * bR[1] - F * F
}
const tRoot = (-Bq + Math.sqrt(Bq * Bq - 4 * Cq)) / 2
const eR = [tRoot * d[0], tRoot * d[1]],
  eL = [-eR[0], eR[1]]
const capR = [Rcap * d[0], Rcap * d[1]],
  capL = [-capR[0], capR[1]]
log('seeds', { Rp, Rseat, E, M, T, W, V, F, Rcap, jR, tR, eR, capR })

// ---- sketch ----
const sk = (await api.v1.sketch.create({ id: partId, planeId: rightPl, name: 'ToothSpace' })).result
const off = { genFixation: false, genIncidence: false, genVertAndHoriz: false, genTangency: false }
// construction skeleton
const clId = (await api.v1.sketch.line({ id: sk, startPos: [0, 0, 0], endPos: [0, Rcap + 3, 0], isConstruction: true, ...off })).result
const pitchId = (
  await api.v1.sketch.circle({ id: sk, centerPos: [0, 0, 0], radius: Rp, isConstruction: true, genFixation: false, genIncidence: false })
).result
// profile: 1 seat, 2 working, 2 topping, 2 cap lines, 1 cap arc
const seat = (
  await api.v1.sketch.arcByCenter({
    id: sk,
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
    id: sk,
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
    id: sk,
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
    id: sk,
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
    id: sk,
    startPos: [tL[0], tL[1], 0],
    endPos: [eL[0], eL[1], 0],
    centerPos: [bL[0], bL[1], 0],
    isClockwise: false,
    genFixation: false,
    genIncidence: false,
  })
).result
const capLnR = (await api.v1.sketch.line({ id: sk, startPos: [eR[0], eR[1], 0], endPos: [capR[0], capR[1], 0], ...off })).result
const capLnL = (await api.v1.sketch.line({ id: sk, startPos: [eL[0], eL[1], 0], endPos: [capL[0], capL[1], 0], ...off })).result
const capArc = (
  await api.v1.sketch.arcByCenter({
    id: sk,
    startPos: [capR[0], capR[1], 0],
    endPos: [capL[0], capL[1], 0],
    centerPos: [0, 0, 0],
    isClockwise: false,
    genFixation: false,
    genIncidence: false,
  })
).result
for (const [nm, v] of Object.entries({ clId, pitchId, seat, workR, workL, topR, topL, capLnR, capLnL, capArc }))
  if (typeof v !== 'number') throw new Error('creation failed: ' + nm)

// point ids
const gp = async (id) => (await api.v1.sketch.getPoints({ id })).result
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

// constraints: FIXATION -> COINCIDENT -> TANGENT
let r
r = await api.v1.sketch.constraint([
  { id: sk, type: 'FIXATION', geomIds: [clP.startId] },
  { id: sk, type: 'FIXATION', geomIds: [clP.endId] },
  { id: sk, type: 'FIXATION', geomIds: [pitchP.centerId] },
])
if (r.maxLevel >= 51) throw new Error('fix: ' + JSON.stringify(r.messages))
r = await api.v1.sketch.constraint([
  { id: sk, name: 'aOnPitch', type: 'COINCIDENT', geomIds: [seatP.centerId, pitchId] },
  { id: sk, name: 'aOnCL', type: 'COINCIDENT', geomIds: [seatP.centerId, clId] },
  { id: sk, name: 'jR', type: 'COINCIDENT', geomIds: [seatP.startId, wRP.startId] },
  { id: sk, name: 'jL', type: 'COINCIDENT', geomIds: [seatP.endId, wLP.startId] },
  { id: sk, name: 'tRj', type: 'COINCIDENT', geomIds: [wRP.endId, tRP.startId] },
  { id: sk, name: 'tLj', type: 'COINCIDENT', geomIds: [wLP.endId, tLP.startId] },
  { id: sk, name: 'eRj', type: 'COINCIDENT', geomIds: [tRP.endId, cRLn.startId] },
  { id: sk, name: 'eLj', type: 'COINCIDENT', geomIds: [tLP.endId, cLLn.startId] },
  { id: sk, name: 'capRj', type: 'COINCIDENT', geomIds: [cRLn.endId, capP.startId] },
  { id: sk, name: 'capLj', type: 'COINCIDENT', geomIds: [cLLn.endId, capP.endId] },
  { id: sk, name: 'capCtr', type: 'COINCIDENT', geomIds: [capP.centerId, clP.startId] },
  { id: sk, name: 'radR', type: 'COINCIDENT', geomIds: [clP.startId, capLnR] },
  { id: sk, name: 'radL', type: 'COINCIDENT', geomIds: [clP.startId, capLnL] },
])
if (r.maxLevel >= 51) throw new Error('coinc: ' + JSON.stringify(r.messages))
r = await api.v1.sketch.constraint([
  { id: sk, name: 'tanSR', type: 'TANGENT', geomIds: [seat, workR] },
  { id: sk, name: 'tanSL', type: 'TANGENT', geomIds: [seat, workL] },
  { id: sk, name: 'tanWTR', type: 'TANGENT', geomIds: [workR, topR] },
  { id: sk, name: 'tanWTL', type: 'TANGENT', geomIds: [workL, topL] },
])
if (r.maxLevel >= 51) throw new Error('tan: ' + JSON.stringify(r.messages))

// dimensions (@expr-bound, no dimPos)
r = await api.v1.sketch.dimension([
  { id: sk, name: 'dRp', type: 'RADIUS', geomIds: [pitchId], value: '@expr.RpMm' },
  { id: sk, name: 'dRseat', type: 'RADIUS', geomIds: [seat], value: '@expr.RseatMm' },
  { id: sk, name: 'dER', type: 'RADIUS', geomIds: [workR], value: '@expr.Emm' },
  { id: sk, name: 'dEL', type: 'RADIUS', geomIds: [workL], value: '@expr.Emm' },
  { id: sk, name: 'dMR', type: 'HORIZONTAL_DISTANCE', geomIds: [seatP.centerId, wRP.centerId], value: '@expr.Mmm' },
  { id: sk, name: 'dTR', type: 'VERTICAL_DISTANCE', geomIds: [seatP.centerId, wRP.centerId], value: '@expr.Tmm' },
  { id: sk, name: 'dML', type: 'HORIZONTAL_DISTANCE', geomIds: [seatP.centerId, wLP.centerId], value: '@expr.Mmm' },
  { id: sk, name: 'dTL', type: 'VERTICAL_DISTANCE', geomIds: [seatP.centerId, wLP.centerId], value: '@expr.Tmm' },
  { id: sk, name: 'dWR', type: 'HORIZONTAL_DISTANCE', geomIds: [seatP.centerId, tRP.centerId], value: '@expr.Wmm' },
  { id: sk, name: 'dVR', type: 'VERTICAL_DISTANCE', geomIds: [seatP.centerId, tRP.centerId], value: '@expr.Vmm' },
  { id: sk, name: 'dWL', type: 'HORIZONTAL_DISTANCE', geomIds: [seatP.centerId, tLP.centerId], value: '@expr.Wmm' },
  { id: sk, name: 'dVL', type: 'VERTICAL_DISTANCE', geomIds: [seatP.centerId, tLP.centerId], value: '@expr.Vmm' },
  { id: sk, name: 'dCapXR', type: 'HORIZONTAL_DISTANCE', geomIds: [clP.startId, cRLn.endId], value: '@expr.capXmm' },
  { id: sk, name: 'dCapYR', type: 'VERTICAL_DISTANCE', geomIds: [clP.startId, cRLn.endId], value: '@expr.capYmm' },
  { id: sk, name: 'dCapXL', type: 'HORIZONTAL_DISTANCE', geomIds: [clP.startId, cLLn.endId], value: '@expr.capXmm' },
  { id: sk, name: 'dCapYL', type: 'VERTICAL_DISTANCE', geomIds: [clP.startId, cLLn.endId], value: '@expr.capYmm' },
])
if (r.maxLevel >= 51) throw new Error('dims: ' + JSON.stringify(r.messages))

// verify solved layout vs analytic (world: local (x,y) -> (0,-y,x) on Right plane)
const w2l = (p) => [p.z, -p.y]
const checks = {}
const seatPos = (await api.v1.sketch.getPositions({ id: seat })).result
checks.jR = [w2l(seatPos.startPos), jR]
checks.jL = [w2l(seatPos.endPos), jL]
checks.a = [w2l(seatPos.centerPos), a]
const wrPos = (await api.v1.sketch.getPositions({ id: workR })).result
checks.tR = [w2l(wrPos.endPos), tR]
checks.cL = [w2l(wrPos.centerPos), cL]
const trPos = (await api.v1.sketch.getPositions({ id: topR })).result
checks.eR = [w2l(trPos.endPos), eR]
checks.bR = [w2l(trPos.centerPos), bR]
const capPos = (await api.v1.sketch.getPositions({ id: capArc })).result
checks.capR = [w2l(capPos.startPos), capR]
let maxErr = 0
for (const k of Object.keys(checks)) {
  const [got, exp] = checks[k]
  const e = Math.hypot(got[0] - exp[0], got[1] - exp[1])
  checks[k] = [got, exp, e]
  maxErr = Math.max(maxErr, e)
}
// emergent topping radius vs published F
const tnode = (await api.tree({ refresh: true }))[topR]
const trS = trPos.startPos,
  trC = trPos.centerPos
const Fsolved = Math.hypot(trS.z - trC.z, trS.y - trC.y)

// ---- extrude symmetric + merged circular pattern ----
const ext = await api.v1.part.extrusion({
  id: partId,
  name: 'ToothCut',
  references: [seat, workR, workL, topR, topL, capLnR, capLnL, capArc],
  type: 'SYMMETRIC',
  limit2: '@expr.cutExtMm',
})
if (ext.maxLevel >= 51) throw new Error('extrusion: ' + JSON.stringify(ext.messages))
const pat = await api.v1.part.circularPattern({
  id: partId,
  name: 'ToothPattern',
  targets: [ext.result],
  references: [xAxis],
  count: '@expr.teeth',
  angle: '@expr.toothAngle',
  merged: 1,
})
if (pat.maxLevel >= 51) throw new Error('pattern: ' + JSON.stringify(pat.messages))

return { sk, toothExt: ext.result, pattern: pat.result, maxSolveErr: maxErr, Fsolved, Fseed: F, checks }

// ══════ run_script: Stage 3: taper revolve tool + bore/keyway + set-screw tools (all constrained) — FAILED ══════
const partId = 4
const t = await api.tree({ refresh: true })
const nodes = Object.values(t)
const topPl = nodes.find((n) => n.class === 'CC_WorkPlane' && n.name === 'Top').id
const rightPl = nodes.find((n) => n.class === 'CC_WorkPlane' && n.name === 'Right').id
const xAxis = nodes.find((n) => n.class === 'CC_WorkAxis' && n.name === 'XAxis').id

// extra helper expressions
let r = await api.v1.part.expression({
  id: partId,
  toCreate: [
    { name: 'mrgMm', value: 1 },
    { name: 'tpA1', value: 'mrgMm' },
    { name: 'tpA2', value: 't2in*inchF+mrgMm' },
    { name: 'tpA3', value: '(t2in+gapIn)*inchF-mrgMm' },
    { name: 'tpA4', value: '(2*t2in+gapIn)*inchF+mrgMm' },
    { name: 'cutLim1', value: -2 },
    { name: 'boreLim2', value: 'LTBin*inchF+2' },
  ],
})
if (r.result !== 1) throw new Error('expr: ' + JSON.stringify(r.messages))

// JS mirrors for seeds
const IN = 25.4,
  N = 13,
  P = 0.375,
  t2 = 0.162 * IN,
  gap = (0.399 - 0.162) * IN,
  hub = 0.5 * IN
const x2 = t2 + gap,
  x3 = 2 * t2 + gap,
  LTB = x3 + hub
const Rp = (P / (2 * Math.sin(Math.PI / N))) * IN
const rB = Rp + (P / 4) * IN,
  r0 = rB - (P / 2) * IN,
  r1 = rB + 0.1 * IN,
  dz = (r1 - r0) / 4,
  m = 1
const boreR = (0.625 / 2) * IN,
  kwHW = (0.1875 / 2) * IN,
  kwTop = boreR + 0.09375 * IN,
  kwBot = boreR - 2
const scrV = x3 + hub / 2,
  scrR = (0.25 / 2) * IN,
  rHub = (1.109375 / 2) * IN
const off = { genFixation: false, genIncidence: false, genVertAndHoriz: false, genTangency: false }
const gp = async (id) => (await api.v1.sketch.getPoints({ id })).result

// ============ TAPER SKETCH (Top plane: local = world x,y) ============
const tsk = (await api.v1.sketch.create({ id: partId, planeId: topPl, name: 'TipTapers' })).result
const tanchor = (await api.v1.sketch.point({ id: tsk, pos: [0, 0, 0], genFixation: true, genIncidence: false })).result
await api.v1.sketch.constraint({ id: tsk, type: 'FIXATION', geomIds: [tanchor] })
// faces: [facePos, coneSign s]  quad: Pa=(f-s*m,r0) Pb=(f,r0) Pc=(f+s*dz,r1) Pd=(f-s*m,r1)
const faces = [
  [0, 1, 'tpA1', null],
  [t2, -1, 'tpA2', 't2Mm'],
  [x2, 1, 'tpA3', 'x2Mm'],
  [x3, -1, 'tpA4', 'x3Mm'],
]
const taperLines = []
const taperInfo = []
for (let qi = 0; qi < 4; qi++) {
  const [f, s, exA, exB] = faces[qi]
  const Pa = [f - s * m, r0],
    Pb = [f, r0],
    Pc = [f + s * dz, r1],
    Pd = [f - s * m, r1]
  const ls = (
    await api.v1.sketch.line([
      { id: tsk, startPos: [Pa[0], Pa[1], 0], endPos: [Pb[0], Pb[1], 0], ...off },
      { id: tsk, startPos: [Pb[0], Pb[1], 0], endPos: [Pc[0], Pc[1], 0], ...off },
      { id: tsk, startPos: [Pc[0], Pc[1], 0], endPos: [Pd[0], Pd[1], 0], ...off },
      { id: tsk, startPos: [Pd[0], Pd[1], 0], endPos: [Pa[0], Pa[1], 0], ...off },
    ])
  ).result
  const [lb, lc, lt, ll] = ls
  const pb = await gp(lb),
    pc = await gp(lc),
    pt = await gp(lt),
    pl = await gp(ll)
  let rc = await api.v1.sketch.constraint([
    { id: tsk, type: 'COINCIDENT', geomIds: [pb.endId, pc.startId] },
    { id: tsk, type: 'COINCIDENT', geomIds: [pc.endId, pt.startId] },
    { id: tsk, type: 'COINCIDENT', geomIds: [pt.endId, pl.startId] },
    { id: tsk, type: 'COINCIDENT', geomIds: [pl.endId, pb.startId] },
    { id: tsk, type: 'HORIZONTAL', geomIds: [lb] },
    { id: tsk, type: 'HORIZONTAL', geomIds: [lt] },
    { id: tsk, type: 'VERTICAL', geomIds: [ll] },
  ])
  if (rc.maxLevel >= 51) throw new Error('taper q' + qi + ' constr: ' + JSON.stringify(rc.messages))
  const dimList = [
    { id: tsk, name: 'q' + qi + 'r0', type: 'VERTICAL_DISTANCE', geomIds: [tanchor, pb.startId], value: '@expr.taperR0Mm' },
    { id: tsk, name: 'q' + qi + 'r1', type: 'VERTICAL_DISTANCE', geomIds: [tanchor, pt.startId], value: '@expr.taperR1Mm' },
    { id: tsk, name: 'q' + qi + 'a', type: 'HORIZONTAL_DISTANCE', geomIds: [tanchor, pb.startId], value: '@expr.' + exA },
    { id: tsk, name: 'q' + qi + 'dz', type: 'HORIZONTAL_DISTANCE', geomIds: [pb.endId, pc.endId], value: '@expr.taperDzMm' },
  ]
  if (exB) dimList.push({ id: tsk, name: 'q' + qi + 'b', type: 'HORIZONTAL_DISTANCE', geomIds: [tanchor, pb.endId], value: '@expr.' + exB })
  const rdm = await api.v1.sketch.dimension(dimList)
  if (rdm.maxLevel >= 51) throw new Error('taper q' + qi + ' dims: ' + JSON.stringify(rdm.messages))
  if (!exB) {
    // face at x=0: align Pb.x with anchor
    const rv = await api.v1.sketch.constraint({ id: tsk, type: 'VERTICAL', geomIds: [tanchor, pb.endId] })
    if (rv.maxLevel >= 51) throw new Error('taper q0 vert: ' + JSON.stringify(rv.messages))
  }
  taperLines.push(...ls)
  taperInfo.push({ q: qi, lb, exp: { Pb: [f, r0], Pc: [f + s * dz, r1] } })
}
// verify solved corners
let tmaxErr = 0
for (const info of taperInfo) {
  const ps = (await api.v1.sketch.getPositions({ id: info.lb })).result
  const e = Math.hypot(ps.endPos.x - info.exp.Pb[0], ps.endPos.y - info.exp.Pb[1])
  tmaxErr = Math.max(tmaxErr, e)
}
const trev = await api.v1.part.revolve({ id: partId, name: 'TaperTool', references: taperLines, axisIds: [xAxis] })
if (trev.maxLevel >= 51) throw new Error('taper revolve: ' + JSON.stringify(trev.messages))

// ============ BORE + KEYWAY (Right plane: local x->+Z, y->-Y, normal +X) ============
const bsk = (await api.v1.sketch.create({ id: partId, planeId: rightPl, name: 'BoreKeyway' })).result
const banchor = (await api.v1.sketch.point({ id: bsk, pos: [0, 0, 0], genFixation: true, genIncidence: false })).result
await api.v1.sketch.constraint({ id: bsk, type: 'FIXATION', geomIds: [banchor] })
const boreC = (await api.v1.sketch.circle({ id: bsk, centerPos: [0, 0, 0], radius: boreR, genFixation: false, genIncidence: false })).result
const boreCp = await gp(boreC)
let rb = await api.v1.sketch.constraint({ id: bsk, type: 'COINCIDENT', geomIds: [boreCp.centerId, banchor] })
if (rb.maxLevel >= 51) throw new Error('bore coinc: ' + JSON.stringify(rb.messages))
rb = await api.v1.sketch.dimension({ id: bsk, name: 'dBore', type: 'DIAMETER', geomIds: [boreC], value: '@expr.boreMm' })
if (rb.maxLevel >= 51) throw new Error('bore dim: ' + JSON.stringify(rb.messages))
// keyway rectangle in local coords, +y above bore
const kls = (
  await api.v1.sketch.line([
    { id: bsk, startPos: [-kwHW, kwBot, 0], endPos: [kwHW, kwBot, 0], ...off },
    { id: bsk, startPos: [kwHW, kwBot, 0], endPos: [kwHW, kwTop, 0], ...off },
    { id: bsk, startPos: [kwHW, kwTop, 0], endPos: [-kwHW, kwTop, 0], ...off },
    { id: bsk, startPos: [-kwHW, kwTop, 0], endPos: [-kwHW, kwBot, 0], ...off },
  ])
).result
const [kb, kr, kt, kl] = kls
const kbp = await gp(kb),
  krp = await gp(kr),
  ktp = await gp(kt),
  klp = await gp(kl)
rb = await api.v1.sketch.constraint([
  { id: bsk, type: 'COINCIDENT', geomIds: [kbp.endId, krp.startId] },
  { id: bsk, type: 'COINCIDENT', geomIds: [krp.endId, ktp.startId] },
  { id: bsk, type: 'COINCIDENT', geomIds: [ktp.endId, klp.startId] },
  { id: bsk, type: 'COINCIDENT', geomIds: [klp.endId, kbp.startId] },
  { id: bsk, type: 'HORIZONTAL', geomIds: [kb] },
  { id: bsk, type: 'HORIZONTAL', geomIds: [kt] },
  { id: bsk, type: 'VERTICAL', geomIds: [kr] },
  { id: bsk, type: 'VERTICAL', geomIds: [kl] },
])
if (rb.maxLevel >= 51) throw new Error('kw constr: ' + JSON.stringify(rb.messages))
rb = await api.v1.sketch.dimension([
  { id: bsk, name: 'kwTop', type: 'VERTICAL_DISTANCE', geomIds: [banchor, ktp.startId], value: '@expr.kwYtopMm' },
  { id: bsk, name: 'kwBot', type: 'VERTICAL_DISTANCE', geomIds: [banchor, kbp.startId], value: '@expr.kwYbotMm' },
  { id: bsk, name: 'kwL', type: 'HORIZONTAL_DISTANCE', geomIds: [banchor, ktp.endId], value: '@expr.kwHalfWMm' },
  { id: bsk, name: 'kwR', type: 'HORIZONTAL_DISTANCE', geomIds: [banchor, ktp.startId], value: '@expr.kwHalfWMm' },
])
if (rb.maxLevel >= 51) throw new Error('kw dims: ' + JSON.stringify(rb.messages))
const boreExt = await api.v1.part.extrusion({
  id: partId,
  name: 'BoreTool',
  references: [boreC],
  type: 'CUSTOM',
  direction: [1, 0, 0],
  limit1: '@expr.cutLim1',
  limit2: '@expr.boreLim2',
})
if (boreExt.maxLevel >= 51) throw new Error('bore ext: ' + JSON.stringify(boreExt.messages))
const kwExt = await api.v1.part.extrusion({
  id: partId,
  name: 'KeywayTool',
  references: kls,
  type: 'CUSTOM',
  direction: [1, 0, 0],
  limit1: '@expr.cutLim1',
  limit2: '@expr.boreLim2',
})
if (kwExt.maxLevel >= 51) throw new Error('kw ext: ' + JSON.stringify(kwExt.messages))

// ============ SET SCREW (Top plane, radial +Z) ============
const ssk = (await api.v1.sketch.create({ id: partId, planeId: topPl, name: 'SetScrew' })).result
const sanchor = (await api.v1.sketch.point({ id: ssk, pos: [0, 0, 0], genFixation: true, genIncidence: false })).result
await api.v1.sketch.constraint({ id: ssk, type: 'FIXATION', geomIds: [sanchor] })
const scrC = (await api.v1.sketch.circle({ id: ssk, centerPos: [scrV, 0, 0], radius: scrR, genFixation: false, genIncidence: false }))
  .result
const scrCp = await gp(scrC)
let rs = await api.v1.sketch.constraint({ id: ssk, type: 'HORIZONTAL', geomIds: [sanchor, scrCp.centerId] })
if (rs.maxLevel >= 51) throw new Error('scr horiz: ' + JSON.stringify(rs.messages))
rs = await api.v1.sketch.dimension([
  { id: ssk, name: 'scrD', type: 'DIAMETER', geomIds: [scrC], value: '@expr.screwDMm' },
  { id: ssk, name: 'scrV', type: 'HORIZONTAL_DISTANCE', geomIds: [sanchor, scrCp.centerId], value: '@expr.screwVMm' },
])
if (rs.maxLevel >= 51) throw new Error('scr dims: ' + JSON.stringify(rs.messages))
const scrExt = await api.v1.part.extrusion({ id: partId, name: 'ScrewTool', references: [scrC], type: 'UP', limit2: '@expr.screwLenMm' })
if (scrExt.maxLevel >= 51) throw new Error('scr ext: ' + JSON.stringify(scrExt.messages))

// verify screw circle position (world on Top: local=world)
const scrPos = (await api.v1.sketch.getPositions({ id: scrCp.centerId })).result.pos
return {
  tsk,
  taperRev: trev.result,
  bsk,
  boreExt: boreExt.result,
  kwExt: kwExt.result,
  ssk,
  scrExt: scrExt.result,
  taperMaxErr: tmaxErr,
  screwCenter: [scrPos.x, scrPos.y, scrPos.z],
  screwCenterExp: [scrV, 0, 0],
}

// ══════ run_script: Inspect plane frames + finish bore/keyway/screw tools ══════
const partId = 4
const t = await api.tree({ refresh: true })
const nodes = Object.values(t)
const byName = (cls, nm) => nodes.find((n) => n.class === cls && n.name === nm)
const topPl = byName('CC_WorkPlane', 'Top'),
  rightPl = byName('CC_WorkPlane', 'Right'),
  frontPl = byName('CC_WorkPlane', 'Front')
log('Top cs', JSON.stringify(topPl.coordinateSystem))
log('Right cs', JSON.stringify(rightPl.coordinateSystem))
log('Front cs', JSON.stringify(frontPl.coordinateSystem))

// find already-created things
const bsk = nodes.find((n) => n.class === 'CC_Sketch' && n.name === 'BoreKeyway').id
const tsk = nodes.find((n) => n.class === 'CC_Sketch' && n.name === 'TipTapers').id
const taperRev = nodes.find((n) => n.class === 'CC_Revolve' && n.name === 'TaperTool')
log(
  'taperRev',
  taperRev ? taperRev.id : 'MISSING',
  'classes:',
  [...new Set(nodes.map((n) => n.class))].filter((c) => c.includes('Rev')).join(','),
)

// bore circle + keyway lines from the sketch
const geo = (await api.v1.sketch.getGeometry({ id: bsk })).result
log('bsk geometry', JSON.stringify(geo))
const boreC = geo.circles[0]
const kwLines = geo.lines // 4 keyway lines
return { rightCS: rightPl.coordinateSystem, topCS: topPl.coordinateSystem, bsk, boreC, kwLines, taperRevId: taperRev ? taperRev.id : null }

// ══════ run_script: Finish bore/keyway/screw tool extrusions ══════
const partId = 4
const t = await api.tree({ refresh: true })
const nodes = Object.values(t)
const topPl = nodes.find((n) => n.class === 'CC_WorkPlane' && n.name === 'Top').id
const bsk = 4279,
  boreC = 4291,
  kwLines = [4300, 4304, 4308, 4312]
const IN = 25.4,
  t2 = 0.162 * IN,
  gap = (0.399 - 0.162) * IN,
  hub = 0.5 * IN,
  x3 = 2 * t2 + gap,
  scrV = x3 + hub / 2,
  scrR = (0.25 / 2) * IN
const gp = async (id) => (await api.v1.sketch.getPoints({ id })).result
const off = { genFixation: false, genIncidence: false, genVertAndHoriz: false, genTangency: false }

// bore + keyway: CUSTOM with sketch-LOCAL direction [0,0,1] = world +X
const boreExt = await api.v1.part.extrusion({
  id: partId,
  name: 'BoreTool',
  references: [boreC],
  type: 'CUSTOM',
  direction: [0, 0, 1],
  limit1: '@expr.cutLim1',
  limit2: '@expr.boreLim2',
})
if (boreExt.maxLevel >= 51) throw new Error('bore ext: ' + JSON.stringify(boreExt.messages))
const kwExt = await api.v1.part.extrusion({
  id: partId,
  name: 'KeywayTool',
  references: kwLines,
  type: 'CUSTOM',
  direction: [0, 0, 1],
  limit1: '@expr.cutLim1',
  limit2: '@expr.boreLim2',
})
if (kwExt.maxLevel >= 51) throw new Error('kw ext: ' + JSON.stringify(kwExt.messages))

// verify direction: bounds of latest solids not possible per-feature; check bore tool via graphic later. Quick: mass props unaffected (tools separate bodies).

// set screw sketch on Top plane
const ssk = (await api.v1.sketch.create({ id: partId, planeId: topPl, name: 'SetScrew' })).result
const sanchor = (await api.v1.sketch.point({ id: ssk, pos: [0, 0, 0], genFixation: true, genIncidence: false })).result
await api.v1.sketch.constraint({ id: ssk, type: 'FIXATION', geomIds: [sanchor] })
const scrC = (await api.v1.sketch.circle({ id: ssk, centerPos: [scrV, 0, 0], radius: scrR, genFixation: false, genIncidence: false }))
  .result
const scrCp = await gp(scrC)
let rs = await api.v1.sketch.constraint({ id: ssk, type: 'HORIZONTAL', geomIds: [sanchor, scrCp.centerId] })
if (rs.maxLevel >= 51) throw new Error('scr horiz: ' + JSON.stringify(rs.messages))
rs = await api.v1.sketch.dimension([
  { id: ssk, name: 'scrD', type: 'DIAMETER', geomIds: [scrC], value: '@expr.screwDMm' },
  { id: ssk, name: 'scrV', type: 'HORIZONTAL_DISTANCE', geomIds: [sanchor, scrCp.centerId], value: '@expr.screwVMm' },
])
if (rs.maxLevel >= 51) throw new Error('scr dims: ' + JSON.stringify(rs.messages))
// screw hole must reach the bore: extrude DOWN? Top plane normal +Z, screw comes radially from +Z side to bore.
// UP goes +Z (outward). We need from z=+rHub+2 down to bore -> extrude type CUSTOM local [0,0,-1]? simpler: SYMMETRIC over full hub dia.
const scrExt = await api.v1.part.extrusion({
  id: partId,
  name: 'ScrewTool',
  references: [scrC],
  type: 'SYMMETRIC',
  limit2: '2*@expr.screwLenMm',
})
if (scrExt.maxLevel >= 51) throw new Error('scr ext: ' + JSON.stringify(scrExt.messages))
const scrPos = (await api.v1.sketch.getPositions({ id: scrCp.centerId })).result.pos
return {
  boreExt: boreExt.result,
  kwExt: kwExt.result,
  ssk,
  scrExt: scrExt.result,
  screwCenter: [scrPos.x, scrPos.y, scrPos.z],
  screwCenterExp: [scrV, 0, 0],
}

// ══════ run_script: Fix screw tool to single radial hole; checkpoint state — FAILED ══════
const partId = 4
const r = await api.v1.part.updateExtrusion({ id: 7014, type: 'UP', limit2: '@expr.screwLenMm' })
if (r.maxLevel >= 51) throw new Error('upd scr: ' + JSON.stringify(r.messages))
return { ok: 1, res: r.result }

// ══════ run_script: Update screw extrusion via openFeature, then checkpoint-ready verify ══════
const partId = 4
await api.v1.part.openFeature({ id: 7014 })
const r = await api.v1.part.updateExtrusion({ id: 7014, type: 'UP', limit2: '@expr.screwLenMm' })
await api.v1.part.closeFeature({ id: 7014 })
if (r.maxLevel >= 51) throw new Error('upd scr: ' + JSON.stringify(r.messages))
await api.v1.common.recalc({})
return { ok: 1 }

// ══════ run_script: Stage 4: single subtraction of all tools, then verify — FAILED ══════
const partId = 4
// blankRev=178, pattern=498, taperRev=4192, boreExt=6929, kwExt=6950, scrExt=7014
const b = await api.v1.part.boolean({
  id: partId,
  name: 'CutAll',
  type: 'SUBTRACTION',
  targets: [178],
  tools: [498, 4192, 6929, 6950, 7014],
})
if (b.maxLevel >= 51) throw new Error('boolean: ' + JSON.stringify(b.messages))
const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
const bounds = await api.structure.calculateProductBounds(partId)
return { boolId: b.result, volume: mp.volume, cog: mp.centerOfGravity || mp.cog, bounds }

// ══════ run_script: Boolean with correct param name; verify volume + probes — FAILED ══════
const partId = 4
const b = await api.v1.part.boolean({ id: partId, name: 'CutAll', type: 'SUBTRACTION', target: 178, tools: [498, 4192, 6929, 6950, 7014] })
if (b.maxLevel >= 51) throw new Error('boolean: ' + JSON.stringify(b.messages))
const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
const bounds = await api.structure.calculateProductBounds(partId)
return { boolId: b.result, volume: mp.volume, mpKeys: Object.keys(mp), bounds }

// ══════ run_script: Diagnose: check features/solids and any broken boolean node ══════
const t = await api.tree({ refresh: true })
const nodes = Object.values(t)
const feats = nodes
  .filter((n) => ['CC_Revolve', 'CC_Extrusion', 'CC_CircularPattern', 'CC_Subtraction', 'CC_Boolean'].includes(n.class))
  .map((n) => ({ id: n.id, class: n.class, name: n.name }))
const solids = nodes
  .filter((n) => n.class === 'CC_Solid')
  .map((n) => ({ id: n.id, parent: n.parent, consumed: n.members?.consumed?.value }))
return { feats, solids }

// ══════ run_script: Delete broken features, retry subtraction, verify — FAILED ══════
const partId = 4
await api.v1.part.deleteFeature({ id: partId, featureIds: [13473, 4350] }).catch(async (e) => {
  // try alternate param name
  await api.v1.part.deleteFeature({ id: partId, features: [13473, 4350] })
})
await api.v1.common.recalc({})
const b = await api.v1.part.boolean({ id: partId, name: 'CutAll', type: 'SUBTRACTION', target: 178, tools: [498, 4192, 6929, 6950, 7014] })
if (b.maxLevel >= 51) throw new Error('boolean: ' + JSON.stringify(b.messages))
const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
const bounds = await api.structure.calculateProductBounds(partId)
return { boolId: b.result, volume: mp.volume, bounds }

// ══════ run_script: Delete broken features (correct param), retry subtraction — FAILED ══════
const partId = 4
const t = await api.tree({ refresh: true })
const nodes = Object.values(t)
const bad = nodes
  .filter(
    (n) => (n.class === 'CC_Subtraction' && n.name === 'CutAll') || (n.class === 'CC_Extrusion' && n.name === 'BoreTool' && n.id === 4350),
  )
  .map((n) => n.id)
log('deleting', JSON.stringify(bad))
if (bad.length) {
  const d = await api.v1.part.deleteFeature({ ids: bad })
  log('delete maxLevel', d.maxLevel, JSON.stringify(d.messages || []))
}
await api.v1.common.recalc({})
const b = await api.v1.part.boolean({ id: partId, name: 'CutAll', type: 'SUBTRACTION', target: 178, tools: [498, 4192, 6929, 6950, 7014] })
if (b.maxLevel >= 51) throw new Error('boolean: ' + JSON.stringify(b.messages))
const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
const bounds = await api.structure.calculateProductBounds(partId)
return { boolId: b.result, volume: mp.volume, bounds }

// ══════ run_script: Assess current state after failed restore ══════
const t = await api.tree({ refresh: true })
const nodes = Object.values(t)
const feats = nodes
  .filter((n) => ['CC_Revolve', 'CC_Extrusion', 'CC_CircularPattern', 'CC_Subtraction'].includes(n.class))
  .map((n) => ({ id: n.id, class: n.class, name: n.name }))
const solids = nodes
  .filter((n) => n.class === 'CC_Solid')
  .map((n) => ({ id: n.id, parent: n.parent, consumed: n.members?.consumed?.value }))
const sketches = nodes.filter((n) => n.class === 'CC_Sketch').map((n) => ({ id: n.id, name: n.name }))
const mp = (await api.v1.part.calculateMassProperties({ id: 4 })).result
return { feats, solids, sketches, vol: mp ? mp.volume : null }

// ══════ run_script: Clean broken BoreTool, recalc, then ONE subtraction ══════
const partId = 4
const d = await api.v1.part.deleteFeature({ ids: [4350] })
log('del', d.maxLevel, JSON.stringify(d.messages || []))
const rc = await api.v1.common.recalc({})
log('recalc', rc.maxLevel)
// confirm blank solid alive
const t = await api.tree({ refresh: true })
const blankSolid = Object.values(t).find((n) => n.class === 'CC_Solid' && n.parent === 178)
log('blank solid consumed', blankSolid ? blankSolid.members?.consumed?.value : 'MISSING')
const b = await api.v1.part.boolean({ id: partId, name: 'CutAll', type: 'SUBTRACTION', target: 178, tools: [498, 4192, 6929, 6950, 7014] })
if (b.maxLevel >= 51) throw new Error('boolean: ' + JSON.stringify(b.messages))
const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
const bounds = await api.structure.calculateProductBounds(partId)
return { boolId: b.result, volume: mp ? mp.volume : null, bounds }

// ══════ run_script: Collect bore rim arcs at both ends, chamfer @expr.chamfMm, name + appearance — FAILED ══════
const partId = 4
const IN = 25.4,
  boreR = (0.625 / 2) * IN,
  LTB = 26.9494
// find rim arcs via graphic: edges whose all points are at x≈0 or x≈LTB AND at radius≈boreR in yz
const g = await api.graphic()
const edges = g.containers.flatMap((c) => c.edges ?? [])
const rimEdges = []
for (const e of edges) {
  let ok0 = true,
    okL = true,
    okR = true
  for (let i = 0; i < e.points.length; i += 3) {
    const x = e.points[i],
      y = e.points[i + 1],
      z = e.points[i + 2]
    const rad = Math.hypot(y, z)
    if (Math.abs(rad - boreR) > 0.05) okR = false
    if (Math.abs(x - 0) > 1e-6) ok0 = false
    if (Math.abs(x - LTB) > 1e-6) okL = false
  }
  if (okR && (ok0 || okL)) rimEdges.push({ id: e.id, end: ok0 ? 'front' : 'hub', npts: e.points.length / 3 })
}
log('rim edges', JSON.stringify(rimEdges))
if (rimEdges.length < 2) throw new Error('too few rim edges found')
const ch = await api.v1.part.chamfer({
  id: partId,
  name: 'BoreChamfer',
  references: rimEdges.map((e) => e.id),
  chamferType: 'EQUAL_DISTANCE',
  distance1: '@expr.chamfMm',
  distance2: '@expr.chamfMm',
})
if (ch.maxLevel >= 51) throw new Error('chamfer: ' + JSON.stringify(ch.messages))
// verify chamfer ring: new conical faces near the rims; measure volume delta
const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
// name + appearance
const t = await api.tree({ refresh: true })
const solid = Object.values(t).find((n) => n.class === 'CC_Solid' && n.members?.consumed?.value === 0)
await api.v1.common.setObjectName({ id: solid.id, name: 'D35B13SS' })
await api.v1.common.setAppearance({ id: partId, appearance: { color: [200, 204, 208], metalness: 0.9, roughness: 0.35 } })
return { chamferId: ch.result, rimEdges, volume: mp.volume, solidId: solid.id }

// ══════ run_script: Chamfer with valid rim edge ids, verify ring, name+appearance ══════
const partId = 4
const IN = 25.4,
  boreR = (0.625 / 2) * IN,
  LTB = 26.9494
const g = await api.graphic()
const edges = g.containers.flatMap((c) => c.edges ?? [])
const rims = []
for (const e of edges) {
  if (e.id < 0) continue
  let ok0 = true,
    okL = true,
    okR = true
  for (let i = 0; i < e.points.length; i += 3) {
    const x = e.points[i],
      rad = Math.hypot(e.points[i + 1], e.points[i + 2])
    if (Math.abs(rad - boreR) > 0.05) okR = false
    if (Math.abs(x) > 1e-6) ok0 = false
    if (Math.abs(x - LTB) > 1e-6) okL = false
  }
  if (okR && (ok0 || okL)) rims.push({ id: e.id, end: ok0 ? 'front' : 'hub' })
}
log('rims', JSON.stringify(rims))
const nFront = rims.filter((r) => r.end === 'front').length,
  nHub = rims.filter((r) => r.end === 'hub').length
if (nFront < 1 || nHub < 1) throw new Error('missing a rim')
const ch = await api.v1.part.chamfer({
  id: partId,
  name: 'BoreChamfer',
  references: rims.map((e) => e.id),
  chamferType: 'EQUAL_DISTANCE',
  distance1: '@expr.chamfMm',
  distance2: '@expr.chamfMm',
})
if (ch.maxLevel >= 51) throw new Error('chamfer: ' + JSON.stringify(ch.messages))
const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result

// verify chamfer ring runs all the way around: look for edges at radius boreR+chamf at x offset chamf from each face
const chamf = 0.03 * IN
const g2 = await api.graphic()
const e2 = g2.containers.flatMap((c) => c.edges ?? [])
function ringCoverage(xFace, dirIn) {
  // outer chamfer rim edge: at x=xFace, radius = boreR+chamf
  let angles = []
  for (const e of e2) {
    let allOk = true
    for (let i = 0; i < e.points.length; i += 3) {
      const x = e.points[i],
        y = e.points[i + 1],
        z = e.points[i + 2]
      if (Math.abs(x - xFace) > 1e-4 || Math.abs(Math.hypot(y, z) - (boreR + chamf)) > 0.02) {
        allOk = false
        break
      }
    }
    if (allOk && e.points.length >= 6) {
      for (let i = 0; i < e.points.length; i += 3) angles.push(Math.atan2(e.points[i + 2], e.points[i + 1]))
    }
  }
  if (!angles.length) return null
  angles.sort((a, b) => a - b)
  let maxGap = 0
  for (let i = 1; i < angles.length; i++) maxGap = Math.max(maxGap, angles[i] - angles[i - 1])
  maxGap = Math.max(maxGap, angles[0] + 2 * Math.PI - angles[angles.length - 1])
  return { n: angles.length, maxGapDeg: (maxGap * 180) / Math.PI }
}
const covFront = ringCoverage(0),
  covHub = ringCoverage(LTB)

// name + appearance
const t = await api.tree({ refresh: true })
const solid = Object.values(t).find((n) => n.class === 'CC_Solid' && n.members?.consumed?.value === 0)
await api.v1.common.setObjectName({ id: solid.id, name: 'D35B13SS' })
const ap = await api.v1.common.setAppearance({ id: partId, appearance: { color: [200, 204, 208], metalness: 0.9, roughness: 0.35 } })
return { chamferId: ch.result, rims, volume: mp.volume, covFront, covHub, solidId: solid.id, apLevel: ap.maxLevel }

// ══════ run_script: Fix appearance; full numeric verification of finished body ══════
const partId = 4
// appearance: try part.setAppearance
let ap = await api.v1.part.setAppearance({ id: partId, appearance: { color: '#c8ccd0' } })
if (ap.maxLevel >= 51) {
  ap = await api.v1.part.setAppearance({ id: partId, color: [200, 204, 208] })
}
log('appearance level', ap.maxLevel, JSON.stringify(ap.messages || []))

const IN = 25.4,
  N = 13,
  P = 0.375,
  Dr = 0.2
const Rp = (P / (2 * Math.sin(Math.PI / N))) * IN
const rootR = Rp - (Dr / 2) * IN,
  rBlank = Rp + (P / 4) * IN,
  boreR = (0.625 / 2) * IN
const t2 = 0.162 * IN,
  gap = (0.399 - 0.162) * IN,
  x2 = t2 + gap,
  x3 = 2 * t2 + gap,
  LTB = x3 + 0.5 * IN

const g = await api.graphic()
const meshes = g.containers.flatMap((c) => c.meshes ?? [])
const edges = g.containers.flatMap((c) => c.edges ?? []).filter((e) => e.id > 0)

// 1. root radius: min radial distance of vertices in the plate zone (0<x<t2)
let minRad = Infinity,
  maxRadPlate = 0
for (const m of meshes)
  for (let i = 0; i < m.vertices.length; i += 3) {
    const x = m.vertices[i],
      rad = Math.hypot(m.vertices[i + 1], m.vertices[i + 2])
    if (x > 0.3 && x < t2 - 0.3 && rad > 10) {
      minRad = Math.min(minRad, rad)
      maxRadPlate = Math.max(maxRadPlate, rad)
    }
  }
// 2. tip flat at blankOD/2: max radius overall
let maxRad = 0
for (const m of meshes)
  for (let i = 0; i < m.vertices.length; i += 3) maxRad = Math.max(maxRad, Math.hypot(m.vertices[i + 1], m.vertices[i + 2]))
// 3. plate faces: distinct x values of large flat faces
const xs = new Set()
for (const m of meshes) {
  let x0 = m.vertices[0],
    flat = true
  for (let i = 0; i < m.vertices.length; i += 3)
    if (Math.abs(m.vertices[i] - x0) > 1e-6) {
      flat = false
      break
    }
  if (flat && m.vertices.length > 30) xs.add(Math.round(x0 * 10000) / 10000)
}
// 4. bore radius: min radius anywhere
let minBore = Infinity
for (const m of meshes)
  for (let i = 0; i < m.vertices.length; i += 3) {
    const rad = Math.hypot(m.vertices[i + 1], m.vertices[i + 2])
    if (rad > 1) minBore = Math.min(minBore, rad)
  }
// 5. count tooth spaces: at plate mid (x=t2/2), sample edge/vertex angular distribution at radius > rootR
// count distinct cut regions via seat arcs: vertices at radius ≈ rootR
let seatAngles = []
for (const m of meshes)
  for (let i = 0; i < m.vertices.length; i += 3) {
    const x = m.vertices[i],
      rad = Math.hypot(m.vertices[i + 1], m.vertices[i + 2])
    if (Math.abs(rad - rootR) < 0.15 && x > 0 && x < t2) seatAngles.push(Math.atan2(m.vertices[i + 2], m.vertices[i + 1]))
  }
seatAngles.sort((a, b) => a - b)
let clusters = 0,
  last = -10
for (const a of seatAngles) {
  if (a - last > 0.15) clusters++
  last = a
}
// hub face + screw hole: vertices at x≈screwV, z near rHub on +z? screw along +Z world (Top plane UP)
const scrV = x3 + (0.5 * IN) / 2
let screwFound = false
for (const m of meshes)
  for (let i = 0; i < m.vertices.length; i += 3) {
    const x = m.vertices[i],
      y = m.vertices[i + 1],
      z = m.vertices[i + 2]
    if (Math.abs(x - scrV) < 3 && z > boreR && Math.hypot(x - scrV, y) < (0.25 / 2) * IN + 0.1 && Math.hypot(y, z) < 14.2) screwFound = true
  }
const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
const solids = Object.values(await api.tree({ refresh: true })).filter((n) => n.class === 'CC_Solid' && n.members?.consumed?.value === 0)
return {
  appLevel: ap.maxLevel,
  rootRadius: [minRad, rootR],
  tipRadius: [maxRad, rBlank],
  plateFacesX: [...xs].sort((a, b) => a - b),
  expectedX: [0, t2, x2, x3, LTB],
  boreRadius: [minBore, boreR],
  toothSpaceClusters: clusters,
  screwFound,
  volume: mp.volume,
  liveSolids: solids.map((s) => s.id),
}

// ══════ run_script: Brep probe for root radius + tooth count; set appearance with target ══════
const partId = 4
// appearance with target param
let ap = await api.v1.common.setAppearance({ target: partId, appearance: { color: [200, 204, 208], metalness: 0.9, roughness: 0.35 } })
if (ap.maxLevel >= 51) {
  ap = await api.v1.part.setAppearance({ target: partId, appearance: { color: [200, 204, 208] } })
}
log('app', ap.maxLevel, JSON.stringify(ap.messages || []).slice(0, 200))

const IN = 25.4,
  N = 13,
  P = 0.375,
  Dr = 0.2
const Rp = (P / (2 * Math.sin(Math.PI / N))) * IN,
  Rseat = (0.5025 * Dr + 0.0015) * IN
const seatBottom = Rp - Rseat // 17.3097 deepest point of tooth space
const t2 = 0.162 * IN

// relaxed mesh probe: ALL vertices in x in [−0.01, t2+0.01], find min radius >10
const g = await api.graphic()
const meshes = g.containers.flatMap((c) => c.meshes ?? [])
let minRad = Infinity
let seatAngles = []
for (const m of meshes)
  for (let i = 0; i < m.vertices.length; i += 3) {
    const x = m.vertices[i],
      y = m.vertices[i + 1],
      z = m.vertices[i + 2]
    const rad = Math.hypot(y, z)
    if (x > -0.01 && x < t2 + 0.01 && rad > 10) {
      if (rad < minRad) minRad = rad
      if (Math.abs(rad - seatBottom) < 0.3) seatAngles.push(Math.atan2(z, y))
    }
  }
seatAngles.sort((a, b) => a - b)
let clusters = seatAngles.length ? 1 : 0
for (let i = 1; i < seatAngles.length; i++) if (seatAngles[i] - seatAngles[i - 1] > 0.2) clusters++
if (seatAngles.length && seatAngles[0] + 2 * Math.PI - seatAngles[seatAngles.length - 1] < 0.2 && clusters > 1) clusters--

// independent tooth-space count via edges crossing rBlank... simpler: count topping/tip flats:
// vertices at max radius (tip flats) — count angular clusters
const rBlank = Rp + (P / 4) * IN
let tipAngles = []
for (const m of meshes)
  for (let i = 0; i < m.vertices.length; i += 3) {
    const x = m.vertices[i],
      rad = Math.hypot(m.vertices[i + 1], m.vertices[i + 2])
    if (x > -0.01 && x < t2 + 0.01 && Math.abs(rad - rBlank) < 0.01) tipAngles.push(Math.atan2(m.vertices[i + 2], m.vertices[i + 1]))
  }
tipAngles.sort((a, b) => a - b)
let tipClusters = tipAngles.length ? 1 : 0
for (let i = 1; i < tipAngles.length; i++) if (tipAngles[i] - tipAngles[i - 1] > 0.1) tipClusters++
if (tipAngles.length && tipAngles[0] + 2 * Math.PI - tipAngles[tipAngles.length - 1] < 0.1 && tipClusters > 1) tipClusters--

return {
  appLevel: ap.maxLevel,
  minRadFrontPlate: [minRad, seatBottom],
  seatClusters: clusters,
  tipFlatClusters: tipClusters,
  nSeatVerts: seatAngles.length,
}

// ══════ run_script: Appearance on tip feature; snapshot-ready ══════
const ap = await api.v1.common.setAppearance({ target: 26718, appearance: { color: [203, 207, 212], metalness: 0.85, roughness: 0.3 } })
return { level: ap.maxLevel, msgs: ap.messages }

// ══════ run_script: Regen test 1: boreIn 0.625→0.75 — bore rim + chamfer must follow ══════
const partId = 4
const volBefore = (await api.v1.part.calculateMassProperties({ id: partId })).result.volume
const u = await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'boreIn', value: 0.75 }] })
if (u.result !== 1) throw new Error('update failed: ' + JSON.stringify(u.messages))
const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
const IN = 25.4,
  newBoreR = (0.75 / 2) * IN,
  chamf = 0.03 * IN,
  LTB = 26.9494
// probe mesh: min radius (should be newBoreR), chamfer ring radius at faces
const g = await api.graphic()
const meshes = g.containers.flatMap((c) => c.meshes ?? [])
let minRad = Infinity
for (const m of meshes)
  for (let i = 0; i < m.vertices.length; i += 3) {
    const rad = Math.hypot(m.vertices[i + 1], m.vertices[i + 2])
    if (rad > 1 && rad < minRad) minRad = rad
  }
// chamfer outer ring at x=0 and x=LTB: radius should be newBoreR+chamf
function faceRingRad(xFace) {
  let best = null
  for (const m of meshes) {
    let flat = true
    for (let i = 0; i < m.vertices.length; i += 3)
      if (Math.abs(m.vertices[i] - xFace) > 1e-6) {
        flat = false
        break
      }
    if (!flat) continue
    // min radius on this flat face = inner rim = chamfer outer edge
    for (let i = 0; i < m.vertices.length; i += 3) {
      const rad = Math.hypot(m.vertices[i + 1], m.vertices[i + 2])
      if (rad > 1 && (best === null || rad < best)) best = rad
    }
  }
  return best
}
const rimFront = faceRingRad(0),
  rimHub = faceRingRad(LTB)
// expected volume delta ~ annulus removed: pi*(R2^2-R1^2)*LTB minus keyway overlap change... rough directional check
const dVexp = -Math.PI * (newBoreR ** 2 - ((0.625 / 2) * IN) ** 2) * LTB
const solids = Object.values(await api.tree({ refresh: true })).filter((n) => n.class === 'CC_Solid' && n.members?.consumed?.value === 0)
return {
  volBefore,
  volAfter: mp.volume,
  dV: mp.volume - volBefore,
  dVexpectedApprox: dVexp,
  minBoreRad: [minRad, newBoreR],
  chamferRingFront: [rimFront, newBoreR + chamf],
  chamferRingHub: [rimHub, newBoreR + chamf],
  liveSolids: solids.map((s) => s.id),
}

// ══════ run_script: Regen test 2: hubProjIn 0.5→0.7 — hub face + screw position cascade ══════
const partId = 4
const volBefore = (await api.v1.part.calculateMassProperties({ id: partId })).result.volume
const u = await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'hubProjIn', value: 0.7 }] })
if (u.result !== 1) throw new Error('update failed')
const IN = 25.4,
  t2 = 0.162 * IN,
  gap = (0.399 - 0.162) * IN,
  x3 = 2 * t2 + gap
const newLTB = x3 + 0.7 * IN,
  newScrV = x3 + (0.7 * IN) / 2,
  newBoreR = (0.75 / 2) * IN,
  chamf = 0.03 * IN
const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
const b = await api.structure.calculateProductBounds(partId)
// screw hole center: cylindrical face whose axis || Z at x=newScrV → probe vertices of screw bore wall
const g = await api.graphic()
const meshes = g.containers.flatMap((c) => c.meshes ?? [])
let scrXs = []
for (const m of meshes) {
  // screw hole wall: all vertices satisfy hypot(x-cx, y)≈scrR for some cx; detect via all |y|<=scrR+tol and x within hub zone and z>boreR
  let ok = true,
    xs = []
  for (let i = 0; i < m.vertices.length; i += 3) {
    const x = m.vertices[i],
      y = m.vertices[i + 1],
      z = m.vertices[i + 2]
    if (!(z > newBoreR - 1 && x > x3 - 1 && x < newLTB + 1 && Math.abs(y) < (0.25 / 2) * IN + 0.05)) {
      ok = false
      break
    }
    xs.push(x)
  }
  if (ok && xs.length > 6) scrXs.push(...xs)
}
const scrCenter = scrXs.length ? (Math.min(...scrXs) + Math.max(...scrXs)) / 2 : null
// hub face chamfer ring
function faceRingRad(xFace) {
  let best = null
  for (const m of meshes) {
    let flat = true
    for (let i = 0; i < m.vertices.length; i += 3)
      if (Math.abs(m.vertices[i] - xFace) > 1e-5) {
        flat = false
        break
      }
    if (!flat) continue
    for (let i = 0; i < m.vertices.length; i += 3) {
      const rad = Math.hypot(m.vertices[i + 1], m.vertices[i + 2])
      if (rad > 1 && (best === null || rad < best)) best = rad
    }
  }
  return best
}
const rimHub = faceRingRad(newLTB)
const dVexp = 0.2 * IN * (Math.PI * (((1.109375 / 2) * IN) ** 2 - newBoreR ** 2)) // added hub ring length minus keyway/screw adjustments
const solids = Object.values(await api.tree({ refresh: true })).filter((n) => n.class === 'CC_Solid' && n.members?.consumed?.value === 0)
return {
  dV: mp.volume - volBefore,
  dVexpApprox: dVexp,
  xMax: [b.max.x, newLTB],
  screwCenterX: [scrCenter, newScrV],
  chamferRingHub: [rimHub, newBoreR + chamf],
  liveSolids: solids.map((s) => s.id),
}

// ══════ run_script: Regen test 3: teeth 13→14→15 stepwise; verify 15-tooth form ══════
const partId = 4
const volBefore = (await api.v1.part.calculateMassProperties({ id: partId })).result.volume
const steps = []
for (const n of [14, 15]) {
  const u = await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'teeth', value: n }] })
  if (u.result !== 1) throw new Error('teeth ' + n + ' failed: ' + JSON.stringify(u.messages))
  const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
  steps.push({ n, vol: mp ? mp.volume : null })
}
const IN = 25.4,
  N = 15,
  P = 0.375
const Rp = (P / (2 * Math.sin(Math.PI / N))) * IN,
  rBlank = Rp + (P / 4) * IN,
  t2 = 0.162 * IN
const b = await api.structure.calculateProductBounds(partId)
// count tip flats at 15
const g = await api.graphic()
const meshes = g.containers.flatMap((c) => c.meshes ?? [])
let tipAngles = [],
  maxRad = 0
for (const m of meshes)
  for (let i = 0; i < m.vertices.length; i += 3) {
    const x = m.vertices[i],
      rad = Math.hypot(m.vertices[i + 1], m.vertices[i + 2])
    maxRad = Math.max(maxRad, rad)
    if (x > -0.01 && x < t2 + 0.01 && Math.abs(rad - rBlank) < 0.01) tipAngles.push(Math.atan2(m.vertices[i + 2], m.vertices[i + 1]))
  }
tipAngles.sort((a, b) => a - b)
let tips = tipAngles.length ? 1 : 0
for (let i = 1; i < tipAngles.length; i++) if (tipAngles[i] - tipAngles[i - 1] > 0.08) tips++
if (tipAngles.length && tipAngles[0] + 2 * Math.PI - tipAngles[tipAngles.length - 1] < 0.08 && tips > 1) tips--
const solids = Object.values(await api.tree({ refresh: true })).filter((n) => n.class === 'CC_Solid' && n.members?.consumed?.value === 0)
return {
  volBefore,
  steps,
  tipRadius: [maxRad, rBlank],
  tipFlatCount: tips,
  radialBound: [b.max.y, rBlank],
  liveSolids: solids.map((s) => s.id),
}

// ══════ run_script: Revert to catalog values (stepwise teeth), final full verification ══════
const partId = 4
for (const n of [14, 13]) {
  const u = await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'teeth', value: n }] })
  if (u.result !== 1) throw new Error('teeth ' + n + ' failed')
}
let u = await api.v1.part.updateExpression({
  id: partId,
  toUpdate: [
    { name: 'boreIn', value: 0.625 },
    { name: 'hubProjIn', value: 0.5 },
  ],
})
if (u.result !== 1) throw new Error('revert failed')
const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
const b = await api.structure.calculateProductBounds(partId)
const IN = 25.4,
  N = 13,
  P = 0.375,
  Dr = 0.2
const Rp = (P / (2 * Math.sin(Math.PI / N))) * IN,
  rBlank = Rp + (P / 4) * IN,
  boreR = (0.625 / 2) * IN,
  chamf = 0.03 * IN
const t2 = 0.162 * IN,
  gap = (0.399 - 0.162) * IN,
  x2 = t2 + gap,
  x3 = 2 * t2 + gap,
  LTB = x3 + 0.5 * IN
const g = await api.graphic()
const meshes = g.containers.flatMap((c) => c.meshes ?? [])
let minRad = Infinity,
  maxRad = 0
const xs = new Set()
for (const m of meshes) {
  let x0 = m.vertices[0],
    flat = true
  for (let i = 0; i < m.vertices.length; i += 3) {
    const x = m.vertices[i],
      rad = Math.hypot(m.vertices[i + 1], m.vertices[i + 2])
    if (rad > 1 && rad < minRad) minRad = rad
    if (rad > maxRad) maxRad = rad
    if (Math.abs(x - x0) > 1e-6) flat = false
  }
  if (flat && m.vertices.length > 30) xs.add(Math.round(x0 * 10000) / 10000)
}
function faceRingRad(xFace) {
  let best = null
  for (const m of meshes) {
    let flat = true
    for (let i = 0; i < m.vertices.length; i += 3)
      if (Math.abs(m.vertices[i] - xFace) > 1e-5) {
        flat = false
        break
      }
    if (!flat) continue
    for (let i = 0; i < m.vertices.length; i += 3) {
      const rad = Math.hypot(m.vertices[i + 1], m.vertices[i + 2])
      if (rad > 1 && (best === null || rad < best)) best = rad
    }
  }
  return best
}
const solids = Object.values(await api.tree({ refresh: true })).filter((n) => n.class === 'CC_Solid' && n.members?.consumed?.value === 0)
return {
  volFinal: mp.volume,
  volBaseline: 15179.327560869273,
  boreRim: [minRad, boreR],
  tip: [maxRad, rBlank],
  chamferFront: [faceRingRad(0), boreR + chamf],
  chamferHub: [faceRingRad(LTB), boreR + chamf],
  plateFaces: [...xs].sort((a, b) => a - b),
  plateExpected: [0, t2, x2, x3, LTB],
  bounds: [b.min.x, b.max.x],
  liveSolids: solids.map((s) => s.id),
}
