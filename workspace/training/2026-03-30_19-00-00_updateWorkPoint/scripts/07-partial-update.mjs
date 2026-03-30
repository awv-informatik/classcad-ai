// Test partial update — only pass some params, verify others are preserved
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UWPTest' })).result

  // Create work point with specific position and name
  const wpId = (await api.v1.part.workPoint({
    id: partId,
    name: 'PartialTest',
    position: [10, 20, 30]
  })).result
  console.log('[07] created wpId:', wpId)

  // Update ONLY name (should preserve position and type)
  await api.v1.part.openFeature({ id: wpId })
  const r1 = await api.v1.part.updateWorkPoint({
    id: wpId,
    name: 'NewName'
  })
  console.log('[07] name-only update — result:', r1.result, 'maxLevel:', r1.maxLevel)
  await api.v1.part.closeFeature({ id: wpId })

  // Verify via getWorkGeometry
  const gw1 = await api.v1.part.getWorkGeometry({ id: partId, name: 'NewName' })
  console.log('[07] getWorkGeometry NewName — result:', gw1.result, 'maxLevel:', gw1.maxLevel)

  // Update ONLY position (should preserve name and type)
  await api.v1.part.openFeature({ id: wpId })
  const r2 = await api.v1.part.updateWorkPoint({
    id: wpId,
    position: [99, 88, 77]
  })
  console.log('[07] position-only update — result:', r2.result, 'maxLevel:', r2.maxLevel)
  await api.v1.part.closeFeature({ id: wpId })

  // Verify name is still NewName
  const gw2 = await api.v1.part.getWorkGeometry({ id: partId, name: 'NewName' })
  console.log('[07] getWorkGeometry NewName after position-only — result:', gw2.result, 'maxLevel:', gw2.maxLevel)

  filewrite({
    nameOnly: { result: r1.result, maxLevel: r1.maxLevel },
    positionOnly: { result: r2.result, maxLevel: r2.maxLevel },
    verifyName: { result: gw2.result, maxLevel: gw2.maxLevel }
  }, 'partial-update')

  return { partId }
}
