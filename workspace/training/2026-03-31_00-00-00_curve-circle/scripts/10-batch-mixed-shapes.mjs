export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CirclePart' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shape1 = (await api.v1.curve.shape({ id: eifId, name: 'Shape1' })).result
  const shape2 = (await api.v1.curve.shape({ id: eifId, name: 'Shape2' })).result
  console.log('[10] shape1:', shape1, 'shape2:', shape2)

  // Batch circles across different shapes
  const r = await api.v1.curve.circle([
    { id: shape1, centerPos: [0, 0, 0], radius: 20 },
    { id: shape2, centerPos: [50, 0, 0], radius: 15 },
  ])
  console.log('[10] mixed batch result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'mixed-batch')

  await snapshot('mixed-shapes')
  return { partId }
}
