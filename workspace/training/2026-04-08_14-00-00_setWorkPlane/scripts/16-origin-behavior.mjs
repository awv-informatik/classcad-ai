// Test: Deep-dive on origin behavior during reassignment
// Hypothesis: when moving to a new plane, the sketch origin is the new plane's position
// plus any existing offset in the old plane's normal direction
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OriginTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId, name: 'Sk1' })).result

  // Plane at y=50 with normal [0,1,0]
  const wp1 = (await api.v1.part.workPlane({
    id: partId, normal: [0, 1, 0], position: [0, 50, 0],
  })).result

  // Move to wp1
  const r1 = await api.v1.sketch.setWorkPlane({ id: skId, planeId: wp1 })
  const sk1 = r1.structure?.tree?.[''+skId]
  console.log('[16] after wp1 origin:', JSON.stringify(sk1?.coordinateSystem?.[0]))
  // Expected: [0,50,0]

  // Plane at x=20, y=0, z=0 with normal [1,0,0]
  const wp2 = (await api.v1.part.workPlane({
    id: partId, normal: [1, 0, 0], position: [20, 0, 0],
  })).result

  // Move to wp2 — what happens to Y=50 from wp1?
  const r2 = await api.v1.sketch.setWorkPlane({ id: skId, planeId: wp2 })
  const sk2 = r2.structure?.tree?.[''+skId]
  console.log('[16] after wp2 origin:', JSON.stringify(sk2?.coordinateSystem?.[0]))
  // If origin resets to plane pos: [20,0,0]
  // If origin accumulates: [20,50,0]

  // Now create a fresh sketch and do the same — is origin always just the plane's position?
  const sk2Id = (await api.v1.sketch.create({ id: partId, name: 'Sk2' })).result
  const r3 = await api.v1.sketch.setWorkPlane({ id: sk2Id, planeId: wp2 })
  const sk2After = r3.structure?.tree?.[''+sk2Id]
  console.log('[16] fresh sketch on wp2 origin:', JSON.stringify(sk2After?.coordinateSystem?.[0]))

  filewrite({
    afterWp1: sk1?.coordinateSystem,
    afterWp2: sk2?.coordinateSystem,
    freshOnWp2: sk2After?.coordinateSystem,
  }, 'origin-behavior')

  return { partId }
}
