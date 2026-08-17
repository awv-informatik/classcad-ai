// Test: pass a sketch-point ID (not curve) as geomId — the error from script 06 said
// "sketch-curve" and "sketch-point" are accepted types
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a line and get its endpoint IDs
  const lineR = await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0],
    genFixation: false, genVertAndHoriz: false,
  })
  const lineId = lineR.result

  // Get start/end point IDs from the line
  const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
  console.log('[16] line points:', JSON.stringify(pts))

  if (!pts || !pts.startId) {
    console.log('[16] could not get point IDs')
    return { partId }
  }

  const bTree = (await api.v1.sketch.getPoints({ id: lineId })).structure.tree

  // Auto-constrain the start point (which is at origin)
  const r = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: pts.startId })
  console.log('[16] auto on startPoint (at origin):', r.result, 'maxLevel:', r.maxLevel)
  console.log('[16] messages:', JSON.stringify(r.messages))

  const aTree = r.structure.tree
  const bIds = new Set(Object.keys(bTree))
  const newIds = Object.keys(aTree).filter(id => !bIds.has(id))
  console.log('[16] new objects:')
  newIds.forEach(id => {
    const o = aTree[id]
    console.log('  ID', id, '→', o.class, JSON.stringify(o.name))
  })

  // Auto-constrain the end point (at 50,0 — not at origin)
  const r2 = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: pts.endId })
  console.log('[16] auto on endPoint (off origin):', r2.result, 'maxLevel:', r2.maxLevel)
  const a2Tree = r2.structure.tree
  const a1Ids = new Set(Object.keys(aTree))
  const new2 = Object.keys(a2Tree).filter(id => !a1Ids.has(id))
  console.log('[16] new objects (end point):')
  new2.forEach(id => {
    const o = a2Tree[id]
    console.log('  ID', id, '→', o.class, JSON.stringify(o.name))
  })

  return { partId }
}
