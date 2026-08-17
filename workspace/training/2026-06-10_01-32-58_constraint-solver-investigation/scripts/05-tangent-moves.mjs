// Q5: does TANGENT physically move geometry to tangency? (circle-line and circle-circle)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Tan' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'S' })).result

  // circle-line: line on X axis (fixed), circle floating at (50,50) r=15 → center should land at y=15
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [100, 0, 0] })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [l1] })
  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [50, 50, 0], radius: 15 })).result
  const t1 = await api.v1.sketch.constraint({ id: skId, type: 'TANGENT', geomIds: [c1, l1] })
  const c1pos = (await api.v1.sketch.getPositions({ id: (await api.v1.sketch.getPoints({ id: c1 })).result.centerId })).result.pos
  console.log('[05] TANGENT circle-line maxLevel:', t1.maxLevel, 'c1 center:', JSON.stringify(c1pos), '(tangency ⇒ y=15)')

  // circle-circle: c2 fixed at (200,40) r=20; c3 at (260,80) r=10 → center distance should become 30
  const c2 = (await api.v1.sketch.circle({ id: skId, centerPos: [200, 40, 0], radius: 20 })).result
  const c2c = (await api.v1.sketch.getPoints({ id: c2 })).result.centerId
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [c2c] })
  const c3 = (await api.v1.sketch.circle({ id: skId, centerPos: [260, 80, 0], radius: 10 })).result
  const t2 = await api.v1.sketch.constraint({ id: skId, type: 'TANGENT', geomIds: [c3, c2] })
  const c3pos = (await api.v1.sketch.getPositions({ id: (await api.v1.sketch.getPoints({ id: c3 })).result.centerId })).result.pos
  const d = Math.hypot(c3pos.x - 200, c3pos.y - 40)
  console.log('[05] TANGENT circle-circle maxLevel:', t2.maxLevel, 'c3 center:', JSON.stringify(c3pos), 'center-dist:', d.toFixed(6), '(external tangency ⇒ 30)')

  filewrite({ c1pos, c3pos, centerDist: d }, 'tangent')
  return {}
}
