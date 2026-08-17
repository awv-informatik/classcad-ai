// 13 — Investigate return value: when does it return false (unsolved)?
// Over-constrain geometry, then move it — does it return false?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a line fixed in place with fixation constraints
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [10, 10, 0], endPos: [50, 10, 0] })).result
  console.log('[13] lineId:', lineId)

  // Add fixation (genFixation was probably auto-added, but let's add explicit constraints)
  const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
  console.log('[13] points:', JSON.stringify(pts))

  // Add horizontal + vertical constraints to lock both endpoints
  const c1 = await api.v1.sketch.constraint({ id: skId, type: 'FIX', geomId1: pts.startId })
  console.log('[13] fix start:', c1.result, 'maxLevel:', c1.maxLevel)
  const c2 = await api.v1.sketch.constraint({ id: skId, type: 'FIX', geomId1: pts.endId })
  console.log('[13] fix end:', c2.result, 'maxLevel:', c2.maxLevel)

  await snapshot('before-fixed')

  // Now try to move the fixed line
  const r = await api.v1.sketch.moveGeometry({ id: skId, geomIds: [lineId], translation: [20, 20, 0] })
  console.log('[13] moveGeometry result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[13] messages:', JSON.stringify(r.messages))

  const after = (await api.v1.sketch.getPositions({ id: lineId })).result
  console.log('[13] line after:', JSON.stringify(after))

  filewrite({
    moveResult: r.result,
    maxLevel: r.maxLevel,
    messages: r.messages,
    lineAfter: after,
  }, 'fixed-line-move')

  await snapshot('after-fixed')

  return { partId }
}
