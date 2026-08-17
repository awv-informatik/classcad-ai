// Test: VERTICAL constraint with planeId — does it reposition geometry?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'VertTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Diagonal line
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [10, 0, 0], endPos: [40, 50, 0] })).result
  const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
  const posBefore = {
    start: (await api.v1.sketch.getPositions({ id: pts.startId })).result,
    end: (await api.v1.sketch.getPositions({ id: pts.endId })).result,
  }
  console.log('[02] before:', JSON.stringify(posBefore))

  await snapshot('before')

  const cr = await api.v1.sketch.constraint({ id: skId, type: 'VERTICAL', geomIds: [lineId] })
  console.log('[02] constraint result:', cr.result, 'maxLevel:', cr.maxLevel)

  const posAfter = {
    start: (await api.v1.sketch.getPositions({ id: pts.startId })).result,
    end: (await api.v1.sketch.getPositions({ id: pts.endId })).result,
  }
  console.log('[02] after:', JSON.stringify(posAfter))

  await snapshot('after')

  filewrite({
    before: posBefore,
    after: posAfter,
    constraintResult: cr.result,
    maxLevel: cr.maxLevel,
    moved: posBefore.start.pos.x !== posAfter.start.pos.x || posBefore.end.pos.x !== posAfter.end.pos.x,
  }, 'vertical-data')

  return { partId }
}
