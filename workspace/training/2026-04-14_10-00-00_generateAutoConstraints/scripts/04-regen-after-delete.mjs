// Test: Create a horizontal line (gets Auto_H), delete the constraint,
// then call generateAutoConstraints to see if it recreates it.
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'RegenTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Horizontal line at origin → should get Auto_Fix + Auto_H
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0] })).result

  const geoR = await api.v1.sketch.getGeometry({ id: skId })
  const consBefore = Object.values(geoR.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[04] constraints after line creation:', consBefore.length)
  filewrite(consBefore.map(c => ({ id: c.id, class: c.class, name: c.name })), 'constraints-after-line')

  // Delete all auto-constraints
  for (const c of consBefore) {
    const dr = await api.v1.sketch.deleteObject({ id: c.id })
    console.log(`[04] delete ${c.name} (${c.id}): maxLevel=${dr.maxLevel}`)
  }

  const consAfterDelete = Object.values(
    (await api.v1.sketch.getGeometry({ id: skId })).structure.tree
  ).filter(n => n.class && n.class.includes('Constraint'))
  console.log('[04] constraints after deletion:', consAfterDelete.length)

  // Now call generateAutoConstraints
  const r = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: l1 })
  console.log('[04] autoGen result:', r.result, 'maxLevel:', r.maxLevel)

  const consAfterRegen = Object.values(r.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[04] constraints after regen:', consAfterRegen.length)
  filewrite(consAfterRegen.map(c => ({ id: c.id, class: c.class, name: c.name })), 'constraints-after-regen')

  await snapshot('after-regen')
  return { partId }
}
