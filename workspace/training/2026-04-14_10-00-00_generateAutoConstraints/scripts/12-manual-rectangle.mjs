// Test: manually create 4 lines forming a rectangle (endpoints coincide).
// Line creation auto-generates coincidence constraints.
// Does autoGen detect additional constraints like H/V/parallel/perpendicular?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'ManualRect' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // 4 lines forming a rectangle
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result  // bottom
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [80, 0, 0], endPos: [80, 50, 0] })).result // right
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [80, 50, 0], endPos: [0, 50, 0] })).result  // top
  const l4 = (await api.v1.sketch.line({ id: skId, startPos: [0, 50, 0], endPos: [0, 0, 0] })).result    // left

  // Constraints from creation
  const geoR = await api.v1.sketch.getGeometry({ id: skId })
  const consBefore = Object.values(geoR.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[12] constraints from creation:', consBefore.length)
  filewrite(consBefore.map(c => ({ id: c.id, class: c.class, name: c.name })), 'constraints-from-creation')

  // AutoGen on each line
  for (const [label, lineId] of [['bottom', l1], ['right', l2], ['top', l3], ['left', l4]]) {
    const r = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: lineId })
    const cons = Object.values(r.structure.tree)
      .filter(n => n.class && n.class.includes('Constraint'))
    console.log(`[12] autoGen ${label}: maxLevel=${r.maxLevel} totalCons=${cons.length}`)
  }

  const geoAfter = await api.v1.sketch.getGeometry({ id: skId })
  const consAfter = Object.values(geoAfter.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[12] constraints after all autoGen:', consAfter.length)
  const newCons = consAfter.filter(c => !consBefore.find(b => b.id === c.id))
  console.log('[12] new constraints:', newCons.length)
  filewrite(newCons.map(c => ({ id: c.id, class: c.class, name: c.name })), 'new-constraints')
  filewrite(consAfter.map(c => ({ id: c.id, class: c.class, name: c.name })), 'constraints-after')

  await snapshot('manual-rect')
  return { partId }
}
