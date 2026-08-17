// Test: setWorkPlane to a work plane created with offset
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OffsetPlane' })).result

  const skId = (await api.v1.sketch.create({ id: partId, name: 'Sk1' })).result

  // Create work plane with normal=[0,0,1] (Z-up) and offset=50
  const wpId = (await api.v1.part.workPlane({
    id: partId, name: 'OffsetZ', normal: [0, 0, 1], position: [0, 0, 0], offset: 50,
  })).result
  console.log('[08] wpId:', wpId)

  const r = await api.v1.sketch.setWorkPlane({ id: skId, planeId: wpId })
  console.log('[08] setWorkPlane maxLevel:', r.maxLevel)

  const sk = r.structure?.tree?.[''+skId]
  console.log('[08] coordinateSystem:', JSON.stringify(sk?.coordinateSystem))
  console.log('[08] planeReference:', sk?.members?.planeReference?.value)

  // The origin Z should be 50 (offset)
  filewrite({
    coordSys: sk?.coordinateSystem,
    planeRef: sk?.members?.planeReference?.value,
  }, 'offset-plane')

  return { partId }
}
