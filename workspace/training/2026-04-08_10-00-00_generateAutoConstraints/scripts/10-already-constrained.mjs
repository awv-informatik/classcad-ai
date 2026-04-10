// Test: auto-constrain geometry that already has constraints — does it skip redundant ones?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a horizontal line from origin
  const lineR = await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0],
    genFixation: false, genVertAndHoriz: false,
  })
  const lineId = lineR.result
  const bTree = lineR.structure.tree

  // First auto-constrain — should add fixation + horizontal
  const r1 = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: lineId })
  const t1 = r1.structure.tree
  const b1Ids = new Set(Object.keys(bTree))
  const new1 = Object.keys(t1).filter(id => !b1Ids.has(id))
  console.log('[10] first auto — new objects:', new1.length)
  new1.forEach(id => console.log('  ', t1[id].class, t1[id].name))

  // Second auto-constrain — should add nothing (already constrained)
  const r2 = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: lineId })
  const t2 = r2.structure.tree
  const b2Ids = new Set(Object.keys(t1))
  const new2 = Object.keys(t2).filter(id => !b2Ids.has(id))
  console.log('[10] second auto — new objects:', new2.length)
  new2.forEach(id => console.log('  ', t2[id].class, t2[id].name))
  console.log('[10] redundancy test:', new2.length === 0 ? 'PASS (no duplicates)' : 'FAIL (added duplicates)')

  return { partId }
}
