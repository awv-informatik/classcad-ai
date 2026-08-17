// 03 - Batch creation: pass array of arc objects
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BatchArc' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Arcs' })).result

  // Batch: 3 arcs in one call
  const r = await api.v1.curve.arcBy3Points([
    { id: shapeId, startPos: [0, 0, 0], midPos: [10, 15, 0], endPos: [20, 0, 0] },
    { id: shapeId, startPos: [30, 0, 0], midPos: [40, 15, 0], endPos: [50, 0, 0] },
    { id: shapeId, startPos: [60, 0, 0], midPos: [70, 15, 0], endPos: [80, 0, 0] },
  ])

  console.log('[03] batch result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[03] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'batch-response')

  await snapshot('batch-arcs')
  return { partId }
}
