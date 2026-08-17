/** 04b — does an EXTRUSION between sketch builds poison later @expr dims? */
export default async function (api, { filewrite }) {
  const partR = await api.v1.part.create({ name: 'Order' })
  const partId = partR.result
  const find = (n) => Object.values(partR.structure.tree).find((o) => o.class === 'CC_WorkPlane' && o.name === n).id
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'pos', value: 10.6 }, { name: 'dia', value: 7.94 }] })

  const mkSketch = async (plane, name) => {
    const sk = (await api.v1.sketch.create({ id: partId, planeId: find(plane), name })).result
    const sO = (await api.v1.sketch.point({ id: sk, pos: [0, 0, 0] })).result
    const hL = (await api.v1.sketch.line({ id: sk, startPos: [0, 0, 0], endPos: [40, 0, 0], isConstruction: true })).result
    const c = (await api.v1.sketch.circle({ id: sk, centerPos: [10.5, 0.2, 0], radius: 3.5 })).result
    const ctr = (await api.v1.sketch.getPoints({ id: c })).result.centerId
    await api.v1.sketch.constraint([
      { id: sk, type: 'FIXATION', geomIds: [sO] },
      { id: sk, type: 'COINCIDENT', geomIds: [sO, hL] },
      { id: sk, type: 'HORIZONTAL', geomIds: [hL] },
      { id: sk, type: 'COINCIDENT', geomIds: [ctr, hL] },
    ])
    const d = await api.v1.sketch.dimension([
      { id: sk, name: `p_${name}`, type: 'HORIZONTAL_DISTANCE', geomIds: [sO, ctr], value: '@expr.pos' },
      { id: sk, name: `d_${name}`, type: 'DIAMETER', geomIds: [c], value: '@expr.dia' },
    ])
    console.log(`[04b] ${name} dims maxLevel:`, d.maxLevel, JSON.stringify((d.messages ?? []).map((m) => m.message)))
    return { sk, c }
  }

  const s1 = await mkSketch('Top', 'S1')
  const e1 = await api.v1.part.extrusion({ id: partId, name: 'E1', references: [s1.c], type: 'UP', limit2: 29 })
  console.log('[04b] extrusion E1:', e1.result, e1.maxLevel)
  await mkSketch('Front', 'S2')
  return {}
}
