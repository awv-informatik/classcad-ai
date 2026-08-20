// 04 — order-insensitivity ([inner, outer]) and multiple disjoint outers each with
// a hole in ONE references array. Signatures (h=10): annulus30/10 25132.74;
// two plates 40×30 each with r=5 hole: 2×(12000−785.40)=22429.20.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OrderDisjoint' })).result
  const rc0 = await api.v1.common.recalc()
  const top = Object.values(rc0.structure.tree).find((n) => n.class === 'CC_WorkPlane' && n.name === 'Top')

  // (a) inner listed FIRST
  const sk1 = (await api.v1.sketch.create({ id: partId, planeId: top.id })).result
  const inner = (await api.v1.sketch.circle({ id: sk1, centerPos: [0, 0, 0], radius: 10, genFixation: false })).result
  const outer = (await api.v1.sketch.circle({ id: sk1, centerPos: [0, 0, 0], radius: 30, genFixation: false })).result
  const rA = await api.v1.part.extrusion({ id: partId, name: 'InnerFirst', references: [inner, outer], type: 'UP', limit2: 10 })
  const volA = rA.result ? (await api.v1.part.calculateMassProperties({ id: partId })).result?.volume : null
  console.log('[04a] [inner, outer]: maxLevel', rA.maxLevel, 'vol', volA?.toFixed(2), '(25132.74 = annulus regardless of order)')
  if (rA.result) await api.v1.part.deleteFeature({ ids: [rA.result] })
  await api.v1.common.recalc()

  // (b) two disjoint plates, each with a hole, one references array
  const sk2 = (await api.v1.sketch.create({ id: partId, planeId: top.id })).result
  const r1 = (await api.v1.sketch.rectangle({ id: sk2, startPos: [-60, -15, 0], endPos: [-20, 15, 0] })).result
  const c1 = (await api.v1.sketch.circle({ id: sk2, centerPos: [-40, 0, 0], radius: 5, genFixation: false })).result
  const r2 = (await api.v1.sketch.rectangle({ id: sk2, startPos: [20, -15, 0], endPos: [60, 15, 0] })).result
  const c2 = (await api.v1.sketch.circle({ id: sk2, centerPos: [40, 0, 0], radius: 5, genFixation: false })).result
  const rB = await api.v1.part.extrusion({ id: partId, name: 'TwoPlates', references: [...r1, c1, ...r2, c2], type: 'UP', limit2: 10 })
  const volB = rB.result ? (await api.v1.part.calculateMassProperties({ id: partId })).result?.volume : null
  console.log('[04b] two plates+holes: maxLevel', rB.maxLevel, 'vol', volB?.toFixed(2), '(22429.20 = each hole assigned to ITS outer)')
  await snapshot('04b-two-plates')
  filewrite({ orderSwap: volA, twoPlates: volB }, 'results')
  return { volA, volB }
}
