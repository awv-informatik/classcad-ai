// Test: exact horizontal + exact vertical lines
// Does generateAutoConstraints add H/V constraints for perfectly aligned lines?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Exact horizontal line from origin
  const hLine = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  console.log('[02] hLine:', hLine)

  // Exact vertical line (not from origin)
  const vLineR = await api.v1.sketch.line({
    id: skId, startPos: [20, 10, 0], endPos: [20, 60, 0],
    genFixation: false, genVertAndHoriz: false,
  })
  const vLine = vLineR.result
  console.log('[02] vLine:', vLine)

  // Save structure before auto-constraints (from last line creation)
  filewrite(vLineR.structure, 'structure-before')
  const bTree = vLineR.structure.tree
  const skBefore = bTree[skId]
  console.log('[02] sketch children before:', skBefore?.children)

  // Generate auto constraints on hLine
  const rH = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: hLine })
  console.log('[02] auto(hLine) result:', rH.result, 'maxLevel:', rH.maxLevel)

  // Generate auto constraints on vLine
  const rV = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: vLine })
  console.log('[02] auto(vLine) result:', rV.result, 'maxLevel:', rV.maxLevel)
  filewrite(rV.structure, 'structure-after')

  // Diff
  const aTree = rV.structure.tree
  const bIds = new Set(Object.keys(bTree))
  const newIds = Object.keys(aTree).filter(id => !bIds.has(id))
  console.log('[02] new objects after auto-constraints:')
  newIds.forEach(id => {
    const o = aTree[id]
    console.log('  ID', id, '→', o.class, JSON.stringify(o.name), 'entities:', JSON.stringify(o.members?.entities))
  })

  await snapshot('after')
  return { partId }
}
