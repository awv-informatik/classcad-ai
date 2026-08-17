// Test: HORIZONTAL constraint with planeId — does it actually reposition geometry?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'HorizTest' })
  const partId = partR.result
  // Find the Top work plane
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  console.log('[01] topPlane:', topPlane.id)

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result
  console.log('[01] sketchId:', skId)

  // Create a diagonal line (not horizontal)
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 30, 0] })).result
  console.log('[01] lineId:', lineId)

  // Get positions before constraint
  const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
  const posBefore = {
    start: (await api.v1.sketch.getPositions({ id: pts.startId })).result,
    end: (await api.v1.sketch.getPositions({ id: pts.endId })).result,
  }
  console.log('[01] before:', JSON.stringify(posBefore))

  await snapshot('before')

  // Apply HORIZONTAL constraint
  const cr = await api.v1.sketch.constraint({ id: skId, type: 'HORIZONTAL', geomIds: [lineId] })
  console.log('[01] constraint result:', cr.result, 'maxLevel:', cr.maxLevel)

  // Get positions after constraint
  const posAfter = {
    start: (await api.v1.sketch.getPositions({ id: pts.startId })).result,
    end: (await api.v1.sketch.getPositions({ id: pts.endId })).result,
  }
  console.log('[01] after:', JSON.stringify(posAfter))

  await snapshot('after')

  filewrite({
    before: posBefore,
    after: posAfter,
    constraintResult: cr.result,
    maxLevel: cr.maxLevel,
    moved: posBefore.start.pos.y !== posAfter.start.pos.y || posBefore.end.pos.y !== posAfter.end.pos.y,
  }, 'horizontal-data')

  return { partId }
}
