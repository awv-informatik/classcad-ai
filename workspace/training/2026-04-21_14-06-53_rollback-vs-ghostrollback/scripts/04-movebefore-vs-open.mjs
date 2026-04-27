// Compare what's allowed under operationMoveBefore vs openFeature.
// Test: can you create features? can you update features? can you do both at once?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CompareTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', radius: 15, height: 60 })).result
  const sphId = (await api.v1.part.sphere({ id: partId, name: 'Sph1', radius: 20, position: [40, 0, 0] })).result
  console.log('[04] box:', boxId, 'cyl:', cylId, 'sph:', sphId)

  // --- Test 1: operationMoveBefore(cylId) — can we create a feature? ---
  console.log('\n[04] === TEST 1: operationMoveBefore ===')
  await api.v1.part.operationMoveBefore({ id: partId, featureId: cylId })
  console.log('[04] Moved bar before Cyl1')

  // Try creating a new feature
  const newBox = await api.v1.part.box({ id: partId, name: 'InsertedBox', length: 30, width: 30, height: 30 })
  console.log('[04] Create feature during moveBefore:', newBox.result ? `OK id=${newBox.result}` : 'FAILED', 'maxLevel:', newBox.maxLevel)

  // Try updating Box1 (which is BEFORE the bar — should be visible)
  const updateR1 = await api.v1.part.updateBox({ id: boxId, height: 999 })
  console.log('[04] Update box WITHOUT openFeature:', updateR1.result, 'maxLevel:', updateR1.maxLevel)
  if (updateR1.messages?.length) console.log('[04]   msg:', updateR1.messages[0]?.message)

  // Clean up — delete the inserted box and move back
  if (newBox.result) {
    await api.v1.part.deleteFeature({ ids: [newBox.result] })
  }
  await api.v1.part.operationMoveToEnd({ id: partId })
  console.log('[04] Moved bar back to end')

  // --- Test 2: openFeature(cylId) — can we create a feature? ---
  console.log('\n[04] === TEST 2: openFeature ===')
  await api.v1.part.openFeature({ id: cylId })
  console.log('[04] Opened Cyl1')

  // Try creating a new feature
  const newBox2 = await api.v1.part.box({ id: partId, name: 'DuringOpenBox', length: 30, width: 30, height: 30 })
  console.log('[04] Create feature during openFeature:', newBox2.result ? `OK id=${newBox2.result}` : 'FAILED', 'maxLevel:', newBox2.maxLevel)
  if (newBox2.messages?.length) console.log('[04]   msg:', newBox2.messages[0]?.message)

  // Try updating a DIFFERENT feature (Box1) — should this work?
  const updateR2 = await api.v1.part.updateBox({ id: boxId, height: 888 })
  console.log('[04] Update Box1 while Cyl1 open:', updateR2.result, 'maxLevel:', updateR2.maxLevel)
  if (updateR2.messages?.length) console.log('[04]   msg:', updateR2.messages[0]?.message)

  // Try updating the OPEN feature (Cyl1)
  const updateR3 = await api.v1.part.updateCylinder({ id: cylId, radius: 25 })
  console.log('[04] Update Cyl1 (the open feature):', updateR3.result, 'maxLevel:', updateR3.maxLevel)

  // Close
  await api.v1.part.closeFeature({ id: cylId })
  console.log('[04] Closed Cyl1')

  // Verify cyl was updated
  const verify = await api.v1.part.getExpression({ id: cylId, name: 'radius' })
  console.log('[04] Cyl1 radius after update+close:', verify.result)

  return { partId }
}
