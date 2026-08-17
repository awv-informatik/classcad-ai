/**
 * _buildB.mjs — variant B: TRUE parametric sprocket (35B-N-SS, single strand,
 * style B, full feature set). All driving values live in the expression set;
 * sketches are constrained with @expr-bound dims (live through the consumed
 * boolean chain), and the tooth pattern uses merged:1 so its single-brep tool
 * keeps count/angle live through the subtraction as well. Every model
 * parameter regenerates in-tree, including tooth count (stepwise for branch
 * safety, see journal).
 */
import { EXPRESSIONS, buildParametricToothSketch, verifyAgainstAnalytic } from './_sketchB.mjs'
import { inch, sprocketSpec, mcVolume } from './_model.mjs'

export const BASIS = { axisDir: [1, 0, 0], uDir: [0, 0, 1], wDir: [0, -1, 0] }
const mm = (v) => v * inch
const ok = (r, what) => {
  if (!r || r.maxLevel > 31 || r.result === null || r.result === undefined)
    throw new Error(`${what} failed: ${r?.maxLevel} ${JSON.stringify(r?.messages ?? [])}`)
  return r.result
}

export const BODY_EXPRESSIONS = [
  { name: 'boreIn', value: 1.0 },
  { name: 'hubProjIn', value: 0.5 },
  { name: 't1mm', value: '0.168*inchF' },
  { name: 'blankR', value: 'blankOD/2' },
  { name: 'hubRmm', value: '(2+5/64)/2*inchF' }, // Martin max hub 21T; independent knob
  { name: 'LTBmm', value: 't1mm+hubProjIn*inchF' },
  { name: 'boreDmm', value: 'boreIn*inchF' },
  { name: 'kwWmm', value: '0.25*inchF' },
  { name: 'kwW2mm', value: 'kwWmm/2' },
  { name: 'kwDmm', value: '0.125*inchF' },
  { name: 'kwY0mm', value: 'boreDmm/2-1.27' },
  { name: 'kwHmm', value: 'kwDmm+1.27' },
  { name: 'toothAngle', value: '2*C:PI/teeth' },
  // tip taper (P/2 radial × P/8 lateral per side → slope 1/4), set screws, chamfer
  { name: 'taperR0', value: 'blankOD/2-P/2' },
  { name: 'taperR1', value: 'blankOD/2+2.5' },
  { name: 'taperDz', value: '(taperR1-taperR0)/4' },
  { name: 'screwDmm', value: '0.3125*inchF' }, // 5/16 for the 15/16..1-1/4 bore band
  { name: 'screwVmm', value: 't1mm+(hubProjIn*inchF)/2' },
  { name: 'chamfMm', value: '0.03*inchF' },
]

/** spec for MC verification, shifted so the plate front face sits at v=0. */
export function mcSpec({ teeth, bore, hubProj }) {
  // hubDia is a FIXED expression in the B model (2 5/64") — pin it here too,
  // else sprocketSpec would look up the catalog max hub for the new tooth count
  const spec = sprocketSpec({ teeth, strands: 1, hubStyle: 'B', bore, hubProj, hubDia: 2.078125, keyway: true, setScrews: 2, boreChamfer: 0 })
  const shift = spec.stackW / 2
  for (const s of spec.segs) { s.v0 += shift; s.v1 += shift }
  for (const p of spec.plates) { p.v0 += shift; p.v1 += shift }
  spec.vMin += shift; spec.vMax += shift
  spec.tapers = spec.tapers.map((tri) => tri.map(([r, v]) => [r, v + shift]))
  spec.screws = spec.screws.map((s) => ({ ...s, v: s.v + shift }))
  return spec
}

