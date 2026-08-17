// Test interactions between RollbackBar and GhostRollbackBar:
// 1. Can you operationMoveBefore while a feature is open?
// 2. Can you operationMoveToEnd while a feature is open?
// 3. What about creating features while bar is mid-tree AND a feature is open?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Interaction' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', radius: 15, height: 60 })).result
  const sphId = (await api.v1.part.sphere({ id: partId, name: 'Sph1', radius: 20, position: [40, 0, 0] })).result
  console.log('[07] box:', boxId, 'cyl:', cylId, 'sph:', sphId)

  // --- Test 1: operationMoveBefore while feature is open ---
  console.log('\n[07] === TEST 1: moveBefore during openFeature ===')
  await api.v1.part.openFeature({ id: cylId })
  console.log('[07] Opened Cyl1')

  const moveR = await api.v1.part.operationMoveBefore({ id: partId, featureId: sphId })
  console.log('[07] moveBefore(sph) during open:', moveR.result, 'maxLevel:', moveR.maxLevel)
  if (moveR.messages?.length) console.log('[07]   msg:', moveR.messages[0]?.message)

  // --- Test 2: operationMoveToEnd while feature is open ---
  const moveEndR = await api.v1.part.operationMoveToEnd({ id: partId })
  console.log('[07] moveToEnd during open:', moveEndR.result, 'maxLevel:', moveEndR.maxLevel)
  if (moveEndR.messages?.length) console.log('[07]   msg:', moveEndR.messages[0]?.message)

  // Close the feature
  await api.v1.part.closeFeature({ id: cylId })
  console.log('[07] Closed Cyl1')

  // --- Test 3: open a feature, then move bar, then try to create ---
  console.log('\n[07] === TEST 3: open → moveBefore → create ===')
  await api.v1.part.openFeature({ id: boxId })
  console.log('[07] Opened Box1')

  // Try moveBefore
  const moveR2 = await api.v1.part.operationMoveBefore({ id: partId, featureId: sphId })
  console.log('[07] moveBefore during open:', moveR2.result, 'maxLevel:', moveR2.maxLevel)
  if (moveR2.messages?.length) console.log('[07]   msg:', moveR2.messages[0]?.message)

  // Try creating a new feature while both bars are in play
  const newBox = await api.v1.part.box({ id: partId, name: 'NewBox', length: 20, width: 20, height: 20 })
  console.log('[07] Create during open+moveBefore:', newBox.result ? `OK id=${newBox.result}` : 'FAILED', 'maxLevel:', newBox.maxLevel)
  if (newBox.messages?.length) console.log('[07]   msg:', newBox.messages[0]?.message)

  // Clean up
  await api.v1.part.closeFeature({ id: boxId })
  await api.v1.part.operationMoveToEnd({ id: partId })
  console.log('[07] Cleanup done')

  return { partId }
}
