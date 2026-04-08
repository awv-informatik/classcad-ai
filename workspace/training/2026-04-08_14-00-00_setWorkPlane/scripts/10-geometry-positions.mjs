// Test: Does sketch geometry change position in world space after setWorkPlane?
// Create a line on XY plane, then move sketch to a plane at z=100
// Compare the line's world-space coordinates
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GeomPos' })).result
  const skId = (await api.v1.sketch.create({ id: partId, name: 'Sk1' })).result

  // Draw a line from (10,20,0) to (50,40,0)
  const lineR = await api.v1.sketch.line({ id: skId, startPos: [10, 20, 0], endPos: [50, 40, 0] })
  console.log('[10] line result:', lineR.result, 'maxLevel:', lineR.maxLevel)
  await snapshot('line-on-xy')

  // Create work plane at z=100
  const wpId = (await api.v1.part.workPlane({
    id: partId, normal: [0, 0, 1], position: [0, 0, 100],
  })).result

  // Move sketch to new plane
  const r = await api.v1.sketch.setWorkPlane({ id: skId, planeId: wpId })
  console.log('[10] setWorkPlane maxLevel:', r.maxLevel)
  await snapshot('line-after-move')

  // Check coordinate system
  const sk = r.structure?.tree?.[''+skId]
  console.log('[10] new coordSys:', JSON.stringify(sk?.coordinateSystem))

  // The line's local coords (10,20,0)→(50,40,0) should remain the same
  // But world-space would be (10,20,100)→(50,40,100) because the plane moved

  filewrite({
    coordSys: sk?.coordinateSystem,
    planeRef: sk?.members?.planeReference?.value,
  }, 'geometry-positions')

  return { partId }
}
