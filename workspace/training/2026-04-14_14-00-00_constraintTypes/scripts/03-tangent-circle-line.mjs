// Test TANGENT circle-line (circle, not arc) and circle-circle
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'TangentStudy' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Fixed horizontal line at y=0
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [100, 0, 0] })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [lineId] })

  // Circle above line, not tangent yet (center at (50, 30), radius 15)
  const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [50, 30, 0], radius: 15 })).result
  console.log('[03] circId:', circId)

  await snapshot('before')

  // TANGENT circle-line
  const r = await api.v1.sketch.constraint({ id: skId, type: 'TANGENT', geomIds: [circId, lineId] })
  console.log('[03] TANGENT circle-line result:', r.result, 'maxLevel:', r.maxLevel)

  // Read circle center after
  const circStruct = (await api.v1.sketch.getPositions({ id: circId })).result
  console.log('[03] circle center after:', JSON.stringify(circStruct))

  await snapshot('after')

  // Check: center Y should equal radius (15) since line is at y=0
  const centerY = circStruct.pos ? circStruct.pos.y : null
  console.log('[03] centerY:', centerY, 'expected:', 15, 'tangent:', centerY !== null && Math.abs(centerY - 15) < 0.1)

  filewrite({
    constraintResult: r.result,
    maxLevel: r.maxLevel,
    centerAfter: circStruct.pos ? [circStruct.pos.x, circStruct.pos.y] : circStruct,
    expectedCenterY: 15,
    tangent: centerY !== null && Math.abs(centerY - 15) < 0.1
  }, 'tangent-circle-line')

  return { partId }
}
