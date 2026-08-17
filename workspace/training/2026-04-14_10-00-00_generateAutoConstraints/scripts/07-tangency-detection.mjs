// Test: circle tangent to a line — does autoGen detect tangency?
// Draw a circle and a line positioned tangent to each other.
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'TangencyTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Horizontal line at y=0
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result

  // Circle centered at (0, 30) with radius 30 — tangent to line at (0, 0)
  const c1 = (await api.v1.sketch.circle({ id: skId, center: [0, 30, 0], radius: 30 })).result

  const geoR = await api.v1.sketch.getGeometry({ id: skId })
  const consBefore = Object.values(geoR.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[07] constraints before autoGen:', consBefore.length)
  filewrite(consBefore.map(c => ({ id: c.id, class: c.class, name: c.name })), 'constraints-before')

  // AutoGen on line
  const r1 = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: l1 })
  console.log('[07] autoGen line: result=', r1.result, 'maxLevel:', r1.maxLevel)
  const consAfterL1 = Object.values(r1.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[07] constraints after autoGen line:', consAfterL1.length)

  // AutoGen on circle
  const r2 = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: c1 })
  console.log('[07] autoGen circle: result=', r2.result, 'maxLevel:', r2.maxLevel)
  const consAfterC1 = Object.values(r2.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[07] constraints after autoGen circle:', consAfterC1.length)

  const newCons = consAfterC1.filter(c => !consBefore.find(b => b.id === c.id))
  console.log('[07] new constraints:', newCons.length)
  filewrite(newCons.map(c => ({ id: c.id, class: c.class, name: c.name })), 'new-constraints')
  filewrite(consAfterC1.map(c => ({ id: c.id, class: c.class, name: c.name })), 'constraints-final')

  await snapshot('tangency-setup')
  return { partId }
}
