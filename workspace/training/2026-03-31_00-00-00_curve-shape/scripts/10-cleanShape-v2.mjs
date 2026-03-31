// 10 — cleanShape retry: more careful about checking state before/after
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'CleanMe' })).result

  // Add curves — use the response structure to check geometry
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  const afterCurves = await api.v1.curve.circle({ id: shapeId, centerPos: [25, 25, 0], radius: 15 })

  const beforeTree = afterCurves.structure.tree
  const beforeShape = beforeTree[String(shapeId)]
  console.log('[10] before clean — geometryIdList:', JSON.stringify(beforeShape?.geometryIdList))
  console.log('[10] before clean — shape class:', beforeShape?.class)

  await snapshot('before-clean')

  // Clean the shape
  const r = await api.v1.curve.cleanShape({ ids: [shapeId] })
  console.log('[10] cleanShape result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) {
    console.log('[10] messages:', JSON.stringify(r.messages))
  }

  const afterTree = r.structure.tree
  const afterShape = afterTree[String(shapeId)]
  console.log('[10] after clean — shape exists:', !!afterShape)
  console.log('[10] after clean — geometryIdList:', JSON.stringify(afterShape?.geometryIdList))

  await snapshot('after-clean')

  filewrite({
    before: { geometryIdList: beforeShape?.geometryIdList },
    after: { exists: !!afterShape, geometryIdList: afterShape?.geometryIdList },
    result: { result: r.result, maxLevel: r.maxLevel, messages: r.messages }
  }, 'cleanShape-v2')

  return { shapeId }
}
