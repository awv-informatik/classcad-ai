// Test: calling autoGen twice produces no duplicates
// Also verify the return value is always null (VOID)
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'DupTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Point first, line second (known to leave a gap)
  const pt = (await api.v1.sketch.point({ id: skId, pos: [25, 0, 0] })).result
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result

  const consBefore = Object.values((await api.v1.sketch.getGeometry({ id: skId })).structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[17] before:', consBefore.length)

  // First call
  const r1 = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: pt })
  const cons1 = Object.values(r1.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[17] after 1st autoGen: result=', r1.result, 'maxLevel=', r1.maxLevel, 'cons=', cons1.length)

  // Second call — should NOT add duplicates
  const r2 = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: pt })
  const cons2 = Object.values(r2.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[17] after 2nd autoGen: result=', r2.result, 'maxLevel=', r2.maxLevel, 'cons=', cons2.length)

  // Third call
  const r3 = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: pt })
  const cons3 = Object.values(r3.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[17] after 3rd autoGen: result=', r3.result, 'maxLevel=', r3.maxLevel, 'cons=', cons3.length)

  console.log('[17] duplicate check:', cons1.length === cons2.length && cons2.length === cons3.length ? 'PASS (no duplicates)' : 'FAIL (duplicates!)')

  // Verify return is always null (VOID)
  console.log('[17] return values: r1=', r1.result, 'r2=', r2.result, 'r3=', r3.result)

  return { partId }
}
