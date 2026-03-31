// 08 — cleanShape: delete curves but keep shape container
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'ToBeCleaned' })).result

  // Add curves
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  await api.v1.curve.circle({ id: shapeId, centerPos: [25, 25, 0], radius: 15 })

  // Snapshot before
  await snapshot('before-clean')

  // Check geometry before
  const beforeTree = (await api.v1.common.getAppVersion({})).structure.tree
  const beforeShape = beforeTree[String(shapeId)]
  console.log('[08] before clean — geometryIdList:', beforeShape?.geometryIdList)

  // Clean the shape
  const r = await api.v1.curve.cleanShape({ ids: [shapeId] })
  console.log('[08] cleanShape result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[08] messages:', JSON.stringify(r.messages))

  // Check shape still exists
  const afterTree = r.structure.tree
  const afterShape = afterTree[String(shapeId)]
  console.log('[08] after clean — shape exists:', !!afterShape)
  console.log('[08] after clean — geometryIdList:', afterShape?.geometryIdList)
  console.log('[08] after clean — name:', afterShape?.name)

  // Snapshot after
  await snapshot('after-clean')

  filewrite({
    before: { geometryIdList: beforeShape?.geometryIdList, members: beforeShape?.members },
    after: { geometryIdList: afterShape?.geometryIdList, members: afterShape?.members },
    result: { result: r.result, maxLevel: r.maxLevel, messages: r.messages }
  }, 'cleanShape-result')

  return { shapeId }
}
