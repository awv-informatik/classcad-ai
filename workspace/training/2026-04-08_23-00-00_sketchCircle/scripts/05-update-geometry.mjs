// 05 — updateGeometry for circles: full update, partial update, radius-only, centerPos-only
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create initial circle
  const circleId = (await api.v1.sketch.circle({ id: skId, centerPos: [30, 20, 0], radius: 10 })).result
  console.log('[05] circleId:', circleId)

  // Verify initial state
  const pts0 = await api.v1.sketch.getPoints({ id: circleId })
  const pos0 = await api.v1.sketch.getPositions({ id: pts0.result.centerId })
  console.log('[05] initial center:', JSON.stringify(pos0.result))

  await snapshot('before-update')

  // Full update: both centerPos and radius
  const r1 = await api.v1.sketch.updateGeometry({
    id: skId,
    circles: [{ id: circleId, centerPos: [50, 40, 0], radius: 20 }]
  })
  console.log('[05] full update: maxLevel:', r1.maxLevel, 'result:', r1.result)

  const pos1 = await api.v1.sketch.getPositions({ id: pts0.result.centerId })
  console.log('[05] after full update center:', JSON.stringify(pos1.result))

  await snapshot('after-full-update')

  // Partial update: radius only (omit centerPos)
  const r2 = await api.v1.sketch.updateGeometry({
    id: skId,
    circles: [{ id: circleId, radius: 5 }]
  })
  console.log('[05] radius-only update: maxLevel:', r2.maxLevel, 'result:', r2.result)
  if (r2.messages?.length) console.log('[05] messages:', JSON.stringify(r2.messages))

  // Partial update: centerPos only (omit radius)
  const r3 = await api.v1.sketch.updateGeometry({
    id: skId,
    circles: [{ id: circleId, centerPos: [10, 10, 0] }]
  })
  console.log('[05] centerPos-only update: maxLevel:', r3.maxLevel, 'result:', r3.result)
  if (r3.messages?.length) console.log('[05] messages:', JSON.stringify(r3.messages))

  // Check final state
  const pos3 = await api.v1.sketch.getPositions({ id: pts0.result.centerId })
  console.log('[05] final center:', JSON.stringify(pos3.result))

  // Check radius in structure
  const tree = r3.structure?.tree
  if (tree) {
    const circNode = tree[String(circleId)]
    console.log('[05] final radius member:', circNode?.members?.radius?.value)
  }

  await snapshot('after-partial-updates')
  return { partId }
}
