// Q: Can you create multiple shapes in the same entity injection?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'MyEI' })).result

  const shape1 = (await api.v1.curve.shape({ id: eifId, name: 'Shape1' })).result
  const shape2 = (await api.v1.curve.shape({ id: eifId, name: 'Shape2' })).result
  console.log('[06] shape1:', shape1, 'shape2:', shape2, 'both in EI:', eifId)

  // Add a line to each shape
  const r1 = await api.v1.curve.line({ id: shape1, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  const r2 = await api.v1.curve.line({ id: shape2, startPos: [0, 20, 0], endPos: [50, 20, 0] })
  console.log('[06] line in shape1:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[06] line in shape2:', r2.result, 'maxLevel:', r2.maxLevel)

  await snapshot('multiple-shapes-one-ei')
  filewrite({ eifId, shape1, shape2 }, 'multiple-shapes-ids')

  return { partId, eifId, shape1, shape2 }
}
