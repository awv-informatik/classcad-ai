// REPRO: v1.sketch.preTrim hangs the worker (100% CPU, runaway memory, process death)
//
// Found 2026-08-17 by an agent following SKILL SKETCHING step 5 verbatim on a
// fully constrained sprocket tooth-space sketch. The preTrim request never
// returns; the worker spins at 99-100% CPU with growing RSS until the process
// dies (~45 min on an M-series Mac). Every other session on the same worker
// times out from that moment on.
//
// Sketch shape (all solver-driven, lgsState fine before the call):
//   - fixed origin point, vertical construction centerline
//   - construction pitch CIRCLE (radius Rp, RADIUS dim @expr-bound)
//   - seating CIRCLE whose center is COINCIDENT on the pitch circle AND the
//     centerline (radius Rs, @expr-bound)
//   - two flank LINES: TANGENT to the seating circle + start point COINCIDENT
//     ON the seating circle, ends joined to a HORIZONTAL cap line (SYMMETRY
//     about the centerline, HORIZONTAL_/VERTICAL_DISTANCE dims @expr-bound)
//
// Run:  node scripts/run.mjs workspace/repro/2026-08-17-pretrim-hang/repro.mjs \
//         --outdir /tmp/pretrim-repro --port 9095
// (use a DISPOSABLE worker — expect to kill it afterwards)