export async function buildParametricSprocket(api, { filewrite }, { teeth = 21 } = {}) {
  const report = { steps: [], checks: [] }
  const partR = await api.v1.part.create({ name: `35B${teeth}SS-param` })
  const partId = partR.result
  const find = (cls, name) => Object.values(partR.structure.tree).find((o) => o.class === cls && o.name === name).id
  const planes = { Top: find('CC_WorkPlane', 'Top'), Front: find('CC_WorkPlane', 'Front'), Right: find('CC_WorkPlane', 'Right') }
  const xAxis = find('CC_WorkAxis', 'XAxis')

  // ---- expression graph (tooth form + body)
  ok(await api.v1.part.expression({ id: partId, toCreate: [...EXPRESSIONS, ...BODY_EXPRESSIONS] }), 'expressions')
  if (teeth !== 21) ok(await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'teeth', value: teeth }] }), 'set teeth')

  // ---- set screws: constrained circles on Top (+Z) and Front (+Y), @expr dims
  const screwCircRefs = []
  for (const [i, plane] of ['Top', 'Front'].entries()) {
    const skS = ok(await api.v1.sketch.create({ id: partId, planeId: planes[plane], name: `Screw${i}` }), `sketch screw${i}`)
    const sO = (await api.v1.sketch.point({ id: skS, pos: [0, 0, 0] })).result
    const hLine = (await api.v1.sketch.line({ id: skS, startPos: [0, 0, 0], endPos: [40, 0, 0], isConstruction: true })).result
    const circ = (await api.v1.sketch.circle({ id: skS, centerPos: [10.5, 0.2, 0], radius: 3.5 })).result
    ok(await api.v1.sketch.constraint([
      { id: skS, type: 'FIXATION', geomIds: [sO] },
      { id: skS, type: 'COINCIDENT', geomIds: [sO, hLine] },
      { id: skS, type: 'HORIZONTAL', geomIds: [hLine] },
      { id: skS, type: 'COINCIDENT', geomIds: [(await api.v1.sketch.getPoints({ id: circ })).result.centerId, hLine] },
    ]), `screw${i} constraints`)
    const ctrId = (await api.v1.sketch.getPoints({ id: circ })).result.centerId
    const dS = await api.v1.sketch.dimension([
      { id: skS, name: `sPos${i}`, type: 'HORIZONTAL_DISTANCE', geomIds: [sO, ctrId], value: '@expr.screwVmm' },
      { id: skS, name: `sDia${i}`, type: 'DIAMETER', geomIds: [circ], value: '@expr.screwDmm' },
    ])
    if (dS.maxLevel > 31) {
      // DIAGNOSIS: batch failed — probe single @expr, numeric, expression values
      const eV = (await api.v1.part.getExpression({ id: partId, name: 'screwVmm' })).result
      const eD = (await api.v1.part.getExpression({ id: partId, name: 'screwDmm' })).result
      const d1 = await api.v1.sketch.dimension({ id: skS, name: `sPosX${i}`, type: 'HORIZONTAL_DISTANCE', geomIds: [sO, ctrId], value: '@expr.screwVmm' })
      const d2 = await api.v1.sketch.dimension({ id: skS, name: `sDiaN${i}`, type: 'DIAMETER', geomIds: [circ], value: 7.94 })
      console.log(`[diag screw${i}] batch:${dS.maxLevel} exprVals: V=${eV?.value} D=${eD?.value} single@expr:${d1.maxLevel} singleNumeric:${d2.maxLevel}`)
      console.log(`[diag screw${i}] batch msgs:`, JSON.stringify((dS.messages ?? []).map((m) => m.message)))
      console.log(`[diag screw${i}] single msgs:`, JSON.stringify([...(d1.messages ?? []), ...(d2.messages ?? [])].map((m) => m.message)))
      filewrite({ batch: dS.maxLevel, single: d1.maxLevel, numeric: d2.maxLevel, eV, eD }, `diag-screw${i}`)
      throw new Error(`screw${i} dims failed (diagnosed)`)
    }
    screwCircRefs.push(circ)
  }


  // ---- constrained blank cross-section (Top plane; local x=v axial, y=r radial)
  // polygon p0(0,0) p1(0,R) p2(t1,R) p3(t1,hubR) p4(LTB,hubR) p5(LTB,0)
  const skB = ok(await api.v1.sketch.create({ id: partId, planeId: planes.Top, name: 'BlankSection' }), 'sketch blank')
  // rough seeds (perturbed) — dims drive the exact layout
  const t1s = 4.4, Rs = 35.2, hRs = 27.1, Ls = 17.4
  const gB = await api.v1.sketch.geometry({
    id: skB,
    lines: [
      { startPos: [0, 0, 0], endPos: [0, Rs, 0] },
      { startPos: [0, Rs, 0], endPos: [t1s, Rs, 0] },
      { startPos: [t1s, Rs, 0], endPos: [t1s, hRs, 0] },
      { startPos: [t1s, hRs, 0], endPos: [Ls, hRs, 0] },
      { startPos: [Ls, hRs, 0], endPos: [Ls, 0, 0] },
      { startPos: [Ls, 0, 0], endPos: [0, 0, 0] },
    ],
    genFixation: false, genIncidence: false, genTangency: false, genVertAndHoriz: false,
  })
  const BL = gB.result.lines
  const bp = []
  for (const id of BL) bp.push((await api.v1.sketch.getPoints({ id })).result)
  ok(await api.v1.sketch.constraint([
    { id: skB, type: 'FIXATION', geomIds: [bp[0].startId] },
    ...BL.map((id, i) => ({ id: skB, type: 'COINCIDENT', geomIds: [bp[i].endId, bp[(i + 1) % 6].startId] })),
    { id: skB, type: 'VERTICAL', geomIds: [BL[0]] },
    { id: skB, type: 'HORIZONTAL', geomIds: [BL[1]] },
    { id: skB, type: 'VERTICAL', geomIds: [BL[2]] },
    { id: skB, type: 'HORIZONTAL', geomIds: [BL[3]] },
    { id: skB, type: 'VERTICAL', geomIds: [BL[4]] },
    { id: skB, type: 'HORIZONTAL', geomIds: [BL[5]] },
  ]), 'blank constraints')
  const dB = await api.v1.sketch.dimension([
    { id: skB, name: 'bBlankR', type: 'OFFSET', geomIds: [BL[0]], value: '@expr.blankR' },
    { id: skB, name: 'bT1', type: 'OFFSET', geomIds: [BL[1]], value: '@expr.t1mm' },
    { id: skB, name: 'bHubR', type: 'VERTICAL_DISTANCE', geomIds: [bp[0].startId, bp[3].startId], value: '@expr.hubRmm' },
    { id: skB, name: 'bLTB', type: 'HORIZONTAL_DISTANCE', geomIds: [bp[0].startId, bp[4].startId], value: '@expr.LTBmm' },
  ])
  ok(dB, 'blank dims')
  const blankDims = { bBlankR: dB.result[0], bT1: dB.result[1], bHubR: dB.result[2], bLTB: dB.result[3] }

  const cutSpan = mm(2.2) // generous fixed span (not a regen knob)

  // ---- bore (sketch circle, @expr diameter) + keyway (constrained rect)
  const skBore = ok(await api.v1.sketch.create({ id: partId, planeId: planes.Right, name: 'BoreSketch' }), 'sketch bore')
  const pO2 = (await api.v1.sketch.point({ id: skBore, pos: [0, 0, 0] })).result
  const boreC = (await api.v1.sketch.circle({ id: skBore, centerPos: [0.3, -0.2, 0], radius: 11 })).result
  ok(await api.v1.sketch.constraint([
    { id: skBore, type: 'FIXATION', geomIds: [pO2] },
    { id: skBore, type: 'COINCIDENT', geomIds: [(await api.v1.sketch.getPoints({ id: boreC })).result.centerId, pO2] },
  ]), 'bore constraints')
  const dBore = ok(await api.v1.sketch.dimension({ id: skBore, name: 'dBore', type: 'DIAMETER', geomIds: [boreC], value: '@expr.boreDmm' }), 'bore dim')

  const skKey = ok(await api.v1.sketch.create({ id: partId, planeId: planes.Right, name: 'KeywaySketch' }), 'sketch key')
  const pO3 = (await api.v1.sketch.point({ id: skKey, pos: [0, 0, 0] })).result
  const kw = (await api.v1.sketch.rectangle({ id: skKey, startPos: [-3.3, 11.3, 0], endPos: [3.2, 15.0, 0] })).result
  const kp = []
  for (const id of kw) kp.push((await api.v1.sketch.getPoints({ id })).result)
  // rectangle() lines: [bottom, right, top, left] (probing: startPos corner first)
  ok(await api.v1.sketch.constraint([
    { id: skKey, type: 'FIXATION', geomIds: [pO3] },
    { id: skKey, type: 'HORIZONTAL', geomIds: [kw[0]] },
    { id: skKey, type: 'HORIZONTAL', geomIds: [kw[2]] },
    { id: skKey, type: 'VERTICAL', geomIds: [kw[1]] },
    { id: skKey, type: 'VERTICAL', geomIds: [kw[3]] },
  ]), 'key constraints')
  const dK = ok(await api.v1.sketch.dimension([
    { id: skKey, name: 'kW', type: 'OFFSET', geomIds: [kw[0]], value: '@expr.kwWmm' },
    { id: skKey, name: 'kH', type: 'OFFSET', geomIds: [kw[1]], value: '@expr.kwHmm' },
    { id: skKey, name: 'kX', type: 'HORIZONTAL_DISTANCE', geomIds: [pO3, kp[0].startId], value: '@expr.kwW2mm' },
    { id: skKey, name: 'kY', type: 'VERTICAL_DISTANCE', geomIds: [pO3, kp[0].startId], value: '@expr.kwY0mm' },
  ]), 'key dims')

  // ---- tip tapers: constrained triangles (Top plane), revolve tools
  // front face at v=0, back face at v=t1; slope 1/4 via taperDz expression
  const skTap = ok(await api.v1.sketch.create({ id: partId, planeId: planes.Top, name: 'TaperSection' }), 'sketch taper')
  const tapO = (await api.v1.sketch.point({ id: skTap, pos: [0, 0, 0] })).result
  const vLine = (await api.v1.sketch.line({ id: skTap, startPos: [0, 0, 0], endPos: [0, 45, 0], isConstruction: true })).result
  await api.v1.sketch.constraint([
    { id: skTap, type: 'FIXATION', geomIds: [tapO] },
    { id: skTap, type: 'COINCIDENT', geomIds: [tapO, vLine] },
    { id: skTap, type: 'VERTICAL', geomIds: [vLine] },
  ])
  const taperLineRefs = []
  // rough seeds near the analytic 21T values (mm): r0≈29.6, r1≈36.8, dz≈1.8
  const seeds = [
    [[0, 29.5], [0, 36.9], [1.9, 36.9]], // front: apex on v=0, corner3 at +v
    [[4.3, 29.5], [4.3, 36.9], [2.4, 36.9]], // back: apex at v=t1, corner3 at −v
  ]
  for (const [t, tri] of seeds.entries()) {
    const gT = await api.v1.sketch.geometry({
      id: skTap,
      lines: [0, 1, 2].map((i) => ({
        startPos: [tri[i][0], tri[i][1], 0], endPos: [tri[(i + 1) % 3][0], tri[(i + 1) % 3][1], 0],
      })),
      genFixation: false, genIncidence: false, genTangency: false, genVertAndHoriz: false,
    })
    const TL = gT.result.lines
    const tp = []
    for (const id of TL) tp.push((await api.v1.sketch.getPoints({ id })).result)
    const cons = [
      ...TL.map((id, i) => ({ id: skTap, type: 'COINCIDENT', geomIds: [tp[i].endId, tp[(i + 1) % 3].startId] })),
      { id: skTap, type: 'VERTICAL', geomIds: [TL[0]] }, // apex→corner2 at constant v
      { id: skTap, type: 'HORIZONTAL', geomIds: [TL[1]] }, // corner2→corner3 at r1
    ]
    // anchor apex axially: front on the fixed v=0 line, back via HD to origin
    if (t === 0) cons.push({ id: skTap, type: 'COINCIDENT', geomIds: [tp[0].startId, vLine] })
    ok(await api.v1.sketch.constraint(cons), `taper${t} constraints`)
    const dimsT = [
      { id: skTap, name: `tApexR${t}`, type: 'VERTICAL_DISTANCE', geomIds: [tapO, tp[0].startId], value: '@expr.taperR0' },
      { id: skTap, name: `tR1_${t}`, type: 'VERTICAL_DISTANCE', geomIds: [tapO, tp[1].startId], value: '@expr.taperR1' },
      { id: skTap, name: `tDz${t}`, type: 'HORIZONTAL_DISTANCE', geomIds: [tp[1].startId, tp[2].startId], value: '@expr.taperDz' },
    ]
    if (t === 1) dimsT.push({ id: skTap, name: 'tBackV', type: 'HORIZONTAL_DISTANCE', geomIds: [tapO, tp[0].startId], value: '@expr.t1mm' })
    ok(await api.v1.sketch.dimension(dimsT), `taper${t} dims`)
    taperLineRefs.push(TL)
  }

  // ---- constrained tooth-space sketch (Right plane)
  const tooth = await buildParametricToothSketch(api, partId, planes.Right, { seedN: teeth, perturb: true })
  if (tooth.error) throw new Error('tooth sketch: ' + JSON.stringify(tooth.error))

  // ---- FEATURE PHASE (all sketches + dims exist; now create the tools).
  // Order matters: building features interleaved with sketch dims made LATER
  // @expr dims refuse values ("Couldn't set the value") — see journal § order.
  const blankRev = ok(await api.v1.part.revolve({ id: partId, name: 'Blank', references: BL, axisIds: [xAxis] }), 'revolve blank')
  const toothExt = ok(await api.v1.part.extrusion({
    id: partId, name: 'ToothSpace', references: tooth.profileRefs, type: 'SYMMETRIC', limit2: cutSpan,
  }), 'tooth extrude')
  // merged: 1 → the pattern emits ONE brep; the subtraction then references a
  // single tool and stays independent of the instance count — count/angle
  // @expr updates regenerate through the boolean (rainer; verified 05-probe)
  const pat = ok(await api.v1.part.circularPattern({
    id: partId, name: 'ToothPattern', targets: [toothExt], references: [xAxis],
    angle: '@expr.toothAngle', count: '@expr.teeth', merged: 1,
  }), 'pattern')
  const boreExt = ok(await api.v1.part.extrusion({
    id: partId, name: 'Bore', references: [boreC], type: 'SYMMETRIC', limit2: cutSpan,
  }), 'bore extrude')
  const keyExt = ok(await api.v1.part.extrusion({
    id: partId, name: 'Keyway', references: kw, type: 'SYMMETRIC', limit2: cutSpan,
  }), 'key extrude')
  const taperIds = []
  for (const [t, TL] of taperLineRefs.entries())
    taperIds.push(ok(
      await api.v1.part.revolve({ id: partId, name: `TipTaper${t}`, references: TL, axisIds: [xAxis] }),
      `taper${t} revolve`,
    ))
  const screwIds = []
  for (const [i, circ] of screwCircRefs.entries())
    screwIds.push(ok(
      await api.v1.part.extrusion({ id: partId, name: `SetScrew${i + 1}`, references: [circ], type: 'UP', limit2: mm(1.14) }),
      `screw${i} extrude`,
    ))

  // ---- one subtraction
  const boolR = await api.v1.part.boolean({
    id: partId, type: 'SUBTRACTION', name: 'Body',
    target: blankRev, tools: [pat, boreExt, keyExt, ...taperIds, ...screwIds],
  })
  if (boolR.maxLevel > 31) throw new Error('boolean: ' + JSON.stringify(boolR.messages))
  await api.v1.common.recalc({})
  report.steps.push({ boolean: boolR.result })
  report.patId = pat

  // ---- bore chamfer (feature on the tip; edge refs collected by azimuth sweep,
  // distance @expr-bound). THE open question: does it survive bore regen?
  const bMM = (await api.v1.part.getExpression({ id: partId, name: 'boreDmm' })).result.value
  const lMM = (await api.v1.part.getExpression({ id: partId, name: 'LTBmm' })).result.value
  const rims = new Set()
  const rimDir = (thDeg) => {
    const th = (thDeg * Math.PI) / 180
    return [0, -Math.sin(th), Math.cos(th)] // (uDir=+Z, wDir=−Y) frame
  }
  for (const v of [0, lMM]) {
    for (const th of [0, 45, 135, 180, 225, 315]) {
      const d = rimDir(th)
      const pos = [v, (bMM / 2) * d[1], (bMM / 2) * d[2]]
      const rr = (await api.v1.part.getGeometryIds({ id: partId, arcs: [{ pos }], circles: [{ pos }] })).result
      for (const id of [...(rr?.arcs ?? []), ...(rr?.circles ?? [])].flat().filter((x) => typeof x === 'number')) {
        if (rims.has(id)) continue
        const gp = (await api.v1.part.getGeometryPositions({ elems: [id] })).result?.[0]
        const q = gp?.positions?.[0]
        if (q && Math.abs(Math.hypot(q.y, q.z) - bMM / 2) < 0.05 && (Math.abs(q.x - 0) < 0.05 || Math.abs(q.x - lMM) < 0.05))
          rims.add(id)
      }
    }
  }
  let chamferId = null
  if (rims.size) {
    const chR = await api.v1.part.chamfer({
      id: partId, name: 'BoreChamfer', references: [...rims],
      type: 'EQUAL_DISTANCE', distance1: '@expr.chamfMm',
    })
    chamferId = chR.result
    report.steps.push({ chamfer: chamferId, level: chR.maxLevel, edges: rims.size })
    await api.v1.common.recalc({})
  } else report.checks.push({ label: 'chamfer-edges', ok: false, reason: 'rims not found' })

  // ---- mate connector + stainless appearance (parity with the generated variant)
  await api.v1.part.workCSys({ id: partId, name: 'MateConnector', offset: [0, 0, 0], rotation: [0, Math.PI / 2, 0] })
  if (chamferId) await api.v1.part.setAppearance({ target: chamferId, color: [199, 202, 209] })

  return { partId, tooth, blankDims, dims: { dBore, ...tooth.dims }, report, bodyId: boolR.result, chamferId }
}

