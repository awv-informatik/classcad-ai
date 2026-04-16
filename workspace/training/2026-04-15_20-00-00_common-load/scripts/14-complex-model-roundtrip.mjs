// Complex model roundtrip — expressions, booleans, multiple features
export default async function (api, { snapshot, filewrite }) {
  // Build a non-trivial model with expressions and boolean
  const partId = (await api.v1.part.create({ name: 'ComplexRT' })).result

  // Create expressions
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'W', value: 80 },
      { name: 'H', value: 40 },
    ],
  })

  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const box1 = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  const cyl = (await api.v1.solid.cylinder({ id: eifId, height: 60, diameter: 20, translation: [40, 30, -10] })).result
  await api.v1.solid.subtraction({ id: eifId, target: box1, tools: [cyl] })
  console.log('[14] Created model — part:', partId, 'box:', box1)

  await snapshot('before-save')

  // Save
  const saved = await api.v1.common.save({
    format: 'OFB',
    encoding: 'base64',
    compression: 'deflate',
  })
  console.log('[14] Save success:', saved.result.success, 'length:', saved.result.content?.length)

  // Clear and load
  await api.v1.common.clear({})
  const loadR = await api.v1.common.load({
    data: saved.result.content,
    format: 'OFB',
    encoding: 'base64',
    compression: 'deflate',
  })
  console.log('[14] Loaded part ID:', loadR.result?.id, '(original:', partId, ')')

  await snapshot('after-load')

  // Verify expressions survived
  const wExpr = await api.v1.part.getExpression({ id: loadR.result.id, name: 'W' })
  const hExpr = await api.v1.part.getExpression({ id: loadR.result.id, name: 'H' })
  console.log('[14] Expression W:', JSON.stringify(wExpr.result))
  console.log('[14] Expression H:', JSON.stringify(hExpr.result))

  filewrite({
    originalPartId: partId,
    loadedPartId: loadR.result?.id,
    idsMatch: partId === loadR.result?.id,
    expressionW: wExpr.result,
    expressionH: hExpr.result,
  }, 'complex-roundtrip')

  return { partId, loadedId: loadR.result?.id }
}