export default async function (api) {
  const log = (...a) => console.log(...a)
  // ── 1. part + expression graph (ANSI 35, 15T) ──────────────────────────────
  const partId = (await api.v1.part.create({ name: 'Sprocket35' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'P', value: 9.525 },
      { name: 'Dr', value: 5.08 },
      { name: 'N', value: 15 },
      { name: 'W', value: 9.4 },
      { name: 'B', value: 16 },
      { name: 'Rp', value: 'P/(2*sin(C:PI/N))' },
      { name: 'Rs', value: '0.505*Dr' },
      { name: 'OD', value: 'P*(0.6+cos(C:PI/N)/sin(C:PI/N))' },
      { name: 'flankAng', value: '(35-60/N)*C:PI/180' },
      { name: 'capY', value: 'OD/2+P/2' },
      { name: 'capW', value: '2*(Rs/cos(flankAng)+(capY-Rp)*sin(flankAng)/cos(flankAng))' },
    ],
  })
  const E = async n => (await api.v1.part.getExpression({ id: partId, name: n })).result.value
  const [Rp, Rs, a, capY, capW] = await Promise.all(['Rp', 'Rs', 'flankAng', 'capY', 'capW'].map(E))

  // ── 1b. blank (same pre-state as the original session: a second sketch with
  // a FIXATION + @expr DIAMETER dim, extruded) ───────────────────────────────
  const t = await api.tree({ refresh: true })
  const top = Object.values(t).find(n => n.class === 'CC_WorkPlane' && n.name === 'Top').id
  const skB = (await api.v1.sketch.create({ id: partId, name: 'BlankSketch', planeId: top })).result
  const cB = (await api.v1.sketch.circle({ id: skB, centerPos: [0, 0, 0], radius: 25 })).result
  const ctrB = (await api.v1.sketch.getPoints({ id: cB })).result.centerId
  await api.v1.sketch.constraint({ id: skB, name: 'FixBlankCtr', type: 'FIXATION', geomIds: [ctrB] })
  await api.v1.sketch.dimension({ id: skB, name: 'BlankOD', type: 'DIAMETER', geomIds: [cB], value: '@expr.OD' })
  await api.v1.part.extrusion({ id: partId, name: 'Blank', references: [cB], type: 'UP', limit2: '@expr.W' })

  // ── 2. constrained tooth-space sketch on Top ───────────────────────────────
  const sk = (await api.v1.sketch.create({ id: partId, name: 'CutterSketch', planeId: top })).result

  const org = (await api.v1.sketch.point({ id: sk, pos: [0, 0, 0] })).result
  const cl = (await api.v1.sketch.line({ id: sk, startPos: [0, 0, 0], endPos: [0, 40, 0], isConstruction: true })).result
  const pc = (await api.v1.sketch.circle({ id: sk, centerPos: [0, 0, 0], radius: Rp * 0.95, isConstruction: true })).result
  const sc = (await api.v1.sketch.circle({ id: sk, centerPos: [0.5, Rp * 0.97, 0], radius: Rs * 0.8 })).result

  const tp = [Rs * Math.cos(a), Rp - Rs * Math.sin(a)]
  const capX = capW / 2
  const lf = (await api.v1.sketch.line({ id: sk, startPos: [-tp[0], tp[1], 0], endPos: [-capX, capY, 0] })).result
  const rf = (await api.v1.sketch.line({ id: sk, startPos: [tp[0], tp[1], 0], endPos: [capX, capY, 0] })).result
  const cap = (await api.v1.sketch.line({ id: sk, startPos: [-capX, capY, 0], endPos: [capX, capY, 0] })).result

  const P = async id => (await api.v1.sketch.getPoints({ id })).result
  const clP = await P(cl), pcP = await P(pc), scP = await P(sc)
  const lfP = await P(lf), rfP = await P(rf), capP = await P(cap)

  await api.v1.sketch.constraint([
    { id: sk, name: 'FixOrigin', type: 'FIXATION', geomIds: [org] },
    { id: sk, name: 'CLonOrigin', type: 'COINCIDENT', geomIds: [clP.startId, org] },
    { id: sk, name: 'CLvertical', type: 'VERTICAL', geomIds: [cl] },
    { id: sk, name: 'PConOrigin', type: 'COINCIDENT', geomIds: [pcP.centerId, org] },
    { id: sk, name: 'SeatOnPC', type: 'COINCIDENT', geomIds: [scP.centerId, pc] },
    { id: sk, name: 'SeatOnCL', type: 'COINCIDENT', geomIds: [scP.centerId, cl] },
    { id: sk, name: 'LTangent', type: 'TANGENT', geomIds: [lf, sc] },
    { id: sk, name: 'RTangent', type: 'TANGENT', geomIds: [rf, sc] },
    { id: sk, name: 'LOnSeat', type: 'COINCIDENT', geomIds: [lfP.startId, sc] },
    { id: sk, name: 'ROnSeat', type: 'COINCIDENT', geomIds: [rfP.startId, sc] },
    { id: sk, name: 'LCap', type: 'COINCIDENT', geomIds: [lfP.endId, capP.startId] },
    { id: sk, name: 'RCap', type: 'COINCIDENT', geomIds: [rfP.endId, capP.endId] },
    { id: sk, name: 'CapHoriz', type: 'HORIZONTAL', geomIds: [cap] },
    { id: sk, name: 'CapSym', type: 'SYMMETRY', geomIds: [cl, capP.startId, capP.endId] },
  ])
  await api.v1.sketch.dimension([
    { id: sk, name: 'DimRp', type: 'RADIUS', geomIds: [pc], value: '@expr.Rp' },
    { id: sk, name: 'DimRs', type: 'RADIUS', geomIds: [sc], value: '@expr.Rs' },
    { id: sk, name: 'DimCapW', type: 'HORIZONTAL_DISTANCE', geomIds: [capP.startId, capP.endId], value: '@expr.capW' },
    { id: sk, name: 'DimCapY', type: 'VERTICAL_DISTANCE', geomIds: [org, capP.startId], value: '@expr.capY' },
  ])

  // sanity: solver placed the seat center at (0, Rp)
  const scC = (await api.v1.sketch.getPositions({ id: scP.centerId })).result
  log('solved seat center:', scC, 'expected [0,', Rp, ']')

  // ── 3. the trigger ────────────────────────────────────────────────────────
  log('calling v1.sketch.preTrim — on affected engines this never returns …')
  const res = await Promise.race([
    api.v1.sketch.preTrim({ id: sk }).then(r => ({ outcome: 'returned', maxLevel: r.maxLevel, splits: r.result?.length })),
    new Promise(resolve => setTimeout(() => resolve({ outcome: 'HANG (60s timeout) — check worker CPU/RSS' }), 60_000)),
  ])
  log('preTrim outcome:', res)
  return { seatCenter: scC, preTrim: res }
}
