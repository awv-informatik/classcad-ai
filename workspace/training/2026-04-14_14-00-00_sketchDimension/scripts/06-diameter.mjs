// Test: DIAMETER dimension on a circle
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'DimTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Circle r=25 — param is centerPos
  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [40, 30, 0], radius: 25 })).result
  console.log('[06] circleId:', c1)

  await snapshot('before')

  // DIAMETER dimension with value=60 (currently diameter is 50)
  const dimR = await api.v1.sketch.dimension({ id: skId, type: 'DIAMETER', geomIds: [c1], value: 60 })
  console.log('[06] DIAMETER: result:', dimR.result, 'maxLevel:', dimR.maxLevel)

  const circNode = dimR.structure ? Object.values(dimR.structure.tree).find(n => n.id === c1) : null
  const dimNode = dimR.structure ? Object.values(dimR.structure.tree).find(n => n.id === dimR.result) : null

  console.log('[06] circle radius after:', circNode?.members?.radius?.value)
  console.log('[06] dim class:', dimNode?.class, 'name:', dimNode?.name)

  filewrite({
    dimId: dimR.result,
    maxLevel: dimR.maxLevel,
    dimClass: dimNode?.class,
    dimName: dimNode?.name,
    circleRadiusAfter: circNode?.members?.radius?.value,
    expectedRadius: 30
  }, 'diameter-data')

  await snapshot('after')

  return { partId }
}
