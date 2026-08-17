// Test: genIncidence — coincident endpoints between two lines
// Two lines sharing a point — auto-constrain the second line, check for COINCIDENT
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Line 1: from origin to (50,0) — with auto-constraints disabled
  const l1 = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0],
    genFixation: false, genVertAndHoriz: false, genIncidence: false,
  })).result
  console.log('[07] l1:', l1)

  // Line 2: from (50,0) to (50,40) — starts exactly at l1's endpoint
  const l2R = await api.v1.sketch.line({
    id: skId, startPos: [50, 0, 0], endPos: [50, 40, 0],
    genFixation: false, genVertAndHoriz: false, genIncidence: false,
  })
  const l2 = l2R.result
  console.log('[07] l2:', l2)
  const bTree = l2R.structure.tree

  // Auto-constrain line 2 (should detect coincidence with l1 endpoint)
  const r = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: l2 })
  console.log('[07] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[07] messages:', JSON.stringify(r.messages))

  const aTree = r.structure.tree
  const bIds = new Set(Object.keys(bTree))
  const newIds = Object.keys(aTree).filter(id => !bIds.has(id))
  console.log('[07] new objects:')
  newIds.forEach(id => {
    const o = aTree[id]
    console.log('  ID', id, '→', o.class, JSON.stringify(o.name),
      'entities:', JSON.stringify(o.members?.entities?.members?.map(m => m.value)))
  })

  // Also auto-constrain l1 to see fixation + H on origin line
  const r2 = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: l1 })
  const a2Tree = r2.structure.tree
  const a1Ids = new Set(Object.keys(aTree))
  const new2Ids = Object.keys(a2Tree).filter(id => !a1Ids.has(id))
  console.log('[07] additional new objects from l1 auto:')
  new2Ids.forEach(id => {
    const o = a2Tree[id]
    console.log('  ID', id, '→', o.class, JSON.stringify(o.name))
  })

  await snapshot('after')
  return { partId }
}
