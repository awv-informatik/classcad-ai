// 07 — Delete arc and verify cleanup
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DeleteTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const arcId = (await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [-40, 0, 0],
    centerPos: [0, 0, 0],
    endPos: [40, 0, 0],
  })).result
  console.log('[07] created arc:', arcId)

  const geoBefore = (await api.v1.sketch.getGeometry({ id: skId })).result
  console.log('[07] geometry before delete:', JSON.stringify(geoBefore))

  // Delete
  const dr = await api.v1.sketch.deleteObject({ ids: [arcId] })
  console.log('[07] delete result:', dr.result, 'maxLevel:', dr.maxLevel)

  const geoAfter = (await api.v1.sketch.getGeometry({ id: skId })).result
  console.log('[07] geometry after delete:', JSON.stringify(geoAfter))

  // Try to getPoints on deleted arc
  const ptsDead = await api.v1.sketch.getPoints({ id: arcId })
  console.log('[07] getPoints on deleted arc:', ptsDead.result, 'maxLevel:', ptsDead.maxLevel)

  filewrite({ geoBefore, geoAfter, deleteResult: dr.result }, 'delete-verification')

  return { partId }
}
