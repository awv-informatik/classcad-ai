// Test: RADIUS dimension on a circle
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'DimTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Create a circle r=30 — param is centerPos, not center
  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [40, 30, 0], radius: 30 })).result
  console.log('[05] circleId:', c1)

  await snapshot('before')

  // RADIUS dimension with value=20 (currently 30)
  const dimR = await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [c1], value: 20 })
  console.log('[05] RADIUS: result:', dimR.result, 'maxLevel:', dimR.maxLevel)

  // Check circle radius in structure tree
  const circNode = dimR.structure ? Object.values(dimR.structure.tree).find(n => n.id === c1) : null
  const dimNode = dimR.structure ? Object.values(dimR.structure.tree).find(n => n.id === dimR.result) : null

  console.log('[05] circle radius after:', circNode?.members?.radius?.value)
  console.log('[05] dim class:', dimNode?.class, 'name:', dimNode?.name)

  filewrite({
    dimId: dimR.result,
    maxLevel: dimR.maxLevel,
    dimClass: dimNode?.class,
    dimName: dimNode?.name,
    circleRadiusAfter: circNode?.members?.radius?.value,
    dimMembers: dimNode?.members
  }, 'radius-data')

  await snapshot('after')

  return { partId }
}
