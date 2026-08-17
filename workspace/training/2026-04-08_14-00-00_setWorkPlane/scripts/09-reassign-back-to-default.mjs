// Test: Can you reassign a sketch back to the "default" XY plane?
// The default has planeReference=0 (no explicit work plane).
// If we create an XY work plane, assign, does it behave the same?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BackToDefault' })).result

  const skId = (await api.v1.sketch.create({ id: partId, name: 'Sk1' })).result
  console.log('[09] original planeRef:', 0, '(default XY)')

  // Create a custom plane, move sketch there
  const wpId = (await api.v1.part.workPlane({
    id: partId, normal: [0, 1, 0], position: [0, 50, 0],
  })).result

  const r1 = await api.v1.sketch.setWorkPlane({ id: skId, planeId: wpId })
  const afterMove = r1.structure?.tree?.[''+skId]
  console.log('[09] after move — planeRef:', afterMove?.members?.planeReference?.value)

  // Now try to go back to default — create an XY work plane at origin
  const wpXY = (await api.v1.part.workPlane({
    id: partId, name: 'XYOrigin', normal: [0, 0, 1], position: [0, 0, 0],
  })).result

  const r2 = await api.v1.sketch.setWorkPlane({ id: skId, planeId: wpXY })
  const afterReturn = r2.structure?.tree?.[''+skId]
  console.log('[09] after return — planeRef:', afterReturn?.members?.planeReference?.value)
  console.log('[09] after return coordSys:', JSON.stringify(afterReturn?.coordinateSystem))

  // planeReference should now be wpXY, not 0 (the default is gone)
  filewrite({
    afterMove: { planeRef: afterMove?.members?.planeReference?.value, coordSys: afterMove?.coordinateSystem },
    afterReturn: { planeRef: afterReturn?.members?.planeReference?.value, coordSys: afterReturn?.coordinateSystem },
  }, 'back-to-default')

  return { partId }
}
