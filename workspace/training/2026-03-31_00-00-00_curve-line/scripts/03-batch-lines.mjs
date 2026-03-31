export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BatchLine' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Batch' })).result

  // Batch creation - array of line objects
  const r = await api.v1.curve.line([
    { id: shapeId, startPos: [0, 0, 0], endPos: [40, 0, 0] },
    { id: shapeId, startPos: [0, 10, 0], endPos: [40, 10, 0] },
    { id: shapeId, startPos: [0, 20, 0], endPos: [40, 20, 0] },
  ])
  console.log('[03] batch result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[03] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'batch-response')

  await snapshot('batch-lines')
  return { partId, shapeId }
}
