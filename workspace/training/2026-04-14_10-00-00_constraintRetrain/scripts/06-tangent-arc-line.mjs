// Test: TANGENT arc-line — does arc move to become tangent?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'TangentTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Fixed horizontal line at y=0
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [lineId] })

  // Arc above the line — center at (40, 25), radius ~15, NOT tangent to y=0
  const arcId = (await api.v1.sketch.arcByCenter({
    id: skId, centerPos: [40, 25, 0], startPos: [25, 25, 0], endPos: [55, 25, 0]
  })).result
  console.log('[06] arcId:', arcId)

  const arcPts = (await api.v1.sketch.getPoints({ id: arcId })).result
  const posBefore = {
    center: (await api.v1.sketch.getPositions({ id: arcPts.centerId })).result,
    start: (await api.v1.sketch.getPositions({ id: arcPts.startId })).result,
    end: (await api.v1.sketch.getPositions({ id: arcPts.endId })).result,
  }
  console.log('[06] before center:', JSON.stringify(posBefore.center))

  await snapshot('before')

  const cr = await api.v1.sketch.constraint({ id: skId, type: 'TANGENT', geomIds: [arcId, lineId] })
  console.log('[06] constraint result:', cr.result, 'maxLevel:', cr.maxLevel)
  if (cr.messages?.length) console.log('[06] messages:', JSON.stringify(cr.messages))

  const posAfter = {
    center: (await api.v1.sketch.getPositions({ id: arcPts.centerId })).result,
    start: (await api.v1.sketch.getPositions({ id: arcPts.startId })).result,
    end: (await api.v1.sketch.getPositions({ id: arcPts.endId })).result,
  }
  console.log('[06] after center:', JSON.stringify(posAfter.center))

  await snapshot('after')

  filewrite({ before: posBefore, after: posAfter, constraintResult: cr.result, maxLevel: cr.maxLevel }, 'tangent-data')

  return { partId }
}
