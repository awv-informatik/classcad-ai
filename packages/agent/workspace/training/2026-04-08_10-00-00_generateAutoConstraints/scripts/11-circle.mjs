// Test: auto-constrain a circle — what constraints does it generate?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Circle at origin
  const cR = await api.v1.sketch.circle({
    id: skId, centerPos: [0, 0, 0], radius: 20,
    genFixation: false,
  })
  const cId = cR.result
  console.log('[11] circleId:', cId)
  const bTree = cR.structure.tree

  const r = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: cId })
  console.log('[11] result:', r.result, 'maxLevel:', r.maxLevel)

  const aTree = r.structure.tree
  const bIds = new Set(Object.keys(bTree))
  const newIds = Object.keys(aTree).filter(id => !bIds.has(id))
  console.log('[11] new objects on circle:')
  newIds.forEach(id => {
    const o = aTree[id]
    console.log('  ID', id, '→', o.class, JSON.stringify(o.name),
      'entities:', JSON.stringify(o.members?.entities?.members?.map(m => m.value)))
  })

  // Also test circle NOT at origin
  const c2R = await api.v1.sketch.circle({
    id: skId, centerPos: [50, 30, 0], radius: 15,
    genFixation: false,
  })
  const c2 = c2R.result
  const b2Tree = c2R.structure.tree

  const r2 = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: c2 })
  console.log('[11] result on off-origin circle:', r2.result, 'maxLevel:', r2.maxLevel)
  const a2Tree = r2.structure.tree
  const b2Ids = new Set(Object.keys(b2Tree))
  const new2Ids = Object.keys(a2Tree).filter(id => !b2Ids.has(id))
  console.log('[11] new objects on off-origin circle:')
  new2Ids.forEach(id => {
    const o = a2Tree[id]
    console.log('  ID', id, '→', o.class, JSON.stringify(o.name))
  })

  await snapshot('after')
  return { partId }
}
