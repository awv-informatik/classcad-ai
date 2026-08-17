// Test: MIDPOINT — does point move to line midpoint?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'MidTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Fixed line
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [lineId] })

  // Free point NOT at midpoint
  const ptId = (await api.v1.sketch.point({ id: skId, pos: [20, 30, 0] })).result

  const posBefore = (await api.v1.sketch.getPositions({ id: ptId })).result
  console.log('[11] before pt:', JSON.stringify(posBefore))

  await snapshot('before')

  const cr = await api.v1.sketch.constraint({ id: skId, type: 'MIDPOINT', geomIds: [ptId, lineId] })
  console.log('[11] constraint result:', cr.result, 'maxLevel:', cr.maxLevel)

  const posAfter = (await api.v1.sketch.getPositions({ id: ptId })).result
  console.log('[11] after pt:', JSON.stringify(posAfter))

  await snapshot('after')

  // Midpoint of line (0,0)→(80,0) is (40,0)
  const atMidpoint = Math.abs(posAfter.pos.x - 40) < 0.01 && Math.abs(posAfter.pos.y - 0) < 0.01
  console.log('[11] atMidpoint:', atMidpoint)

  filewrite({ before: posBefore, after: posAfter, constraintResult: cr.result, maxLevel: cr.maxLevel, atMidpoint }, 'midpoint-data')

  return { partId }
}
