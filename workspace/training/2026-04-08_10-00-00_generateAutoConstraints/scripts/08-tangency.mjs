// Test: genTangency — arc tangent to a line
// Create a line and an arc where arc endpoint touches line, check if tangent constraint is generated
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Horizontal line
  const l1 = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0],
    genFixation: false, genVertAndHoriz: false, genIncidence: false,
  })).result
  console.log('[08] l1:', l1)

  // Arc: center at (25, 15), start at (25, 0) on the line, end somewhere
  // This creates an arc tangent to the horizontal line at (25, 0)
  const arcR = await api.v1.sketch.arcByCenter({
    id: skId, centerPos: [25, 15, 0], startPos: [25, 0, 0], endPos: [10, 15, 0],
    genFixation: false, genIncidence: false,
  })
  const arcId = arcR.result
  console.log('[08] arcId:', arcId, 'maxLevel:', arcR.maxLevel)
  console.log('[08] arc messages:', JSON.stringify(arcR.messages))

  if (!arcId) {
    console.log('[08] arc creation failed, aborting')
    return { partId }
  }

  const bTree = arcR.structure.tree

  // Auto-constrain the arc — should detect tangency with line
  const r = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: arcId })
  console.log('[08] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[08] messages:', JSON.stringify(r.messages))

  const aTree = r.structure.tree
  const bIds = new Set(Object.keys(bTree))
  const newIds = Object.keys(aTree).filter(id => !bIds.has(id))
  console.log('[08] new objects:')
  newIds.forEach(id => {
    const o = aTree[id]
    console.log('  ID', id, '→', o.class, JSON.stringify(o.name),
      'entities:', JSON.stringify(o.members?.entities?.members?.map(m => m.value)))
  })

  await snapshot('after')
  return { partId }
}
