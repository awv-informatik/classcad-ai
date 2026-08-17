// Test COINCIDENT with point-on-arc (using arcByCenter)
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'CoincPtArc' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Arc by center: center (40,20), from (65,20) counter-clockwise to (40,45) — quarter circle, r=25
  const arcId = (await api.v1.sketch.arcByCenter({
    id: skId, centerPos: [40, 20, 0], startPos: [65, 20, 0], endPos: [40, 45, 0]
  })).result
  console.log('[02] arcId:', arcId)

  // Free point far from arc
  const ptId = (await api.v1.sketch.point({ id: skId, pos: [10, 60, 0] })).result
  console.log('[02] pointId:', ptId)

  // Fix the arc
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [arcId] })

  const ptBefore = (await api.v1.sketch.getPositions({ id: ptId })).result
  console.log('[02] point before:', JSON.stringify(ptBefore.pos))

  await snapshot('before')

  // COINCIDENT point on arc
  const r = await api.v1.sketch.constraint({ id: skId, type: 'COINCIDENT', geomIds: [ptId, arcId] })
  console.log('[02] COINCIDENT result:', r.result, 'maxLevel:', r.maxLevel)

  const ptAfter = (await api.v1.sketch.getPositions({ id: ptId })).result
  console.log('[02] point after:', JSON.stringify(ptAfter.pos))

  const dx = ptAfter.pos.x - 40
  const dy = ptAfter.pos.y - 20
  const dist = Math.sqrt(dx * dx + dy * dy)
  console.log('[02] dist from center:', dist, 'radius:', 25, 'on arc:', Math.abs(dist - 25) < 0.1)

  await snapshot('after')

  filewrite({
    ptBefore: [ptBefore.pos.x, ptBefore.pos.y],
    ptAfter: [ptAfter.pos.x, ptAfter.pos.y],
    distFromCenter: dist,
    radius: 25,
    onArc: Math.abs(dist - 25) < 0.1,
    constraintResult: r.result,
    maxLevel: r.maxLevel
  }, 'coincident-pt-arc')

  return { partId }
}
