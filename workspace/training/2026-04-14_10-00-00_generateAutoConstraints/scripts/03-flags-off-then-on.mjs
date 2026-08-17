// Test: Draw lines at oblique angles (no auto-constraints from creation),
// then call generateAutoConstraints to see what it finds.
// Also: does it detect coincident endpoints when close but not exact?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'FlagsTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Draw 3 lines: one diagonal, one exactly horizontal, one exactly vertical
  // All at separate positions so no auto-coincidences at creation
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [10, 10, 0], endPos: [50, 30, 0] })).result  // diagonal
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [-40, -20, 0], endPos: [0, -20, 0] })).result // horizontal
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [-20, -50, 0], endPos: [-20, -10, 0] })).result // vertical

  // Check constraints before autoGen
  const geoR = await api.v1.sketch.getGeometry({ id: skId })
  const consBefore = Object.values(geoR.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[03] constraints before:', consBefore.length)
  filewrite(consBefore.map(c => ({ id: c.id, class: c.class, name: c.name })), 'constraints-before')

  // Call generateAutoConstraints on each line
  for (const [label, lineId] of [['diagonal', l1], ['horiz', l2], ['vert', l3]]) {
    const r = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: lineId })
    const consNow = Object.values(r.structure.tree)
      .filter(n => n.class && n.class.includes('Constraint'))
    console.log(`[03] autoGen ${label}: result=${r.result} maxLevel=${r.maxLevel} constraints=${consNow.length}`)
  }

  const geoAfter = await api.v1.sketch.getGeometry({ id: skId })
  const consAfter = Object.values(geoAfter.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[03] constraints after all autoGen:', consAfter.length)
  const newCons = consAfter.filter(c => !consBefore.find(b => b.id === c.id))
  console.log('[03] new constraints:', newCons.length)
  filewrite(newCons.map(c => ({ id: c.id, class: c.class, name: c.name })), 'new-constraints')
  filewrite(consAfter.map(c => ({ id: c.id, class: c.class, name: c.name })), 'constraints-after')

  await snapshot('after-autogen')
  return { partId }
}
