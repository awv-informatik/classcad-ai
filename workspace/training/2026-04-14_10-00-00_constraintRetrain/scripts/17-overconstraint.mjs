// Test: over-constraining — HORIZONTAL + VERTICAL on same line, conflict detection
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'OverTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Diagonal line
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 30, 0] })).result

  // HORIZONTAL — should make it horizontal
  const cr1 = await api.v1.sketch.constraint({ id: skId, type: 'HORIZONTAL', geomIds: [lineId] })
  console.log('[17] HORIZONTAL result:', cr1.result, 'maxLevel:', cr1.maxLevel)

  const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
  const posAfterH = {
    start: (await api.v1.sketch.getPositions({ id: pts.startId })).result,
    end: (await api.v1.sketch.getPositions({ id: pts.endId })).result,
  }
  console.log('[17] after HORIZONTAL:', JSON.stringify(posAfterH))

  // Now add VERTICAL — conflicting with HORIZONTAL
  const cr2 = await api.v1.sketch.constraint({ id: skId, type: 'VERTICAL', geomIds: [lineId] })
  console.log('[17] VERTICAL result:', cr2.result, 'maxLevel:', cr2.maxLevel)
  if (cr2.messages?.length) console.log('[17] VERTICAL messages:', JSON.stringify(cr2.messages))

  const posAfterV = {
    start: (await api.v1.sketch.getPositions({ id: pts.startId })).result,
    end: (await api.v1.sketch.getPositions({ id: pts.endId })).result,
  }
  console.log('[17] after VERTICAL:', JSON.stringify(posAfterV))

  // Duplicate HORIZONTAL
  const cr3 = await api.v1.sketch.constraint({ id: skId, type: 'HORIZONTAL', geomIds: [lineId] })
  console.log('[17] duplicate HORIZONTAL result:', cr3.result, 'maxLevel:', cr3.maxLevel)
  if (cr3.messages?.length) console.log('[17] duplicate messages:', JSON.stringify(cr3.messages))

  await snapshot('result')

  filewrite({
    horizResult: { result: cr1.result, maxLevel: cr1.maxLevel },
    vertResult: { result: cr2.result, maxLevel: cr2.maxLevel, messages: cr2.messages },
    dupHorizResult: { result: cr3.result, maxLevel: cr3.maxLevel, messages: cr3.messages },
    posAfterHoriz: posAfterH,
    posAfterVert: posAfterV,
  }, 'overconstraint-data')

  return { partId }
}
