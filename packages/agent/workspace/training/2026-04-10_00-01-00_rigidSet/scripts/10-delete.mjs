// 10 — Can we delete a rigid set? Try common.deleteObjects or sketch methods
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DeleteTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [40, 0, 0], endPos: [40, 30, 0] })).result

  const rs = await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1, l2] })
  console.log('[10] rigidSet created:', rs.result)

  // Try deleting via common.deleteObjects
  const del = await api.v1.common.deleteObjects({ ids: [rs.result] })
  console.log('[10] deleteObjects — result:', del.result, 'maxLevel:', del.maxLevel)
  console.log('[10] deleteObjects messages:', JSON.stringify(del.messages))
  filewrite({ result: del.result, messages: del.messages, maxLevel: del.maxLevel }, 'delete-response')

  // Check if lines still exist
  const g = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[10] geometry after delete:', JSON.stringify(g.result?.geometry?.length || 0), 'items')
  filewrite(g.result, 'geometry-after-delete')

  await snapshot('after-delete')
  return { partId }
}
