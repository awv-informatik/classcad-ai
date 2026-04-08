// 01 — basic circle creation, getPoints, getPositions, structure inspection
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CircleTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a circle
  const r = await api.v1.sketch.circle({ id: skId, centerPos: [30, 20, 0], radius: 15 })
  const circleId = r.result
  console.log('[01] circleId:', circleId, 'maxLevel:', r.maxLevel)

  // getPoints — should return { centerId }
  const pts = await api.v1.sketch.getPoints({ id: circleId })
  console.log('[01] getPoints:', JSON.stringify(pts.result))

  // getPositions on circle directly
  const pos = await api.v1.sketch.getPositions({ id: circleId })
  console.log('[01] getPositions(circle):', JSON.stringify(pos.result), 'maxLevel:', pos.maxLevel)

  // getPositions on the center point
  if (pts.result?.centerId) {
    const centerPos = await api.v1.sketch.getPositions({ id: pts.result.centerId })
    console.log('[01] getPositions(centerId):', JSON.stringify(centerPos.result))
  }

  // getGeometry — verify circle appears in circles array
  const geo = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[01] getGeometry:', JSON.stringify(geo.result))

  // Structure — dump to file for analysis
  filewrite(r.structure, 'structure')

  await snapshot('basic-circle')
  return { partId, circleId }
}
