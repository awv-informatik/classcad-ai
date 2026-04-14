// Test: properly create circle and arc, then call autoGen on them
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'CircArcAG' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Horizontal line
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result

  // Circle tangent to line (center at (0,30), radius 30 => touches y=0)
  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 30, 0], radius: 30 })).result
  console.log('[11] circle created:', c1)

  // Arc
  const a1 = (await api.v1.sketch.arcByCenter({
    id: skId, centerPos: [60, 30, 0], startPos: [80, 30, 0], endPos: [60, 50, 0]
  })).result
  console.log('[11] arc created:', a1)

  // Check constraints
  const geoR = await api.v1.sketch.getGeometry({ id: skId })
  const consBefore = Object.values(geoR.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[11] constraints before autoGen:', consBefore.length)
  filewrite(consBefore.map(c => ({ id: c.id, class: c.class, name: c.name })), 'constraints-before')

  // AutoGen on circle
  const rc = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: c1 })
  console.log('[11] autoGen circle:', rc.result, 'maxLevel:', rc.maxLevel, 'msgs:', JSON.stringify(rc.messages))
  const consAfterCirc = Object.values(rc.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[11] constraints after circle autoGen:', consAfterCirc.length)

  // AutoGen on arc
  const ra = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: a1 })
  console.log('[11] autoGen arc:', ra.result, 'maxLevel:', ra.maxLevel, 'msgs:', JSON.stringify(ra.messages))
  const consAfterArc = Object.values(ra.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[11] constraints after arc autoGen:', consAfterArc.length)

  // New constraints
  const newCons = consAfterArc.filter(c => !consBefore.find(b => b.id === c.id))
  console.log('[11] new constraints:', newCons.length)
  filewrite(newCons.map(c => ({ id: c.id, class: c.class, name: c.name })), 'new-constraints')

  await snapshot('circle-arc-autogen')
  return { partId }
}
