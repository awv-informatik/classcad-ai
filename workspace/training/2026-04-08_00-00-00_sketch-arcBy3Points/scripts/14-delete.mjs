// Delete an arcBy3Points arc and verify
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DelTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create two arcs
  const arc1 = (await api.v1.sketch.arcBy3Points({
    id: skId,
    startPos: [0, 0, 0],
    midPos: [20, 20, 0],
    endPos: [40, 0, 0],
  })).result

  const arc2 = (await api.v1.sketch.arcBy3Points({
    id: skId,
    startPos: [0, -40, 0],
    midPos: [20, -20, 0],
    endPos: [40, -40, 0],
    genFixation: 0,
  })).result

  console.log('[14] arc1:', arc1, 'arc2:', arc2)

  const geoBefore = (await api.v1.sketch.getGeometry({ id: skId })).result
  console.log('[14] arcs before:', JSON.stringify(geoBefore.arcs))

  // Delete arc1
  const rd = await api.v1.sketch.deleteObject({ ids: [arc1] })
  console.log('[14] delete result:', rd.result, 'maxLevel:', rd.maxLevel)

  const geoAfter = (await api.v1.sketch.getGeometry({ id: skId })).result
  console.log('[14] arcs after:', JSON.stringify(geoAfter.arcs))

  // Try getPositions on deleted arc
  const posDeleted = await api.v1.sketch.getPositions({ id: arc1 })
  console.log('[14] getPositions(deleted):', posDeleted.result, 'maxLevel:', posDeleted.maxLevel)

  filewrite({
    arcsBefore: geoBefore.arcs,
    arcsAfter: geoAfter.arcs,
    deleteResult: { result: rd.result, maxLevel: rd.maxLevel },
    deletedPosQuery: { result: posDeleted.result, maxLevel: posDeleted.maxLevel },
  }, 'delete-result')

  await snapshot('after-delete')
  return { partId }
}
