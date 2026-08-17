// Test: setWorkPlane to a tilted (non-axis-aligned) plane
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TiltedPlane' })).result

  // Tilted plane — normal at 45 degrees between Z and Y
  const wpId = (await api.v1.part.workPlane({
    id: partId, name: 'Tilted45',
    normal: [0, 1, 1],  // not normalized — does ClassCAD normalize it?
    position: [0, 0, 0],
  })).result
  console.log('[14] wpId:', wpId)

  const skId = (await api.v1.sketch.create({ id: partId, name: 'Sk1' })).result

  const r = await api.v1.sketch.setWorkPlane({ id: skId, planeId: wpId })
  console.log('[14] setWorkPlane maxLevel:', r.maxLevel)

  const sk = r.structure?.tree?.[''+skId]
  console.log('[14] coordSys:', JSON.stringify(sk?.coordinateSystem))

  // Add a rectangle to verify geometry works on tilted plane
  const rectR = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [30, 20, 0] })
  console.log('[14] rectangle maxLevel:', rectR.maxLevel)

  await snapshot('tilted-plane-rect')

  filewrite({
    coordSys: sk?.coordinateSystem,
    planeRef: sk?.members?.planeReference?.value,
    rectResult: rectR.result,
    rectMaxLevel: rectR.maxLevel,
  }, 'tilted-plane')

  return { partId }
}
