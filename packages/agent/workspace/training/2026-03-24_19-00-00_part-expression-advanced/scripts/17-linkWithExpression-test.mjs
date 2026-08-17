// linkWithExpression needs featureId, not partId — pass the box feature ID
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'dim', value: 60 }],
  })

  // Create box with literal values (no @expr)
  const boxId = (await api.v1.part.box({
    id: partId,
    name: 'LinkedBox',
    length: 60,
    width: 60,
    height: 60,
  })).result

  // Fixed reference
  const cylId = (await api.v1.part.cylinder({
    id: partId,
    name: 'Ref',
    diameter: 30,
    height: 30,
  })).result

  await snapshot('link-before')

  // Link the expression to the box feature's length param
  // id should be the FEATURE id (boxId), not partId
  const lr = await api.v1.part.linkWithExpression({
    id: boxId,
    parameterName: 'length',
    expressionName: 'dim',
  })
  console.log('[17] linkWithExpression result:', lr.result, 'maxLevel:', lr.maxLevel)
  if (lr.maxLevel > 31) console.log('[17] link messages:', JSON.stringify(lr.messages))

  // Update expression and recalc
  await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ name: 'dim', value: 120 }],
  })
  await api.v1.common.recalc()

  await snapshot('link-after')
  return { partId, boxId }
}
