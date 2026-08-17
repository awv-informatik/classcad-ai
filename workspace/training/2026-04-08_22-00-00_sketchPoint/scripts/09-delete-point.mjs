// Test deleteObject with point IDs
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DeleteTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create 3 points
  const p1 = (await api.v1.sketch.point({ id: skId, pos: [0, 0, 0] })).result
  const p2 = (await api.v1.sketch.point({ id: skId, pos: [40, 0, 0] })).result
  const p3 = (await api.v1.sketch.point({ id: skId, pos: [20, 30, 0] })).result
  console.log('[09] created points:', p1, p2, p3)

  await snapshot('before-delete')

  // Delete the middle point
  const dr = await api.v1.sketch.deleteObject({ ids: [p2] })
  console.log('[09] deleteObject result:', dr.result, 'maxLevel:', dr.maxLevel)
  console.log('[09] delete messages:', JSON.stringify(dr.messages))
  filewrite({ result: dr.result, messages: dr.messages, maxLevel: dr.maxLevel }, 'delete-response')

  await snapshot('after-delete')

  // Verify p2 is gone — getPositions should fail
  try {
    const posR = await api.v1.sketch.getPositions({ id: p2 })
    console.log('[09] getPositions on deleted point:', JSON.stringify(posR.result), 'maxLevel:', posR.maxLevel)
  } catch (e) {
    console.log('[09] getPositions on deleted point threw:', e.message)
  }

  // Verify p1 and p3 still exist
  const pos1 = await api.v1.sketch.getPositions({ id: p1 })
  const pos3 = await api.v1.sketch.getPositions({ id: p3 })
  console.log('[09] p1 still exists:', JSON.stringify(pos1.result))
  console.log('[09] p3 still exists:', JSON.stringify(pos3.result))

  return { partId, skId }
}
