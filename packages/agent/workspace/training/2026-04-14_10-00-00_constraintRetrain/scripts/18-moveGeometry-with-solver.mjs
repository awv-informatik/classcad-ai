// Test: moveGeometry with active solver — does it respect constraints?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'MoveTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Create rectangle and fix bottom-left corner
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [60, 40, 0] })).result
  console.log('[18] rectIds:', rectIds)

  // Get a point from the rectangle (bottom-left start)
  const pts0 = (await api.v1.sketch.getPoints({ id: rectIds[0] })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts0.startId] })

  // Add HORIZONTAL on bottom edge
  await api.v1.sketch.constraint({ id: skId, type: 'HORIZONTAL', geomIds: [rectIds[0]] })

  const posBefore = {
    p0start: (await api.v1.sketch.getPositions({ id: pts0.startId })).result,
    p0end: (await api.v1.sketch.getPositions({ id: pts0.endId })).result,
  }
  console.log('[18] before:', JSON.stringify(posBefore))

  await snapshot('before')

  // Move bottom edge up by 10 — should the solver keep it horizontal?
  const moveR = await api.v1.sketch.moveGeometry({ id: skId, geomIds: [rectIds[0]], delta: [0, 10, 0] })
  console.log('[18] moveGeometry result:', moveR.result, 'maxLevel:', moveR.maxLevel)

  const posAfter = {
    p0start: (await api.v1.sketch.getPositions({ id: pts0.startId })).result,
    p0end: (await api.v1.sketch.getPositions({ id: pts0.endId })).result,
  }
  console.log('[18] after:', JSON.stringify(posAfter))

  await snapshot('after')

  const isHorizontal = Math.abs(posAfter.p0start.pos.y - posAfter.p0end.pos.y) < 0.01
  console.log('[18] still horizontal:', isHorizontal, 'moveResult:', moveR.result)

  filewrite({
    before: posBefore,
    after: posAfter,
    moveResult: moveR.result,
    moveMaxLevel: moveR.maxLevel,
    isHorizontal,
  }, 'move-solver-data')

  return { partId }
}
