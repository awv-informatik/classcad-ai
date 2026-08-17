// 13 — Does updateDimension accept array input (batch mode) like dimension()?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 40, 0], endPos: [80, 40, 0] })).result

  const dim1 = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [l1] })).result
  const dim2 = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [l2] })).result
  console.log('[13] dim1:', dim1, 'dim2:', dim2)

  // Try batch update (array param)
  const r = await api.v1.sketch.updateDimension([
    { id: dim1, value: 60 },
    { id: dim2, value: 90 },
  ])
  console.log('[13] batch result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'batch-update')

  return { partId }
}
