// Test: COINCIDENT point-on-line and point-on-circle
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'CoincOnCurve' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Fixed horizontal line at y=0
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [lineId] })

  // Free point away from the line
  const ptId = (await api.v1.sketch.point({ id: skId, pos: [30, 25, 0] })).result

  const posBefore = (await api.v1.sketch.getPositions({ id: ptId })).result
  console.log('[14] before pt:', JSON.stringify(posBefore))

  await snapshot('before')

  // Constrain point onto line
  const cr = await api.v1.sketch.constraint({ id: skId, type: 'COINCIDENT', geomIds: [ptId, lineId] })
  console.log('[14] constraint result:', cr.result, 'maxLevel:', cr.maxLevel)

  const posAfter = (await api.v1.sketch.getPositions({ id: ptId })).result
  console.log('[14] after pt:', JSON.stringify(posAfter))

  await snapshot('after')

  // Point should now be on line (y=0)
  const onLine = Math.abs(posAfter.pos.y) < 0.01
  console.log('[14] onLine:', onLine)

  filewrite({ before: posBefore, after: posAfter, constraintResult: cr.result, maxLevel: cr.maxLevel, onLine }, 'coincident-on-curve-data')

  return { partId }
}
