// Q4: do HORIZONTAL_DISTANCE / VERTICAL_DISTANCE dims between two circle centers
// MOVE the unfixed circle to the exact offset? (The drawing-layout primitive.)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Dist' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'S' })).result

  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [40, 40, 0], radius: 10 })).result
  const c2 = (await api.v1.sketch.circle({ id: skId, centerPos: [90, 55, 0], radius: 10 })).result
  const p1 = (await api.v1.sketch.getPoints({ id: c1 })).result.centerId
  const p2 = (await api.v1.sketch.getPoints({ id: c2 })).result.centerId

  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [p1] })
  const hR = await api.v1.sketch.dimension({ id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [p1, p2], value: 38 })
  const vR = await api.v1.sketch.dimension({ id: skId, type: 'VERTICAL_DISTANCE', geomIds: [p1, p2], value: 0 })
  const c2pos = (await api.v1.sketch.getPositions({ id: p2 })).result.pos
  console.log('[04] HD=38 maxLevel:', hR.maxLevel, 'VD=0 maxLevel:', vR.maxLevel)
  console.log('[04] c2 center:', JSON.stringify(c2pos), '(target (78,40) — moved from (90,55))')

  filewrite({ c2pos }, 'dist')
  return { c2pos }
}
