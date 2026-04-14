// Test: pass a point ID as geomId (docs say sketch-point is accepted)
// Also test: what are the valid ID types?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'PointTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Create a standalone point
  const ptR = await api.v1.sketch.point({ id: skId, pos: [0, 0, 0] })
  const ptId = ptR.result
  console.log('[05] point created:', ptId, 'maxLevel:', ptR.maxLevel)

  // Check constraints from point creation
  const consBefore = Object.values(ptR.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[05] constraints after point creation:', consBefore.length)
  filewrite(consBefore.map(c => ({ id: c.id, class: c.class, name: c.name })), 'constraints-before')

  // Call autoGen on the point
  const r = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: ptId })
  console.log('[05] autoGen point result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[05] messages:', JSON.stringify(r.messages))

  const consAfter = Object.values(r.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[05] constraints after autoGen:', consAfter.length)

  // Also try: create a line endpoint near the point, then autoGen
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [30, 0, 0], endPos: [60, 30, 0] })).result
  const pts = (await api.v1.sketch.getPoints({ id: l1 })).result
  console.log('[05] line points:', JSON.stringify(pts))

  // Try autoGen with a line endpoint as geomId
  const r2 = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: pts.startId })
  console.log('[05] autoGen startPt result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[05] messages:', JSON.stringify(r2.messages))

  const consFinal = Object.values(r2.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[05] constraints final:', consFinal.length)

  return { partId }
}
