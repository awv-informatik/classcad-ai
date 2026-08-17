// Test: dimension with omitted value — auto-calculated. What value does it pick?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'DimTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Line of 73 units
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [10, 5, 0], endPos: [83, 5, 0] })).result

  // OFFSET with NO value — should auto-calculate to current length (73)
  const dimR = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [l1] })
  console.log('[10] dim result:', dimR.result, 'maxLevel:', dimR.maxLevel)

  // Check dimension value in structure — look for a value member or paramName
  const dimNode = Object.values(dimR.structure.tree).find(n => n.id === dimR.result)

  // Also check getExpression on the dimension
  const exprR = await api.v1.part.getExpression({ id: dimR.result })
  console.log('[10] getExpression on dim:', JSON.stringify(exprR.result), 'maxLevel:', exprR.maxLevel)

  // Circle r=18 with RADIUS auto-value
  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [50, 40, 0], radius: 18 })).result
  const radDimR = await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [c1] })
  console.log('[10] radius dim result:', radDimR.result, 'maxLevel:', radDimR.maxLevel)

  const radDimNode = Object.values(radDimR.structure.tree).find(n => n.id === radDimR.result)

  filewrite({
    offsetDim: {
      id: dimR.result,
      maxLevel: dimR.maxLevel,
      members: dimNode?.members,
      getExpression: exprR.result
    },
    radiusDim: {
      id: radDimR.result,
      maxLevel: radDimR.maxLevel,
      members: radDimNode?.members
    }
  }, 'auto-value-data')

  await snapshot('result')

  return { partId }
}
