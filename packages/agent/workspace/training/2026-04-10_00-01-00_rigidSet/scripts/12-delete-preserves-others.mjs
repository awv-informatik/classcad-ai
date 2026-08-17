// 12 — Verify: does deleting a rigid set only delete its members, or everything?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DeletePreserve' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create 3 lines: 2 in rigid set, 1 outside
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [40, 0, 0], endPos: [40, 30, 0] })).result
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [60, 10, 0], endPos: [100, 10, 0] })).result

  const rs = await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1, l2] })
  console.log('[12] rigidSet:', rs.result, '— members: l1=', l1, 'l2=', l2, '— standalone: l3=', l3)

  // Geometry before delete
  const gBefore = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[12] geometry before delete:', gBefore.result?.geometry?.length, 'items')
  const geomIdsBefore = (gBefore.result?.geometry || []).map(g => g.id)
  console.log('[12] geom IDs before:', JSON.stringify(geomIdsBefore))

  // Delete rigid set
  await api.v1.sketch.deleteObject({ ids: [rs.result] })

  // Geometry after delete
  const gAfter = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[12] geometry after delete:', gAfter.result?.geometry?.length, 'items')
  const geomIdsAfter = (gAfter.result?.geometry || []).map(g => g.id)
  console.log('[12] geom IDs after:', JSON.stringify(geomIdsAfter))
  console.log('[12] l3 survived?', geomIdsAfter.includes(l3))

  filewrite({
    before: geomIdsBefore,
    after: geomIdsAfter,
    l3Survived: geomIdsAfter.includes(l3)
  }, 'delete-comparison')

  await snapshot('after-delete')
  return { partId }
}
