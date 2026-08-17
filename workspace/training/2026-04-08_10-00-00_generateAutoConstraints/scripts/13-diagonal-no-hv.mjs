// Test: diagonal line (45 degrees) — should only get fixation if at origin, no H/V
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // 45-degree diagonal from origin
  const lineR = await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [50, 50, 0],
    genFixation: false, genVertAndHoriz: false,
  })
  const lineId = lineR.result
  const bTree = lineR.structure.tree

  const r = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: lineId })
  console.log('[13] diagonal from origin - maxLevel:', r.maxLevel)

  const aTree = r.structure.tree
  const bIds = new Set(Object.keys(bTree))
  const newIds = Object.keys(aTree).filter(id => !bIds.has(id))
  console.log('[13] new objects:')
  newIds.forEach(id => {
    const o = aTree[id]
    console.log('  ID', id, '→', o.class, JSON.stringify(o.name))
  })

  // Diagonal NOT from origin — should get nothing
  const l2R = await api.v1.sketch.line({
    id: skId, startPos: [10, 10, 0], endPos: [60, 60, 0],
    genFixation: false, genVertAndHoriz: false,
  })
  const l2 = l2R.result
  const b2Tree = l2R.structure.tree

  const r2 = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: l2 })
  console.log('[13] diagonal NOT from origin - maxLevel:', r2.maxLevel)
  const a2Tree = r2.structure.tree
  const b2Ids = new Set(Object.keys(b2Tree))
  const new2 = Object.keys(a2Tree).filter(id => !b2Ids.has(id))
  console.log('[13] new objects (off-origin diagonal):', new2.length)

  return { partId }
}
