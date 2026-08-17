// Verify deleted dimension behavior — use correct deleteObject API (ids plural)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rectIds[0]] })).result
  console.log('[14] dimId:', dimId)

  // Confirm dim exists
  const beforeR = await api.v1.sketch.updateDimensionPosition({ id: dimId, pos: [40, 25, 0] })
  console.log('[14] before delete - maxLevel:', beforeR.maxLevel)

  // Delete using correct param name (ids)
  const delR = await api.v1.sketch.deleteObject({ ids: [dimId] })
  console.log('[14] deleteObject result:', delR.result, 'maxLevel:', delR.maxLevel, 'msgs:', JSON.stringify(delR.messages))

  // Check if dim node still in structure
  const delNode = delR.structure?.tree?.[String(dimId)]
  console.log('[14] dim node after delete exists?', !!delNode)

  // Try updateDimensionPosition on deleted dim
  const r = await api.v1.sketch.updateDimensionPosition({ id: dimId, pos: [50, 60, 0] })
  console.log('[14] after delete → result:', r.result, 'maxLevel:', r.maxLevel, 'msgs:', JSON.stringify(r.messages))

  const afterNode = r.structure?.tree?.[String(dimId)]
  console.log('[14] dim node after updatePos exists?', !!afterNode)

  filewrite({
    deleteResult: { result: delR.result, maxLevel: delR.maxLevel, messages: delR.messages },
    dimNodeAfterDelete: !!delNode,
    updatePosResult: { result: r.result, maxLevel: r.maxLevel, messages: r.messages },
    dimNodeAfterUpdate: !!afterNode,
  }, 'deleted-dim-verify')

  return {}
}
