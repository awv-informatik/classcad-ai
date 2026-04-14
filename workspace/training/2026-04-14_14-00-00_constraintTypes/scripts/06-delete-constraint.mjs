// Test: does deleting a constraint cause geometry to revert?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'DeleteConstraint' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Diagonal line
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [10, 5, 0], endPos: [60, 40, 0] })).result
  const pts = (await api.v1.sketch.getPoints({ id: lineId })).result

  // Fix start point
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts.startId] })

  // Get position before constraint
  const endBeforeR = (await api.v1.sketch.getPositions({ id: pts.endId })).result
  const endBefore = [endBeforeR.pos.x, endBeforeR.pos.y]
  console.log('[06] end before HORIZONTAL:', JSON.stringify(endBefore))

  await snapshot('before')

  // Apply HORIZONTAL — line should rotate
  const hConstraint = (await api.v1.sketch.constraint({ id: skId, type: 'HORIZONTAL', geomIds: [lineId] })).result
  console.log('[06] HORIZONTAL id:', hConstraint)

  const endAfterHR = (await api.v1.sketch.getPositions({ id: pts.endId })).result
  const endAfterH = [endAfterHR.pos.x, endAfterHR.pos.y]
  console.log('[06] end after HORIZONTAL:', JSON.stringify(endAfterH))

  await snapshot('after-horizontal')

  // Now DELETE the HORIZONTAL constraint
  const delR = await api.v1.sketch.deleteObject({ ids: [hConstraint] })
  console.log('[06] delete result:', delR.result, 'maxLevel:', delR.maxLevel)

  const endAfterDelR = (await api.v1.sketch.getPositions({ id: pts.endId })).result
  const endAfterDel = [endAfterDelR.pos.x, endAfterDelR.pos.y]
  console.log('[06] end after DELETE:', JSON.stringify(endAfterDel))

  await snapshot('after-delete')

  // Check: did geometry revert to original position or stay at the H position?
  const revertedToOriginal = Math.abs(endAfterDel[0] - endBefore[0]) < 0.5 && Math.abs(endAfterDel[1] - endBefore[1]) < 0.5
  const stayedAtH = Math.abs(endAfterDel[0] - endAfterH[0]) < 0.5 && Math.abs(endAfterDel[1] - endAfterH[1]) < 0.5

  console.log('[06] revertedToOriginal:', revertedToOriginal, 'stayedAtH:', stayedAtH)

  filewrite({
    endBefore: endBefore,
    endAfterH: endAfterH,
    endAfterDelete: endAfterDel,
    revertedToOriginal,
    stayedAtH,
    deleteMaxLevel: delR.maxLevel
  }, 'delete-constraint')

  return { partId }
}