/** probe the chamfer outer edge ring (radius rb+c on both end faces) */
export async function chamferRingCheck(api, partId, { bore, chamfer, LTB }, report, label) {
  const rc = mm(bore / 2 + chamfer)
  let worst = 0
  for (const v of [0, mm(LTB)]) {
    for (const th of [0, 135, 225, 315]) {
      const t = (th * Math.PI) / 180
      const pos = [v, -Math.sin(t) * rc, Math.cos(t) * rc]
      const rr = (await api.v1.part.getGeometryIds({ id: partId, arcs: [{ pos }], circles: [{ pos }] })).result
      const cands = [...(rr?.arcs ?? []), ...(rr?.circles ?? [])].flat().filter((x) => typeof x === 'number')
      let best = Infinity
      if (cands.length) {
        const gps = (await api.v1.part.getGeometryPositions({ elems: cands })).result ?? []
        for (const gp of gps)
          for (const q of gp?.positions ?? [])
            best = Math.min(best, Math.max(Math.abs(Math.hypot(q.y, q.z) - rc), Math.abs(q.x - v)))
      }
      worst = Math.max(worst, best)
    }
  }
  report.checks.push({ label: `${label}:chamfer-ring`, ok: worst < 0.06, worstErrMM: +worst.toFixed(5) })
}

