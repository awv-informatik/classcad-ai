// Test: setWorkPlane with a PLANE-type work plane (referenced to another plane)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RefPlane' })).result

  // Create a base work plane
  const baseWp = (await api.v1.part.workPlane({
    id: partId, name: 'Base', normal: [0, 0, 1], position: [0, 0, 0],
  })).result
  console.log('[12] baseWp:', baseWp)

  // Create a PLANE-type work plane that references base with offset=80
  const refWp = (await api.v1.part.workPlane({
    id: partId, name: 'RefOffset80', type: 'PLANE', references: [baseWp], offset: 80,
  })).result
  console.log('[12] refWp:', refWp)

  // Create sketch and assign to referenced plane
  const skId = (await api.v1.sketch.create({ id: partId, name: 'Sk1' })).result
  const r = await api.v1.sketch.setWorkPlane({ id: skId, planeId: refWp })
  console.log('[12] setWorkPlane maxLevel:', r.maxLevel)

  const sk = r.structure?.tree?.[''+skId]
  console.log('[12] coordSys:', JSON.stringify(sk?.coordinateSystem))
  console.log('[12] planeRef:', sk?.members?.planeReference?.value)

  filewrite({
    coordSys: sk?.coordinateSystem,
    planeRef: sk?.members?.planeReference?.value,
  }, 'plane-type-ref')

  return { partId }
}
