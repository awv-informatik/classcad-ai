// 06 — updateGeometry with arcsByCenter: move/reshape an arc after creation
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create arc
  const arcId = (await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [-40, 0, 0],
    centerPos: [0, 0, 0],
    endPos: [40, 0, 0],
  })).result
  console.log('[06] created arc:', arcId)

  const posBefore = (await api.v1.sketch.getPositions({ id: arcId })).result
  console.log('[06] before:', JSON.stringify(posBefore))
  await snapshot('before-update')

  // Update: move and reshape the arc
  const ur = await api.v1.sketch.updateGeometry({
    id: skId,
    arcsByCenter: [{
      id: arcId,
      startPos: [-20, 20, 0],
      centerPos: [0, 20, 0],
      endPos: [20, 20, 0],
    }]
  })
  console.log('[06] update result:', ur.result, 'maxLevel:', ur.maxLevel)
  console.log('[06] update messages:', JSON.stringify(ur.messages))

  const posAfter = (await api.v1.sketch.getPositions({ id: arcId })).result
  console.log('[06] after:', JSON.stringify(posAfter))

  filewrite({ before: posBefore, after: posAfter, updateResult: ur.result, updateMaxLevel: ur.maxLevel }, 'update-comparison')

  await snapshot('after-update')

  // Test: partial update — omit one field
  const ur2 = await api.v1.sketch.updateGeometry({
    id: skId,
    arcsByCenter: [{
      id: arcId,
      startPos: [-30, 30, 0],
      endPos: [30, 30, 0],
      // omitting centerPos
    }]
  })
  console.log('[06] partial update (no centerPos) maxLevel:', ur2.maxLevel, 'messages:', JSON.stringify(ur2.messages))

  // Test: update with isClockwise
  const ur3 = await api.v1.sketch.updateGeometry({
    id: skId,
    arcsByCenter: [{
      id: arcId,
      startPos: [-20, 20, 0],
      centerPos: [0, 20, 0],
      endPos: [20, 20, 0],
      isClockwise: false,
    }]
  })
  console.log('[06] update with isClockwise=false maxLevel:', ur3.maxLevel)
  await snapshot('after-flip')

  return { partId }
}
