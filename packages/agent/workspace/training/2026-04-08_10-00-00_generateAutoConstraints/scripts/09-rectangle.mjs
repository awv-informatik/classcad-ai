// Test: auto-constrain each line of a rectangle individually
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Rectangle with no auto-constraints
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [0, 0, 0], endPos: [60, 40, 0],
    genFixation: false, genVertAndHoriz: false, genIncidence: false,
  })).result
  console.log('[09] rectIds:', rectIds)

  // Get structure before
  const beforeR = await api.v1.sketch.rectangle({
    id: skId, startPos: [80, 0, 0], endPos: [100, 20, 0],
    genFixation: false, genVertAndHoriz: false, genIncidence: false,
  })
  // Actually let me just capture structure from a harmless call
  // Let me auto-constrain each rect line one by one
  let prevTree = beforeR.structure.tree

  for (let i = 0; i < rectIds.length; i++) {
    const r = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: rectIds[i] })
    console.log(`[09] auto on rect line ${i} (id=${rectIds[i]}): maxLevel=${r.maxLevel}`)

    const aTree = r.structure.tree
    const bIds = new Set(Object.keys(prevTree))
    const newIds = Object.keys(aTree).filter(id => !bIds.has(id))
    newIds.forEach(id => {
      const o = aTree[id]
      console.log(`  new: ID ${id} → ${o.class} ${JSON.stringify(o.name)}`)
    })
    prevTree = aTree
  }

  await snapshot('after')
  return { partId }
}
