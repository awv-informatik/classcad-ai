// Test: what exactly does "fixation in the Origin" mean?
// Does fixation require a point exactly at (0,0,0)?
// Or does it fix any point of the geometry that happens to be at origin?
// Test: line from (0,0) to (50,50) — start at origin → fixation on start
//       line from (50,50) to (0,0) — END at origin → does fixation trigger on end?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Line ending at origin (not starting)
  const lineR = await api.v1.sketch.line({
    id: skId, startPos: [50, 50, 0], endPos: [0, 0, 0],
    genFixation: false, genVertAndHoriz: false,
  })
  const lineId = lineR.result
  const bTree = lineR.structure.tree

  const r = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: lineId })
  console.log('[17] line ENDING at origin - maxLevel:', r.maxLevel)

  const aTree = r.structure.tree
  const bIds = new Set(Object.keys(bTree))
  const newIds = Object.keys(aTree).filter(id => !bIds.has(id))
  console.log('[17] new objects:')
  newIds.forEach(id => {
    const o = aTree[id]
    console.log('  ID', id, '→', o.class, JSON.stringify(o.name),
      'entities:', JSON.stringify(o.members?.entities?.members?.map(m => m.value)))
  })

  // Get the line's point IDs to understand what was fixed
  const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
  console.log('[17] line points:', JSON.stringify(pts))

  return { partId }
}
