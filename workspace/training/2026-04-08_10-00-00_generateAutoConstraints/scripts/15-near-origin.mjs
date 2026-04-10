// Test: line starting near (but not exactly at) origin — does fixation still trigger?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Line starting at (0.001, 0, 0) — very close to origin
  const l1R = await api.v1.sketch.line({
    id: skId, startPos: [0.001, 0, 0], endPos: [50, 0, 0],
    genFixation: false, genVertAndHoriz: false,
  })
  const l1 = l1R.result
  const bTree = l1R.structure.tree

  const r = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: l1 })
  console.log('[15] near-origin line - maxLevel:', r.maxLevel)

  const aTree = r.structure.tree
  const bIds = new Set(Object.keys(bTree))
  const newIds = Object.keys(aTree).filter(id => !bIds.has(id))
  console.log('[15] new objects:')
  newIds.forEach(id => {
    const o = aTree[id]
    console.log('  ID', id, '→', o.class, JSON.stringify(o.name))
  })

  // Line starting at (0.0001, 0, 0) — even closer
  const l2R = await api.v1.sketch.line({
    id: skId, startPos: [0.0001, 0, 0], endPos: [50, 10, 0],
    genFixation: false, genVertAndHoriz: false,
  })
  const l2 = l2R.result
  const b2Tree = l2R.structure.tree

  const r2 = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: l2 })
  console.log('[15] very-near-origin line - maxLevel:', r2.maxLevel)
  const a2Tree = r2.structure.tree
  const b2Ids = new Set(Object.keys(b2Tree))
  const new2 = Object.keys(a2Tree).filter(id => !b2Ids.has(id))
  console.log('[15] new objects (very near):')
  new2.forEach(id => {
    const o = a2Tree[id]
    console.log('  ID', id, '→', o.class, JSON.stringify(o.name))
  })

  return { partId }
}
