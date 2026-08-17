// Test: error cases — wrong ID types (EI ID, part ID)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'WrongId' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [20, 0, 0] })

  const matrix = [
    [1, 0, 0, 10],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ]

  // Try with part ID
  const r1 = await api.v1.curve.transformShape({ id: partId, matrix })
  console.log('[12] part ID result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[12] part ID messages:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'part-id-response')

  // Try with EI ID
  const r2 = await api.v1.curve.transformShape({ id: eifId, matrix })
  console.log('[12] EI ID result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[12] EI ID messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'ei-id-response')

  return { partId, eifId, shapeId }
}
