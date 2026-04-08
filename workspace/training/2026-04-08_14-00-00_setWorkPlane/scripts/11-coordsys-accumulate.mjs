// Test: Does coordinateSystem origin accumulate across reassignments?
// Script 03 showed origin [50,0,75] after A→B→A — investigate
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'AccumTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId, name: 'Sk1' })).result

  // Starting coordSys should be [[0,0,0],...]
  const r0 = await api.v1.sketch.create({ id: partId, name: 'dummy' })
  const sk0 = r0.structure?.tree?.[''+skId]
  console.log('[11] initial origin:', JSON.stringify(sk0?.coordinateSystem?.[0]))

  // Plane at X=30
  const wpA = (await api.v1.part.workPlane({
    id: partId, normal: [1, 0, 0], position: [30, 0, 0],
  })).result

  // Plane at Z=40
  const wpB = (await api.v1.part.workPlane({
    id: partId, normal: [0, 0, 1], position: [0, 0, 40],
  })).result

  // Move to A
  const r1 = await api.v1.sketch.setWorkPlane({ id: skId, planeId: wpA })
  console.log('[11] after A origin:', JSON.stringify(r1.structure?.tree?.[''+skId]?.coordinateSystem?.[0]))

  // Move to B
  const r2 = await api.v1.sketch.setWorkPlane({ id: skId, planeId: wpB })
  console.log('[11] after B origin:', JSON.stringify(r2.structure?.tree?.[''+skId]?.coordinateSystem?.[0]))

  // Move back to A — does origin go back to [30,0,0] or accumulate?
  const r3 = await api.v1.sketch.setWorkPlane({ id: skId, planeId: wpA })
  console.log('[11] after A again origin:', JSON.stringify(r3.structure?.tree?.[''+skId]?.coordinateSystem?.[0]))

  filewrite({
    initial: sk0?.coordinateSystem,
    afterA: r1.structure?.tree?.[''+skId]?.coordinateSystem,
    afterB: r2.structure?.tree?.[''+skId]?.coordinateSystem,
    afterA2: r3.structure?.tree?.[''+skId]?.coordinateSystem,
  }, 'coordsys-accumulate')

  return { partId }
}
