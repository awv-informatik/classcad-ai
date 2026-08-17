// Test: genTangency flag — create circle first, line tangent to it second
// Does autoGen detect tangency when called on the circle?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'TanFlag' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Circle first, then tangent line
  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 30, 0], radius: 30 })).result
  console.log('[18] circle:', c1)

  // Line at y=0 (tangent to circle at (0,0))
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result
  console.log('[18] line:', l1)

  const consBefore = Object.values((await api.v1.sketch.getGeometry({ id: skId })).structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[18] constraints before autoGen:', consBefore.length)
  filewrite(consBefore.map(c => ({ id: c.id, class: c.class, name: c.name })), 'constraints-before')

  // AutoGen on circle (genTangency=true by default)
  const r1 = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: c1 })
  const cons1 = Object.values(r1.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[18] autoGen circle default:', r1.maxLevel, 'cons=', cons1.length)

  // AutoGen on line
  const r2 = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: l1 })
  const cons2 = Object.values(r2.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[18] autoGen line default:', r2.maxLevel, 'cons=', cons2.length)

  // Try genTangency=true explicitly on both
  const r3 = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: c1, genTangency: true })
  const cons3 = Object.values(r3.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[18] autoGen circle genTangency=true:', r3.maxLevel, 'cons=', cons3.length)

  // Also try with arc tangent to a line
  const a1 = (await api.v1.sketch.arcByCenter({
    id: skId, centerPos: [0, -30, 0], startPos: [30, -30, 0], endPos: [-30, -30, 0]
  })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result

  // Hmm, a second line at y=0 would overlap. Let me use a different y.
  // Actually the arc center is at (0,-30) radius 30, so it touches y=0.
  // The line l1 is already at y=0. Let's check if autoGen detects the tangency.
  const r4 = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: a1 })
  const cons4 = Object.values(r4.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[18] autoGen arc:', r4.maxLevel, 'cons=', cons4.length)

  const newCons = cons4.filter(c => !consBefore.find(b => b.id === c.id))
  console.log('[18] total new constraints:', newCons.length)
  filewrite(newCons.map(c => ({ id: c.id, class: c.class, name: c.name })), 'new-constraints')
  filewrite(cons4.map(c => ({ id: c.id, class: c.class, name: c.name })), 'constraints-final')

  await snapshot('tangency-test')
  return { partId }
}
