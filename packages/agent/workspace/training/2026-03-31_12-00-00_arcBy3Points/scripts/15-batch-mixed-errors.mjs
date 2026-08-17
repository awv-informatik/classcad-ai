// 15 - Batch with mixed valid/invalid entries
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BatchMixed' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  // Batch: 1st valid, 2nd collinear (might fail), 3rd valid
  const r = await api.v1.curve.arcBy3Points([
    { id: shapeId, startPos: [0, 0, 0], midPos: [15, 20, 0], endPos: [30, 0, 0] },       // valid
    { id: shapeId, startPos: [0, 30, 0], midPos: [15, 30, 0], endPos: [30, 30, 0] },       // collinear
    { id: shapeId, startPos: [0, -30, 0], midPos: [15, -50, 0], endPos: [30, -30, 0] },    // valid
  ])

  console.log('[15] batch mixed maxLevel:', r.maxLevel)
  console.log('[15] batch mixed msgs:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'batch-mixed-response')

  await snapshot('batch-mixed')
  return { partId }
}
