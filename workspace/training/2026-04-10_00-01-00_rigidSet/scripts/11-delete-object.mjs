// 11 — Delete rigid set via sketch.deleteObject
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DeleteObjTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [40, 0, 0], endPos: [40, 30, 0] })).result

  const rs = await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1, l2] })
  console.log('[11] rigidSet created:', rs.result)

  // Delete rigid set via deleteObject
  const del = await api.v1.sketch.deleteObject({ ids: [rs.result] })
  console.log('[11] deleteObject — result:', del.result, 'maxLevel:', del.maxLevel)
  console.log('[11] deleteObject messages:', JSON.stringify(del.messages))
  filewrite({ result: del.result, messages: del.messages, maxLevel: del.maxLevel }, 'delete-response')

  // Check if lines still exist
  const g = await api.v1.sketch.getGeometry({ id: skId })
  const geomCount = g.result?.geometry?.length || 0
  console.log('[11] geometry after rigid set delete:', geomCount, 'items')
  console.log('[11] lines still exist:', geomCount > 0 ? 'YES' : 'NO')

  await snapshot('after-delete')
  return { partId }
}
