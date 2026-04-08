// Test: setWorkPlane on sketch that already has geometry
// Does existing geometry survive? Does the coordinate system affect it?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GeomTest' })).result

  // Create sketch and add a rectangle
  const skId = (await api.v1.sketch.create({ id: partId, name: 'SkWithGeom' })).result
  const rectR = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [40, 30, 0] })
  console.log('[02] rectangle:', rectR.result, 'maxLevel:', rectR.maxLevel)
  await snapshot('before-setworkplane')

  // Get structure before
  const skBefore = rectR.structure?.tree?.[''+skId]
  filewrite(skBefore, 'sketch-before')
  console.log('[02] before coordinateSystem:', JSON.stringify(skBefore?.coordinateSystem))

  // Create work plane and reassign
  const wpId = (await api.v1.part.workPlane({
    id: partId, normal: [0, 0, 1], position: [0, 0, 100],
  })).result
  console.log('[02] wpId:', wpId)

  const r = await api.v1.sketch.setWorkPlane({ id: skId, planeId: wpId })
  console.log('[02] setWorkPlane result:', r.result, 'maxLevel:', r.maxLevel)

  const skAfter = r.structure?.tree?.[''+skId]
  filewrite(skAfter, 'sketch-after')
  console.log('[02] after coordinateSystem:', JSON.stringify(skAfter?.coordinateSystem))

  await snapshot('after-setworkplane')

  // Check if geometry children survived
  const geomChildren = Object.entries(r.structure?.tree || {}).filter(
    ([id, n]) => n.parent === skId || (n.parent && r.structure?.tree?.[''+n.parent]?.parent === skId)
  )
  console.log('[02] geometry-related nodes after:', geomChildren.length)

  return { partId, skId, wpId }
}
