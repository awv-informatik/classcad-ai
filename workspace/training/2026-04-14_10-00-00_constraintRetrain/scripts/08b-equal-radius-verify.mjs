// Rerun of 08: EQUAL_RADIUS — measure BOTH circles' radii via getPositions on center+edge
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'EqRadV' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Fixed circle, radius 30
  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [c1] })

  // Smaller circle, radius 15
  const c2 = (await api.v1.sketch.circle({ id: skId, centerPos: [80, 0, 0], radius: 15 })).result

  // Get center + edge points to measure radii
  const c1Pts = (await api.v1.sketch.getPoints({ id: c1 })).result
  const c2Pts = (await api.v1.sketch.getPoints({ id: c2 })).result

  // For circles, getPoints returns { centerId }. We need the structure to find the radius.
  // Check structure tree for radius parameter
  const c1Node = (await api.v1.sketch.getGeometry({ id: skId })).result
  console.log('[08b] sketch geometry:', JSON.stringify(c1Node))

  // Use getPositions on center to verify center position
  const c1CenterBefore = (await api.v1.sketch.getPositions({ id: c1Pts.centerId })).result
  const c2CenterBefore = (await api.v1.sketch.getPositions({ id: c2Pts.centerId })).result
  console.log('[08b] BEFORE: c1 center:', JSON.stringify(c1CenterBefore.pos), 'c2 center:', JSON.stringify(c2CenterBefore.pos))

  // Dump structure to get radius values
  const structBefore = (await api.v1.part.create({ name: 'dummy' }))  // can't do this, let me use the constraint response structure

  // Apply EQUAL_RADIUS
  const cr = await api.v1.sketch.constraint({ id: skId, type: 'EQUAL_RADIUS', geomIds: [c1, c2] })
  console.log('[08b] constraint result:', cr.result, 'maxLevel:', cr.maxLevel)

  // Check the structure tree for circle nodes to find radius
  const tree = cr.structure?.tree || {}
  const c1Info = tree[c1]
  const c2Info = tree[c2]
  console.log('[08b] c1 node:', JSON.stringify(c1Info))
  console.log('[08b] c2 node:', JSON.stringify(c2Info))

  // Look for radius in members
  if (c1Info?.members?.radius) console.log('[08b] c1 radius:', c1Info.members.radius.value)
  if (c2Info?.members?.radius) console.log('[08b] c2 radius:', c2Info.members.radius.value)

  // Also check graphic data for circle rendering
  const c1CenterAfter = (await api.v1.sketch.getPositions({ id: c1Pts.centerId })).result
  const c2CenterAfter = (await api.v1.sketch.getPositions({ id: c2Pts.centerId })).result
  console.log('[08b] AFTER: c1 center:', JSON.stringify(c1CenterAfter.pos), 'c2 center:', JSON.stringify(c2CenterAfter.pos))

  await snapshot('result')

  filewrite({
    c1NodeMembers: c1Info?.members,
    c2NodeMembers: c2Info?.members,
    constraintResult: cr.result,
    maxLevel: cr.maxLevel,
  }, 'equal-radius-verify')

  return { partId }
}
