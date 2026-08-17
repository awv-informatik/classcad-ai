/**
 * 01 — probe sketch-plane local→world mappings + arcByCenter isClockwise semantics.
 * Method: one asymmetric rect extrusion per plane; recover each body's COG by
 * incremental mass-property algebra; match components to (w/2, h/2, d/2).
 */
export default async function (api, { filewrite }) {
  const partR = await api.v1.part.create({ name: 'Probe' })
  const partId = partR.result
  const planes = {}
  for (const n of ['Top', 'Front', 'Right'])
    planes[n] = Object.values(partR.structure.tree).find(
      (o) => o.class === 'CC_WorkPlane' && o.name === n,
    ).id

  const probes = [
    { plane: 'Top', w: 11, h: 23, d: 5 },
    { plane: 'Front', w: 13, h: 29, d: 7 },
    { plane: 'Right', w: 17, h: 31, d: 9 },
  ]
  let Vprev = 0
  let Cprev = [0, 0, 0]
  const mapping = {}
  for (const p of probes) {
    const skId = (await api.v1.sketch.create({ id: partId, planeId: planes[p.plane], name: `sk${p.plane}` })).result
    const rect = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [p.w, p.h, 0] })).result
    const ext = await api.v1.part.extrusion({ id: partId, references: rect, type: 'UP', limit2: p.d, name: `ext${p.plane}` })
    if (ext.maxLevel > 31) console.log(`[01] ${p.plane} extrusion maxLevel`, ext.maxLevel, ext.messages)
    await api.v1.common.recalc({})
    const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
    const V = mp.volume
    const C = [mp.cog.x, mp.cog.y, mp.cog.z]
    const Vi = V - Vprev
    const Ci = [0, 1, 2].map((k) => (C[k] * V - Cprev[k] * Vprev) / Vi)
    console.log(`[01] ${p.plane}: Vi=${Vi.toFixed(2)} (expect ${p.w * p.h * p.d}) COGi=[${Ci.map((c) => c.toFixed(3)).join(', ')}]`)
    // match: |COGi·world-axis| ∈ {w/2, h/2, d/2} → local x, y, normal
    const names = ['X', 'Y', 'Z']
    const res = { u: null, v: null, n: null }
    for (let k = 0; k < 3; k++) {
      const val = Ci[k]
      const cand = [
        ['u', p.w / 2],
        ['v', p.h / 2],
        ['n', p.d / 2],
      ].find(([, e]) => Math.abs(Math.abs(val) - e) < 0.15)
      if (cand) res[cand[0]] = (val > 0 ? '+' : '-') + names[k]
    }
    mapping[p.plane] = res
    console.log(`[01] ${p.plane}: localX→${res.u} localY→${res.v} normal→${res.n}`)
    Vprev = V
    Cprev = C
  }

  // arcByCenter isClockwise semantics: half-disc on Top plane, r=10 at local (60, 0)
  const skT = (await api.v1.sketch.create({ id: partId, planeId: planes.Top, name: 'skArc' })).result
  const arc = (await api.v1.sketch.arcByCenter({
    id: skT, startPos: [70, 0, 0], endPos: [50, 0, 0], centerPos: [60, 0, 0], isClockwise: true,
  })).result
  const line = (await api.v1.sketch.line({ id: skT, startPos: [50, 0, 0], endPos: [70, 0, 0] })).result
  await api.v1.part.extrusion({ id: partId, references: [arc, line], type: 'UP', limit2: 4, name: 'halfDisc' })
  await api.v1.common.recalc({})
  const mp2 = (await api.v1.part.calculateMassProperties({ id: partId })).result
  const V2 = mp2.volume
  const C2 = [mp2.cog.x, mp2.cog.y, mp2.cog.z]
  const Vi = V2 - Vprev
  const Ci = [0, 1, 2].map((k) => (C2[k] * V2 - Cprev[k] * Vprev) / Vi)
  // half-disc COG offset from center: 4r/3π ≈ 4.244 along the bulge direction.
  // With Top mapping localY→+Y presumed: bulge at local -y ⇒ cw=true sweeps NEGATIVE angles.
  console.log(`[01] halfDisc Vi=${Vi.toFixed(2)} (expect ${(Math.PI * 100 * 4) / 2}) COGi=[${Ci.map((c) => c.toFixed(3)).join(', ')}]`)
  const bulgeY = Ci[1] // local y ≈ world Y on Top (verify against mapping output!)
  console.log(`[01] isClockwise=true sweeps ${bulgeY < 0 ? 'NEGATIVE (math-CW) — bulge at -y' : 'POSITIVE (math-CCW) — bulge at +y'}`)

  filewrite({ mapping, halfDiscCOG: Ci }, 'plane-mapping')
  return { mapping }
}
