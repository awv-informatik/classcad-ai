export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BatchErr' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'BE' })).result

  // Batch where one line is degenerate — does it fail the whole batch or just that line?
  const r = await api.v1.curve.line([
    { id: shapeId, startPos: [0, 0, 0], endPos: [30, 0, 0] },
    { id: shapeId, startPos: [5, 5, 0], endPos: [5, 5, 0] },  // degenerate
    { id: shapeId, startPos: [0, 10, 0], endPos: [30, 10, 0] },
  ])
  console.log('[10] batch with degenerate:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[10] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'batch-error')

  await snapshot('batch-with-error')
  return { partId, shapeId }
}
