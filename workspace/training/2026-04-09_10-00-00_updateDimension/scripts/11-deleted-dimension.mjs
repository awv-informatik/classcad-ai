// 11 — Update a dimension that has been deleted
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [l1] })).result
  console.log('[11] dimId:', dimId)

  // Delete the dimension using deleteObject
  const delR = await api.v1.sketch.deleteObject({ ids: [dimId] })
  console.log('[11] delete result:', delR.result, 'maxLevel:', delR.maxLevel)

  // Try to update the deleted dimension
  const r = await api.v1.sketch.updateDimension({ id: dimId, value: 100 })
  console.log('[11] after-delete result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'after-delete')

  return { partId }
}
