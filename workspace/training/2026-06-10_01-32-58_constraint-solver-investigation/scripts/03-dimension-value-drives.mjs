// Q3: with planeId, does `dimension` with `value` at CREATION resize geometry?
// (SKETCHING.md claims this param is "broken".)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DimDrive' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'S' })).result

  // circle r=20 -> DIAMETER 45 should make r=22.5
  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [40, 40, 0], radius: 20 })).result
  const cPts = (await api.v1.sketch.getPoints({ id: c1 })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [cPts.centerId] })
  const dR = await api.v1.sketch.dimension({ id: skId, type: 'DIAMETER', geomIds: [c1], value: 45 })
  const cNode = Object.values(dR.structure?.tree ?? {}).find(n => n?.id === c1)
  console.log('[03] DIAMETER 45 on r=20: maxLevel', dR.maxLevel, '— members:', JSON.stringify(cNode?.members ?? null))

  // line (0,0)->(80,0), fix start, OFFSET 100 -> end should land at (100,0)
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  const lPts = (await api.v1.sketch.getPoints({ id: l1 })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [lPts.startId] })
  const oR = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [l1], value: 100 })
  const l1after = (await api.v1.sketch.getPositions({ id: l1 })).result
  console.log('[03] OFFSET 100 on len-80 line: maxLevel', oR.maxLevel, '— end:', JSON.stringify(l1after.endPos), '(target 100,0)')

  // formula value
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 20, 0], endPos: [30, 20, 0] })).result
  const fR = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [l2], value: '60+10' })
  const l2after = (await api.v1.sketch.getPositions({ id: l2 })).result
  const len2 = Math.hypot(l2after.endPos.x - l2after.startPos.x, l2after.endPos.y - l2after.startPos.y)
  console.log('[03] OFFSET "60+10" on len-30 line: maxLevel', fR.maxLevel, '— len:', len2.toFixed(4), '(target 70)')

  filewrite({ circleMembers: cNode?.members, l1after, len2 }, 'dimdrive')
  return {}
}
