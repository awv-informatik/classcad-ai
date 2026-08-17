// Test: multiple open/close cycles on same axis + multiple updates in one session
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const waId = (await api.v1.part.workAxis({
    id: partId, name: 'WA1', position: [0, 0, 0], direction: [1, 0, 0]
  })).result
  console.log('[07] created:', waId)

  // Cycle 1: update direction
  await api.v1.part.openFeature({ id: waId })
  const r1 = await api.v1.part.updateWorkAxis({ id: waId, direction: [0, 1, 0] })
  console.log('[07] cycle1 result:', r1.result, 'maxLevel:', r1.maxLevel)
  await api.v1.part.closeFeature({ id: waId })

  // Cycle 2: update position
  await api.v1.part.openFeature({ id: waId })
  const r2 = await api.v1.part.updateWorkAxis({ id: waId, position: [10, 20, 30] })
  console.log('[07] cycle2 result:', r2.result, 'maxLevel:', r2.maxLevel)
  await api.v1.part.closeFeature({ id: waId })

  // Cycle 3: multiple updates in one open session
  await api.v1.part.openFeature({ id: waId })
  const r3a = await api.v1.part.updateWorkAxis({ id: waId, name: 'WA_renamed' })
  const r3b = await api.v1.part.updateWorkAxis({ id: waId, direction: [0, 0, 1] })
  const r3c = await api.v1.part.updateWorkAxis({ id: waId, position: [50, 50, 50] })
  console.log('[07] cycle3 name:', r3a.result, 'dir:', r3b.result, 'pos:', r3c.result)
  console.log('[07] maxLevels:', r3a.maxLevel, r3b.maxLevel, r3c.maxLevel)
  await api.v1.part.closeFeature({ id: waId })

  // Verify final state
  const found = await api.v1.part.getWorkGeometry({ id: partId, name: 'WA_renamed' })
  console.log('[07] find WA_renamed:', found.result)

  const expr = await api.v1.part.getExpression({ id: waId })
  console.log('[07] final expressions:', JSON.stringify(expr.result))
  filewrite(expr.result, 'final-expressions')

  filewrite({
    cycle1: { result: r1.result, maxLevel: r1.maxLevel },
    cycle2: { result: r2.result, maxLevel: r2.maxLevel },
    cycle3: { name: r3a.maxLevel, dir: r3b.maxLevel, pos: r3c.maxLevel },
    finalFind: found.result
  }, 'multi-cycle')

  return { partId }
}