/** brep checks: root radius + tip corner + bore radius for tooth count N, bore b (inches) */
export async function brepChecks(api, partId, { teeth, bore, hubProj, chamfer = 0 }, report, label) {
  const spec = mcSpec({ teeth, bore, hubProj })
  const tf = spec.tf
  const pl = spec.plates[0]
  const probe = async (name, posIn, { radial, atX }) => {
    const pos = posIn.map(mm)
    const rr = (await api.v1.part.getGeometryIds({ id: partId, arcs: [{ pos }], circles: [{ pos }], lines: [{ pos }] })).result
    const cands = [...(rr?.arcs ?? []), ...(rr?.circles ?? []), ...(rr?.lines ?? [])].flat().filter((x) => typeof x === 'number')
    let best = null
    if (cands.length) {
      const gps = (await api.v1.part.getGeometryPositions({ elems: cands })).result ?? []
      for (const gp of gps)
        for (const q of gp?.positions ?? []) {
          let err = 0
          if (radial !== undefined) err = Math.max(err, Math.abs(Math.hypot(q.y, q.z) / inch - radial))
          if (atX !== undefined) err = Math.max(err, Math.abs(q.x / inch - atX))
          if (!best || err < best) best = err
        }
    }
    report.checks.push({ label: `${label}:${name}`, ok: best !== null && best < 2e-3, errIn: best })
  }
  await probe('root', [pl.v0, -tf.rootR, 0], { radial: tf.rootR, atX: pl.v0 })
  // tip-flat corner sits at v0 + P/8 now (tip taper present, like the generated variant)
  const th = Math.PI / teeth
  const P8 = spec.P / 8
  await probe('tipcorner', [pl.v0 + P8, -tf.Ro * Math.cos(th), -tf.Ro * Math.sin(th)], { radial: tf.Ro, atX: pl.v0 + P8 })
  // bore rim is chamfered away — verify the bore WALL radius mid-plate instead
  {
    const rb = bore / 2, vP = pl.v0 + (pl.v1 - pl.v0) / 2
    const rr = (await api.v1.part.getGeometryIds({
      id: partId, cylinders: [{ positions: [[mm(vP), mm(rb), 0], [mm(vP), 0, mm(rb)]] }],
    })).result?.cylinders?.flat().filter((x) => typeof x === 'number')
    let okW = false, radErr = null
    if (rr?.length) {
      const gp = (await api.v1.part.getGeometryPositions({ elems: [rr[0]] })).result?.[0]
      const pts = gp?.positions ?? []
      if (pts.length) {
        radErr = Math.max(...pts.map((q) => Math.abs(Math.hypot(q.y, q.z) / inch - rb)))
        okW = radErr < 2e-3
      }
    }
    report.checks.push({ label: `${label}:borewall`, ok: okW, radErrIn: radErr })
  }

  await api.v1.common.recalc({})
  const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
  const volIn3 = mp.volume / inch ** 3
  const mc = mcVolume(spec, BASIS, 300000)
  const chamferVol = chamfer > 0 ? 2 * Math.PI * (bore / 2) * chamfer ** 2 : 0
  const expected = mc.volume - chamferVol
  const dev = Math.abs(volIn3 - expected) / expected
  report.checks.push({ label: `${label}:volume`, ok: dev < 0.025, cadIn3: +volIn3.toFixed(5), mcAdjIn3: +expected.toFixed(5), devPct: +(dev * 100).toFixed(2) })
  return volIn3
}
