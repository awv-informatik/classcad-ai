// Test constraint chaining: A constrains B, B constrains C
// Does the solver propagate through the chain?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'Chaining' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Three lines forming a chain: l1 → l2 → l3
  // l1 fixed horizontal
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0] })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [l1] })

  // l2 diagonal, not connected to l1
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [50, 10, 0], endPos: [90, 30, 0] })).result

  // l3 diagonal, not connected to l2
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [20, 40, 0], endPos: [60, 55, 0] })).result

  console.log('[07] l1:', l1, 'l2:', l2, 'l3:', l3)

  await snapshot('before')

  // Chain: l2 PARALLEL to l1, l3 PARALLEL to l2
  // This should propagate: l1 horizontal → l2 horizontal → l3 horizontal
  const r1 = await api.v1.sketch.constraint({ id: skId, type: 'PARALLEL', geomIds: [l1, l2] })
  console.log('[07] PARALLEL l1-l2:', r1.result, 'maxLevel:', r1.maxLevel)

  const r2 = await api.v1.sketch.constraint({ id: skId, type: 'PARALLEL', geomIds: [l2, l3] })
  console.log('[07] PARALLEL l2-l3:', r2.result, 'maxLevel:', r2.maxLevel)

  // Check all positions
  const l2pts = (await api.v1.sketch.getPoints({ id: l2 })).result
  const l3pts = (await api.v1.sketch.getPoints({ id: l3 })).result
  const l2s = (await api.v1.sketch.getPositions({ id: l2pts.startId })).result.pos
  const l2e = (await api.v1.sketch.getPositions({ id: l2pts.endId })).result.pos
  const l3s = (await api.v1.sketch.getPositions({ id: l3pts.startId })).result.pos
  const l3e = (await api.v1.sketch.getPositions({ id: l3pts.endId })).result.pos

  const l2horizontal = Math.abs(l2s.y - l2e.y) < 0.1
  const l3horizontal = Math.abs(l3s.y - l3e.y) < 0.1

  console.log('[07] l2:', l2s.x, l2s.y, '->', l2e.x, l2e.y, 'horizontal:', l2horizontal)
  console.log('[07] l3:', l3s.x, l3s.y, '->', l3e.x, l3e.y, 'horizontal:', l3horizontal)

  await snapshot('after')

  filewrite({
    l2: { start: [l2s.x, l2s.y], end: [l2e.x, l2e.y], horizontal: l2horizontal },
    l3: { start: [l3s.x, l3s.y], end: [l3e.x, l3e.y], horizontal: l3horizontal },
    chainPropagated: l2horizontal && l3horizontal
  }, 'chaining')

  return { partId }
}
