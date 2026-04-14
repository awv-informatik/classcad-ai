// Test: genIncidence flag controls coincidence detection
// Create a point on a line, then call autoGen with genIncidence=false
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'GenIncTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Create line first, then a point on it
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  const pt = (await api.v1.sketch.point({ id: skId, pos: [25, 0, 0] })).result

  const geoR = await api.v1.sketch.getGeometry({ id: skId })
  const consBefore = Object.values(geoR.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[14] constraints before:', consBefore.length)
  filewrite(consBefore.map(c => ({ id: c.id, class: c.class, name: c.name })), 'constraints-before')

  // AutoGen with genIncidence=true (default)
  const r1 = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: pt, genIncidence: true })
  const consAfter1 = Object.values(r1.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[14] genIncidence=true: maxLevel=', r1.maxLevel, 'cons=', consAfter1.length)

  // Check if point creation order matters: create point ON the line and see if line auto-detects
  // Start fresh: create a new sketch
  const skId2 = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result
  const l2 = (await api.v1.sketch.line({ id: skId2, startPos: [0, 10, 0], endPos: [50, 10, 0] })).result
  const pt2 = (await api.v1.sketch.point({ id: skId2, pos: [25, 10, 0] })).result

  const geoR2 = await api.v1.sketch.getGeometry({ id: skId2 })
  const consSk2 = Object.values(geoR2.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[14] sketch2 constraints after creation:', consSk2.length)
  filewrite(consSk2.map(c => ({ id: c.id, class: c.class, name: c.name })), 'sketch2-constraints')

  // AutoGen with genIncidence=false on point
  const r2 = await api.v1.sketch.generateAutoConstraints({ id: skId2, geomId: pt2, genIncidence: false })
  const consAfter2 = Object.values(r2.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[14] genIncidence=false: maxLevel=', r2.maxLevel, 'cons=', consAfter2.length)

  // AutoGen with genIncidence=true on same point (should now detect it)
  const r3 = await api.v1.sketch.generateAutoConstraints({ id: skId2, geomId: pt2, genIncidence: true })
  const consAfter3 = Object.values(r3.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[14] genIncidence=true (retry): maxLevel=', r3.maxLevel, 'cons=', consAfter3.length)

  const newCons = consAfter3.filter(c => !consSk2.find(b => b.id === c.id))
  console.log('[14] new from genIncidence=true:', newCons.length)
  filewrite(newCons.map(c => ({ id: c.id, class: c.class, name: c.name })), 'new-from-genIncidence')

  return { partId }
}
