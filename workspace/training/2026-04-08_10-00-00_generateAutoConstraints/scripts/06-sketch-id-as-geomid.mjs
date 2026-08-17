// Test: passing the sketch ID itself as geomId — should auto-constrain ALL geometry
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create multiple geometries without auto-constraints
  const l1 = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result

  const l2 = (await api.v1.sketch.line({
    id: skId, startPos: [0, 20, 0], endPos: [0, 60, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result

  const cR = await api.v1.sketch.circle({
    id: skId, center: [30, 30, 0], radius: 10,
    genFixation: false,
  })
  const cId = cR.result
  const bTree = cR.structure.tree

  // Auto-constrain the entire sketch by passing skId as geomId
  const r = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: skId })
  console.log('[06] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[06] messages:', JSON.stringify(r.messages))

  const aTree = r.structure.tree
  const bIds = new Set(Object.keys(bTree))
  const newIds = Object.keys(aTree).filter(id => !bIds.has(id))
  console.log('[06] new objects (sketch as geomId):')
  newIds.forEach(id => {
    const o = aTree[id]
    console.log('  ID', id, '→', o.class, JSON.stringify(o.name))
  })

  await snapshot('after')
  return { partId }
}
