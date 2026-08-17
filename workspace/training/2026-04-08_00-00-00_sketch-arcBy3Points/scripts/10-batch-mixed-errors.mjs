// Batch with mixed valid/invalid entries — test error isolation
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BatchMix' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const r = await api.v1.sketch.arcBy3Points([
    { id: skId, startPos: [0, 0, 0], midPos: [20, 20, 0], endPos: [40, 0, 0] },       // valid
    { id: skId, startPos: [0, 0, 0], midPos: [20, 0, 0], endPos: [40, 0, 0] },         // collinear → error
    { id: skId, startPos: [60, 0, 0], midPos: [80, 15, 0], endPos: [100, 0, 0] },      // valid
  ])
  console.log('[10] batch mixed result:', JSON.stringify(r.result))
  console.log('[10] batch mixed maxLevel:', r.maxLevel)
  console.log('[10] batch mixed messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'batch-mixed')

  await snapshot('batch-mixed')
  return { partId }
}
