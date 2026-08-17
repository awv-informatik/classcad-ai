/** 04 — isolate: do @expr dims work on a FRONT-plane sketch in a clean part? */
export default async function (api, { filewrite }) {
  const partR = await api.v1.part.create({ name: 'FrontDims' })
  const partId = partR.result
  const front = Object.values(partR.structure.tree).find((o) => o.class === 'CC_WorkPlane' && o.name === 'Front').id
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'pos', value: 10.6 }, { name: 'dia', value: 7.94 }] })
  const sk = (await api.v1.sketch.create({ id: partId, planeId: front, name: 'S' })).result
  const sO = (await api.v1.sketch.point({ id: sk, pos: [0, 0, 0] })).result
  const hLine = (await api.v1.sketch.line({ id: sk, startPos: [0, 0, 0], endPos: [40, 0, 0], isConstruction: true })).result
  const circ = (await api.v1.sketch.circle({ id: sk, centerPos: [10.5, 0.2, 0], radius: 3.5 })).result
  const ctr = (await api.v1.sketch.getPoints({ id: circ })).result.centerId
  const c = await api.v1.sketch.constraint([
    { id: sk, type: 'FIXATION', geomIds: [sO] },
    { id: sk, type: 'COINCIDENT', geomIds: [sO, hLine] },
    { id: sk, type: 'HORIZONTAL', geomIds: [hLine] },
    { id: sk, type: 'COINCIDENT', geomIds: [ctr, hLine] },
  ])
  console.log('[04] constraints:', c.maxLevel)
  const d = await api.v1.sketch.dimension([
    { id: sk, name: 'p', type: 'HORIZONTAL_DISTANCE', geomIds: [sO, ctr], value: '@expr.pos' },
    { id: sk, name: 'd', type: 'DIAMETER', geomIds: [circ], value: '@expr.dia' },
  ])
  console.log('[04] dims:', d.maxLevel, JSON.stringify(d.messages ?? []))
  const p = (await api.v1.sketch.getPositions({ id: ctr })).result?.pos
  console.log('[04] solved center (world):', JSON.stringify(p))
  // numeric-dim control on the same sketch
  const d2 = await api.v1.sketch.dimension({ id: sk, name: 'p2', type: 'VERTICAL_DISTANCE', geomIds: [sO, ctr], value: 0 })
  console.log('[04] numeric VD=0:', d2.maxLevel, JSON.stringify(d2.messages ?? []))
  filewrite({ cons: c.maxLevel, dims: d.maxLevel, center: p }, 'front-dims')
  return {}
}
