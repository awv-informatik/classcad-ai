// Test: auto-constrain a sketch point — does it get fixation at origin?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Point at origin
  const pR = await api.v1.sketch.point({
    id: skId, pos: [0, 0, 0],
    genFixation: false,
  })
  const pId = pR.result
  console.log('[12] pointId at origin:', pId)
  const bTree = pR.structure.tree

  const r = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: pId })
  console.log('[12] result:', r.result, 'maxLevel:', r.maxLevel)

  const aTree = r.structure.tree
  const bIds = new Set(Object.keys(bTree))
  const newIds = Object.keys(aTree).filter(id => !bIds.has(id))
  console.log('[12] new objects:')
  newIds.forEach(id => {
    const o = aTree[id]
    console.log('  ID', id, '→', o.class, JSON.stringify(o.name))
  })

  // Point NOT at origin
  const p2R = await api.v1.sketch.point({
    id: skId, pos: [30, 20, 0],
    genFixation: false,
  })
  const p2 = p2R.result
  const b2Tree = p2R.structure.tree

  const r2 = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: p2 })
  console.log('[12] off-origin point result:', r2.result, 'maxLevel:', r2.maxLevel)
  const a2Tree = r2.structure.tree
  const b2Ids = new Set(Object.keys(b2Tree))
  const new2Ids = Object.keys(a2Tree).filter(id => !b2Ids.has(id))
  console.log('[12] new objects (off-origin point):')
  new2Ids.forEach(id => {
    const o = a2Tree[id]
    console.log('  ID', id, '→', o.class, JSON.stringify(o.name))
  })

  return { partId }
}
