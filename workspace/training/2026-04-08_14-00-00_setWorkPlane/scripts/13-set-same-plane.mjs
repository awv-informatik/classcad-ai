// Test: setWorkPlane to the same plane the sketch is already on (idempotent?)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SamePlane' })).result

  const wpId = (await api.v1.part.workPlane({
    id: partId, normal: [0, 1, 0], position: [0, 25, 0],
  })).result

  // Create sketch on the work plane
  const skId = (await api.v1.sketch.create({ id: partId, name: 'Sk1', planeId: wpId })).result
  console.log('[13] skId:', skId)

  const r0 = await api.v1.sketch.create({ id: partId, name: 'dummy' })
  const skBefore = r0.structure?.tree?.[''+skId]
  console.log('[13] before planeRef:', skBefore?.members?.planeReference?.value)
  console.log('[13] before coordSys:', JSON.stringify(skBefore?.coordinateSystem))

  // Set to the same plane
  const r = await api.v1.sketch.setWorkPlane({ id: skId, planeId: wpId })
  console.log('[13] same plane — maxLevel:', r.maxLevel)

  const skAfter = r.structure?.tree?.[''+skId]
  console.log('[13] after planeRef:', skAfter?.members?.planeReference?.value)
  console.log('[13] after coordSys:', JSON.stringify(skAfter?.coordinateSystem))

  filewrite({
    before: { planeRef: skBefore?.members?.planeReference?.value, coordSys: skBefore?.coordinateSystem },
    after: { planeRef: skAfter?.members?.planeReference?.value, coordSys: skAfter?.coordinateSystem },
  }, 'same-plane')

  return { partId }
}
