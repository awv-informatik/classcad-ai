// Test: setWorkPlane with standard work planes (XY, XZ, YZ)
// The part comes with 3 standard work planes — find their IDs
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'StdPlanes' })
  const partId = partR.result
  console.log('[07] partId:', partId)

  // Find standard work planes in structure tree
  const tree = partR.structure?.tree || {}
  const workPlanes = Object.values(tree).filter(n => n.class === 'CC_WorkPlane')
  console.log('[07] standard work planes:')
  for (const wp of workPlanes) {
    console.log('  ', wp.id, wp.name)
  }
  filewrite(workPlanes, 'std-workplanes')

  if (workPlanes.length === 0) {
    console.log('[07] no standard work planes found — creating custom ones')
    // Create 3 custom work planes for XY, XZ, YZ
    const wpXY = (await api.v1.part.workPlane({ id: partId, name: 'XY', normal: [0, 0, 1] })).result
    const wpXZ = (await api.v1.part.workPlane({ id: partId, name: 'XZ', normal: [0, 1, 0] })).result
    const wpYZ = (await api.v1.part.workPlane({ id: partId, name: 'YZ', normal: [1, 0, 0] })).result
    console.log('[07] custom WPs:', wpXY, wpXZ, wpYZ)

    const skId = (await api.v1.sketch.create({ id: partId, name: 'Sk1' })).result
    console.log('[07] skId:', skId)

    // Move to XZ
    const r1 = await api.v1.sketch.setWorkPlane({ id: skId, planeId: wpXZ })
    console.log('[07] move to XZ — maxLevel:', r1.maxLevel)
    console.log('[07] coordSys:', JSON.stringify(r1.structure?.tree?.[''+skId]?.coordinateSystem))

    // Move to YZ
    const r2 = await api.v1.sketch.setWorkPlane({ id: skId, planeId: wpYZ })
    console.log('[07] move to YZ — maxLevel:', r2.maxLevel)
    console.log('[07] coordSys:', JSON.stringify(r2.structure?.tree?.[''+skId]?.coordinateSystem))
  } else {
    // Use existing standard work planes
    const skId = (await api.v1.sketch.create({ id: partId, name: 'Sk1' })).result
    console.log('[07] skId:', skId)

    for (const wp of workPlanes) {
      const r = await api.v1.sketch.setWorkPlane({ id: skId, planeId: wp.id })
      console.log('[07] move to', wp.name, '— maxLevel:', r.maxLevel,
        'coordSys:', JSON.stringify(r.structure?.tree?.[''+skId]?.coordinateSystem))
    }
  }

  return { partId }
}
