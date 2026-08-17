export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CirclePart' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Circles' })).result

  // Batch with one invalid entry — does the valid one still succeed?
  const r = await api.v1.curve.circle([
    { id: shapeId, centerPos: [0, 0, 0], radius: 20 },
    { id: partId, centerPos: [50, 0, 0], radius: 15 },  // wrong ID type
    { id: shapeId, centerPos: [100, 0, 0], radius: 10 },
  ])
  console.log('[11] batch with error result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[11] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'batch-error')

  await snapshot('batch-with-error')
  return { partId, shapeId }
}
