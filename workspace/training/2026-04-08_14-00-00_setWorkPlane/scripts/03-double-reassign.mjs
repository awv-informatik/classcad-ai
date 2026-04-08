// Test: Double reassignment — move sketch from plane A to plane B, then back to A
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DoubleMove' })).result

  const skId = (await api.v1.sketch.create({ id: partId, name: 'Sk1' })).result

  // Create two work planes
  const wpA = (await api.v1.part.workPlane({
    id: partId, name: 'PlaneA', normal: [1, 0, 0], position: [50, 0, 0],
  })).result
  const wpB = (await api.v1.part.workPlane({
    id: partId, name: 'PlaneB', normal: [0, 0, 1], position: [0, 0, 75],
  })).result
  console.log('[03] wpA:', wpA, 'wpB:', wpB)

  // Move to A
  const r1 = await api.v1.sketch.setWorkPlane({ id: skId, planeId: wpA })
  console.log('[03] move to A — result:', r1.result, 'maxLevel:', r1.maxLevel)
  const afterA = r1.structure?.tree?.[''+skId]
  console.log('[03] after A planeRef:', afterA?.members?.planeReference?.value)
  console.log('[03] after A coordSys:', JSON.stringify(afterA?.coordinateSystem))

  // Move to B
  const r2 = await api.v1.sketch.setWorkPlane({ id: skId, planeId: wpB })
  console.log('[03] move to B — result:', r2.result, 'maxLevel:', r2.maxLevel)
  const afterB = r2.structure?.tree?.[''+skId]
  console.log('[03] after B planeRef:', afterB?.members?.planeReference?.value)
  console.log('[03] after B coordSys:', JSON.stringify(afterB?.coordinateSystem))

  // Move back to A
  const r3 = await api.v1.sketch.setWorkPlane({ id: skId, planeId: wpA })
  console.log('[03] move back to A — result:', r3.result, 'maxLevel:', r3.maxLevel)
  const afterA2 = r3.structure?.tree?.[''+skId]
  console.log('[03] after A2 planeRef:', afterA2?.members?.planeReference?.value)
  console.log('[03] after A2 coordSys:', JSON.stringify(afterA2?.coordinateSystem))

  filewrite({
    afterA: { planeRef: afterA?.members?.planeReference?.value, coordSys: afterA?.coordinateSystem },
    afterB: { planeRef: afterB?.members?.planeReference?.value, coordSys: afterB?.coordinateSystem },
    afterA2: { planeRef: afterA2?.members?.planeReference?.value, coordSys: afterA2?.coordinateSystem },
  }, 'double-reassign')

  return { partId }
}
