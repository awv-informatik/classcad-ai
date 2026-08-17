// Verify TANGENT circle-line by dumping circle node and using getPoints
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'TangentVerify' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Fixed horizontal line at y=0
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [100, 0, 0] })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [lineId] })

  // Circle at (50, 30), radius 15
  const circR = await api.v1.sketch.circle({ id: skId, centerPos: [50, 30, 0], radius: 15 })
  const circId = circR.result

  // Dump circle node members to find center
  const circNode = Object.values(circR.structure.tree).find(n => n.id === circId)
  console.log('[03c] circle node class:', circNode?.class)
  console.log('[03c] circle members keys:', circNode?.members ? Object.keys(circNode.members) : 'none')
  filewrite(circNode, 'circle-node-before')

  // Try getPoints on circle (may return center as a point ID)
  const circPts = (await api.v1.sketch.getPoints({ id: circId })).result
  console.log('[03c] circle getPoints:', JSON.stringify(circPts))

  // Get center position from getPoints if it returns a center point
  if (circPts?.centerId) {
    const centerPos = (await api.v1.sketch.getPositions({ id: circPts.centerId })).result
    console.log('[03c] center pos before:', JSON.stringify(centerPos.pos))
  } else if (circPts?.startId) {
    const pos = (await api.v1.sketch.getPositions({ id: circPts.startId })).result
    console.log('[03c] startId pos before:', JSON.stringify(pos.pos))
  }

  await snapshot('before')

  // Apply TANGENT
  const r = await api.v1.sketch.constraint({ id: skId, type: 'TANGENT', geomIds: [circId, lineId] })
  console.log('[03c] TANGENT result:', r.result, 'maxLevel:', r.maxLevel)

  // Read center after
  if (circPts?.centerId) {
    const centerPosAfter = (await api.v1.sketch.getPositions({ id: circPts.centerId })).result
    console.log('[03c] center pos after:', JSON.stringify(centerPosAfter.pos))
    filewrite({ centerBefore: 'see above', centerAfter: centerPosAfter.pos }, 'tangent-verify')
  }

  // Also dump circle node after from the constraint response
  const circNodeAfter = Object.values(r.structure.tree).find(n => n.id === circId)
  filewrite(circNodeAfter, 'circle-node-after')

  await snapshot('after')

  return { partId }
}
