/**
 * 01b — arcByCenter isClockwise semantics PER PLANE.
 * Half-disc (r=10, center local (60,0), cw=true) on Top/Front/Right, extrude 4,
 * recover each body's local-y bulge sign via incremental COG + probed mapping.
 */
export default async function (api, { filewrite }) {
  const partR = await api.v1.part.create({ name: 'ProbeCW' })
  const partId = partR.result
  const planes = {}
  for (const n of ['Top', 'Front', 'Right'])
    planes[n] = Object.values(partR.structure.tree).find(
      (o) => o.class === 'CC_WorkPlane' && o.name === n,
    ).id
  // local→world mapping from 01: localY world vectors
  const localY = { Top: [0, 1, 0], Front: [0, 0, -1], Right: [0, -1, 0] }
  const localX = { Top: [1, 0, 0], Front: [1, 0, 0], Right: [0, 0, 1] }

  let Vprev = 0, Cprev = [0, 0, 0]
  const out = {}
  for (const [i, plane] of ['Top', 'Front', 'Right'].entries()) {
    const cx = 60 + i * 40 // separate the bodies
    const sk = (await api.v1.sketch.create({ id: partId, planeId: planes[plane], name: `cw${plane}` })).result
    const arc = (await api.v1.sketch.arcByCenter({
      id: sk, startPos: [cx + 10, 0, 0], endPos: [cx - 10, 0, 0], centerPos: [cx, 0, 0], isClockwise: true,
    })).result
    const line = (await api.v1.sketch.line({ id: sk, startPos: [cx - 10, 0, 0], endPos: [cx + 10, 0, 0] })).result
    const ext = await api.v1.part.extrusion({ id: partId, references: [arc, line], type: 'UP', limit2: 4, name: `hd${plane}` })
    if (ext.maxLevel > 31) { console.log(`[01b] ${plane} ext FAILED`, ext.messages); continue }
    await api.v1.common.recalc({})
    const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
    const V = mp.volume, C = [mp.cog.x, mp.cog.y, mp.cog.z]
    const Vi = V - Vprev
    const Ci = [0, 1, 2].map((k) => (C[k] * V - Cprev[k] * Vprev) / Vi)
    const bulgeLocalY = Ci[0] * localY[plane][0] + Ci[1] * localY[plane][1] + Ci[2] * localY[plane][2]
    const alongLocalX = Ci[0] * localX[plane][0] + Ci[1] * localX[plane][1] + Ci[2] * localX[plane][2]
    out[plane] = { bulgeLocalY: +bulgeLocalY.toFixed(3), alongLocalX: +alongLocalX.toFixed(3), Vi: +Vi.toFixed(1) }
    console.log(`[01b] ${plane}: cw=true bulge at local ${bulgeLocalY < 0 ? '-y (math-CW)' : '+y (math-CCW!)'} | localX pos ${alongLocalX.toFixed(1)} (expect ${cx}) Vi=${Vi.toFixed(1)} (expect 628.3)`)
    Vprev = V; Cprev = C
  }
  filewrite(out, 'cw-semantics')
  return out
}
