// Test deleting a linear pattern
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DeletePattern' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create geometry and pattern
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [10, 5, 0] })).result
  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1] })).result

  const r = await api.v1.sketch.linearPattern({
    id: skId, rigidSetId: rsId,
    xCount: 3, xDistance: 25,
  })
  const constraintId = r.result.constraint
  const dimId = r.result.dimensions[0]
  const geomIds = r.result.geometry
  console.log('[11] constraint:', constraintId, 'dimId:', dimId, 'geomIds:', geomIds)

  await snapshot('before-delete')

  // Delete the constraint
  const del = await api.v1.sketch.deleteObject({ ids: [constraintId] })
  console.log('[11] delete constraint: maxLevel:', del.maxLevel)
  filewrite({ result: del.result, messages: del.messages }, 'delete-constraint')

  await snapshot('after-delete-constraint')

  // Check if the copies still exist by trying to get geometry
  const geom = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[11] remaining geometry count:', geom.result?.length)
  filewrite(geom.result, 'remaining-geometry')

  return { partId }
}
