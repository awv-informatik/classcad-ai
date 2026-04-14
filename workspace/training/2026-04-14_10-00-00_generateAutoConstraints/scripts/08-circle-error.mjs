// Test: investigate the error when calling autoGen on a circle
// Also test arc and other geometry types
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'CircleErr' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Circle
  const c1 = (await api.v1.sketch.circle({ id: skId, center: [0, 0, 0], radius: 30 })).result
  const rc = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: c1 })
  console.log('[08] circle autoGen maxLevel:', rc.maxLevel)
  console.log('[08] circle autoGen messages:', JSON.stringify(rc.messages))

  // Arc
  const a1 = (await api.v1.sketch.arcByCenter({
    id: skId, center: [60, 0, 0], startPos: [90, 0, 0], endPos: [60, 30, 0]
  })).result
  const ra = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: a1 })
  console.log('[08] arc autoGen maxLevel:', ra.maxLevel)
  console.log('[08] arc autoGen messages:', JSON.stringify(ra.messages))

  // Line (should work)
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [-50, -30, 0], endPos: [0, -30, 0] })).result
  const rl = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: l1 })
  console.log('[08] line autoGen maxLevel:', rl.maxLevel)
  console.log('[08] line autoGen messages:', JSON.stringify(rl.messages))

  // Point (standalone)
  const p1 = (await api.v1.sketch.point({ id: skId, pos: [-40, 20, 0] })).result
  const rp = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: p1 })
  console.log('[08] point autoGen maxLevel:', rp.maxLevel)
  console.log('[08] point autoGen messages:', JSON.stringify(rp.messages))

  return { partId }
}
