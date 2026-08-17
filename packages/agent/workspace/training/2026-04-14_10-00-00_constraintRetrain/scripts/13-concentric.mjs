// Test: CONCENTRIC — do two circles share centers after constraint?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'ConcentricTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Fixed circle
  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [c1] })

  // Second circle, offset
  const c2 = (await api.v1.sketch.circle({ id: skId, centerPos: [50, 30, 0], radius: 15 })).result

  const c2Pts = (await api.v1.sketch.getPoints({ id: c2 })).result
  const posBefore = (await api.v1.sketch.getPositions({ id: c2Pts.centerId })).result
  console.log('[13] c2 center before:', JSON.stringify(posBefore))

  await snapshot('before')

  const cr = await api.v1.sketch.constraint({ id: skId, type: 'CONCENTRIC', geomIds: [c1, c2] })
  console.log('[13] constraint result:', cr.result, 'maxLevel:', cr.maxLevel)

  const posAfter = (await api.v1.sketch.getPositions({ id: c2Pts.centerId })).result
  console.log('[13] c2 center after:', JSON.stringify(posAfter))

  await snapshot('after')

  const isConcentric = Math.abs(posAfter.pos.x) < 0.01 && Math.abs(posAfter.pos.y) < 0.01
  console.log('[13] isConcentric:', isConcentric)

  filewrite({ before: posBefore, after: posAfter, constraintResult: cr.result, maxLevel: cr.maxLevel, isConcentric }, 'concentric-data')

  return { partId }
}
