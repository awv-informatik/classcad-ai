// Test: OFFSET dimension with explicit value — does the solver resize the line?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'DimTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Create a horizontal line 80 units long
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result

  // Fix the start point so solver has an anchor
  const pts = (await api.v1.sketch.getPoints({ id: l1 })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts.startId] })

  // Get positions before
  const posBefore = {
    start: (await api.v1.sketch.getPositions({ id: pts.startId })).result,
    end: (await api.v1.sketch.getPositions({ id: pts.endId })).result
  }
  console.log('[02] before: start=', JSON.stringify(posBefore.start), 'end=', JSON.stringify(posBefore.end))

  await snapshot('before')

  // Create OFFSET dimension with value=50 — line is currently 80, should it resize?
  const dimR = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [l1], value: 50 })
  console.log('[02] dim result:', dimR.result, 'maxLevel:', dimR.maxLevel)

  // Get positions after
  const posAfter = {
    start: (await api.v1.sketch.getPositions({ id: pts.startId })).result,
    end: (await api.v1.sketch.getPositions({ id: pts.endId })).result
  }
  console.log('[02] after: start=', JSON.stringify(posAfter.start), 'end=', JSON.stringify(posAfter.end))

  // Check the dimension value in structure tree
  const dimNode = Object.values(dimR.structure.tree).find(n => n.id === dimR.result)

  filewrite({
    dimId: dimR.result,
    maxLevel: dimR.maxLevel,
    posBefore,
    posAfter,
    lineResized: JSON.stringify(posBefore.end) !== JSON.stringify(posAfter.end),
    dimClass: dimNode?.class,
    dimMembers: dimNode?.members
  }, 'offset-with-value')

  await snapshot('after')

  return { partId, skId }
}
