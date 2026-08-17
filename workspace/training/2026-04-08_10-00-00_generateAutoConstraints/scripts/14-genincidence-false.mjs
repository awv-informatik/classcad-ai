// Test: genIncidence=false — coincident endpoints should NOT be auto-constrained
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Line 1: from origin to (50,0)
  const l1 = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0],
    genFixation: false, genVertAndHoriz: false, genIncidence: false,
  })).result

  // Line 2: from (50,0) to (50,40) — coincident start with l1 end
  const l2R = await api.v1.sketch.line({
    id: skId, startPos: [50, 0, 0], endPos: [50, 40, 0],
    genFixation: false, genVertAndHoriz: false, genIncidence: false,
  })
  const l2 = l2R.result
  const bTree = l2R.structure.tree

  // Auto-constrain l2 with genIncidence=false — should skip coincidence
  const r = await api.v1.sketch.generateAutoConstraints({
    id: skId, geomId: l2, genIncidence: false,
  })
  console.log('[14] result:', r.result, 'maxLevel:', r.maxLevel)

  const aTree = r.structure.tree
  const bIds = new Set(Object.keys(bTree))
  const newIds = Object.keys(aTree).filter(id => !bIds.has(id))
  console.log('[14] new objects (genIncidence=false):')
  newIds.forEach(id => {
    const o = aTree[id]
    console.log('  ID', id, '→', o.class, JSON.stringify(o.name))
  })

  return { partId }
}
