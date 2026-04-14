// Test basic numeric value update on an OFFSET dimension
// Creates a rectangle, adds OFFSET dimension, then updates the value
export default async function (api, { snapshot, filewrite }) {
  // Create part with planeId
  const partR = await api.v1.part.create({ name: 'UpdateDimTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Rectangle 80x50
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  console.log('[01] rectIds:', rectIds)

  // Fix bottom-left corner
  const pts = (await api.v1.sketch.getPoints({ id: rectIds[0] })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts.startId] })

  // Get bottom line positions before
  const posBefore = (await api.v1.sketch.getPositions({ id: rectIds[0] })).result
  console.log('[01] bottom line before:', JSON.stringify(posBefore))

  // Add OFFSET dimension on bottom line (should auto-value to 80)
  const dimR = await api.v1.sketch.dimension({ id: skId, name: 'width', type: 'OFFSET', geomIds: [rectIds[0]] })
  const dimId = dimR.result
  console.log('[01] dimension created:', dimId, 'maxLevel:', dimR.maxLevel)

  await snapshot('before-update')

  // Now UPDATE dimension to 120
  const updR = await api.v1.sketch.updateDimension({ id: dimId, value: 120 })
  console.log('[01] updateDimension result:', updR.result, 'maxLevel:', updR.maxLevel)
  console.log('[01] updateDimension messages:', JSON.stringify(updR.messages))

  // Get bottom line positions after update
  const posAfter = (await api.v1.sketch.getPositions({ id: rectIds[0] })).result
  console.log('[01] bottom line after:', JSON.stringify(posAfter))

  // Also check right line (rectIds[1]) to see if height changed
  const rightBefore = (await api.v1.sketch.getPositions({ id: rectIds[1] })).result
  console.log('[01] right line after:', JSON.stringify(rightBefore))

  await snapshot('after-update')

  filewrite({
    dimId,
    dimCreateMaxLevel: dimR.maxLevel,
    updateResult: updR.result,
    updateMaxLevel: updR.maxLevel,
    updateMessages: updR.messages,
    bottomLineBefore: posBefore,
    bottomLineAfter: posAfter,
    rightLineAfter: rightBefore,
  }, 'basic-update-data')

  return { partId, dimId }
}
