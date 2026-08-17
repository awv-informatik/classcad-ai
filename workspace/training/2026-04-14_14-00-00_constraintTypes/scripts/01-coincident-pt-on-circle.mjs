// Test COINCIDENT with point-on-circle and point-on-arc
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'CoincPtCircle' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Circle at (50, 30), radius 20
  const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [50, 30, 0], radius: 20 })).result
  console.log('[01] circleId:', circId)

  // Free point far from circle
  const ptId = (await api.v1.sketch.point({ id: skId, pos: [10, 60, 0] })).result
  console.log('[01] pointId:', ptId)

  // Fix the circle so only the point moves
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [circId] })

  // Get positions before
  const ptBefore = (await api.v1.sketch.getPositions({ id: ptId })).result
  console.log('[01] point before:', JSON.stringify(ptBefore))

  await snapshot('before')

  // COINCIDENT point on circle
  const r = await api.v1.sketch.constraint({ id: skId, type: 'COINCIDENT', geomIds: [ptId, circId] })
  console.log('[01] COINCIDENT result:', r.result, 'maxLevel:', r.maxLevel)

  // Get positions after
  const ptAfter = (await api.v1.sketch.getPositions({ id: ptId })).result
  console.log('[01] point after:', JSON.stringify(ptAfter))

  // Check: distance from point to circle center should = radius
  const dx = ptAfter.position[0] - 50
  const dy = ptAfter.position[1] - 30
  const dist = Math.sqrt(dx * dx + dy * dy)
  console.log('[01] dist from center:', dist, 'radius:', 20, 'on circle:', Math.abs(dist - 20) < 0.1)

  await snapshot('after')

  filewrite({
    ptBefore: ptBefore.position,
    ptAfter: ptAfter.position,
    distFromCenter: dist,
    radius: 20,
    onCircle: Math.abs(dist - 20) < 0.1,
    constraintResult: r.result,
    maxLevel: r.maxLevel
  }, 'coincident-pt-circle')

  return { partId }
}
