// Test: Two lines sharing an endpoint position.
// Line creation auto-detects coincidence. Does autoGen find anything extra?
// Also: move a line endpoint to coincide with another, then call autoGen.
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'CoincTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Two lines with endpoints at the same position
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [50, 0, 0], endPos: [50, 40, 0] })).result

  const geoR = await api.v1.sketch.getGeometry({ id: skId })
  const consBefore = Object.values(geoR.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[06] constraints after 2 lines:', consBefore.length)
  filewrite(consBefore.map(c => ({ id: c.id, class: c.class, name: c.name })), 'constraints-after-creation')

  // Now add a third line NOT at any existing endpoint
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [-30, 20, 0], endPos: [-30, -20, 0] })).result

  const consAfterL3 = Object.values(
    (await api.v1.sketch.getGeometry({ id: skId })).structure.tree
  ).filter(n => n.class && n.class.includes('Constraint'))
  console.log('[06] constraints after l3:', consAfterL3.length)

  // Move l3 so its startPos coincides with l1's start (0,0,0)
  const pts3 = (await api.v1.sketch.getPoints({ id: l3 })).result
  const moveR = await api.v1.sketch.moveGeometry({
    id: skId, geomId: pts3.startId, translation: [30, -20, 0]
  })
  console.log('[06] moveGeometry result:', moveR.result, 'maxLevel:', moveR.maxLevel)

  // Check constraints after move (before autoGen)
  const consAfterMove = Object.values(moveR.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[06] constraints after move:', consAfterMove.length)

  // Now call autoGen on l3 — should it detect the coincidence?
  const r = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: l3 })
  console.log('[06] autoGen l3 result:', r.result, 'maxLevel:', r.maxLevel)

  const consFinal = Object.values(r.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[06] constraints final:', consFinal.length)

  const newCons = consFinal.filter(c => !consAfterMove.find(b => b.id === c.id))
  console.log('[06] new constraints from autoGen:', newCons.length)
  filewrite(newCons.map(c => ({ id: c.id, class: c.class, name: c.name })), 'new-constraints')
  filewrite(consFinal.map(c => ({ id: c.id, class: c.class, name: c.name })), 'constraints-final')

  await snapshot('final')
  return { partId }
}
