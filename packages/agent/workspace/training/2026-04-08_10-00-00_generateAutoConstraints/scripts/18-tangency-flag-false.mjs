// Test: genTangency=false — with arc tangent to a line
// When tangency is disabled, only coincidence (not tangency) should be generated
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Horizontal line
  const l1 = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0],
    genFixation: false, genVertAndHoriz: false, genIncidence: false,
  })).result

  // Arc tangent to line
  const arcR = await api.v1.sketch.arcByCenter({
    id: skId, centerPos: [25, 15, 0], startPos: [25, 0, 0], endPos: [10, 15, 0],
    genFixation: false, genIncidence: false,
  })
  const arcId = arcR.result
  const bTree = arcR.structure.tree

  // Auto-constrain with genTangency=false
  const r = await api.v1.sketch.generateAutoConstraints({
    id: skId, geomId: arcId, genTangency: false,
  })
  console.log('[18] genTangency=false - maxLevel:', r.maxLevel)
  const aTree = r.structure.tree
  const bIds = new Set(Object.keys(bTree))
  const newIds = Object.keys(aTree).filter(id => !bIds.has(id))
  console.log('[18] new objects:')
  newIds.forEach(id => {
    const o = aTree[id]
    console.log('  ID', id, '→', o.class, JSON.stringify(o.name))
  })

  // Now with genTangency=true (default) for comparison
  // Need a fresh arc to test
  const arc2R = await api.v1.sketch.arcByCenter({
    id: skId, centerPos: [25, -15, 0], startPos: [25, 0, 0], endPos: [40, -15, 0],
    genFixation: false, genIncidence: false,
  })
  const arc2 = arc2R.result
  if (arc2) {
    const b2Tree = arc2R.structure.tree
    const r2 = await api.v1.sketch.generateAutoConstraints({
      id: skId, geomId: arc2, genTangency: true,
    })
    console.log('[18] genTangency=true - maxLevel:', r2.maxLevel)
    const a2Tree = r2.structure.tree
    const b2Ids = new Set(Object.keys(b2Tree))
    const new2 = Object.keys(a2Tree).filter(id => !b2Ids.has(id))
    console.log('[18] new objects (tangency=true):')
    new2.forEach(id => {
      const o = a2Tree[id]
      console.log('  ID', id, '→', o.class, JSON.stringify(o.name))
    })
  }

  return { partId }
}
